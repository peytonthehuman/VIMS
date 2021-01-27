// - massManipulatorGremlin.gs
//     Contains functions which operate on the entire inventory spreadsheets.

function triggeredSendLateEmails() {
  var package = [false];
  initSendLateEmails(package);
}

function initSendLateEmails(package) {
  /* package is just debug in this case */
  var arcPack = getSheetPackage_("transaction_archive");
  var toSendData = [];
  var now = new Date();
  var three = datedisplace(now, 3);
  
  for(var i = 0; i < arcPack[3].length; i++) {
    if(arcPack[3][i][17] !== "HELD") {
      if(arcPack[3][i][8] <= now && arcPack[3][i][9] == "") {
        if((arcPack[3][i][17] === 0 || three >= arcPack[3][i][17]) && arcPack[3][i][14]) {
          toSendData.push([arcPack[3][i][0], arcPack[3][i][4]]);
        }
      }
    }
  }
  
  if(toSendData.length > 0) {
    sendEmailList_(package[0], toSendData, emailLate_);
  }
}

function triggeredSendHoldEmails() {
  var package = [false];
  initSendHoldEmails(package);
}

function initSendHoldEmails(package) {
  /* package is just debug in this case */
  var arcPack = getSheetPackage_("transaction_archive");
  var toSendData = [];
  
  var test = arcPack[3][3][18];
  for(var i = 0; i < arcPack[3].length; i++) {
    if(arcPack[3][i][18] && arcPack[3][i][14] && arcPack[3][i][17] !== "HELD") {
      toSendData.push([arcPack[3][i][0], arcPack[3][i][4]]);
    }
  }
  
  sendEmailList_(package[0], toSendData, emailHold_);
}

function initInvAnalysis(package) {
  // Package is just debug, which simply stops program from sending emails. Not very useful. <-- haha that's funny
  package = [true];
  var debugLog = [];
  var debugNum = 0;
  
  // In the raw_input sheet
  var compArray = invAnalysis_RawPack_(package[0]);
  debugLog = debugLog.concat(compArray.pop());
  debugNum += compArray.pop();
  
  // In the transaction log
  compArray = invAnalysis_TransLog_(package[0], compArray)
  debugLog = debugLog.concat(compArray.pop());
  debugNum += compArray.pop();
  
  console.log(debugLog.toString().replace(/,/g,"\n"));
  
  // Filter to same array containing only objects with in_flag = false
  compArray = compArray.filter(function(row) { return !row[9]; });
  
  // In Vault Inventory
  compArray = invAnalysis_VaultInv_(package[0], compArray)
  debugLog = debugLog.concat(compArray.pop());
  debugNum += compArray.pop();
}

function checkObjArrayAgainst_(list, uid, name, anum) {
  var rows = getRowsOfType_(['', '', '', list], [[uid, 0],[name, 3],[anum, 4]]);
  return rows;
}

function checkObjArrayExactlyAgainst_(list, uid, name, anum, timeout, empname) {
  var rows = getRowsOfType_(['', '', '', list], [[uid, 0],[name, 3],[anum, 4],[timeout.toString(), 1],[empname, 2]]);
  return rows;
}

function getLocationFlagOut_(list, locations) {
  var retLoc = -1;
  for(var i = locations.length - 1; i >= 0; i--) {
    if(!list[locations[i]][9]) {
      retLoc = locations[i];
      break;
    }
  }
  return retLoc;
}

// The functions beyond this point are unfinished and should not be used

// Error codes (IC):
//  IC001 - checkout logged twice in raw sheet

function invAnalysis_RawPack_(debug) {
  var debugLog = [];
  var debugnum = 0;
  var rawSheetArray = getSheetPackage_('raw_input_stream')[3];
  
  // Create an array of transaction objects
  var objArray = [];
  // [UID, timeout, empname out, cus name, cus a num, cus p num, cus email, out notes, due date, in flag, time in, emp name in, broken flag, in notes, misc_flag
  
  // for each row in raw_input
  for(var i = 0; i < rawSheetArray.length; i++) {
    // if type==out
    if(rawSheetArray[i][5]=="Check Out") {
      // Check to see if there's any matches in object list
      if(checkObjArrayExactlyAgainst_(objArray, rawSheetArray[i][2], rawSheetArray[i][3], rawSheetArray[i][4], rawSheetArray[i][0], rawSheetArray[i][1]).length != 0) {
        // if there is, send error email.
        if(!debug) sendErrorReport_('IC001', 'checkout logged twice in raw sheet', "raw_input_stream row " + i);
        debugLog.push("IC001 : checkout logged twice in raw sheet : raw_input_stream row " + i);
        debugnum++;
      } else {
        // if there is not, create new transaction and fill with appropriate info.
        var newObj = [rawSheetArray[i][2], rawSheetArray[i][0], rawSheetArray[i][1], rawSheetArray[i][3], rawSheetArray[i][4], rawSheetArray[i][7], rawSheetArray[i][6], rawSheetArray[i][9], rawSheetArray[i][8], false, "", "", false, false, false];
        objArray.push(newObj);
      }
      // if type==reout
    } else if(rawSheetArray[i][5]=="Renew Out") {
      // Check to see if there's any matches in object list
      var location = checkObjArrayAgainst_(objArray, rawSheetArray[i][2], rawSheetArray[i][3], rawSheetArray[i][4]);
      if(location.length == 0) {
        // If not, report an error
        if(!debug) sendErrorReport_('IC002', 'renewal does not have matching checkout', "raw_input_stream row " + i);
        debugLog.push("IC002 : renewal does not have matching checkout : raw_input_stream row " + i);
        debugnum++;
      } else {
        var loc = getLocationFlagOut_(objArray, location);
        if(loc == -1) {
          if(!debug) sendErrorReport_('IC002', 'renewal does not have matching active checkout', "raw_input_stream row " + i);
          debugLog.push("IC002 : renewal does not have matching checkout : raw_input_stream row " + i);
          debugnum++;
        } else {
          // If there is, replace date
          objArray[loc][8] = rawSheetArray[i][8];
        }
      }
      // if type==in
    } else if(rawSheetArray[i][5] == "Check In") {
      // Check to see if there's any matches in object list
      var location = checkObjArrayAgainst_(objArray, rawSheetArray[i][2], rawSheetArray[i][3], rawSheetArray[i][4]);
      if(location.length == 0) {
        // If not found, throw error
        if(!debug) sendErrorReport_('IC003', 'return does not have matching checkout', "raw_input_stream row " + i);
        debugLog.push("IC003 : return does not have matching checkout : raw_input_stream row " + i);
        debugnum++;
      } else {
        var loc = getLocationFlagOut_(objArray, location);
        if(loc == -1) {
          if(!debug) sendErrorReport_('IC003', 'return does not have matching active checkout', "raw_input_stream row " + i);
          debugLog.push("IC003 : return does not have matching checkout : raw_input_stream row " + i);
          debugnum++;
        } else {
          // Set in flag in object
          objArray[loc][9] = true;
          
          // Fill in info
          objArray[loc][10] = rawSheetArray[i][0];
          objArray[loc][11] = rawSheetArray[i][1];
          objArray[loc][12] = false;
          objArray[loc][13] = rawSheetArray[i][9];
          objArray[loc][14] = false;
        }
      }
    } else if(rawSheetArray[i][5] == "Add to Wait") {
      continue;
    }
  } 
  
  // return completed array
  objArray.push(debugnum);
  objArray.push(debugLog);
  return objArray;
}

function invAnalysis_TransLog_(debug, objList) {
  var debugLog = [];
  var debugnum = 0;
  var actionArray = getSheetPackage_('transaction_archive')[3];
  
  // For all rows in transaction log
  for(i = 0; i < actionArray.length; i++) {
    // Check to see if there's any objects which match row information
    var index = checkObjArrayAgainst_(objList, actionArray[i][0], actionArray[i][3], actionArray[i][4]);
    //var index = objList.filter(function(row) { return row[0] == this[0] && dateCompare(row[1], this[1], 2500) && row[3] == this[3] && row[4] == this[4]; }, actionArray[i]);
    if(index.length != 1) {
      if(!debug) sendErrorReport_('IC004', 'cannot find checkout object in transaction archive', "transaction_archive row " + i);
      debugLog.push("IC004 : cannot find checkout object in transaction archive : transaction_archive row " + i);
      debugnum++;
    } else {
      // If there is, set object transaction_archive_found flag to true
      objList[index[index.length - 1]][14] = true;
    }
  }
  // Filter to new array containing only objects with trans_arc_found/vault_good flag = false
  var tempList = objList.filter(function(row) { return !row[14]; });
  
  // If new array length /= 0, throw error
  if(tempList.length != 0) {
    if(!debug) sendErrorReport_('IC005', 'not all checkout objects have corresponding archive rows', "number = " + tempList.length);
    debugLog.push("IC005 : not all checkout objects have corresponding archive rows : number = " + tempList.length);
    debugnum += tempList.length;
  }
  
  objList.push(debugnum);
  objList.push(debugLog);
  return objList;
}

function invAnalysis_VaultInv_(debug, objList) {
  var debugLog = [];
  var debugnum = 0;
  var vaultArray = getSheetPackage_('vault_inventory')[3];

  // For all objects
  for(var i = 0; i < objList.length; i++) {
    // Change trans_arc_found/vault_good flag to false
    objList[i][14] = false;
    // find corresponding UID in inventory
  }
  
  
  // If not found, throw error
  
  // compare object info with row info
  
  // If not match throw error
  
  // If all successful, flag trans_arc_found/vault_good flag to true
  
  // Filter to new array containing only objects with trans_arc_found/vault_good flag = false
  
  // If new array length /= 0, throw error
}

function initInvReinit(package) {

}