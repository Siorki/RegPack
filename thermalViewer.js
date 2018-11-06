/**
 * @constructor
 * The ThermalViewer class renders the original code into a DHTML view,
 * using background color to show the final (packed) size of each character
 *
 *
 * @param name The name of the branch, summing the operations performed
 * @param dataString The input string to pack
 */
function ThermalViewer ()
{
}


ThermalViewer.prototype = {

	/**
	 * Produces an HTML render of the patterns used by the packer.
	 * The rendered <div> is not added to the page HTML.
	 * 
	 * @param unpackedCode The original unpacked code (before preprocessing)
	 * @param thermalMap Array listing all the mappings for the successive replacements
	 * @return A <div> object showing the varying compression rates in the code
	 *
	 */
	render : function(unpackedCode, thermalMap) {
		var output = document.createElement("pre");
		output.setAttribute("class","topLevel");
		
		// #89 : if the mapping is empty, assume identity
		// (no compression / replacement, every character stored as is)
		var finalSize = unpackedCode.length;
		if (thermalMap.length > 0) {
			finalSize = thermalMap[thermalMap.length-1][0].outLength;
		}

		// transform the successive mappings to a heatmap
		// start from the final size : 8 bits for each character of the output
		var currentHeatMap = new Array(finalSize).fill(8);
		
		for (let stageIndex=thermalMap.length-1; stageIndex>=0; --stageIndex) {
			let currentMapping = thermalMap[stageIndex];
			var nextHeatMap = currentHeatMap;
			if (currentMapping[0].complete) {	
				// the transform covers every byte of the string, hence the map is recomputer from scratch
				// as opposed to extra chapters that are only added to the current cost map
				nextHeatMap = new Array(currentMapping[0].inLength).fill(0);
			}
			for (let blockIndex=1; blockIndex<currentMapping.length; ++blockIndex) {
				let block=currentMapping[blockIndex];
				if (block.rangeIn.length==2 && block.rangeIn[1] == block.rangeOut[1]) {
					// same-length mapping : transfer character cost individually
					for (let offset=0; offset<block.rangeIn[1]; ++offset) {
						nextHeatMap[block.rangeIn[0]+offset] += currentHeatMap[block.rangeOut[0]+offset];
					}
				} else {
					// even-out the cost on all blocks
					var totalCost = 0;
					if (block.chapter == 0) {	// blocks inside the main code : compound costs
						for (let offset=0; offset<block.rangeOut[1]; ++offset) {
							totalCost += currentHeatMap[block.rangeOut[0]+offset];
						}
					} else {	// block in the unpacking routine : each character is exactly 8 bits
						totalCost = 8*block.rangeOut[1];
					}
					var totalLength = 0;
					for (let rangeIndex=1; rangeIndex<block.rangeIn.length; rangeIndex+=2) {
						totalLength+=block.rangeIn[rangeIndex];
					}
					var byteCost = totalCost / totalLength;
					for (let rangeIndex=0; rangeIndex<block.rangeIn.length; rangeIndex+=2) {
						for (let offset=0; offset<block.rangeIn[rangeIndex+1]; ++offset) {
							nextHeatMap[block.rangeIn[rangeIndex]+offset] += byteCost;
						}
					}
				}
			}
			currentHeatMap = nextHeatMap;
		}
		
		

		var currentColorValue = -1;
		var startOffset = 0;
		for (var offset=0; offset<=unpackedCode.length; ++offset) {
		
			var color = Math.floor(currentHeatMap[offset]);
			if (color != currentColorValue) {
				if (offset > 0) {
					this.addTextBlock(output, currentColorValue, unpackedCode.substring(startOffset, offset));
				}
				startOffset = offset;
				currentColorValue = color;
			}
		}
		
		if (startOffset<unpackedCode.length) {
			this.addTextBlock(output, currentColorValue, unpackedCode.substring(startOffset));
		}

		return output;
	},
	
	/**
	 * Internal method : adds a block of text to the output node.
	 * A block of text is a group of characters of the same color.
	 * @param parentNode the <div> or <pre> where the new block will be appended as a child
	 * @param colorClass background color index, integer [0-10] 
	 * @param text the text to display
	 */
	addTextBlock : function(parentNode, colorClass, text) {
		var newSpan = document.createElement("span");
		newSpan.appendChild(document.createTextNode(text));
		newSpan.setAttribute("class", "thermal"+Math.min(10, colorClass));
		parentNode.appendChild(newSpan);
	}
}


// Node.js exports (for non-regression tests only)
if (typeof require !== 'undefined') {
	module.exports = ThermalViewer;
}