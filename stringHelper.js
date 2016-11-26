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
		 * Returns the character matching the provided unicode value
		 * as it should be displayed in a character class in a Regexp :
		 *  - ] and \ needs escaping
		 *  - characters above 256 are \u....
		 *  - characters between 128 and 255 are \x..
		 *  - others (even below 32) are raw
		 * @input charCode unicode value of the character to encode
		 * @output formatted representation of the character for a RegExp char class
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
		 * @param character code for the first character in range
		 * @param length character count (last is thus first + length - 1)
		 * @return a string representing the range inside a character class
		 */
		this.writeRangeToRegexpCharClass = function(first, length) {
			var output = length > 0 ? this.writeCharToRegexpCharClass(first) : "";
			output += (length>2 ? "-" : "");
			if (length>1) {
				output += this.writeCharToRegexpCharClass(first + length - 1);
			}
			
			return output;
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

