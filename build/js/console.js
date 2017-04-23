'use strict';
/* global $ */
/* global document */
/* global window */
/* global io */
/* global CodeMirror */

CodeMirror.fromTextArea(document.getElementById('console'), {
  mode: 'shell',
  theme: 'material',
  lineNumbers: true,
  matchBrackets: true,
  readOnly: true
});

var getQueryStringParams = function(sParam) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++)
  {
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] === sParam)
      {
        return sParameterName[1];
      }
  }
};

var bounce = true;
if(getQueryStringParams('history') === 'true') {
  $('.scan-queued').hide();
  bounce = false;
}

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
  if(data.indexOf('Scan complete') > -1 && bounce) {
    var path = window.location.pathname.split('/');
    path.pop();
    setTimeout(function() {
      window.location.href = path.join('/');
    }, 2000);
  }
}

$(document).ready(function() {
  var socket = io();
  socket.on('connect', function() {
    socket.emit('streamLogs', window.location.pathname);
  })
  .on('error', function(err) {
    console.log(err);
  })
  .on('log', function(msg) {
    updateCodeMirror(msg);
  });
});
