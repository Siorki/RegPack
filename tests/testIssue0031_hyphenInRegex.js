var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");


function runTests() {
	console.log("Issue #0031 - Hyphen in Regex : start");
	testDirectSingleHyphen();
	testDirectHyphenBeginsBlock();
	testDirectHyphenEndsBlock();
	testNegatedSingleHyphen();
	testNegatedHyphenBeginsBlock();
	testNegatedHyphenEndBlock();
	console.log("Issue #0031 - Hyphen in Regex : done");
}


/**
 * Github issue #31 - Single "-" character misinterpreted as range in RegExp
 * Packing generates a "-" in the regex in a block of 1 (single in the block)
 *
 * Associated test file : gitHub#31-direct-singleHyphen.js
 */
function testDirectSingleHyphen() {
	var input = fs.readFileSync("../TestCases/gitHub#31-direct-singleHyphen.js", { encoding:"utf8"});
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
			timeVariableName : ""
		};
		
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);

	
}
 
/**
 * Github issue #31 - Single "-" character misinterpreted as range in RegExp
 * Packing generates a "-" as the beginning of a block : [--0] (encompassing - . / 0)
 *
 * Associated test file : gitHub#31-direct-hyphenBeginsBlock.js
 */
function testDirectHyphenBeginsBlock() {
 	var input = fs.readFileSync("../TestCases/gitHub#31-direct-hyphenBeginsBlock.js", { encoding:"utf8"});
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
			timeVariableName : ""
		};
		
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	
}

/**
 * Github issue #31 - Single "-" character misinterpreted as range in RegExp
 * Packing generates a "-" as the end of a block : [*--] (encompassing * + , -)
 *
 * Associated test file : gitHub#31-direct-hyphenEndsBlock.js
 */
function testDirectHyphenEndsBlock() {
 	var input = fs.readFileSync("../TestCases/gitHub#31-direct-hyphenEndsBlock.js", { encoding:"utf8"});
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
			timeVariableName : ""
		};
		
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[1][2].indexOf("Final check : passed"), -1);
	
}

  
/**
 * Github issue #31 - Single "-" character misinterpreted as range in RegExp
 * Negated char class contains a "-" as the beginning of a block : [^--z] (encompassing everything but - to z)
 *
 * Associated test file : gitHub#31-negated-singleHyphen.js
 */
function testNegatedSingleHyphen() {
 	var input = fs.readFileSync("../TestCases/gitHub#31-negated-singleHyphen.js", { encoding:"utf8"});
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
			timeVariableName : ""
		};
		
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[2][2].indexOf("Final check : passed"), -1);
	
}

  
/**
 * Github issue #31 - Single "-" character misinterpreted as range in RegExp
 * Negated char class contains a "-" as the beginning of a block : [^--z] (encompassing everything but - to z)
 *
 * Associated test file : gitHub#31-negated-hyphenBeginsBlock.js
 */
function testNegatedHyphenBeginsBlock() {
 	var input = fs.readFileSync("../TestCases/gitHub#31-negated-hyphenBeginsBlock.js", { encoding:"utf8"});
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
			timeVariableName : ""
		};
		
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[2][2].indexOf("Final check : passed"), -1);
	
}

   
/**
 * Github issue #31 - Single "-" character misinterpreted as range in RegExp
 * Negated char class contains a "-" as the end of a block : [^C--] (encompassing everything but C (a control character) to -)
 *
 * Associated test file : gitHub#31-negated-hyphenEndsBlock.js
 */
function testNegatedHyphenEndBlock() {
 	var input = fs.readFileSync("../TestCases/gitHub#31-negated-hyphenEndsBlock.js", { encoding:"utf8"});
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
			timeVariableName : ""
		};
		
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : the regular expression decodes correctly
	assert.notEqual(result[0].result[2][2].indexOf("Final check : passed"), -1);
	
}

 
module.exports = runTests;