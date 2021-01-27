// - dueDate.gs
//     contains the following functions:
//        - 2 week due : returns 2 weeks forward from the entered date
//        - master due : returns the master due date

function get2WeekDueDate() {
  var now = new Date();
  var tweek = datedisplace(now, 14);
  var max = getMaxDueDate();
  
  if(max < tweek) {
    return max;
  }
  
  var closeCalArr = CalendarApp.getCalendarsByName('Office Closures');
  if(closeCalArr.length == 0) {
    throw "No calendars found!";
  }
  var closeCal = closeCalArr[0];
  var closures = closeCal.getEventsForDay(tweek);
  
  if(closures.length != 0) {
    var tempDate;
    try {
      tempDate = closures[0].getAllDayEndDate();
    } catch(err) {
      throw "Closure event is not all day!"
    }
    tweek = tempDate;
  }
  
  if(tweek.getDay() == 0) {
    tweek.setDate(tweek.getDate() + 1);
  } else if(tweek.getDay() == 6) {
    tweek.setDate(tweek.getDate() + 2);
  }
  
  return tweek;
}

function get2WeekDue() {
  return getStringDate(get2WeekDueDate());
}

function getMaxDueDate() {
  return new Date(Date.parse(getMaxDue()));
}

function getMaxDue() {
  var fmDueDate = getActiveForm_('admin_edit_masterduedate');
  var fmDueDate_Resp = fmDueDate.getResponses();
  var fmDueDate_Item = fmDueDate_Resp[fmDueDate_Resp.length - 1].getItemResponses();
  var newDueDate = fmDueDate_Item[0].getResponse();
  return newDueDate;
}

function getStringDate(date) {
  var retString = (date.getMonth() + 1) + '/';
  retString += date.getDate() + '/';
  retString += date.getFullYear();
  return retString;
}

// Calculates a two week due date from the current time.
// Parameters: a valid time object, integer number of days to displace.
// Preconditions: none.
// Postconditions: a time exactly displacenum days from the one entered is returned.
function datedisplace(timein, displacenum) {
  var timedue = new Date(timein.getTime() + (86400000 * displacenum));
  return timedue;
}

function dateCompare(left, right, fuzz) {
  var righttime = right.getTime();
  var lefttime = left.getTime();
  var rightfuzz = righttime+fuzz;
  var leftfuzz = lefttime+fuzz;
  return lefttime <= (righttime + fuzz) && lefttime >= (righttime - fuzz);
}