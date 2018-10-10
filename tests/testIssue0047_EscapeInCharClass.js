var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0047 - \\ and ] in character class : start");
	testRangeSorting();
	testEscapedCharacterWithoutReplacement();
	testEscapedCharacterWithReplacement();
	testEscapedCharacterReplacementFails();
	console.log("Issue #0047 - \\ and ] in character class : done");
}

/**
 * GitHub issue #47 - Use \ and ] (which need escaping) as tokens in packer
 * Range sorting consistency test (case met during development : last character had a value of NaN)
 * Ranges available for tokens are @ , B-E , L-P , ~
 *
 * Associated test file : gitHub#47-packer_rangesBeyond.js
 */

function testRangeSorting() {
	var input = fs.readFileSync("../TestCases/gitHub#47-packer_rangesBeyond.js", { encoding:"utf8"});
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
	
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	// And the blocks are L-P and B-E (used up to C), in that order
	assert.notEqual(result[0].result[1][1].indexOf("=/[L-PBC]/"), -1);
}

/**
 * GitHub issue #47 - Use \ and ] (which need escaping) as tokens in packer
 * Test ranges starting or ending with escaped characters, with no replacement tokens (none left)
 *
 * Associated test file : gitHub#47-packer_to92NoReplace.js
 * Associated test file : gitHub#47-packer_to93NoReplace.js
 * Associated test file : gitHub#47-packer_from92NoReplace.js
 * Associated test file : gitHub#47-packer_from93NoReplace.js
 */

function testEscapedCharacterWithoutReplacement() {
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
		
	var input = fs.readFileSync("../TestCases/gitHub#47-packer_to92NoReplace.js", { encoding:"utf8"});
	var result = RegPack.packer.runPacker(input, options);
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	// And the only block ends in \, no tokens are available for replacement
	assert.notEqual(result[0].result[1][1].indexOf("=/[Y-\\\\]/"), -1);

	input = fs.readFileSync("../TestCases/gitHub#47-packer_to93NoReplace.js", { encoding:"utf8"});
	result = RegPack.packer.runPacker(input, options);
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	// And the only block ends in ], no tokens are available for replacement
	assert.notEqual(result[0].result[1][1].indexOf("=/[Y-\\]]/"), -1);

	input = fs.readFileSync("../TestCases/gitHub#47-packer_from92NoReplace.js", { encoding:"utf8"});
	result = RegPack.packer.runPacker(input, options);
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	// And the only block begins with \, no tokens are available for replacement
	assert.notEqual(result[0].result[1][1].indexOf("=/[\\\\-`]/"), -1);

	input = fs.readFileSync("../TestCases/gitHub#47-packer_from93NoReplace.js", { encoding:"utf8"});
	result = RegPack.packer.runPacker(input, options);
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	// And the only block begins with ], no tokens are available for replacement
	assert.notEqual(result[0].result[1][1].indexOf("=/[\\]-`]/"), -1);

}


/**
 * GitHub issue #47 - Use \ and ] (which need escaping) as tokens in packer
 * Test ranges starting or ending with escaped characters
 * with tokens left on the subsequent ranges to perform replacement
 *
 * Associated test file : gitHub#47-packer_to92AndReplace.js
 * Associated test file : gitHub#47-packer_to93AndReplace.js
 * Associated test file : gitHub#47-packer_from92AndReplace.js
 * Associated test file : gitHub#47-packer_from93AndReplace.js
 */

function testEscapedCharacterWithReplacement() {
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
		
	var input = fs.readFileSync("../TestCases/gitHub#47-packer_to92AndReplace.js", { encoding:"utf8"});
	var result = RegPack.packer.runPacker(input, options);
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	// Ranges Y-\\ 0-2, 2 unused, \\ gets replaced with 2
	assert.notEqual(result[0].result[1][1].indexOf("=/[X-[0-2]/"), -1);

	input = fs.readFileSync("../TestCases/gitHub#47-packer_to93AndReplace.js", { encoding:"utf8"});
	result = RegPack.packer.runPacker(input, options);
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	// And the only block ends in ], no tokens are available for replacement
	assert.notEqual(result[0].result[1][1].indexOf("=/[X-[0-2]/"), -1);

	input = fs.readFileSync("../TestCases/gitHub#47-packer_from92AndReplace.js", { encoding:"utf8"});
	result = RegPack.packer.runPacker(input, options);
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	// And the only block begins with \, no tokens are available for replacement
	assert.notEqual(result[0].result[1][1].indexOf("=/[0-3^-`]/"), -1);

	input = fs.readFileSync("../TestCases/gitHub#47-packer_from93AndReplace.js", { encoding:"utf8"});
	result = RegPack.packer.runPacker(input, options);
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	// And the only block begins with ], no tokens are available for replacement
	assert.notEqual(result[0].result[1][1].indexOf("=/[0-2^-a]/"), -1);

}

/**
 * GitHub issue #47 - Use \ and ] (which need escaping) as tokens in packer
 * Test ranges starting or ending with escaped characters
 * with tokens left on the subsequent ranges to perform replacement,
 * but not enough (1 where 2 are needed) -> no replacement is performed
 *
 * Associated test file : gitHub#47-packer_to93ReplaceFails.js
 * Associated test file : gitHub#47-packer_from92ReplaceFails.js
 */
function testEscapedCharacterReplacementFails() {
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
		
	var input = fs.readFileSync("../TestCases/gitHub#47-packer_to93ReplaceFails.js", { encoding:"utf8"});
	var result = RegPack.packer.runPacker(input, options);
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	// Ranges Y-\\ 0-2, 2 unused, \\ gets replaced with 2
	assert.notEqual(result[0].result[1][1].indexOf("=/[X-\\]01]/"), -1);

	input = fs.readFileSync("../TestCases/gitHub#47-packer_from92ReplaceFails.js", { encoding:"utf8"});
	result = RegPack.packer.runPacker(input, options);
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	// And the only block ends in ], no tokens are available for replacement
	assert.notEqual(result[0].result[1][1].indexOf("=/[\\]-`0-2]/"), -1);
}

module.exports = runTests