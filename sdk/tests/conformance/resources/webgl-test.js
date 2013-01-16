/*
** Copyright (c) 2012 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/

function webglTestLog(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
  if (document.getElementById("console")) {
    var log = document.getElementById("console");
    log.innerHTML += msg + "<br>";
  }
}

create3DContext = (function() {
/**
 * Makes a shallow copy of an object.
 * @param {!Object) src Object to copy
 * @return {!Object} The copy of src.
 */
var shallowCopyObject = function(src)
{
  var dst = {};
  for (var attr in src) {
    if (src.hasOwnProperty(attr)) {
      dst[attr] = src[attr];
    }
  }
  return dst;
};

/**
 * Checks if an attribute exists on an object case insensitive.
 * @param {!Object) obj Object to check
 * @param {string} attr Name of attribute to look for.
 * @return {string?} The name of the attribute if it exists,
 *         undefined if not.
 */
var hasAttributeCaseInsensitive = function(obj, attr)
{
  var lower = attr.toLowerCase();
  for (var key in obj) {
    if (obj.hasOwnProperty(key) && key.toLowerCase() == lower) {
      return key;
    }
  }
};


//
// create3DContext
//
// Returns the WebGLRenderingContext for any known implementation.
//
return function(canvas, opt_attributes)
{
    var attributes = shallowCopyObject(opt_attributes || {});
    if (!hasAttributeCaseInsensitive(attributes, "antialias")) {
      attributes.antialias = false;
    }
    if (!canvas)
        canvas = document.createElement("canvas");
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for (var i = 0; i < names.length; ++i) {
      try {
        context = canvas.getContext(names[i], attributes);
      } catch (e) {
      }
      if (context) {
        break;
      }
    }
    if (!context) {
        throw "Unable to fetch WebGL rendering context for Canvas";
    }
    return context;
};

}());

function createGLErrorWrapper(context, fname) {
    return function() {
        var rv = context[fname].apply(context, arguments);
        var err = context.getError();
        if (err != 0)
            throw "GL error " + err + " in " + fname;
        return rv;
    };
}

function create3DContextWithWrapperThatThrowsOnGLError(canvas, attributes) {
  var context = create3DContext(canvas, attributes);
  // Thanks to Ilmari Heikkinen for the idea on how to implement this so elegantly.
  var wrap = {};
  for (var i in context) {
    try {
      if (typeof context[i] == 'function') {
        wrap[i] = createGLErrorWrapper(context, i);
      } else {
        wrap[i] = context[i];
      }
    } catch (e) {
      webglTestLog("createContextWrapperThatThrowsOnGLError: Error accessing " + i);
    }
  }
  wrap.getError = function() {
      return context.getError();
  };
  return wrap;
}

function getGLErrorAsString(ctx, err) {
  if (err === ctx.NO_ERROR) {
    return "NO_ERROR";
  }
  for (var name in ctx) {
    if (ctx[name] === err) {
      return name;
    }
  }
  return "0x" + err.toString(16);
}

// Pass undefined for glError to test that it at least throws some error
function shouldGenerateGLError(ctx, glErrors, evalStr) {
  if (!glErrors.length) {
    glErrors = [glErrors];
  }
  var exception;
  try {
    eval(evalStr);
  } catch (e) {
    exception = e;
  }
  if (exception) {
    testFailed(evalStr + " threw exception " + exception);
  } else {
    var err = ctx.getError();
    var errStrs = [];
    for (var ii = 0; ii < glErrors.length; ++ii) {
      errStrs.push(getGLErrorAsString(ctx, glErrors[ii]));
    }
    var expected = errStrs.join(" or ");
    if (glErrors.indexOf(err) < 0) {
      testFailed(evalStr + " expected: " + expected + ". Was " + getGLErrorAsString(ctx, err) + ".");
    } else {
      var msg = (glErrors.length == 1) ? " generated expected GL error: " :
                                         " generated one of expected GL errors: ";
      testPassed(evalStr + msg + expected + ".");
    }
  }
}

/**
 * Tests that the first error GL returns is the specified error.
 * @param {!WebGLContext} gl The WebGLContext to use.
 * @param {number|!Array.<number>} glError The expected gl
 *        error. Multiple errors can be passed in using an
 *        array.
 * @param {string} opt_msg Optional additional message.
 */
function glErrorShouldBe(gl, glErrors, opt_msg) {
  if (!glErrors.length) {
    glErrors = [glErrors];
  }
  opt_msg = opt_msg || "";
  var err = gl.getError();
  var ndx = glErrors.indexOf(err);
  var errStrs = [];
  for (var ii = 0; ii < glErrors.length; ++ii) {
    errStrs.push(getGLErrorAsString(gl, glErrors[ii]));
  }
  var expected = errStrs.join(" or ");
  if (ndx < 0) {
    var msg = "getError expected" + ((glErrors.length > 1) ? " one of: " : ": ");
    testFailed(msg + expected +  ". Was " + getGLErrorAsString(gl, err) + " : " + opt_msg);
  } else {
    var msg = "getError was " + ((glErrors.length > 1) ? "one of: " : "expected value: ");
    testPassed(msg + expected + " : " + opt_msg);
  }
};

//
// createProgram
//
// Create and return a program object, attaching each of the given shaders.
//
// If attribs are given, bind an attrib with that name at that index.
//
function createProgram(gl, vshaders, fshaders, attribs)
{
  if (typeof(vshaders) == "string")
    vshaders = [vshaders];
  if (typeof(fshaders) == "string")
    fshaders = [fshaders];

  var shaders = [];
  var i;

  for (i = 0; i < vshaders.length; ++i) {
    var shader = loadShader(gl, vshaders[i], gl.VERTEX_SHADER);
    if (!shader)
      return null;
    shaders.push(shader);
  }

  for (i = 0; i < fshaders.length; ++i) {
    var shader = loadShader(gl, fshaders[i], gl.FRAGMENT_SHADER);
    if (!shader)
      return null;
    shaders.push(shader);
  }

  var prog = gl.createProgram();
  for (i = 0; i < shaders.length; ++i) {
    gl.attachShader(prog, shaders[i]);
  }

  if (attribs) {
    for (var i = 0; i < attribs.length; ++i) {
      gl.bindAttribLocation(prog, i, attribs[i]);
    }
  }

  gl.linkProgram(prog);

  // Check the link status
  var linked = gl.getProgramParameter(prog, gl.LINK_STATUS);
  if (!linked) {
    // something went wrong with the link
    var error = gl.getProgramInfoLog(prog);
    webglTestLog("Error in program linking:" + error);

    gl.deleteProgram(prog);
    for (i = 0; i < shaders.length; ++i)
      gl.deleteShader(shaders[i]);
    return null;
  }

  return prog;
}

//
// initWebGL
//
// Initialize the Canvas element with the passed name as a WebGL object and return the
// WebGLRenderingContext.
//
// Set the clear color to [0,0,0,1] and the depth to 1.
// Enable depth testing and blending with a blend func of (SRC_ALPHA, ONE_MINUS_SRC_ALPHA)
//
function initWebGL(canvasName, contextAttribs)
{
    var canvas = document.getElementById(canvasName);
    var gl = create3DContext(canvas, contextAttribs);
    if (!gl) {
        alert("No WebGL context found");
        return null;
    }

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return gl;
}

//
// setupProgram
//
// Load shaders with the passed names and create a program with them.
//
// For each string in the passed attribs array, bind an attrib with that name at that index.
// Once the attribs are bound, link the program and then use it.
function setupProgram(gl, vshader, fshader, attribs)
{
  // Create the program object
  var program = createProgram(gl, vshader, fshader, attribs);
  if (!program)
      return null;

  gl.useProgram(program);
  return program;
}


//
// getShaderSource
//
// Load the source from the passed shader file.
//
function getShaderSource(file)
{
    var xhr = new XMLHttpRequest();
    xhr.open("GET", file, false);
    xhr.send();
    return xhr.responseText;
}


//
// loadShader
//
// 'shader' is either the id of a <script> element containing the shader source
// string, the shader string itself,  or the URL of a file containing the shader
// source. Load this shader and return the WebGLShader object corresponding to
// it.
//
function loadShader(ctx, shaderId, shaderType, isFile)
{
    var shaderSource = "";

    if (isFile)
        shaderSource = getShaderSource(shaderId);
    else {
        var shaderScript = document.getElementById(shaderId);
        if (!shaderScript) {
            shaderSource = shaderId;
        } else {
            if (shaderScript.type == "x-shader/x-vertex") {
                shaderType = ctx.VERTEX_SHADER;
            } else if (shaderScript.type == "x-shader/x-fragment") {
                shaderType = ctx.FRAGMENT_SHADER;
            } else if (shaderType != ctx.VERTEX_SHADER && shaderType != ctx.FRAGMENT_SHADER) {
                webglTestLog("*** Error: unknown shader type");
                return null;
            }

            shaderSource = shaderScript.text;
        }
    }

    // Create the shader object
    var shader = ctx.createShader(shaderType);
    if (shader == null) {
        webglTestLog("*** Error: unable to create shader '"+shaderId+"'");
        return null;
    }

    // Load the shader source
    ctx.shaderSource(shader, shaderSource);

    // Compile the shader
    ctx.compileShader(shader);

    // Check the compile status
    var compiled = ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);
    if (!compiled) {
        // Something went wrong during compilation; get the error
        var error = ctx.getShaderInfoLog(shader);
        webglTestLog("*** Error compiling shader '"+shader+"':"+error);
        ctx.deleteShader(shader);
        return null;
    }

    return shader;
}

function loadShaderFromFile(ctx, file, type)
{
    return loadShader(ctx, file, type, true);
}

function loadShaderFromScript(ctx, script)
{
    return loadShader(ctx, script, 0, false);
}

function loadStandardProgram(context) {
    var program = context.createProgram();
    context.attachShader(program, loadStandardVertexShader(context));
    context.attachShader(program, loadStandardFragmentShader(context));
    context.linkProgram(program);
    return program;
}

function loadProgram(context, vertexShaderPath, fragmentShaderPath, isFile) {
    isFile = (isFile === undefined) ? true : isFile;
    var program = context.createProgram();
    context.attachShader(program, loadShader(context, vertexShaderPath, context.VERTEX_SHADER, isFile));
    context.attachShader(program, loadShader(context, fragmentShaderPath, context.FRAGMENT_SHADER, isFile));
    context.linkProgram(program);
    return program;
}

var getBasePathForResources = function() {
  var expectedBase = "webgl-test.js";
  var scripts = document.getElementsByTagName('script');
  for (var script, i = 0; script = scripts[i]; i++) {
    var src = script.src;
    var l = src.length;
    if (src.substr(l - expectedBase.length) == expectedBase) {
      return src.substr(0, l - expectedBase.length);
    }
  }
  throw 'oops';
};


function loadStandardVertexShader(context) {
    return loadShader(
        context,
        getBasePathForResources() + "vertexShader.vert",
        context.VERTEX_SHADER,
        true);
}

function loadStandardFragmentShader(context) {
    return loadShader(
        context,
        getBasePathForResources() + "fragmentShader.frag",
        context.FRAGMENT_SHADER,
        true);
}


