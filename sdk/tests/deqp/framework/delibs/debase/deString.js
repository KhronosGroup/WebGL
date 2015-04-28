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
'use strict';
goog.provide('framework.delibs.debase.deString');
goog.require('framework.delibs.debase.deMath');

goog.scope(function() {

var deString = framework.delibs.debase.deString;
var deMath = framework.delibs.debase.deMath;

    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    /**
     * Compute hash from string.
     * @param {?string} str String to compute hash value for.
     * @return {number} Computed hash value.
     */
    deString.deStringHash = function(str) {
        /* \note [pyry] This hash is used in DT_GNU_HASH and is proven
        to be robust for symbol hashing. */
        /* \see http://sources.redhat.com/ml/binutils/2006-06/msg00418.html */
        /** @type {number} */ var hash = 5381;
        /** @type {number} */ var c;

        DE_ASSERT(str != undefined);
        if (str !== null) {
            var i = 0;
            while (i < str.length) { //(c = (unsigned int)*str++) != 0)
                c = str.charCodeAt(i); //trunc to 8-bit
                hash = (hash << 5) + hash + c;
                i++;
            }
        }
        return hash;
    };

    /**
     * Checks if a JS string is either empty or undefined
     * @param {string} str
     * @return {boolean}
     */
    deString.deIsStringEmpty = function(str) {
        if (str === undefined || str.length == 0)
            return true;
        return false;
    };

});
