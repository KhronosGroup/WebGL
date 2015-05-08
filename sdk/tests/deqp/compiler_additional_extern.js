
/**
 * @param {?string} msg
 */
function description(msg){};

function finishTest(){};

/**
 * @param {?string} name
 */
function setCurrentTestName(name){};

/**
 * @param {string} msg
 */
function bufferedLogToConsole(msg){};

/**
 * @constructor
 * @param {string} message The error message.
 */
var TestFailedException = function (message) {};

/**
 * Shows a message in case expression test fails.
 * @param {boolean} exp
 * @param {string} message
 */
function checkMessage(exp, message) {};

/**
 * @param {boolean} assertion
 * @param {?string} msg
 * @param {boolean} verbose
 * @param {boolean} exthrow
 */
function assertMsgOptions(assertion, msg, verbose, exthrow) {};

/**
 * @param {string} msg
 */
function debug(msg){};

/**
 * @param {string} msg
 * @param {boolean} exthrow
 */
function testFailedOptions(msg, exthrow){};

/**
 * @param {string} msg
 * @param {boolean} exthrow
 */
function testPassedOptions(msg, exthrow){};

/**
 * @param {string} msg
 */
function testFailed(msg){};

/**
 * @param {string} msg
 */
function testPassed(msg){};

/** @type {WebGL2RenderingContext} */ var gl;
/** @type {HTMLElement} */ var canvas;

/** @type {{create3DContext: function(string):WebGL2RenderingContext,
            loadTextFileAsync: function(string, function(boolean, string)),
            glEnumToString: function(WebGL2RenderingContext, number):string }} */ var WebGLTestUtils;
