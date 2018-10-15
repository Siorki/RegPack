var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0085 - \\ not counted as length 2 : start");
	testBackslashSequence();
	testFlappyDragon();
	console.log("Issue #0085 - \\ not counted as length 2 : done");
}


/**
 * GitHub issue #85 - backslash \ counted as length 1 instead of 2
 * resulting in \\\\ sequence reckoned not to be worth packing
 *
 * Example written for issue #85
 *
 * Associated test file : gitHub#85-backslashSequence.js
 */
function testBackslashSequence() {
	var input = fs.readFileSync("../TestCases/gitHub#85-backslashSequence.js", { encoding:"utf8"});
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
	
	// Expected result : the regular expression decodes correctly and matches the original code
	assert.notEqual(output[0].result[1][2].indexOf("Final check : passed"), -1);
	assert.notEqual(output[0].result[2][2].indexOf("Final check : passed"), -1);

	// Expected result : the sequence \\\\ is packed
	assert.notEqual(output[0].result[0][2].indexOf("str = \\\\"), -1);
	assert.notEqual(output[0].result[1][2].indexOf("str = \\\\"), -1);
	assert.notEqual(output[0].result[2][2].indexOf("str = \\\\"), -1);
	
}


/**
 * GitHub issue #85 - backslash \ counted as length 1 instead of 2
 * resulting in \\\\ sequence reckoned not to be worth packing
 *
 * Original example filed with issue #85
 *
 * Associated test file : gitHub#85-flappyDragon.js
 */
function testFlappyDragon() {
	var input = fs.readFileSync("../TestCases/gitHub#85-flappyDragon.js", { encoding:"utf8"});
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
	
	// Expected result : the regular expression decodes correctly and matches the original code
	assert.notEqual(output[0].result[1][2].indexOf("Final check : passed"), -1);
	assert.notEqual(output[0].result[2][2].indexOf("Final check : passed"), -1);

	// Expected result : the sequence \\\\ is packed
	assert.notEqual(output[0].result[0][2].indexOf("str = \\\\"), -1);
	assert.notEqual(output[0].result[1][2].indexOf("str = \\\\"), -1);
	assert.notEqual(output[0].result[2][2].indexOf("str = \\\\"), -1);
	
}

module.exports = runTests