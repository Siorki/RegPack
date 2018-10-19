/**
 * @constructor
 * The PackerData class holds actual data :
 *  - string to pack, in the current preprocessing / compression stage
 *  - produced log
 * It also holds internal settings set by the preprocessor
 * and exploited by the packer :
 *  - name of the variable containing the packed code
 *  - generated initialization code
 *  - execution environment
 *  - ..
 *
 * There is one instance for each branch of input (from inputList)
 * as the preprocessing may diverge : different renamings, environments ..
 *
 * @param name The name of the branch, summing the operations performed
 * @param dataString The input string to pack
 */
function PackerData(name, dataString) {
	this.name = name; // trace of the modules that were applied
	this.contents = dataString; // string to pack
	this.log = ''; // log, as shown in the right column in the interactive version
	this.environment = '';	// execution environment for unpacked code. Can become 'with(...)'
	this.interpreterCall = 'eval(_)';	// call to be performed on unpacked code.
	this.wrappedInit = '';	// code inside the unpacked routine
	this.initialDeclarationOffset = 0; // offset for 2D/GL context provided by shim
	this.packedCodeVarName='_'; // name of the variable created to hold the packed code
	this.containedStrings=[]; // all strings inside the input code
	this.containedTemplateLiterals=[]; // all template literals `${...}` inside a string
	this.packedStringDelimiter='"'; // ', " or ` around the packed string
	this.thermalMapping=[]; // strings mapping for each compression step, including preprocessing
	this.result= new Array;
}


/**
 * Creates a clone of a PackerData object changing only the name.
 * Copies all member variables, except those added during the packing stage(escapedInput, matchesLookup)
 * Contents and log are copied as well
 *
 * @param packerData Original object to clone
 * @param nameSuffix Suffix appended to the name of the clone
*/
PackerData.clone = function(packerData, nameSuffix) {
	var clone = new PackerData;
	clone.name = packerData.name + nameSuffix;
	clone.contents = packerData.contents;
	clone.log = packerData.log;
	clone.environment = packerData.environment;
	clone.interpreterCall = packerData.interpreterCall;
	clone.wrappedInit = packerData.wrappedInit;
	clone.initialDeclarationOffset = packerData.initialDeclarationOffset;
	clone.packedCodeVarName = packerData.packedCodeVarName;
	clone.containedStrings = packerData.containedStrings.slice();
	clone.containedTemplateLiterals = packerData.containedTemplateLiterals.slice();
	clone.packedStringDelimiter = packerData.packedStringDelimiter;
	clone.thermalMapping=packerData.thermalMapping.slice();
	clone.result = new Array;
	return clone;
}

// Node.js init
if (typeof require !== 'undefined') {
	module.exports = PackerData;
}
