'use strict';
/* global $ */
/* global window */
/* global document */
/* global CodeMirror */

var descriptionSection = $('.description .hero');
var descriptionSectionPosition = descriptionSection.position().top;
var descriptionSectionHeight = descriptionSection.height();

var mainWrapPadding = parseInt($('.wrap').css('padding-top').replace('px',''));

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
editor.setSize('100%', 500);

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
	'Cloning YourOrganisation/YourRepository',
	'[info] Welcome to Hawkeye!',
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
	'[info] Running module Bundler Scan',
	'[info] Running module File Contents',
	'[info] Running module Secret Files',
	'[info] Running module Node Check Updates',
	'[info] Running module Node Security Project',
	'[info] scan complete, 18 issues found',
	'',
  'level     description                                        offender                          mitigation',
  '--------  -------------------------------------------------  --------------------------------  -------------------------------------------------',
  'critical  Private SSH key                                    regex_rsa                         Check contents of the file',
  'critical  Private SSH key                                    id_rsa                            Check contents of the file',
  'critical  Potential cryptographic private key                cert.pem                          Check contents of the file',
  'critical  Private key in file                                some_file_with_private_key_in.md  Check line number: 1',
  'high      Regular Expression Denial of Service               negotiator                        https://nodesecurity.io/advisories/106',
  'high      Module is one or more major versions out of date   nodemailer                        Update to 4.0.1',
  'high      GNOME Keyring database file                        keyring                           Check contents of the file',
  'medium    Regular Expression Denial of Service               uglify-js                         https://nodesecurity.io/advisories/48',
  'medium    Module is one or more minor versions out of date   express                           Update to 4.15.2',
  'medium    Rubygems credentials file                          gem/credentials                   Might contain API key for a rubygems.org account.',
  'medium    Module is one or more minor versions out of date   morgan                            Update to 1.8.1',
  'medium    Module is one or more minor versions out of date   serve-favicon                     Update to 2.4.2',
  'medium    Module is one or more minor versions out of date   body-parser                       Update to 1.17.1',
  'medium    Module is one or more minor versions out of date   debug                             Update to 2.6.3',
  'low       Contains words: private, key                       some_file_with_private_key_in.md  Check contents of the file',
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
