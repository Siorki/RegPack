var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0017 - Multiple contexts : start");
	testMultipleContexts();
	console.log("Issue #0017 - Multiple contexts : done");
}


/**
 * Github issue #17 - Support for multiple contexts of the same type
 * Make sure all contexts of a given type are hashed at the same time
 * Erroneous behavior : hashing only the first context, but using renamed methods for all of them
 *
 * Associated test file : gitHub#17-multipleContexts.js
 */
function testMultipleContexts() {
	var input = fs.readFileSync("../TestCases/gitHub#17-multipleContexts.js", { encoding:"utf8"});
	var options = {
			withMath : false,
			hash2DContext : true,
			hashWebGLContext : false,
			hashAudioContext : false,
			contextVariableName : "c",
			contextType : parseInt(0),
			reassignVars : false,
			varsNotReassigned : ['a', 'b', 'c'],
			crushGainFactor : parseFloat(2),
			crushLengthFactor : parseFloat(1),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : ""
		};
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : methods for both c and cc are hashed
	// when performed on 2D methods (not 2D properties which are not concerned with the bug)
	assert.notEqual(result[1].contents.indexOf("c[i[0]+i[6]]=cc[i[0]+i[6]]=c[i]"), -1);
}

module.exports = runTests;