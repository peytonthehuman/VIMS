// verify.gs
// This file includes a number of functions to verify information before the front-end GUI's are allowed to proceed.

// This function is called by the checkout and wait forms, and is used to determine if a student is allowed to check anything out.
// Package 2 returns the number of active checkouts a particular person has
// Package 3 returns the number of active checkouts which are past their due date
// Package 4 returns whether or not a person has a hold on any particular item
// Package 5 returns, if the student is on the do not checkout list, what the reason they're on the list is.
function checkRecord(package) {
  var archivePack = getSheetPackage_('transaction_archive');
  package[2] = getActiveOut_(archivePack, package[0], package[1]);
  package[3] = getLateOut_(archivePack, package[0], package[1]);
  package[4] = getHold_(archivePack, package[0], package[1]);
  package[5] = getDNC_(package[0], package[1]);
  return package;
}

// This function uses an input UID value to find the checkout currently connected to it in the vault inventory sheet
// The function will always return an array of 4 items, however if the item has no associated checkout then each value will be empty strings
function searchRecordUID(package) {
  var invPack = getSheetPackage_('vault_inventory');
  var uidStat = validateUID(package[0], false);
  if(uidStat == 1) {
    package[0] = "INVALID";
  } else if(uidStat == 2) {
    var rows = getRowsOfType_(invPack, [[package[0], 1]]);
    if(rows.length != 1) {
      throw "Error in getting correct row for searchRecord";
    } else {
      package[1] = true;
      package[2] = invPack[3][rows[0]][12];
      package[3] = invPack[3][rows[0]][13];
      package[4] = getStringDate(invPack[3][rows[0]][17]);
    }
  }
  return package;
}

function searchRecordAnum(package) {
  var invPack = getSheetPackage_('vault_inventory');
  var retPackage = [];
  
  var rows = getRowsOfType_(invPack, [[package[0], 13]]);
  
  for(i = 0; i < rows.length; i++) {
    retPackage.push([invPack[3][rows[i]][1], invPack[3][rows[i]][18], getStringDate(invPack[3][rows[i]][17])]);
  }
  
  return retPackage;
}

function getActiveOut_(sheetPack, name, anum) {
  if(sheetPack[0].length == 0) {
    return 0;
  }
  var rowlist = findRowsWithValue_(sheetPack[2], anum, 5);
  if(rowlist[0] == (sheetPack[2].getLastRow() + 1)) {
    return 0;
  }
  var amount = 0;
  var i;
  for(i = 0; i < rowlist.length; i++) {
    if(!sheetPack[3][rowlist[i] - 2][9]) {
      amount++;
    }
  }
  return amount;
}

function getLateOut_(sheetPack, name, anum) {
  if(sheetPack[0].length == 0) {
    return 0;
  }
  var rowlist = findRowsWithValue_(sheetPack[2], anum, 5);
  if(rowlist[0] == (sheetPack[2].getLastRow() + 1)) {
    return 0;
  }
  var amount = 0;
  var i;
  for(i = 0; i < rowlist.length; i++) {
    if(!sheetPack[3][rowlist[i] - 2][9]
       && sheetPack[3][rowlist[i] - 2][8] < new Date()) {
      amount++;
    }
  }
  return amount;
}

function getHold_(sheetPack, name, anum) {
  if(sheetPack[0].length == 0) {
    return 0;
  }
  var rowlist = findRowsWithValue_(sheetPack[2], anum, 5);
  if(rowlist[0] == (sheetPack[2].getLastRow() + 1)) {
    return 0;
  }
  var held = false;
  var i;
  for(i = 0; i < rowlist.length; i++) {
    if(sheetPack[3][rowlist[i] - 2][18]) {
      held = true;
      break;
    }
  }
  return held;
}

function checkUIDExists(UID, invPack) {
  var unitRow = -1;
  
  // Go through and check if UID exists. If it does, write the row and break.
  for(var i = 0; i < invPack[3][0].length; i++) {
    if(invPack[3][0][i][1] == UID) {
      unitRow = i;
      break;
    }
  }
  
  return unitRow;
}

function checkUIDCatExists(UID, invPack) {
  var cats = getAllCategories_(invPack);
  var exists = -1;
  
  for(i = 0; i < cats.length; i++) {
    if(cats[i][0] == UID) {
      exists = 0;
      break;
    }
  }
  
  return exists;
}

function validateUID(UID, UIDCatFlag) {
  var invPack = getAllSheetsPackage_('vault_inventory');
  var retFlag = 0;
  var unitRow = -1;
  
  if(UIDCatFlag == false) {
    unitRow = checkUIDExists(UID, invPack);
  } else {
    unitRow = checkUIDCatExists(UID, invPack);
  }
  
  // Check if unitRow is not -1. If it is, UID is invalid and return.
  if(unitRow == -1) {
    retFlag = 1;
    return retFlag;
  }
  
  // Check if unit is out according to inventory. If it is, Unit is out and return
  if(!UIDCatFlag && !invPack[3][0][unitRow][10]) {
    retFlag = 2;
    return retFlag;
  }
  
  // Check if unit is for student checkout. If it is not, Unit is NFSC and return.
  if(invPack[3][0][unitRow][6] == "No") {
    retFlag = 4;
    return retFlag;
  }
  
  //invPack = [invPack[0], invPack[1], invPack[2][0], invPack[3][0]];
  
  // Check if unit is reserved. If it is, Unit is reserved and return.
  if(allReserved_(invPack, UID, UIDCatFlag)) {
    retFlag = 3;
    return retFlag;
  }
  
  // Otherwise return 0 if there's no problems.
  return retFlag;
}

function validateAct(name, anum, uid) {
  var arcPack = getSheetPackage_('transaction_archive');
  var invPack = getAllSheetsPackage_('vault_inventory');
  var retFlag = 0;
  var rows = [];
  
  if(checkUIDExists(uid, invPack) == -1) {
    retFlag = 1;
    return retFlag;
  }
  
  for(var i = 0; i < arcPack[3].length; i++) {
    if(arcPack[3][i][0] == uid) {
      rows.push(i);
    }
  }
  
  if(rows.length == 0) {
    retFlag = 3;
    return retFlag;
  }
  
  var mismatch = true;
  for(i = 0; i < rows.length; i++) {
    if(arcPack[3][rows[i]][3] == name && arcPack[3][rows[i]][4] == anum) {
      mismatch = false;
      break;
    }
  }
  
  if(mismatch) {
    retFlag = 2;
    return retFlag
  }
  
  var allIn = true;
  for(i = 0; i < rows.length; i++) {
    if(arcPack[3][rows[i]][9] == "") {
      allIn = allIn && false;
    } else {
      allIn = allIn && true;
    }
  }
  
  if(allIn) {
    retFlag = 3;
    return retFlag;
  }
  
  return retFlag;
}

function getDNC_(name, anum) {
  var list = getSheetPackage_('do_not_checkout');
  for(var i = 0; i < list[3].length; i++) {
    if(list[3][i][0] == name && list[3][i][1] == anum) {
      return true;
    }
  }
  return false;
}

function whyNFSCUID(UID) {
  var invPack = getSheetPackage_('vault_inventory');
  var rows = getRowsOfType_(invPack, [[UID, 1]]);
  return invPack[3][rows[0]][7];
}