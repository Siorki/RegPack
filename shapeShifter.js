// Node.js init
if (typeof require !== 'undefined') {
	var PackerData = require("./packerData");
	var StringHelper = require("./stringHelper");
 	var ContextDescriptor = require("./contextDescriptor_node");
}

/**
 * @constructor
 * ShapeShifter is the preprocessor used by RegPack.
 * It shortens the code, without compression, by running those algorithms on the original code according to settings
 *  - puts the code in "with(Math)" environment
 *  - wraps the main code loop into a call to setInterval()
 *  - hashes method / property names for 2D / GL / Audio contexts
 *  - renames the variable to optimize compression
 */
function ShapeShifter() {
	
	this.contextDescriptor = new ContextDescriptor();
	this.stringHelper = StringHelper.getInstance();
	
	// hashing functions for method and property renaming
	this.hashFunctions = [
		["w[x]", 0, 2, 0, 0, function(w,x,y) { return w[x]; } ],
		["w[x]+w[y]", 0, 2, 0, 20, function(w,x,y) { return w[x]+w[y]; } ],
		["w[x]+w.length", 0, 2, 0, 0, function(w,x,y) { return w[x]+w.length; } ],
		["w[x]+w[w.length-1]", 0, 2, 0, 0, function(w,x,y) { return w[x]+w[w.length-1]; } ],
		["w[x]+[w[y]]", 0, 2, 3, 20, function(w,x,y) { return w[x]+[w[y]]; } ],
		["w[0]+w[x]+[w[y]]", 0, 20, 3, 20, function(w,x,y) { return w[0]+w[x]+[w[y]]; } ],
		["w[1]+w[x]+[w[y]]", 0, 20, 3, 20, function(w,x,y) { return w[1]+w[x]+[w[y]]; } ],
		["w[2]+w[x]+[w[y]]", 0, 20, 3, 20, function(w,x,y) { return w[2]+w[x]+[w[y]]; } ],
		["w[0]+[w[x]]+[w[y]]", 3, 20, 3, 20, function(w,x,y) { return w[0]+[w[x]]+[w[y]]; } ],
		["w.substr(x,3)", 0, 2, 0, 0, function(w,x,y) { return w.substr(x,3); } ]
	];
	
}


ShapeShifter.prototype = {

	
	/**
	 * Preparation stage : attempt to rehash the methods from canvas context
	 * Produces a pair of hashed/not hashed strings for each option
	 * so each selected "splitter" flag doubles the number of tests. 
	 * Creates a list with all the combinations to feed to the packer, one at a time.
	 * "with Math()" option is applied on all entries if selected (does not create a pair)
	 *
	 * @param input : the string to pack
	 * @param options : preprocessing options, as follows
	 *       -  withMath : true if the option "Pack with(Math)" was selected, false otherwise
	 *       -  hash2DContext : (splitter) true if the option "Hash and rename 2D canvas context" was selected, false otherwise
	 *       -  hashWebGLContext : (splitter) true if the option "Hash and rename WebGL canvas context" was selected, false otherwise
	 *       -  hashAudioContext : (splitter) true if the option "Hash and rename AudioContext" was selected, false otherwise
	 *       -  hashAllObjects : (splitter) true if the option "Hash and rename properties for any object" was selected, false otherwise
	 *       -  contextVariableName : a string representing the variable holding the context if the "assume context" option was selected, false otherwise
	 *       -  contextType : the context type (0=2D, 1=WebGL) if the "assume context" option was selected, irrelevant otherwise
	 *       -  reassignVars : true to globally reassign variable names 
	 *       -  varsNotReassigned : string or array listing all protected variables (whose name will not be modified)
	 *       -  wrapInSetInterval : true to wrap the unpacked code in a setInterval() call instead of eval()
	 *       -  timeVariableName : if "setInterval" option is set, the variable to use for time (zero on first loop, nonzero after)
	 *       -  useES6 : true to add ES6 constructs to the code, false otherwise
	 * @return an array of PackerData, representing all combinations for splitter flags  
	 */
	preprocess : function(input, options) {
	
		// Transform the list of protected variables into a boolean array[128] (true = protected).
		// Same information but easier to access by algorithms.
		// Only perform it once on an option set : unit tests reuse the same options for several calls
		if (!options.varsNotReassignedRaw) {
			options.varsNotReassignedRaw = options.varsNotReassigned;
			options.varsNotReassigned = [];
			for (var i=0; i<128; ++i) {	// replace by Array.fill() once ES6 is supported
				options.varsNotReassigned.push(false);
			}
			for (var i=0; i<options.varsNotReassignedRaw.length; ++i) {
				var ascii = options.varsNotReassignedRaw[i].charCodeAt(0);
				if (ascii>=0 && ascii<128 && this.isCharAllowedInVariable(ascii)) {
					options.varsNotReassigned[ascii] = true;
				}
			}
		}
		
		// #74 , #96 : minification now performed inside the preprocessor, not as a hidden step in the main entry point
		var minifiedInput = this.minify(input);
		
		var inputData = new PackerData ('', minifiedInput);
		if (options.withMath) {
			// call module : Define environment
			this.defineEnvironment(inputData);
		}
		
		var inputList = [ inputData ];
		if (options.wrapInSetInterval) {
			// call module : wrap with setInterval
			this.refactorToSetInterval(inputData, options);
		} else {
			// map the bytes of the default interpreter call "eval(_)" to the entire code
			var envMapping = [ { inLength : inputData.contents.length, outLength : inputData.contents.length, complete : false},
				   { chapter  : 4, 
					 rangeIn  : [0, inputData.contents.length],
					 rangeOut : [0, inputData.interpreterCall.length]
				   }  ];
			inputData.thermalMapping.push(envMapping);

		}
		
		
		// Hash and rename methods of the 2d canvas context
		//  - method hashing only
		//  - method and property
		// then store the results in the inputList
		if (options.hash2DContext) {
			for (var count=inputList.length, i=0; i<count; ++i) {
				var newBranches = this.preprocess2DContext(inputList[i], options);
				inputList.push(...newBranches); // ES6 syntax : concatenate arrays
			}
		}
		
		// for WebGL contexts, there are three options 
		//   - hash and replace method names only 
		//   - as above, plus replace the definitions of constants with their values (magic numbers)
		//   - hash and replace method and property names
		if (options.hashWebGLContext) {
			for (var count=inputList.length, i=0; i<count; ++i) {
				var newBranches = this.preprocessWebGLContext(inputList[i], options);
				inputList.push(...newBranches); // ES6 syntax : concatenate arrays
			}
		}

		// for AudioContexts, method hashing only
		if (options.hashAudioContext) {
			for (var count=inputList.length, i=0; i<count; ++i) {
				var newBranches = this.preprocessAudioContext(inputList[i], options.varsNotReassigned);
				inputList.push(...newBranches); // ES6 syntax : concatenate arrays
			}
		}
		
		// #86 : for all objects, using a variable as container for the method or property name
		if (options.hashAllObjects) {
			for (var count=inputList.length, i=0; i<count; ++i) {
				var newBranchData = this.hashPropertyNamesAsVariables(inputList[i], options);
				if (newBranchData[0]) { // true if at least one property was assigned to a variable
					inputList.push(newBranchData[1]); 
				}
			}
		}
		
		inputList[0].name="unhashed";

		for (var i=0; i<inputList.length; ++i) {
			this.identifyStrings(inputList[i], false);
			// call module : quote strings
			this.quoteStrings(inputList[i], options);
			if (options.reassignVars) {
				// call module : reassign variables
				this.reassignVariableNames(inputList[i], options);
			}
		}
		return inputList;
	},

	/**
	 * Performs a light minification on the input string
	 * 
	 * Removes C-style comments
	 * Removes C++ one-line style comments
	 * Removes spaces, tabs, CR, CR LF
	 * Replaces ;} with }
	 * 
	 * Exception : any string defined inside the program is not modified
	 * 
	 * @param input : the string (program) to minify
	 * @return the same, minified
	 */
	minify : function(input) {
		var output = "";
		var previousCharCode = 0;
		var closingSequence = "";
		var inRemovedSequence = false, inString = false;
		
		for (let i=0; i<input.length; ++i) {
			let currentChar = input[i];
			let nextCharCode = i<input.length-1 ? input.charCodeAt(i+1) : 0;
			let testForSequenceEnd = true;
			if (closingSequence == "") { 
				// no sequence in progress, detect a beginning
				testForSequenceEnd = false;
				if (currentChar == "'" || currentChar == '"' || currentChar == '`') {
					// #96 : leave string contents untouched, no whitespace removal
					closingSequence = currentChar;
					inString = true;
				}
				if (input.substr(i,2) == "//") { // C++ style single-line comment
					closingSequence = "\n";
					inRemovedSequence = true;
				}
				if (input.substr(i,2) == "/*") { // C multi-line comment
					closingSequence = "*/";
					inRemovedSequence = true;
				}
				if (input.substr(i,4) == "<!--") { // XML multi-line comment
					closingSequence = "-->";
					inRemovedSequence = true;
				}
			}
			if (!inRemovedSequence) {
				let isBlank = "\n\r\t ".indexOf(currentChar) > -1;
				// all non-blanks are copied
				// #74 : so are all blanks between expressions or keywords
				// multiple blanks between expressions are shortened, only the last one is kept
				let doCopy = (!isBlank) || (this.isCharAllowedInVariable(previousCharCode) && this.isCharAllowedInVariable(nextCharCode));
				//console.log(currentChar.charCodeAt(0)+" ("+currentChar+") "+doCopy);
				if (doCopy || inString) { // #96 : no change inside a string
					output+=currentChar;
					previousCharCode = currentChar.charCodeAt(0);
				}
			}
			if (testForSequenceEnd) {
				if (input.substr(i,closingSequence.length) == closingSequence)
				{
					i+= closingSequence.length-1;
					closingSequence = "";
					inRemovedSequence = false;
					inString = false;
				}
			}
		}
		// Remove any semicolon located right before a block ends
		output = output.replace(/;}/g, "}");
		return output;
	},
	
	/**
	 * Modifies the environment execution of the unpacked code, wrapping it into with(Math).
	 * Removes all references to Math. in the input code
	 * @param inputData (in/out) PackerData structure containing the code to refactor and setup 
	 * @return nothing. Result of refactoring is stored in parameter inputData.
	 */
	defineEnvironment : function(inputData) {
		inputData.environment = 'with(Math)';
		var envMapping = { chapter : 2, rangeOut : [0, inputData.environment.length] };
		inputData.contents = this.stringHelper.matchAndReplaceAll(inputData.contents, false, 'Math.', '', '', '', envMapping, inputData.thermalMapping);
	},
	
	
	/**
	 * Rewrites the input code so that it can entirely be executed inside
	 * a setInterval() loop without prior initialization.
	 *
	 * Detects the function that is currently called through setInterval()
	 * and strips it. Wraps the code before that function into a if sequence
	 * at the beginning of the loop, that will only be run once.
	 *
	 * The method makes use of a "time" variable that usually controls
	 * the flow of execution/rendering, and is increased at each loop.
	 * It needs to be zero on the first run to trigger the initialization
	 * sequence, then nonzero on the subsequent runs.
	 *
	 * Output (refactored code and log) is stored in parameter inputData.
	 * Setup for the unpacking routine is also changed in the same object.
	 * 
	 * @param inputData (in/out) PackerData structure containing the code to refactor and setup 
	 * @param options options set, see below for use details
	 * @return nothing. Result of refactoring is stored in parameter inputData.
	 * Options used are :
	 *  - timeVariableName : the variable containing time, or empty string to allocate one
	 *  - varsNotReassigned : boolean array[128], true to avoid altering variable
	 * 
	 */
	refactorToSetInterval : function(inputData, options) {
		var input = inputData.contents;
		var output = input; // initialized from input, in case we bail out early
		var timeVariableName = options.timeVariableName;
		var varsNotReassigned = options.varsNotReassigned;
		var details = "----------- Refactoring to run with setInterval() ---------------\n";
		var timeVariableProvided = true;

		// implementation for #44 : match arrow function syntax (new in ES6)		
		// regular expression matches pre-ES5 syntax : function(params){...}
		var loopMatch = input.match(/setInterval\(function\(([\w\d.=,]*)\){/);
		var functionDeclaration = "function(";
		if (!loopMatch) { // regular expression matches ES6 syntax : (params)=>{...}
			loopMatch = input.match(/setInterval\(\(([\w\d.=,]*)\)=>{/);
			functionDeclaration = ")=>";
		}
		if (!loopMatch) { // regular expression matches ES6 syntax : one_param=>{...}
			loopMatch = input.match(/setInterval\(([\w\d.]*)(=>){/);
			functionDeclaration = "=>";
		}

		if (loopMatch) {
			var initCode = input.substr(0, loopMatch.index);
			// remove any trailing comma or semicolon			
			if (initCode[initCode.length-1]==';' || initCode[initCode.length-1]==',') {
				initCode = input.substr(0, initCode.length-1);
			}
			
			details += "First "+loopMatch.index+" bytes moved to conditional sequence.\n";
			
			// parameters of the function passed to setInterval() : extract default values
			// The regex matches a variable declaration, without value assignment (no "="),
			// at the beginning, end, or between two commas
			var paramsCode = loopMatch[1];
			var paramsExp = /(^|,)[A-Za-z$_][\w$_]*(,|$)/;
		
			var paramsMatch = paramsExp.exec(paramsCode);
			while (paramsMatch && paramsMatch[0] != "") {
				// if the variable is between two commas, keep one : ",k," becomes ","
				var keptCommas = (paramsMatch[1]+paramsMatch[2]).length>1 ? "," : "";
				paramsCode = paramsCode.substr(0, paramsMatch.index)+keptCommas+paramsCode.substr(paramsMatch.index+paramsMatch[0].length);
				paramsMatch = paramsExp.exec(paramsCode);
			}

			// end by a semicolon if there are any initializations that will be added to the main loop code
			paramsCode += (paramsCode != "" ? ";" : "");
			
			if (timeVariableName=="") {
				timeVariableProvided = false;
				timeVariableName = this.allocateNewVariable(inputData, options);
				details += "Using variable "+timeVariableName+" for time.\n";
			}
			
			// Strip the declaration of the time variable from the init code,
			// as it will be defined in the unpacking routine instead.
			var timeDefinitionBegin = initCode.length;
			var timeDefinitionEnd = timeDefinitionBegin;
			var timeDefinitionExp = new RegExp("(^|[^\\w$])"+timeVariableName+"=","g");
			var timeDefinitionMatch=timeDefinitionExp.exec(initCode);
			if (timeDefinitionMatch) {
				timeDefinitionBegin = timeDefinitionMatch.index+timeDefinitionMatch[1].length;
				timeDefinitionEnd = timeDefinitionBegin+2;
				
				// Check if we can strip more than "t=" depending on what comes before and after :
				//  - Brackets means no : the declaration is used as an argument in a function
				//  - Square brackets means no : used to define an array
				//  - Both commas before and after : same context, inside function or array
				//  - a leading = means no : multiple variables are defined at the same time
				//  - anything other than "0" after is no
				//  - other configurations are ok to remove up to the separator
				var canRemoveInitValue = true;
				var leadingChar = timeDefinitionBegin>0 ? initCode[timeDefinitionBegin-1] : "";
				var trailingChar = initCode[timeDefinitionEnd];
				var furtherChar = timeDefinitionEnd+1<initCode.length ? initCode[timeDefinitionEnd+1] : "";
				canRemoveInitValue = canRemoveInitValue && (leadingChar != "=");	// multiple variable init
				canRemoveInitValue = canRemoveInitValue && (trailingChar == "0");	// multiple variable init, or function call
				canRemoveInitValue = canRemoveInitValue && (leadingChar != "("); 	// used as a function argument
				canRemoveInitValue = canRemoveInitValue && (leadingChar != "["); 	// used as array member
				canRemoveInitValue = canRemoveInitValue && (furtherChar != ")"); 	// used as a function argument
				canRemoveInitValue = canRemoveInitValue && (furtherChar != "]"); 	// used as array member
				canRemoveInitValue = canRemoveInitValue && !(leadingChar == "," && furtherChar == ","); 	// used as a function argument
				timeDefinitionEnd+=(canRemoveInitValue?1:0);
				timeDefinitionEnd+=(canRemoveInitValue&&furtherChar==";"?1:0);
				timeDefinitionEnd+=(canRemoveInitValue&&furtherChar==","&&leadingChar==""?1:0);
				timeDefinitionBegin+=(canRemoveInitValue&&furtherChar!=";"&&leadingChar==";"?-1:0);
				timeDefinitionBegin+=(canRemoveInitValue&&furtherChar==""&&leadingChar==","?-1:0);
				
				details += "Removed declaration \""+initCode.substr(timeDefinitionBegin, timeDefinitionEnd-timeDefinitionBegin)+"\"\n";
				initCode = initCode.substr(0,timeDefinitionBegin)+initCode.substr(timeDefinitionEnd);
			}


			
			var inString = 0, bracketDepth = 1, index = loopMatch.index+loopMatch[0].length;
			while (bracketDepth>0 && index<input.length)
			{
				if (inString == 0) {
					switch (input.charCodeAt(index)) {
						case 34 : // "
						case 39 : // '
						case 96 : // `
							inString = input.charCodeAt(index);
							break;
						case 123 : // {
							++bracketDepth;
							break;
						case 125 : // }
							--bracketDepth;
							break;
					}
				} else if (input.charCodeAt(index) == inString && inString>0) {
					inString = 0;
				}
				++index;
			}
			var finalCode = input.substr(index);
			var delayMatch = finalCode.match(/,([\w\d.=]*)\);?/);
			if (delayMatch) {
				finalCode = finalCode.substr(delayMatch[0].length);
				if (finalCode.length) {
					details += "Last "+finalCode.length+" bytes also moved there.\n";
					finalCode = (initCode.length > 0 ? ";" : "")+finalCode;
				}
				details += "Interval of "+delayMatch[1]+ "ms pushed to unpacking routine.\n";
				
				// wrap the initialization code into a conditional sequence :
				//   - if(!t){/*init code*/} if the variable is used (and set) afterwards
				//   - if(!t++){/*init code*/} if it is created only for the test
				//   -  #72 : nothing if there is no init code 
				var wrapperCode = "", wrapperEnd = "";
				if (initCode.length + finalCode.length > 0) {
					wrapperCode = "if(!"+timeVariableName+(timeVariableProvided?"":"++")+"){";
					wrapperEnd = "}";
				}
				var mainLoopCode = input.substr(loopMatch.index+loopMatch[0].length, index-loopMatch.index-loopMatch[0].length-1);
				// Redefine the "offset zero" of our transformed code,
				// used to hash methods/properties of contexts provided by shim
				inputData.initialDeclarationOffset = wrapperCode.length;
				output = wrapperCode + initCode + finalCode + wrapperEnd + paramsCode + mainLoopCode;
				
				inputData.interpreterCall = 'setInterval(_,'+delayMatch[1]+')';
				inputData.wrappedInit = timeVariableName+'=0';
				
				// Special case : the assignment of the time variable is done
				// as a parameter of setInterval()
				// (featured in 2012 - A rose is a rose)
				if (delayMatch[1].indexOf(inputData.wrappedInit) != -1) {
					// in this case, no need to declare the variable again
					inputData.wrappedInit = "";
					details += timeVariableName+" initialized as parameter to setInterval, kept as is.\n";
				}
				
				var functionDeclarationOffset = loopMatch.index+loopMatch[0].indexOf(functionDeclaration);
				// Record the change in the thermal transform
				var transform = [ { inLength : input.length, outLength : output.length, complete : true } ];
				// "if(!t){" : mapped to "function("
				transform.push ( { chapter : 0, rangeIn : [functionDeclarationOffset, functionDeclaration.length], rangeOut : [0, wrapperCode.length] });
				var rangeOutBegin = wrapperCode.length;
				// code before the main loop, before the time variable declaration, mapped to itself
				transform.push ( { chapter : 0, rangeIn : [0, timeDefinitionBegin], rangeOut : [rangeOutBegin, timeDefinitionBegin] });
				rangeOutBegin += timeDefinitionBegin;
				var initSecondHalfLength = 0;
				if (timeDefinitionMatch) {
					// code before the main loop, after the time variable declaration, mapped to itself
					// may omit the final "," or ";", if any, that is eliminated = mapped to nothing
					initSecondHalfLength = initCode.length-timeDefinitionBegin;
					transform.push ( { chapter : 0, rangeIn : [timeDefinitionEnd, initSecondHalfLength], rangeOut : [rangeOutBegin, initSecondHalfLength] });
					rangeOutBegin += initSecondHalfLength;
				}
				if (finalCode.length) {
					// code after the main loop, mapped to itself
					transform.push ( { chapter : 0, rangeIn : [index+delayMatch[0].length, finalCode.length], rangeOut : [rangeOutBegin, finalCode.length] });
					rangeOutBegin += finalCode.length;
				}
				// "}" : mapped to final "}" of the main loop, if any
				transform.push ( { chapter : 0, rangeIn : [index-1, 1], rangeOut : [rangeOutBegin, wrapperEnd.length] });
				rangeOutBegin += wrapperEnd.length;
				// parameters of the loop function, mapped to themselves
				var paramsOffset = loopMatch.index+loopMatch[0].indexOf(loopMatch[1]);
				transform.push ( { chapter : 0, rangeIn : [paramsOffset, loopMatch[1].length], rangeOut : [rangeOutBegin, paramsCode.length] });
				rangeOutBegin += paramsCode.length;
				// code in the loop function, mapped to itself
				transform.push ( { chapter : 0, rangeIn : [loopMatch.index+loopMatch[0].length, mainLoopCode.length], rangeOut : [rangeOutBegin, mainLoopCode.length] });
				// "setInterval(" : map to original declaration
				var blockLength = "setInterval(".length;
				transform.push ( { chapter : 3, rangeIn : [loopMatch.index, blockLength], rangeOut : [0, blockLength] });
				// "_" : mapped to "function("
				transform.push ( { chapter : 3, rangeIn : [functionDeclarationOffset, functionDeclaration.length], rangeOut : [blockLength, 1] });
				// ",nn)" : map to original declaration
				transform.push ( { chapter : 3, rangeIn : [index, delayMatch[0].length], rangeOut : [blockLength+1, delayMatch[1].length+2] });				
				// time declaration variable "t=0" : map to original declaration if any, to function declaration otherwise
				if (timeDefinitionMatch) {
					transform.push ( { chapter : 4, rangeIn : [timeDefinitionBegin, timeDefinitionEnd-timeDefinitionBegin], rangeOut : [0, inputData.wrappedInit.length] });				
				} else {
					transform.push ( { chapter : 4, rangeIn : [functionDeclarationOffset, functionDeclaration.length], rangeOut : [0, inputData.wrappedInit.length] });				
				}
				inputData.thermalMapping.push(transform);
				
			} else {	// delayMatch === false
				details += "Unable to find delay for setInterval, module skipped.\n";
			}
			
		} else {
			details += "setInterval() loop not found, module skipped.\n";
		}
		details += "\n";
		
		// output stored in inputData parameter instead of being returned
		inputData.contents = output;
		inputData.log += details;
	},	
	
	/**
	 * Performs an optimal hashing and renaming of the methods/properties of a canvas 2d context.
	 * Uses a context reference passed from a shim (if provided), plus attempts to
	 * identify all contexts created within the code.
	 * Returns an array containing two sub-arrays, 
	 * each in the same format as the compression methods : 
	 *   [output length, output string, informations],
	 * even if the preprocessing actually lenghtened the string.
	 * 
	 *
	 * @param inputData (constant) PackerData structure containing setup data and the code to preprocess 
	 * @param options (constant) options set, see below for use details
	 * Options used are :
	 *  - contextType : type of context provided by shim : 0 for 2D, 1 for GL
	 *  - contextVariableName : the variable holding the context if provided by shim, false otherwise
	 *  - varsNotReassigned : boolean array[128], true to avoid altering variable
	 * @return an array containing branched (and hashed) PackerData, empty if no 2d context definition is found in the code.
	 */
	preprocess2DContext : function(inputData, options) {
		// Obtain all context definitions (variable name and location in the code)
		var objectNames = [], objectOffsets = [], objectDeclarationLengths = [], searchIndex = 0;
		var variableName = (options.contextType==0?options.contextVariableName:false);
		var varsNotReassigned = options.varsNotReassigned;
		// Start with the preset context, if any
		if (variableName)
		{
			objectNames.push(variableName);
			objectOffsets.push(inputData.initialDeclarationOffset);
			objectDeclarationLengths.push(0);
		}
		// Then search for additional definitions inside the code. Keep name, declaration offset, and declaration length
		var input = inputData.contents;
		var declarations = input.match (/([\w\d.]*)=[\w\d.]*\.getContext\(?[`'"]2d[`'"]\)?/gi);
		if (declarations) {
			for (var declIndex=0; declIndex<declarations.length; ++declIndex)
			{
				var oneDecl = declarations[declIndex];
				objectNames.push(oneDecl.substr(0, oneDecl.indexOf('=')));
				var oneOffset = input.indexOf(oneDecl, searchIndex);
				objectOffsets.push(oneOffset);
				objectDeclarationLengths.push(oneDecl.length);
				searchIndex = oneOffset + oneDecl.length;
			}
		}

		if (objectNames.length) {
			// obtain the list of properties in a 2D context from the ContextDescriptor
			var referenceProperties = this.contextDescriptor.canvas2DContextDescription.properties;

			var methodHashedData = PackerData.clone(inputData, " 2D(methods)");
			methodHashedData.log += "----------- Hashing methods for 2D context -----------\n";
			// output stored in methodHashedData
			this.renameObjectMethods(methodHashedData, objectNames, objectOffsets, objectDeclarationLengths, referenceProperties, varsNotReassigned);
			
			var propertyHashedData = PackerData.clone(inputData, " 2D(properties)");
			propertyHashedData.log += "----------- Hashing properties for 2D context -----------\n";
			// output stored in propertyHashedData
			this.hashObjectProperties(propertyHashedData, objectNames, objectOffsets, objectDeclarationLengths, referenceProperties, varsNotReassigned);
			return [methodHashedData, propertyHashedData];
		}
		return [];
	},

	/**
	 * Performs an optimal hashing and renaming of the methods of a canvas WebGL context.
	 * Uses a context reference passed from a shim, or attempts to locate in inside the code.
	 * Features the call to replaceWebGLconstants() as one of the results.
	 * @see replaceWebGLconstants
	 *
	 * Returns an array containing three sub-arrays, 
	 *   [output length, output string, informations],
	 *  - first one has method hashing performed
	 *  - second one has method hashing + GL constants replaced by their value
	 *  - third one has method + property renaming
	 *
	 * @param inputData (constant) PackerData structure containing setup data and the code to preprocess
	 * @param options (constant) options set, see below for use details
	 * Options used are :
	 *  - contextType : type of context provided by shim : 0 for 2D, 1 for GL
	 *  - contextVariableName : the variable holding the context if provided by shim, false otherwise
	 *  - varsNotReassigned : boolean array[128], true to avoid altering variable
	 * @return an array containing branched (and hashed) PackerData, empty if no WebGL context definition is found in the code.
	 */
	preprocessWebGLContext : function(inputData, options) {
		// Obtain all context definitions (variable name and location in the code)
		var objectNames = [], objectOffsets = [], objectDeclarationLengths = [], searchIndex = 0;
		var input = inputData.contents;
		var variableName = options.contextType==1?options.contextVariableName:false;
		var varsNotReassigned = options.varsNotReassigned;
		// Start with the preset context, if any
		if (variableName)
		{
			objectNames.push(variableName);
			objectOffsets.push(inputData.initialDeclarationOffset);
			objectDeclarationLengths.push(0);
		}
		// Then search for additional definitions inside the code. Keep name, declaration offset, and declaration length
		var declarations = input.match (/([\w\d.]*)\s*=\s*[\w\d.]*\.getContext\(?[`'"](experimental-)*webgl[`'"](,[\w\d\s{}:.,!]*)*\)?(\s*\|\|\s*[\w\d.]*\.getContext\(?[`'"](experimental-)*webgl[`'"](,[\w\d\s{}:.,!]*)*\)?)*/gi);
		if (declarations) {
			for (var declIndex=0; declIndex<declarations.length; ++declIndex)
			{
				var oneDecl = declarations[declIndex];
				objectNames.push(oneDecl.substr(0, oneDecl.indexOf('=')));
				var oneOffset = input.indexOf(oneDecl, searchIndex);
				objectOffsets.push(oneOffset);
				objectDeclarationLengths.push(oneDecl.length);
				searchIndex = oneOffset + oneDecl.length;
			}
		}
			
		if (objectNames.length) {
			// list of properties in a GL context
			var referenceProperties = this.contextDescriptor.canvasGLContextDescription.properties;
	
			var methodHashedData = PackerData.clone(inputData, " WebGL(methods)");
			methodHashedData.log += "----------- Hashing methods for GL context -----------\n";
			// output stored in methodHashedData
			this.renameObjectMethods(methodHashedData, objectNames, objectOffsets, objectDeclarationLengths, referenceProperties, varsNotReassigned);

			// elaborate on the previous result : replace GL constants with values
			var constantHashedData = PackerData.clone(methodHashedData, " WebGL(methods+constants)");
			constantHashedData.log += "----------- Replacing constants for GL context -----------\n";
			// output stored in constantHashedData
			this.replaceWebGLconstants(constantHashedData, objectNames, this.contextDescriptor.canvasGLContextDescription.constants);

			var propertyHashedData = PackerData.clone(inputData, " WebGL(properties)");
			propertyHashedData.log += "----------- Hashing properties for GL context -----------\n";
			// output stored in propertyHashedData
			this.hashObjectProperties(propertyHashedData, objectNames, objectOffsets, objectDeclarationLengths, referenceProperties, varsNotReassigned);
	
			return [methodHashedData, constantHashedData, propertyHashedData];
		}

		return [];
	},
	
	/**
	 * Replaces, in the provided code, all definition of WebGL constants with their numerical values
	 * Uses a context reference passed from a shim, or attempts to locate in inside the code.
	 * Returns an array in the same format as the compression methods : [output length, output string, informations],
	 * even if the replacement actually lenghtened the string.
	 * Only the constant values in CAPITALS are replaced. Other properties and methods are untouched.
	 *
	 * @param inputData (in/out) PackerData structure containing setup data and the code to preprocess
	 * @param objectNames array containing variable names of context objects (mandatory)
	 * @param referenceConstants : object containing all constants of the GL context
	 * @return nothing - output is stored in parameter inputData
	 */
	replaceWebGLconstants : function (inputData, objectNames, referenceConstants) {
		var output = inputData.contents, details=inputData.log;
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex) {
			var exp = new RegExp("(^|[^\\w$])"+objectNames[contextIndex]+"\\.([0-9A-Z_]*)[^\\w\\d_(]","g");
			var constantsInUse=[];
			var result=exp.exec(output);
			while (result) {	// get a set with a unique entry for each method
				if (constantsInUse.indexOf(result[2])==-1) {
					constantsInUse.push(result[2]);
				}
				result=exp.exec(output);
			}

			details += "Replaced constants of "+objectNames[contextIndex]+"\n";
			for (var index=0; index<constantsInUse.length; ++index) {
				if (constantsInUse[index] in referenceConstants) {
					var constant = referenceConstants[constantsInUse[index]];
					var exp = new RegExp("(^|[^\\w$])"+objectNames[contextIndex]+"\\."+constantsInUse[index]+"(^|[^\\w$])","g");						
					// output = output.replace(exp, "$1"+constant+"$2");
					output = this.stringHelper.matchAndReplaceAll(output, exp, objectNames[contextIndex]+"."+constantsInUse[index], constant, "", "", 0, inputData.thermalMapping);
					// show the renaming in the details
					details += constantsInUse[index] + " -> " + constant + "\n";
				}
			}
		}
		details+="\n";
		
		// output stored in inputData parameter
		inputData.contents = output;
		inputData.log = details;
	},
	
	/**
	 * Performs an optimal hashing and renaming of the methods of an AudioContext.
	 * Unlike 2D contexts, only one audio context is considered.
	 *
	 * Returns an array in the same format as the compression methods : [output length, output string, informations],
	 * even if the preprocessing actually lenghtened the string.
	 *
	 * @param inputData (constant) PackerData structure containing the code to refactor and setup 
	 * @param varsNotReassigned boolean array[128], true to keep name of variable
	 * @return an array containing branched (and hashed) PackerData, empty if no AudioContext definition is found in the code.
	 */
	preprocessAudioContext : function(inputData, varsNotReassigned) {
		// list of properties in an AudioContext
		var referenceProperties = this.contextDescriptor.audioContextDescription.properties;

		// Initialization of a *AudioContext can be performed in a variety of ways
		// and is usually less consistent that a 2D or WebGL graphic context.
		// Multiple tests cover the most common cases
		var objectOffset = 0;
		var replacementOffset = 0;
		var objectName = "";
		var methodHashedData = PackerData.clone(inputData, " Audio");
		var input = methodHashedData.contents;
		methodHashedData.log += "----------- Hashing methods for AudioContext --------------------\n";

		// direct instanciation of an AudioContext
		// var c = new AudioContext()
		var result = input.match (/([\w\.]*)\s*=\s*new AudioContext/i);
		if (result) {
			objectOffset = input.indexOf(result[0]);
			objectName = result[1];
			// start replacement at the next semicolon
			replacementOffset = 1+input.indexOf(";", objectOffset);
			// unless the object is used before
			replacementOffset = Math.min(replacementOffset, input.indexOf(objectName, objectOffset+result[0].length));
		}
		// direct instanciation of a webkitAudioContext
		// beware, the same code could try to create both (see TestCase audioContext_create1)
		// var c = new webkitAudioContext()
		var resultWebkit = input.match (/([\w\.]*)\s*=\s*new webkitAudioContext/i);
		if (resultWebkit) {
			
			if (resultWebkit[1] == objectName || objectName == "") {
				// we take the latter declaration, as to add the renaming loop after both of them
				objectOffset = Math.max(objectOffset, input.indexOf(resultWebkit[0]));
				// start replacement at the next semicolon
				replacementOffset = 1+input.indexOf(";", objectOffset);
				// unless the object is used before
				replacementOffset = Math.min(replacementOffset, input.indexOf(objectName, objectOffset+resultWebkit[0].length));
			} else {
				// the webkitAudioContext was created with a different name than the AudioContext
				// in this case, we separately rename objects for both of them 
				// (see TestCase audioContext_create2 and audioContext_create3)
				var webkitObjectOffset = input.indexOf(resultWebkit[0]);
				var webkitObjectName = resultWebkit[1];
				// start replacement at the next semicolon
				var webkitReplacementOffset = 1+input.indexOf(";", webkitObjectOffset);
				// unless the object is used before
				webkitReplacementOffset = Math.min(webkitReplacementOffset, input.indexOf(webkitObjectName, webkitObjectOffset+resultWebkit[0].length));

				
				var secondObjectOffset = replacementOffset>webkitReplacementOffset ? objectOffset : webkitObjectOffset;
				var secondReplacementOffset = replacementOffset>webkitReplacementOffset ? replacementOffset : webkitReplacementOffset;
				var secondObjectName = replacementOffset>webkitReplacementOffset ? objectName : resultWebkit[1];
				
				objectOffset = replacementOffset>webkitReplacementOffset ? webkitObjectOffset : objectOffset ;
				replacementOffset = replacementOffset>webkitReplacementOffset ? webkitReplacementOffset : replacementOffset ;
				objectName = replacementOffset>webkitReplacementOffset ? resultWebkit[1] : objectName ;
				
				// perform the replacement for the latter object first, so the offset of the former is not changed
				this.renameObjectMethods(methodHashedData, [secondObjectName], [secondReplacementOffset], [0], referenceProperties, varsNotReassigned);
			}
		}
		// direct instanciation of the appropriate context
		// var c = new (window.AudioContext||window.webkitAudioContext)()
		result = input.match (/([\w\.]*)\s*=\s*new\s*\(*\s*(window\.)*(webkit)*AudioContext\s*\|\|\s*(window\.)*(webkit)*AudioContext/i);
		if (result) {
			objectOffset = input.indexOf(result[0]);
			objectName = result[1];
			// start replacement at the next semicolon
			replacementOffset = 1+input.indexOf(";", objectOffset);
			// unless the object is used before
			replacementOffset = Math.min(replacementOffset, input.indexOf(objectName, objectOffset+result[0].length));
		}
		
		// direct instanciation of the appropriate context, not factored in
		// var c = new AudioContext()||new webkitAudioContext()
		// (see TestCase audioContext_create4)
		result = input.match (/([\w\.]*)\s*=\s*new\s*\(*\s*(window\.)*(webkit)*AudioContext(\(\))*\s*\|\|\s*new\s*(window\.)*(webkit)*AudioContext(\(\))*/i);
		if (result) {
			objectOffset = input.indexOf(result[0]);
			objectName = result[1];
			// start replacement at the next semicolon
			replacementOffset = 1+input.indexOf(";", objectOffset);
			// unless the object is used before
			replacementOffset = Math.min(replacementOffset, input.indexOf(objectName, objectOffset+result[0].length));
		}
		
		// instanciation of the appropriate context, through a temporary variable
		// contextType = window.AudioContext||window.webkitAudioContext; var c = new contextType;
		result = input.match (/([\w\.]*)\s*=\s*\(*\s*(window\.)*(webkit)*AudioContext\s*\|\|\s*(window\.)*(webkit)*AudioContext/i);
		if (result) {
			var contextTypeName = result[1];
			var exp = new RegExp("([\\w\\.]*)\\s*=\\s*new\\s*\\(*\\s*"+contextTypeName);
			result = input.match(exp);
			if (result) {
				objectOffset = input.indexOf(result[0]);
				objectName = result[1];
				// start replacement at the next semicolon
				replacementOffset = 1+input.indexOf(";", objectOffset);
				// unless the object is used before
				replacementOffset = Math.min(replacementOffset, input.indexOf(objectName, objectOffset+result[0].length));
			}
		}
		
		if (replacementOffset>0) {
			this.renameObjectMethods(methodHashedData, [objectName], [replacementOffset], [0], referenceProperties, varsNotReassigned);
			return [methodHashedData];
		}
		return [];
	},
	
	/**
	 * Implementation of #86
	 * Identifies method and object properties names used multiple times
	 * Stores their name as a variable on the first occurrence, then use the variable as a property afterwards
	 *
	 * c.fillStyle becomes c[F="fillStyle"] the first time then c[F] afterwards.
	 *
	 * The advantage over hashing schemes is that this works with different objects sharing the same property
	 *
	 * Variables assigned that way are from the same pool that would be used for reassignment,
	 * but leaving enough for that module to complete.
	 *
	 * Returns an array [boolean, PackerData]
	 *  - the boolean is true if at least one property name was packed that way, false if no change occurred
	 *  - the PackerData derives from the input with the packed properties 
	 *
	 * @param inputData (constant) PackerData structure containing the code to refactor and setup 
	 * @param options : preprocessing options, as follows
	 *       -  reassignVars : true to globally reassign variable names 
	 *       -  varsNotReassigned : string or array listing all protected variables (whose name will not be modified)
	 *       -  wrapInSetInterval : true to wrap the unpacked code in a setInterval() call instead of eval()
	 *       -  timeVariableName : if "setInterval" option is set, the variable to use for time (zero on first loop, nonzero after)
	 * @return an array containing [boolean, PackerData] as described above
	 */
	hashPropertyNamesAsVariables : function (inputData, options) {
		var outputData = PackerData.clone(inputData, " all_properties");
		var input = outputData.contents;

		// Anything inside strings (save for template literals) is ignored.
		// Strings boundaries will be identified again after the preprocessing is done
		this.identifyStrings(outputData, true); 
		
		var propertiesInUse=[];
		var propertiesMatchData=[];
		var exp = new RegExp("\\.(\\w*)\\W","g");
		var result=exp.exec(input);
		while (result) {	// get a set with a unique entry for each method
			var recordIndex = propertiesInUse.indexOf(result[1]);
			if (this.stringHelper.isActualCodeAt(recordIndex, outputData)) {
				if (recordIndex == -1) { 
					propertiesInUse.push(result[1]);	
					propertiesMatchData.push({name:result[1], count:1, offset:exp.lastIndex});
				} else {
					++propertiesMatchData[recordIndex].count;
				}
			}
			result=exp.exec(input);
		}
	
			
		for (var index=0; index<propertiesMatchData.length; ++index) {
			var rawCost = (1+propertiesMatchData[index].name.length) * propertiesMatchData[index].count;
			var hashedCost = propertiesMatchData[index].name.length + 6 + (propertiesMatchData[index].count-1)*3;
			propertiesMatchData[index].gain = rawCost - hashedCost;
		
		}
	
		// sort by decreasing gain, offset as tiebreaker to ensure a deterministic result
		// even when there are equivalent gains
		propertiesMatchData.sort(function(a,b) { return b.gain-a.gain + (b.offset-a.offset)/10000; });
		
		outputData.log += "----------- Storing property names into variables ----------- \n";
		
		var keywordsAndVariables = this.discriminateKeywordsAndVariables(inputData, options);
		var keywordChars = keywordsAndVariables[0];
		var variableChars = keywordsAndVariables[1];
		var availableChars = keywordsAndVariables[2];
		var variableCharsOnly = keywordsAndVariables[3];
		
		var availableCharList = "";
		var charsNeededForReassignModule = 0;
		var formerVariableCharList = "";
		for (var i=32; i<128; ++i) {
			// Identify as available all characters used in keywords but not variables
			if (availableChars[i]) {
				availableCharList+=String.fromCharCode(i);
			}
			// Simply count variables that need to be renamed, if the "reassign variables" module is active
			// They shall be deducted from our pool
			if (variableCharsOnly[i] && options.reassignVars) {
				++charsNeededForReassignModule;
			}
		}
		var availableVariableCount = availableCharList.length - charsNeededForReassignModule;
		var processedInput = outputData.contents;
		for (var index=0 ; index<propertiesMatchData.length && propertiesMatchData[index].gain>0 && index<availableVariableCount ; ++index) {
		
			// on the first occurrence, declare the variable
			var declarationReplacement = '['+availableCharList[index]+'="'+propertiesMatchData[index].name+'"]';
			// replace all other occurences without the declaration
			var otherReplacement = '['+availableCharList[index]+']';
			processedInput = this.stringHelper.matchAndReplaceFirstAndAll(processedInput, false, '.'+propertiesMatchData[index].name, declarationReplacement, otherReplacement, "", "", 0, outputData.thermalMapping);
			
			outputData.log += availableCharList[index] + '="' + propertiesMatchData[index].name+ '" (x'+propertiesMatchData[index].count + ') : gain = '+propertiesMatchData[index].gain+"\n";		
		}
		
		// log the replacements missed for lack of a token
		for ( ; index<propertiesMatchData.length && propertiesMatchData[index].gain>0 ; ++index) {
			outputData.log += 'No token left : "' + propertiesMatchData[index].name+ '" (x'+propertiesMatchData[index].count + ') : missed gain = '+propertiesMatchData[index].gain+"\n";		
		}
				
		outputData.contents = processedInput; 
		return [index>0, outputData];
	},
	
	
	/**
	 * Identifies the optimal hashing function (the one returning the shortest result)
	 * then renames all the methods with their respective hash, and preprends the hashing code.
	 *
	 * The hashing loop looks like : for(i in c)c[i[0]+[i[6]]=c[i];
	 * meaning that later one may call c.fc(...) instead of c.fillRect(...)
	 * The newly created properties are reference to existing functions.
	 *
	 * Replacement is performed at the last object assignment(graphic or audio context), 
	 * or at the beginning for shim context, hence the offset parameter.
	 *
	 * If there are several contexts, only one hash is used. It is applied to
	 * all or only some of the contexts, depending on the computed gain.
	 * The algorithm will not define different hashes for the multiple
	 * contexts. The rationale behind this is the assumption that the lesser
	 * gain from using the same hash for all will be offset by the better
	 * compression - as the repeated hashing pattern will be picked up by the
	 * packer.
	 *
 	 * Returns an array in the same format as the compression methods : [output length, output string, informations],
	 *
	 * @param inputData (in/out) PackerData structure containing the code to refactor and setup 
	 * @param objectNames : array containing variable names of context objects, whose methods to rename in the source string
	 * @param objectOffsets : array, in the same order, of character offset to the beginning of the object declaration. Zero if defined outside (shim)
	 * @param objectDeclarationLengths : array, in the same order, of lengths of the object declaration, starting at offset. Zero if defined outside (shim)
	 * @param referenceProperties : an array of strings containing property names for the appropriate context type
	 * @param varsNotReassigned : boolean array[128], true to keep name of variable
	 * @return true if the replacement was performed (the gain was >= 0), false otherwise (net loss, replacement cancelled)
	 */
	renameObjectMethods : function(inputData, objectNames, objectOffsets, objectDeclarationLengths, referenceProperties, varsNotReassigned)
	{
		var input = inputData.contents;
		var details = inputData.log;
		var methodsInUseByContext=[];
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex)
		{
			var methodsInUse = [];
			var exp = new RegExp("(^|[^\\w$])"+objectNames[contextIndex]+"\\.(\\w*)\\(","g");
			var result=exp.exec(input);
			while (result) {	// get a set with a unique entry for each method
				if (methodsInUse.indexOf(result[2])==-1) { 
					methodsInUse.push(result[2]);	
				}
				--exp.lastIndex; // the final ( can be reused as initial separator in the next expression
				result=exp.exec(input);
			}
			methodsInUseByContext.push(methodsInUse);
		}

		
		var bestTotalScore = -999, bestIndex =-1, bestXValue = 0, bestYValue = 0, bestScoreByContext = [];
		// For each hashing function, we compute the hashed names of all methods of the context object
		// All collisions (such as taking the first letter of scale() and save() end up in s()) are eliminated
		// as the order depends on the browser and we cannot assume the browser that will be running the final code
		// A score is then assigned to the hashing function :
		//   - for each context, the algorithm computes the gain obtained by shortening the non-colliding method names to their hash
		//     (the number of occurrences is irrelevant, we assume that the compression step will amount them to one)
		//   - the length of the hashing function is subtracted
		// Only the hashing function with the best score is kept - and applied
		for (var functionIndex=0; functionIndex<this.hashFunctions.length; ++functionIndex) {
			var functionDesc = this.hashFunctions[functionIndex];
			for (var xValue=functionDesc[1]; xValue<=functionDesc[2] ; ++xValue) {
				for (var yValue=functionDesc[3]; yValue<=functionDesc[4] ; ++yValue) {
					var reverseLookup = [], forwardLookup = [];
					for (var index=0; index<referenceProperties.length; ++index) {
						var w = referenceProperties[index];
						var hashedName = functionDesc[5].call(null, w, xValue, yValue);
						reverseLookup[hashedName] = (reverseLookup[hashedName] ? "<collision>" : w);
					}
					for (w in reverseLookup) {
						forwardLookup[reverseLookup[w]]=w;	// keep only the method names with no collisions
					}
					var allScores = [], totalScore = 0;
					for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex)
					{
						var score = 0;
						var methodsInUse = methodsInUseByContext[contextIndex];
						for (var methodIndex=0; methodIndex<methodsInUse.length; ++methodIndex) {
							// Fix for issue #11 : in FF, arrays have a method fill(), as 2D contexts do
							// typeof() discriminates between "string" (hash match), "undefined" (no match) and "function" (array built-in)
							if (typeof(forwardLookup[methodsInUse[methodIndex]])=="string") {
								var delta = methodsInUse[methodIndex].length - forwardLookup[methodsInUse[methodIndex]].length;
								// Complement for issue #23, when the hash could be longer than the original name
								score += Math.max(0, delta);
							}
						}
						score -= 2; // a[hash]=b[hash]=a[i], "[hash]=" is packed for 1, remains "a" total 1+1
						allScores.push(score); 
						score = Math.max(0, score); // if the gain is negative, no replacement will be performed
						totalScore += score;
					}
					// the score for the hash is the gain as computed above,
					// minus the length of the hash function itself.
					totalScore-=functionDesc[0].replace(/x/g, xValue).replace(/y/g, yValue).length;
									
					if (totalScore>bestTotalScore) {
						bestTotalScore = totalScore;
						bestScoreByContext = allScores;
						bestIndex = functionIndex;
						bestXValue = xValue;
						bestYValue = yValue;
					}
				}
			}
		}
		
		// bail out early if no gain. Keep if just par, to see how compression behaves
		if (bestTotalScore < 0) {
			details += "Best hash loses "+(-bestTotalScore)+" bytes, skipping.\n";
			inputData.log = details;
			return false;
		}
		
		// best hash function (based on byte gain) found. Apply it
		var reverseLookup = [], forwardLookup = [];
		for (var index=0; index<referenceProperties.length; ++index) {
			var w = referenceProperties[index];
			var hashedName = this.hashFunctions[bestIndex][5].call(null, w, bestXValue, bestYValue);
			reverseLookup[hashedName] = (reverseLookup[hashedName] ? "<collision>" : w);
		}
		for (w in reverseLookup) {
			forwardLookup[reverseLookup[w]]=w;
		}
		var hashedCode = input;
		
		// Tell the user what is being replaced, and what is ignored
		var renamedList = "", notRenamedList = "";
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex)
		{
			if (bestScoreByContext[contextIndex]>=0) {
				renamedList += (renamedList.length>0?", " : "") + objectNames[contextIndex];
			} else {
				notRenamedList += (notRenamedList.length>0?", " : "") + objectNames[contextIndex];
			}
		}
		if (notRenamedList.length>0) {
			details += "No renaming for "+notRenamedList+"\n";
		}
		if (renamedList.length>0) {
			details += "Renamed methods for "+renamedList+"\n";
		}
		
		// Perform the replacement inside the code
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex) {
			if (bestScoreByContext[contextIndex]>=0) {	// replace only if the gain is positive
				var methodsInUse = methodsInUseByContext[contextIndex];
				for (var methodIndex=0; methodIndex<methodsInUse.length; ++methodIndex) {
				
					// Fix for issue #11, needed in this iteration again
					if (typeof(forwardLookup[methodsInUse[methodIndex]])=="string") {
						var gain = methodsInUse[methodIndex].length - forwardLookup[methodsInUse[methodIndex]].length;
						if (gain > 0) {
							// skip replacement if the hash would be longer than the original method
						
							// otherwise replace all instances of that method ("g" option in the RegExp)
							// The opening bracket at the end avoids triggering on a subset of the name,
							// for instance enable() instead of enableVertexAttribArray() in WebGL contexts
							// The initial \b avoids triggering if one context has a name
							// ending in another context's name (such as 'c' and 'cc')
							var exp = new RegExp("\\b"+objectNames[contextIndex]+"\\."+methodsInUse[methodIndex]+"\\(","g");						
							//hashedCode = hashedCode.replace(exp, objectNames[contextIndex]+"."+forwardLookup[methodsInUse[methodIndex]]+"(");
							hashedCode = this.stringHelper.matchAndReplaceAll(hashedCode, exp, methodsInUse[methodIndex], forwardLookup[methodsInUse[methodIndex]], "", "", 0, inputData.thermalMapping);

							// show the renaming in the details, for used methods only
							details += objectNames[contextIndex]+"."+forwardLookup[methodsInUse[methodIndex]] + " -> " + methodsInUse[methodIndex] + "\n";
						}
					}
				}
			}
		}
		details += "\n";
		
		// Choose the index variable for the hashing loop
		var loopVarResult = this.getMostFrequentLoopVariable(input, varsNotReassigned);
		var indexName = loopVarResult[0];
		details += loopVarResult[1]; // operation log		

		// Create the final hashing expression by replacing the placeholder variables
		var expression = this.hashFunctions[bestIndex][0].replace(/w/g, indexName);
		expression = expression.replace(/x/g, bestXValue);		
		expression = expression.replace(/y/g, bestYValue);		
		// If the input code uses mostly "" as string delimiters, use it as well in the expression instead of ''
		if (input.split('"').length>input.split("'").length) {
			expression = expression.replace(/'/g, '"');
		}

		// Determine where in the code the hashing loop will be inserted.
		// (at the declaration of the last context that gets hashed).
		var offset = 0, loopContext = 0, shortestContext = 0;
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex) {
			if (bestScoreByContext[contextIndex]>=0) {	// replace only if the gain is positive
				offset = objectOffsets[contextIndex];	// perform the replacement at the latest context definition
				loopContext = contextIndex;
				// retrieve the context with the shortest name, will be used
				// as right-member of the hashing assignment
				if (objectNames[contextIndex].length <  objectNames[shortestContext].length) {
					shortestContext = contextIndex;
				}
			}
		}
		var outputIntro = hashedCode.substr(0, offset);
		
		// Insert the hashing/renaming loop in the code.
		// If the context definition is not included (js1k shim for instance), the loop is prepended to the code and ends with ";"
		// otherwise the loop replaces and includes the last declaration. The code looks like :
		//   for (i in c=a.getContext('2d'))c[...]=c[i] with a single context
		//   for (i in c=a.getContext('2d'))c[...]=b[...]=b[i] with multiple contexts (surprising, but it works)
		// The ending separator is kept, unless it is a comma ",", in which case it is replaced with a semicolon ";"
		// (to avoid including the trailing code in the loop)
		var declarationLength = objectDeclarationLengths[loopContext];
		var outputInitBlock1 = "for("+indexName+" in "+(declarationLength==0?objectNames[loopContext]:"");
		var outputInitBlock2 = (declarationLength==0?"":hashedCode.substr(offset, declarationLength));
		var outputInitBlock3 = ")";
		//output+="for("+indexName+" in "+(declarationLength==0?objectNames[loopContext]:hashedCode.substr(offset, declarationLength))+")";
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex) {
			if (bestScoreByContext[contextIndex]>=0) {	
				outputInitBlock3+=objectNames[contextIndex]+"["+expression+"]=";
			}
		}		
		outputInitBlock3+=objectNames[shortestContext]+"["+indexName+"]";
		if (hashedCode[offset+declarationLength]==",") {
			// replace the trailing "," with ";" as explained above
			outputInitBlock3+=";";
			++declarationLength;
		}
		outputInitBlock3+=(declarationLength==0?";":"");
		var outputMain = hashedCode.substr(offset+declarationLength);
		var output = outputIntro + outputInitBlock1 + outputInitBlock2 + outputInitBlock3 + outputMain;
		
		// Record the renaming loop in the thermal transform
		var transform = [ { inLength : hashedCode.length, outLength : output.length, complete : true } ];
		if (offset) {
			// code before the context declaration and renaming loop, kept unchanged
			transform.push ( { chapter : 0, rangeIn : [0, offset], rangeOut : [0, offset] });
		}
		var rangeOutBegin = offset;
		if (declarationLength) {	// context declaration done inside the code
			// "for (i in " : map to entire hashed code
			transform.push ( { chapter : 0, 
							   rangeIn : [offset+declarationLength, outputMain.length], 
							   rangeOut : [offset, outputInitBlock1.length] });
			rangeOutBegin += outputInitBlock1.length;
			// "context=canvas.getContext('2d')" : map as is
			transform.push ( { chapter : 0, 
							   rangeIn : [offset, outputInitBlock2.length],
							   rangeOut : [rangeOutBegin, outputInitBlock2.length] });
			rangeOutBegin += outputInitBlock2.length;
			// ")c[...]=c[i]" : map to entire hashed code
			transform.push ( { chapter : 0, 
							   rangeIn : [offset+declarationLength, outputMain.length], 
							   rangeOut : [rangeOutBegin, outputInitBlock3.length] });
			rangeOutBegin += outputInitBlock3.length;
		
		} else {	// context declaration done beforehand (in the shim)
			// "for (i in c)c[...]=c[i];" : map to entire hashed code
			transform.push ( { chapter : 0, 
							   rangeIn : [offset, outputMain.length], 
							   rangeOut : [offset, outputInitBlock1.length+outputInitBlock2.length+outputInitBlock3.length] });
			rangeOutBegin += outputInitBlock1.length+outputInitBlock2.length+outputInitBlock3.length;
		}
		// code using the hashed contexts
		transform.push( { 	chapter : 0, 
							rangeIn : [offset+declarationLength, outputMain.length], 
							rangeOut : [rangeOutBegin, outputMain.length] });
		
		inputData.thermalMapping.push(transform);
		
		
		// output stored in inputData parameter
		inputData.contents = output;
		inputData.log = details;
		return true;
	},

	
	/**
	 * Identifies the optimal hashing function (the one returning the shortest result)
	 * then renames all the properties with their respective hash, and preprends the hashing code.
	 *
	 * The hashing loop looks like : for(i in c)c[i[0]+[i[6]]=i;
	 * The new properties in c contain the full name of actual properties and methods
	 * meaning that later one may call c[c.fc](...) instead of c.fillRect(...)
	 * or c[c.fy] instead of c.fillStyle
	 * Unlike renameObjectMethods(), this works on properties and methods alike.
	 *
	 * Replacement is performed at the last object assignment(graphic or audio context), 
	 * or at the beginning for shim context, hence the offset parameter.
	 *
	 * If there are several contexts, only one hash is used. It is applied to
	 * all or only some of the contexts, depending on the computed gain.
	 * The algorithm will not define different hashes for the multiple
	 * contexts. The rationale behind this is the assumption that the lesser
	 * gain from using the same hash for all will be offset by the better
	 * compression - as the repeated hashing pattern will be picked up by the
	 * packer.
	 *
 	 * Returns an array in the same format as the compression methods : [output length, output string, informations],
	 *
	 * @param inputData (in/out) PackerData structure containing the code to refactor and setup 
	 * @param objectNames : array containing variable names of context objects, whose methods to rename in the source string
	 * @param objectOffsets : array, in the same order, of character offset to the beginning of the object declaration. Zero if defined outside (shim)
	 * @param objectDeclarationLengths : array, in the same order, of lengths of the object declaration, starting at offset. Zero if defined outside (shim)
	 * @param referenceProperties : an array of strings containing property names for the appropriate context type
	 * @param varsNotReassigned : boolean array[128], true to keep name of variable
	 * @return the result of the renaming as an array [output length, output string, informations]
	 */
	hashObjectProperties : function(inputData, objectNames, objectOffsets, objectDeclarationLengths, referenceProperties, varsNotReassigned)
	{				
		var input = inputData.contents;
		var details = inputData.log;
		var propertiesInUseByContext=[];
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex)
		{
			var propertiesInUse = [];
			// almost the same expression as for methods, without the final "("
			var exp = new RegExp("(^|[^\\w$])"+objectNames[contextIndex]+"\\.(\\w*)","g");
			var result=exp.exec(input);
			while (result) {	// get a set with a unique entry for each property
				if (propertiesInUse.indexOf(result[2])==-1) { 
					propertiesInUse.push(result[2]);	
				}
				result=exp.exec(input);
			}
			propertiesInUseByContext.push(propertiesInUse);
		}

		
		var bestTotalScore = -999, bestIndex =-1, bestYValue = 0, bestXValue = 0, bestScoreByContext = [];
		// For each hashing function, we compute the hashed names of all properties of the context object
		// All collisions (such as taking the first letter of scale() and save() end up in s()) are eliminated
		// as the order depends on the browser and we cannot assume the browser that will be running the final code
		// A score is then assigned to the hashing function :
		//   - for each context, the algorithm computes the gain obtained by shortening the non-colliding property names to their hash
		//     (the number of occurrences is irrelevant, we assume that the compression step will amount them to one)
		//   - the length of the hashing function is subtracted
		// Only the hashing function with the best score is kept - and applied
		for (var functionIndex=0; functionIndex<this.hashFunctions.length; ++functionIndex) {
			var functionDesc = this.hashFunctions[functionIndex];
			for (var xValue=functionDesc[1]; xValue<=functionDesc[2] ; ++xValue) {
				for (var yValue=functionDesc[3]; yValue<=functionDesc[4] ; ++yValue) {
					var reverseLookup = [], forwardLookup = [];
					for (var index=0; index<referenceProperties.length; ++index) {
						var w = referenceProperties[index];
						var hashedName = functionDesc[5].call(null, w, xValue, yValue);
						// a collision means that the hash is unsafe to use
						//  - either another property/method is hashed to the same string
						//  - or an unhashed method used in the code has the same name
						//    (may happen for short names such as arc())
						//    We do not care about methods not used in the code, they can be safely overwritten
						var collision = propertiesInUse.indexOf(hashedName)!=-1 || reverseLookup[hashedName];
						reverseLookup[hashedName] = (collision ? "<collision>" : w);
					}
					for (w in reverseLookup) {
						forwardLookup[reverseLookup[w]]=w;	// keep only the property names with no collisions
					}
					var allScores = [], totalScore = 0;
					for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex)
					{
						var score = 0;
						var propertiesInUse = propertiesInUseByContext[contextIndex];
						for (var propertyIndex=0; propertyIndex<propertiesInUse.length; ++propertyIndex) {
							// Fix for issue #11 : in FF, arrays have a method fill(), as 2D contexts do
							// typeof() discriminates between "string" (hash match), "undefined" (no match) and "function" (array built-in)
							if (typeof(forwardLookup[propertiesInUse[propertyIndex]])=="string") {
								score += propertiesInUse[propertyIndex].length - forwardLookup[propertiesInUse[propertyIndex]].length;
							}
						}
						allScores.push(score); 
						score = Math.max(0, score); // if the gain is negative, no replacement will be performed
						totalScore += score;
					}
					// the score for the hash is the gain as computed above,
					// minus the length of the hash function itself.
					totalScore-=functionDesc[0].replace(/x/g, xValue).replace(/y/g, yValue).length;
					
					// Debug log
					// details +=functionDesc[0].replace(/x/g, xValue).replace(/y/g, yValue) + " : "+totalScore +"\n";
									
					if (totalScore>bestTotalScore) {
						bestTotalScore = totalScore;
						bestScoreByContext = allScores;
						bestIndex = functionIndex;
						bestXValue = xValue;
						bestYValue = yValue;
					}
				}
			}
		}

		// bail out early if no gain
		if (bestTotalScore < 0) {
			details += "Best hash loses "+(-bestTotalScore)+" bytes, skipping.\n";
			return [this.getByteLength(input), input, details];
		}
		
		// best hash function (based on byte gain) found. Apply it
		var reverseLookup = [], forwardLookup = [];
		for (var index=0; index<referenceProperties.length; ++index) {
			var w = referenceProperties[index];
			var hashedName = this.hashFunctions[bestIndex][5].call(null, w, bestXValue, bestYValue);
			reverseLookup[hashedName] = (reverseLookup[hashedName] ? "<collision>" : w);
		}
		for (w in reverseLookup) {
			forwardLookup[reverseLookup[w]]=w;
		}
		var hashedCode = input;
		
		// Tell the user what is being replaced, and what is ignored
		var renamedList = "", notRenamedList = "";
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex)
		{
			if (bestScoreByContext[contextIndex]>=0) {
				renamedList += (renamedList.length>0?", " : "") + objectNames[contextIndex];
			} else {
				notRenamedList += (notRenamedList.length>0?", " : "") + objectNames[contextIndex];
			}
		}
		if (notRenamedList.length>0) {
			details += "No renaming for "+notRenamedList+"\n";
		}
		if (renamedList.length>0) {
			details += "Renamed properties for "+renamedList+"\n";
		}

		// Determine the context with the shortest name
		// It will be used to store the hashes
		// (at the declaration of the last context that gets hashed).
		var shortestContext = 0;
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex) {
			if (objectNames[contextIndex].length <  objectNames[shortestContext].length) {
				shortestContext = contextIndex;
			}
		}

		
		// Perform the replacement inside the code
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex) {
			if (bestScoreByContext[contextIndex]>=0) {	// replace only if the gain is positive
				var propertiesInUse = propertiesInUseByContext[contextIndex];
				for (var propertyIndex=0; propertyIndex<propertiesInUse.length; ++propertyIndex) {
				
					// Fix for issue #11, needed in this iteration again
					if (typeof(forwardLookup[propertiesInUse[propertyIndex]])=="string") {
						// replace all instances of that property ("g" option in the RegExp)
						// The nonstring character at the end avoids triggering on a subset of the name,
						// for instance enable() instead of enableVertexAttribArray() in WebGL contexts
						// (see test case webglContext_substringHash.js)
						// The initial character (or line start) avoids triggering if one context has a name
						// ending in another context's name (such as 'c' and 'cc')
						var exp = new RegExp("(^|[^\\w$])"+objectNames[contextIndex]+"\\."+propertiesInUse[propertyIndex]+"($|\\W)","g");						
						var originalText = "."+propertiesInUse[propertyIndex];
						var replacementText = "["+objectNames[shortestContext]+"."+forwardLookup[propertiesInUse[propertyIndex]]+"]";
						//hashedCode = hashedCode.replace(exp, "$1"+objectNames[contextIndex]+"["+objectNames[shortestContext]+"."+forwardLookup[propertiesInUse[propertyIndex]]+"]$2");
						hashedCode = this.stringHelper.matchAndReplaceAll(hashedCode, exp, originalText, replacementText, "", "", 0, inputData.thermalMapping);
						
						// show the renaming in the details, for used properties only
						details += objectNames[contextIndex]+"."+forwardLookup[propertiesInUse[propertyIndex]] + " -> " + propertiesInUse[propertyIndex] + "\n";
					}
				}
			}
		}
		details += "\n";
		
		// Choose the index variable for the hashing loop
		var loopVarResult = this.getMostFrequentLoopVariable(input, varsNotReassigned);
		var indexName = loopVarResult[0];
		details += loopVarResult[1]; // operation log		

		// Create the final hashing expression by replacing the placeholder variables
		var expression = this.hashFunctions[bestIndex][0].replace(/w/g, indexName);
		expression = expression.replace(/x/g, bestXValue);		
		expression = expression.replace(/y/g, bestYValue);		
		// If the input code uses mostly "" as string delimiters, use it as well in the expression instead of ''
		if (input.split('"').length>input.split("'").length) {
			expression = expression.replace(/'/g, '"');
		}

		// Determine where in the code the hashing loop will be inserted.
		// (at the declaration of the last context that gets hashed).
		var offset = 0, loopContext = 0;
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex) {
			if (bestScoreByContext[contextIndex]>=0) {	// replace only if the gain is positive
				offset = objectOffsets[contextIndex];	// perform the replacement at the latest context definition
				loopContext = contextIndex;
			}
		}
		var outputIntro = hashedCode.substr(0, offset);
		
		// Insert the hashing/renaming loop in the code.
		// If the context definition is not included (js1k shim for instance), the loop is prepended to the code and ends with ";"
		// otherwise the loop replaces and includes the last declaration. The code looks like :
		//   for (i in c=a.getContext('2d'))c[...]=i with a single context
		//   for (i in c=a.getContext('2d'))c[...]=b[...]=i with multiple contexts
		// The ending separator is kept, unless it is a comma ",", in which case it is replaced with a semicolon ";"
		// (to avoid including the trailing code in the loop)
		var declarationLength = objectDeclarationLengths[loopContext];
		var outputInitBlock1 = "for("+indexName+" in "+(declarationLength==0?objectNames[loopContext]:"");
		var outputInitBlock2 = (declarationLength==0?"":hashedCode.substr(offset, declarationLength));
		var outputInitBlock3 = ")";
		//output+="for("+indexName+" in "+(declarationLength==0?objectNames[loopContext]:hashedCode.substr(offset, declarationLength))+")";
		outputInitBlock3+=objectNames[shortestContext]+"["+expression+"]="+indexName;
		if (hashedCode[offset+declarationLength]==",") {
			// replace the trailing "," with ";" as explained above
			outputInitBlock3+=";";
			++declarationLength;
		}
		outputInitBlock3+=(declarationLength==0?";":"");
		var outputMain = hashedCode.substr(offset+declarationLength);
		var output = outputIntro + outputInitBlock1 + outputInitBlock2 + outputInitBlock3 + outputMain;
		
		// Record the renaming loop in the thermal transform
		var transform = [ { inLength : hashedCode.length, outLength : output.length, complete : true } ];
		if (offset) {
			// code before the context declaration and renaming loop, kept unchanged
			transform.push ( { chapter : 0, rangeIn : [0, offset], rangeOut : [0, offset] });
		}
		var rangeOutBegin = offset;
		if (declarationLength) {	// context declaration done inside the code
			// "for (i in " : map to entire hashed code
			transform.push ( { chapter : 0, 
							   rangeIn : [offset+declarationLength, outputMain.length], 
							   rangeOut : [offset, outputInitBlock1.length] });
			rangeOutBegin += outputInitBlock1.length;
			// "context=canvas.getContext('2d')" : map as is
			transform.push ( { chapter : 0, 
							   rangeIn : [offset, outputInitBlock2.length],
							   rangeOut : [rangeOutBegin, outputInitBlock2.length] });
			rangeOutBegin += outputInitBlock2.length;
			// ")c[...]=i" : map to entire hashed code
			transform.push ( { chapter : 0, 
							   rangeIn : [offset+declarationLength, outputMain.length], 
							   rangeOut : [rangeOutBegin, outputInitBlock3.length] });
			rangeOutBegin += outputInitBlock3.length;
		
		} else {	// context declaration done beforehand (in the shim)
			// "for (i in c)c[...]=i;" : map to entire hashed code
			transform.push ( { chapter : 0, 
							   rangeIn : [offset, outputMain.length], 
							   rangeOut : [offset, outputInitBlock1.length+outputInitBlock2.length+outputInitBlock3.length] });
			rangeOutBegin += outputInitBlock1.length+outputInitBlock2.length+outputInitBlock3.length;
		}
		// code using the hashed contexts
		transform.push( { 	chapter : 0, 
							rangeIn : [offset+declarationLength, outputMain.length], 
							rangeOut : [rangeOutBegin, outputMain.length] });
		
		inputData.thermalMapping.push(transform);


		// output stored in inputData parameter
		inputData.contents = output;
		inputData.log = details;
	},

	
	/**
	 * Returns the total byte length of a string
	 *  1 for ASCII char
	 *  3 for Unicode (UTF-8)
	 * Issue #5 : final size when featuing unicode characters
	 *
	 * @param inString the string to measure
	 * @return the UTF-8 length of the string, in bytes 
	 */
	getByteLength : function (inString)
	{
		return encodeURI(inString).replace(/%../g,'i').length;
	},
	
	/**
	 * Returns true if the character code is allowed in the name of a variable.
	 * Allowed codes are 36($), 48-57(0-9), 65-90(A-Z), 95(_), 97-122(a-z)
	 *
	 * @param charCode ASCII code of the character (variables with Unicode > 127 are not accepted)
	 * @return true if the character is allowed in the name of a variable, false otherwie
	 */
	isCharAllowedInVariable : function (charCode)
	{
		return (charCode>64 && charCode<91) || (charCode>96 && charCode<123) 
			   || (charCode>47 && charCode<58)
			   || charCode==36 || charCode==95;
	},

	/**
	 * Returns true if the character code is a digit
	 * @param charCode ASCII or Unicode value of the character
	 * @return true for digits (0 to 9 = ASCII 48 to 57), false otherwise
	 */
	isDigit : function (charCode)
	{
		return (charCode>47 && charCode<58);
	},
	
	/**
	 * Identifies and returns the one-letter variable that is the
	 * most common occurrence as a loop variable in a for(..;..;..) loop
	 *
	 * If no loop is found in the code, returns "i" as default.
	 * Protected variables (from param varsNotReassigned) are not counted
	 * as they should not be reassigned (issue #9), as the goal is to
	 * create another for loop using the same variabled.
	 *
	 * Called by both hashing methods to assign a name to the 
	 * renaming loop, in order to benefit most from compression.
	 * @see renameObjectMethods
	 * @see hashObjectProperties
	 *
	 * @param input the code to parse for loop variables
	 * @param varsNotReassigned (from options) boolean array[128], true to avoid altering variable
	 * @return an array [ variable name (String), log ]
	 */
	getMostFrequentLoopVariable : function(input, varsNotReassigned)
	{
		// Choose the index variable for the added hashing code
		// The algorithm counts every instance of "for(*" with individual letters replacing the star
		// then chooses the letter with the most matches, in order to benefit most from compression
		var log ="Loop variables :\n";
		var indexMatches = new Array(128) ;

		// #58 : only choose legal variable names, not digits
		var loopIndexRegExp = /for\(([A-Za-z_$])/g;
		var loopIndexResult=loopIndexRegExp.exec(input);
		while (loopIndexResult) {	// get a set with a unique entry for each property
			var code = loopIndexResult[1].charCodeAt(0);
			if (!varsNotReassigned[code]) {	// issue #9 : skip protected variable
				indexMatches[code] = (indexMatches[code]||0)+1;
			}
			loopIndexResult=loopIndexRegExp.exec(input);
		}
		var indexName="i"; // default name
		var maxMatches = 0;
		for (var i=0; i<128; ++i) {
			if (indexMatches[i]>maxMatches) {
				maxMatches = indexMatches[i];
				indexName = String.fromCharCode(i);
			}
		}
		for (var i=0; i<128; ++i) {
			if (indexMatches[i]) {
				log += String.fromCharCode(i)+" *"+indexMatches[i]+(indexName == String.fromCharCode(i)?" <-- selected":"")+"\n";
			}
		}
		if (maxMatches == 0) {
			log += "No relevant loop found, defaulting to "+indexName+"\n";
		}
		log += "\n";
		return [ indexName, log ];
	},
	
	/**
	 * Defines and returns a packer-friendly name for a new variable.
	 * 
	 * It first lists characters used in keywords but not in existing variables.
	 * If none is found, it takes the first character not assigned to a variable.
	 * If none is available, it returns a two-letter variable.
	 * 
	 * @param inputData (constant) PackerData structure containing the input code
	 * @param options options set, used by discriminateKeywordsAndVariables()
	 * @return the name of the new variable, as a string
	 * @see discriminateKeywordsAndVariables
	 */
	allocateNewVariable : function(inputData, options)
	{
		var keywordsAndVariables = this.discriminateKeywordsAndVariables(inputData, options);
		var keywordChars = keywordsAndVariables[0];
		var variableChars = keywordsAndVariables[1];
		var availableChars = keywordsAndVariables[2];
		
		// first, characters already used by functions, keywords ..
		for (var i=33; i<128; ++i) {
			if (availableChars[i]) {
				return String.fromCharCode(i);
			}
		}
		
		// then, one-letter names not used by variables
		for (var i=33; i<128; ++i) {
			if (!variableChars[i] && this.isCharAllowedInVariable(i) && !this.isDigit(i)) {
				return String.fromCharCode(i);
			}
		}
		
		// if still not, try two-letter names
		var input = inputData.contents;
		for (var i=97; i<122; ++i) {
			for (var j=97; j<122; ++j) {
				name = String.fromCharCode(i,j);
				if (input.indexOf(name)==-1) {
					return name;
				}
			}
		}
		
		return "__";
	},
	
	/**
	 * Identify the characters used in user variable names
	 * and those used in keywords. Unicode characters are not supported.
	 *
	 * The result can be used for renaming variables or to
	 * allocate a new variable name
	 * @see reassignVariableNames
	 * @see allocateNewVariable
	 * 
	 * @param inputData PackerData structure containing the setup and the code to process
	 * @param options options set, see below for use details
	 * Options used are :
	 *  - varsNotReassigned : boolean array[128], true to avoid altering variable
	 * @return array [ keywords, variables, available for new variables, variables only ], each is a boolean [128]
	 *  - keywords : true if the character is present in keywords, false otherwise
	 *  - variables : true if the character is already used as a variable, false otherwise
	 *  - available : true if the character is present in keywords but not used as a variable, false otherwise
	 */
	discriminateKeywordsAndVariables : function(inputData, options)
	{
		var varsNotReassigned = options.varsNotReassigned;
		var variableChars = [], keywordChars = [], availableChars = [], variableCharsOnly = [];
		var previousChar = 0;
		var letterCount = 0;
		var isKeyword = false;
		var input = inputData.contents;
		for (var i=0; i<128; ++i) {
			variableChars[i] = keywordChars[i] = availableChars[i] = variableCharsOnly[i] = false;
		}
		// Identify characters used in the code :
		//  - those used only in keywords, method names.
		//  - those used as one-letter variable or function names only (and candidates to renaming)
		//  - those used for both variable names and within keywords

		var stringIndex = 0, templateLiteralIndex = 0;
		for (var offset=0; offset<input.length; ++offset) {
			
			var currentChar = input.charCodeAt(offset);
			if (currentChar<128) {
				if (this.isCharAllowedInVariable(currentChar)) {
				
					while (stringIndex < inputData.containedStrings.length && inputData.containedStrings[stringIndex].end < offset) {
						++stringIndex;
					}
					while (templateLiteralIndex < inputData.containedTemplateLiterals.length && inputData.containedTemplateLiterals[templateLiteralIndex].end < offset) {
						++templateLiteralIndex;
					}
					var insideString = (stringIndex < inputData.containedStrings.length 
						&& inputData.containedStrings[stringIndex].begin < offset
						&& offset < inputData.containedStrings[stringIndex].end);
					var insideTemplateLiteral = (templateLiteralIndex < inputData.containedTemplateLiterals.length 
						&& inputData.containedTemplateLiterals[templateLiteralIndex].begin < offset
						&& offset < inputData.containedTemplateLiterals[templateLiteralIndex].end);
					
					if (insideString && !insideTemplateLiteral) {
						// #76 : characters inside a string, out of a template literal ${...}, are not variables
						keywordChars[currentChar]=true;
					} else { // in a template literal, or not in a string (variables allowed)
						++letterCount;
						if (letterCount>1) {
							isKeyword=true;
							keywordChars[previousChar]=true;
							keywordChars[currentChar]=true;
						} else {
							if (previousChar == 46) { // character .
								isKeyword=true;
								keywordChars[currentChar]=true;
							}
						}
					}
				} else {
					// only consider one-letter variables or functions. 
					// Do not include digits, they are not permitted as one-letter variable names.
					// Do not include in variables if preceded by a dot, which would indicate member variable or function
					if (letterCount==1 && !this.isDigit(previousChar) && !isKeyword) {
						variableChars[previousChar]=true;
					}
					letterCount=0;
					isKeyword=false;
				}
				previousChar=currentChar;
			}
		}

		// Identify as available all characters used in keywords but not variables
		// And those that should be reassigned, if the options is set
		// #86 : factored here as available variable names are used in multiple places
		for (var i=33; i<128; ++i) {
			availableChars[i] = keywordChars[i] && !variableChars[i] && this.isCharAllowedInVariable(i) && !this.isDigit(i);
			variableCharsOnly[i] = variableChars[i] && !keywordChars[i] && !varsNotReassigned[i];
		}
		
		return [ keywordChars, variableChars, availableChars, variableCharsOnly ];
	},
	
	/**
	 * Renames one-letter variables in the code, in order to group characters in consecutive blocks as much as possible.
	 * This will leave larger empty blocks for tokens, so that the character class that represents them
	 * in the final regular expression will be shorter : a block is represented by three characters (begin,
	 * dash, end), no matter now many are comprised in between.
	 * This operation does not change the length of the code nor its inner workings.
	 *
	 * The method :
	 * - lists all the one-letter variables in the code
	 * - identifies those using a character that is not otherwise present in classes or keywords
	 *   (meaning that renaming them will actually free the character to use as a token)
	 * - identifies all the characters in use by classes or language keywords
	 * - reassign those to variables, if available (not used by other variables)
	 * - if there are remaining variables in need of a name, fill gaps in the ASCII table, starting with the shortest ones.
	 *   (for instance, if a,c,d,e,g,h are in use, it will assign b and f, since [a-h] is shorter than [ac-egh]
	 *
	 * @param inputData (in/out) PackerData structure containing the setup and the code to process
	 * @param options options set, see below for use details
	 * @return nothing. Result of refactoring is stored in parameter inputData.
	 * Options used are :
	 *  - varsNotReassigned : boolean array[128], true to avoid altering variable
	 */
	reassignVariableNames : function (inputData, options)
	{
		var varsNotReassigned = options.varsNotReassigned;
		var keywordsAndVariables = this.discriminateKeywordsAndVariables(inputData, options);
		var keywordChars = keywordsAndVariables[0];
		var variableChars = keywordsAndVariables[1];
		var availableChars = keywordsAndVariables[2];
		var variableCharsOnly = keywordsAndVariables[3];
		var input = inputData.contents;
		
		var details = "----------- Renaming variables to optimize RegExp blocks --------\n";
		details += "All variables : ";
		
		var availableCharList = "";
		var formerVariableCharList = "";
		for (var i=32; i<128; ++i) {
			if (variableChars[i]) {
				details+=String.fromCharCode(i);
			}
			// Identify as available all characters used in keywords but not variables
			if (availableChars[i]) {
				availableCharList+=String.fromCharCode(i);
			}
			// List all variables that can be reassigned a new name.
			// This excludes those with a one-letter name already used in a keyword (no gain in renaming them)
			// and those explicitely excluded from the process by the user.
			if (variableCharsOnly[i]) {
				formerVariableCharList+=String.fromCharCode(i);
			}
		}
		var detailsSub1 = availableCharList.length ? availableCharList : "(none)";
		var detailsSub2 = formerVariableCharList.length ? formerVariableCharList : "(none)";
		details +="\n";
		details += "in keywords only : " + detailsSub1 + "\nin variables only : " + detailsSub2 + "\n\n";

		// Prepare to rename variables
		// If we have more variables to rename (characters used as variable names only)
		// than characters available (used in keywords only, but not as variables - yet),
		// we need to allocate more characters, among those not in use :
		//   - either those not used at all in the code
		//   - or those used by variables only (which means not renaming the variable by that name)
		// 
		// The algorithm attempts to reduce the block count (i.e. chooses characters in between two blocks, that are thus merged)
		// so that the regular expression for tokens can be as short as possible.
		if (availableCharList.length < formerVariableCharList.length) {
			var lettersNeeded = formerVariableCharList.length - availableCharList.length;
			
			// identify blocs of unused characters
			var unusedBlocks = [];
			var blockStartsAt = -1;
			for (var i=1; i<128; ++i) 
			{
				if (!keywordChars[i] && !varsNotReassigned[i]) {
					// not present in code, or used for naming variables only : add to candidate characters
					// variables not reassigned are not included in the pool (we do not want to rename another variable to that)
					if (blockStartsAt==-1) {
						blockStartsAt = i;
					}
				} else {
					// present in code, ends block if started
					if (blockStartsAt!=-1) {
						unusedBlocks.push( {first:blockStartsAt, nextToLast:i});
						blockStartsAt = -1;
					}
				}
			}
			// Fix for #94 : add the lask block if it was initialized
			if (blockStartsAt!=-1) {
				unusedBlocks.push( {first:blockStartsAt, nextToLast:i});
			}
			
			// There will always be enough characters, since we count those we are trying to eliminate
			// In the worst case, variables will be renamed to themselves, with no loss.
			// Sort the blocks, shortest to longest.
			// Fix for #29 : added tiebreaker (ASCII order) to get a consistent result
			// (weight of 1/1000 so it does not interfere with the main comparison)
			unusedBlocks.sort( function(a,b) { return (a.nextToLast-a.first)-(b.nextToLast-b.first)+.001*(a.first-b.first); } );

			detailsSub1 = "Adding letters : ";
			detailsSub2 = "Not renaming : ";
			var blockIndex = 0;
			while (lettersNeeded) {
				for (var i=unusedBlocks[blockIndex].first;  lettersNeeded>0 && i<unusedBlocks[blockIndex].nextToLast; ++i) {
					if (this.isCharAllowedInVariable(i) && !this.isDigit(i)) {
						var variableName = String.fromCharCode(i);
						var indexInFormerList = formerVariableCharList.indexOf(variableName);
						if (indexInFormerList>-1) {
							// variable name already in use : do not rename it
							formerVariableCharList = formerVariableCharList.substr(0,indexInFormerList)
													+formerVariableCharList.substr(indexInFormerList+1);
							detailsSub2+=variableName;
						} else {
							detailsSub1+=variableName;
							availableCharList+=variableName;
						}
						--lettersNeeded;
					}
				}
				++blockIndex;
			}
			details+=detailsSub1+"\n"+detailsSub2+"\n";
			
		}
		details += formerVariableCharList.length?"Renaming variables : \n":"No variables to rename.\n";
		var output = input;
		// Perform the replacement inside all relevant strings
		for (var i=0; i<formerVariableCharList.length; ++i)
		{
			var oldVarName = formerVariableCharList[i];
			var exp = new RegExp("(^|[^\\w\\d$_])"+(oldVarName=="$"?"\\":"")+oldVarName,"g");
			// #57 : replace if not in string, or if inside a substitution pattern in a `template literal`
			
			var stringIndex = 0, templateLiteralIndex = 0;
			var variableMatch = exp.exec(output);
			while (variableMatch && variableMatch[0] != "") {
				var offset = variableMatch.index+variableMatch[0].indexOf(oldVarName);
				while (stringIndex < inputData.containedStrings.length && inputData.containedStrings[stringIndex].end < offset) {
					++stringIndex;
				}
				while (templateLiteralIndex < inputData.containedTemplateLiterals.length && inputData.containedTemplateLiterals[templateLiteralIndex].end < offset) {
					++templateLiteralIndex;
				}
				var insideString = (stringIndex < inputData.containedStrings.length 
					&& inputData.containedStrings[stringIndex].begin < offset
					&& offset < inputData.containedStrings[stringIndex].end);
				var insideTemplateLiteral = (templateLiteralIndex < inputData.containedTemplateLiterals.length 
					&& inputData.containedTemplateLiterals[templateLiteralIndex].begin < offset
					&& offset < inputData.containedTemplateLiterals[templateLiteralIndex].end);
					
				if (insideTemplateLiteral || !insideString) {	// perform replacement
					output = output.substr(0, offset) + availableCharList[i] + output.substr(offset+1);
				}
				variableMatch = exp.exec(output);
			}

			// Perform the replacement on the code appended by refactorToSetInterval()
			inputData.interpreterCall = inputData.interpreterCall.replace(exp, "$1"+availableCharList[i]);
			inputData.wrappedInit = inputData.wrappedInit.replace(exp, "$1"+availableCharList[i]);
			
			// replace the packed code holder definition and usage as well
			// (some code is designed to reuse the string - see JsCrush or Impossible Road)
			if (formerVariableCharList[i]==inputData.packedCodeVarName) {
				inputData.packedCodeVarName = availableCharList[i];
			}
			details += "  "+oldVarName+ " => "+availableCharList[i]+"\n";
		}
		
		// output stored in inputData parameter instead of being returned
		inputData.contents = output;
		inputData.log += details;		
	},
	
	/**
	 * Recognize all strings and template literals inside the input code
	 *
	 * Offset to beginning and end are stored into a table, along with
	 *  - delimiters used : ", ' or `(since ES6)
	 *  - other delimiters present inside the string
     *  - if the string definition and allocation is standalone, and could thus be extracted	 
	 *
	 * Fields from the PackerData are cleared before they are filled, making the function safe to call multiple times
	 *
	 * @param inputData (in/out) PackerData structure containing the setup and the code to process
	 * @param silent Boolean, true to keep logs untouched, false to add strings to the logs
	 * @return nothing. Result is stored inside parameter inputData (containedStrings and containedTemplateLiterals)
	 */
	identifyStrings : function (inputData, silent)
	{
		var details = "\nStrings present in the code :\n";
		var inString = false;
		var currentString = false;
		var currentTemplateLiteral = false;
		var input = inputData.contents;
		var escaped = false;
		var insideTemplateLiteral = 0;
		var currentChar = 0;
		
		inputData.containedStrings = [];
		inputData.containedTemplateLiterals = [];

		for (var i=0; i<input.length; ++i) {
			var formerChar = currentChar;
			currentChar = input.charCodeAt(i);
			// delimiters : 34 " , 39 ' , 96 `
			if (currentChar==34 || currentChar==39 || currentChar==96) {
				if (currentString) {
					if (currentChar == currentString.delimiter && !escaped && !insideTemplateLiteral) {
						// found the match to the string begin
						currentString.end = i;
						inputData.containedStrings.push(currentString);
						details += "("+currentString.begin+"-"+currentString.end+") ";
						details += currentString.characterCount[39]+"' "+currentString.characterCount[34]+'" '+currentString.characterCount[96]+"` ";
						details += String.fromCharCode(currentString.delimiter)+input.substr(currentString.begin+1, currentString.end-currentString.begin-1)+String.fromCharCode(currentString.delimiter)+"\n";
						currentString = false;
					} else {
						// another delimiter in the string, such as "`" or '"'
						++currentString.characterCount[currentChar];
					}
				} else {
					// start a new string
					inString = true;
					currentString = { begin:i, end:-1, delimiter:currentChar, characterCount:Array(128).fill(0) };
				}
			} 
			if (formerChar==36 && currentChar==123 && currentString) { // 36 $, 123 {
				if (currentString.delimiter==96) { // 96 `
					// #82 : inside a template literal, backticks do not terminate the string
					++insideTemplateLiteral;
					if (insideTemplateLiteral == 1) {
						currentTemplateLiteral = { begin: i, end: -1 };
					}
				}
			}
			if (currentChar==125 && currentString && insideTemplateLiteral>0) { // 125 }
				if (currentString.delimiter==96) { // 96 `
					// #82 : inside a template literal, backticks do not terminate the string
					--insideTemplateLiteral;
					if (!insideTemplateLiteral) {
						currentTemplateLiteral.end=i;
						inputData.containedTemplateLiterals.push(currentTemplateLiteral);
					}
				}
			}
			escaped = (currentChar==92 && !escaped);
		}
		
		if (inputData.containedTemplateLiterals.length) {
			details += "\nTemplate literals present in the code :\n";
		}
		for (var i=0; i<inputData.containedTemplateLiterals.length; ++i) {
			var currentTemplateLiteral = inputData.containedTemplateLiterals[i];
			details += "("+currentTemplateLiteral.begin+"-"+currentTemplateLiteral.end+") ";
			details += input.substr(currentString.begin-1, currentString.end-currentString.begin+2)+"\n";
		}
		
		if (!silent) {
			inputData.log+=details+"\n";
		}
		
	},
	
	/**
	 * Choose the delimiter for the final (packed) string
	 *
	 * Change the delimiters for strings inside as needed
	 *
	 * @param inputData (in/out) PackerData structure containing the setup and the code to process
	 * @param options options set, see below for use details
	 * @return nothing. Result is stored inside parameter inputData.
	 * Options used are :
	 *  useES6 : try ` as string delimiter if enables
	 */
	quoteStrings : function (inputData, options) {
		// candidate delimiters
		var allDelimiters = [ "'", '"' ];
		if (options.useES6) {
			allDelimiters.push("`");
		}
		
		var bestCost = 999, bestDelimiter = '"', bestNewStringQuotes = 0;
		var details = "\Wrapping packed code in :\n";
		for (var delimiter of allDelimiters) {
			var cost = 0;
			var delimCode = delimiter.charCodeAt(0);
			var newStringQuotes = [];
			for (var i=0; i<inputData.containedStrings.length; ++i) {
				cost += inputData.containedStrings[i].characterCount[delimCode] + (inputData.containedStrings[i].delimiter==delimCode ? 2 : 0);
				
				var bestNewQuote = String.fromCharCode(inputData.containedStrings[i].delimiter);
				if (inputData.containedStrings[i].delimiter != 96) {
					// Attempt to regain bytes by changing the string delimiter 
					// only if it is ' or ", not ` as this would disable template literals
					//  - gain all escapes from current delimiter being present inside the string
					//  - gain 2 if the current string delimiter matches the chosen one for the packed string (as it will not have to be escaped)
					//  - lose 1 for each copy of the new delimiter within the string
					//  - lose 2 if the new string delimiter matches the chosen one for the packed string (as it will have to be escaped)
					var bestStringGain = 0; 
					var allStringDelimiters = [ "'", '"' ];
					// only allow ` as delimiter if both ES6 flag is on, and the string does not contain "${"
					// (as it would be mistaken for an expression placeholder)
					var placeholderIndex = inputData.contents.indexOf("${", inputData.containedStrings[i].begin);
					if (options.useES6 && (placeholderIndex==-1 || placeholderIndex>inputData.containedStrings[i].end)) {
						allStringDelimiters.push("`");
					}
					for (var stringDelimiter of allStringDelimiters) {
						var stringGain = 0;
						var stringDelimCode = stringDelimiter.charCodeAt(0);
						stringGain = inputData.containedStrings[i].characterCount[inputData.containedStrings[i].delimiter];
						stringGain += inputData.containedStrings[i].delimiter==delimCode ? 2 : 0;
						stringGain -= inputData.containedStrings[i].characterCount[stringDelimCode];
						stringGain -= stringDelimCode==delimCode ? 2 : 0;
						
						// give a slight malus when changing the delimiter of a string
						// so if the cost is tied, the solution that changes the least strings is preferred
						stringGain -= (inputData.containedStrings[i].delimiter == stringDelimCode ? 0 : 0.01);
						if (stringGain > bestStringGain) {
							bestNewQuote = stringDelimiter;
							bestStringGain = stringGain;
						}
					}
					
					cost -= bestStringGain;
				}
				newStringQuotes.push(bestNewQuote);
			}
								
			details += " "+delimiter+" : cost = "+cost+"\n";
			if (cost < bestCost) {
				bestDelimiter = delimiter;
				bestCost = cost;
				bestNewStringQuotes = newStringQuotes.slice();
			}
		}
		inputData.packedStringDelimiter = bestDelimiter;
		
		// perform replacement in strings
		// we cannot use stringHelper.matchAndReplaceAll() as only some instances of the string are replaced in the code
		var currentTransform = [];
		var newInput = "", offset = 0;
		for (var i=0; i<inputData.containedStrings.length; ++i) {
			var currentString = inputData.containedStrings[i];
			let intervalMapping = {	// transform : iso mapping of the space between two strings
				chapter : 0,
				rangeIn : [offset, currentString.begin-offset],
				rangeOut: [newInput.length, currentString.begin-offset]
			};
			currentTransform.push(intervalMapping);
			newInput += inputData.contents.substr(offset, currentString.begin-offset);
			var newDelimiter = bestNewStringQuotes[i];
			var currentDelimiter = String.fromCharCode(currentString.delimiter);
			let stringMapping = { // transform : mapping of the string before / after
				// initialize with an iso mapping
				chapter : 0,
				rangeIn : [currentString.begin, currentString.end-currentString.begin+1],
				rangeOut: [newInput.length, currentString.end-currentString.begin+1]
			};
			if (currentDelimiter == newDelimiter) {
				// keep the delimiter for the current string 
				// copy as is and keep the iso mapping
				newInput += inputData.contents.substr(currentString.begin, currentString.end-currentString.begin+1);
			} else {
				// replace the delimiter, escape and unescape as needed
				var exp = new RegExp("\\"+currentDelimiter, "g");
				var rawString = inputData.contents.substr(currentString.begin+1, currentString.end-currentString.begin-1);
				rawString = rawString.replace(exp, currentDelimiter);
				exp = new RegExp(newDelimiter, "g");
				rawString = rawString.replace(exp, "\\"+newDelimiter);
				var quote = (newDelimiter==inputData.packedStringDelimiter ? "\\" : "")+newDelimiter;
				
				details += "("+currentString.begin+"-"+currentString.end+") : ";
				details += String.fromCharCode(inputData.containedStrings[i].delimiter)+" -> "+newDelimiter+"\n";
				inputData.containedStrings[i].begin = newInput.length;
				inputData.containedStrings[i].delimiter = newDelimiter;
				var replacementString = quote + rawString + quote;
				stringMapping.rangeOut[1] = replacementString.length;	// map to actual length
				newInput += replacementString;
				inputData.containedStrings[i].end = newInput.length-1;
				
			}
			offset = currentString.end+1;
			currentTransform.push(stringMapping);
			
		}
		newInput += inputData.contents.substr(offset);
		let intervalMapping = {	// transform : iso mapping of the space at the end
				chapter : 0,
				rangeIn : [offset, inputData.contents.length-offset],
				rangeOut: [newInput.length, inputData.contents.length-offset]
			};
		currentTransform.push(intervalMapping);
		inputData.contents = newInput;
		
		inputData.log+=details+"\n";		
	}
	
}

// Node.js exports (for packer)
if (typeof require !== 'undefined') {
	module.exports = ShapeShifter;
}
