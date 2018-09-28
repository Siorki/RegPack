var RegPack = require("../regPack");
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0082 - backticks in template literals : start");
	testUseBackticksForPackedString();
	testBackticksEscapingInTemplateLiteral();
	console.log("Issue #0082 - backticks in template literals : done");
}



/**
 * Github issue #82 - Backticks in template literal incorrectly read as end of string
 * An expression is defined with the construct ` ${variable+`other string`}`
 * The backticks inside the template literal ${} do not mark the end of the `-delimited string
 *
 */
function testUseBackticksForPackedString() {
	var input = "p=c.getImageData(0,0,512,512);d=p.data;for(j=0;j<512;++j){c.fillStyle=`#${`200`,`300`,`fff`,`000`][j&3]}`;d[j*4]=0;d[j*4+1]=255;d[j*4+2]=j>>1;d[j*4+3]=0;c.beginPath();c.moveTo(0,j);c.lineTo(511,j);c.stroke();}";
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : false,
			contextVariableName : false,
			contextType : parseInt(0),
			reassignVars : true,
			varsNotReassigned : [],
			crushGainFactor : parseFloat(2),
			crushLengthFactor : parseFloat(1),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : "",
			useES6 : true
		};
		
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	
	// Expected result : only one string is found within the input, not five
	assert.equal(result[0].containedStrings.length, 1);
	
	// Expected result : the variable j is renamed throughout the input, not a single copy remains
	// Buggy result : in "[j&3]", j is not renamed
	assert.equal(result[0].contents.indexOf("j"), -1);
}

/**
 * Github issue #82 - Backticks in template literal incorrectly read as end of string
 * After fixing the main issue, the string is considered as a whole (good)
 * however the backticks inside are escaped \` (bad)
 * 
 * Since the string's delimiter do not change (to preserve the template literal)
 * escaping the backticks is not needed
 */
function testBackticksEscapingInTemplateLiteral() {
	
	var input = "p=c.getImageData(0,0,512,512);d=p.data;for(j=0;j<512;++j){c.fillStyle=`#${`200`,`300`,`fff`,`000`][j&3]}`;d[j*4]=0;d[j*4+1]=255;d[j*4+2]=j>>1;d[j*4+3]=0;c.beginPath();c.moveTo(0,j);c.lineTo(511,j);c.stroke();}";
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : false,
			contextVariableName : false,
			contextType : parseInt(0),
			reassignVars : true,
			varsNotReassigned : [],
			crushGainFactor : parseFloat(2),
			crushLengthFactor : parseFloat(1),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : "",
			useES6 : true
		};
		
	var result = RegPack.packer.preprocessor.preprocess(input, options);

	// Expected result : no escaped backticks inside the preprocessed string
	assert.equal(result[0].contents.indexOf("\\`"), -1);
}

module.exports = runTests;