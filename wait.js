//   - wait.gs
//       contains functions to check from and modify the waiting list. Also has a function to do an "aggregate check" to see if there's
//       enough of a certain item to make a checkout.
//        - allReserved : checks if all units of a certain type are reserved.

function checkAndRemoveFromWaitList_(package) {
  // Package has: empname, uid, cusname, cusanum, cusemail, cuspnum, date, notes, debug
  var waitPack = getSheetPackage_('waitlist');
  var waitRows = getRowsOfType_(waitPack, [[package[1], 3], [package[2], 5], [package[3], 4]]);
  waitRows = waitRows.concat(getRowsOfType_(waitPack, [[package[1].substr(0,3), 3], [package[2], 5], [package[3], 4]]));
  
  if(waitRows.length != 0) {
    waitPack[2].deleteRow(waitRows[0] + 2);
  }
}

function allReserved_(invPack, UID, UIDCatFlag) {
  // Check if unit is reserved. If it is, Unit is reserved and return.
  var waitPack = getSheetPackage_('waitlist');
  var retbool = false;
  
  var cats = getAllCategories_(invPack);
  var numInInv = -1;
  for(i = 0; i < cats.length; i++) {
    if(UIDCatFlag && cats[i][0] == UID) {
      numInInv = cats[i][2];
      break;
    } else if(!UIDCatFlag && cats[i][0] == UID.substr(0,3)) {
      numInInv = cats[i][2];
      break;
    }
  }
  
  if(numInInv == -1) {
    throw "allReserved recieved invalid UID category.";
  }
  
  var numInWait = getCountOfType_(waitPack, [[(UIDCatFlag ? UID : UID.substr(0,3)), 3]]);
  
  if(!UIDCatFlag) {
    var specificReservation = getRowsOfType_(waitPack, [[UID, 3]]);
    if(specificReservation.length != 0) {
      retbool = true;
    }
  }
  
  if(numInWait >= numInInv) {
    retbool = true;
  }
  
  return retbool;
}

function waitListAppOnLoad() {
  // pull list of categories from inventory sheet
  var inventory = getAllSheetsPackage_('vault_inventory');
  var cats = getAllCategories_(inventory);
  
  return cats;
}

function waitListAppOnSubmit(package) {
  // Package has: empname, uid, uidcatflag, cusname, cusanum, cusemail, debug, uidName
  
  // Log Record of Waiting List Add
  logPackageToFile("waitadd", [package[0], package[1], package[3], package[4], package[5]]);
  
  // Grab Waiting List
  var waitList = getSheetPackage_('waitlist');
  
  // Add package info to list
  var lastRow = waitList[2].getLastRow() + 1;
  var newRow = 
  [[new Date(), lastRow, 1], // timestamp
   ['', lastRow, 2],
   ['', lastRow, 3],
   [package[1], lastRow, 4], // UID
   [package[4], lastRow, 5], // cusanum
   [package[3], lastRow, 6], // cusname
   [package[5], lastRow, 7]] // cusemail
  
  replaceValues_(waitList[2], newRow);
  
  // Send Email
  if(!package[6]) {
    sendWaitEmail_((package[2]?package[7]:package[1]), package[2], package[3], package[5]);
  }
}

function waitListReqOnLoad() {
  // pull list of categories from invetory sheet
  var inventory = getAllSheetsPackage_('vault_inventory');
  var cats = getAllCategories_(inventory);
  
  // Pull list of choices from form object
  var form = getActiveForm_('student_waiting_add');
  var dropdown = form.getItems()[1].asListItem();
  var choices = dropdown.getChoices();
  var currentCats = [];
  for(var i = 0; i < choices.length; i++) {
    temp = choices[i].getValue();
    if(temp != "DEFAULT") {
      currentCats.push(choices[i].getValue());
    }
  }
  
  // make new list of categories which are not on form object
  var newList = [];
  for(var i = 0; i < cats.length; i++) {
    already = false;
    for(var j = 0; j < currentCats.length; j++) {
      already = already || (currentCats[j] == cats[i][1]);
    }
    if(!already) {
      newList.push(cats[i][1]);
    }
  }
  
  // if the list has things in it, add options to the form object
  var options;
  if(currentCats.length == 0) {
    options = [];
  } else {
    options = choices;
  }
  
  for(var i = 0; i < newList.length; i++) {
    options.push(dropdown.createChoice(newList[i]));
  }
  
  dropdown.setChoices(options);
}

function getAllCategories_(invPack) {
  var invPack = getAllSheetsPackage_('vault_inventory');
  var retArray = [];
  
  for(var i = 0; i < invPack[3][1][0][6]; i++) {
    if(invPack[3][1][i + 1][6] == "DEB") {
      continue;
    }
    retArray.push([invPack[3][1][i + 1][7], invPack[3][1][i + 1][8], invPack[3][1][i + 1][12]]);
  }
  
  return retArray;
}

function getNextOnList(UID) {
  var retArray = ["", ""]; // Name, Anum
  var waitPack = getSheetPackage_('waitlist');
  
  for(i = 0; i < waitPack[3].length; i++) {
    var rowUID = waitPack[3][i][3];
    if((rowUID.length == 6 && rowUID == UID) || 
       (rowUID.length == 3 && rowUID == UID.substr(0,3))) {
      retArray[0] = waitPack[3][i][5];
      retArray[1] = waitPack[3][i][4];
      break;
    }
  }
  
  return retArray;
}