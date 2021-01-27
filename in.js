// - in.gs
//     contains a function to checkin a single item (and apply it to the inventory,
//     and add the entry to the master history log) and a function to process the whole checkin list.
//     also contains the function to add a new entry to the checkin log

function makeNewCheckIn(package) {
  /* empname, uid, cusname, cusanum, modtype, damage, debug */
  // Grab archive package for manipulation
  var arcPack = getSheetPackage_("transaction_archive");
  
  // Grab inventory package for manipulation
  var invPack = getSheetPackage_("vault_inventory");
  
  var emailBack = false;
  
   // Make record of checkin in transaction log
  emailBack = addCheckinToArchive_(arcPack, package);
  
  // Make record of checkin in vault inventory
  addCheckinToInventory_(invPack, package);
  
  // Verify things done properly
  
  // Send in Email
  if(emailBack && !package[6]) {
    emailIn_(package[1], package[3]);
  }
}

// Input Args: package element passed from makeNewCheckout or headGremlin
// Output Args: none
function addCheckinToArchive_(arcPack, package) {
  //var arcPack = getSheetPackage_("transaction_archive");
  var baseDisplace = 10;
  var UIDRows = findRowsWithValue_(arcPack[2], package[1], 1);
  var arrayRow = -1;
  var sheetRow = -1;
  for(var i = UIDRows.length - 1; i >= 0; i--) {
    if(arcPack[3][UIDRows[i] - 2][4] == package[3]) {
      sheetRow = UIDRows[i];
      arrayRow = UIDRows[i] - 2;
      break;
    }
  }
  
  if(arrayRow == -1 || arrayRow >= arcPack[3].length) {
    var err = "Error! Add Checkin to Archive cannot find suitable row.\n" + package;
    throw new Error(err); 
  }
  
  var emailBack = false;
  
  var newRow = 
      [[new Date(), sheetRow, baseDisplace + 0], // in date
       [package[0], sheetRow, baseDisplace + 1], // empname
       ['', sheetRow, baseDisplace + 2],
       ['', sheetRow, baseDisplace + 3]];
  if(package[5] === "") {
    newRow[2][0] = "No"; // Broken Flag
  } else {
    newRow[2][0] = "Yes"; // Broken flag
    newRow[3][0] = package[5]; // Damage Notes
  }
  
  replaceValues_(arcPack[2], newRow);
  
  if(arcPack[3][arrayRow][14]) {
    emailBack = true;
  }
  
  return emailBack;
}

// Input Args: uid, customer name, customer anumber, customer email, customer phone, due date, debug flag
function addCheckinToInventory_(invPack, package) {
  var baseDisplace = 11;
  var UIDRow = findRowsWithValue_(invPack[2], package[1], 2);
  replaceValue_(invPack[2], "=true", UIDRow, baseDisplace + 0); // Out flag
  
  var newRow =
      [["", UIDRow, baseDisplace + 2], // customer name
       ["", UIDRow, baseDisplace + 3], // customer a number
       ["", UIDRow, baseDisplace + 4], // customer email
       ["", UIDRow, baseDisplace + 5], // customer phone
       ["", UIDRow, baseDisplace + 6], // timestamp
       ["", UIDRow, baseDisplace + 7], // due date
       [package[5], UIDRow, baseDisplace + 8]]; // notes
  
  replaceValues_(invPack[2], newRow);
}