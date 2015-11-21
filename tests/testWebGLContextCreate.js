var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");


function runTests() {
	console.log("WebGL Context tests : start");
	testCreateExperimentalWebGL();
	testCreateWebGL();
	testCreateBothFirst();
	testCreateBothSecond();
	testCreateOptionsFirst();
	testCreateOptionsSecond();
	testHashCollisions();
	console.log("WebGL Context tests : done");
}


/**
 * Creation of a GL context as "experimental-webgl" only
 *
 * Associated test file : webglContext_create1.js
 */
function testCreateExperimentalWebGL() {
	var input = fs.readFileSync("../TestCases/webglContext_create1.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : true,
			hashAudioContext : false,
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
	
	// Expected result : creation of WebGL Context recognized
	// WebGL-hashed environment added to input lines
	
	assert.equal(result.length, 4);
	assert.notEqual(result[1].name.indexOf("WebGL"), -1);
	assert.notEqual(result[2].name.indexOf("WebGL"), -1);
	assert.notEqual(result[3].name.indexOf("WebGL"), -1);
}


/**
 * Creation of a GL context as "webgl" only
 *
 * Associated test file : webglContext_create2.js
 */
function testCreateWebGL() {
	var input = fs.readFileSync("../TestCases/webglContext_create2.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : true,
			hashAudioContext : false,
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
	
	// Expected result : creation of WebGL Context recognized
	// WebGL-hashed environment added to input lines
	
	assert.equal(result.length, 4);
	assert.notEqual(result[1].name.indexOf("WebGL"), -1);
	assert.notEqual(result[2].name.indexOf("WebGL"), -1);
	assert.notEqual(result[3].name.indexOf("WebGL"), -1);
}

/**
 * Creation of a GL context as either "webgl" or "experimental-webgl" in the same conditional expression
 * (experimental-webgl mentioned first)
 *
 * Associated test file : webglContext_create3.js
 */
function testCreateBothFirst() {
	var input = fs.readFileSync("../TestCases/webglContext_create3.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : true,
			hashAudioContext : false,
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
	
	// Expected result : creation of WebGL Context recognized
	// WebGL-hashed environment added to input lines
	
	assert.equal(result.length, 4);
	assert.notEqual(result[1].name.indexOf("WebGL"), -1);
	assert.notEqual(result[2].name.indexOf("WebGL"), -1);
	assert.notEqual(result[3].name.indexOf("WebGL"), -1);
}


/**
 * Creation of a GL context as either "webgl" or "experimental-webgl" in the same conditional expression
 * (webgl mentioned first)
 *
 * Associated test file : webglContext_create4.js
 */
function testCreateBothSecond() {
	var input = fs.readFileSync("../TestCases/webglContext_create4.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : true,
			hashAudioContext : false,
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
	
	// Expected result : creation of WebGL Context recognized
	// WebGL-hashed environment added to input lines
	
	assert.equal(result.length, 4);
	assert.notEqual(result[1].name.indexOf("WebGL"), -1);
	assert.notEqual(result[2].name.indexOf("WebGL"), -1);
	assert.notEqual(result[3].name.indexOf("WebGL"), -1);
}

/**
 * Creation of a GL context as either "webgl" or "experimental-webgl" in the same conditional expression
 * along with options stored in a variable defined earlier.
 *
 * Associated test file : webglContext_create5.js
 */
function testCreateOptionsFirst() {
	var input = fs.readFileSync("../TestCases/webglContext_create5.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : true,
			hashAudioContext : false,
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
	
	// Expected result : creation of WebGL Context recognized
	// WebGL-hashed environment added to input lines
	
	assert.equal(result.length, 4);
	assert.notEqual(result[1].name.indexOf("WebGL"), -1);
	assert.notEqual(result[2].name.indexOf("WebGL"), -1);
	assert.notEqual(result[3].name.indexOf("WebGL"), -1);
}


/**
 * Creation of a GL context as either "webgl" or "experimental-webgl" in the same conditional expression
 * along with options defined in the same line
 *
 * Associated test file : webglContext_create6.js
 */
function testCreateOptionsSecond() {
	var input = fs.readFileSync("../TestCases/webglContext_create6.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : true,
			hashAudioContext : false,
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
	
	// Expected result : creation of WebGL Context recognized
	// WebGL-hashed environment added to input lines
	
	assert.equal(result.length, 4);
	assert.notEqual(result[1].name.indexOf("WebGL"), -1);
	assert.notEqual(result[2].name.indexOf("WebGL"), -1);
	assert.notEqual(result[3].name.indexOf("WebGL"), -1);
}


/**
 * Detection of hash collisions between two methods, one containing entierly the name of the other
 * Example tested with enable() and enableVertexAttribArray()
 *
 * Associated test file : webglContext_substringHash.js
 */
function testHashCollisions() {
	var input = fs.readFileSync("../TestCases/webglContext_substringHash.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : true,
			hashAudioContext : false,
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
	
	// Expected result : hashed value for both enable() and enableVertexAttribArray() is different
	// upon hashing methods
	var hash1Match = result[1].contents.match(/gl\.(\w*)\(gl.DEPTH_TEST/);
	var hash1Value = hash1Match[1];
	var hash2Match = result[1].contents.match(/gl\.(\w*)\(\);/);
	var hash2Value = hash2Match[1];
	assert.notEqual(hash1Value, hash2Value);
	
	// and same result upon hashing properties
	hash1Match = result[3].contents.match(/gl\[gl\.(\w*)\]\(gl\[gl.(\w*)\]\);/);
	hash1Value = hash1Match[1];
	hash2Match = result[3].contents.match(/gl\[gl\.(\w*)\]\(\);/);
	hash2Value = hash2Match[1];
	assert.notEqual(hash1Value, hash2Value);
}

module.exports = runTests;