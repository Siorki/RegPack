var StringHelper = require("../stringHelper")
var PackerData = require("../packerData");
var fs = require("fs");
var assert = require("assert");


function runTests() {
	console.log("StringHelper tests : start");
	testGetByteLength();
	testBase64();
	testWriteRangeToRegexpCharClass();
	testIsActualCodeAt();
	console.log("StringHelper tests : done");
}

// basic implementation of btoa(), present in browser but not in node
btoa=function(input) {
	var output="";
	var code="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	for (i=0; i<input.length; i+=3) {
		output+=code[input.charCodeAt(i)>>2];
		output+=code[((input.charCodeAt(i)&3)<<4)+(i+1<input.length ? input.charCodeAt(i+1)>>4 : 0)];
		output+=i+1>=input.length ? "=" : code[((input.charCodeAt(i+1)&15)<<2) + (i+2<input.length ? input.charCodeAt(i+2)>>6 : 0)];
		output+=i+2>=input.length ? "=" : code[input.charCodeAt(i+2)&63];
	}
	return output;
}

// basic implementation of atob(), present in browser but not in node
atob=function(input) {
	var output="";
	var code="=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	for (i=0; i<input.length; i+=4) {
		var encoded0 = code.indexOf(input[i])-1;
		var encoded1 = code.indexOf(input[i+1])-1;
		var encoded2 = code.indexOf(input[i+2])-1;
		var encoded3 = code.indexOf(input[i+3])-1;
		output+=String.fromCharCode((encoded0<<2)+((encoded1&48)>>4));
		output+=encoded2<0 ? "" : String.fromCharCode(((encoded1&15)<<4)+((encoded2&60)>>2));
		output+=encoded3<0 ? "" : String.fromCharCode(((encoded2&3)<<6)+encoded3);
	}
	return output;
}
/**
 * Unit test for StringHelper.getByteLength()
 */
function testGetByteLength() {
	var stringHelper = StringHelper.getInstance();
	assert.equal(stringHelper.getByteLength("e"), 1);
	assert.equal(stringHelper.getByteLength(""), 1);
	assert.equal(stringHelper.getByteLength("~"), 1);
	assert.equal(stringHelper.getByteLength("\x80"), 2);
	assert.equal(stringHelper.getByteLength("\xfc"), 2);
	assert.equal(stringHelper.getByteLength("\u0200"), 2);
	assert.equal(stringHelper.getByteLength("\u02ff"), 2);
	assert.equal(stringHelper.getByteLength("\u2000"), 3);
}

/**
 * Unit test for StringHelper.unicodeToBase64()
 *               StringHelper.base64ToUnicode()
 */ 
function testBase64() {
	var stringHelper = StringHelper.getInstance();
	assert.equal(stringHelper.unicodeToBase64("M"), "TQ==");
	assert.equal(stringHelper.unicodeToBase64("Ma"), "TWE=");
	assert.equal(stringHelper.unicodeToBase64("Man"), "TWFu");
	assert.equal(stringHelper.unicodeToBase64("abc123!?$*&()'-=@~"), "YWJjMTIzIT8kKiYoKSctPUB+");
	assert.equal(stringHelper.unicodeToBase64("This is the data, in the clear."), "VGhpcyBpcyB0aGUgZGF0YSwgaW4gdGhlIGNsZWFyLg==");
	assert.equal(stringHelper.unicodeToBase64("\n"), "Cg==");
	assert.equal(stringHelper.unicodeToBase64("\u0227"), "yKc=");
	assert.equal(stringHelper.unicodeToBase64("Base 64 \u2014 Mozilla Developer Network"), "QmFzZSA2NCDigJQgTW96aWxsYSBEZXZlbG9wZXIgTmV0d29yaw==");
	assert.equal(stringHelper.unicodeToBase64("\u2713 \xE0 la mode"), "4pyTIMOgIGxhIG1vZGU=");
	assert.equal(stringHelper.unicodeToBase64("\uD83D\uDD25"), "8J+UpQ==");

	assert.equal(stringHelper.base64ToUnicode("TQ=="), "M");
	assert.equal(stringHelper.base64ToUnicode("TWE="), "Ma");
	assert.equal(stringHelper.base64ToUnicode("TWFu"), "Man");
	assert.equal(stringHelper.base64ToUnicode("YWJjMTIzIT8kKiYoKSctPUB+"), "abc123!?$*&()'-=@~");
	assert.equal(stringHelper.base64ToUnicode("VGhpcyBpcyB0aGUgZGF0YSwgaW4gdGhlIGNsZWFyLg=="), "This is the data, in the clear.");
	assert.equal(stringHelper.base64ToUnicode("Cg=="), "\n");
	assert.equal(stringHelper.base64ToUnicode("yKc="), "\u0227");
	assert.equal(stringHelper.base64ToUnicode("QmFzZSA2NCDigJQgTW96aWxsYSBEZXZlbG9wZXIgTmV0d29yaw=="), "Base 64 \u2014 Mozilla Developer Network");
	assert.equal(stringHelper.base64ToUnicode("4pyTIMOgIGxhIG1vZGU="), "\u2713 \xE0 la mode");
	assert.equal(stringHelper.base64ToUnicode("8J+UpQ=="), "\uD83D\uDD25");
	
}

/**
 * Unit test for StringHelper.writeBlocksToRegexpCharClass()
 *               StringHelper.writeRangeToRegexpCharClass()
 *               StringHelper.writeCharToRegexpCharClass()
 *               StringHelper.needsEscapingInCharClass()
 */
function testWriteRangeToRegexpCharClass () {
	var stringHelper = StringHelper.getInstance();
	assert.equal (stringHelper.writeRangeToRegexpCharClass(48, 57), "0-9");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(65, 90), "A-Z");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(65, 66), "AB");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(65, 65), "A");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(45, 45), "-");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(45, 48), "--0");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(32, 35), " -#");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(32, 34), ' -"');
	assert.equal (stringHelper.writeRangeToRegexpCharClass(90, 95), "Z-_");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(91, 95), "[-_");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(90, 93), "Z-\\]");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(90, 92), "Z-\\\\");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(91, 92), "[\\\\");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(92, 97), "\\\\-a");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(93, 98), "\\]-b");
	assert.equal (stringHelper.writeRangeToRegexpCharClass(92, 93), "\\\\\\]");	
	assert.equal (stringHelper.writeRangeToRegexpCharClass(126, 128), "~-\\x80");	
	assert.equal (stringHelper.writeRangeToRegexpCharClass(130, 146), "\\x82-\\x92");	
	assert.equal (stringHelper.writeRangeToRegexpCharClass(254, 256), "\\xfe-\\u0100");	
	assert.equal (stringHelper.writeRangeToRegexpCharClass(512, 767), "\\u0200-\\u02ff");	
	assert.equal (stringHelper.writeRangeToRegexpCharClass(110, 109), "");	
	assert.equal (stringHelper.writeRangeToRegexpCharClass(35, 33), "");	
	assert.equal (stringHelper.writeBlocksToRegexpCharClass([{first:48, last:57}]), "0-9");
	assert.equal (stringHelper.writeBlocksToRegexpCharClass([{first:65, last:90}]), "A-Z");
	assert.equal (stringHelper.writeBlocksToRegexpCharClass([{first:48, last:57}, {first:65, last:90}]), "0-9A-Z");
	assert.equal (stringHelper.writeBlocksToRegexpCharClass([{first:48, last:57}, {first:65, last:65}]), "0-9A");
	assert.equal (stringHelper.writeBlocksToRegexpCharClass([{first:48, last:57}, {first:65, last:65}, {first:67, last:67}]), "0-9AC");
	assert.equal (stringHelper.writeBlocksToRegexpCharClass([{first:48, last:57}, {first:65, last:65}, {first:45, last:45}]), "-0-9A");
	assert.equal (stringHelper.writeBlocksToRegexpCharClass([{first:91, last:95}, {first:45, last:45}, {first:65, last:90}]), "-[-_A-Z");
	assert.equal (stringHelper.writeBlocksToRegexpCharClass([{first:91, last:95}, {first:45, last:46}, {first:65, last:90}]), "-.[-_A-Z");
	assert.equal (stringHelper.writeBlocksToRegexpCharClass([{first:91, last:95}, {first:45, last:48}, {first:65, last:90}]), "--0[-_A-Z");
}

/**
 * Unit test for StringHelper.isActualCodeAt()
 */
function testIsActualCodeAt() {
	var packerData = new PackerData();
	var stringHelper = StringHelper.getInstance();

	// empty string analysis : everything is code
	assert.equal (stringHelper.isActualCodeAt(0, packerData), true);
	assert.equal (stringHelper.isActualCodeAt(20, packerData), true);
	assert.equal (stringHelper.isActualCodeAt(400, packerData), true);
	assert.equal (stringHelper.isActualCodeAt(8000, packerData), true);
	
	// two strings, the first one contains a template literal
	packerData.containedStrings = [ {begin : 20, end : 100}, {begin : 200, end : 300} ];
	packerData.containedTemplateLiterals = [ {begin : 40, end : 70} ];
	
	assert.equal (stringHelper.isActualCodeAt(0, packerData), true);
	assert.equal (stringHelper.isActualCodeAt(19, packerData), true);
	assert.equal (stringHelper.isActualCodeAt(21, packerData), false);
	assert.equal (stringHelper.isActualCodeAt(39, packerData), false);
	assert.equal (stringHelper.isActualCodeAt(41, packerData), true);
	assert.equal (stringHelper.isActualCodeAt(69, packerData), true);
	assert.equal (stringHelper.isActualCodeAt(71, packerData), false);
	assert.equal (stringHelper.isActualCodeAt(99, packerData), false);
	assert.equal (stringHelper.isActualCodeAt(101, packerData), true);
	assert.equal (stringHelper.isActualCodeAt(199, packerData), true);
	assert.equal (stringHelper.isActualCodeAt(201, packerData), false);
	assert.equal (stringHelper.isActualCodeAt(299, packerData), false);
	assert.equal (stringHelper.isActualCodeAt(301, packerData), true);
	assert.equal (stringHelper.isActualCodeAt(400, packerData), true);
	assert.equal (stringHelper.isActualCodeAt(8000, packerData), true);
}

module.exports = runTests;