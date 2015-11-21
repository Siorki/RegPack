var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");


function runTests() {
	console.log("AudioContext tests : start");
	testAssignInIfThenElse();
	testCreateToDifferentVariablesFirst();
	testCreateToDifferentVariablesSecond();
	testAssignInConditionalExpression();
	console.log("AudioContext tests : done");
}


/**
 * Creation of either AudioContext or webkitAudioContext in the then/else
 * statements of the same test, both stored in the same variable.
 *
 * Associated test file : audioContext_create1.js
 */
function testAssignInIfThenElse() {
	var input = fs.readFileSync("../TestCases/audioContext_create1.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : true,
			contextVariableName : false,
			contextType : parseInt(0),
			reassignVars : true,
			varsNotReassigned : [],
			crushGainFactor : parseFloat(2),
			crushLengthFactor : parseFloat(1),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : ""
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : creation of AudioContext recognized
	// Audio-hashed environment added to input lines
	
	assert.equal(result.length, 2);
	assert.equal(result[1].name, " Audio");
}

/**
 * Creation of either AudioContext or webkitAudioContext assigned to different variables.
 * AudioContext tested first.
 *
 * Associated test file : audioContext_create2.js
 */
function testCreateToDifferentVariablesFirst() {
	var input = fs.readFileSync("../TestCases/audioContext_create2.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : true,
			contextVariableName : false,
			contextType : parseInt(0),
			reassignVars : true,
			varsNotReassigned : [],
			crushGainFactor : parseFloat(2),
			crushLengthFactor : parseFloat(1),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : ""
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : creation of AudioContext recognized
	// Audio-hashed environment added to input lines
	
	assert.equal(result.length, 2);
	assert.equal(result[1].name, " Audio");
}

/**
 * Creation of either AudioContext or webkitAudioContext assigned to different variables.
 * webkitAudioContext tested first.
 *
 * Associated test file : audioContext_create3.js
 */
function testCreateToDifferentVariablesSecond() {
	var input = fs.readFileSync("../TestCases/audioContext_create3.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : true,
			contextVariableName : false,
			contextType : parseInt(0),
			reassignVars : true,
			varsNotReassigned : [],
			crushGainFactor : parseFloat(2),
			crushLengthFactor : parseFloat(1),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : ""
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : creation of AudioContext recognized
	// Audio-hashed environment added to input lines
	
	assert.equal(result.length, 2);
	assert.equal(result[1].name, " Audio");
}

/**
 * Creation of either AudioContext or webkitAudioContext in the same conditional expression
 *
 * Associated test file : audioContext_create4.js
 */
function testAssignInConditionalExpression() {
	var input = fs.readFileSync("../TestCases/audioContext_create4.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : true,
			contextVariableName : false,
			contextType : parseInt(0),
			reassignVars : true,
			varsNotReassigned : [],
			crushGainFactor : parseFloat(2),
			crushLengthFactor : parseFloat(1),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : ""
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : creation of AudioContext recognized
	// Audio-hashed environment added to input lines
	
	assert.equal(result.length, 2);
	assert.equal(result[1].name, " Audio");
}

module.exports = runTests;