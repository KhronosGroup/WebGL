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

define(function() {
'use strict';

var DE_ASSERT = function(x) {
    if (!x)
        throw new Error('Assert failed');
};

/* Dummy type */
var deUint32 = function() {};

var deInRange32 = function(a, mn, mx) {
    return (a >= mn) && (a <= mx);
};

var deInBounds32 = function(a, mn, mx) {
    return (a >= mn) && (a < mx);
};

/**
 * Check if a value is a power-of-two.
 * @param {number} a Input value.
 * @return {boolean} return True if input is a power-of-two value, false otherwise.
 * (Also returns true for zero).
 */
var deIsPowerOfTwo32 = function(a)
{
    return ((a & (a - 1)) == 0);
};

/**
 * Align an integer to given power-of-two size.
 * @param {number} val The number to align.
 * @param {number} align The size to align to.
 * @return {number} The aligned value
 */
var deAlign32 = function(val, align) {
    DE_ASSERT(deIsPowerOfTwo32(align));
    return ((val + align - 1) & ~(align - 1)) & 0xFFFFFFFF; //0xFFFFFFFF make sure it returns a 32 bit calculation in 64 bit browsers.
};

/**
 * Compute the bit population count of an integer.
 * @param {number} a
 * @return {number} The number of one bits in
 */
var dePop32 = function(a) {
    /** @type {deUint32} */ var mask0 = 0x55555555; /* 1-bit values. */
    /** @type {deUint32} */ var mask1 = 0x33333333; /* 2-bit values. */
    /** @type {deUint32} */ var mask2 = 0x0f0f0f0f; /* 4-bit values. */
    /** @type {deUint32} */ var mask3 = 0x00ff00ff; /* 8-bit values. */
    /** @type {deUint32} */ var mask4 = 0x0000ffff; /* 16-bit values. */
    /** @type {deUint32} */ var t = a & 0xFFFFFFFF; /* Crop to 32-bit value */
    t = (t & mask0) + ((t >> 1) & mask0);
    t = (t & mask1) + ((t >> 2) & mask1);
    t = (t & mask2) + ((t >> 4) & mask2);
    t = (t & mask3) + ((t >> 8) & mask3);
    t = (t & mask4) + (t >> 16);
    return t;
};

var clamp = function(val, min, max) {
    return Math.max(min, Math.min(val, max));
};

var imod = function(a, b) {
    var m = a % b;
    return m < 0 ? m + b : m;
};

var mirror = function(a) {
    return a >= 0 ? a : -(1 + a);
};

/**
 * @param {Array.<number>} a Source array
 * @param {Array.<number>} indices
 * @return {Array.<number>} Swizzled array
 */
var swizzle = function(a, indices) {
    if (!indices.length)
        throw new Error('Argument must be an array');
    var dst = [];
    for (var i = 0; i < indices.length; i++)
        dst.push(a[indices[i]]);
    return dst;
};

/**
 * Multiply two vectors, element by element
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>} Result array
 */

var multiply = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] * b[i]);
    return dst;
};

/**
 * Add two vectors, element by element
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>} Result array
 */

var add = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] + b[i]);
    return dst;
};

/**
 * Subtract two vectors, element by element
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>} Result array
 */

var subtract = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] - b[i]);
    return dst;
};

/**
 * Calculate absolute difference between two vectors
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>} abs(diff(a - b))
 */
var absDiff = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(Math.abs(a[i] - b[i]));
    return dst;
};

/**
 * Is a <= b (element by element)?
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<boolean>} Result array of booleans
 */
var lessThanEqual = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] <= b[i]);
    return dst;
};

/**
 * Are all values in the array true?
 * @param {Array.<number>} a
 * @return {boolean}
 */

var boolAll = function(a) {
    for (var i = 0; i < a.length; i++)
        if (a[i] == false)
            return false;
    return true;
};

/**
 * max(a, b) element by element
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>}
 */
var max = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(Math.max(a[i], b[i]));
    return dst;
};

/**
 * min(a, b) element by element
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>}
 */
var min = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(Math.min(a[i], b[i]));
    return dst;
};

// Nearest-even rounding in case of tie (fractional part 0.5), otherwise ordinary rounding.
var rint = function(a) {
    var floorVal = Math.floor(a);
    var fracVal = a - floorVal;

    if (fracVal != 0.5)
        return Math.round(a); // Ordinary case.

    var roundUp = (floorVal % 2) != 0;

    return floorVal + (roundUp ? 1 : 0);
};

/** deMathHash
 * @param {number} a
 * @return {number}
 */

var deMathHash = function(a) {
    var key = a;
    key = (key ^ 61) ^ (key >> 16);
    key = key + (key << 3);
    key = key ^ (key >> 4);
    key = key * 0x27d4eb2d; /* prime/odd constant */
    key = key ^ (key >> 15);
    return key;
};

    return {
        deInRange32: deInRange32,
        deInBounds32: deInBounds32,
        deAlign32: deAlign32,
        dePop32: dePop32,
        deIsPowerOfTwo32: deIsPowerOfTwo32,
        clamp: clamp,
        imod: imod,
        mirror: mirror,
        swizzle: swizzle,
        multiply: multiply,
        add: add,
        subtract: subtract,
        absDiff: absDiff,
        lessThanEqual: lessThanEqual,
        boolAll: boolAll,
        max: max,
        min: min,
        rint: rint,
        deMathHash: deMathHash
    };
});

