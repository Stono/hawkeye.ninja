var editor = CodeMirror.fromTextArea(document.getElementById('console'), {
  mode: 'shell',
  theme: 'material',
  lineNumbers: true,
  matchBrackets: true,
  readOnly: true
});

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
    console.log(msg);
  });
});
