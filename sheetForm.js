// sheetForm.js
// This file provides functions to handle and package Google's spreadsheet's into manipulatable objects.
// The functions return a four element array which contain the file reference, the spreadsheet reference, the sheet reference, and a in-memory copy of the spreadsheet.
// getSheetPackage flattens the arrays for spreadsheets that only have one sheet.

function getAllSheetsPackage_(filename) {
  var ssActive = getActiveSheet_(filename);
  SpreadsheetApp.setActiveSpreadsheet(ssActive);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets();
  var sheetArray = [];
  for(var i = 0; i < sheet.length; i++) {
    sheetArray.push(getSheet_(sheet[i], 0, 1, 0, 0));
  }
  return [ssActive, ss, sheet, sheetArray];
}

function getSheetPackage_(filename) {
  var temp = getAllSheetsPackage_(filename);
  return [temp[0], temp[1], temp[2][0], temp[3][0]];
}