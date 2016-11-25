var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");


function runTests() {
	console.log("Issue #0058 - Number as loop variable : start");
	testLettersOnly();
	testProtectedAsMostFrequent();
	testNumberAsMostFrequent();
	console.log("Issue #0058 - Number as loop variable : done");
}


/**
 * Github issue #58 - Digit selected to use as a loop variable
 * Default case with letters only, selecting the most frequent
 *
 * Associated test file : gitHub#58-lettersOnly.js
 */
function testLettersOnly() {
	var input = fs.readFileSync("../TestCases/gitHub#58-lettersOnly.js", { encoding:"utf8"});
		
	var protectedVars=[];
	for (i=0;i<128;++i) {
		protectedVars.push(i>96&&i<100); // true for a, b, c
	}
	var result = RegPack.packer.preprocessor.getMostFrequentLoopVariable(input, protectedVars);
	
	// Expected result : k is the most frequent loop index, and thus selected
	assert.equal(result[0], "k");
}
 
/**
 * Github issue #58 - Digit selected to use as a loop variable
 * Case with letters only, where the most frequent variable is protected
 *
 * Associated test file : gitHub#58-lettersOnly.js
 */
function testProtectedAsMostFrequent() {
	var input = fs.readFileSync("../TestCases/gitHub#58-lettersOnly.js", { encoding:"utf8"});
	
	var protectedVars=[];
	for (i=0;i<128;++i) {
		protectedVars.push((i>96&&i<100)||i==107); // true for a, b, c, k
	}
	var result = RegPack.packer.preprocessor.getMostFrequentLoopVariable(input, protectedVars);
	
	// Expected result : k is the most frequent loop index, however it is protected
	// The function returns the second-most frequent which is p
	assert.equal(result[0], "p");
	
}


/**
 * Github issue #58 - Digit selected to use as a loop variable
 * Case where the most frequent "letter" is actually a digit
 *
 * Associated test file : gitHub#58-numberAsMostFrequent.js
 */
function testNumberAsMostFrequent() {
 	var input = fs.readFileSync("../TestCases/gitHub#58-numberAsMostFrequent.js", { encoding:"utf8"});
	
	var protectedVars=[];
	for (i=0;i<128;++i) {
		protectedVars.push(i>96&&i<100); // true for a, b, c
	}
	var result = RegPack.packer.preprocessor.getMostFrequentLoopVariable(input, protectedVars);
	
	// Expected result : 2 is the most frequent in expressions "for(*" 
	// but not allowed as a variable name. 
	// The function returns the most frequent legal variable name which is p
	assert.equal(result[0], "p");
	
}
 
module.exports = runTests;