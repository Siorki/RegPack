
function resultMessage(sourceSize, resultSize)
{
	return sourceSize+'B to '+resultSize+'B ('+(resultSize-sourceSize)+'B, '+(((resultSize-sourceSize)/sourceSize*1e4|0)/100)+'%)'
}


function cmdRegPack(input, options) {
	
	packer.runPacker(input, options);
	var methodCount = packer.inputList.length;
	
	var bestMethod=0, bestCompression=1e8;
	for (var i=0; i<methodCount; ++i) {
		for (var j=0; j<4; ++j) {
			if (packer.inputList[i][j+1][0] < bestCompression) {
				bestCompression = packer.inputList[i][j+1][0];
				bestMethod = i;
			} 
		}
	}

        var bestVal = "";
        var mes = "";
	for (var j=0; j<3; ++j) {
		var stage = j<2 ? j+1 : (packer.inputList[bestMethod][3][0]< packer.inputList[bestMethod][4][0] ? 3 : 4);
                if( bestCompression==packer.inputList[bestMethod][stage][0] ) {
                        bestVal =  packer.inputList[bestMethod][stage][1];
                        mes = resultMessage(packer.originalLength, packer.inputList[bestMethod][stage][0]);
                }
	}
        //console.log("packer:", packer.inputList[bestMethod]);
        console.warn("stats:", mes);
        return bestVal;
}


function RegPack() {
	this.matchesLookup = [];
	this.originalInput='';
	this.input='';
	this.originalLength=0;
	
	// hashing functions for method and property renaming
	this.hashFunctions = [
		["w[x]", 0, 2, 0, 0, function(w,x,y) { return w[x]; } ],
		["w[x]+w[y]", 0, 2, 0, 2, function(w,x,y) { return w[x]+w[y]; } ],
		["w[x]+w.length", 0, 2, 0, 0, function(w,x,y) { return w[x]+w.length; } ],
		["w[x]+w[w.length-1]", 0, 2, 0, 0, function(w,x,y) { return w[x]+w[w.length-1]; } ],
		["w[x]+[w[y]]", 0, 2, 3, 20, function(w,x,y) { return w[x]+[w[y]]; } ],
		["w[0]+w[x]+[w[y]]", 0, 2, 3, 20, function(w,x,y) { return w[0]+w[x]+[w[y]]; } ],
		["w[1]+w[x]+[w[y]]", 0, 2, 3, 20, function(w,x,y) { return w[1]+w[x]+[w[y]]; } ],
		["w[2]+w[x]+[w[y]]", 0, 2, 3, 20, function(w,x,y) { return w[2]+w[x]+[w[y]]; } ],
		["w[0]+[w[x]]+[w[y]]", 3, 20, 3, 20, function(w,x,y) { return w[0]+[w[x]]+[w[y]]; } ],
		["w.substr(x,3)", 0, 2, 0, 0, function(w,x,y) { return w.substr(x,3); } ]
	];
}


RegPack.prototype = {

	
	/**
	 * Main entry point for RegPack
	 */
	runPacker : function(input, options) {
		this.environment = '';	// execution environment for unpacked code. Can become 'with(...)'
		this.interpreterCall = 'eval(_)';	// call to be performed on unpacked code.
		this.wrappedInit = '';	// code inside the unpacked routine


		var input = input.replace(/([\r\n]|^)\s*\/\/.*|[\r\n]+\s*/g,'');
		var default_options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : false,
			contextVariableName : true,
			contextType : parseInt(0),
			reassignVars : true,
			varsNotReassigned : ['a', 'b', 'c'],
			crushGainFactor : parseFloat(2),
			crushLengthFactor : parseFloat(1),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : ""
		};
		for (var opt in default_options) {
			if (!(opt in options)) {
				options[opt] = default_options[opt];
			}
		}
		this.preprocess(input, options);
		for (var inputIndex=0; inputIndex < this.inputList.length; ++inputIndex)
		{
			this.input = this.inputList[inputIndex][1][1].replace(/\\/g,'\\\\');
			
			// first stage : configurable crusher
			var output = this.findRedundancies(options);
			this.inputList[inputIndex].push(output);
			
			// second stage : convert token string to regexp
			output = packer.packToRegexpCharClass(options);
			this.inputList[inputIndex].push(output);
			
			// third stage : try a negated regexp instead
			output = packer.packToNegatedRegexpCharClass();
			this.inputList[inputIndex].push(output);
			
			
		}
	},

	/**
	 * Preparation stage : attempt to rehash the methods from canvas context
	 * Produces a pair of hashed/not hashed strings for each option
	 * so each selected flag doubles the number of tests.
	 * Creates a list with all the combinations to feed to the packer, one at a time.
	 * "with Math()" option is applied on all entries if selected (does not create a pair)
	 *
	 * @param input : the string to pack
	 * @param options : packing options, as follows
	 *       -  withMath : true if the option "Pack with(Math)" was selected, false otherwise
	 *       -  hash2DContext : true if the option "Hash and rename 2D canvas context" was selected, false otherwise
	 *       -  hashWebGLContext : true if the option "Hash and rename WebGL canvas context" was selected, false otherwise
	 *       -  hashAudioContext : true if the option "Hash and rename AudioContext" was selected, false otherwise
	 *       -  contextVariableName : a string representing the variable holding the context if the "assume context" option was selected, false otherwise
	 *       -  contextType : the context type (0=2D, 1=WebGL) if the "assume context" option was selected, irrelevant otherwise
	 *       -  reassignVars : true to globally reassign variable names 
	 *       -  varsNotReassigned : boolean array[128], true to prevent variable from being renamed
	 *       -  wrapInSetInterval : true to wrap the unpacked code in a setInterval() call instead of eval()
	 *       -  timeVariableName : if "setInterval" option is set, the variable to use for time (zero on first loop, nonzero after)
	 */
	preprocess : function(input, options) {
		this.originalInput = input;
		this.originalLength = this.getByteLength(input);
		if (options.withMath) {
			input = input.replace(/Math\./g, '');
			this.environment = 'with(Math)';
		}
		
		var inputList = [];
		if (options.wrapInSetInterval) {
			var refactored = this.refactorToSetInterval(input, options.timeVariableName, options.varsNotReassigned);
			inputList.push(["", refactored]);
		} else {
			inputList.push(["", [this.getByteLength(input), input, ""]]);
		}
		
		
		// Hash and rename methods of the 2d canvas context
		//  - method hashing only
		//  - method and property
		// then store the results in the inputList
		if (options.hash2DContext) {
			var canvas = document.createElement("canvas");
			var context = canvas.getContext("2d");
			for (var count=inputList.length, i=0; i<count; ++i)
			{
				var result = this.preprocess2DContext(inputList[i][1][1], (options.contextType==0?options.contextVariableName:false), context, options.varsNotReassigned, inputList[i][1][2]);
				if (result) {
					inputList.push([inputList[i][0]+" 2D(methods)", result[0]]);
					inputList.push([inputList[i][0]+" 2D(properties)", result[1]]);
				}
			}
		}
		
		// for WebGL contexts, there are three options 
		//   - hash and replace method names only 
		//   - as above, plus replace the definitions of constants with their values (magic numbers)
		//   - hash and replace method and property names
		if (options.hashWebGLContext) {
			var canvas = document.createElement("canvas");
			var context = canvas.getContext("experimental-webgl");
			for (var count=inputList.length, i=0; i<count; ++i)
			{
				var result = this.preprocessWebGLContext(inputList[i][1][1], (options.contextType==1?options.contextVariableName:false), context, options.varsNotReassigned, inputList[i][1][2]);
				if (result) {
					inputList.push([inputList[i][0]+" WebGL(methods)", result[0]]);
					inputList.push([inputList[i][0]+" WebGL(methods+constants)", result[1]]);
					inputList.push([inputList[i][0]+" WebGL(properties)", result[2]]);
				}
			}
		}

		// for AudioContexts, method hashing only
		if (options.hashAudioContext) {
			var context = new AudioContext;
			for (var count=inputList.length, i=0; i<count; ++i) 
	 		{
				var result = this.preprocessAudioContext(inputList[i][1][1], context, options.varsNotReassigned, inputList[i][1][2]);
				if (result) {
					inputList.push([inputList[i][0]+" Audio", result]);
				}	
			}
		}
		inputList[0][0]="unhashed";
		
		if (options.reassignVars)
		{
			for (var i=0; i<inputList.length; ++i) {
				var result = this.reassignVariableNames(inputList[i][1][1], options.varsNotReassigned);
				inputList[i][1][1] = result[0];
				inputList[i][1][2] += result[1];
			}
		}
		this.inputList = inputList;
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
	 * It only needs to be zero on the first run to trigger the initialization
	 * sequence, then nonzero on the subsequent runs.
	 *
	 * Returns an array 
	 * [refactored code size, refactored code, information log]
	 * 
	 * @param input the code to refactor
	 * @param timeVariableName the variable containing time, or empty
	 * @param varsNotReassigned boolean array[128], true to avoid altering variable
	 * @return result of refactoring
	 * 
	 */
	refactorToSetInterval : function(input, timeVariableName, varsNotReassigned) {
		var output = input;
		var details = "----------- Refactoring to run with setInterval() ---------------\n";
		var timeVariableProvided = true;
		var loopMatch = input.match(/setInterval\(function\(([\w\d.=]*)\){/);
		if (loopMatch) {
			var initCode = input.substr(0, loopMatch.index);
			// remove any trailing comma or semicolon			
			if (initCode[initCode.length-1]==';' || initCode[initCode.length-1]==',') {
				initCode = input.substr(0, initCode.length-1);
			}
			
			details += "First "+loopMatch.index+" bytes moved to conditional sequence.\n";
			
			if (timeVariableName=="") {
				timeVariableProvided = false;
				timeVariableName = this.allocateNewVariable(input);
				details += "Using variable "+timeVariableName+" for time.\n";
			}
			
			// Strip the declaration of the time variable from the init code,
			// as it will be defined in the unpacking routine instead.
			var timeDefinitionExp = new RegExp("(^|[^\\w$])"+timeVariableName+"=","g");
			var timeDefinitionMatch=timeDefinitionExp.exec(initCode);
			if (timeDefinitionMatch) {
				var timeDefinitionBegin = timeDefinitionMatch.index+timeDefinitionMatch[1].length;
				var timeDefinitionEnd = timeDefinitionBegin+2;
				
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
					finalCode = ";"+finalCode;
				}
				details += "Interval of "+delayMatch[1]+ "ms pushed to unpacking routine.\n";
				
				// wrap the initialization code into a conditional sequence :
				//   - if(!t){/*init code*/} if the variable is used (and set) afterwards
				//   - if(!t++){/*init code*/} if it is created only for the test
				initCode = "if(!"+timeVariableName+(timeVariableProvided?"":"++")+"){"+loopMatch[1]+initCode+finalCode+"}";
				output = initCode+input.substr(loopMatch.index+loopMatch[0].length, index-loopMatch.index-loopMatch[0].length-1);
				
				this.interpreterCall = 'setInterval(_,'+delayMatch[1]+')';
				this.wrappedInit = timeVariableName+'=0';
			 } else {	// delayMatch === false
				details += "Unable to find delay for setInterval, module skipped.\n";
			}
			
		} else {
			details += "setInterval() loop not found, module skipped.\n";
		}
		details += "\n";
		return [output.length, output, details];
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
	 * @param input the code to preprocess
	 * @param variableName the variable holding the context if defined outside of the input (shim), false otherwise
	 * @param context an instance of a canvas 2d context, to list method names
	 * @param varsNotReassigned boolean array[128], true to keep name of variable
	 * @param initialLog : the action log, new logs will be appended	 
	 * @return the result array, or false if no 2d context definition is found in the code.
	 */
	preprocess2DContext : function(input, variableName, context, varsNotReassigned, initialLog) {
		// Obtain all context definitions (variable name and location in the code)
		var objectNames = [], objectOffsets = [], objectDeclarationLengths = [], searchIndex = 0;
		initialLog += "----------- Hashing methods/properties for 2D context -----------\n";
		// Start with the preset context, if any
		if (variableName)
		{
			objectNames.push(variableName);
			objectOffsets.push(0);
			objectDeclarationLengths.push(0);
		}
		// Then search for additional definitions inside the code. Keep name, declaration offset, and declaration length
		var declarations = input.match (/([\w\d.]*)=[\w\d.]*\.getContext\(['"]2d['"]\)/gi);
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

		// Fix for issue #20 - make sure the behavior is identical in all browsers
		// by creating extra methods / properties
		// needs to be reconsidered at each new browser revision 
		// (current are FF 36 / Chrome 41)
		context["ellipse"]=context["arc"];	// Chrome only, not in FF 36
		context["getContextAttributes"]=context["arc"];	// Chrome only, not in FF 36
		context["imageSmoothingEnabled"]=true; // Chrome only, not in FF 36
		context["mozCurrentTransform"]=context.transform;	// FF-prefixed
		context["mozCurrentTransformInverse"]=context.transform;	// FF-prefixed
		context["mozDash"]=[5,5];	// FF-prefixed
		context["mozDashOffset"]=context.lineDashOffset;	// FF-prefixed
		context["mozFillRule"]="nonZero";	// FF-prefixed
		context["mozImageSmoothingEnabled"]=true;	// FF-prefixed
		context["mozTextStyle"]="20pt Arial";	// FF-prefixed
		context["webkitImageSmoothingEnabled"]=true; // Chrome-prefixed
		context["drawImageFromRect"]=context["drawImage"];	// deprecated, gone from Chrome 41+
		
		if (objectNames.length) {
			var hashedCodeM = this.renameObjectMethods(input, objectNames, objectOffsets, objectDeclarationLengths, context, varsNotReassigned, initialLog);
			var hashedCodeP = this.hashObjectProperties(input, objectNames, objectOffsets, objectDeclarationLengths, context, varsNotReassigned, initialLog);
			return [hashedCodeM, hashedCodeP];
		}
		return false;
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
	 * @param input the code to preprocess
	 * @param variableName the variable holding the context if defined outside of the input (shim), false otherwise
	 * @param context an instance of a canvas webgl context, to list method names
	 * @param varsNotReassigned boolean array[128], true to keep name of variable
	 * @param initialLog : the action log, new logs will be appended	 
	 * @return the result array, or false if no webgl context definition is found in the code.
	 */
	preprocessWebGLContext : function(input, variableName, context, varsNotReassigned, initialLog) {
		// Obtain all context definitions (variable name and location in the code)
		var objectNames = [], objectOffsets = [], objectDeclarationLengths = [], searchIndex = 0;
		initialLog += "----------- Hashing methods/properties for GL context -----------\n";
		// Start with the preset context, if any
		if (variableName)
		{
			objectNames.push(variableName);
			objectOffsets.push(0);
			objectDeclarationLengths.push(0);
		}
		// Then search for additional definitions inside the code. Keep name, declaration offset, and declaration length
		var declarations = input.match (/([\w\d.]*)\s*=\s*[\w\d.]*\.getContext\(['"](experimental-)*webgl['"](,[\w\d\s{}:.,]*)*\)(\s*\|\|\s*[\w\d.]*\.getContext\(['"](experimental-)*webgl['"](,[\w\d\s{}:.,]*)*\))*/gi);
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
			// method only hashing
			var hashedCodeM = this.renameObjectMethods(input, objectNames, objectOffsets, objectDeclarationLengths, context, varsNotReassigned, initialLog);
			
			// builds on former, replaces constants as well
			var hashedCodeMC = this.replaceWebGLconstants(hashedCodeM[1], objectNames, context,  hashedCodeM[2]);
			
			// method and property hashing
			var hashedCodeP = this.hashObjectProperties(input, objectNames, objectOffsets, objectDeclarationLengths, context, varsNotReassigned, initialLog);0
			return [hashedCodeM, hashedCodeMC, hashedCodeP];
		}

		return false;
	},
	
	/**
	 * Replaces, in the provided code, all definition of WebGL constants with their numerical values
	 * Uses a context reference passed from a shim, or attempts to locate in inside the code.
	 * Returns an array in the same format as the compression methods : [output length, output string, informations],
	 * even if the replacement actually lenghtened the string.
	 * Only the constant values in CAPITALS are replaced. Other properties and methods are untouched.
	 *
	 * @param input the code to perform replacement on
	 * @param objectNames array containing variable names of context objects (mandatory)
	 * @param context an instance of a canvas webgl context, to check for exiting properties and obtain their values
	 * @param initialLog : the action log, new logs will be appended	 
	 * @return an array [length, output, user message]
	 */
	replaceWebGLconstants : function (input, objectNames, context, initialLog)
	{
		var output = input, details=initialLog;
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex)
		{
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
				if (constantsInUse[index] in context) {
					var constant = context[constantsInUse[index]];
					var exp = new RegExp("(^|[^\\w$])"+objectNames[contextIndex]+"\\."+constantsInUse[index]+"(^|[^\\w$])","g");						
					output = output.replace(exp, "$1"+constant+"$2");
					// show the renaming in the details
					details += constantsInUse[index] + " -> " + constant + "\n";
				}
			}
		}
		details+="\n";
		return [this.getByteLength(output), output, details];
		
	},
	
	/**
	 * Performs an optimal hashing and renaming of the methods of an AudioContext.
	 * Unlike 2D contexts, only one audio context is considered.
	 *
	 * Returns an array in the same format as the compression methods : [output length, output string, informations],
	 * even if the preprocessing actually lenghtened the string.
	 *
	 * @param input the code to preprocess
	 * @param context an instance of an AudioContext, to list method names
	 * @param varsNotReassigned boolean array[128], true to keep name of variable
	 * @param initialLog : the action log, new logs will be appended	 
	 * @return the result array, or false if no AudioContext definition is found in the code.
	 */

	preprocessAudioContext : function(input, context, varsNotReassigned, initialLog) {
		// Initialization of a *AudioContext can be performed in a variety of ways
		// and is usually less consistent that a 2D or WebGL graphic context.
		// Multiple tests cover the most common cases
		var objectOffset = 0;
		var replacementOffset = 0;
		var objectName = "";
		var details = initialLog;
		details += "----------- Hashing methods for AudioContext --------------------\n";

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
				var halfReplaced =this.renameObjectMethods(input, [secondObjectName], [secondReplacementOffset], [0], context, varsNotReassigned, details);
				input = halfReplaced[1];
				details = halfReplaced[2];
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
			var preprocessedCode = this.renameObjectMethods(input, [objectName], [replacementOffset], [0], context, varsNotReassigned, details);
			return preprocessedCode;
		}
		return false;
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
	 * @param input : the string to pack
	 * @param objectNames : array containing variable names of context objects, whose methods to rename in the source string
	 * @param objectOffsets : array, in the same order, of character offset to the beginning of the object declaration. Zero if defined outside (shim)
	 * @param objectDeclarationLengths : array, in the same order, of lengths of the object declaration, starting at offset. Zero if defined outside (shim)
	 * @param reference : an instance of an object of the same type (2D context, WebGL context, ..) to extract method names
	 * @param varsNotReassigned : boolean array[128], true to keep name of variable
	 * @param initialLog : the action log, new logs will be appended
	 * @return the result of the renaming as an array [output length, output string, informations]
	 */
	renameObjectMethods : function(input, objectNames, objectOffsets, objectDeclarationLengths, reference, varsNotReassigned, initialLog)
	{
				
		var details = initialLog || '';
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
					for (w in reference) {	
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
								score += methodsInUse[methodIndex].length - forwardLookup[methodsInUse[methodIndex]].length;
							}
						}
						score -= 7; // c[hash]=c[i], "[hash]=" is packed for 1, remain "c" and "c[i]," total 1+1+5
						score = Math.max(0, score); // if the gain is negative, no replacement will be performed
						allScores.push(score); 
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
			return [this.getByteLength(input), input, details];
		}
		
		// best hash function (based on byte gain) found. Apply it
		var reverseLookup = [], forwardLookup = [];
		for (w in reference) {	
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
						// replace all instances of that method ("g" option in the RegExp)
						// The opening bracket at the end avoids triggering on a subset of the name,
						// for instance enable() instead of enableVertexAttribArray() in WebGL contexts
						// The initial character (or line start) avoids triggering if one context has a name
						// ending in another context's name (such as 'c' and 'cc')
						var exp = new RegExp("(^|[^\\w$])"+objectNames[contextIndex]+"\\."+methodsInUse[methodIndex]+"\\(","g");						
						hashedCode = hashedCode.replace(exp, "$1"+objectNames[contextIndex]+"."+forwardLookup[methodsInUse[methodIndex]]+"(");

						// show the renaming in the details, for used methods only
						details += objectNames[contextIndex]+"."+forwardLookup[methodsInUse[methodIndex]] + " -> " + methodsInUse[methodIndex] + "\n";
					}
				}
			}
		}
		details += "\n";
		
		// Choose the index variable for the added hashing code
		// The algorithm counts every instance of "for(*" with individual letters replacing the star
		// then chooses the letter with the most matches, in order to benefit most from compression
		details+='Loop variables :\n';
		var indexMatches = new Array(128) ;
		var loopIndexRegExp = /for\((\w)/g;
		var loopIndexResult=loopIndexRegExp.exec(input);
		while (loopIndexResult) {	// get a set with a unique entry for each method
			var code = loopIndexResult[1].charCodeAt(0);
			if (!varsNotReassigned[code]) {
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
				details += String.fromCharCode(i)+" *"+indexMatches[i]+(indexName == String.fromCharCode(i)?" <-- selected":"")+"\n";
			}
		}
		details += "\n";
		

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
		var output = hashedCode.substr(0, offset);
		
		// Insert the hashing/renaming loop in the code.
		// If the context definition is not included (js1k shim for instance), the loop is prepended to the code and ends with ";"
		// otherwise the loop replaces and includes the last declaration. The code looks like :
		//   for (i in c=a.getContext('2d'))c[...]=c[i] with a single context
		//   for (i in c=a.getContext('2d'))c[...]=b[...]=b[i] with multiple contexts (surprising, but it works)
		// The ending separator is kept, unless it is a comma ",", in which case it is replaced with a semicolon ";"
		// (to avoid including the trailing code in the loop)
		var declarationLength = objectDeclarationLengths[loopContext];
		output+="for("+indexName+" in "+(declarationLength==0?objectNames[loopContext]:hashedCode.substr(offset, declarationLength))+")";
		for (var contextIndex=0; contextIndex<objectNames.length; ++contextIndex) {
			if (bestScoreByContext[contextIndex]>=0) {	
				output+=objectNames[contextIndex]+"["+expression+"]=";
				needsComma = true;
			}
		}		
		output+=objectNames[shortestContext]+"["+indexName+"]";
		if (hashedCode[offset+declarationLength]==",") {
			// replace the trailing "," with ";" as explained above
			output+=";";
			++declarationLength;
		}
		output+=(declarationLength==0?";":"");
		output+=hashedCode.substr(offset+declarationLength);
		
		return [this.getByteLength(output), output, details];
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
	 * @param input : the string to pack
	 * @param objectNames : array containing variable names of context objects, whose methods to rename in the source string
	 * @param objectOffsets : array, in the same order, of character offset to the beginning of the object declaration. Zero if defined outside (shim)
	 * @param objectDeclarationLengths : array, in the same order, of lengths of the object declaration, starting at offset. Zero if defined outside (shim)
	 * @param reference : an instance of an object of the same type (2D context, WebGL context, ..) to extract property names
	 * @param varsNotReassigned : boolean array[128], true to keep name of variable
	 * @param initialLog : the action log, new logs will be appended
	 * @return the result of the renaming as an array [output length, output string, informations]
	 */
	hashObjectProperties : function(input, objectNames, objectOffsets, objectDeclarationLengths, reference, varsNotReassigned, initialLog)
	{				
		var details = initialLog || '';
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
					for (w in reference) {	
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
						score -= 2; // c[hash]= "[hash]=" is packed for 1, remains "c", total 1+1
						score = Math.max(0, score); // if the gain is negative, no replacement will be performed
						allScores.push(score); 
						totalScore += score;
					}
					// the score for the hash is the gain as computed above,
					// minus the length of the hash function itself.
					totalScore-=functionDesc[0].replace(/x/g, xValue).replace(/y/g, yValue).length;
					
					//debug
					details +=functionDesc[0].replace(/x/g, xValue).replace(/y/g, yValue) + " : "+totalScore +"\n";
									
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
		for (w in reference) {	
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
						// The opening bracket at the end avoids triggering on a subset of the name,
						// for instance enable() instead of enableVertexAttribArray() in WebGL contexts
						// The initial character (or line start) avoids triggering if one context has a name
						// ending in another context's name (such as 'c' and 'cc')
						var exp = new RegExp("(^|[^\\w$])"+objectNames[contextIndex]+"\\."+propertiesInUse[propertyIndex],"g");						
						hashedCode = hashedCode.replace(exp, "$1"+objectNames[contextIndex]+"["+objectNames[shortestContext]+"."+forwardLookup[propertiesInUse[propertyIndex]]+"]");

						// show the renaming in the details, for used properties only
						details += objectNames[contextIndex]+"."+forwardLookup[propertiesInUse[propertyIndex]] + " -> " + propertiesInUse[propertyIndex] + "\n";
					}
				}
			}
		}
		details += "\n";
		
		// Choose the index variable for the added hashing code
		// The algorithm counts every instance of "for(*" with individual letters replacing the star
		// then chooses the letter with the most matches, in order to benefit most from compression
		details+='Loop variables :\n';
		var indexMatches = new Array(128) ;
		var loopIndexRegExp = /for\((\w)/g;
		var loopIndexResult=loopIndexRegExp.exec(input);
		while (loopIndexResult) {	// get a set with a unique entry for each property
			var code = loopIndexResult[1].charCodeAt(0);
			if (!varsNotReassigned[code]) {
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
				details += String.fromCharCode(i)+" *"+indexMatches[i]+(indexName == String.fromCharCode(i)?" <-- selected":"")+"\n";
			}
		}
		details += "\n";
		

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
		var output = hashedCode.substr(0, offset);
		
		// Insert the hashing/renaming loop in the code.
		// If the context definition is not included (js1k shim for instance), the loop is prepended to the code and ends with ";"
		// otherwise the loop replaces and includes the last declaration. The code looks like :
		//   for (i in c=a.getContext('2d'))c[...]=i with a single context
		//   for (i in c=a.getContext('2d'))c[...]=b[...]=i with multiple contexts
		// The ending separator is kept, unless it is a comma ",", in which case it is replaced with a semicolon ";"
		// (to avoid including the trailing code in the loop)
		var declarationLength = objectDeclarationLengths[loopContext];
		output+="for("+indexName+" in "+(declarationLength==0?objectNames[loopContext]:hashedCode.substr(offset, declarationLength))+")";
		output+=objectNames[shortestContext]+"["+expression+"]="+indexName;
		if (hashedCode[offset+declarationLength]==",") {
			// replace the trailing "," with ";" as explained above
			output+=";";
			++declarationLength;
		}
		output+=(declarationLength==0?";":"");
		output+=hashedCode.substr(offset+declarationLength);
		
		return [this.getByteLength(output), output, details];
	},

	
	/**
	 * Returns the total byte length of a string
	 *  1 for ASCII char
	 *  3 for Unicode (UTF-8)
	 * Issue #5 : final size when featuing unicode characters
	 */
	getByteLength : function (inString)
	{
		return encodeURI(inString).replace(/%../g,'i').length;
	},
	
	/**
	 * Returns true if the character code is allowed in the name of a variable.
	 * Allowed codes are 36($), 48-57(0-9), 65-90(A-Z), 95(_), 97-122(a-z)
	 */
	isCharAllowedInVariable : function (charCode)
	{
		return (charCode>64 && charCode<91) || (charCode>96 && charCode<123) 
			   || (charCode>47 && charCode<58)
			   || charCode==36 || charCode==95;
	},

	/**
	 * Returns true if the character code is a digit
	 */
	isDigit : function (charCode)
	{
		return (charCode>47 && charCode<58);
	},
	
	/**
	 * Defines and returns a packer-friendly name for a new variable.
	 * 
	 * It first lists characters used in keywords but not in existing variables.
	 * If none is found, it takes the first character not assigned
	 * to a variable.
	 * If none is available, it returns a two-letter variable.
	 * 
	 * @param input the input code to preprocess / pack
	 * @see discriminateKeywordsAndVariables
	 */
	allocateNewVariable : function(input)
	{
		var keywordsAndVariables = this.discriminateKeywordsAndVariables(input);
		var keywordChars = keywordsAndVariables[0];
		var variableChars = keywordsAndVariables[1];
		
		// first, characters already used by functions, keywords ..
		for (var i=33; i<128; ++i) {
			if (keywordChars[i] && !variableChars[i] && this.isCharAllowedInVariable(i) && !this.isDigit(i)) {
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
	 * @param input the input code to preprocess / pack
	 * @return array [ keywords, variables ], each is a boolean [128]
	 */
	discriminateKeywordsAndVariables : function(input)
	{
		var variableChars = [];
		var keywordChars = [];
		var previousChar = 0;
		var letterCount = 0;
		var isKeyword = false;
		for (var i=0; i<128; ++i) {
			variableChars[i] = keywordChars[i] = false;
		}
		// Identify characters used in the code :
		//  - those used only in keywords, method names.
		//  - those used as one-letter variable or function names only (and candidates to renaming)
		//  - those used for both variable names and within keywords
				
		for (var i=0; i<input.length; ++i) {
			var currentChar = input.charCodeAt(i);
			if (currentChar<128) {
				if (this.isCharAllowedInVariable(currentChar)) {
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
		return [ keywordChars, variableChars];
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
	 * @param input string containing the code to process
	 * @param varsNotReassigned : boolean array[128], true to keep name of variable
	 * @return array [code with reassigned variable names, informations]
	 */
	reassignVariableNames : function (input, varsNotReassigned)
	{
		var keywordsAndVariables = this.discriminateKeywordsAndVariables(input);
		var keywordChars = keywordsAndVariables[0];
		var variableChars = keywordsAndVariables[1];

		var details = "----------- Renaming variables to optimize RegExp blocks --------\n";
		details += "All variables : ";
		for (var i=32; i<128; ++i) {
			if (variableChars[i]) {
				details+=String.fromCharCode(i);
			}
		}
		details +="\n";
		
		var availableCharList = "";
		var formerVariableCharList = "";
		var detailsSub1 = "";
		var detailsSub2 = "";		
		for (var i=32; i<128; ++i) {
			// Identify as available all characters used in keywords but not variables
			if (keywordChars[i] && !variableChars[i] && !this.isDigit(i)) {
				availableCharList+=String.fromCharCode(i);
				detailsSub1+=String.fromCharCode(i);
			}
			// List all variables that can be reassigned a new name.
			// This excludes those with a one-letter name already used in a keyword (no gain in renaming them)
			// and those explicitely excluded from the process by the user.
			if (variableChars[i] && !keywordChars[i] && !varsNotReassigned[i]) {
				formerVariableCharList+=String.fromCharCode(i);
				detailsSub2+=String.fromCharCode(i);
			}
		}
		if (!availableCharList.length) {
			detailsSub1 = "(none)";
		}
		if (!formerVariableCharList.length) {
			detailsSub2 = "(none)";
		}
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
			// There will always be enough characters, since we count those we are trying to eliminate
			// In the worst case, variables will be renamed to themselves, with no loss.
			// Sort the blocks, shortest to longest
			unusedBlocks.sort( function(a,b) { return (a.nextToLast-a.first)-(b.nextToLast-b.first); } );
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
		for (var i=0; i<formerVariableCharList.length; ++i)
		{
			var oldChar = formerVariableCharList[i];
			output = output.split(formerVariableCharList[i]).join(availableCharList[i]);
			details += "  "+formerVariableCharList[i]+ " => "+availableCharList[i]+"\n";
		}
		
		return [output, details];
	},

	/**
	 * First stage : apply the algorithm common to First Crush and JS Crush
	 * Store the matches along with inner details in the array matchesLookup
	 */
	findRedundancies : function(options) {

		var s = this.input;
		this.matchesLookup = [];
		details='';
		Q=[];for(i=0;++i<127;i-10&&i-13&&i-34&&i-39&&i-92&&Q.push(String.fromCharCode(i)));
		var matches = {};
		for(var tokens='';;tokens=c+tokens) {
			for(c=0,i=122;!c&&--i;!~s.indexOf(Q[i])&&(c=Q[i]));
			if(!c)break;
			if (tokens.length==0) {	// search all string space for possible matches
				var found=true;	// stop as soon as no substring of length t is found twice
				for(var t=2;found;++t) {
					found=false;
					for(i=0;++i<s.length-t;)
						if(!matches[x=s.substr(j=i,t)])
						{
							if(~(j=s.indexOf(x,j+t)))
							{
								found=true;
								for(matches[x]=1;~j;matches[x]++)
								{
									j=s.indexOf(x,j+t);
								}
							}
						}
				}
			} else {	// only recompute the values of previously found matches
				var newMatches={};
				for(x in matches)
					for(j=s.indexOf(x),newMatches[x]=0;~j;newMatches[x]++)j=s.indexOf(x,j+x.length);
				matches = newMatches;
			}
			
			bestLength=bestValue=M=N=e=Z=0;
			for(i in matches){
				j=this.getByteLength(i);
				R=matches[i];
				Z=R*j-R-j-2;	// -1 used in JS Crush performs replacement with zero gain
				value=options.crushGainFactor*Z+options.crushLengthFactor*j+options.crushCopiesFactor*R;
				if(Z>0) {
					if(value>bestValue||bestValue==value&&(Z>M||Z==M&&(options.crushTiebreakerFactor*R>options.crushTiebreakerFactor*N))) // R>N JsCrush, R<N First Crush
						M=Z,N=R,e=i,bestValue=value,bestLength=j;
				} else {
					delete matches[i];
				}
			}
			if(!e)
				break;
				
			// update the other matches in case the selected one is a substring thereof
			var newMatches={};
			for(x in matches) {
				newMatches[x.split(e).join(c)]=1;
			}
			matches = newMatches;
			
			// and apply the compression to the string
			s=s.split(e).join(c)+c+e;
			this.matchesLookup.push({token:c, string:e, originalString:e, depends:'', usedBy:'', gain:M, copies:N, len:bestLength, score:bestValue, cleared:false, newOrder:9999});
			details+=c.charCodeAt(0)+"("+c+") : val="+bestValue+", gain="+M+", N="+N+", str = "+e+"\n";
		}
			
		c=s.split('"').length<s.split("'").length?(B='"',/"/g):(B="'",/'/g);
		i='_='+B+s.replace(c,'\\'+B)+B+';for(i in g='+B+tokens+B+')with(_.split(g[i]))_=join(pop('+this.wrappedInit+'));'+this.environment+this.interpreterCall;
		return [this.getByteLength(i), i, details];
	},

	/**
	 * Clears a match from matchesLookup for dependencies
	 */
	 clear : function(matchIndex) {
		var oldToken = this.matchesLookup[matchIndex].token;
		for (var j=0;j<this.matchesLookup.length;++j) {
			this.matchesLookup[j].usedBy = this.matchesLookup[j].usedBy.split(oldToken).join("");
		}
		this.matchesLookup[matchIndex].cleared=true;
	},
	
	/**
	 * Second stage : extra actions required to reduce the token string to a RegExp
	 *
	 * Needs and modifies the matchesLookup array
	 */
	packToRegexpCharClass : function(options) 
	{

		var details = '';
		// First, re-expand the packed strings so that they no longer contain any compression token
		// since we will be storing them in a different order.
		// Use this step to establish a dependency graph (compressed strings containing other compressed strings)
		for (var i=0;i<this.matchesLookup.length;++i) {
			for (var j=0; j<this.matchesLookup.length;++j) {
				if (this.matchesLookup[j].originalString.indexOf(this.matchesLookup[i].token)>-1) {
					this.matchesLookup[j].originalString = this.matchesLookup[j].originalString.split(this.matchesLookup[i].token).join(this.matchesLookup[i].originalString);
				}
				if (i!=j && this.matchesLookup[j].originalString.indexOf(this.matchesLookup[i].originalString)>-1) {
					this.matchesLookup[j].depends += this.matchesLookup[i].token;
					this.matchesLookup[i].usedBy += this.matchesLookup[j].token;
					
				}
			}
		}
		/** debug only
		for (i=0; i<this.matchesLookup.length; ++i) {
			c=this.matchesLookup[i];
			details += c.token.charCodeAt(0)+"("+c.token+") str1 = "+c.string+" str2 = "+c.originalString+" depends = /"+c.depends+"/\n";
		}
		*/
		
		// Define the token list that will be used by ordering blocks, from the largest to the smallest
		// Blocks are 4 or more contiguous characters : "ABCDE" can be shortened to "A-E" in the RegExp
		// The gain from RegPack v1 over the original JSCrush and First Crush comes essentially from that.
		var tokenList = [];
		var firstInLine = -1;
		for(i=1;i<127;++i) {
			var token = String.fromCharCode(i);
			if (i!=34 && i!=39 && i!=92 && this.input.indexOf(token)==-1) {
				if (firstInLine ==-1) {
					firstInLine = i;
				}
			} else {
				if (firstInLine >-1) {
					// do not start a block with CR nor LF, as the first character of the block
					// needs to be written to the regexp and those are not writable (or require escaping)
					if (firstInLine == 10 || firstInLine == 13) {
						++firstInLine;
					}					
					var tokenCount = i-firstInLine;
					// for the same reason, do not end a block with CR nor LF (watch out, the end of the block is the index before i)
					if (i==11 || i==14) {
						--tokenCount;
					}
					tokenList.push({first:firstInLine, count:tokenCount});
					firstInLine = -1;
				}
			}
		}
		if (firstInLine >-1) {
			tokenList.push({first:firstInLine, count:i-firstInLine});
		}
		// reorder the token block list, largest to smallest
		tokenList.sort(function(a,b) {return b.count-a.count; });
		
		
		// Then, flatten the dependency graph into a line. The new compression order starts
		// with the strings that are not used within another strings (usually the longer ones)
		// and ends by the strings not depending on others. The reason for that is that the
		// unpacking is performed LIFO and must begin by independent strings for RegExp-related reasons
		// (match is done on any token in the RegExp, meaning that the first instance must be
		// the separator, not another token that would be included in the string)

		// Pack again by replacing the strings by the tokens, in the new compression order
		// In case there are two or more candidates (not used by other strings), the same
		// compression scoring is used as in the first stage.
		var tokenLine = 0;	// 0-based index of current token line (block)
		var tokenIndex = 0;	// 0-based index of current token in current line
		this.tokenCount = 0; // total number of tokens used. Will be less than this.matchesLookup.length at the end if any negatives are found
		var tokenString = "";
		var regPackOutput = this.input;
		for (var i=0;i<this.matchesLookup.length;++i) {
			var matchIndex=-1, bestScore=-999, bestGain=-1, bestCount=0, negativeCleared = false;
			for (var j=0; j<this.matchesLookup.length;++j) {
				if (this.matchesLookup[j].usedBy=="" && !this.matchesLookup[j].cleared) {
					var count=0;
					for (var index=regPackOutput.indexOf(this.matchesLookup[j].originalString, 0); index>-1; ++count) {
						index=regPackOutput.indexOf(this.matchesLookup[j].originalString, index+1);
					}
					var gain = count*this.matchesLookup[j].len-count-this.matchesLookup[j].len-2;
					var score = options.crushGainFactor*gain+options.crushLengthFactor*this.matchesLookup[j].len+options.crushCopiesFactor*count;
					if (gain>=0) {
						if (score>bestScore||score==bestScore&&(gain>bestGain||gain==bestGain&&(options.crushTiebreakerFactor*count>options.crushTiebreakerFactor*bestCount))) // R>N JsCrush, R<N First Crush
							bestGain=gain,bestCount=count,matchIndex=j,bestScore=score,bestLength=this.matchesLookup[j].len;
					} else {
						// found a negative. The matching string may no longer be packed (if anything, match count will decrease, not increase)
						// so we clear it (ie remove it from the dependency chain). This in turns allows strings it uses to be packed,
						// otherwise their "usedBy" field would contain the negative and they could never be packed
						// clearing a negative introduces a bias, since some strings that were in order before it could have been
						// considered for compression, but they were not because they were "usedBy" the negative.
						// The comparison is useless : do not compress for this iteration of i 
						this.clear(j);
						negativeCleared = true;
					}
				}
			}
			if (!negativeCleared) {	// skip the compression step if we had a negative
				if (matchIndex>-1) {	// a string was chosen, replace it with the next token
					var matchedString = this.matchesLookup[matchIndex].originalString;
					this.matchesLookup[matchIndex].newOrder = this.tokenCount;
					
					// define the replacement token
					++this.tokenCount;
					if (++tokenIndex > tokenList[tokenLine].count) {
						tokenString+=String.fromCharCode(tokenList[tokenLine].first);
						if (tokenList[tokenLine].count>2) {
							tokenString+="-";
						}
						if (tokenList[tokenLine].count>1) {
							tokenString+=String.fromCharCode(tokenList[tokenLine].first+tokenList[tokenLine].count-1);
						}
						++tokenLine;
						tokenIndex=1;
					}
					var tokenCode = tokenList[tokenLine].first + tokenIndex - 1;
					// skip CR and LF characters
					// earlier checks ensured that they never end a block 
					// so we can safely skip to the next one
					if (tokenCode==10 || tokenCode==13) {
						++tokenCode;
						++tokenIndex;
					}
					var token = String.fromCharCode(tokenList[tokenLine].first+tokenIndex-1);

					details+=token.charCodeAt(0)+"("+token+"), gain="+bestGain+", N="+bestCount+", str = "+matchedString+"\n";
					regPackOutput = matchedString+token+regPackOutput.split(matchedString).join(token);
					
					// remove dependencies on chosen string/token
					this.clear(matchIndex);
				
				} else {	// remaining strings, but no gain : skip them and end the loop
					for (var j=0; j<this.matchesLookup.length;++j) {
						if (!this.matchesLookup[j].cleared) {
							details += "skipped str = "+this.matchesLookup[j].originalString+"\n";
						}
					}
					i=this.matchesLookup.length;
				}
			}
		}
		
		// add the last token to the list / token string
		tokenString+=String.fromCharCode(tokenList[tokenLine].first);
		if (tokenIndex>2) {
			tokenString+="-";
		}
		if (tokenIndex>1) {
			tokenString+=String.fromCharCode(tokenList[tokenLine].first+tokenIndex-1);
		}

		// add the unpacking code to the compressed string
		var checkedString = regPackOutput;
		c=regPackOutput.split('"').length<regPackOutput.split("'").length?(B='"',/"/g):(B="'",/'/g);
		regPackOutput='for(_='+B+regPackOutput.replace(c,'\\'+B)+B;
		regPackOutput+=';g=/['+tokenString+']/.exec(_);)with(_.split(g))_=join(shift('+this.wrappedInit+'));'+this.environment+this.interpreterCall;
		
		var resultSize = this.getByteLength(regPackOutput);
		
		details+="------------------------\nFinal check : ";
		var regToken = new RegExp("["+tokenString+"]","");
		for(var token="" ; token = regToken.exec(checkedString) ; ) {
			var k = checkedString.split(token);
			checkedString = k.join(k.shift());
		}
		var success = (checkedString == this.input);
		details+=(success ? "passed" : "failed")+".\n";
		

		return [resultSize, regPackOutput, details];
	},

	/**
	 * Returns true if the character is not allowed in a RegExp char class or as a token (ie needs escaping)
	 * Characters : LF, CR, ', ", \, 127
	 */
	isForbiddenCharacter : function(ascii)
	{
		return ascii==10||ascii==13||ascii==34||ascii==39||ascii==92||ascii==127;
	},
	
	/**
	 * Returns the number of forbidden characters in the interval (bounds inclusive)
	 * Characters : same as in isForbiddenCharacter()
	 */
	countForbiddenCharacters : function (first, last)
	{
		var count=0;
		for (var i=first; i<=last; ++i) {
			count+=this.isForbiddenCharacter(i)?1:0;
		}
		return count;
	},

	/**
	 * Returns true if the character requires a backlash as a prefix in the character class of the 
	 * RegExp to be interpreted as part of the expression
	 * Character : \ (used to escape others)
	 * Character : ] (would close the character class otherwise)
	 */
	needsEscapingInCharClass : function(ascii)
	{
		return ascii==92||ascii==93;
	},
	
	/**
	 * Returns a printable string representing the character
	 * including the needed escapes.
	 * Characters from 1 to 31 are also escaped
	 **/
	getPrintableString : function (ascii)
	{
		if (ascii<32) {
			return "\\"+ascii;
		} else {
			return (this.needsEscapingInCharClass(ascii)?"\\":"")+String.fromCharCode(ascii);
		}
	},

	/**
     * Returns the character matching the provided unicode value
	 * as it should be displayed in a character class in a Regexp :
	 *  -  ] needs escaping
	 *  - characters above 256 are \u....
	 *  - characters between 128 and 255 are \x..
	 *  - others (even below 32) are raw
	 */
	printToRegexpCharClass : function(charCode)
	{
		var output = "";
		if (charCode>255) {
			output = "\\u"+(charCode<4096?"0":"")+charCode.toString(16);
		} else if (charCode>127) {
			output = "\\x"+charCode.toString(16);
		} else {
			output = (this.needsEscapingInCharClass(charCode)?"\\":"")+String.fromCharCode(charCode);
		}
		return output;
	},


	/**
	 * Third stage : build the shortest negated character class regular expression
	 * (a char class beginning with a ^, such as [^A-D] which comprises everything but characters A, B, C and D)
	 */
	packToNegatedRegexpCharClass : function() 
	{
		// Build a list of characters used inside the string (as ranges)
		// characters not in the list can be
		//  - forbidden as tokens (LF, CR, ', ", -, \, 127) although these are allowed in the string too
		//  - used as compression tokens
		//  - neither used as compression tokens (if there are leftovers) nor in the string
		//    those can be included in the RegExp without affecting the output
		var details = '';
		var usedCharacters = [];
		var forbiddenCharacters = [];
		var firstInLine = -1;
		var availableCharactersCount = 0;
		for(i=1;i<128;++i) {
			var token = String.fromCharCode(i);
			if (this.input.indexOf(token)>-1) {
				if (firstInLine ==-1) {
					firstInLine = i;
				}
			} else {
				if (firstInLine >-1) {
					usedCharacters.push({first:firstInLine, last:i-1, size:Math.min(i-firstInLine,3)});
					firstInLine = -1;
				}
				if (this.isForbiddenCharacter(i)) {
					forbiddenCharacters.push(token);
				} else {
					++availableCharactersCount;
				}
			}
		}
		if (firstInLine >-1) {
			usedCharacters.push({first:firstInLine, last:i-1, size:Math.min(i-firstInLine,3)});
		}
		
		// Issue #2 : unicode characters handling
		var inputContainsUnicode = false;
		for (i=0;i<this.input.length&&!inputContainsUnicode;++i) {
			inputContainsUnicode = inputContainsUnicode || (this.input.charCodeAt(i)>127);
		}
		if (inputContainsUnicode) {
			// non-ASCII as a whole block. Those characters are not allowed as tokens,
			// and the block can be merged later to save bytes
			usedCharacters.push({first:128, last:65535, size:3});
		}
		
		details = availableCharactersCount + " available tokens, "+this.tokenCount+" needed.\n"
		for (i in usedCharacters)
		{
			j=usedCharacters[i];
			details+=this.getPrintableString(j.first);
			if (j.size>2) details+='-';
			if (j.size>1) details+=this.getPrintableString(j.last);
		}
		details+="\n";
		
		
		// Now, shorten the regexp by sacrificing some characters that will not be used as tokens.
		// The second stage yielded the actual number of tokens required.
		// The initial regexp lists all characters present in the string to compress. Since it is
		// used with an initial negation ^, it will match on all other characters.
		// Characters are split into used by the strings, tokens, and unused
		// This step iterates on the RegExp, merging ranges to reduce its length.
		// Characters between the ranges are included, thus lost as tokens.
		// For instance, [A-K] is shorter than [A-CG-K] but loses D,E,F as potential tokens
		// The process is repeated while there are enough tokens left.
		var margin = availableCharactersCount - this.tokenCount;
		var regExpString = "";
		while (true) { // do not stop on margin==0, the next step may cost zero
			var bestBlockIndex=[];
			var bestGain = -999;
			var bestCost = 999;
			// gain may change at each step as we merge blocks, so qsort won't cut it
			for (i=0;i<usedCharacters.length-1;++i) {
				var currentBlock = usedCharacters[i];
				var nextBlock = usedCharacters[i+1];
				var cost = nextBlock.first - currentBlock.last - 1  - this.countForbiddenCharacters(currentBlock.last+1, nextBlock.first-1);
				var gain = currentBlock.size+nextBlock.size-3;
				// extra gain if the character absorbed in a block needs a multibyte representation (escaped or unicode)
				if (currentBlock.first != currentBlock.last) {
					gain+=this.printToRegexpCharClass(currentBlock.last).length-1;
				}
				if (nextBlock.first != nextBlock.last) {
					gain+=this.printToRegexpCharClass(nextBlock.first).length-1;
				}
				// we cannot use the ratio gain/cost as cost may be 0, if the interval is only made of one forbidden character
				if (cost<=margin && (gain*bestCost > bestGain*cost || (gain*bestCost == bestGain*cost && cost<bestCost))) {
					bestBlockIndex = [i];
					bestCost = cost;
					bestGain = gain;	// can be negative. Do not break yet, as the next one may be positive and offset the loss.
				}
				// attempt to merge three blocks in a row, to overcome a negative barrier
				// (costly first merge, but that unlocks a gain of 3 or more)
				// this helps getting rid of expensive characters such as ]
				if (i<usedCharacters.length-2) {
					var nextYetBlock = usedCharacters[i+2];
					cost += nextYetBlock.first - nextBlock.last - 1  - this.countForbiddenCharacters(nextBlock.last+1, nextYetBlock.first-1);
					gain += nextYetBlock.size;
					gain += (this.needsEscapingInCharClass(nextBlock.last)?1:0);
					if (nextYetBlock.first != nextYetBlock.last) {
						gain+=(this.needsEscapingInCharClass(nextYetBlock.first)?1:0);
					}
					if (cost<=margin && (gain*bestCost > bestGain*cost || (gain*bestCost == bestGain*cost && cost<bestCost))) {
						bestBlockIndex = [i+1, i];
						bestCost = cost;
						bestGain = gain;
					}
				}
			}
			if (bestBlockIndex.length==0) break; // no matching block (negative gain, or too long)

			for (i in bestBlockIndex) {
				var blockIndex = bestBlockIndex[i];
				var currentBlock = usedCharacters[blockIndex];	// accessed by reference of course
				var nextBlock = usedCharacters[blockIndex+1];
				currentBlock.last=nextBlock.last;
				currentBlock.size=3;
				usedCharacters.splice(1+blockIndex, 1);
			}
			margin -= bestCost;
			
			details +="gain "+bestGain+" for "+bestCost+", ";
			details +="margin = "+margin+", ";
			
			// build the regular expression for unpacking
			// character 93 "]" needs escaping to avoid closing the character class
			var currentCharClass = "";
			for (i in usedCharacters)
			{
				j=usedCharacters[i];
				currentCharClass+=this.printToRegexpCharClass(j.first);
				if (j.size>2) currentCharClass+='-';
				if (j.size>1) currentCharClass+=this.printToRegexpCharClass(j.last);
			}
			details +=currentCharClass+"\n";
			// keep the shortest RegExp - this may not be the last one if going through a negative gain streak
			if (regExpString.length==0 || regExpString.length>currentCharClass.length) {
				regExpString = currentCharClass;
			}
		}
		
		regExpString = "^"+regExpString;		
		usedCharacters.push({first:128, last:128});	// upper boundary for the loop, increase to use multibyte characters as tokens
		var tokenString = "";
		var charIndex = 1;
		for (var i=0;i<usedCharacters.length;++i)
		{
			while (charIndex<usedCharacters[i].first) {
				if (!this.isForbiddenCharacter(charIndex)) {
					tokenString+=String.fromCharCode(charIndex);
				}
				++charIndex;
			}
			charIndex = 1+usedCharacters[i].last;
		}
		details+= "tokens = "+tokenString+" ("+tokenString.length+")\n";
		
		// use the same matches order as in the second stage
		this.matchesLookup.sort(function(a,b) {return a.newOrder-b.newOrder; });
		var thirdStageOutput = this.input;
		// and perform the replacement using the token string as listed above
		for (var i=0;i<this.tokenCount;++i)
		{
			var matchedString = this.matchesLookup[i].originalString;
			var token = tokenString[i];

			details+=token.charCodeAt(0)+"("+token+"), str = "+matchedString+"\n";
			thirdStageOutput = matchedString+token+thirdStageOutput.split(matchedString).join(token);
		}
		
		// add the unpacking code to the compressed string
		var checkedString = thirdStageOutput;
		c=thirdStageOutput.split('"').length<thirdStageOutput.split("'").length?(B='"',/"/g):(B="'",/'/g);
		thirdStageOutput='for(_='+B+thirdStageOutput.replace(c,'\\'+B)+B;
		thirdStageOutput+=';g=/['+regExpString+']/.exec(_);)with(_.split(g))_=join(shift('+this.wrappedInit+'));'+this.environment+this.interpreterCall;
		
		var resultSize = this.getByteLength(thirdStageOutput);
		
		details+="------------------------\nFinal check : ";
		var regToken = new RegExp("["+regExpString+"]","");
		for(var token="" ; token = regToken.exec(checkedString) ; ) {
			var k = checkedString.split(token);
			checkedString = k.join(k.shift());
		}
		var success = (checkedString == this.input);
		details+=(success ? "passed" : "failed")+".\n";
		

		return [resultSize, thirdStageOutput, details];
	} 

};

var packer = new RegPack();

if (typeof require !== 'undefined') {
    // Node
    if (require.main !== module) {
        console.log(module);
        module.exports = {
            RegPack: RegPack,
            packer: packer,
            cmdRegPack: cmdRegPack,
            runPacker: runPacker
        };
    } else {
        var argv = require('minimist')(process.argv.slice(2));
        result = cmdRegPack(require('fs').readFileSync(argv._[0], 'utf-8'), argv);
        console.log(result);
    }
}
