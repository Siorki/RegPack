var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");


function runTests() {
	console.log("Issue #0019 - setInterval() : start");
	testTimeVariableDeclaredAlone();
	testTimeVariableDeclaredAtBegin1();
	testTimeVariableDeclaredAtBegin2();
	testTimeVariableDeclaredAtEnd1();
	testTimeVariableDeclaredAtEnd2();
	testTimeVariableDeclarationChainedFirst();
	testTimeVariableDeclarationChainedSecond();
	testTimeVariableDeclarationInArrayFirst();
	testTimeVariableDeclarationInArraySecond();
	testTimeVariableDeclarationInFunctionParameterFirst();
	testTimeVariableDeclarationInFunctionParameterSecond();
	testTimeVariableDeclarationInFunctionParameterLast();
	console.log("Issue #0019 - setInterval() : done");
}

/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared and assigned alone, in the middle of other code (...;t=0;...)
 *
 * Associated test file : gitHub#19-setInterval_declarationAlone.js
 */
function testTimeVariableDeclaredAlone() {
	var input = fs.readFileSync("../TestCases/gitHub#19-setInterval_declarationAlone.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}


/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared and assigned alone, at the beginning of the code, with a semicolon afterwards (t=0;...)
 *
 * Associated test file : gitHub#19-setInterval_declarationAtBegin1.js
 */
function testTimeVariableDeclaredAtBegin1() {
	var input = fs.readFileSync("../TestCases/gitHub#19-setInterval_declarationAtBegin1.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}

/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared and assigned alone, at the beginning of the code, with a comma afterwards (t=0,...)
 *
 * Associated test file : gitHub#19-setInterval_declarationAtBegin2.js
 */
function testTimeVariableDeclaredAtBegin2() {
	var input = fs.readFileSync("../TestCases/gitHub#19-setInterval_declarationAtBegin2.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}


/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared and assigned alone, at the beginning of the code, with a comma afterwards (t=0,...)
 *
 * Associated test file : gitHub#19-setInterval_declarationAtBegin2.js
 */
function testTimeVariableDeclaredAtBegin2() {
	var input = fs.readFileSync("../TestCases/gitHub#19-setInterval_declarationAtBegin2.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}


/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared and assigned at the end of the init code,
 * right before the setInterval(), with a semicolon before (;t=0;setInterval...)
 *
 * Associated test file : gitHub#19-setInterval_declarationAtEnd1.js
 */
function testTimeVariableDeclaredAtEnd1() {
	var input = fs.readFileSync("../TestCases/gitHub#19-setInterval_declarationAtEnd1.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}


/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared and assigned at the end of the init code,
 * right before the setInterval(), with a comma before (,t=0;setInterval...)
 *
 * Associated test file : gitHub#19-setInterval_declarationAtEnd2.js
 */
function testTimeVariableDeclaredAtEnd2() {
	var input = fs.readFileSync("../TestCases/gitHub#19-setInterval_declarationAtEnd2.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}

/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared in the same statement as another variable,
 * t coming first (t=u=0)
 *
 * Associated test file : gitHub#19-setInterval_declarationChained1.js
 */
function testTimeVariableDeclarationChainedFirst() {
	var input = fs.readFileSync("../TestCases/gitHub#19-setInterval_declarationChained1.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}

/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared in the same statement as another variable,
 * t coming second (u=t=0)
 *
 * Associated test file : gitHub#19-setInterval_declarationChained2.js
 */
function testTimeVariableDeclarationChainedSecond() {
	var input = fs.readFileSync("../TestCases/gitHub#19-setInterval_declarationChained2.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}


/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared in an array definition, as first member (p=[t=0,...])
 *
 * Associated test file : gitHub#19-setInterval_declarationInArray1.js
 */
function testTimeVariableDeclarationInArrayFirst() {
	var input = fs.readFileSync("../TestCases/gitHub#19-setInterval_declarationInArray1.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}


/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared in an array definition, as second member (p=[n,t=0,...])
 *
 * Associated test file : gitHub#19-setInterval_declarationInArray2.js
 */
function testTimeVariableDeclarationInArraySecond() {
	var input = fs.readFileSync("../TestCases/gitHub#19-setInterval_declarationInArray2.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}


/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared and initialized as the first parameter passed to a function 
 * f(t=0,...)
 * 
 * Associated test file : gitHub#19-gitHub#19-setInterval_declarationInFunction1.js
 */
function testTimeVariableDeclarationInFunctionParameterFirst() {
	var input = fs.readFileSync("../TestCases/gitHub#19-gitHub#19-setInterval_declarationInFunction1.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}


/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared and initialized as a parameter passed to a function 
 * (not the first nor the last one) : f(..., t=0,...)
 * 
 * Associated test file : gitHub#19-gitHub#19-setInterval_declarationInFunction2.js
 */
function testTimeVariableDeclarationInFunctionParameterSecond() {
	var input = fs.readFileSync("../TestCases/gitHub#19-gitHub#19-setInterval_declarationInFunction2.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}


/**
 * Github issue #19 - use setInterval() to evaluate the unpacked code
 * Time variable t declared and initialized as the last parameter passed to a function 
 * f(..., t=0)
 * 
 * Associated test file : gitHub#19-gitHub#19-setInterval_declarationInFunction3.js
 */
function testTimeVariableDeclarationInFunctionParameterLast() {
	var input = fs.readFileSync("../TestCases/gitHub#19-gitHub#19-setInterval_declarationInFunction3.js", { encoding:"utf8"});
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
			timeVariableName : "t"
		};
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assert.equal(result.interpreterCall, "setInterval(_,33)");
	assert.equal(result.wrappedInit, "t=0");
	assert.equal(result.contents.indexOf("setInterval"), -1);
}

module.exports = runTests;