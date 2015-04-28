/*-------------------------------------------------------------------------
 * drawElements Quality Program OpenGL ES Utilities
 * ------------------------------------------------
 *
 * Copyright 2014 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

'use strict';
goog.provide('framework.common.tcuPixelFormat');

goog.scope(function() {

var tcuPixelFormat = framework.common.tcuPixelFormat;

/**
 * @constructor
 */
tcuPixelFormat.PixelFormat = function(r, g, b, a) {
    this.redBits = r || 0;
    this.greenBits = g || 0;
    this.blueBits = b || 0;
    this.alphaBits = a || 0;
};

tcuPixelFormat.PixelFormat.prototype.equals = function(r, g, b, a) {
    return this.redBits === r &&
            this.greenBits === g &&
            this.blueBits === b &&
            this.alphaBits === a;
};

});
