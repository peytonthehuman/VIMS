// - reout.gs
//     contains a function to recheckout a single item (and apply it to the inventory,
//     and add the entry to the master history log) and a function to process the whole recheckout list.
//     also contains the function to add a new entry to the recheckout log

function makeNewReout(package) {
  /* empname, uid, cusname, cusanum, modtype, dueDate, debug */
  // Grab archive package for manipulation
  var arcPack = getSheetPackage_("transaction_archive");
  
  // Grab inventory package for manipulation
  var invPack = getSheetPackage_("vault_inventory");
  
  var emailBack = false;
  
  // Make record of checkin in transaction log
  emailBack = modifyTransactionInArchive_(arcPack, package);
  
  // Make record of checkin in vault inventory
  modifyTransactionInInventory_(invPack, package);
  
  // Send in Email
  if(emailBack && !package[6]) {
    emailOut_(package[1], package[3]);
  }
}

function modifyTransactionInArchive_(arcPack, package) {
  var rows = getRowsOfType_(arcPack, [[package[1], 0], [package[3], 4]]);
  var row = -1
  for(var i = rows.length - 1; i >= 0; i--) {
    if(arcPack[3][rows[i]][11] == "No" || arcPack[3][rows[i]][11] == "Yes") {
      continue;
    }
    row = rows[i];
    break;
  }
  
  if(row == -1) {
    var err = "Error! Modify Transaction In Archive cannot find suitable row.\n" + package;
    throw new Error(err);
  }
  
  replaceValue_(arcPack[2], package[5], row + 2, 9);  // date (due)
  
  var canEmail = arcPack[3][row][14];
  
  return canEmail;
}

function modifyTransactionInInventory_(invPack, package) {
  var row = getRowsOfType_(invPack, [[package[1], 1]])[0];
  
  replaceValue_(invPack[2], package[5], row + 2, 18); // Replace due date
  
  return;
}