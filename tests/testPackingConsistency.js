var RegPack = require("../regPack");
var fs = require("fs");
var assert = require("assert");


function runTests() {
	console.log("Packing consistency tests : start");
	testConsistency("../TestCases/gitHub#9-hashloop.js");
	testConsistency("../TestCases/gitHub#17-multipleContexts.js");
	testConsistency("../TestCases/gitHub#19-setInterval_declarationAlone.js");
	testConsistency("../TestCases/gitHub#30-webglContext_create_charset.js");
	testConsistency("../TestCases/gitHub#31-direct-hyphenBeginsBlock.js");
	testConsistency("../TestCases/gitHub#44-setInterval_arrowFunctionMultiParam.js");
	testConsistency("../TestCases/hash_using_length.js");
	console.log("Packing consistency tests : done");
}

/**
 * Unpacks a compressed string, independently of the wrapper (crusher or packer)
 */
function unpack(packedCode) {
	var callFunction = "eval(";
	var packedStringVarOffset = packedCode.lastIndexOf(callFunction);
	if (packedStringVarOffset == -1) {
		callFunction = "setInterval(";
		packedStringVarOffset= packedCode.lastIndexOf(callFunction);
	}
	if (packedStringVarOffset == -1) {
		// no unpacking routine found : code is not packed
		return packedCode;
	}
	packedStringVarOffset+=callFunction.length;
	var packedStringVar = packedCode[packedStringVarOffset];
	
	// look for packed string : 
	var packedStringBegin = packedCode.indexOf(packedStringVar+"=");
	var packedStringDelimiter = packedCode[packedStringBegin+2];
	var packedStringEnd = packedCode.lastIndexOf(packedStringDelimiter);
	
	var packedString = packedCode.substring(packedStringBegin+3, packedStringEnd);
	var originalString = packedString.replace(new RegExp("\\"+packedStringDelimiter, "g"), packedStringDelimiter);

	
	var beginRegPack = packedCode.indexOf("=/", packedStringEnd);
	if (beginRegPack>0) {	// RegPack marker identified
		var endRegPack = packedCode.indexOf("/.exec", beginRegPack);
		var tokenString = packedCode.substring(beginRegPack+2, endRegPack);
		var regToken = new RegExp(tokenString,"");
		for(var token="" ; token = regToken.exec(originalString) ; ) {
			var k = originalString.split(token);
			originalString = k.join(k.shift());
		}
	} else {
		var tokensEnd = packedStringEnd;
		var tokensBegin = packedCode.lastIndexOf(packedStringDelimiter, tokensEnd-1);
		packedStringEnd = packedCode.lastIndexOf(packedStringDelimiter, tokensBegin-1);
		
		if (packedStringEnd > 0) {	// JSCrush / FirstCrush marker identified
			packedString = packedCode.substring(packedStringBegin+3, packedStringEnd);
			originalString = packedString.replace(new RegExp("\\"+packedStringDelimiter, "g"), packedStringDelimiter);
			
			var tokenString= packedCode.substring(tokensBegin+1, tokensEnd);
			for (var i in tokenString) {
				var k = originalString.split(tokenString[i])
				originalString = k.join(k.pop());
			}
		} 
	}
	return originalString.replace(/\\\\/g,'\\');

}

/**
 * Improved assert that two strings match
 * In case of mismatch, show the first difference
 */
function assertEqualStrings(actual, expected) {
	assert.equal(actual.length, expected.length);
	var delta=0;
	for (var i=0; i<actual.length; ++i) {
		if (actual[i] != expected[i]) {
			console.log ("Difference at char "+i+", actual : "+actual.substr(Math.max(0,i-3),10)+"("+actual.charCodeAt(i)+"), expected : "+expected.substr(Math.max(0,i-3),10)+"("+expected.charCodeAt(i)+")");
			i+=5;
			if (++delta>10) {
				break;
			}
		}
	}
	assert.equal(actual, expected);
}


/**
 * This test runs in an input through the crusher and packer stages,
 * then unpacks it and compares with the original. The two must match.
 */
function testConsistency(inputFile) {
	var input = fs.readFileSync(inputFile, { encoding:"utf8"});
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
			timeVariableName : "",
			useES6 : true
		};
	var output = RegPack.packer.runPacker(input, options);
	
	// Expected result : the compressed result at each stage matches the input
	// References to "setInterval" are removed from the main code and pushed to the encapsulating call
	assertEqualStrings(unpack(output[0].result[0][1]), output[0].contents);
	//console.log("Packed = "+output[0].result[1][1]);

	assertEqualStrings(unpack(output[0].result[1][1]), output[0].contents);
	assertEqualStrings(unpack(output[0].result[2][1]), output[0].contents);
}

module.exports = runTests;