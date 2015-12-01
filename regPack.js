// Node.js : module shapeShifter defines ShapeShifter class (preprocessor)
if (typeof require !== 'undefined') {
    if (require.main !== module) {
		var ShapeShifter = require('./shapeShifter');
	}
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
	this.preprocessor = new ShapeShifter();
}


RegPack.prototype = {

	
	/**
	 * Main entry point for RegPack
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
			timeVariableName : ""
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
	 * First stage : apply the algorithm common to First Crush and JS Crush
	 * Adds member variables to packerData :
	 *  - escapedInput : input with doubled antislashes
	 *  - matchesLookup : array containing matches and inner details
	 *
	 * @param packerData A PackerData structure holding the input string and setup
	 * @param options Preprocessing and packing options (tiebreaker, score factors)
	 * @output array [length, packed string, log]
	 */
	findRedundancies : function(packerData, options) {
		packerData.escapedInput = packerData.contents.replace(/\\/g,'\\\\');
		var s = packerData.escapedInput;
		packerData.matchesLookup = [];
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
			packerData.matchesLookup.push({token:c, string:e, originalString:e, depends:'', usedBy:'', gain:M, copies:N, len:bestLength, score:bestValue, cleared:false, newOrder:9999});
			details+=c.charCodeAt(0)+"("+c+") : val="+bestValue+", gain="+M+", N="+N+", str = "+e+"\n";
		}
			
		c=s.split('"').length<s.split("'").length?(B='"',/"/g):(B="'",/'/g);
		i=packerData.packedCodeVarName+'='+B+s.replace(c,'\\'+B)+B+';for(i in g='+B+tokens+B+')with('+packerData.packedCodeVarName+'.split(g[i]))'+packerData.packedCodeVarName+'=join(pop('+packerData.wrappedInit+'));'+packerData.environment+packerData.interpreterCall;
		return [this.getByteLength(i), i, details];
	},

	/**
	 * Clears a match from matchesLookup for dependencies
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
	 * @output array [length, packed string, log]
	 */
	packToRegexpCharClass : function(packerData, options) 
	{

		var details = '';
		// First, re-expand the packed strings so that they no longer contain any compression token
		// since we will be storing them in a different order.
		// Use this step to establish a dependency graph (compressed strings containing other compressed strings)
		for (var i=0;i<packerData.matchesLookup.length;++i) {
			for (var j=0; j<packerData.matchesLookup.length;++j) {
				if (packerData.matchesLookup[j].originalString.indexOf(packerData.matchesLookup[i].token)>-1) {
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
			if (i!=34 && i!=39 && i!=92 && packerData.escapedInput.indexOf(token)==-1) {
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
		packerData.tokenCount = 0; // total number of tokens used. Will be less than packerData.matchesLookup.length at the end if any negatives are found
		var tokenString = "";
		var regPackOutput = packerData.escapedInput;
		for (var i=0;i<packerData.matchesLookup.length;++i) {
			var matchIndex=-1, bestScore=-999, bestGain=-1, bestCount=0, negativeCleared = false;
			for (var j=0; j<packerData.matchesLookup.length;++j) {
				if (packerData.matchesLookup[j].usedBy=="" && !packerData.matchesLookup[j].cleared) {
					var count=0;
					for (var index=regPackOutput.indexOf(packerData.matchesLookup[j].originalString, 0); index>-1; ++count) {
						index=regPackOutput.indexOf(packerData.matchesLookup[j].originalString, index+1);
					}
					var gain = count*packerData.matchesLookup[j].len-count-packerData.matchesLookup[j].len-2;
					var score = options.crushGainFactor*gain+options.crushLengthFactor*packerData.matchesLookup[j].len+options.crushCopiesFactor*count;
					if (gain>=0) {
						if (score>bestScore||score==bestScore&&(gain>bestGain||gain==bestGain&&(options.crushTiebreakerFactor*count>options.crushTiebreakerFactor*bestCount))) // R>N JsCrush, R<N First Crush
							bestGain=gain,bestCount=count,matchIndex=j,bestScore=score,bestLength=packerData.matchesLookup[j].len;
					} else {
						// found a negative. The matching string may no longer be packed (if anything, match count will decrease, not increase)
						// so we clear it (ie remove it from the dependency chain). This in turns allows strings it uses to be packed,
						// otherwise their "usedBy" field would contain the negative and they could never be packed
						// clearing a negative introduces a bias, since some strings that were in order before it could have been
						// considered for compression, but they were not because they were "usedBy" the negative.
						// The comparison is useless : do not compress for this iteration of i 
						this.clear(packerData, j);
						negativeCleared = true;
					}
				}
			}
			if (!negativeCleared) {	// skip the compression step if we had a negative
				if (matchIndex>-1) {	// a string was chosen, replace it with the next token
					var matchedString = packerData.matchesLookup[matchIndex].originalString;
					packerData.matchesLookup[matchIndex].newOrder = packerData.tokenCount;
					
					// define the replacement token
					++packerData.tokenCount;
					if (++tokenIndex > tokenList[tokenLine].count) {
						// Fix for issue #31 : if a token line consists in a single "-", 
						// add it at the beginning of the character class instead of appending it
						if (tokenList[tokenLine].count==1 && tokenList[tokenLine].first == 45) { // 45 is '-'
							tokenString="-"+tokenString;
						} else {	// append the line as a single character, two characters or range (3+ characters)
							tokenString+=String.fromCharCode(tokenList[tokenLine].first);
							if (tokenList[tokenLine].count>2) {
								tokenString+="-";
							}
							if (tokenList[tokenLine].count>1) {
								tokenString+=String.fromCharCode(tokenList[tokenLine].first+tokenList[tokenLine].count-1);
							}
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
					this.clear(packerData, matchIndex);
				
				} else {	// remaining strings, but no gain : skip them and end the loop
					for (var j=0; j<packerData.matchesLookup.length;++j) {
						if (!packerData.matchesLookup[j].cleared) {
							details += "skipped str = "+packerData.matchesLookup[j].originalString+"\n";
						}
					}
					i=packerData.matchesLookup.length;
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
		regPackOutput='for('+packerData.packedCodeVarName+'='+B+regPackOutput.replace(c,'\\'+B)+B;
		regPackOutput+=';g=/['+tokenString+']/.exec('+packerData.packedCodeVarName+');)with('+packerData.packedCodeVarName+'.split(g))'+packerData.packedCodeVarName+'=join(shift('+packerData.wrappedInit+'));'+packerData.environment+packerData.interpreterCall;
		
		var resultSize = this.getByteLength(regPackOutput);
		
		details+="------------------------\nFinal check : ";
		var regToken = new RegExp("["+tokenString+"]","");
		for(var token="" ; token = regToken.exec(checkedString) ; ) {
			var k = checkedString.split(token);
			checkedString = k.join(k.shift());
		}
		var success = (checkedString == packerData.escapedInput);
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
	 * @input charCode unicode value of the character to encode
	 * @output formatted representation of the character for a RegExp char class
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
	 * @param packerData A PackerData structure holding the input string and setup
	 * @output array [length, packed string, log]
	 */
	packToNegatedRegexpCharClass : function(packerData) 
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
			if (packerData.escapedInput.indexOf(token)>-1) {
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
		for (i=0;i<packerData.escapedInput.length&&!inputContainsUnicode;++i) {
			inputContainsUnicode = inputContainsUnicode || (packerData.escapedInput.charCodeAt(i)>127);
		}
		if (inputContainsUnicode) {
			// non-ASCII as a whole block. Those characters are not allowed as tokens,
			// and the block can be merged later to save bytes
			usedCharacters.push({first:128, last:65535, size:3});
		}
		
		details = availableCharactersCount + " available tokens, "+packerData.tokenCount+" needed.\n"
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
		var margin = availableCharactersCount - packerData.tokenCount;
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
				// Fix for issue #31 : if a token line consists in a single "-", 
				// add it at the beginning of the character class instead of appending it
				if (j.size==1 && j.first==45) { // 45 is '-'
					currentCharClass='-'+currentCharClass;
				} else {
					currentCharClass+=this.printToRegexpCharClass(j.first);
					if (j.size>2) currentCharClass+='-';
					if (j.size>1) currentCharClass+=this.printToRegexpCharClass(j.last);
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
				if (!this.isForbiddenCharacter(charIndex)) {
					tokenString+=String.fromCharCode(charIndex);
				}
				++charIndex;
			}
			charIndex = 1+usedCharacters[i].last;
		}
		details+= "tokens = "+tokenString+" ("+tokenString.length+")\n";
		
		// use the same matches order as in the second stage
		packerData.matchesLookup.sort(function(a,b) {return a.newOrder-b.newOrder; });
		var thirdStageOutput = packerData.escapedInput;
		// and perform the replacement using the token string as listed above
		for (var i=0;i<packerData.tokenCount;++i)
		{
			var matchedString = packerData.matchesLookup[i].originalString;
			var token = tokenString[i];

			details+=token.charCodeAt(0)+"("+token+"), str = "+matchedString+"\n";
			thirdStageOutput = matchedString+token+thirdStageOutput.split(matchedString).join(token);
		}
		
		// add the unpacking code to the compressed string
		var checkedString = thirdStageOutput;
		c=thirdStageOutput.split('"').length<thirdStageOutput.split("'").length?(B='"',/"/g):(B="'",/'/g);
		thirdStageOutput='for('+packerData.packedCodeVarName+'='+B+thirdStageOutput.replace(c,'\\'+B)+B;
		thirdStageOutput+=';g=/['+regExpString+']/.exec('+packerData.packedCodeVarName+');)with('+packerData.packedCodeVarName+'.split(g))'+packerData.packedCodeVarName+'=join(shift('+packerData.wrappedInit+'));'+packerData.environment+packerData.interpreterCall;
		
		var resultSize = this.getByteLength(thirdStageOutput);
		
		details+="------------------------\nFinal check : ";
		var regToken = new RegExp("["+regExpString+"]","");
		for(var token="" ; token = regToken.exec(checkedString) ; ) {
			var k = checkedString.split(token);
			checkedString = k.join(k.shift());
		}
		var success = (checkedString == packerData.escapedInput);
		details+=(success ? "passed" : "failed")+".\n";
		

		return [resultSize, thirdStageOutput, details];
	} 

};

packer = new RegPack();


// Node.js setup
if (typeof require !== 'undefined') {
    if (require.main !== module) {
        //console.log(module);
        module.exports = {
            RegPack: RegPack,
            packer: packer,
            cmdRegPack: cmdRegPack
        };
    } else {
        var argv = require('minimist')(process.argv.slice(2));
        result = cmdRegPack(require('fs').readFileSync(argv._[0], 'utf-8'), argv);
        console.log(result);
    }
}

