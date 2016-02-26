var testAudioContextCreate = require("./testAudioContextCreate");
var testWebGLContextCreate = require("./testWebGLContextCreate");
var testIssue0002_UnicodeSupport = require("./testIssue0002_UnicodeSupport");
var testIssue0009_HashLoopVariable = require("./testIssue0009_HashLoopVariable");
var testIssue0017_MultipleContexts = require("./testIssue0017_MultipleContexts");
var testIssue0019_setInterval = require("./testIssue0019_setInterval");
var testIssue0030_webGLContextCreate = require("./testIssue0030_webGLContextCreate");
var testIssue0031_hyphenInRegex = require("./testIssue0031_hyphenInRegex");
var testIssue0042_patternViewer = require("./testIssue0042_patternViewer");
var testIssue0045_closingBracket = require("./testIssue0045_closingBracket");

// Execute all tests in sequence
// Recommendation : put new tests at the very beginning while debugging
// then push them down the list afterwards
testAudioContextCreate();
testWebGLContextCreate();
testIssue0002_UnicodeSupport();
testIssue0009_HashLoopVariable();
testIssue0017_MultipleContexts();
testIssue0019_setInterval();
testIssue0030_webGLContextCreate();
testIssue0031_hyphenInRegex();
testIssue0042_patternViewer();
testIssue0045_closingBracket();
