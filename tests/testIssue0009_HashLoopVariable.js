var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0009 - Loop variable : start");
	testHashLoopVariable();
	console.log("Issue #0009 - Loop variable : done");
}


/**
 * Github issue #9 - Hash loop variable
 * Make sure the variable chosen for the loop is not among the protected ones
 * Erroneous output spotted : "for(c in c)..."
 *
 * Associated test file : gitHub#9-hashloop.js
 */
function testHashLoopVariable() {
	var input = fs.readFileSync("../TestCases/gitHub#9-hashloop.js", { encoding:"utf8"});
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
	
	// Expected result : loop variable is not c 
	// (candidates are c r z with equal score, tiebreaker is alphabetical order)
	// variable protection kicks in and c is ignored upon chhosing the name of the variable
	assert.notEqual(result[1].contents.substr(0,10), "for(c in c");
}

module.exports = runTests;