// log.js
//   This function in this file is called at the beginning of each of the transaction functions, and writes an unmodified version of the input package to a log file.

function logPackageToFile(type, package) {
  var rawInputPack = getSheetPackage_('raw_input_stream');
  var row = rawInputPack[2].getLastRow() + 1;
  var newRow = 
      [[new Date(), row, 1], // timestamp
       [package[0], row, 2], // Employee Name
       [package[1], row, 3], // UID
       [package[2], row, 4], // Customer Name
       [package[3], row, 5], // Customer Email
       ['', row, 6],
       ['', row, 7],
       ['', row, 8],
       ['', row, 9],
       ['', row, 10]];
  
  if(type == "out") {
    newRow[5][0] = "Check Out";
    newRow[6][0] = package[4];
    newRow[7][0] = package[5];
    newRow[8][0] = package[6];
    newRow[9][0] = package[7];
  } else if(type == "in") {
    newRow[5][0] = "Check In";
    newRow[9][0] = package[5];
  } else if(type == "reout") {
    newRow[5][0] = "Renew Out";
    newRow[8][0] = package[5];
  } else if(type == "waitadd") {
    newRow[5][0] = "Add to Wait";
    newRow[6][0] = package[4];
  }
  
  replaceValues_(rawInputPack[2], newRow);
  
  return;
}
