// Node.js : module shapeShifter defines ShapeShifter class (preprocessor)
if (typeof require !== 'undefined') {
    var StringHelper = require('./stringHelper');
    var ShapeShifter = require('./shapeShifter');
}
function resultMessage(sourceSize, resultSize)
{
	var message = sourceSize+'B';
	var prefix = (resultSize>sourceSize?"+":"");
	if (sourceSize!=resultSize) {
		message+=' to '+resultSize+'B ('+prefix+(resultSize-sourceSize)+'B, '+prefix+(((resultSize-sourceSize)/sourceSize*1e4|0)/100)+'%)'
	}
	return message;
}

/**
 * Entry point when running RegPack from node.js, wrapper for the packer
 * It performs the packing, then returns the best compressed (autoextractible) string
 *
 * @param input A string containing the program to pack
 * @param options An object detailing the different options for the preprocessor and packer
 * @return A string containing the shortest compressed form of the input
 */
function cmdRegPack(input, options) {

	var originalLength = packer.getByteLength(input);
	var inputList = packer.runPacker(input, options);
	var methodCount = inputList.length;

	var bestMethod=0, bestStage = 0, shortestLength=1e8;
	for (var i=0; i<methodCount; ++i) {
		var packerData = inputList[i];
		for (var j=0; j<4; ++j) {
			var output = (j==0 ? packerData.contents : packerData.result[j-1][1]);
			var packedLength = packer.getByteLength(output);
			if (packedLength < shortestLength) {
				shortestLength = packedLength;
				bestMethod = i;
				bestStage = j;
			}
		}
	}

	var bestOutput = inputList[bestMethod];
	var bestVal = (bestStage==0 ?  bestOutput.contents : bestOutput.result[bestStage-1][1]);
	var mes = resultMessage(originalLength, shortestLength);

	//console.log("packer:", inputList[bestMethod]);
	console.warn("stats:", mes);
	return bestVal;
}

/**
 * @constructor
 * The class RegPack wraps all the features from the tool
 * It contains the main entry point : pack()
 * It also implements the compression routines
 */
function RegPack() {
	this.stringHelper = StringHelper.getInstance();
	this.preprocessor = new ShapeShifter();
}

var details, x, e, N, M, bestValue, bestLength, Z1, j;

RegPack.prototype = {


	/**
	 * Main entry point for RegPack
	 * @param input A string containing the program to pack
	 * @param options An object detailing the different options for the preprocessor and packer
	 * @return An array of PackerData, each containing the code packed with different settings from the preprocessor
	 */
	runPacker : function(input, options) {
		// clear leading/trailing blanks and one-liner comments
		var input = input.replace(/([\r\n]|^)\s*\/\/.*|[\r\n]+\s*/g,'');
		var default_options = {
			withMath : false,
			hash2DContext : false,
			hashWebGLContext : false,
			hashAudioContext : false,
			contextVariableName : false,
			contextType : parseInt(0),
			reassignVars : true,
			varsNotReassigned : ['a', 'b', 'c'],
			crushGainFactor : parseFloat(2),
			crushLengthFactor : parseFloat(1),
			crushCopiesFactor : parseFloat(0),
			crushTiebreakerFactor : parseInt(1),
			wrapInSetInterval : false,
			timeVariableName : "",
			useES6 : true
		};
		for (var opt in default_options) {
			if (!(opt in options)) {
				options[opt] = default_options[opt];
			}
		}
		var inputList = this.preprocessor.preprocess(input, options);
		for (var inputIndex=0; inputIndex < inputList.length; ++inputIndex)
		{
			var currentData = inputList[inputIndex];

			// first stage : configurable crusher
			var output = this.findRedundancies(currentData, options);
			currentData.result.push(output);

			// second stage : convert token string to regexp
			output = this.packToRegexpCharClass(currentData, options);
			currentData.result.push(output);

			// third stage : try a negated regexp instead
			output = this.packToNegatedRegexpCharClass(currentData);
			currentData.result.push(output);


		}
		return inputList;
	},

	/**
	 * Returns the total byte length of a string "as is" (with no further escaping)
	 *  1 for ASCII char
	 *  3 for Unicode (UTF-8)
	 * Issue #5 : final size when featuring unicode characters
	 *
	 * @param inString the string to measure
	 * @return the UTF-8 length of the string, in bytes 
	 */
	getByteLength : function (inString)
	{
		return encodeURI(inString).replace(/%../g,'i').length;
	},

	/**
	 * Returns the byte length of a string after escaping 
	 *  \ costs 2 bytes
	 *  All other characters unchanged
	 * Issue #85 : suboptimal compression of \ sequences
	 *
	 * @param inString the string to measure
	 * @return the UTF-8 length of the string, including added escape characters, in bytes 
	 */
	getEscapedByteLength : function (inString)
	{
		return this.getByteLength(inString.replace(/\\/g,'\\\\'));
	},

	
	/**
	 * First stage : apply the algorithm common to First Crush and JS Crush
	 * Adds member variables to packerData :
	 *  - matchesLookup : array containing matches and inner details
	 *
	 * @param packerData A PackerData structure holding the input string and setup
	 * @param options Preprocessing and packing options (tiebreaker, score factors)
	 * @return array [length, packed string, log]
	 */
	findRedundancies : function(packerData, options) {
		var s = packerData.contents;
		packerData.matchesLookup = [];
		var transform = [];
		details='';
		// #55 : 34(") and 39(') now allowed, as long as they are not the chosen delimiter
		var delimiterCode = packerData.packedStringDelimiter.charCodeAt(0);
		var Q=[];for(var i=0;++i<127;i-10&&i-13&&i-delimiterCode&&i-92&&Q.push(String.fromCharCode(i)));
		var matches = {};
		for(var tokens='';;tokens=c+tokens) {
			for(var c=0,i=122;!c&&--i;!~s.indexOf(Q[i])&&(c=Q[i]));
			if(!c)break;
			if (tokens.length==0) {	// search all string space for possible matches
				var found=true;	// stop as soon as no substring of length t is found twice
				for(var t=2;found;++t) {
					found=false;
					for(i=0;i<s.length-t;++i) {
						var beginCode = s.charCodeAt(i);
						var endCode = s.charCodeAt(i+t-1);
						// #50 : if the first character is a low surrogate (second character of a surrogate pair
						// representing an astral character), skip it - we cannot have it begin the string
						// and thus break the pair
						// Same issue if the last character is a high surrogate (first in surrogate pair).
						if ((beginCode<0xDC00 || beginCode>0xDFFF)
							&& (endCode<0xD800 || endCode>0xDBFF)) {
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
				j=this.getEscapedByteLength(i);
				R=matches[i];
				Z=R*j-R-j-2;	// -1 used in JS Crush performs replacement with zero gain
				value=options.crushGainFactor*Z+options.crushLengthFactor*j+options.crushCopiesFactor*R;
				if(Z>0) {
					if(value>bestValue||bestValue==value&&(Z>M||Z==M&&(options.crushTiebreakerFactor*R>options.crushTiebreakerFactor*N))) // R>N JsCrush, R<N First Crush
						M=Z,N=R,e=i,bestValue=value,bestLength=j;
				} else if (R<2) {
					delete matches[i];
				}
			}
			if(M<1)
				break;

			// update the other matches in case the selected one is a substring thereof
			var newMatches={};
			for(x in matches) {
				newMatches[x.split(e).join(c)]=1;
			}
			matches = newMatches;

			// and apply the compression to the string
			s = this.stringHelper.matchAndReplaceAll(s, false, e, c, "", c+e, 0, transform);
			//s=s.split(e).join(c)+c+e;
			packerData.matchesLookup.push({token:c, string:e, originalString:e, depends:'', usedBy:'', gain:M, copies:N, len:bestLength, score:bestValue, cleared:false, newOrder:9999});
			details+=c.charCodeAt(0)+"("+c+") : val="+bestValue+", gain="+M+", N="+N+", str = "+e+"\n";
		}
		
		// Needed for #47 : list matches that did not find a token
		// As the packer may have more tokens available than the crusher 
		// First, update the matches count
		var newMatches={};
		for(x in matches) {
			for(j=s.indexOf(x),newMatches[x]=0;~j;newMatches[x]++)j=s.indexOf(x,j+x.length);
		}
		matches = newMatches;

		var firstLine = true;
		for(i in matches){
			var j=this.getEscapedByteLength(i);
			var R=matches[i];
			var Z=R*j-R-j-2;	
			if (Z>0) {
				if (firstLine) {
					details += "\n--- Potential gain, but not enough tokens ---\n";
					firstLine = false;
				}
				var value=options.crushGainFactor*Z+options.crushLengthFactor*j+options.crushCopiesFactor*R;
				details+="..( ) : val="+value+", gain="+Z+", N="+R+", str = "+i+"\n";
				packerData.matchesLookup.push({token:"", string:i, originalString:i, depends:'', usedBy:'', gain:Z, copies:R, len:j, score:value, cleared:false, newOrder:9999});
			}
		}
		
		// Implementation for #48 : show the patterns that are "almost" gains 
		firstLine = true;
		for(i in matches){
			j=this.getEscapedByteLength(i);
			R=matches[i];
			Z=R*j-R-j-2;	
			Z1=(R+1)*j-(R+1)-j-2;
			if (Z<=0 && Z1>0) {
				if (firstLine) {
					details += "\n--- One extra occurrence needed for a gain --\n";
					firstLine = false;
				}
				value=options.crushGainFactor*Z1+options.crushLengthFactor*j+options.crushCopiesFactor*R;
				details+="   val="+value+", gain="+Z+"->"+Z1+" (+"+(Z1-Z)+"), N="+R+", str = "+i+"\n";
			}
		}

		
		var loopInitCode = ';for(i in G=', loopMemberCode = 'G[i]';
		if (options.useES6) {
			// ES6 : use 'for .. of' construct, which iterates on values, not keys => gain six bytes
			loopInitCode = ';for(i of';
			loopMemberCode = 'i';
		}
		
		// escape the backslashes present in the code
		var packedString = this.stringHelper.matchAndReplaceAll(s, false, '\\', '\\\\', '', '', 0, transform); 
		
		// escape the occurrences of the string delimiter present in the code
		packedString = this.stringHelper.matchAndReplaceAll(packedString, false, packerData.packedStringDelimiter, '\\'+packerData.packedStringDelimiter, "", "", 0, transform);
		//var packedString = s.replace(new RegExp(packerData.packedStringDelimiter,"g"),'\\'+packerData.packedStringDelimiter);
		
		// and put everything together
		var unpackBlock1 = packerData.packedCodeVarName+'='+packerData.packedStringDelimiter;
		var unpackBlock2 = packerData.packedStringDelimiter
						  +loopInitCode+packerData.packedStringDelimiter+tokens+packerData.packedStringDelimiter
						  +')with('+packerData.packedCodeVarName+'.split('+loopMemberCode+'))'
						  +packerData.packedCodeVarName+'=join(pop(';
		var unpackBlock3 = '));';
		var envMapping = [ { inLength : packedString.length, outLength : packedString.length, complete : false},
						   { chapter  : 1, 
						     rangeIn  : [0, packedString.length],
						     rangeOut : [0, unpackBlock1.length + unpackBlock2.length + unpackBlock3.length]
						   }  ];
		transform.push(envMapping);
		
		var output = unpackBlock1 + packedString + unpackBlock2 + packerData.wrappedInit + unpackBlock3
				   + packerData.environment + packerData.interpreterCall;
		
		return [this.getByteLength(output), output, details, transform];
	},

	/**
	 * Clears a match from matchesLookup for dependencies in the PackerData
	 *  - removes the corresponding token from the use list of other matches
	 *  - sets the "cleared" flag to true
	 *
	 * @param packerData A PackerData structure holding the input string and setup, including the matches array
	 * @param matchIndex index of the match to clear
	 */
	clear : function(packerData, matchIndex) {
		var oldToken = packerData.matchesLookup[matchIndex].token;
		for (var j=0;j<packerData.matchesLookup.length;++j) {
			packerData.matchesLookup[j].usedBy = packerData.matchesLookup[j].usedBy.split(oldToken).join("");
		}
		packerData.matchesLookup[matchIndex].cleared=true;
	},

	/**
	 * Second stage : extra actions required to reduce the token string to a RegExp
	 *
	 * Needs and modifies the matchesLookup array inside the parameter packerData
	 *
	 * @param packerData A PackerData structure holding the input string and setup
	 * @param options Preprocessing and packing options (tiebreaker, score factors)
	 * @return array [length, packed string, log]
	 */
	packToRegexpCharClass : function(packerData, options)
	{

		var details = '';
		var transform = [];
		// First, re-expand the packed strings so that they no longer contain any compression token
		// since we will be storing them in a different order.
		// Use this step to establish a dependency graph (compressed strings containing other compressed strings)
		for (var i=0;i<packerData.matchesLookup.length;++i) {
			for (var j=0; j<packerData.matchesLookup.length;++j) {
				if (packerData.matchesLookup[i].token && packerData.matchesLookup[j].originalString.indexOf(packerData.matchesLookup[i].token)>-1) {
					packerData.matchesLookup[j].originalString = packerData.matchesLookup[j].originalString.split(packerData.matchesLookup[i].token).join(packerData.matchesLookup[i].originalString);
				}
				if (i!=j && packerData.matchesLookup[j].originalString.indexOf(packerData.matchesLookup[i].originalString)>-1) {
					packerData.matchesLookup[j].depends += packerData.matchesLookup[i].token;
					packerData.matchesLookup[i].usedBy += packerData.matchesLookup[j].token;

				}
			}
		}
		/** debug only
		for (i=0; i<packerData.matchesLookup.length; ++i) {
			c=packerData.matchesLookup[i];
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
			// Allowed tokens : everything in the ASCII range except
			//  - 0 and 127 (excluded from loop)
			//  - any character present in the code
			//  - LF(10) and CR(13), not allowed in code nor as tokens, skipped in ranges
			// New since #47, \(92) and ](93) which need escaping in character class, are allowed as tokens.
			// New since #55, "(34) and '(39), as long as they are not the delimiter for the string
			if (i!=packerData.packedStringDelimiter.charCodeAt(0) && packerData.contents.indexOf(token)==-1) {
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
					var lastInLine = i-1;
					// for the same reason, do not end a block with CR nor LF (watch out, the end of the block is the index before i)
					if (i==11 || i==14) {
						--lastInLine;
					}
					if (lastInLine>=firstInLine) {	// skip if there is only CR or LF in the range
						var tokenCount = lastInLine-firstInLine+1;
						var range = this.stringHelper.writeRangeToRegexpCharClass(firstInLine, lastInLine);
						var containsBackslash = (firstInLine<=92 && i>92);
						tokenList.push({first:firstInLine, last:lastInLine, count:tokenCount, cost:range.length, oneByteTokenCount:tokenCount-(containsBackslash?1:0)});
					}
					firstInLine = -1;
				}
			}
		}
		if (firstInLine >-1) {
			var range = this.stringHelper.writeRangeToRegexpCharClass(firstInLine, i-1);
			tokenList.push({first:firstInLine, last:i-1, count:i-firstInLine, cost:range.length, oneByteTokenCount:i-firstInLine-(firstInLine<=92?1:0)});
		}
		// Reorder the block list. #47 introduces escaped characters, making the order a bit more complex :
		//  - longest blocks (as in largest token count) first 
		//  - when tied for length, non escaped characters first (shortest representation in char class)
		//  - when tied again, readable characters (32-127) first
		tokenList.sort(function(a,b) {
			return 10*b.oneByteTokenCount-b.cost+b.first/1000- (10*a.oneByteTokenCount-a.cost+a.first/1000); 
		});

		
		var costOneTokens = [], costTwoTokens = [];
		for (var tokenLine=0; tokenLine<tokenList.length; ++tokenLine) {
			for (var i=tokenList[tokenLine].first; i<=tokenList[tokenLine].last; ++i) {
				if (i!=10 && i!=13) {
					if (i==92) {
						costTwoTokens.push(i);
					} else {
						costOneTokens.push(i);
					}
				}
			}
		}
			

		
		// The first range must not start with ^, otherwise it will be interpreted as negated char class
		// Two solutions :
		//  - remove the ^ from the range, starting with the next character
		//  - swap the range with the next one, putting it into second position
		// Removal is done here if the conditions match (
		// Swapping is done later, as removal of \ and ] may expose the character ^ at the beginning of a range
		if (tokenList[0].first == 94) {
			if (packerData.matchesLookup.length < tokenList[0].count || tokenList.length==1) {
				// If we have enough tokens in the first range without the ^, remove it
				// Do the same if we only have one range
				tokenList[0].cost = this.stringHelper.writeRangeToRegexpCharClass(++tokenList[0].first, ++tokenList[0].last).length;
				--tokenList[0].count;
				--tokenList[0].oneByteTokenCount;
			} 
		}
		
		details +="\n";
		details +="Token ranges\n"
		details +="------------\n";
		for (var i=0; i<tokenList.length;++i) {
			details += this.stringHelper.writeRangeToRegexpCharClass(tokenList[i].first, tokenList[i].last);
			details += " score = " + ( 10*tokenList[i].oneByteTokenCount-tokenList[i].cost+tokenList[i].first/1000) + "\n";
		}
		details +="\n";
		// Then, flatten the dependency graph into a line. The new compression order starts
		// with the strings that are not used within another strings (usually the longer ones)
		// and ends by the strings not depending on others. The reason for that is that the
		// unpacking is performed LIFO and must begin by independent strings for RegExp-related reasons
		// (match is done on any token in the RegExp, meaning that the first instance must be
		// the separator, not another token that would be included in the string)

		// Pack again by replacing the strings by the tokens, in the new compression order
		// In case there are two or more candidates (not used by other strings), the same
		// compression scoring is used as in the first stage.
		var availableTokens = costOneTokens.concat(costTwoTokens);
		var tokensRemaining = true;	// true while there are tokens remaining
		var gainsRemaining = true;		// true while there is at least one match with a positive gain (that will shorten the output if packed)
		packerData.tokenCount = 0; // total number of tokens used. Will be less than packerData.matchesLookup.length at the end if any negatives are found
		
		var regPackOutput = packerData.contents;
		for (var i=0 ; i<packerData.matchesLookup.length && tokensRemaining && gainsRemaining ; ++i) {		
		
			var tokenCode = availableTokens[packerData.tokenCount];
			var tokenCost = this.stringHelper.getCharacterLength(tokenCode); // 2 for \ , 1 for anything else
		
			var matchIndex=-1, bestScore=-999, bestGain=-1, bestCount=0, negativeCleared = false;
			for (var j=0; j<packerData.matchesLookup.length;++j) {
				if (packerData.matchesLookup[j].usedBy=="" && !packerData.matchesLookup[j].cleared) {
					var count=0;
					for (var index=regPackOutput.indexOf(packerData.matchesLookup[j].originalString, 0); index>-1; ++count) {
						index=regPackOutput.indexOf(packerData.matchesLookup[j].originalString, index+1);
					}
					var gain = count*(packerData.matchesLookup[j].len-tokenCost)-packerData.matchesLookup[j].len-2*tokenCost;
					var score = options.crushGainFactor*gain+options.crushLengthFactor*packerData.matchesLookup[j].len+options.crushCopiesFactor*count;
					if (gain>=0) {
						if (score>bestScore||score==bestScore&&(gain>bestGain||gain==bestGain&&(options.crushTiebreakerFactor*count>options.crushTiebreakerFactor*bestCount))) // R>N JsCrush, R<N First Crush
							bestGain=gain,bestCount=count,matchIndex=j,bestScore=score;
					} else {
						// found a negative. The matching string may no longer be packed (if anything, match count will decrease, not increase)
						// so we clear it (ie remove it from the dependency chain). This in turns allows strings it uses to be packed,
						// otherwise their "usedBy" field would contain the negative and they could never be packed.
						// Clearing a negative introduces a bias, since some strings that were in order before it could have been
						// considered for compression, but they were not because they were "usedBy" the negative.
						// The comparison is useless : do not compress for this iteration of i
						this.clear(packerData, j);
						negativeCleared = true;
					}
				}
			}
			if (!negativeCleared) {	// skip the compression step if we had a negative
				if (matchIndex>-1) {	
					// a string was chosen, replace it with the current token
					var matchedString = packerData.matchesLookup[matchIndex].originalString;
					packerData.matchesLookup[matchIndex].newOrder = packerData.tokenCount;

					var token = String.fromCharCode(tokenCode);
					details+=token.charCodeAt(0)+"("+token+"), gain="+bestGain+", N="+bestCount+", str = "+matchedString+"\n";
					
					regPackOutput = this.stringHelper.matchAndReplaceAll(regPackOutput, false, matchedString, token, matchedString+token, "", 0, transform);
					
					// remove dependencies on chosen string/token
					this.clear(packerData, matchIndex);

					// define the replacement token
					++packerData.tokenCount;
					if (packerData.tokenCount >= availableTokens.length) {
						tokensRemaining = false; // bail out early
						details+="Out of tokens\n";
					} 
					

				} else {	// remaining strings, but no gain : skip them and end the loop
					for (var j=0; j<packerData.matchesLookup.length;++j) {
						if (!packerData.matchesLookup[j].cleared) {
							details += "skipped str = "+packerData.matchesLookup[j].originalString+"\n";
						}
					}
					gainsRemaining = false;
				}
			}
		}

		// Map tokens used to actual ranges (lines)
		
		var tokenLine = 0;	// 0-based index of current token line (block)
		var tokenIndex = 0;	// 1-based index of current token in current line
		var unusedBackslash = availableTokens[availableTokens.length-1]==92 && packerData.tokenCount<availableTokens.length;
	
		if (packerData.tokenCount >= availableTokens.length) { // all available tokens in use (no replacement performed)
			tokenLine = tokenList.length -1 ;
			tokenIndex = tokenList[tokenList.length-1].count;
		} else {
			var lastTokenUsed = availableTokens[packerData.tokenCount-1];
			var lineFound = false;
			
			while (!lineFound && tokenLine < tokenList.length) {
				// #83 : if a range starts or end in \, and it is not actually used, replace it with the previous or next character
				if (unusedBackslash && tokenList[tokenLine].first == 92) { // remove unused \ at the beginning of a range
					++tokenList[tokenLine].first;
					--tokenList[tokenLine].count;
				}
				if (unusedBackslash && tokenList[tokenLine].last == 92) { // remove unused \ at the end of a range
					--tokenList[tokenLine].last;
					--tokenList[tokenLine].count;
				}	
				if (lastTokenUsed >= tokenList[tokenLine].first	&& lastTokenUsed <= tokenList[tokenLine].last)  {
					// no need to consider that 2-byte token \ can be in the middle of a range
					// since it is used last, and we would be in the case where packerData.tokenCount exceeds costOneTokens.length
					lineFound = true;
					tokenIndex = lastTokenUsed - tokenList[tokenLine].first + 1;
				} else {
					++tokenLine;
				}
			}
		}
		
		// Safeguard, should never happen (i.e. last token use is not found in ranges)
		if (tokenLine >= tokenList.length) {
			details += "Exception : token out of range\nFinal check : failed";
			return [-1, "", details, transform];
		}
		
		
		
		// #47 introduces escaped characters (2 bytes instead of 1) as tokens
		// Ranges with such a character at the beginning or end thus cost one extra byte to define
		// If the last range used has leftover tokens (more tokens available than needed),
		// we use those tokens at no cost to replace the escaped ones.
		// for instance, last range is A-E but only used up to C, and we have range W-\\ before
		// by substituting D for \\, we end up with [W-[A-D] which is one byte shorter than [W-\\A-C]
		
		// #83 amends that by forcing \ to be always the last token to be considered
		// Since it is the last one, there are no leftovers to replace it
		// The only possible replaced token is thus ]

		// First identify if we have leftover tokens in the last range
		var remainingTokens = tokenList[tokenLine].count - tokenIndex;
		// Force the last range to its actual length - in case it ends with a \ or ] but not all tokens are used
		tokenList[tokenLine].last -= remainingTokens; 
		tokenList[tokenLine].count = tokenIndex; 
		if (remainingTokens > 0) {
			var tokensToReplace = [];
			// then look for escaped character ] (93) at the beginning or end of a range
			for (var i=0; i<=tokenLine; ++i) {
				if (tokenList[i].first == 93) {
					tokensToReplace.push({rangeIndex : i , atBeginning : true, count : 1});
				} else if (tokenList[i].last == 93) {
					tokensToReplace.push({rangeIndex : i , atBeginning : false, count : 1});
				}
			}
			// The only token to replace is ] (93), but we kept the code that handles multiple tokens
			for (var i=0; i<tokensToReplace.length; ++i) {
				if (remainingTokens >= tokensToReplace[i].count) {
					// substitute as many tokens as required (1 or 2)
					for (var j=0; j<tokensToReplace[i].count; ++j) {
						// substitute the token in the already packed string
						++tokenIndex;
						--remainingTokens;
						var currentRange = tokenList[tokensToReplace[i].rangeIndex];
						var oldToken = String.fromCharCode(tokensToReplace[i].atBeginning ? currentRange.first : currentRange.last);
						var newToken = String.fromCharCode(++tokenList[tokenLine].last);
						regPackOutput = regPackOutput.split(oldToken).join(newToken);
						details += oldToken.charCodeAt(0)+"("+oldToken+") replaced by "+newToken.charCodeAt(0)+"("+newToken+")\n";
						
						// shift beginning or end of the former range
						--currentRange.count;	
						++tokenList[tokenLine].count;
						if (tokensToReplace[i].atBeginning) {
							++currentRange.first;
							// if the shift exposes an unused \ at the beginning of the range, shift again
							if (unusedBackslash && currentRange.first==92) {
								++currentRange.first;
								--currentRange.count;
							}
						} else {
							--currentRange.last;
							// if the shift exposes an unused \ at the end of the range, shift again
							if (unusedBackslash && currentRange.last==92) {
								--currentRange.last;
								--currentRange.count;
							}
						}
						// if we are adding from the end of the same range we are removing tokens from, shift beginning while keeping length constant
						if (tokensToReplace[i].rangeIndex == tokenLine) {
							--tokenIndex;
						}
					}
				}
			}	
		}

		
		// The former step may have removed ] and \ at the beginning of a range, exposing ^ as first character
		// If the first range starts with ^, the character class will be misinterpreted as a negative char class
		// Swap the first two ranges to solve that issue.
		if (tokenList[0].first == 94 && tokenList.length>1) {
			var newFirstRange = tokenList.splice(1, 1);
			tokenList.unshift(newFirstRange[0]);
		}
		
		// build the character class
		var tokenString = "";		
		for (var i=0; i<=tokenLine; ++i) {
			var rangeString = this.stringHelper.writeRangeToRegexpCharClass(tokenList[i].first, tokenList[i].last);
			// Fix for issue #31 : if a token line consists in a single "-",
			// add it at the beginning of the character class instead of appending it
			if (rangeString.charCodeAt(0)==45) { // 45 is '-'
				tokenString = rangeString+tokenString;
			} else {
				tokenString += rangeString;
			}			
		}

		// escape the backslashes in the compressed code (from original code or added as token)
		// #65 : do it now and not earlier so it applies on token \ as well
		var checkedString = this.stringHelper.matchAndReplaceAll(regPackOutput, false, '\\', '\\\\', '', '', 0, transform); 
		
		// escape the occurrences of the string delimiter present in the code
		checkedString = this.stringHelper.matchAndReplaceAll(checkedString, false, packerData.packedStringDelimiter, '\\'+packerData.packedStringDelimiter, "", "", 0, transform);
		
		// and add the unpacking code to the compressed string
		var unpackBlock1 = 'for('+packerData.packedCodeVarName+'='+packerData.packedStringDelimiter;
		var unpackBlock2 = packerData.packedStringDelimiter+';G=/['+tokenString+']/.exec('+packerData.packedCodeVarName
						  +');)with('+packerData.packedCodeVarName+'.split(G))'+packerData.packedCodeVarName+'=join(shift(';
						  
		var unpackBlock3 = '));';
		var envMapping = [ { inLength : checkedString.length, outLength : checkedString.length, complete : false},
						   { chapter  : 1, 
						     rangeIn  : [0, checkedString.length],
						     rangeOut : [0, unpackBlock1.length + unpackBlock2.length + unpackBlock3.length]
						   }  ];
		transform.push(envMapping);

		regPackOutput = unpackBlock1 + checkedString + unpackBlock2 + packerData.wrappedInit + unpackBlock3 
					  + packerData.environment + packerData.interpreterCall;
 
		var resultSize = this.getByteLength(regPackOutput);

		// check that unpacking the string yields the original code
		details+="------------------------\nFinal check : ";
		checkedString = checkedString.replace(new RegExp('\\\\'+packerData.packedStringDelimiter,'g'), packerData.packedStringDelimiter);		
		checkedString = checkedString.replace(/\\\\/g, '\\');		
		var regToken = new RegExp("["+tokenString+"]","");
		for(var token="" ; token = regToken.exec(checkedString) ; ) {
			var k = checkedString.split(token);
			checkedString = k.join(k.shift());
		}
		var success = (checkedString == packerData.contents);
		details+=(success ? "passed" : "failed")+".\n";


		return [resultSize, regPackOutput, details, transform];
	},

	/**
	 * Returns true if the character is not allowed in a RegExp char class or as a token (cannot be inserted per se, requires a sequence instead)
	 * Forbidden characters are LF, CR, 127
	 * ' and " are allowed since #55, unless they are the delimiter for the packed string
	 *
	 * @param ascii The ASCII or Unicode value of the character
	 * @return true if the matching character is forbidden as token, false if it is allowed
	 */
	isForbiddenCharacter : function(ascii)
	{
		return ascii==10||ascii==13||ascii==127;
	},

	/**
	 * Returns the number of forbidden characters in the interval [first-last]
	 * Characters : same as in isForbiddenCharacter(), and the packed string delimiter
	 * However, the packed string delimiter is forbidden as a token too
	 *
	 * @see isForbiddenCharacter
	 * @param first : ASCII code of the first character in the interval, inclusive
	 * @param last : ASCII code of the last character in the interval, inclusive
	 * @param delimiterCode : ASCII code of the packed string delimiter (counts as forbidden)
	 * @return the number of forbidden characters in the interval
	 */
	countForbiddenCharacters : function (first, last, delimiterCode)
	{
		var count=0;
		for (var i=first; i<=last; ++i) {
			count+=(this.isForbiddenCharacter(i)||i==delimiterCode)?1:0;
		}
		return count;
	},


	/**
	 * Third stage : build the shortest negated character class regular expression
	 * (a char class beginning with a ^, such as [^A-D] which comprises everything but characters A, B, C and D)
	 * @param packerData A PackerData structure holding the input string and setup
	 * @return array [length, packed string, log]
	 */
	packToNegatedRegexpCharClass : function(packerData)
	{
		// Build a list of characters used inside the string (as ranges)
		// characters not in the list can be
		//  - forbidden as tokens (LF, CR, 127) although these are allowed in the string too
		//  - used as compression tokens
		//  - neither used as compression tokens (if there are leftovers) nor in the string
		//    those can be included in the RegExp without affecting the output
		var details = '';
		var transform = [];
		var usedCharacters = [];
		var forbiddenCharacters = [];
		var firstInLine = -1;
		var availableCharactersCount = 0;
		for(i=1;i<128;++i) {
			var token = String.fromCharCode(i);
			if (packerData.contents.indexOf(token)>-1) {
				if (firstInLine ==-1) {
					firstInLine = i;
				}
			} else {
				if (firstInLine >-1) {
					usedCharacters.push({first:firstInLine, last:i-1, size:Math.min(i-firstInLine,3)});
					firstInLine = -1;
				}
				if (this.isForbiddenCharacter(i) || i==packerData.packedStringDelimiter.charCodeAt(0)) {
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
		for (i=0;i<packerData.contents.length&&!inputContainsUnicode;++i) {
			inputContainsUnicode = inputContainsUnicode || (packerData.contents.charCodeAt(i)>127);
		}
		if (inputContainsUnicode) {
			// non-ASCII as a whole block. Those characters are not allowed as tokens,
			// and the block can be merged later to save bytes
			usedCharacters.push({first:128, last:65535, size:3});
		}

		details = availableCharactersCount + " available tokens, "+packerData.tokenCount+" needed.\n"
		var regExpString = "";
		for (i in usedCharacters) {
			j=usedCharacters[i];
			var rangeString = this.stringHelper.writeRangeToRegexpCharClass(j.first, j.last);
			// Fix for issue #31 : if a token line consists in a single "-",
			// add it at the beginning of the character class instead of appending it
			if (j.size==1 && j.first==45) { // 45 is '-'
				regExpString=rangeString+currentCharClass;
			} else {
				regExpString+=rangeString;
			}
		}
		details+=regExpString+"\n";


		// Now, shorten the regexp by sacrificing some characters that will not be used as tokens.
		// The second stage yielded the actual number of tokens required.
		// The initial regexp lists all characters present in the string to compress. Since it is
		// used with an initial negation ^, it will match on all other characters.
		// Characters are split into used by the strings, tokens, and unused
		// This step iterates on the RegExp, merging ranges to reduce its length.
		// Characters between the ranges are included, thus lost as tokens.
		// For instance, [A-K] is shorter than [A-CG-K] but loses D,E,F as potential tokens
		// The process is repeated while there are enough tokens left.
		var margin = availableCharactersCount - packerData.tokenCount;
		var delimiterCode = packerData.packedStringDelimiter.charCodeAt(0);
		while (true) { // do not stop on margin==0, the next step may cost zero
			var bestBlockIndex=[];
			var bestGain = -999;
			var bestCost = 999;
			// gain may change at each step as we merge blocks, so qsort won't cut it
			for (i=0;i<usedCharacters.length-1;++i) {
				var currentBlock = usedCharacters[i];
				var nextBlock = usedCharacters[i+1];
				var cost = nextBlock.first - currentBlock.last - 1  - this.countForbiddenCharacters(currentBlock.last+1, nextBlock.first-1, delimiterCode);
				var gain = currentBlock.size+nextBlock.size-3;
				// extra gain if the character absorbed in a block needs a multibyte representation (escaped or unicode)
				if (currentBlock.first != currentBlock.last) {
					gain+=this.stringHelper.writeCharToRegexpCharClass(currentBlock.last).length-1;
				}
				if (nextBlock.first != nextBlock.last) {
					gain+=this.stringHelper.writeCharToRegexpCharClass(nextBlock.first).length-1;
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
					cost += nextYetBlock.first - nextBlock.last - 1  - this.countForbiddenCharacters(nextBlock.last+1, nextYetBlock.first-1, delimiterCode);
					gain += nextYetBlock.size;
					// extra gain if the character absorbed in a block needs a multibyte representation (escaped or unicode)
					gain += this.stringHelper.writeCharToRegexpCharClass(nextBlock.last).length-1;
					if (nextYetBlock.first != nextYetBlock.last) {
						gain+=this.stringHelper.writeCharToRegexpCharClass(nextYetBlock.first).length-1;
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
				var rangeString = this.stringHelper.writeRangeToRegexpCharClass(j.first, j.last);
				// Fix for issue #31 : if a token line consists in a single "-",
				// add it at the beginning of the character class instead of appending it
				if (j.size==1 && j.first==45) { // 45 is '-'
					currentCharClass=rangeString+currentCharClass;
				} else {
					currentCharClass+=rangeString;
				}
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
				if (!this.isForbiddenCharacter(charIndex) &&  charIndex!=packerData.packedStringDelimiter.charCodeAt(0)) {
					tokenString+=String.fromCharCode(charIndex);
				}
				++charIndex;
			}
			charIndex = 1+usedCharacters[i].last;
		}
		details+= "tokens = "+tokenString+" ("+tokenString.length+")\n";

		// use the same matches order as in the second stage
		packerData.matchesLookup.sort(function(a,b) {return a.newOrder-b.newOrder; });
		var thirdStageOutput = packerData.contents;
		// and perform the replacement using the token string as listed above
		for (var i=0;i<packerData.tokenCount && i<tokenString.length;++i)
		{
			var matchedString = packerData.matchesLookup[i].originalString;
			var token = tokenString[i];

			details+=token.charCodeAt(0)+"("+token+"), str = "+matchedString+"\n";
			thirdStageOutput = this.stringHelper.matchAndReplaceAll(thirdStageOutput, false, matchedString, token, matchedString+token, "", 0, transform);
			//thirdStageOutput = matchedString+token+thirdStageOutput.split(matchedString).join(token);
		}

		// escape the backslashes in the compressed code (from original code or added as token)
		// #65 : do it now and not earlier so it applies on token \ as well
		var checkedString = this.stringHelper.matchAndReplaceAll(thirdStageOutput, false, '\\', '\\\\', '', '', 0, transform); 

		// escape the occurrences of the string delimiter present in the code
		checkedString = this.stringHelper.matchAndReplaceAll(checkedString, false, packerData.packedStringDelimiter, '\\'+packerData.packedStringDelimiter, "", "", 0, transform);

		// add the unpacking code to the compressed string
		var unpackBlock1 = 'for('+packerData.packedCodeVarName+'='+packerData.packedStringDelimiter;
		var unpackBlock2 = packerData.packedStringDelimiter+';G=/['+regExpString+']/.exec('+packerData.packedCodeVarName
						  +');)with('+packerData.packedCodeVarName+'.split(G))'+packerData.packedCodeVarName+'=join(shift(';
		var unpackBlock3 = '));';
		var envMapping = [ { inLength : checkedString.length, outLength : checkedString.length, complete : false},
						   { chapter  : 1, 
						     rangeIn  : [0, checkedString.length],
						     rangeOut : [0, unpackBlock1.length + unpackBlock2.length + unpackBlock3.length]
						   }  ];
		transform.push(envMapping);

		thirdStageOutput = unpackBlock1 + checkedString + unpackBlock2 + packerData.wrappedInit + unpackBlock3 
					     + packerData.environment + packerData.interpreterCall;
		var resultSize = this.getByteLength(thirdStageOutput);

		// check that unpacking the string yields the original code
		details+="------------------------\nFinal check : ";
		checkedString = checkedString.replace(new RegExp('\\\\'+packerData.packedStringDelimiter,'g'), packerData.packedStringDelimiter);		
		checkedString = checkedString.replace(/\\\\/g, '\\');		
		var regToken = new RegExp("["+regExpString+"]","");
		for(var token="" ; token = regToken.exec(checkedString) ; ) {
			var k = checkedString.split(token);
			checkedString = k.join(k.shift());
		}
		var success = (checkedString == packerData.contents);
		details+=(success ? "passed" : "failed")+".\n";

		return [resultSize, thirdStageOutput, details, transform];
	}

};

var packer = new RegPack();


// Node.js setup
if (typeof require !== 'undefined') {
    module.exports = {
        RegPack: RegPack,
        packer: packer,
        cmdRegPack: cmdRegPack
    };
}
