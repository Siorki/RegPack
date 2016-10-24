var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");


function runTests() {
	console.log("Issue #0044 - setInterval() with arrow function : start");
	testMultipleParametersMultipleParams();
	testSingleParameter();
	testNoParameter();

	console.log("Issue #0044 - setInterval() with arrow function : done");
}

/**
 * Github issue #44 - arrow function support for module "refactor to setInterval()"
 * Multiple parameters in arrow function, none is initialized there
 *
 * Associated test file : gitHub#44-setInterval_arrowFunctionMultiParam.js
 */
function testMultipleParametersMultipleParams() {
	var input = fs.readFileSync("../TestCases/gitHub#44-setInterval_arrowFunctionMultiParam.js", { encoding:"utf8"});
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
			wrapInSetInterval : true,
			timeVariableName : "t",
			useES6 : true
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result[0].interpreterCall, "setInterval(_,33)");
	assert.equal(result[0].wrappedInit, "t=0");
	assert.equal(result[0].contents.indexOf("setInterval"), -1);
}


/**
 * Github issue #44 - arrow function support for module "refactor to setInterval()"
 * Multiple parameters in arrow function, variable is initialized there
 *
 * Associated test file : gitHub#44-setInterval_arrowFunctionMultiParamInit.js
 */
function testMultipleParametersWithInit() {
	var input = fs.readFileSync("../TestCases/gitHub#44-setInterval_arrowFunctionMultiParamInit.js", { encoding:"utf8"});
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
			wrapInSetInterval : true,
			timeVariableName : "t",
			useES6 : true
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result[0].interpreterCall, "setInterval(_,33)");
	assert.equal(result[0].wrappedInit, "t=0");
	assert.equal(result[0].contents.indexOf("setInterval"), -1);
}

/**
 * Github issue #44 - arrow function support for module "refactor to setInterval()"
 * Single parameter function with no parenthesis
 *
 * Associated test file : gitHub#44-setInterval_arrowFunctionSingleParam.js
 */
function testSingleParameter() {
	var input = fs.readFileSync("../TestCases/gitHub#44-setInterval_arrowFunctionSingleParam.js", { encoding:"utf8"});
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
			wrapInSetInterval : true,
			timeVariableName : "t",
			useES6 : true
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result[0].interpreterCall, "setInterval(_,33)");
	assert.equal(result[0].wrappedInit, "t=0");
	assert.equal(result[0].contents.indexOf("setInterval"), -1);
}


/**
 * Github issue #44 - arrow function support for module "refactor to setInterval()"
 * Function with no parameter
 *
 * Associated test file : gitHub#44-setInterval_arrowFunctionNoParam.js
 */
function testNoParameter() {
	var input = fs.readFileSync("../TestCases/gitHub#44-setInterval_arrowFunctionNoParam.js", { encoding:"utf8"});
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
			wrapInSetInterval : true,
			timeVariableName : "t",
			useES6 : true
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result[0].interpreterCall, "setInterval(_,33)");
	assert.equal(result[0].wrappedInit, "t=0");
	assert.equal(result[0].contents.indexOf("setInterval"), -1);
}

module.exports = runTests;