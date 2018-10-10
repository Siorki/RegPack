var RegPack = require("../regPack");
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0083 - backslash token makes output larger : start");
	testBackslashToken();
	testCharacter9AloneInRange();
	console.log("Issue #0083 - backslash token makes output larger : done");
}



/**
 * Github issue #83 - Don't use "\" as a token if avoiding it makes the output smaller 
 * \ costs 2 whereas other tokens cost 1
 * The cost computation does not account for that extra cost
 *
 * Compare the result of packing the same string with the last character as only difference :
 *  - one ends with a closing bracket ) and thus has \ as available token
 *  - the second one ends with \ instead to remove it from token space
 *
 */
function testBackslashToken() {
	var input = fs.readFileSync("../TestCases/gitHub#83-backslash_largerOutput.js", { encoding:"utf8"});

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
		
	var resultWithBackspaceToken = RegPack.packer.runPacker(input+")", options);
	var resultWithoutBackspaceToken = RegPack.packer.runPacker(input+"\\", options);
	
	// With the extra token available, compression should be at least as good (lower final size) as without it
	assert(resultWithBackspaceToken[0].result[1][0] <= resultWithoutBackspaceToken[0].result[1][0]);
}

/**
 * Github issue #83 - Don't use "\" as a token if avoiding it makes the output smaller 
 * 
 * The first version of the code that passed all existing tests
 * caused a CR (char code 10) to be added to the character class in the benchmark Flappy Dragon.
 * 
 * Make sure this artefact is gone on a similar sample that as a lone 9 (TAB) in the last token range
 */
function testCharacter9AloneInRange() {
	var input = fs.readFileSync("../TestCases/gitHub#83-packer_9Alone.js", { encoding:"utf8"});

	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : false,
			contextVariableName : false,
			contextType : parseInt(0),
			reassignVars : false,
			varsNotReassigned : [],
			crushGainFactor : parseFloat(1),
			crushLengthFactor : parseFloat(0),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : "",
			useES6 : true
		};
		
	var result = RegPack.packer.runPacker(input, options);
	
	// Make sure no CR has made it into the character class of the resulting string
	var CRcharacter = String.fromCharCode(10);
	assert.equal(result[0].result[1][1].indexOf(CRcharacter), -1);
}

module.exports = runTests;