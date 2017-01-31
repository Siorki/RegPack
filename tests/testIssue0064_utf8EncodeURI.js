var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0064 - EncodeURI in UTF-8 : start");
	testEncodeURI();
	console.log("Issue #0064 - EncodeURI in UTF-8 : done");
}


/**
 * Github issue #64 - Accept unicode characters
 * Make sure the Unicode characters are explicitely filtered out
 * by the RegExp in the negated char class
 *
 * Associated test file : gitHub#64-URIError.js
 */
function testEncodeURI() {
	var input = fs.readFileSync("../TestCases/gitHub#64-URIError.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : false,
			contextVariableName : false,
			contextType : parseInt(0),
			reassignVars : false,
			varsNotReassigned : [],
			crushGainFactor : parseFloat(1),
			crushLengthFactor : parseFloat(0),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : ""
		};
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : internal check successful, 
	// and the unicode characters are excluded from the token range
	assert.notEqual(result[0].result[2][1].indexOf("uffff]"), -1);
	assert.notEqual(result[0].result[2][2].indexOf("Final check : passed"), -1);
}

module.exports = runTests;