//   - htmlGremlin.gs
//       contains the functions necessary to generate HTML output for all 4 webapps,
//       and the interface infrastructure to get data out to those apps.

// doGet : a function to comply with Google HTML service that composes and returns the web app in a ready state.
// Parameters : HTML GET request
// Preconditions : a valid HTML request and all needed html, css, and javascript files exist.
// Postconditions : secure and correctly formatted output is returned.
function doGet(request) {
  var filename;
  if(request.parameter.page == "checkout") {
    filename = 'gui_checkout';
  } else if(request.parameter.page == "modify") {
    filename = 'gui_modify';
  } else if(request.parameter.page == "wait") {
    filename = 'gui_wait';
  } else if(request.parameter.page == "admin") {
    filename = 'gui_admin';
  } else if(request.parameter.page == "search") {
    filename = 'gui_search';
//  } else if(request.parameter.page == "multiop") {
//    filename = 'gui_multiop';
  } else {
    filename = 'gui_error';
  }
  var output = HtmlService.createTemplateFromFile(filename).evaluate();
  Logger.log(output.getContent());
  return output;
}

// include : a function to simplify the process of including HTML
// Parameters : a string filename
// Preconditions : filename is the name of a file in the apps script project
// Postconditions : content of file at filename is returned
function include(filename) {
  var output = HtmlService.createHtmlOutputFromFile(filename).getContent();
  return output;
}