/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @fileoverview This file contains functions every webgl program will need
 * a version of..
 */

WebGLUtils = function() {

var requestAnimationFrameImpl_;
var getAnimationTimeImpl_;

/**
 * Creates the HTLM for a failure message
 * @param {string} canvasContainerId id of container of th
 *        canvas.
 * @return {string} The html.
 */
var makeFailHTML = function(msg) {
  return '' +
    '<table style="background-color: #8CE; width: 100%; height: 100%;"><tr>' +
    '<td align="center">' +
    '<div style="display: table-cell; vertical-align: middle;">' +
    '<div style="">' + msg + '</div>' +
    '</div>' +
    '</td></tr></table>';
};

/**
 * Mesasge for getting a webgl browser
 * @type {string}
 */
var GET_A_WEBGL_BROWSER = '' +
  'This page requires a browser that supports WebGL.<br/>' +
  '<a href="http://get.webgl.org">Click here to upgrade your browser.</a>';

/**
 * Mesasge for need better hardware
 * @type {string}
 */
var NEED_HARDWARE = '' +
  "It doesn't appear your computer can support WebGL.<br/>" +
  '<a href="http://get.webgl.org">Click here for more information.</a>';

/**
 * Creates a webgl context and fils out teh
 * @param {string} canvasContainerId id of container of th
 *        canvas.
 */
var setupWebGL = function(canvas, opt_attribs, opt_onError) {
  function handleCreationError() {
    // TODO(gman): Set error based on why creation failed.
  };

  // opt_canvas.addEventHandler('webglcontextcreationerror', handleCreationError);
  var context = create3DContext(canvas, opt_attribs);
  if (!context) {
    var container = canvas.parentNode;
    if (container) {
      // TODO(gman): fix to official way to detect that it's the user's machine, not the browser.
      var browserStrings = navigator.userAgent.match(/(\w+\/.*? )/g);
      var browsers = {};
      try {
        for (var b = 0; b < browserStrings.length; ++b) {
          var parts = browserStrings[b].match(/(\w+)/g);
          var bb = [];
          for (var ii = 1; ii < parts.length; ++ii) {
            bb.push(parseInt(parts[ii]));
          }
          browsers[parts[0]] = bb;
        }
      } catch (e) {
      }
      if (browsers.Chrome &&
          (browsers.Chrome[0] > 7 ||
           (browsers.Chrome[0] == 7 && browsers.Chrome[1] > 0) ||
           (browsers.Chrome[0] == 7 && browsers.Chrome[1] == 0 && browsers.Chrome[2] >= 521))) {
        container.innerHTML = makeFailHTML(
            NEED_HARDWARE);
      } else {
        container.innerHTML = makeFailHTML(
            GET_A_WEBGL_BROWSER);
      }
    }
  }
  return context;
};

/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context
 *     from. If one is not passed in one will be created.
 * @return {!WebGLContext} The created context.
 */
var create3DContext = function(canvas, opt_attribs) {
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii], opt_attribs);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  return context;
}

var animationTime = function() {
  if (!getAnimationTimeImpl_) {
    getAnimationTimeImpl_ = function() {
      var attribNames = [
        "animationTime",
        "webkitAnimationTime",
        "mozAnimationTime",
        "operaAnimationTime",
        "msAnimationTime"
      ];
      for (var ii = 0; ii < attribNames.length; ++ii) {
        var name = attribNames[ii];
        if (window[name]) {
          return function() {
            return window[name];
          };
        }
      }
      return function() {
        return (new Date()).getTime();
      }
    }();
  }
  return getAnimationTimeImpl_();
};

/**
 * Provides requestAnimationFrame in a cross browser
 * way. Your callback will be passed an object with
 * a timeStamp. In other words:
 *
 * WebGLUtils.requestAnimationFrame(render);
 *
 * function render(obj) {
 *   var currentTime = obj.timeStamp;
 * }
 *
 * @param {!Element} element Element to request an animation frame for.
 * @param {function(RequestAnimationEvent): void} callback. Callback that will
 *        be called when a frame is ready.
 */
var requestAnimationFrame = function(element, callback) {
  if (!requestAnimationFrameImpl_) {
    requestAnimationFrameImpl_ = function() {
      var objects = [element, window];
      var functionNames = [
        "requestAnimationFrame",
        "webkitRequestAnimationFrame",
        "mozRequestAnimationFrame",
        "operaRequestAnimationFrame",
        "requestAnimationFrame"
      ];
      var functions = [
        function (name) {
          return function(element, callback) {
            element[name].call(element, callback);
          };
        },
        function (name) {
          return function(element, callback) {
            window[name].call(window, callback);
          };
        }
      ];
      for (var ii = 0; ii < objects.length; ++ii) {
        var obj = objects[ii];
        for (var jj = 0; jj < functionNames.length; ++jj) {
          var functionName = functionNames[jj];
          if (obj[functionName]) {
            return functions[ii](functionName);
          }
        }
      }
      return function(element, callback) {
           window.setTimeout(callback, 1000 / 70);
        };
    }();
  }

  requestAnimationFrameImpl_(element, callback)
};

return {
  animationTime: animationTime,
  create3DContext: create3DContext,
  requestAnimationFrame: requestAnimationFrame,
  setupWebGL: setupWebGL,
};
}();

