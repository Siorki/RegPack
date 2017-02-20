var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");


function runTests() {
	console.log("Issue #0072 - setInterval() with empty initialization block : start");
	testInitCodeAtEnd();
	testNoInitCode();

	console.log("Issue #0072 - setInterval() with empty initialization block : done");
}

/**
 * Github issue #72 - do not generate an empty initialization block if there is no init code
 * Make sure the block is created if the init code is at the end
 *
 * Associated test file : inlined
 */
function testInitCodeAtEnd() {
	var input = "t=0;setInterval(function(){t?play():init();t++},33);d=c.getImageData(0,0,640,320)";
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
	// The initialization block is present
	assert.equal(result[0].interpreterCall, "setInterval(_,33)");
	assert.equal(result[0].wrappedInit, "t=0");
	assert.notEqual(result[0].contents.indexOf("if(!t){"), -1);
}


/**
 * Github issue #72 - do not generate an empty initialization block if there is no init code
 * Make sure the block is not added if there is no init code at all - neither at the beginning nor at the end
 *
 * Associated test file : inlined
 */
function testNoInitCode() {
	var input = "t=0;setInterval(function(){t?play():init();t++},33)";
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
	// The initialization block is missing
	assert.equal(result[0].interpreterCall, "setInterval(_,33)");
	assert.equal(result[0].wrappedInit, "t=0");
	assert.equal(result[0].contents.indexOf("if(!t){"), -1);
}

module.exports = runTests;