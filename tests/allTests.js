var testAudioContextCreate = require("./testAudioContextCreate");
var testWebGLContextCreate = require("./testWebGLContextCreate");
var testStringHelper = require("./testStringHelper");
var testPackingConsistency = require("./testPackingConsistency");
var testIssue0002_UnicodeSupport = require("./testIssue0002_UnicodeSupport");
var testIssue0009_HashLoopVariable = require("./testIssue0009_HashLoopVariable");
var testIssue0017_MultipleContexts = require("./testIssue0017_MultipleContexts");
var testIssue0019_setInterval = require("./testIssue0019_setInterval");
var testIssue0030_webGLContextCreate = require("./testIssue0030_webGLContextCreate");
var testIssue0031_hyphenInRegex = require("./testIssue0031_hyphenInRegex");
var testIssue0042_patternViewer = require("./testIssue0042_patternViewer");
var testIssue0044_setIntervalArrowFunction = require("./testIssue0044_setIntervalArrowFunction");
var testIssue0045_closingBracket = require("./testIssue0045_closingBracket");
var testIssue0047_EscapeInCharClass = require("./testIssue0047_EscapeInCharClass");
var testIssue0050_unicodeSurrogate = require("./testIssue0050_unicodeSurrogate");
var testIssue0055_stringDelimiters = require("./testIssue0055_stringDelimiters");
var testIssue0056_setIntervalDefaultParams = require("./testIssue0056_setIntervalDefaultParams");
var testIssue0057_replacementInString = require("./testIssue0057_replacementInString");
var testIssue0058_numberAsLoopVariable = require("./testIssue0058_numberAsLoopVariable");
var testIssue0063_backtickFunctionParam = require("./testIssue0063_backtickFunctionParam");
var testIssue0064_utf8EncodeURI = require("./testIssue0064_utf8EncodeURI");
var testIssue0065_invalidEscapeSequence = require("./testIssue0065_invalidEscapeSequence");
var testIssue0072_setIntervalNoInitCode = require("./testIssue0072_setIntervalNoInitCode");
var testIssue0076_listVariablesInString = require("./testIssue0076_listVariablesInString");
var testIssue0082_backticksInTemplateLiterals = require("./testIssue0082_backticksInTemplateLiterals");
var testIssue0083_backslashToken = require("./testIssue0083_backslashToken");
var testIssue0085_backslashSequenceLength = require("./testIssue0085_backslashSequenceLength");

// Execute all tests in sequence
// Recommendation : put new tests at the very beginning while debugging
// then push them down the list afterwards
testStringHelper();
testPackingConsistency();
testAudioContextCreate();
testWebGLContextCreate();
testIssue0002_UnicodeSupport();
testIssue0009_HashLoopVariable();
testIssue0017_MultipleContexts();
testIssue0019_setInterval();
testIssue0030_webGLContextCreate();
testIssue0031_hyphenInRegex();
testIssue0042_patternViewer();
testIssue0044_setIntervalArrowFunction();
testIssue0045_closingBracket();
testIssue0047_EscapeInCharClass();
testIssue0050_unicodeSurrogate();
testIssue0055_stringDelimiters();
testIssue0056_setIntervalDefaultParams();
testIssue0057_replacementInString();
testIssue0058_numberAsLoopVariable();
testIssue0063_backtickFunctionParam();
testIssue0064_utf8EncodeURI();
testIssue0065_invalidEscapeSequence();
testIssue0072_setIntervalNoInitCode();
testIssue0076_listVariablesInString();
testIssue0082_backticksInTemplateLiterals();
testIssue0083_backslashToken();
testIssue0085_backslashSequenceLength();
