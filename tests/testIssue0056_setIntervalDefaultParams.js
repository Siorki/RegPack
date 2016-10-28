var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");


function runTests() {
	console.log("Issue #0056 - setInterval() with default params : start");
	testNoAssignment();
	testSingleVariableAssignment();
	testOneAssignment();
	testMultipleAssignments();
	testComplexAssignments();
	console.log("Issue #0056 - setInterval() with default params : done");
}


/**
 * Github issue #56 - default parameter values support for module "refactor to setInterval()"
 * No default value (regression test)
 *
 * Associated test file : gitHub#56-setInterval_arrowNoValue.js
 * Associated test file : gitHub#56-setInterval_standardNoValue.js
 */
function testNoAssignment() {
	var inputArrow = fs.readFileSync("../TestCases/gitHub#56-setInterval_arrowNoValue.js", { encoding:"utf8"});
	var inputStandard = fs.readFileSync("../TestCases/gitHub#56-setInterval_standardNoValue.js", { encoding:"utf8"});
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
	var resultArrow = RegPack.packer.preprocessor.preprocess(inputArrow, options);
	var resultStandard = RegPack.packer.preprocessor.preprocess(inputStandard, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	// Initialization of variable to default value is pushed to the main code
	assert.equal(resultArrow[0].interpreterCall, "setInterval(_,33)");
	assert.equal(resultArrow[0].wrappedInit, "t=0");
	assert.equal(resultArrow[0].contents.indexOf("setInterval"), -1);
	assert.equal(resultArrow[0].contents.indexOf("x,y,z"), -1); // make sure the variable list is discarded
	assert.equal(resultArrow[0].contents.indexOf("z;"), -1); // make sure the last variable is discarded

	assert.equal(resultStandard[0].interpreterCall, "setInterval(_,33)");
	assert.equal(resultStandard[0].wrappedInit, "t=0");
	assert.equal(resultStandard[0].contents.indexOf("setInterval"), -1);
	assert.equal(resultStandard[0].contents, resultArrow[0].contents);	
}


/**
 * Github issue #56 - default parameter values support for module "refactor to setInterval()"
 * Single parameter with default value
 *
 * Associated test file : gitHub#56-setInterval_arrowSingleValue.js
 * Associated test file : gitHub#56-setInterval_standardSingleValue.js
 */
function testSingleVariableAssignment() {
	var inputArrow = fs.readFileSync("../TestCases/gitHub#56-setInterval_arrowSingleValue.js", { encoding:"utf8"});
	var inputStandard = fs.readFileSync("../TestCases/gitHub#56-setInterval_standardSingleValue.js", { encoding:"utf8"});
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
	var resultArrow = RegPack.packer.preprocessor.preprocess(inputArrow, options);
	var resultStandard = RegPack.packer.preprocessor.preprocess(inputStandard, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	// Initialization of variable to default value is pushed at the beginning of the main loop
	assert.equal(resultArrow[0].interpreterCall, "setInterval(_,33)");
	assert.equal(resultArrow[0].wrappedInit, "t=0");
	assert.equal(resultArrow[0].contents.indexOf("setInterval"), -1);
	assert.notEqual(resultArrow[0].contents.indexOf("x=0;if"), -1); 

	assert.equal(resultStandard[0].interpreterCall, "setInterval(_,33)");
	assert.equal(resultStandard[0].wrappedInit, "t=0");
	assert.equal(resultStandard[0].contents.indexOf("setInterval"), -1);
	assert.equal(resultStandard[0].contents, resultArrow[0].contents);	
}

/**
 * Github issue #56 - default parameter values support for module "refactor to setInterval()"
 * Multiple parameters, only one with default value
 *
 * Associated test file : gitHub#56-setInterval_arrowOneValue.js
 * Associated test file : gitHub#56-setInterval_standardOneValue.js
 */
function testOneAssignment() {
	var inputArrow = fs.readFileSync("../TestCases/gitHub#56-setInterval_arrowOneValue.js", { encoding:"utf8"});
	var inputStandard = fs.readFileSync("../TestCases/gitHub#56-setInterval_standardOneValue.js", { encoding:"utf8"});
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
	var resultArrow = RegPack.packer.preprocessor.preprocess(inputArrow, options);
	var resultStandard = RegPack.packer.preprocessor.preprocess(inputStandard, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	// Initialization of variable to default value is pushed at the beginning of the main loop
	assert.equal(resultArrow[0].interpreterCall, "setInterval(_,33)");
	assert.equal(resultArrow[0].wrappedInit, "t=0");
	assert.equal(resultArrow[0].contents.indexOf("setInterval"), -1);
	assert.notEqual(resultArrow[0].contents.indexOf("z=0;if"), -1);

	assert.equal(resultStandard[0].interpreterCall, "setInterval(_,33)");
	assert.equal(resultStandard[0].wrappedInit, "t=0");
	assert.equal(resultStandard[0].contents.indexOf("setInterval"), -1);
	assert.equal(resultStandard[0].contents, resultArrow[0].contents);
	
}


/**
 * Github issue #56 - default parameter values support for module "refactor to setInterval()"
 * Multiple parameters, several ones with default value
 *
 * Associated test file : gitHub#56-setInterval_arrowMultipleValues.js
 * Associated test file : gitHub#56-setInterval_standardMultipleValues.js
 */
function testMultipleAssignments() {
	var inputArrow = fs.readFileSync("../TestCases/gitHub#56-setInterval_arrowMultipleValues.js", { encoding:"utf8"});
	var inputStandard = fs.readFileSync("../TestCases/gitHub#56-setInterval_standardMultipleValues.js", { encoding:"utf8"});
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
	var resultArrow = RegPack.packer.preprocessor.preprocess(inputArrow, options);
	var resultStandard = RegPack.packer.preprocessor.preprocess(inputStandard, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	// Initialization of variable to default values is pushed at the beginning of the main loop
	assert.equal(resultArrow[0].interpreterCall, "setInterval(_,33)");
	assert.equal(resultArrow[0].wrappedInit, "t=0");
	assert.equal(resultArrow[0].contents.indexOf("setInterval"), -1);
	assert.notEqual(resultArrow[0].contents.indexOf("x=2,y=1,z=0;if"), -1);

	assert.equal(resultStandard[0].interpreterCall, "setInterval(_,33)");
	assert.equal(resultStandard[0].wrappedInit, "t=0");
	assert.equal(resultStandard[0].contents.indexOf("setInterval"), -1);
	assert.equal(resultStandard[0].contents, resultArrow[0].contents);
}

/**
 * Github issue #56 - default parameter values support for module "refactor to setInterval()"
 * Multiple parameters, including a complex assignment of several variables in a row (only the first one being a parameter)
 *
 * Associated test file : gitHub#56-setInterval_arrowComplexValues.js
 * Associated test file : gitHub#56-setInterval_standardComplexValues.js
 */
function testComplexAssignments() {
	var inputArrow = fs.readFileSync("../TestCases/gitHub#56-setInterval_arrowComplexValues.js", { encoding:"utf8"});
	var inputStandard = fs.readFileSync("../TestCases/gitHub#56-setInterval_standardComplexValues.js", { encoding:"utf8"});
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
	var resultArrow = RegPack.packer.preprocessor.preprocess(inputArrow, options);
	var resultStandard = RegPack.packer.preprocessor.preprocess(inputStandard, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	// Initialization of variable to default values is pushed at the beginning of the main loop
	assert.equal(resultArrow[0].interpreterCall, "setInterval(_,33)");
	assert.equal(resultArrow[0].wrappedInit, "t=0");
	assert.equal(resultArrow[0].contents.indexOf("setInterval"), -1);
	assert.notEqual(resultArrow[0].contents.indexOf("w=t,x=y=z=0;if"), -1);

	assert.equal(resultStandard[0].interpreterCall, "setInterval(_,33)");
	assert.equal(resultStandard[0].wrappedInit, "t=0");
	assert.equal(resultStandard[0].contents.indexOf("setInterval"), -1);
	assert.equal(resultStandard[0].contents, resultArrow[0].contents);
}


module.exports = runTests;