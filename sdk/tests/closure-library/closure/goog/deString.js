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

/**
 * This class allows one to create a random integer, floating point number or boolean (TODO, choose random items from a list and shuffle an array)
 */

//goog.provide('deString');

//goog.require('deMath');

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

/**
* @constructor
*/
var deString = (function() {
        'use strict';

        var DE_ASSERT = function(x) {
            if (!x)
                throw new Error('Assert failed');
        };

        /**
         * Compute hash from string.
         * @param {string} str String to compute hash value for.
         * @return {deMath} Computed hash value.
         */
        var deStringHash = function(str) {
            /* \note [pyry] This hash is used in DT_GNU_HASH and is proven
            to be robust for symbol hashing. */
            /* \see http://sources.redhat.com/ml/binutils/2006-06/msg00418.html */
            /** @type {deMath} */ var hash = 5381;
            /** @type {deMath} */ var c;

            DE_ASSERT(str != undefined);
            var i = 0;
            while (i < str.length) //(c = (unsigned int)*str++) != 0)
            {
                c = str.charCodeAt(i); //trunc to 8-bit
                hash = (hash << 5) + hash + c;
                i++;
            }

            return hash;
        };

        /**
         * Checks if a JS string is either empty or undefined
         * @param {string} str
         * @return {boolean}
         */
        var deIsStringEmpty = function(str) {
            if (str === undefined || str.length == 0)
                return true;
            return false;
        };

        return {
            deStringHash: deStringHash,
            deIsStringEmpty: deIsStringEmpty
        };

    }
)();
