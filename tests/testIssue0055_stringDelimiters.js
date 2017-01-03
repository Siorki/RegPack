var RegPack = require("../regPack");
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0055 - string delimiters as tokens : start");
	testUseBackticksForPackedString();
	testBothQuotesUsedNoES6();
	testQuoteAsToken();
	testQuoteReplacement();
	console.log("Issue #0055 - string delimiters as tokens : done");
}

/**
 * Github issue #55 - Harmonize strings delimiters inside the code, to free " or ' as compression token
 * Input code uses both " and ', test that packed string is defined with `
 *
 * Associated test file : gitHub#55-bothQuotesInUse.js
 */
function testUseBackticksForPackedString() {
	var input = fs.readFileSync("../TestCases/gitHub#55-bothQuotesInUse.js", { encoding:"utf8"});
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
			timeVariableName : "",
			useES6 : true
		};
		
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : each stage delimits the packed string with `
	assert.equal(result[0].result[0][1].substr(0, 3), "_=`");
	assert.equal(result[0].result[1][1].substr(0, 7), "for(_=`");
	assert.equal(result[0].result[2][1].substr(0, 7), "for(_=`");
}


/**
 * Github issue #55 - Harmonize strings delimiters inside the code, to free " or ' as compression token
 * Input code uses both " and ', but ES6 (and thus backtick use) disabled
 * Same input file as testUseBackticksForPackedString()
 *
 * Associated test file : gitHub#55-bothQuotesInUse.js
 */
function testBothQuotesUsedNoES6() {
	var input = fs.readFileSync("../TestCases/gitHub#55-bothQuotesInUse.js", { encoding:"utf8"});
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
			timeVariableName : "",
			useES6 : false
		};
		
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : each stage delimits the packed string with " (` is not available)
	assert.equal(result[0].result[0][1].substr(0, 3), '_="');
	assert.equal(result[0].result[1][1].substr(0, 7), 'for(_="');
	assert.equal(result[0].result[2][1].substr(0, 7), 'for(_="');
}


/**
 * Github issue #55 - Harmonize strings delimiters inside the code, to free " or ' as compression token
 * Input code uses neither ' nor ", and all other characters are used
 * Test that either ' or " is used as string delimiter
 *
 * Associated test file : gitHub#55-quotesAsOnlyTokens.js
 */
function testQuoteAsToken() {
	var input = fs.readFileSync("../TestCases/gitHub#55-quotesAsOnlyTokens.js", { encoding:"utf8"});
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
			timeVariableName : "",
			useES6 : true
		};
		
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : one of " and ' is the delimiter, the other one the token
	var delimiterCode = result[0].result[0][1].charCodeAt(2+result[0].result[0][1].indexOf("_="));
	var tokenCode = result[0].result[0][1].charCodeAt(9+result[0].result[0][1].indexOf("for(i of"));
	assert.equal(Math.min(delimiterCode, tokenCode), 34);
	assert.equal(Math.max(delimiterCode, tokenCode), 39);
}

/**
 * Github issue #55 - Harmonize strings delimiters inside the code, to free " or ' as compression token
 * Input code has multiple copies of the same string, each time with different delimiters
 * Test that the delimiter is changed for some strings, so that one is freed for the packed code
 *
 * Associated test file : gitHub#55-sameStringInAllQuotes.js
 */
function testQuoteReplacement() {
	var input = fs.readFileSync("../TestCases/gitHub#55-sameStringInAllQuotes.js", { encoding:"utf8"});
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
			timeVariableName : "",
			useES6 : true
		};
		
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : a quote is used only as delimiter
	var delimiter = result[0].result[0][1][2+result[0].result[0][1].indexOf("_=")];
	var escapedDelimiter = "\\"+delimiter;
	for (var stage=0; stage<3; ++stage) {
		// the only instances of the delimiter are around the string + around the tokens (for crusher stage)
		var delimiterCount = result[0].result[stage][1].match(new RegExp(delimiter, "g")).length;
		assert.equal(delimiterCount, [4, 2, 2][stage]);
		// and the escaped delimiter is not present inside the string
		assert.equal(result[0].result[stage][1].indexOf(escapedDelimiter), -1);
		
	}

}
 

module.exports = runTests;