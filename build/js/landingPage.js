var descriptionSection = $('.description .hero');
var descriptionSectionPosition = descriptionSection.position().top;
var descriptionSectionHeight = descriptionSection.height();

var mainWrapPadding = parseInt($(".wrap").css("padding-top").replace('px',''));

var largeGitBtnDisappearPoint = descriptionSectionPosition + descriptionSectionHeight - mainWrapPadding;
$(window).scroll(function() {
  if ($(window).scrollTop() >= largeGitBtnDisappearPoint) {
    $('header .btn-github').removeClass('hidden');
  } else {
    $('header .btn-github').addClass('hidden');
  }
});

var editor = CodeMirror.fromTextArea(document.getElementById('console'), {
  mode: 'shell',
  theme: 'material',
  lineNumbers: true,
  matchBrackets: true,
  readOnly: true
});
editor.setSize("100%",500)

function updateCodeMirror(data){
  var cm = $('.CodeMirror')[0].CodeMirror;
  var doc = cm.getDoc();
  var cursor = doc.getCursor(); // gets the line number in the cursor position
  var line = doc.getLine(cursor.line); // get the line contents
  var pos = { // create a new object to avoid mutation of the original selection
    line: (doc.size+5),
    ch: line.length - 1 // set the character position to the end of the line
  };
  doc.replaceRange('\n' + data, pos); // adds a new line
  $('.CodeMirror-scroll').scrollTop(1000);
}

var data = [
  'Hawkeye starting...',
  '',
  'Request being handled by: ce6752a0deb58c96f67479eb08762efc21abed3499b52a57',
  'Cloning YourOrganisation/YourRepository',
  '[info] Welcome to Hawkeye v0.10.8!',
  '',
  '[info] Bundler Scan dynamically loaded',
  '[info] File Contents dynamically loaded',
  '[info] Entropy dynamically loaded',
  '[info] Example Module dynamically loaded',
  '[info] Secret Files dynamically loaded',
  '[info] Node Check Updates dynamically loaded',
  '[info] Node Security Project dynamically loaded',
  '[info] Exclusion patterns: ^node_modules/, ^.git/, ^.git-crypt/',
  '[info] git repo detected, will only use git tracked files',
  '[info] Files excluded by exclusion patterns: 0',
  '[info] Files included in scan: 22',
  '[info] Not Handling Bundler Scan',
  '[info] Running module File Contents',
  '[info] Running module Secret Files',
  '[info] Running module Node Check Updates',
  '[info] Running module Node Security Project',
  '[info] scan complete, 18 issues found',
  '',
  'level   description                                       offender                extra                               ',
  '------  ------------------------------------------------  ----------------------  ------------------------------------',
  'high    Module is one or more major versions out of date  grunt-shell             Installed: 1.1.1, Available: 2.1.0  ',
  'high    Module is one or more major versions out of date  deride                  Installed: 0.1.15, Available: 1.1.0 ',
  'high    Module is one or more major versions out of date  squel                   Installed: 3.10.0, Available: 5.9.0 ',
  'high    Module is one or more major versions out of date  lodash                  Installed: 3.0.0, Available: 4.17.4 ',
  'high    Module is one or more major versions out of date  async                   Installed: 0.9.0, Available: 2.3.0  ',
  'high    Module is one or more major versions out of date  grunt-contrib-watch     Installed: 0.6.1, Available: 1.0.0  ',
  'high    Module is one or more major versions out of date  restify                 Installed: 2.8.5, Available: 4.3.0  ',
  'high    Module is one or more major versions out of date  mssql                   Installed: 1.3.0, Available: 4.0.1  ',
  'high    Module is one or more major versions out of date  grunt                   Installed: 0.4.5, Available: 1.0.1  ',
  'high    Module is one or more major versions out of date  grunt-contrib-jshint    Installed: 0.11.0, Available: 1.1.0 ',
  'high    Module is one or more major versions out of date  should                  Installed: 4.6.1, Available: 11.2.1 ',
  'medium  Potential password in file                        test/drivers.js         Line number: 13                     ',
  'medium  Module is one or more minor versions out of date  blanket                 Installed: 1.1.6, Available: 1.2.3  ',
  'medium  SQL dump file                                     test/sql/dropSP2.sql                                        ',
  'medium  SQL dump file                                     test/sql/createSP3.sql                                      ',
  'medium  SQL dump file                                     test/sql/createSP1.sql                                      ',
  'medium  Module is one or more minor versions out of date  grunt-mocha-test        Installed: 0.12.7, Available: 0.13.2',
  'medium  Potential password in file                        README.md               Line number: 29                     ',
  '',
  '[info] Scan complete'
];

var copyAndReset = function() {
  var copy = data.slice().reverse();
  var line = copy.pop();
  editor.setValue(line);
  return copy;
};

var runConsole = function() {
  var copy = copyAndReset();
  var inter = setInterval(function() {
    var line = copy.pop();
    if(line === undefined) {
      copy = data.slice().reverse();
      line = copy.pop();
      clearInterval(inter);
      //setTimeout(runConsole, 2000);
      return;
    } else {
      updateCodeMirror(line);
    }
  }, 100);
};
runConsole();
