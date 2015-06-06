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
	this.result= new Array;
}


/**
 * Creates a clone of a PackerData object
 * changing only the input, log, and name.
 *
 * Member variables added during the packing stage(escapedInput, matchesLookup)
 * are not copied.
 *
 * @param packerData Original object to clone
 * @param nameSuffix Suffix appended to the name of the clone
 * @param newContents Replacement contents for the clone
 * @param newLog Replacement log for the clone
*/
PackerData.clone = function(packerData, nameSuffix, newContents, newLog) {
	var clone = new PackerData;
	clone.name = packerData.name + nameSuffix;
	clone.contents = newContents;
	clone.log = newLog;
	clone.environment = packerData.environment;
	clone.interpreterCall = packerData.interpreterCall;
	clone.wrappedInit = packerData.wrappedInit;
	clone.initialDeclarationOffset = packerData.initialDeclarationOffset;
	clone.packedCodeVarName = packerData.packedCodeVarName;
	clone.result = new Array;
	return clone;
}

// Node.js init
if (typeof require !== 'undefined') {
	module.exports = PackerData;
}
