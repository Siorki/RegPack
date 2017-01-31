var RegPack = require("../regPack")
var assert = require("assert");

function runTests() {
	console.log("Issue #0050 - Unicode surrogate byte length : start");
	testByteLength();
	testSurrogatePacking();
	console.log("Issue #0050 - Unicode surrogate byte length : done");
}

/**
 * Github issue #50 - Support for characters in the astral plane
 * First, make sure that the astral characters (composed of two 16-bit codes,
 * first one in [0xD800, 0xDBFF] and second one in [0xDC00, DFFF]) are correctly read
 *
 */
function testByteLength() {
	// standard ASCII
 	var input = "0123456789abcdefghijklmnopqrstuvwxyz";
	assert.equal(36, RegPack.packer.getByteLength(input));
	
	// 2-byte UTF-8
	input = "�";
	assert.equal(3, RegPack.packer.getByteLength(input));
	
	// 4-byte UTF-8 with surrogates
	input = "\uD83D\uDD25\uD83D\uDD25\uD83D\uDD25";
	assert.equal(12, RegPack.packer.getByteLength(input));
	
	input = "🔥🔥🔥";
	assert.equal(12, RegPack.packer.getByteLength(input));
}


/**
 * Github issue #50 - Support for characters in the astral plane
 * Then, check that the crusher does not attempt to break the input in between the two surrogate characters,
 * since a string starting with the second one would yield a malformed URI
 *
 */
function testSurrogatePacking() {
	// 4-byte UTF-8 with surrogates
	input = "\uD83D\uDD25\uD83D\uDD25\uD83D\uDD25\uD83D\uDD25\uD83D\uDD25\uD83D\uDD25";
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
		timeVariableName : ""
	};
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : no exception thrown before, internal check successful, 
	// and the unicode characters are excluded from the token range
	assert(RegPack.packer.getByteLength(result[0].result[2][1]) > 0);
	assert.notEqual(result[0].result[2][1].indexOf("uffff]"), -1);
	assert.notEqual(result[0].result[2][2].indexOf("Final check : passed"), -1);
}



module.exports = runTests;