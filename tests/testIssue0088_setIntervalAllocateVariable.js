var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0088 - variable allocation for setInterval() : start");
	testVariableAllocation();
	console.log("Issue #0088 - variable allocation for setInterval() : done");
}


/**
 * GitHub issue #88 - allocateNewVariable() crashes after being given incorrect parameters
 * Crash happens when the module "Refactor with setInterval()" is called without being given a time variable
 * (meaning it has to allocate and declare its own variable)
 *
 * Reusing test case from issue #19, with different parameters
 *
 * Associated test file : gitHub#19-setInterval_declarationAlone.js
 */
function testVariableAllocation() {
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
		crushGainFactor : parseFloat(1),
		crushLengthFactor : parseFloat(0),
		crushCopiesFactor : parseFloat(0),
		crushTiebreakerFactor : parseInt(1),
		wrapInSetInterval : true,
		timeVariableName : "",
		useES6 : true
	};
	
	var output = RegPack.packer.preprocessor.preprocess(input, options);

	// Expected result : the encapsulation in setInterval is performed 
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	// And a time variable is allocated (and it does not crash)
	assert.equal(output[0].interpreterCall, "setInterval(_,33)");
	assert.equal(output[0].wrappedInit.substr(1,2), "=0");
	
}



module.exports = runTests