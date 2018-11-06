/**
 * Test mock for document (not present in node.js)
 * This instance simply stores the result in a string
 * 
 * Used for tests involving HTML rendering, such as PatternViewer or ThermalViewer
 *
 */
function DocumentMock() {
	this.message = "";
}

DocumentMock.prototype =  {
	createElement : function(type) {
		return new DivMock();
	},
	
	createTextNode : function(contents) {
		this.message += "[" + contents + "]";
		return contents;
	}

}


function DivMock() {
}

DivMock.prototype = {
	setAttribute : function (a,b) {
	},
	
	appendChild : function(element) {
	}
}

module.exports = DocumentMock;