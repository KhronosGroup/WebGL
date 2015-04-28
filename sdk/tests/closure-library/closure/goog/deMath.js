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

goog.provide('deMath');

/** @constructor */
var deMath = (function() {
        'use strict';

        var DE_ASSERT = function(x) {
            if (!x)
                throw new Error('Assert failed');
        };

        /**
         * @return {number}
         */
        var deUint32 = function() {};

        /**
         * @public
         * @param{number} a
         * @param{number} mn
         * @param{number} mx
         * @return {boolean}
         */
        var deInRange32 = function(a, mn, mx) {
            return (a >= mn) && (a <= mx);
        };

        return {
            deInRange32: deInRange32,
            deUint32: deUint32
        };
    }
)();
