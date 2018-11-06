var RegPack = require("../regPack")
var ThermalViewer = require("../thermalViewer")
var fs = require("fs");
var DocumentMock = require("./documentMock");
var assert = require("assert");

function runTests() {
	console.log("Issue #0089 - thermal view with empty mapping : start");
	testEmptyThermalMapping();
	console.log("Issue #0089 - thermal view with empty mapping : done");
}


/**
 * GitHub issue #89 - the development page showing all steps crashes with the mapping is empty
 * (no hashing, no reallocation)
 * 
 * Crash happens in the ThermalViewer which tries to access the last element with the mapping
 * without performing bounds checking before
 *
 */
function testEmptyThermalMapping() {
	var input = "0123456789abcdef";
	var thermalMapping = [];
	
	document = new DocumentMock();
	var thermalViewer = new ThermalViewer();
	
	var output = thermalViewer.render(input, thermalMapping);

	// Expected result : the thermalViewer returns without crashing
	// result is a <pre> with one text block
	assert.equal(document.message, "[0123456789abcdef]");
}



module.exports = runTests