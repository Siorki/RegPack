var RegPack = require("../regPack")
var fs = require("fs");
var assert = require("assert");

function runTests() {
	console.log("Issue #0094 - missing last block in candidate variable names : start");
	testRenamingWithNoSpare();
	console.log("Issue #0094 - missing last block in candidate variable names : done");
}


/**
 * GitHub issue #94 - reassignVariableNames() crashes after trying to read beyond array bounds
 * Crash happens when a candidate variable (usually z) is present in the last block of unused characters
 * and there are no spare variable names.
 */
function testRenamingWithNoSpare() {
	var input = '$=A=B=C=D=E=F=G=H=I=J=K=L=M=N=O=P=Q=R=S=T=U=V=W=X=Y=Z=_=a=b=c=d=e=f=g=h=i=j=k=l=m==n=o=p=q=r=s=t=u=v=w=x=y=z="ACFIMNPRSTVabcdefghiklmnopqrstuvwxy"';
	var options = {
		withMath : false,
		hash2DContext : false,
		hashWebGLContext : false,
		hashAudioContext : false,
		contextVariableName : false,
		contextType : parseInt(0),
		reassignVars : true,
		varsNotReassigned : [],
		crushGainFactor : parseFloat(1),
		crushLengthFactor : parseFloat(0),
		crushCopiesFactor : parseFloat(0),
		crushTiebreakerFactor : parseInt(1),
		wrapInSetInterval : false,
		timeVariableName : "",
		useES6 : true
	};
	
	var output = RegPack.packer.preprocessor.preprocess(input, options);

	// Expected result : variable reassignment is performed
	// However, since there are no spares, each variable is reassigned to itself
	// z has a match (being z itself) and the operation does not crash
	assert.equal(output[0].contents, input);
	
}



module.exports = runTests