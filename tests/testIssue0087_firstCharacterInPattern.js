var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0087 - first character part of a pattern : start");
	testFirstCharacterInCrusher();
	console.log("Issue #0087 - first character part of a pattern : done");
}


/**
 * GitHub issue #87 - crusher ignores first character while searching for patterns
 * As a consequence, the pattern starts with the 2nd character instead
 *
 *
 */
function testFirstCharacterInCrusher() {
	var input = "0123456789a0123456789b";
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
	
	var output = RegPack.packer.runPacker(input, options);
	
	// Expected result : the first pattern is the string "0123456789", not "123456789"
	assert.equal(output[0].matchesLookup[0].originalString, "0123456789");
	
}


module.exports = runTests