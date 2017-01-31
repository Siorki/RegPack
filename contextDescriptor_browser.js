/**
 * @constructor
 * The ContextDescriptor class exposes the contents of the different contexts (2D graphic, GL graphics and Audio)
 * in a structure tailored for the use of the preprocessor.
 * @see Shapeshifter.js
 * It provides three descriptions :
 *   - canvas2DContextDescription : for a 2D context of a canvas
 *   - canvasGLContextDescription : for a webgl context of a canvas
 *   - audioContextDescription : for an AudioContext (if supported by the current browser)
 *
 * This implementation is tailored for in-browser execution (as opposed to server-side execution with Node.js)
 * It derives the contents from actual instances of the contexts.
 */
 function ContextDescriptor()
 {
	var canvas = document.createElement("canvas");
	var context2D = canvas.getContext("2d");
	this.canvas2DContextDescription = this.describeContext(context2D);
	this.balance2DContexts();
	
	canvas = document.createElement("canvas");
	var contextGL = canvas.getContext("webgl");
	this.canvasGLContextDescription = this.describeContext(contextGL);
	
	var audioContext = [];	// have an empty description if the AudioContext is not supported
	if (typeof AudioContext !== "undefined") {
		audioContext = new AudioContext;
	}
	this.audioContextDescription = this.describeContext(audioContext);
 }
 
 ContextDescriptor.prototype = {
 
	describeContext : function(context) {
		var description = { properties : [], constants : {} };
		for (var prop in context) {
			if (prop.match(/^[A-Z_0-9]*$/)) {	// constant : name in capitals only
				description.constants[prop] = context[prop];
			}
			description.properties.push(prop);
		}
		return description;
	},
	
	/**
	 * Fix for issue #20 - make sure the behavior is identical in all browsers
	 * by adding extra methods / properties to the description of 2D context
	 * to even out the property list for all browsers.
	 * 
	 * Needs to be reconsidered at each new browser revision 
	 * (current reference are for FF 50 / Chrome 54)
	 */
	balance2DContexts : function() {
		this.canvas2DContextDescription.properties.push("getContextAttributes");  // Chrome only
		this.canvas2DContextDescription.properties.push("imageSmoothingEnabled");  // Chrome only
		this.canvas2DContextDescription.properties.push("imageSmoothingQuality");  // Chrome only
		this.canvas2DContextDescription.properties.push("mozCurrentTransform"); // FF-prefixed
		this.canvas2DContextDescription.properties.push("mozCurrentTransformInverse"); // FF-prefixed
		this.canvas2DContextDescription.properties.push("mozDash"); // FF-prefixed
		this.canvas2DContextDescription.properties.push("mozDashOffset"); // FF-prefixed
		this.canvas2DContextDescription.properties.push("mozFillRule"); // FF-prefixed
		this.canvas2DContextDescription.properties.push("mozImageSmoothingEnabled"); // FF-prefixed
		this.canvas2DContextDescription.properties.push("mozTextStyle"); // FF-prefixed
		this.canvas2DContextDescription.properties.push("webkitImageSmoothingEnabled"); // Webkit-prefixed
		//#32 : removed drawImageFromRect (deprecated, supported up to Chrome 40)

	}
 }