var RegPack = require("../regPack");
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0076 - text from string read as variables : start");
	testTemplateLiteralInterpretedAsDollarVariable();
	console.log("Issue #0076 - text from string read as variables : done");
}

/**
 * Github issue #76 - Reassign variable names : still considering (but not replacing) text in strings
 * The $ defining the template literal ${..} was recognized as a variable
 * and assigned a replacement. The replacement was not performed inside strings, but this was still the loss of a variable.
 * 
 * Associated test input : same as for #82
 */
function testTemplateLiteralInterpretedAsDollarVariable() {

	var input = "p=c.getImageData(0,0,512,512);d=p.data;for(j=0;j<512;++j){c.fillStyle=`#${`200`,`300`,`fff`,`000`][j&3]}`;d[j*4]=0;d[j*4+1]=255;d[j*4+2]=j>>1;d[j*4+3]=0;c.beginPath();c.moveTo(0,j);c.lineTo(511,j);c.stroke();}";

	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : false,
			contextVariableName : false,
			contextType : parseInt(0),
			reassignVars : true,
			varsNotReassigned : 'abc',
			crushGainFactor : parseFloat(1),
			crushLengthFactor : parseFloat(0),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : "",
			useES6 : true
		};
		
	var result = RegPack.packer.preprocessor.preprocess(input, options);
	
	// Expected result : one template literal inside the string
	assert.equal(result[0].containedTemplateLiterals.length, 1);
	
	// Expected result : the variable $ is not renamed (and there is no variable $)
	// Buggy result : another name is reassigned to $
	assert.equal(result[0].log.indexOf("$ =>"), -1);
	
	// Expected result : $ listed as keyword
	var keywordsOffset = result[0].log.indexOf("in keywords only");
	assert.notEqual(keywordsOffset, -1);
	assert.notEqual(result[0].log.indexOf("$", keywordsOffset), -1);
	
	// Expected result : ${ still present in the string
	assert.notEqual(result[0].contents.indexOf("${"), -1);
}



module.exports = runTests;