var RegPack = require("../regPack");
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0063 - getContext`param` : start");
	testBacktick2DContext();
	testBacktickWebGLContext();
	console.log("Issue #0063 - getContext`param` : done");
}

/**
 * Github issue #63 - Backtick use as wrapper for single function param : foo`x` instead of foo("x")
 * Identify 2d context created by  getContext`2d`
 *
 * Associated test file : gitHub#63-backtick2DContext.js
 */
function testBacktick2DContext() {
	var input = fs.readFileSync("../TestCases/gitHub#63-backtick2DContext.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : true,
			hashWebGLContext : true,
			hashAudioContext : true,
			contextVariableName : false,
			contextType : parseInt(0),
			reassignVars : true,
			varsNotReassigned : "abcdg",
			crushGainFactor : parseFloat(2),
			crushLengthFactor : parseFloat(1),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : "",
			useES6 : true
		};
		
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the 2d context is recognized
	assert.equal(result.length, 3);
	assert.notEqual(result[1].name.indexOf("2D"), -1);
	assert.notEqual(result[2].name.indexOf("2D"), -1);
}

function testBacktickWebGLContext() {
	var input = fs.readFileSync("../TestCases/gitHub#63-backtickWebGLContext.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : true,
			hashWebGLContext : true,
			hashAudioContext : true,
			contextVariableName : false,
			contextType : parseInt(0),
			reassignVars : true,
			varsNotReassigned : "abcdg",
			crushGainFactor : parseFloat(2),
			crushLengthFactor : parseFloat(1),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : "",
			useES6 : true
		};
		
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the WebGL context is recognized
	assert.equal(result.length, 4);
	assert.notEqual(result[1].name.indexOf("WebGL"), -1);
	assert.notEqual(result[2].name.indexOf("WebGL"), -1);
	assert.notEqual(result[3].name.indexOf("WebGL"), -1);
}


module.exports = runTests;