var editor = CodeMirror.fromTextArea(document.getElementById('console'), {
  mode: 'shell',
  theme: 'material',
  lineNumbers: true,
  matchBrackets: true,
  readOnly: true
});

function updateCodeMirror(data){
  var cm = $('.CodeMirror')[0].CodeMirror;
  var doc = cm.getDoc();
  var cursor = doc.getCursor(); // gets the line number in the cursor position
  var line = doc.getLine(cursor.line); // get the line contents
  var pos = { // create a new object to avoid mutation of the original selection
    line: (doc.size+5),
    ch: line.length - 1 // set the character position to the end of the line
  };
  doc.replaceRange('\n'+data, pos); // adds a new line
}

$(document).ready(function() {
  socket = io();
  socket.on('connect', function() {
    console.log('connected');
    socket.emit('streamLogs', window.location.pathname);
  })
  .on('error', function(err) {
    console.log(err);
  });

  socket.on('log', function(msg) {
    updateCodeMirror(msg);
  });
});
