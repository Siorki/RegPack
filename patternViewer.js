/**
 * @constructor
 * The PatternViewer class renders the original code
 * into a DHTML view highlighting the patterns from the packer.
 *
 *
 * @param name The name of the branch, summing the operations performed
 * @param dataString The input string to pack
 */
function PatternViewer ()
{
}


PatternViewer.prototype = {

	/**
	 * Produces an HTML render of the patterns used by the packer.
	 * The rendered <div> is not added to the page HTML.
	 * 
	 * @param unpackedCode The original unpacked code (after preprocessing)
	 * @param matchesLookup Pattern set from RegPack
	 * @return A <div> object showing the patterns in the code
	 *
	 */
	render : function(unpackedCode, matchesLookup)
	{
		// First, create arrays storing whether each character is
		// the beginning or the end of one or several pattern
		var patternBegin = [], patternEnd = [];	// imbrication level for each character
		for (var i=0; i<=unpackedCode.length; ++i) {
			patternBegin.push(0);
			patternEnd.push(0);
		}
		for (var j=0; j<matchesLookup.length;++j) {
			if (matchesLookup[j].token) {
				var pattern = matchesLookup[j].originalString;
				var offset = -pattern.length;
				while ((offset=unpackedCode.indexOf(pattern, pattern.length+offset))>-1) {
					++patternBegin[offset];
					++patternEnd[pattern.length+offset];
				}
			}
		}


		var output = document.createElement("pre");
		output.setAttribute("class","topLevel");
		var divStack = [ ];
		var currentNodeContents = "";
		var currentNode = output;
		var currentDepth = 0;
		// #42 : some patterns may contain the very end of the string
		// (stored in patternEnd[last character + 1] ), so we iterate one extra step to close the matching <div>s
		for (var offset=0; offset<=unpackedCode.length; ++offset)
		{
			for (var stepsDown=0; stepsDown<patternEnd[offset]; ++stepsDown) {
				// unstacking : close the span
				if (currentNodeContents != "") {
					currentNode.appendChild(document.createTextNode(currentNodeContents));
					currentNodeContents = "";
				}
				currentNode = divStack.pop();
				--currentDepth;
			}

			for (var stepsUp=0; stepsUp<patternBegin[offset]; ++stepsUp) {
				// stacking spans
				if (currentNodeContents != "") {
					currentNode.appendChild(document.createTextNode(currentNodeContents));
					currentNodeContents = "";
				}
				divStack.push(currentNode);
				var newSpan = document.createElement("span");
				newSpan.setAttribute("class","depth"+Math.min(9, ++currentDepth));
				currentNode.appendChild(newSpan);
				currentNode = newSpan;
			}
			
			// #42 : protect against overflow on that last character
			if (offset<unpackedCode.length) {
				currentNodeContents+=unpackedCode[offset];
			}
		}	
		
		// Append the last characters that are not part of a pattern
		if (currentNodeContents != "")
			currentNode.appendChild(document.createTextNode(currentNodeContents));

		return output;
	}

}

// Node.js exports (for non-regression tests only)
if (typeof require !== 'undefined') {
	module.exports = PatternViewer;
}
