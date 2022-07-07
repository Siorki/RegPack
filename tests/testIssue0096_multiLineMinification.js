var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0096 - Multi-line minification : start");
	testSingleLineMinification();
	testMultiLineMinification();
	console.log("Issue #0096 - Multi-line minification : done");
}


/**
 * Github issue #96 - Do not remove newlines or trailing blanks in template literals
 * Make sure that blanks are left inside strings. Test on single line string
 * Erroneous behavior : removing blanks inside the string
 */
function testSingleLineMinification() {
	var input = `var c=0, d="this is a single line with spaces", e='this is another string with spaces', f=255`;
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : false,
			contextVariableName : "c",
			contextType : parseInt(0),
			reassignVars : false,
			varsNotReassigned : ['a', 'b', 'c'],
			crushGainFactor : parseFloat(1),
			crushLengthFactor : parseFloat(0),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : ""
		};
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : the preprocessed text contains the original strings untouched, the spaces are still present
	assert.notEqual(result[0].contents.indexOf('="this is a single line with spaces"'), -1);
	assert.notEqual(result[0].contents.indexOf("='this is another string with spaces'"), -1);
	// make sure that other spaces are removed
	assert.equal(result[0].contents.substr(0, 10), "var c=0,d=");
}

/**
 * Github issue #96 - Do not remove newlines or trailing blanks in template literals
 * Make sure that blanks are left inside strings. Test on multiline strings defined as template literals (since ES6)
 * Erroneous behavior : removing blanks or newlines (CR) inside the string
 */
function testMultiLineMinification() {
	var input = `var c=0, d=\`this is a multi line string
used as an example.\`, e=255` ;
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : false,
			contextVariableName : "c",
			contextType : parseInt(0),
			reassignVars : false,
			varsNotReassigned : ['a', 'b', 'c'],
			crushGainFactor : parseFloat(1),
			crushLengthFactor : parseFloat(0),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : ""
		};
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : the preprocessed text contains the original string untouched, the CR is still present
	assert.notEqual(result[0].contents.indexOf('this is a multi line string\n'), -1);
	// make sure that other spaces are removed
	assert.equal(result[0].contents.substr(0, 10), "var c=0,d=");
}

module.exports = runTests;
