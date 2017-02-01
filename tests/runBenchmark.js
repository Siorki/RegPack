var regPack = require("../regPack")
var fs = require('fs');


var sources = [
	{ fileName:"2010 - Christmas Tree.js", options:{contextVariableName : '' } },
	{ fileName:"2012 - A rose is a rose.js", options:{contextVariableName : 'a', wrapInSetInterval : true, timeVariableName : 'T' } },
	{ fileName:"2012 - Autumn Evening.js", options:{contextVariableName : 'a', wrapInSetInterval : true } },
	{ fileName:"2012 - Mine(Love)craft.js", options:{contextVariableName : 'a', wrapInSetInterval : true, timeVariableName : 'T' } },
	{ fileName:"2013 - 3D City tour.js", options:{contextVariableName : 'a' } },
	{ fileName:"2013 - Color Factors.js", options:{contextVariableName : 'a', wrapInSetInterval : true  } },
	{ fileName:"2013 - Comanche.js", options:{contextVariableName : 'a', wrapInSetInterval : true  } },
	{ fileName:"2013 - Furbee.js", options:{contextVariableName : 'a' } },
	{ fileName:"2013 - Pointillism.js", options:{contextVariableName : 'a', wrapInSetInterval : true, timeVariableName : 'J' } },
	{ fileName:"2013 - Space Time Fracture.js", options:{contextVariableName : 'a' } },
	{ fileName:"2013 - StrangeCrystals II.js", options:{contextVariableName : 'a', wrapInSetInterval : true, timeVariableName : 'H' } },
	{ fileName:"2013 - Synth Sphere.js", options:{contextVariableName : 'a', wrapInSetInterval : true } },
	{ fileName:"2013 - Winter Wrap up.js", options:{contextVariableName : 'a' } },
	{ fileName:"2014 - Dragon Drop.js", options:{} },
	{ fileName:"2014 - Flappy Dragon Classic.js", options:{} },
	{ fileName:"2014 - Highway at night.js", options:{ wrapInSetInterval : true, timeVariableName : 'I' } },
	{ fileName:"2014 - Minecraft.js", options:{ wrapInSetInterval : true } },
	{ fileName:"2015 - Defender.js", options:{ varsNotReassigned : 'abcV'} },
	{ fileName:"2015 - Mysterious Monorail.js", options:{} },
	{ fileName:"2015 - Impossible road.js", options:{} },
	{ fileName:"2016 - Romanesco 2.0.js", options:{ contextVariableName : 'g', contextType : 1} },
	{ fileName:"2016 - Voxeling.js", options:{ wrapInSetInterval : true, timeVariableName : 'e', varsNotReassigned : 'abc'} },
	{ fileName:"2016 - Firewatch.js", options:{ wrapInSetInterval : true, timeVariableName : 's'} },
	{ fileName:"jscrush.js", options: {contextVariableName : 'a', varsNotReassigned : 'b_' } }
	
];


var defaultOptions = {
	withMath : false,
	hash2DContext : true,
	hashWebGLContext : true,
	hashAudioContext : true,
	contextVariableName : 'c',
	contextType : parseInt(0),
	reassignVars : true,
	varsNotReassigned : 'abc',
	crushGainFactor : parseFloat(1),
	crushLengthFactor : parseFloat(0),
	crushCopiesFactor : parseFloat(0),
	crushTiebreakerFactor : parseInt(1),
	wrapInSetInterval : false,
	timeVariableName : ""
};


sources.forEach (function(referenceItem) {
	var options = {};
	for (key in defaultOptions) {
		options[key] = defaultOptions[key];
	}
	for (key in referenceItem.options)
	{
		options[key] = referenceItem.options[key];
	}

	var inputData = fs.readFileSync("../Benchmark/"+referenceItem.fileName, { encoding:"utf8"});
	var bestVal = regPack.cmdRegPack(inputData, options);
	referenceItem.finalSize = regPack.packer.getByteLength(bestVal);
});

console.log(" ");
console.log("BENCHMARK RESULTS :");
console.log("-----------------");

sources.forEach (function(referenceItem) {
	console.log(referenceItem.fileName+" : " + referenceItem.finalSize);
});
