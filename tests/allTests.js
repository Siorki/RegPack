var testAudioContextCreate = require("./testAudioContextCreate");
var testWebGLContextCreate = require("./testWebGLContextCreate");
var testIssue0002_UnicodeSupport = require("./testIssue0002_UnicodeSupport");
var testIssue0009_HashLoopVariable = require("./testIssue0009_HashLoopVariable");
var testIssue0017_MultipleContexts = require("./testIssue0017_MultipleContexts");
var testIssue0019_setInterval = require("./testIssue0019_setInterval");

testAudioContextCreate();
testWebGLContextCreate();
testIssue0002_UnicodeSupport();
testIssue0009_HashLoopVariable();
testIssue0017_MultipleContexts();
testIssue0019_setInterval();
