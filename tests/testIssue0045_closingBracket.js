var RegPack = require("../regPack")
var assert = require("assert");

function runTests() {
	console.log("Issue #0045 - ] in character class : start");
	testBracketBeginsBlock();
	console.log("Issue #0045 - ] in character class : done");
}

function testBracketBeginsBlock() {
 	var input = "=-=A==1234567=-=A-=A-1234567890AB=-A=-A=67890AB";
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
	// And it should not contain ] in the character class
	assert.equal(result[0].result[1][1].indexOf("[]"), -1);
}

module.exports = runTests;