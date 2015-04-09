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
 * @param {number} a
 * @return {number}
 */
var deFloatFrac = function(a) { return a - Math.floor(a); };

/**
 * @param {number} a
 * @return {number}
 */
var deCeilFloatToInt32 = function(a) {
    return new Uint32Array([Math.ceil(a)])[0];
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

/**
 * Find intersection of two rectangles
 * @param {Array<number>} a Array [x, y, width, height]
 * @param {Array<number>} b Array [x, y, width, height]
 * @return {Array<number>}
 */
var intersect = function(a, b) {
    if (a.length != 4)
        throw new Error('Array "a" must have length 4 but has length: ' + a.length);
    if (b.length != 4)
        throw new Error('Array "b" must have length 4 but has length: ' + b.length);
    var x0 = Math.max(a[0], b[0]);
    var y0 = Math.max(a[1], b[1]);
    var x1 = Math.min(a[0] + a[2], b[0] + b[2]);
    var y1 = Math.min(a[1] + a[3], b[1] + b[3]);
    var w = Math.max(0, x1 - x0);
    var h = Math.max(0, y1 - y0);

    return [x0, y0, w, h];
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

/**
 * Converts a byte array to a number
 * @param {Uint8Array} array
 * @return {number}
 */
var arrayToNumber = function(array) {
    /** @type {number} */ var result = 0;

    for (var ndx = 0; ndx < array.length; ndx++)
    {
        result += array[ndx] * Math.pow(256, ndx);
    }

    return result;
};

/**
 * Fills a byte array with a number
 * @param {Uint8Array} array Output array (already resized)
 * @param {number} number
 */
var numberToArray = function(array, number) {
    for (var byteNdx = 0; byteNdx < array.length; byteNdx++)
    {
        /** @type {number} */ var acumzndx = !byteNdx ? number : Math.floor(number / Math.pow(256, byteNdx));
        array[byteNdx] = acumzndx & 0xFF;
    }
};

/**
 * Obtains the bit fragment from an array in a number
 * @param {Uint8Array} array
 * @param {number} firstNdx
 * @param {number} lastNdx
 * @return {number}
 */
var getBitRange = function(array, firstNdx, lastNdx) {
    /** @type {number} */ var bitSize = lastNdx - firstNdx;
    /** @type {number} */ var byteSize = Math.floor(bitSize / 8) + ((bitSize % 8) > 0 ? 1 : 0);

    /** @type {ArrayBuffer} */ var buffer = new ArrayBuffer(byteSize);
    /** @type {Uint8Array} */ var outArray = new Uint8Array(buffer);

    for (var bitNdx = firstNdx; bitNdx < lastNdx; bitNdx++)
    {
        /** @type {number} */ var sourceByte = Math.floor(bitNdx / 8);
        /** @type {number} */ var sourceBit = Math.floor(bitNdx % 8);

        /** @type {number} */ var destByte = Math.floor((bitNdx - firstNdx) / 8);
        /** @type {number} */ var destBit = Math.floor((bitNdx - firstNdx) % 8);

        /** @type {number} */ var sourceBitValue = (array[sourceByte] & Math.pow(2, sourceBit)) != 0 ? 1 : 0;

        outArray[destByte] = outArray[destByte] | (Math.pow(2, destBit) * sourceBitValue);
    }

    return arrayToNumber(outArray);
};

//Bit operations with the help of arrays

var BinaryOp = {
    AND: 0,
    OR: 1
};

/**
 * Performs a normal (native) binary operation
 * @param {number} valueA First operand
 * @param {number} valueB Second operand
 * @param {BinaryOp} operation The desired operation to perform
 * @return {number}
 */
var doNativeBinaryOp = function(valueA, valueB, operation) {
    switch (operation)
    {
        case BinaryOp.AND:
            return valueA & valueB;
        case BinaryOp.OR:
            return valueA | valueB;
    }
};

/**
 * Performs a binary operation between two operands
 * with the help of arrays to avoid losing the internal binary representation.
 * If the operation is safe to perform in a native way, it will do that.
 * @param {number} valueA First operand
 * @param {number} valueB Second operand
 * @param {BinaryOp} binaryOp The desired operation to perform
 * @return {number}
 */
var binaryOp = function(valueA, valueB, binaryOp) {
    /** @type {number} */ var valueABitSize = Math.floor(Math.log2(valueA) + 1);
    /** @type {number} */ var valueBBitSize = Math.floor(Math.log2(valueB) + 1);
    /** @type {number} */ var bitsSize = Math.max(valueABitSize, valueBBitSize);

    if (bitsSize <= 32)
        return doNativeBinaryOp(valueA, valueB, binaryOp);

    /** @type {number} */ var valueAByteSize = Math.floor(valueABitSize / 8) + ((valueABitSize % 8) > 0 ? 1 : 0);
    /** @type {number} */ var valueBByteSize = Math.floor(valueBBitSize / 8) + ((valueBBitSize % 8) > 0 ? 1 : 0);
    /** @type {number} */ var byteSize = Math.floor(bitsSize / 8) + ((bitsSize % 8) > 0 ? 1 : 0);

    /** @type {ArrayBuffer} */ var valueABuffer = new ArrayBuffer(valueAByteSize);
    /** @type {ArrayBuffer} */ var valueBBuffer = new ArrayBuffer(valueBByteSize);
    /** @type {ArrayBuffer} */ var buffer = new ArrayBuffer(byteSize);

    /** @type {Uint8Array} */ var inArrayA = new Uint8Array(valueABuffer);
    /** @type {Uint8Array} */ var inArrayB = new Uint8Array(valueBBuffer);
    /** @type {Uint8Array} */ var outArray = new Uint8Array(buffer);

    numberToArray(inArrayA, valueA);
    numberToArray(inArrayB, valueB);

    /** @type {Uint8Array} */ var largestArray = inArrayA.length > inArrayB.length ? inArrayA : inArrayB;

    /** @type {number} */ var minLength = Math.min(inArrayA.length, inArrayB.length);

    for (var byteNdx = 0; byteNdx < minLength; byteNdx++)
    {
        outArray[byteNdx] = doNativeBinaryOp(inArrayA[byteNdx], inArrayB[byteNdx], binaryOp);
    }

    while (byteNdx < byteSize)
    {
        outArray[byteNdx] = largestArray[byteNdx];
        byteNdx++;
    }

    return arrayToNumber(outArray);
};

/**
 * Performs a binary NOT operation in an operand
 * with the help of arrays.
 * @param {number} value Operand
 * @return {number}
 */
var binaryNot = function(value) {
    /** @type {number} */ var bitsSize = Math.floor(Math.log2(value) + 1);

    //This is not reliable. But left here commented as a warning.
    /*if (bitsSize <= 32)
     *      return ~value;*/

    /** @type {number} */ var byteSize = Math.floor(bitsSize / 8) + ((bitsSize % 8) > 0 ? 1 : 0);

    /** @type {ArrayBuffer} */ var inBuffer = new ArrayBuffer(byteSize);
    /** @type {Uint8Array} */ var inArray = new Uint8Array(inBuffer);

    /** @type {ArrayBuffer} */ var buffer = new ArrayBuffer(byteSize);
    /** @type {Uint8Array} */ var outArray = new Uint8Array(buffer);

    numberToArray(inArray, value);

    for (var byteNdx = 0; byteNdx < byteSize; byteNdx++)
    {
        outArray[byteNdx] = ~inArray[byteNdx];
    }

    return arrayToNumber(outArray);
};

/**
 * Shifts the given value 'steps' bits to the left. Replaces << operator
 * This function should be used if the expected value will be wider than 32-bits.
 * If safe, it will perform a normal << operation
 * @param {number} value
 * @param {number} steps
 * @return {number}
 */
var shiftLeft = function(value, steps)
{
    /** @type {number} */ var totalBitsRequired = Math.floor(Math.log2(value) + 1) + steps;

    if (totalBitsRequired < 32)
        return value << steps;

    totalBitsRequired = totalBitsRequired > 64 ? 64 : totalBitsRequired; //No more than 64-bits

    /** @type {number} */ var totalBytesRequired = Math.floor(totalBitsRequired / 8) + ((totalBitsRequired % 8) > 0 ? 1 : 0);

    /** @type {ArrayBuffer} */ var inBuffer = new ArrayBuffer(totalBytesRequired);
    /** @type {Uint8Array} */ var inArray = new Uint8Array(inBuffer);

    /** @type {ArrayBuffer} */ var buffer = new ArrayBuffer(totalBytesRequired);
    /** @type {Uint8Array} */ var outArray = new Uint8Array(buffer);

    numberToArray(inArray, value);

    for (var bitNdx = 0; bitNdx < totalBitsRequired; bitNdx++)
    {
        /** @type {number} */ var sourceByte = Math.floor(bitNdx / 8);
        /** @type {number} */ var sourceBit = Math.floor(bitNdx % 8);
        /** @type {number} */ var newbitNdx = bitNdx + steps;
        /** @type {number} */ var correspondingByte = Math.floor(newbitNdx / 8);
        /** @type {number} */ var correspondingBit = Math.floor(newbitNdx % 8);
        /** @type {number} */ var bitValue = (inArray[sourceByte] & Math.pow(2, sourceBit)) != 0 ? 1 : 0;
        outArray[correspondingByte] = outArray[correspondingByte] | (Math.pow(2, correspondingBit) * bitValue);
    }

    return arrayToNumber(outArray);
};

/**
 * Shifts the given value 'steps' bits to the right. Replaces >> operator
 * This function should be used if the expected value will be wider than 32-bits
 * If safe, it will perform a normal >> operation
 * @param {number} value
 * @param {number} steps
 * @return {number}
 */
var shiftRight = function(value, steps)
{
    /** @type {number} */ var totalBitsRequired = Math.floor(Math.log2(value) + 1); //additional bits not needed (will be 0) + steps;

    if (totalBitsRequired < 32)
        return value >> steps;

    /** @type {number} */ var totalBytesRequired = Math.floor(totalBitsRequired / 8) + ((totalBitsRequired % 8) > 0 ? 1 : 0);

    /** @type {ArrayBuffer} */ var inBuffer = new ArrayBuffer(totalBytesRequired);
    /** @type {Uint8Array} */ var inArray = new Uint8Array(inBuffer);

    /** @type {ArrayBuffer} */ var buffer = new ArrayBuffer(totalBytesRequired);
    /** @type {Uint8Array} */ var outArray = new Uint8Array(buffer);

    numberToArray(inArray, value);

    for (var bitNdx = totalBitsRequired - 1; bitNdx >= steps; bitNdx--)
    {
        /** @type {number} */ var sourceByte = Math.floor(bitNdx / 8);
        /** @type {number} */ var sourceBit = Math.floor(bitNdx % 8);
        /** @type {number} */ var newbitNdx = bitNdx - steps;
        /** @type {number} */ var correspondingByte = Math.floor(newbitNdx / 8);
        /** @type {number} */ var correspondingBit = Math.floor(newbitNdx % 8);
        /** @type {number} */ var bitValue = (inArray[sourceByte] & Math.pow(2, sourceBit)) != 0 ? 1 : 0;
        outArray[correspondingByte] = outArray[correspondingByte] | (Math.pow(2, correspondingBit) * bitValue);
    }

    return arrayToNumber(outArray);
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
        intersect: intersect,
        deMathHash: deMathHash,
        arrayToNumber: arrayToNumber,
        numberToArray: numberToArray,
        getBitRange: getBitRange,
        BinaryOp: BinaryOp,
        binaryOp: binaryOp,
        binaryNot: binaryNot,
        shiftLeft: shiftLeft,
        shiftRight: shiftRight
    };
});
