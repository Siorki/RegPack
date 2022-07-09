var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0079 - Minify C and XML comments : start");
	testCCommentMinification();
	testCppCommentMinification();
	testXMLCommentMinification();
	console.log("Issue #0079 - Minify C and XML comments : done");
}


/**
 * Github issue #79 - Minify C and XML comments
 * Check that minification removed the C comments, both single and multiline
 * Erroneous behavior : keep the comment or remove only part of it
 *
 */
function testCCommentMinification() {
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
    var inputWithSingleLineComment = "if(i<0 /* || i>5 */)";
	var result = RegPack.packer.runPacker(inputWithSingleLineComment, options);
	// Expected result : the commented code is gone
	assert.equal(result[0].contents, "if(i<0)");
    
    var inputWithMultiLineComment = `/*
* create an array and initialize it with fifty zeroes
*/
let j=Array(50).fill(0));`
    result = RegPack.packer.runPacker(inputWithMultiLineComment, options);
	// Expected result : the multiline comment is gone
	assert.equal(result[0].contents, "let j=Array(50).fill(0));");
}


/**
 * Github issue #79 - Minify C and XML comments
 * Check that minification removed the oneliner C++ comment, and only the comment
 * Erroneous behavior : remove the whole line, or keep the comment
 */
function testCppCommentMinification() {
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
    var inputWithSingleLineComment = `var t=0;
t=2; // change displayed value
alert(t)`;
	var result = RegPack.packer.runPacker(inputWithSingleLineComment, options);
	// Expected result : the comment is gone, but the remainder of the line is still there
	assert.equal(result[0].contents, "var t=0;t=2;alert(t)");
}

/**
 * Github issue #79 - Minify C and XML comments
 * Check that minification removed the XML comments, both single and multiline
 * Erroneous behavior : keep the comment or remove only part of it
 *
 */
function testXMLCommentMinification() {
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
    var inputWithSingleLineComment = "if(i<0 <!-- || i>5 -->)";
	var result = RegPack.packer.runPacker(inputWithSingleLineComment, options);
	// Expected result : the commented code is gone
	assert.equal(result[0].contents, "if(i<0)");
    
    var inputWithMultiLineComment = `<!--
* create an array and initialize it with fifty zeroes
-->
let j=Array(50).fill(0));`
    result = RegPack.packer.runPacker(inputWithMultiLineComment, options);
	// Expected result : the multiline comment is gone
	assert.equal(result[0].contents, "let j=Array(50).fill(0));");
}


module.exports = runTests;
