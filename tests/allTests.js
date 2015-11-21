var testAudioContextCreate = require("./testAudioContextCreate");
var testIssue0002_UnicodeSupport = require("./testIssue0002_UnicodeSupport");
var testIssue0009_HashLoopVariable = require("./testIssue0009_HashLoopVariable");
var testIssue0017_MultipleContexts = require("./testIssue0017_MultipleContexts");
var testWebGLContextCreate = require("./testWebGLContextCreate");

testAudioContextCreate();
testIssue0002_UnicodeSupport();
testIssue0009_HashLoopVariable();
testIssue0017_MultipleContexts();
testWebGLContextCreate();
