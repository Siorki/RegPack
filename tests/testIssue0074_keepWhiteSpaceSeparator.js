var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0074 - Incorrect white space removal : start");
	testWhiteSpaceAsSeparator();
	testMultipleWhiteSpaces();
	console.log("Issue #0074 - Incorrect white space removal : done");
}


/**
 * Github issue #74 - Do not remove white spaces that are the only separator
 * Check that there is a proper separator
 * Erroneous behavior : create incorrect code with no separator between two instructions
 *
 * Associated test file : http://codepen.io/cantelope/pen/pRXaae
 */
function testWhiteSpaceAsSeparator() {
	var input = `function Q(x,y,z,S,D){T={};T.B=[];T.S=S;T.H=D;b={};b.M=x;b.N=y;b.A=z;b.K=b.G=PI-.01;b.l=25;b.C=b.M+sin(b.K)*sin(b.G)*25
b.q=b.N+cos(b.G)*25;b.n=b.A+cos(b.K)*sin(b.G)*25;b.D=1;T.B.push(b);H(T.B[0],S,D,PI/4-cos(F/35)*PI/4.1);return T}`;
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : false,
			contextVariableName : "c",
			contextType : parseInt(0),
			reassignVars : false,
			varsNotReassigned : ['a', 'b', 'c'],
			crushGainFactor : parseFloat(1),
			crushLengthFactor : parseFloat(0),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : ""
		};
	var result = RegPack.packer.runPacker(input, options);
	
	// Expected result : the preprocessed text has not been modified, newline was kept
	assert.equal(result[0].contents, input);
}



/**
 * Github issue #74 - Do not remove white spaces that are the only separator
 * Check that several white spaces in a row are reduced to only one
 * Erroneous behavior : delete all white spaces, or keep more than one
 */
function testMultipleWhiteSpaces() {
	var options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : false,
			contextVariableName : "c",
			contextType : parseInt(0),
			reassignVars : false,
			varsNotReassigned : ['a', 'b', 'c'],
			crushGainFactor : parseFloat(1),
			crushLengthFactor : parseFloat(0),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : ""
		};
	var inputWithSpaces = "let a=0; let  b=0; let   c=0";
	var result = RegPack.packer.runPacker(inputWithSpaces, options);
	
	// Expected result : only one space where relevant
	assert.equal(result[0].contents, "let a=0;let b=0;let c=0");
	
	var inputWithTabs = "let\ta=0; let\t\tb=0; let\t\t\tc=0";
	result = RegPack.packer.runPacker(inputWithTabs, options);
	
	// Expected result : only one tab where relevant
	assert.equal(result[0].contents, "let\ta=0;let\tb=0;let\tc=0");
}

module.exports = runTests;
