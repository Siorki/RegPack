var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0059 - exhaustive merge in negated char class : start");
	testRangeMerge1vs3();
	console.log("Issue #0059 - exhaustive merge in negated char class : done");
}


/**
 * GitHub issue #59 - when merging range to shorten the negated char class,
 * the original algorithm ends on a suboptimal solution
 * with 4 credits left, it chooses an option which gains 1 for 1 instead of one that gains 3 for 4
 *
 * Associated test file : gitHub#59-negatedRangeMerge-1vs3.js
 */
function testRangeMerge1vs3() {
	var input = fs.readFileSync("../TestCases/gitHub#59-negatedRangeMerge-1vs3.js", { encoding:"utf8"});
	var options = {
		withMath : false,
		hash2DContext : false,
		hashWebGLContext : false,
		hashAudioContext : false,
		hashAllObjects : false,
		contextVariableName : false,
		contextType : parseInt(0),
		reassignVars : false,
		varsNotReassigned : [],
		crushGainFactor : parseFloat(1),
		crushLengthFactor : parseFloat(0),
		crushCopiesFactor : parseFloat(0),
		crushTiebreakerFactor : parseInt(1),
		wrapInSetInterval : false,
		timeVariableName : "",
		useES6 : true
	};
	
	var output = RegPack.packer.runPacker(input, options);
	
	// Expected result : the range 0-3 is merged (gain 3, cost 4), leaving only } as a token
	// Incorrect result : the range } is merged (gain 1, cost 1), leaving 0-3 as tokens, 0 is used
	var negatedCharClassModuleLog = output[0].result[2][2];
	var rangePos = negatedCharClassModuleLog.indexOf(", str = abcd");
	var tokenLog = negatedCharClassModuleLog.substr(rangePos-6, 6);
	assert.equal(tokenLog, "125(})");
}


module.exports = runTests