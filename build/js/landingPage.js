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


var sizeIcons = function() {
	var width = $( window ).width() / 200;
	var min = 2;
	var max = 6;
	if(width > max) {
		width = max;
	};
	if(width < min) {
		width = min;
	};
	//$('.fa-6').each(function(idx, icon) { $(icon).css('font-size', width + 'em'); });
	$('.branch .fa').each(function(idx, icon) { $(icon).css('font-size', width + 'em'); });
};

//$(window).resize(sizeIcons);
//$(document).ready(sizeIcons);

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
	'Cloning YourOrganisation/YourRepository',
	'[info] Welcome to Hawkeye v0.10.10!',
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
	'level   description                                       offender                additional information               ',
	'------  ------------------------------------------------  ----------------------  --------------------------------------',
  'high    Regular Expression Denial of Service              negotiator              https://nodesecurity.io/advisories/106',
	'high    Module is one or more major versions out of date  grunt-shell             Installed: 1.1.1, Available: 2.1.0  ',
	'high    Module is one or more major versions out of date  deride                  Installed: 0.1.15, Available: 1.1.0 ',
	'high    Module is one or more major versions out of date  should                  Installed: 4.6.1, Available: 11.2.1 ',
	'medium  Potential password in file                        test/drivers.js         Line number: 13                     ',
  'medium  XSS vulnerability in sanitize_css in Action Pack  actionpack              upgrade to ~> 2.3.18                ',
	'medium  Module is one or more minor versions out of date  blanket                 Installed: 1.1.6, Available: 1.2.3  ',
  'medium  Reflective XSS Vulnerability in Ruby on Rails     actionpack              upgrade to ~> 3.2.16, >= 4.0.2      ',
	'medium  SQL dump file                                     test/sql/dropSP2.sql                                        ',
	'medium  SQL dump file                                     test/sql/createSP3.sql                                      ',
	'medium  SQL dump file                                     test/sql/createSP1.sql                                      ',
	'medium  Module is one or more minor versions out of date  grunt-mocha-test        Installed: 0.12.7, Available: 0.13.2',
	'medium  Potential password in file                        README.md               Line number: 29                     ',
  'low     Possible XSS Vulnerability in Action View         actionpack              upgrade to ~> 3.2.22.3              ',
  'low     Insecure Source URI found: http://rubygems.org/   Gemfile                                                     ',
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
