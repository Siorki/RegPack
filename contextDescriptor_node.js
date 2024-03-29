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
 * This implementation is a workaround for Node.js environments, which do not provide built-in canvas (nor associated contexts)
 * The values are explicitely set based on FF 50 and Chrome 54
 */
 function ContextDescriptor()
 {
	
	this.canvas2DContextDescription = {
		properties : [
			"arc",
			"arcTo",
			"beginPath",
			"bezierCurveTo",
			"canvas",
			"clearRect",
			"clip",
			"closePath",
			"createConicGradient",
			"createImageData",
			"createLinearGradient",
			"createPattern",
			"createRadialGradient",
			"direction",
			"drawFocusIfNeeded",
			"drawImage",
			"ellipse",
			"fill",
			"fillRect",
			"fillStyle",
			"fillText",
			"filter",
			"font",
			"fontKerning",
			"fontStretch",
			"fontVariantCaps",
			"getContextAttributes",
			"getImageData",
			"getLineDash",
			"getTransform",
			"globalAlpha",
			"globalCompositeOperation",
			"imageSmoothingEnabled",
			"imageSmoothingQuality",
			"isContextLost",
			"isPointInPath",
			"isPointInStroke",
			"letterSpacing",
			"lineCap",
			"lineDashOffset",
			"lineJoin",
			"lineTo",
			"lineWidth",
			"measureText",
			"miterLimit",
			"moveTo",
			"putImageData",
			"quadraticCurveTo",
			"rect",
			"reset",
			"resetTransform",
			"restore",
			"rotate",
			"roundRect",
			"save",
			"scale",
			"setLineDash",
			"setTransform",
			"shadowBlur",
			"shadowColor",
			"shadowOffsetX",
			"shadowOffsetY",
			"stroke",
			"strokeRect",
			"strokeStyle",
			"strokeText",
			"textAlign",
			"textBaseline",
			"textRendering",
			"transform",
			"translate",
			"wordSpacing",
			// Fix for issue #20 : add - make sure the behavior is identical in all browsers
			// by adding extra methods / properties to the description of 2D context
			// to even out the property list for all browsers.
			"mozCurrentTransform", // FF-prefixed
			"mozCurrentTransformInverse", // FF-prefixed
			"mozImageSmoothingEnabled", // FF-prefixed
			"mozTextStyle" // FF-prefixed
			//#32 : removed drawImageFromRect (deprecated, supported up to Chrome 40)
		], 
		constants : {}
	};
	
	this.canvasGLContextDescription = {
		properties : [
			"ACTIVE_ATTRIBUTES",
			"ACTIVE_TEXTURE",
			"ACTIVE_UNIFORMS",
			"ALIASED_LINE_WIDTH_RANGE",
			"ALIASED_POINT_SIZE_RANGE",
			"ALPHA",
			"ALPHA_BITS",
			"ALWAYS",
			"ARRAY_BUFFER",
			"ARRAY_BUFFER_BINDING",
			"ATTACHED_SHADERS",
			"BACK",
			"BLEND",
			"BLEND_COLOR",
			"BLEND_DST_ALPHA",
			"BLEND_DST_RGB",
			"BLEND_EQUATION",
			"BLEND_EQUATION_ALPHA",
			"BLEND_EQUATION_RGB",
			"BLEND_SRC_ALPHA",
			"BLEND_SRC_RGB",
			"BLUE_BITS",
			"BOOL",
			"BOOL_VEC2",
			"BOOL_VEC3",
			"BOOL_VEC4",
			"BROWSER_DEFAULT_WEBGL",
			"BUFFER_SIZE",
			"BUFFER_USAGE",
			"BYTE",
			"CCW",
			"CLAMP_TO_EDGE",
			"COLOR_ATTACHMENT0",
			"COLOR_BUFFER_BIT",
			"COLOR_CLEAR_VALUE",
			"COLOR_WRITEMASK",
			"COMPILE_STATUS",
			"COMPRESSED_TEXTURE_FORMATS",
			"CONSTANT_ALPHA",
			"CONSTANT_COLOR",
			"CONTEXT_LOST_WEBGL",
			"CULL_FACE",
			"CULL_FACE_MODE",
			"CURRENT_PROGRAM",
			"CURRENT_VERTEX_ATTRIB",
			"CW",
			"DECR",
			"DECR_WRAP",
			"DELETE_STATUS",
			"DEPTH_ATTACHMENT",
			"DEPTH_BITS",
			"DEPTH_BUFFER_BIT",
			"DEPTH_CLEAR_VALUE",
			"DEPTH_COMPONENT",
			"DEPTH_COMPONENT16",
			"DEPTH_FUNC",
			"DEPTH_RANGE",
			"DEPTH_STENCIL",
			"DEPTH_STENCIL_ATTACHMENT",
			"DEPTH_TEST",
			"DEPTH_WRITEMASK",
			"DITHER",
			"DONT_CARE",
			"DST_ALPHA",
			"DST_COLOR",
			"DYNAMIC_DRAW",
			"ELEMENT_ARRAY_BUFFER",
			"ELEMENT_ARRAY_BUFFER_BINDING",
			"EQUAL",
			"FASTEST",
			"FLOAT",
			"FLOAT_MAT2",
			"FLOAT_MAT3",
			"FLOAT_MAT4",
			"FLOAT_VEC2",
			"FLOAT_VEC3",
			"FLOAT_VEC4",
			"FRAGMENT_SHADER",
			"FRAMEBUFFER",
			"FRAMEBUFFER_ATTACHMENT_OBJECT_NAME",
			"FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE",
			"FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE",
			"FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL",
			"FRAMEBUFFER_BINDING",
			"FRAMEBUFFER_COMPLETE",
			"FRAMEBUFFER_INCOMPLETE_ATTACHMENT",
			"FRAMEBUFFER_INCOMPLETE_DIMENSIONS",
			"FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT",
			"FRAMEBUFFER_UNSUPPORTED",
			"FRONT",
			"FRONT_AND_BACK",
			"FRONT_FACE",
			"FUNC_ADD",
			"FUNC_REVERSE_SUBTRACT",
			"FUNC_SUBTRACT",
			"GENERATE_MIPMAP_HINT",
			"GEQUAL",
			"GREATER",
			"GREEN_BITS",
			"HIGH_FLOAT",
			"HIGH_INT",
			"IMPLEMENTATION_COLOR_READ_FORMAT",
			"IMPLEMENTATION_COLOR_READ_TYPE",
			"INCR",
			"INCR_WRAP",
			"INT",
			"INT_VEC2",
			"INT_VEC3",
			"INT_VEC4",
			"INVALID_ENUM",
			"INVALID_FRAMEBUFFER_OPERATION",
			"INVALID_OPERATION",
			"INVALID_VALUE",
			"INVERT",
			"KEEP",
			"LEQUAL",
			"LESS",
			"LINEAR",
			"LINEAR_MIPMAP_LINEAR",
			"LINEAR_MIPMAP_NEAREST",
			"LINES",
			"LINE_LOOP",
			"LINE_STRIP",
			"LINE_WIDTH",
			"LINK_STATUS",
			"LOW_FLOAT",
			"LOW_INT",
			"LUMINANCE",
			"LUMINANCE_ALPHA",
			"MAX_COMBINED_TEXTURE_IMAGE_UNITS",
			"MAX_CUBE_MAP_TEXTURE_SIZE",
			"MAX_FRAGMENT_UNIFORM_VECTORS",
			"MAX_RENDERBUFFER_SIZE",
			"MAX_TEXTURE_IMAGE_UNITS",
			"MAX_TEXTURE_SIZE",
			"MAX_VARYING_VECTORS",
			"MAX_VERTEX_ATTRIBS",
			"MAX_VERTEX_TEXTURE_IMAGE_UNITS",
			"MAX_VERTEX_UNIFORM_VECTORS",
			"MAX_VIEWPORT_DIMS",
			"MEDIUM_FLOAT",
			"MEDIUM_INT",
			"MIRRORED_REPEAT",
			"NEAREST",
			"NEAREST_MIPMAP_LINEAR",
			"NEAREST_MIPMAP_NEAREST",
			"NEVER",
			"NICEST",
			"NONE",
			"NOTEQUAL",
			"NO_ERROR",
			"ONE",
			"ONE_MINUS_CONSTANT_ALPHA",
			"ONE_MINUS_CONSTANT_COLOR",
			"ONE_MINUS_DST_ALPHA",
			"ONE_MINUS_DST_COLOR",
			"ONE_MINUS_SRC_ALPHA",
			"ONE_MINUS_SRC_COLOR",
			"OUT_OF_MEMORY",
			"PACK_ALIGNMENT",
			"POINTS",
			"POLYGON_OFFSET_FACTOR",
			"POLYGON_OFFSET_FILL",
			"POLYGON_OFFSET_UNITS",
			"RED_BITS",
			"RENDERBUFFER",
			"RENDERBUFFER_ALPHA_SIZE",
			"RENDERBUFFER_BINDING",
			"RENDERBUFFER_BLUE_SIZE",
			"RENDERBUFFER_DEPTH_SIZE",
			"RENDERBUFFER_GREEN_SIZE",
			"RENDERBUFFER_HEIGHT",
			"RENDERBUFFER_INTERNAL_FORMAT",
			"RENDERBUFFER_RED_SIZE",
			"RENDERBUFFER_STENCIL_SIZE",
			"RENDERBUFFER_WIDTH",
			"RENDERER",
			"REPEAT",
			"REPLACE",
			"RGB",
			"RGB565",
			"RGB5_A1",
			"RGBA",
			"RGBA4",
			"SAMPLER_2D",
			"SAMPLER_CUBE",
			"SAMPLES",
			"SAMPLE_ALPHA_TO_COVERAGE",
			"SAMPLE_BUFFERS",
			"SAMPLE_COVERAGE",
			"SAMPLE_COVERAGE_INVERT",
			"SAMPLE_COVERAGE_VALUE",
			"SCISSOR_BOX",
			"SCISSOR_TEST",
			"SHADER_TYPE",
			"SHADING_LANGUAGE_VERSION",
			"SHORT",
			"SRC_ALPHA",
			"SRC_ALPHA_SATURATE",
			"SRC_COLOR",
			"STATIC_DRAW",
			"STENCIL_ATTACHMENT",
			"STENCIL_BACK_FAIL",
			"STENCIL_BACK_FUNC",
			"STENCIL_BACK_PASS_DEPTH_FAIL",
			"STENCIL_BACK_PASS_DEPTH_PASS",
			"STENCIL_BACK_REF",
			"STENCIL_BACK_VALUE_MASK",
			"STENCIL_BACK_WRITEMASK",
			"STENCIL_BITS",
			"STENCIL_BUFFER_BIT",
			"STENCIL_CLEAR_VALUE",
			"STENCIL_FAIL",
			"STENCIL_FUNC",
			"STENCIL_INDEX8",
			"STENCIL_PASS_DEPTH_FAIL",
			"STENCIL_PASS_DEPTH_PASS",
			"STENCIL_REF",
			"STENCIL_TEST",
			"STENCIL_VALUE_MASK",
			"STENCIL_WRITEMASK",
			"STREAM_DRAW",
			"SUBPIXEL_BITS",
			"TEXTURE",
			"TEXTURE0",
			"TEXTURE1",
			"TEXTURE10",
			"TEXTURE11",
			"TEXTURE12",
			"TEXTURE13",
			"TEXTURE14",
			"TEXTURE15",
			"TEXTURE16",
			"TEXTURE17",
			"TEXTURE18",
			"TEXTURE19",
			"TEXTURE2",
			"TEXTURE20",
			"TEXTURE21",
			"TEXTURE22",
			"TEXTURE23",
			"TEXTURE24",
			"TEXTURE25",
			"TEXTURE26",
			"TEXTURE27",
			"TEXTURE28",
			"TEXTURE29",
			"TEXTURE3",
			"TEXTURE30",
			"TEXTURE31",
			"TEXTURE4",
			"TEXTURE5",
			"TEXTURE6",
			"TEXTURE7",
			"TEXTURE8",
			"TEXTURE9",
			"TEXTURE_2D",
			"TEXTURE_BINDING_2D",
			"TEXTURE_BINDING_CUBE_MAP",
			"TEXTURE_CUBE_MAP",
			"TEXTURE_CUBE_MAP_NEGATIVE_X",
			"TEXTURE_CUBE_MAP_NEGATIVE_Y",
			"TEXTURE_CUBE_MAP_NEGATIVE_Z",
			"TEXTURE_CUBE_MAP_POSITIVE_X",
			"TEXTURE_CUBE_MAP_POSITIVE_Y",
			"TEXTURE_CUBE_MAP_POSITIVE_Z",
			"TEXTURE_MAG_FILTER",
			"TEXTURE_MIN_FILTER",
			"TEXTURE_WRAP_S",
			"TEXTURE_WRAP_T",
			"TRIANGLES",
			"TRIANGLE_FAN",
			"TRIANGLE_STRIP",
			"UNPACK_ALIGNMENT",
			"UNPACK_COLORSPACE_CONVERSION_WEBGL",
			"UNPACK_FLIP_Y_WEBGL",
			"UNPACK_PREMULTIPLY_ALPHA_WEBGL",
			"UNSIGNED_BYTE",
			"UNSIGNED_INT",
			"UNSIGNED_SHORT",
			"UNSIGNED_SHORT_4_4_4_4",
			"UNSIGNED_SHORT_5_5_5_1",
			"UNSIGNED_SHORT_5_6_5",
			"VALIDATE_STATUS",
			"VENDOR",
			"VERSION",
			"VERTEX_ATTRIB_ARRAY_BUFFER_BINDING",
			"VERTEX_ATTRIB_ARRAY_ENABLED",
			"VERTEX_ATTRIB_ARRAY_NORMALIZED",
			"VERTEX_ATTRIB_ARRAY_POINTER",
			"VERTEX_ATTRIB_ARRAY_SIZE",
			"VERTEX_ATTRIB_ARRAY_STRIDE",
			"VERTEX_ATTRIB_ARRAY_TYPE",
			"VERTEX_SHADER",
			"VIEWPORT",
			"ZERO",
			"activeTexture",
			"attachShader",
			"bindAttribLocation",
			"bindBuffer",
			"bindFramebuffer",
			"bindRenderbuffer",
			"bindTexture",
			"blendColor",
			"blendEquation",
			"blendEquationSeparate",
			"blendFunc",
			"blendFuncSeparate",
			"bufferData",
			"bufferSubData",
			"canvas",
			"checkFramebufferStatus",
			"clear",
			"clearColor",
			"clearDepth",
			"clearStencil",
			"colorMask",
			"compileShader",
			"compressedTexImage2D",
			"compressedTexSubImage2D",
			"copyTexImage2D",
			"copyTexSubImage2D",
			"createBuffer",
			"createFramebuffer",
			"createProgram",
			"createRenderbuffer",
			"createShader",
			"createTexture",
			"cullFace",
			"deleteBuffer",
			"deleteFramebuffer",
			"deleteProgram",
			"deleteRenderbuffer",
			"deleteShader",
			"deleteTexture",
			"depthFunc",
			"depthMask",
			"depthRange",
			"detachShader",
			"disable",
			"disableVertexAttribArray",
			"drawArrays",
			"drawElements",
			"drawingBufferHeight",
			"drawingBufferWidth",
			"enable",
			"enableVertexAttribArray",
			"finish",
			"flush",
			"framebufferRenderbuffer",
			"framebufferTexture2D",
			"frontFace",
			"generateMipmap",
			"getActiveAttrib",
			"getActiveUniform",
			"getAttachedShaders",
			"getAttribLocation",
			"getBufferParameter",
			"getContextAttributes",
			"getError",
			"getExtension",
			"getFramebufferAttachmentParameter",
			"getParameter",
			"getProgramInfoLog",
			"getProgramParameter",
			"getRenderbufferParameter",
			"getShaderInfoLog",
			"getShaderParameter",
			"getShaderPrecisionFormat",
			"getShaderSource",
			"getSupportedExtensions",
			"getTexParameter",
			"getUniform",
			"getUniformLocation",
			"getVertexAttrib",
			"getVertexAttribOffset",
			"hint",
			"isBuffer",
			"isContextLost",
			"isEnabled",
			"isFramebuffer",
			"isProgram",
			"isRenderbuffer",
			"isShader",
			"isTexture",
			"lineWidth",
			"linkProgram",
			"makeXRCompatible",
			"pixelStorei",
			"polygonOffset",
			"readPixels",
			"renderbufferStorage",
			"sampleCoverage",
			"scissor",
			"shaderSource",
			"stencilFunc",
			"stencilFuncSeparate",
			"stencilMask",
			"stencilMaskSeparate",
			"stencilOp",
			"stencilOpSeparate",
			"texImage2D",
			"texParameterf",
			"texParameteri",
			"texSubImage2D",
			"uniform1f",
			"uniform1fv",
			"uniform1i",
			"uniform1iv",
			"uniform2f",
			"uniform2fv",
			"uniform2i",
			"uniform2iv",
			"uniform3f",
			"uniform3fv",
			"uniform3i",
			"uniform3iv",
			"uniform4f",
			"uniform4fv",
			"uniform4i",
			"uniform4iv",
			"uniformMatrix2fv",
			"uniformMatrix3fv",
			"uniformMatrix4fv",
			"useProgram",
			"validateProgram",
			"vertexAttrib1f",
			"vertexAttrib1fv",
			"vertexAttrib2f",
			"vertexAttrib2fv",
			"vertexAttrib3f",
			"vertexAttrib3fv",
			"vertexAttrib4f",
			"vertexAttrib4fv",
			"vertexAttribPointer",
			"viewport"
		], 
		constants : {
			ACTIVE_ATTRIBUTES : 35721,
			ACTIVE_TEXTURE : 34016,
			ACTIVE_UNIFORMS : 35718,
			ALIASED_LINE_WIDTH_RANGE : 33902,
			ALIASED_POINT_SIZE_RANGE : 33901,
			ALPHA : 6406,
			ALPHA_BITS : 3413,
			ALWAYS : 519,
			ARRAY_BUFFER : 34962,
			ARRAY_BUFFER_BINDING : 34964,
			ATTACHED_SHADERS : 35717,
			BACK : 1029,
			BLEND : 3042,
			BLEND_COLOR : 32773,
			BLEND_DST_ALPHA : 32970,
			BLEND_DST_RGB : 32968,
			BLEND_EQUATION : 32777,
			BLEND_EQUATION_ALPHA : 34877,
			BLEND_EQUATION_RGB : 32777,
			BLEND_SRC_ALPHA : 32971,
			BLEND_SRC_RGB : 32969,
			BLUE_BITS : 3412,
			BOOL : 35670,
			BOOL_VEC2 : 35671,
			BOOL_VEC3 : 35672,
			BOOL_VEC4 : 35673,
			BROWSER_DEFAULT_WEBGL : 37444,
			BUFFER_SIZE : 34660,
			BUFFER_USAGE : 34661,
			BYTE : 5120,
			CCW : 2305,
			CLAMP_TO_EDGE : 33071,
			COLOR_ATTACHMENT0 : 36064,
			COLOR_BUFFER_BIT : 16384,
			COLOR_CLEAR_VALUE : 3106,
			COLOR_WRITEMASK : 3107,
			COMPILE_STATUS : 35713,
			COMPRESSED_TEXTURE_FORMATS : 34467,
			CONSTANT_ALPHA : 32771,
			CONSTANT_COLOR : 32769,
			CONTEXT_LOST_WEBGL : 37442,
			CULL_FACE : 2884,
			CULL_FACE_MODE : 2885,
			CURRENT_PROGRAM : 35725,
			CURRENT_VERTEX_ATTRIB : 34342,
			CW : 2304,
			DECR : 7683,
			DECR_WRAP : 34056,
			DELETE_STATUS : 35712,
			DEPTH_ATTACHMENT : 36096,
			DEPTH_BITS : 3414,
			DEPTH_BUFFER_BIT : 256,
			DEPTH_CLEAR_VALUE : 2931,
			DEPTH_COMPONENT : 6402,
			DEPTH_COMPONENT16 : 33189,
			DEPTH_FUNC : 2932,
			DEPTH_RANGE : 2928,
			DEPTH_STENCIL : 34041,
			DEPTH_STENCIL_ATTACHMENT : 33306,
			DEPTH_TEST : 2929,
			DEPTH_WRITEMASK : 2930,
			DITHER : 3024,
			DONT_CARE : 4352,
			DST_ALPHA : 772,
			DST_COLOR : 774,
			DYNAMIC_DRAW : 35048,
			ELEMENT_ARRAY_BUFFER : 34963,
			ELEMENT_ARRAY_BUFFER_BINDING : 34965,
			EQUAL : 514,
			FASTEST : 4353,
			FLOAT : 5126,
			FLOAT_MAT2 : 35674,
			FLOAT_MAT3 : 35675,
			FLOAT_MAT4 : 35676,
			FLOAT_VEC2 : 35664,
			FLOAT_VEC3 : 35665,
			FLOAT_VEC4 : 35666,
			FRAGMENT_SHADER : 35632,
			FRAMEBUFFER : 36160,
			FRAMEBUFFER_ATTACHMENT_OBJECT_NAME : 36049,
			FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE : 36048,
			FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE : 36051,
			FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL : 36050,
			FRAMEBUFFER_BINDING : 36006,
			FRAMEBUFFER_COMPLETE : 36053,
			FRAMEBUFFER_INCOMPLETE_ATTACHMENT : 36054,
			FRAMEBUFFER_INCOMPLETE_DIMENSIONS : 36057,
			FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT : 36055,
			FRAMEBUFFER_UNSUPPORTED : 36061,
			FRONT : 1028,
			FRONT_AND_BACK : 1032,
			FRONT_FACE : 2886,
			FUNC_ADD : 32774,
			FUNC_REVERSE_SUBTRACT : 32779,
			FUNC_SUBTRACT : 32778,
			GENERATE_MIPMAP_HINT : 33170,
			GEQUAL : 518,
			GREATER : 516,
			GREEN_BITS : 3411,
			HIGH_FLOAT : 36338,
			HIGH_INT : 36341,
			IMPLEMENTATION_COLOR_READ_FORMAT : 35739,
			IMPLEMENTATION_COLOR_READ_TYPE : 35738,
			INCR : 7682,
			INCR_WRAP : 34055,
			INT : 5124,
			INT_VEC2 : 35667,
			INT_VEC3 : 35668,
			INT_VEC4 : 35669,
			INVALID_ENUM : 1280,
			INVALID_FRAMEBUFFER_OPERATION : 1286,
			INVALID_OPERATION : 1282,
			INVALID_VALUE : 1281,
			INVERT : 5386,
			KEEP : 7680,
			LEQUAL : 515,
			LESS : 513,
			LINEAR : 9729,
			LINEAR_MIPMAP_LINEAR : 9987,
			LINEAR_MIPMAP_NEAREST : 9985,
			LINES : 1,
			LINE_LOOP : 2,
			LINE_STRIP : 3,
			LINE_WIDTH : 2849,
			LINK_STATUS : 35714,
			LOW_FLOAT : 36336,
			LOW_INT : 36339,
			LUMINANCE : 6409,
			LUMINANCE_ALPHA : 6410,
			MAX_COMBINED_TEXTURE_IMAGE_UNITS : 35661,
			MAX_CUBE_MAP_TEXTURE_SIZE : 34076,
			MAX_FRAGMENT_UNIFORM_VECTORS : 36349,
			MAX_RENDERBUFFER_SIZE : 34024,
			MAX_TEXTURE_IMAGE_UNITS : 34930,
			MAX_TEXTURE_SIZE : 3379,
			MAX_VARYING_VECTORS : 36348,
			MAX_VERTEX_ATTRIBS : 34921,
			MAX_VERTEX_TEXTURE_IMAGE_UNITS : 35660,
			MAX_VERTEX_UNIFORM_VECTORS : 36347,
			MAX_VIEWPORT_DIMS : 3386,
			MEDIUM_FLOAT : 36337,
			MEDIUM_INT : 36340,
			MIRRORED_REPEAT : 33648,
			NEAREST : 9728,
			NEAREST_MIPMAP_LINEAR : 9986,
			NEAREST_MIPMAP_NEAREST : 9984,
			NEVER : 512,
			NICEST : 4354,
			NONE : 0,
			NOTEQUAL : 517,
			NO_ERROR : 0,
			ONE : 1,
			ONE_MINUS_CONSTANT_ALPHA : 32772,
			ONE_MINUS_CONSTANT_COLOR : 32770,
			ONE_MINUS_DST_ALPHA : 773,
			ONE_MINUS_DST_COLOR : 775,
			ONE_MINUS_SRC_ALPHA : 771,
			ONE_MINUS_SRC_COLOR : 769,
			OUT_OF_MEMORY : 1285,
			PACK_ALIGNMENT : 3333,
			POINTS : 0,
			POLYGON_OFFSET_FACTOR : 32824,
			POLYGON_OFFSET_FILL : 32823,
			POLYGON_OFFSET_UNITS : 10752,
			RED_BITS : 3410,
			RENDERBUFFER : 36161,
			RENDERBUFFER_ALPHA_SIZE : 36179,
			RENDERBUFFER_BINDING : 36007,
			RENDERBUFFER_BLUE_SIZE : 36178,
			RENDERBUFFER_DEPTH_SIZE : 36180,
			RENDERBUFFER_GREEN_SIZE : 36177,
			RENDERBUFFER_HEIGHT : 36163,
			RENDERBUFFER_INTERNAL_FORMAT : 36164,
			RENDERBUFFER_RED_SIZE : 36176,
			RENDERBUFFER_STENCIL_SIZE : 36181,
			RENDERBUFFER_WIDTH : 36162,
			RENDERER : 7937,
			REPEAT : 10497,
			REPLACE : 7681,
			RGB : 6407,
			RGB565 : 36194,
			RGB5_A1 : 32855,
			RGBA : 6408,
			RGBA4 : 32854,
			SAMPLER_2D : 35678,
			SAMPLER_CUBE : 35680,
			SAMPLES : 32937,
			SAMPLE_ALPHA_TO_COVERAGE : 32926,
			SAMPLE_BUFFERS : 32936,
			SAMPLE_COVERAGE : 32928,
			SAMPLE_COVERAGE_INVERT : 32939,
			SAMPLE_COVERAGE_VALUE : 32938,
			SCISSOR_BOX : 3088,
			SCISSOR_TEST : 3089,
			SHADER_TYPE : 35663,
			SHADING_LANGUAGE_VERSION : 35724,
			SHORT : 5122,
			SRC_ALPHA : 770,
			SRC_ALPHA_SATURATE : 776,
			SRC_COLOR : 768,
			STATIC_DRAW : 35044,
			STENCIL_ATTACHMENT : 36128,
			STENCIL_BACK_FAIL : 34817,
			STENCIL_BACK_FUNC : 34816,
			STENCIL_BACK_PASS_DEPTH_FAIL : 34818,
			STENCIL_BACK_PASS_DEPTH_PASS : 34819,
			STENCIL_BACK_REF : 36003,
			STENCIL_BACK_VALUE_MASK : 36004,
			STENCIL_BACK_WRITEMASK : 36005,
			STENCIL_BITS : 3415,
			STENCIL_BUFFER_BIT : 1024,
			STENCIL_CLEAR_VALUE : 2961,
			STENCIL_FAIL : 2964,
			STENCIL_FUNC : 2962,
			STENCIL_INDEX : 6401,
			STENCIL_INDEX8 : 36168,
			STENCIL_PASS_DEPTH_FAIL : 2965,
			STENCIL_PASS_DEPTH_PASS : 2966,
			STENCIL_REF : 2967,
			STENCIL_TEST : 2960,
			STENCIL_VALUE_MASK : 2963,
			STENCIL_WRITEMASK : 2968,
			STREAM_DRAW : 35040,
			SUBPIXEL_BITS : 3408,
			TEXTURE : 5890,
			TEXTURE0 : 33984,
			TEXTURE1 : 33985,
			TEXTURE10 : 33994,
			TEXTURE11 : 33995,
			TEXTURE12 : 33996,
			TEXTURE13 : 33997,
			TEXTURE14 : 33998,
			TEXTURE15 : 33999,
			TEXTURE16 : 34000,
			TEXTURE17 : 34001,
			TEXTURE18 : 34002,
			TEXTURE19 : 34003,
			TEXTURE2 : 33986,
			TEXTURE20 : 34004,
			TEXTURE21 : 34005,
			TEXTURE22 : 34006,
			TEXTURE23 : 34007,
			TEXTURE24 : 34008,
			TEXTURE25 : 34009,
			TEXTURE26 : 34010,
			TEXTURE27 : 34011,
			TEXTURE28 : 34012,
			TEXTURE29 : 34013,
			TEXTURE3 : 33987,
			TEXTURE30 : 34014,
			TEXTURE31 : 34015,
			TEXTURE4 : 33988,
			TEXTURE5 : 33989,
			TEXTURE6 : 33990,
			TEXTURE7 : 33991,
			TEXTURE8 : 33992,
			TEXTURE9 : 33993,
			TEXTURE_2D : 3553,
			TEXTURE_BINDING_2D : 32873,
			TEXTURE_BINDING_CUBE_MAP : 34068,
			TEXTURE_CUBE_MAP : 34067,
			TEXTURE_CUBE_MAP_NEGATIVE_X : 34070,
			TEXTURE_CUBE_MAP_NEGATIVE_Y : 34072,
			TEXTURE_CUBE_MAP_NEGATIVE_Z : 34074,
			TEXTURE_CUBE_MAP_POSITIVE_X : 34069,
			TEXTURE_CUBE_MAP_POSITIVE_Y : 34071,
			TEXTURE_CUBE_MAP_POSITIVE_Z : 34073,
			TEXTURE_MAG_FILTER : 10240,
			TEXTURE_MIN_FILTER : 10241,
			TEXTURE_WRAP_S : 10242,
			TEXTURE_WRAP_T : 10243,
			TRIANGLES : 4,
			TRIANGLE_FAN : 6,
			TRIANGLE_STRIP : 5,
			UNPACK_ALIGNMENT : 3317,
			UNPACK_COLORSPACE_CONVERSION_WEBGL : 37443,
			UNPACK_FLIP_Y_WEBGL : 37440,
			UNPACK_PREMULTIPLY_ALPHA_WEBGL : 37441,
			UNSIGNED_BYTE : 5121,
			UNSIGNED_INT : 5125,
			UNSIGNED_SHORT : 5123,
			UNSIGNED_SHORT_4_4_4_4 : 32819,
			UNSIGNED_SHORT_5_5_5_1 : 32820,
			UNSIGNED_SHORT_5_6_5 : 33635,
			VALIDATE_STATUS : 35715,
			VENDOR : 7936,
			VERSION : 7938,
			VERTEX_ATTRIB_ARRAY_BUFFER_BINDING : 34975,
			VERTEX_ATTRIB_ARRAY_ENABLED : 34338,
			VERTEX_ATTRIB_ARRAY_NORMALIZED : 34922,
			VERTEX_ATTRIB_ARRAY_POINTER : 34373,
			VERTEX_ATTRIB_ARRAY_SIZE : 34339,
			VERTEX_ATTRIB_ARRAY_STRIDE : 34340,
			VERTEX_ATTRIB_ARRAY_TYPE : 34341,
			VERTEX_SHADER : 35633,
			VIEWPORT : 2978,
			ZERO : 0
		}
	};
	
	this.audioContextDescription = {
		properties : [
			"addEventListener",
			"audioWorklet",
			"baseLatency",
			"close",
			"createAnalyser",
			"createBiquadFilter",
			"createBuffer",
			"createBufferSource",
			"createChannelMerger",
			"createChannelSplitter",
			"createConstantSource",
			"createConvolver",
			"createDelay",
			"createDynamicsCompressor",
			"createGain",
			"createIIRFilter",
			"createMediaElementSource",
			"createMediaStreamDestination",
			"createMediaStreamSource",
			"createMediaStreamTrackSource",
			"createOscillator",
			"createPanner",
			"createPeriodicWave",
			"createScriptProcessor",
			"createStereoPanner",
			"createWaveShaper",
			"currentTime",
			"decodeAudioData",
			"destination",
			"dispatchEvent",
			"getOutputTimestamp",
			"listener",
			"onstatechange",
			"outputLatency",
			"removeEventListener",
			"resume",
			"sampleRate",
			"state",
			"suspend"
		], 
		constants : {}
	};
 }
 
// Node.js init
if (typeof require !== 'undefined') {
	module.exports = ContextDescriptor;
}
