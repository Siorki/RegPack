var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0065 - invalid escape sequence using \\ as token : start");
	testInvalidEscapeSequence();
	testIncorrectReplacement();
	console.log("Issue #0065 - invalid escape sequence using \\ as token : done");
}



/**
 * Assert that all backslashes \ are doubled inside the input string
 * @packedCode string to check (packed by crusher or packer)
 */
function assertAllBackslashesDoubled(packedCode) {

	// extract the packed string
	var callFunction = "eval(";
	var packedStringVarOffset = packedCode.lastIndexOf(callFunction);
	if (packedStringVarOffset == -1) {
		callFunction = "setInterval(";
		packedStringVarOffset= packedCode.lastIndexOf(callFunction);
	}
	if (packedStringVarOffset == -1) {
		// no unpacking routine found : code is not packed
		assert(false);
	}
	packedStringVarOffset+=callFunction.length;
	var packedStringVar = packedCode[packedStringVarOffset];
	
	// look for packed string : 
	var packedStringBegin = packedCode.indexOf(packedStringVar+"=");
	var packedStringDelimiter = packedCode[packedStringBegin+2];
	var packedStringEnd = packedCode.lastIndexOf(packedStringDelimiter);
	
	var packedString = packedCode.substring(packedStringBegin+3, packedStringEnd);


	var index = packedString.indexOf("\\");
	while (index>0) {
		assert(packedString.charCodeAt(index)==92);
		assert(packedString.charCodeAt(index+1)==92);
		index = packedString.indexOf("\\", index+2);
	}
}



/**
 * GitHub issue #65 - backslash \ as token incorrectly escaped
 * Initial example filed with issue #65
 * Backslash interpreted as the beginning of an escape sequence
 *
 * Associated test file : gitHub#65-backslash_invalidEscapeSequence.js
 */
function testInvalidEscapeSequence() {
	var input = fs.readFileSync("../TestCases/gitHub#65-backslash_invalidEscapeSequence.js", { encoding:"utf8"});
	var options = {
		withMath : false,
		hash2DContext : false,
		hashWebGLContext : false,
		hashAudioContext : false,
		contextVariableName : false,
		contextType : parseInt(0),
		reassignVars : false,
		varsNotReassigned : [],
		crushGainFactor : parseFloat(2),
		crushLengthFactor : parseFloat(1),
		crushCopiesFactor : parseFloat(0),
		crushTiebreakerFactor : parseInt(1),
		wrapInSetInterval : false,
		timeVariableName : "",
		useES6 : true
	};
	
	var output = RegPack.packer.runPacker(input, options);
	
	// Expected result : the regular expression decodes correctly and matches the original code
	assert.notEqual(output[0].result[1][2].indexOf("Final check : passed"), -1);
	assert.notEqual(output[0].result[2][2].indexOf("Final check : passed"), -1);

	// Expected result : the output from each stage has backslashes escaped
	assertAllBackslashesDoubled(output[0].result[0][1]);
	assertAllBackslashesDoubled(output[0].result[1][1]);
	assertAllBackslashesDoubled(output[0].result[2][1]);
}

/**
 * GitHub issue #65 - backslash \ as token incorrectly escaped
 * Initial example filed with issue #73
 * Not all occurrences of backslash token are expanded 
 *
 * Associated test file : gitHub#73-backslash_unexpandedToken.js
 */
function testIncorrectReplacement() {
	var input = fs.readFileSync("../TestCases/gitHub#73-backslash_unexpandedToken.js", { encoding:"utf8"});
	var options = {
		withMath : false,
		hash2DContext : false,
		hashWebGLContext : false,
		hashAudioContext : false,
		contextVariableName : false,
		contextType : parseInt(0),
		reassignVars : false,
		varsNotReassigned : [],
		crushGainFactor : parseFloat(2),
		crushLengthFactor : parseFloat(1),
		crushCopiesFactor : parseFloat(0),
		crushTiebreakerFactor : parseInt(1),
		wrapInSetInterval : false,
		timeVariableName : "",
		useES6 : true
	};
	
	var output = RegPack.packer.runPacker(input, options);
	
	// Expected result : the regular expression decodes correctly and matches the original code
	assert.notEqual(output[0].result[1][2].indexOf("Final check : passed"), -1);
	assert.notEqual(output[0].result[2][2].indexOf("Final check : passed"), -1);

	// Expected result : the output from each stage has backslashes escaped
	assertAllBackslashesDoubled(output[0].result[0][1]);
	assertAllBackslashesDoubled(output[0].result[1][1]);
	assertAllBackslashesDoubled(output[0].result[2][1]);

}


module.exports = runTests