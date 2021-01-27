// Helper functions while dealing with Google's Drive API, along with some other useful algorithms.

// Determines XY position in an array
// Parameters: width, x, y, offset
// Preconditions: all parameters are integers
// Postconditions: Integer returned.
function XYPos_(lx, x, y, offset) {
  return ((lx * y) + x + offset);
}

// Takes in a file name and returns the Spreadsheet Object
// Parameters: filename string
// Preconditions: filename is a file which exists in the administrator's google drive
// Postconditions: valid spreadsheet object is returned
function getActiveSheet_(fileName) {
  var fileptr = DriveApp.getFilesByName(fileName);
  var fileFile = fileptr.next();
  var fileID = fileFile.getId();
  var ssFile = SpreadsheetApp.openById(fileID);
  return ssFile;
}

// Takes in a file name and returns the form object.
// Parameters: filename string
// Preconditions: filename is a file which exists in the administrator's google drive
// Postconditions: valid form object is returned
function getActiveForm_(fileName) {
  var fileptr = DriveApp.getFilesByName(fileName);
  var fileFile = fileptr.next();
  var fileID = fileFile.getId();
  var fmFile = FormApp.openById(fileID);
  return fmFile;
}

// Takes in a row (int), column (int), and sheetObject and returns a value.
// Parameters: row, column integers, sheet object
// Preconditions: row and column are positive integers, sheet object is a valid sheet
// Postconditions: value at (row, column) is returned.
function getRangeValue_(row, column, sheetObject) {
  var range = sheetObject.getRange(row, column);
  var returnVar = range.getValues();
  return returnVar[0][0];
}

// Takes in a sheetObject and a test value and a column to test and returns an array of row indexes
// Parameters: sheet object, value to search for, column to find it in
// Preconditions: Sheet has values in it, value is defined, columnTest is an integer greater than 0
// Postconditions: If the value is contained in the sheet, the row it is in is returned.
//    Otherwise, the row after the last row that contains anything is returned.
function findRowsWithValue_(sheetObject, value, columnTest) {
  var lastRow = sheetObject.getLastRow();
  var indexArray = [];
  for(var i = 1; i <= lastRow; i++) {
    var tempRange = sheetObject.getRange(i, columnTest);
    var tempValue = tempRange.getValues();
    if(tempValue[0][0] == value) {
      indexArray.push(i);
    }
  }
  if(indexArray.length == 0) {
    indexArray.push(lastRow + 1);
  }
  return indexArray;
}

// Takes in an interval string and returns the number of seconds corresponding to that interval.
// Parameters: interval string
// Preconditions: interval is equal to one of the strings tested for.
// Postconditions: a number is returned.
function transcribeInterval_(interval) {
  if(interval == 'After every report') {
    return 0;
  } else if(interval == 'Once per Day') {
    return 86400;
  } else if(interval == 'Once per Week') {
    return 604800;
  } else if(interval == 'Once per Month') {
    return 2419200;
  }
  return 0;
}

// Takes in a sheet object, value, row index, and column index and replaces that cell's value; returns nothing.
// Parameters: sheet object, value, row number, column number.
// Preconditions: sheet exists, rowID and columnID are valid positions in the sheet, and value is a valid entry to the sheet
// Postconditions: the value at (rowID, columnID) is replaced by value.
function replaceValue_(sheetObject, value, rowID, columnID) {
  var tempRange = sheetObject.getRange(rowID, columnID);
  //var values = [ value ];
  tempRange.setValue(value);
  return;
}

// Takes in an array of values with coordinates, determines the range of the values, and writes those values to a sheet.
// This function assumes values are contiguous in a sheet selection range.
function replaceValues_(sheetObject, values) {
  var minrow = values[0][1];
  var maxrow = values[0][1];
  var mincol = values[0][2];
  var maxcol = values[0][2];
  var valuesonly = [];
  for(var i = 0; i < values.length; i++) {
    if(values[i][1] < minrow) {
      minrow = values[i][1];
    } else if(values[i][1] > maxrow) {
      maxrow = values[i][1];
    }
    
    if(values[i][2] < mincol) {
      mincol = values[i][2];
    } else if(values[i][2] > maxcol) {
      maxcol = values[i][2];
    }
  }
  
  var numrow = maxrow - minrow + 1;
  var numcol = maxcol - mincol + 1;
  
  for(var i = 0; i < numrow; i++) {
    valuesonly.push([]);
    for(var j = 0; j < numcol; j++) {
      valuesonly[i].push(values[j + (i * numcol)][0]);
    }
  }
    
  var tempRange = sheetObject.getRange(minrow, mincol, numrow, numcol);
  tempRange.setValues(valuesonly);
}
  

// Adds a list to a document
// Parameters: document body object, array of text to be added in a list, a glyph to head the list items
// Preconditions: document body exists, array has some text in it, and glyph is an actual glyph
// Postconditions: a list containing the same number of entries as was in the original array is added to the document body.
function writeToDocList_(bodyObject, appendTextArray, glyphtype) {
  for(var i = 0; i < appendTextArray.length; i++) {
    bodyObject.appendListItem(appendTextArray[i]).setGlyphType(glyphtype);
  }
  return;
}

// Takes in form and removes all form responses, returning nothing.
// Parameters: valid form and it's connected sheet.
// Preconditions: The form and sheet exist.
// Postconditions: The form and sheet are emptied of responses.
function removeFormResponses_(form, sheet) {
  form.deleteAllResponses();
  if(sheet.getLastRow() != 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  return;
}

// Gets the entire contents of a sheet and returns the array
// Parameters: valid sheet object, integer X and Y start offsets, integer X and Y end offsets.
// Preconditions: sheet contains something, startOffset and endOffsets are a number greater than 0.
// Postconditions: An array containing the contents of all values in the range grabbed from the sheet is returned.
function getSheet_(sheet, startOffsetX, startOffsetY, endOffsetX, endOffsetY) {
  startOffsetX++;
  startOffsetY++;
  var numRows = sheet.getLastRow() - endOffsetY - startOffsetY + 1;
  var numColumns = sheet.getLastColumn() - endOffsetX - startOffsetX + 1;
  var array = [];
  if(numRows == 0 || numColumns == 0) {
    return array;
  }
  return values = sheet.getSheetValues(startOffsetY, startOffsetX, numRows, numColumns)
}

// Test code for getCountOfType_ and getRowsOfType_
function testAllConditions_(row, pack, conditions) {
  var test = true;
  var i;
  for(i = 0; i < conditions.length && test; i++) {
    var testVal = pack[3][row][conditions[i][1]];
    if(typeof(testVal) == "string") {
      if(typeof(conditions[i][0]) != "string") {
        var error = "Error! Condition given at ";
        error += toString(i);
        error += " is not a string!";
        throw error;
      }
      test = test && (pack[3][row][conditions[i][1]].search(conditions[i][0]) != -1);
    } else {
      if(typeof(conditions[i][0] == "string")) {
         var error = "Error! Condition given at ";
         error += toString(i);
         error += " is a string!";
      }
      test = test && (pack[3][row][conditions[i][1]] == conditions[i][0]);
    }
  }
  return test;
}

// Gets the integer count of rows in sheet with an arbitrary number of conditions met.
// Conditions are tested in the row, but not necessarily in the same column.
// Each condition should be given as a 2-element array in a larger conditions array
function getCountOfType_(pack, conditions) {
  var total = 0;
  var i;
  for(i = 0; i < pack[3].length; i++) {
    if(testAllConditions_(i, pack, conditions)) {
      total++;
    }
  }
  
  return total;
}

// Similar to getCountOfType_, except this function finds all rows which meets all conditions and returns their row index
function getRowsOfType_(pack, conditions) {
  var rows = [];
  var i;
  for(i = 0; i < pack[3].length; i++) {
    if(testAllConditions_(i, pack, conditions)) {
      rows.push(i);
    }
  }
  
  return rows;
}