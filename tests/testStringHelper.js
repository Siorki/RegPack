var StringHelper = require("../stringHelper")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("StringHelper tests : start");
	testWriteRangeToRegexpCharClass();
	console.log("StringHelper tests : done");
}

function testWriteRangeToRegexpCharClass () {
	var stringHelper = StringHelper.getInstance();
	assert.equal (stringHelper.writeRangeToRegexpCharClass(48, 10), "0-9");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(65, 26), "A-Z");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(65, 2), "AB");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(65, 1), "A");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(45, 1), "-");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(45, 4), "--0");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(32, 4), " -#");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(32, 3), ' -"');
	assert.equal (stringHelper.writeRangeToRegexpCharClass(90, 6), "Z-_");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(91, 5), "[-_");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(90, 4), "Z-\\]");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(90, 3), "Z-\\\\");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(91, 2), "[\\\\");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(92, 6), "\\\\-a");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(93, 6), "\\]-b");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(92, 2), "\\\\\\]");	
	assert.equal (stringHelper.writeRangeToRegexpCharClass(126, 3), "~-\\x80");	
	assert.equal (stringHelper.writeRangeToRegexpCharClass(130, 17), "\\x82-\\x92");	
	assert.equal (stringHelper.writeRangeToRegexpCharClass(254, 3), "\\xfe-\\u0100");	
	assert.equal (stringHelper.writeRangeToRegexpCharClass(512, 256), "\\u0200-\\u02ff");	
	assert.equal (stringHelper.writeRangeToRegexpCharClass(110, 0), "");	
	assert.equal (stringHelper.writeRangeToRegexpCharClass(35, -2), "");	
}

module.exports = runTests;