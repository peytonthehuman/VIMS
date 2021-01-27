//   - modifyGremlin.gs
//       has interface function with modify gui

function makeNewMod(package) {
  /* empname, uid, cusname, cusanum, modtype, duedate/damage, debug */
  if(package[4] == "reout") {
    if(package[5] == "2week") {
      package[5] = get2WeekDueDate();
    } else if(package[5] == "max") {
      package[5] = getMaxDueDate();
    } else {
      package[5] = new Date(package[5]);
    }
    
    logPackageToFile("reout", package);
    makeNewReout(package);
  } else {
    logPackageToFile("in", package);
    makeNewCheckIn(package);
  }
}