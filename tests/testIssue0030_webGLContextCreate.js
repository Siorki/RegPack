var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");


function runTests() {
	console.log("Issue #0030 - WebGL create with ! : start");
	testCreateExclamationMarkInOptions();
	console.log("Issue #0030 - WebGL create with ! : done");
}


/**
 * Github issue #30 - [description]
 * Creation of a GL context with "!" in the options string
 *
 * Associated test file : gitHub#30-webglContext_create_charset.js
 */
function testCreateExclamationMarkInOptions() {
	var input = fs.readFileSync("../TestCases/gitHub#30-webglContext_create_charset.js", { encoding:"utf8"});
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

module.exports = runTests;