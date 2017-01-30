var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");


function runTests() {
	console.log("Issue #0057 - Renaming of variable $ in string : start");
	testLettersOnly();
	console.log("Issue #0057 - Renaming of variable $ in string : done");
}


/**
 * Github issue #57 - collisiion between ES6 string substitution expression ${...} and variable $
 * RegPack incorrectly replaces the $ in ${i}
 *
 * Associated test file : gitHub#57-templateLiteralOneVariable.js
 */
function testLettersOnly() {
	var input = fs.readFileSync("../TestCases/gitHub#57-templateLiteralOneVariable.js", { encoding:"utf8"});
	var options = {
		withMath : false,
		hash2DContext : true,
		hashWebGLContext : true,
		hashAudioContext : true,
		contextVariableName : false,
		contextType : parseInt(0),
		reassignVars : true,
		varsNotReassigned : "",
		crushGainFactor : parseFloat(1),
		crushLengthFactor : parseFloat(0),
		crushCopiesFactor : parseFloat(0),
		crushTiebreakerFactor : parseInt(1),
		wrapInSetInterval : false,
		timeVariableName : "",
		useES6 : true
	};

	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : k is the most frequent loop index, and thus selected
	var preprocessed = result[0].contents;
	// $ in ${ is not replaced
	assert.notEqual(preprocessed.indexOf("c.fillStyle=`hsl(256,25%,${"), -1);
	// T in ${... T ...} is replaced
	assert.equal(preprocessed.indexOf("c.fillStyle=`hsl(256,25%,${Math.max(0,100-T)"), -1);
	
}
 
 
module.exports = runTests;