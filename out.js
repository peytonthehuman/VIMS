//   - out.gs
//       contains a function to checkout a single item (and apply it to the inventory, and add the entry to the master history log) and a function to process the whole checkout list.
//       also contains the function to add a new entry to the checkout log

// Input Args: package element from client
// Output args: none
function makeNewCheckout(package) {
  // Package has: empname, uid, cusname, cusanum, cusemail, cuspnum, date, notes, debug
  package[6] = new Date(package[6]);
  package[6].setHours(17);
  
  logPackageToFile("out", package);
  
  // Grab archive package for manipulation
  var archivePack = getSheetPackage_('transaction_archive');
  var inventoryPack = getSheetPackage_('vault_inventory');
  
  // Make record of checkout in transaction log
  var canEmail = addCheckoutToArchive_(archivePack, package);
  
  // Make record of checkout in vault inventory
  addCheckoutToInventory_(inventoryPack, package);
  
  // Check waitlist and remove entry if necessary
  checkAndRemoveFromWaitList_(package);
  
  // Send Out Email
  if(canEmail && !package[8]) {
    emailOut_(package[1], package[3]);
  }
}

function emailOutIfNeeded() {
  var archivePack = getSheetPackage_('transaction_archive');
  var inventoryPack = getSheetPackage_('vault_inventory');
  
  var archiveSize = archivePack[2].getLastRow() + 1;
  
  for(var i = 0; i < archiveSize; i++) {
    if(archivePack[3][i][14] && !archivePack[3][i][15]) {
      var UID = archivePack[3][i][0];
      var anumber = archivePack[3][i][4];
      var dueDate = archivePack[3][i][8];
      var invRow = findRowsWithValue_(archivePack[2], UID, 2);
      replaceValues_(inventoryPack[2], [[dueDate, invRow, 2]]);
      emailOut_(UID, anumber);
      replaceValues_(archivePack[2], [["=true", i, 15]]);
    }
  }
}

// Input Args: package element passed from makeNewCheckout or headGremlin
// Output Args: none
function addCheckoutToArchive_(archive, package) {
  var lastRow = archive[2].getLastRow() + 1;
  var newRow = 
  [[package[1], lastRow, 1], // UID
   [new Date(), lastRow, 2], // timestamp
   [package[0], lastRow, 3], // empname
   [package[2], lastRow, 4], // cusname
   [package[3], lastRow, 5], // cusanum
   [package[5], lastRow, 6], // cuspnum
   [package[4], lastRow, 7], // cusemail
   [package[7], lastRow, 8], // out notes
   [package[6], lastRow, 9]];// date (due)
  
  replaceValues_(archive[2], newRow);
  
  var newRow =
  [[],[],
   ["=false", lastRow, 17],  // in email
   [0, lastRow, 18],         // last late email
   ["=false", lastRow, 19]]; // held
  
  var canEmail = false;
  
  if(package[4] == "supervisor@email.com") { // Not a real email
    newRow[0] = ["=false", lastRow, 15];
  } else {
    newRow[0] = ["=true", lastRow, 15];
    canEmail = true;
  }
  
  var dueDateCompare = new Date(package[6]);
  if(dueDateCompare > getMaxDue()) {
    newRow[1] = ["=true", lastRow, 16];
    canEmail = false;
  } else {
    newRow[1] = ["=false", lastRow, 16];
  }
  
  replaceValues_(archive[2], newRow);
  
  return canEmail;
}

// Input Args: uid, customer name, customer anumber, customer email, customer phone, due date, debug flag
function addCheckoutToInventory_(invPack, package) {
  var baseDisplace = 11;
  var UIDRow = findRowsWithValue_(invPack[2], package[1], 2);
  replaceValue_(invPack[2], "=false", UIDRow, baseDisplace + 0); // Out flag
  
  var newRow = 
      [[package[2], UIDRow, baseDisplace + 2], // customer name
       [package[3], UIDRow, baseDisplace + 3], // customer a number
       [package[4], UIDRow, baseDisplace + 4], // customer email
       [package[5], UIDRow, baseDisplace + 5], // customer phone
       [new Date(), UIDRow, baseDisplace + 6], // timestamp
       [package[6], UIDRow, baseDisplace + 7], // due date
       [package[7], UIDRow, baseDisplace + 8]];// notes
  replaceValues_(invPack[2], newRow);
}
