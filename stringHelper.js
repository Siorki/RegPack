/**
 * StringHelper provides utility functions to operator on strings and regular expressions.
 * 
 * It is stateless and implements the singleton pattern.
 *
 * JS singleton implementation based on
 * http://tassedecafe.org/fr/implementer-design-pattern-singleton-javascript-1023
 */
 

var StringHelper = (function() {
	var constructor = function() {
	
	
		/**
		 * Count bytes in a string's UTF-8 representation.
		 * Code by 200_success at http://codereview.stackexchange.com/questions/37512/count-byte-length-of-string
		 *
		 * @param normal_val : input string
		 * @return (int) string byte length
		 */
		this.getByteLength = function (normal_val) {
			// Force string type
			normal_val = String(normal_val);

			var byteLen = 0;
			for (var i = 0; i < normal_val.length; i++) {
				var c = normal_val.charCodeAt(i);
				byteLen += c < (1 <<  7) ? 1 :
						   c < (1 << 11) ? 2 :
						   c < (1 << 16) ? 3 :
						   c < (1 << 21) ? 4 :
						   c < (1 << 26) ? 5 :
						   c < (1 << 31) ? 6 : Number.NaN;
			}
			return byteLen;
		}
		
		/**
		 * Count bytes in a character's UTF-8 representation inside a string
		 * Code similar to getByteLength() except for character \ thar must be escaped and thus costs 2
		 * @see getByteLength
		 * @param unicode : character's Unicode valude
		 * @return (int) character byte length
		 */
		this.getCharacterLength = function (unicode) {
			var byteLen = unicode < (1 <<  7) ? 1 :
						  unicode < (1 << 11) ? 2 :
						  unicode < (1 << 16) ? 3 :
						  unicode < (1 << 21) ? 4 :
						  unicode < (1 << 26) ? 5 :
						  unicode < (1 << 31) ? 6 : Number.NaN;
			byteLen += (unicode==92 ? 1 : 0);
			return byteLen;
		}
		 
		
		/**
		 * Encode a string to base64
		 * Replacement for btoa() which does not handle correctly characters beyond 0xff
		 *
		 * Code from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
		 * See also http://stackoverflow.com/questions/246801/how-can-you-encode-a-string-to-base64-in-javascript
		 *
		 * @param str String to encode
		 * @return base64 representation of the string
		 */
		this.unicodeToBase64 = function(str) {
			return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
				return String.fromCharCode('0x' + p1);
			}));
		}

		/**
		 * Decode a string from base64
		 * Replaces atob() which does not handle correctly characters beyond 0xff
		 *
		 * Code from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
		 *
		 * @param str base64 string to decode
		 * @return original decoded string
		 */
		this.base64ToUnicode = function(str) {
			return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			}).join(''));
		}

		/**
		 * Returns whether the contents of the input at the given offset is a string or actual code
		 * Actual code means either :
		 *  - outside of a string
		 *  - inside a string AND inside a template literal
		 *
		 * The provided PackerData must have been run through identifyStrings() first.
		 * 
		 * @param offset byte offset within the input contents
		 * @param inputData (constant) PackerData containing the input string and the string identification
		 */
		this.isActualCodeAt = function(offset, inputData) {
			var stringIndex = 0, templateLiteralIndex = 0;			
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
				
			return (!insideString) || insideTemplateLiteral;
		}
		
		/**
		 * Replace all instances of a substring, and record the changes in a transform function
		 * Use instead of String.replace(/.../g) to get the mapping function needed for the heatwave view.
		 *
		 * Specific version of matchAndReplaceFirstAndAll where all occurrences are replaced with the same text
		 * @see matchAndReplaceFirstAndAll
		 *
		 * @param input input string before replacements (unmodified)
		 * @param matchExp regular expression to search for (false to match originalText as is)
		 * @param originalText substring to replace within the regex match
		 * @param replacementText substring to substitute to all instances of originalText
		 * @param prefix string to prepend to the output, mapped to all matches (use "" if none)
		 * @param suffix string to append to the output, mapped to all matches (use "" if none)
		 * @param extraMapping string from another chapter, mapped to all matches, not added here (false if none)
		 * @param thermalMap array of all successive mapping functions (modified)
		 * @return the string with all replacements performed
		 */
		this.matchAndReplaceAll = function(input, matchExp, originalText, replacementText, prefix, suffix, extraMapping, thermalMap) {
			return this.matchAndReplaceFirstAndAll(input, matchExp, originalText, replacementText, replacementText, prefix, suffix, extraMapping, thermalMap);
		}

		
		/**
		 * Replace all instances of a substring, and record the changes in a transform function
		 * Use instead of String.replace(/.../g) to get the mapping function needed for the heatwave view.
		 *
		 * The matching operation is either done with a string search (set matchExp to false)
		 * or with a regular expression that is first matched, then the originalText is
		 * searched and replaced inside the regex match.
		 * 
		 * The crusher and packer can prepend and append a dictionary entry to the string.
		 * In the mapping, this prefix or suffix is mapped to all replaced strings.
		 *
		 * The first match has a different replacement string than the subsequent ones
		 * This is intended to define a dictionary entry or a variable allocation in the first one.
		 * In this case, the extra characters (the cost of the allocation) are mapped to all replaced strings.
		 *
		 * @param input input string before replacements (unmodified)
		 * @param matchExp regular expression to search for (false to match originalText as is)
		 * @param originalText substring to replace within the regex match
		 * @param firstReplacementText substring to substitute to the first instance of originalText
		 * @param otherReplacementsText substring to substitute to all but the first instance of originalText
		 * @param prefix string to prepend to the output, mapped to all matches (use "" if none)
		 * @param suffix string to append to the output, mapped to all matches (use "" if none)
		 * @param extraMapping string from another chapter, mapped to all matches, not added here (false if none)
		 * @param thermalMap array of all successive mapping functions (modified)
		 * @return the string with all replacements performed
		 */
		this.matchAndReplaceFirstAndAll = function(input, matchExp, originalText, firstReplacementText, otherReplacementsText, prefix, suffix, extraMapping, thermalMap) {
			var mappingFunction = [];
			var allRangesIn = [];
			var output = prefix;
			var inputPointer = 0;
			var originalTextLength = originalText.length;
			var replacementTextLength = otherReplacementsText.length;
			var initialAllocationLength = otherReplacementsText.length - firstReplacementText.length;
			var firstReplacementMapping = false;
			var replacedCopies = 0;
			var offset = -1;
			if (matchExp) {
				let nextMatch = matchExp.exec(input);
				if (nextMatch) {
					let offsetInMatch = nextMatch[0].indexOf(originalText);
					offset = nextMatch.index + offsetInMatch;
				}
			} else {
				offset = input.indexOf(originalText, inputPointer);
			}
			while (offset >= 0) {
				if (offset>inputPointer) {
					// there is an interval between two replaced blocks. Register it into the mapping
					let intervalMapping = {
						chapter : 0,
						rangeIn : [inputPointer, offset-inputPointer],
						rangeOut: [output.length, offset-inputPointer]
					};
					mappingFunction.push(intervalMapping);
					output+= input.substring(inputPointer, offset);
				}
				// register the replaced text into the mapping
				// #86 : always use the length of the 2nd+ replacement,
				// as the extra from the first one, if any, corresponds to the allocation
				// and will be split on all matches on a dedicated mapping
				let matchMapping = {
					chapter : 0,
					rangeIn : [offset, originalTextLength],
					rangeOut: [output.length, replacementTextLength] 
				};
				mappingFunction.push(matchMapping);
				if (replacedCopies == 0 && initialAllocationLength > 0) {
					// #86 : mapping of the allocation (extra length from 1st replacement), later split on all matches
					firstReplacementMapping = {rangeOut : [output.length+replacementTextLength, initialAllocationLength] };
				}
				output+= replacedCopies==0 ? firstReplacementText : otherReplacementsText;
				++replacedCopies;
				allRangesIn.push(offset, originalTextLength);
				
				inputPointer = offset+originalTextLength;
				if (matchExp) {
					let nextMatch = matchExp.exec(input);
					if (nextMatch) {
						let offsetInMatch = nextMatch[0].indexOf(originalText);
						offset = nextMatch.index + offsetInMatch;
					} else {
						offset = -1;
					}
				} else {
					offset = input.indexOf(originalText, inputPointer);
				}
			}
			// text remaining at the end
			if (inputPointer < input.length) {
				let intervalMapping = {
					rangeIn : [inputPointer, input.length-inputPointer],
					rangeOut: [output.length, input.length-inputPointer]
				};
				mappingFunction.push(intervalMapping);
				output+= input.substring(inputPointer);
			}
			// Map prefix and suffix (if any) to all replaced blocks
			if (prefix != "") {
				let prefixMapping = {
					rangeIn : allRangesIn,
					rangeOut : [0, prefix.length]
				};
				mappingFunction.push(prefixMapping);
			}
			if (suffix != "") {
				let suffixMapping = {
					rangeIn : allRangesIn,
					rangeOut : [output.length, suffix.length]
				};
				mappingFunction.push(suffixMapping);
			}
			if (extraMapping) {
				extraMapping.rangeIn = allRangesIn;
				mappingFunction.push(extraMapping);
			}
			// #86 : Map allocation from first replacement text to all matches
			if (firstReplacementMapping) {
				firstReplacementMapping.rangeIn = allRangesIn;
				mappingFunction.push(firstReplacementMapping);
			}
			output+= suffix;
			
			mappingFunction.unshift({ inLength : input.length, outLength : output.length, complete:true});
			thermalMap.push(mappingFunction);
			
			return output;
		}
	
		/**
		 * Returns the character matching the provided unicode value
		 * as it should be displayed in a character class in a Regexp :
		 *  - ] and \ needs escaping
		 *  - characters above 256 are \u....
		 *  - characters between 128 and 255 are \x..
		 *  - others (even below 32) are raw
		 * @input charCode unicode value of the character to encode
		 * @return formatted representation of the character for a RegExp char class
		 */
		this.writeCharToRegexpCharClass = function(charCode)
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
		}


	
		/**
		 * Express a block as a range for a character class in a RegExp
		 * @param first character code for the first character in range
		 * @param last character code for the last character in range
		 * @return a string representing the range inside a character class
		 */
		this.writeRangeToRegexpCharClass = function(first, last) {
			var length = last-first+1;
			var output = length > 0 ? this.writeCharToRegexpCharClass(first) : "";
			output += (length>2 ? "-" : "");
			if (length>1) {
				output += this.writeCharToRegexpCharClass(last);
			}
			
			return output;
		}
		
		/**
		 * Express an array of blocks(ranges) as a character class in a RegExp
		 * by iteratively calling writeRangeToRegexpCharClass on each range, then concatenating the result
		 * @see writeRangeToRegexpCharClass
		 *
		 * @param allRanges array of objects {first:..., last:..., size:...} to express as a character class 
		 * @return a string representing the character class, without the encapsulating [ ]
		 */
		this.writeBlocksToRegexpCharClass = function(allRanges) {
			var currentCharClass = "";
			for (var blockIndex = 0 ; blockIndex < allRanges.length ; ++blockIndex) {
				let oneRange = allRanges[blockIndex];
				let rangeString = this.writeRangeToRegexpCharClass(oneRange.first, oneRange.last);
				// Fix for issue #31 : if a token line begins with "-",
				// add it at the beginning of the character class instead of appending it
				if (oneRange.first==45) { // 45 is '-'
					currentCharClass=rangeString+currentCharClass;
				} else {
					currentCharClass+=rangeString;
				}
			}
			return currentCharClass;
		}
		
		
		/**
		 * Returns true if the character requires a backlash as a prefix in the character class of the
		 * RegExp to be interpreted as part of the expression
		 * Character : \ (used to escape others)
		 * Character : ] (would close the character class otherwise)
		 * @param ascii character code (ASCII / Unicode)
		 * @return true if a backslash is needed, false otherwise
		 */
		this.needsEscapingInCharClass = function(ascii) {
			return ascii==92||ascii==93;
		}
		
	}
	
	var instance = null;
	return new function() {
		this.getInstance = function() {
			if (instance == null) {
				instance = new constructor();
				instance.constructor = null;
			}
			
			return instance;
		}
	}
})();


// Node.js init
if (typeof require !== 'undefined') {
	module.exports = StringHelper;
}

