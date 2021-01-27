// - email.gs
//     contains the following functions:
//        - Email late : emails all students who are late and haven't been emailed in an amount of days specified
//                       by the properties file
//        - Email In Receipts : emails all students who have checked in an item and haven't gotten a receipt
//        - Email Out Receipts : emails all students who have checked out an item and haven't gotten a receipt
//        - End of Semester Email : emails all students who still have things out using a special email template
// Error Codes (EG):
// - EG000: Email cannot display (only used for error report).

function sendEmailList_(debug, data, type) {
  for(var i = 0; i < data.length; i++) {
    if(!debug) {
      type(data[i][0], data[i][1]);
    }
  }
  return;
}

function emailOut_(uid, anumber) {
  sendEmail_(uid, anumber, "out", false);
}

function emailIn_(uid, anumber) {
  sendEmail_(uid, anumber, "in", false);
}

function emailLate_(uid, anumber) {
  sendEmail_(uid, anumber, "late", false);
}

function emailHold_(uid, anumber) {
  sendEmail_(uid, anumber, "hold", false);
}

function sendAllEmailsTest() {
  sendEmail_("DEBUG", "00000000", "out", true);
  sendEmail_("DEBUG", "00000000", "in", true);
  sendEmail_("DEBUG", "00000000", "late", true);
  sendEmail_("DEBUG", "00000000", "hold", true);
}

function sendEmail_(uid, anumber, type, debug) {
  var invPack = getSheetPackage_('vault_inventory');
  var arcPack = getSheetPackage_('transaction_archive');
  
  var inTemplate = ['', false, false, '', '', '', '', false]; //[name, opt sel 1, opt sel 2, processdate, duedate, uid, unit value, Immediate Return Flag]
  var templateOut;
  var templateString = '';
  
  var text = '';
  var errorText = 'There has been an error in showing this email. Please try viewing this email on a personal computer.';
  var docTitle = '';
  var studentEmail;
  
  // Get transaction_archive row containing pertinent checkout
  /*var actionRows = findRowsWithValue_(arcPack[2], uid, 1);
  var actionRow = -1;
  for(actionRow = actionRows[actionRows.length - 1]; actionRow >= 0; actionRow--) {
    if(arcPack[3][actionRow - 2][4] == anumber) {
      break;
    }
  }
  
  actionRow -= 2;*/
  
  if(!debug) {
    var actionRows = getRowsOfType_(arcPack, [[uid, 0], [anumber, 4]]);
    if(actionRows.length == 0) {
      var error = "Error! No actionRows defined! ANumber: " + anumber + " UID: " + uid;
      throw error;
    }
    var tableRow = actionRows[actionRows.length - 1];
    var actionRow = tableRow + 2;
    
    inTemplate[0] = arcPack[3][tableRow][3];
  }
  
  // Determine Type
  if(type == "out") {
    docTitle = "Checkout Receipt";
    inTemplate[1] = true;
    inTemplate[2] = false;
    if(!debug) replaceValue_(arcPack[2],'=true',actionRow,16);
  } else if(type == "in") {
    docTitle = "Check-in Receipt";
    inTemplate[1] = true;
    inTemplate[2] = true;
    if(!debug) replaceValue_(arcPack[2],'=false',actionRow,15);
    if(!debug) replaceValue_(arcPack[2],'=true',actionRow,17);
  } else if(type == "late") {
    docTitle = "Late Warning";
    inTemplate[1] = false;
    inTemplate[2] = false;
    if(!debug) replaceValue_(arcPack[2], new Date(), actionRow, 18);
  } else if(type == "hold") {
    docTitle = "Student Account Hold Notice";
    inTemplate[1] = false;
    inTemplate[2] = true;
    if(!debug) replaceValue_(arcPack[2],'HELD',actionRow,18);
  }
  
  var invRow = findRowsWithValue_(invPack[2], uid, 2)[0] - 2;
  inTemplate[7] = invPack[3][invRow][2];
  
  if(!debug) {
    // Get dates
    if(type == "in") {
      inTemplate[3] = getStringDate(arcPack[3][tableRow][9]);
    } else {
      inTemplate[3] = getStringDate(arcPack[3][tableRow][1]);
    }
    
    inTemplate[4] = getStringDate(arcPack[3][tableRow][8]);
    inTemplate[5] = uid;
    inTemplate[6] = invPack[3][invRow][3];
    
    studentEmail = arcPack[3][tableRow][6];
  } else {
    inTemplate[0] = "Debug";
    inTemplate[3] = getStringDate(new Date());
    inTemplate[4] = getStringDate(new Date());
    inTemplate[5] = uid;
    inTemplate[6] = 10;
    studentEmail = "supervisor@email.com"; // Not a real email
  }
  
  templateOut = HtmlService.createTemplateFromFile('reciept_template');
  templateOut.data = inTemplate;
  templateString = templateOut.evaluate().getContent();
  
  GmailApp.sendEmail(studentEmail, docTitle, errorText, {
    from: GmailApp.getAliases()[0],
    name: 'Vault',
    htmlBody: templateString
  });
}

function sendWaitEmail_(uid, uidcatflag, name, email) {
  var text = name;
  text += ',\n\nThis is an automated email to verify that, on ';
  text += getStringDate(new Date());
  text += ', you were added to the Vault waiting list to check-out ';
  if(uidcatflag) {
    text += 'a(n) ';
    text += uid;
  } else {
    text += uid;
  }
  text += '.\n\nWaiting list requests will be filled on a first-come, first-served basis. You will be notified as soon as the item you are waiting for is available.';
  text += '\n\nIf you have any questions, or if you believe you received this email in error, feel free to visit the Vault or respond to this email.';
  text += '\n\nThanks,\n\n\nVault';
  var docTitle = 'Wait List Receipt';
  
  GmailApp.sendEmail(email, docTitle, text, {
    name: 'Vault',
  });
}

function sendErrorReport_(code, message, location) {
  var docTitle = "Error Report: ";
  docTitle += code;
  var errorText = "Can't show this, don't know why. Error: EG000.";
  
  var inTemplate = [docTitle, code, location, message];
  
  var templateOut = HtmlService.createTemplateFromFile('report_template');
  templateOut.data = inTemplate;
  var templateString = templateOut.evaluate().getContent();
  
  GmailApp.sendEmail('vault@email.com', docTitle, errorText, {
    from: 'supervisor@email.com',
    name: 'VIMS Reporting Utility',
    htmlBody: templateString
  });
}