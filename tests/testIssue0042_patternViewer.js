var PatternViewer = require("../patternViewer")
var fs = require("fs");
var DocumentMock = require("./documentMock");
var assert = require("assert");

function runTests() {
	console.log("Issue #0042 - Pattern Viewer : start");
	testLastBlockBeforeEnd();
	testLastBlockAtEnd();
	console.log("Issue #0042 - Pattern Viewer : done");
}


/**
 * Github issue #42 - Visualization misses patterns that end at the last character
 * Single pattern not including the end of the block (regression test)
 */
function testLastBlockBeforeEnd() {
	document = new DocumentMock();
	var patternViewer = new PatternViewer();
	var code = "abcdefghijklmnopqrstuvwxyz";
	var matches = [ { token : "A", originalString : "defg" } ];
	var result = patternViewer.render(code, matches);
	assert.equal(document.message, "[abc][defg][hijklmnopqrstuvwxyz]");

}

/**
 * Github issue #42 - Visualization misses patterns that end at the last character
 * Single pattern featuring the last characters of the block
 */
function testLastBlockAtEnd() {
	document = new DocumentMock();
	var patternViewer = new PatternViewer();
	var code = "abcdefghijklmnopqrstuvwxyz";
	var matches = [ { token : "A", originalString : "wxyz" } ];
	var result = patternViewer.render(code, matches);
	assert.equal(document.message,"[abcdefghijklmnopqrstuv][wxyz]");
}

module.exports = runTests;