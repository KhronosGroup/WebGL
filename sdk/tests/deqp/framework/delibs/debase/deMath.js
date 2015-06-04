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
goog.provide('framework.delibs.debase.deMath');

/** @typedef { (Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array) } */
goog.TypedArray;

/** @typedef { (Array<number>|Array<boolean>|goog.TypedArray) } */
goog.NumberArray;

goog.scope(function() {

var deMath = framework.delibs.debase.deMath;

/** @const */ deMath.INT32_SIZE = 4;

deMath.deInRange32 = function(a, mn, mx) {
    return (a >= mn) && (a <= mx);
};

deMath.deInBounds32 = function(a, mn, mx) {
    return (a >= mn) && (a < mx);
};

/**
 * @param {number} a
 * @return {number}
 */
deMath.deFloatFrac = function(a) { return a - Math.floor(a); };

/**
 * Check if a value is a power-of-two.
 * @param {number} a Input value.
 * @return {boolean} return True if input is a power-of-two value, false otherwise.
 * (Also returns true for zero).
 */
deMath.deIsPowerOfTwo32 = function(a) {
    return ((a & (a - 1)) == 0);
};

/**
 * Align an integer to given power-of-two size.
 * @param {number} val The number to align.
 * @param {number} align The size to align to.
 * @return {number} The aligned value
 */
deMath.deAlign32 = function(val, align) {
    if (!deMath.deIsPowerOfTwo32(align))
        throw new Error('Not a power of 2: ' + align);
    return ((val + align - 1) & ~(align - 1)) & 0xFFFFFFFF; //0xFFFFFFFF make sure it returns a 32 bit calculation in 64 bit browsers.
};

/**
 * Compute the bit population count of an integer.
 * @param {number} a
 * @return {number} The number of one bits in
 */
deMath.dePop32 = function(a) {
    /** @type {number} */ var mask0 = 0x55555555; /* 1-bit values. */
    /** @type {number} */ var mask1 = 0x33333333; /* 2-bit values. */
    /** @type {number} */ var mask2 = 0x0f0f0f0f; /* 4-bit values. */
    /** @type {number} */ var mask3 = 0x00ff00ff; /* 8-bit values. */
    /** @type {number} */ var mask4 = 0x0000ffff; /* 16-bit values. */
    /** @type {number} */ var t = a & 0xFFFFFFFF; /* Crop to 32-bit value */
    t = (t & mask0) + ((t >> 1) & mask0);
    t = (t & mask1) + ((t >> 2) & mask1);
    t = (t & mask2) + ((t >> 4) & mask2);
    t = (t & mask3) + ((t >> 8) & mask3);
    t = (t & mask4) + (t >> 16);
    return t;
};

deMath.clamp = function(val, minParm, maxParm) {
    return Math.max(minParm, Math.min(val, maxParm));
};

/**
 * @param {Array<number>} values
 * @param {number} minParm
 * @param {number} maxParm
 * @return {Array<number>}
 */
deMath.clampVector = function(values, minParm, maxParm) {
    var result = [];
    for (var i = 0; i < values.length; i++)
        result.push(deMath.clamp(values[i], minParm, maxParm));
    return result;
};

deMath.imod = function(a, b) {
    var m = a % b;
    return m < 0 ? m + b : m;
};

deMath.mirror = function(a) {
    return a >= 0 ? a : -(1 + a);
};

/**
 * @param {goog.NumberArray} a Source array
 * @param {goog.NumberArray} indices
 * @return {Array<number>} Swizzled array
 */
deMath.swizzle = function(a, indices) {
    if (!indices.length)
        throw new Error('Argument must be an array');
    var dst = [];
    for (var i = 0; i < indices.length; i++)
        dst.push(a[indices[i]]);
    return dst;
};

/**
 * Multiply two vectors, element by element
 * @param {goog.NumberArray} a
 * @param {goog.NumberArray} b
 * @return {Array<number>} Result array
 */

deMath.multiply = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] * b[i]);
    return dst;
};

/**
 * Divide two vectors, element by element
 * @param {goog.NumberArray} a
 * @param {goog.NumberArray} b
 * @return {Array<number>} Result array
 * @throws {Error}
 */

deMath.divide = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++) {
        if (b[i] === 0)
            throw new Error('Division by 0');
        dst.push(a[i] / b[i]);
    }
    return dst;
};

/**
 * Multiply vector by a scalar
 * @param {goog.NumberArray} a
 * @param {number} b
 * @return {Array<number>} Result array
 */
deMath.scale = function(a, b) {
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] * b);
    return dst;
};

/**
 * Add two vectors, element by element
 * @param {goog.NumberArray} a
 * @param {goog.NumberArray} b
 * @return {Array<number>} Result array
 */

deMath.add = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] + b[i]);
    return dst;
};

/**
 * Subtract two vectors, element by element
 * @param {goog.NumberArray} a
 * @param {goog.NumberArray} b
 * @return {Array<number>} Result array
 */

deMath.subtract = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] - b[i]);
    return dst;
};

/**
 * Calculate absolute difference between two vectors
 * @param {goog.NumberArray} a
 * @param {goog.NumberArray} b
 * @return {Array<number>} abs(diff(a - b))
 */
deMath.absDiff = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(Math.abs(a[i] - b[i]));
    return dst;
};

/**
 * Calculate absolute value of a vector
 * @param {goog.NumberArray} a
 * @return {Array<number>} abs(a)
 */
deMath.abs = function(a) {
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(Math.abs(a[i]));
    return dst;
};

/**
 * Is a <= b (element by element)?
 * @param {goog.NumberArray} a
 * @param {goog.NumberArray} b
 * @return {Array<boolean>} Result array of booleans
 */
deMath.lessThanEqual = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i] <= b[i]);
    return dst;
};

/**
 * Is a === b (element by element)?
 * @param {goog.NumberArray} a
 * @param {goog.NumberArray} b
 * @return {boolean} Result
 */
deMath.equal = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
};

/**
 * Are all values in the array true?
 * @param {Array<boolean>} a
 * @return {boolean}
 */
deMath.boolAll = function(a) {
    for (var i = 0; i < a.length; i++)
        if (a[i] == false)
            return false;
    return true;
};

/**
 * deMath.assign(a, b) element by element
 * @param {goog.NumberArray} a
 * @return {Array<number>}
 */
deMath.assign = function(a) {
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(a[i]);
    return dst;
};

/**
 * deMath.max(a, b) element by element
 * @param {goog.NumberArray} a
 * @param {goog.NumberArray} b
 * @return {Array<number>}
 */
deMath.max = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(Math.max(a[i], b[i]));
    return dst;
};

/**
 * deMath.min(a, b) element by element
 * @param {goog.NumberArray} a
 * @param {goog.NumberArray} b
 * @return {Array<number>}
 */
deMath.min = function(a, b) {
    if (a.length != b.length)
        throw new Error('Arrays must have the same size');
    var dst = [];
    for (var i = 0; i < a.length; i++)
        dst.push(Math.min(a[i], b[i]));
    return dst;
};

// Nearest-even rounding in case of tie (fractional part 0.5), otherwise ordinary rounding.
deMath.rint = function(a) {
    var floorVal = Math.floor(a);
    var fracVal = a - floorVal;

    if (fracVal != 0.5)
        return Math.round(a); // Ordinary case.

    var roundUp = (floorVal % 2) != 0;

    return floorVal + (roundUp ? 1 : 0);
};

/**
 * Find intersection of two rectangles
 * @param {goog.NumberArray} a Array [x, y, width, height]
 * @param {goog.NumberArray} b Array [x, y, width, height]
 * @return {Array<number>}
 */
deMath.intersect = function(a, b) {
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

/** deMath.deMathHash
 * @param {number} a
 * @return {number}
 */
deMath.deMathHash = function(a) {
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
deMath.arrayToNumber = function(array) {
    /** @type {number} */ var result = 0;

    for (var ndx = 0; ndx < array.length; ndx++) {
        result += array[ndx] * Math.pow(256, ndx);
    }

    return result;
};

/**
 * Fills a byte array with a number
 * @param {Uint8Array} array Output array (already resized)
 * @param {number} number
 */
deMath.numberToArray = function(array, number) {
    for (var byteNdx = 0; byteNdx < array.length; byteNdx++) {
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
deMath.getBitRange = function(array, firstNdx, lastNdx) {
    /** @type {number} */ var bitSize = lastNdx - firstNdx;
    /** @type {number} */ var byteSize = Math.floor(bitSize / 8) + ((bitSize % 8) > 0 ? 1 : 0);

    /** @type {ArrayBuffer} */ var buffer = new ArrayBuffer(byteSize);
    /** @type {Uint8Array} */ var outArray = new Uint8Array(buffer);

    for (var bitNdx = firstNdx; bitNdx < lastNdx; bitNdx++) {
        /** @type {number} */ var sourceByte = Math.floor(bitNdx / 8);
        /** @type {number} */ var sourceBit = Math.floor(bitNdx % 8);

        /** @type {number} */ var destByte = Math.floor((bitNdx - firstNdx) / 8);
        /** @type {number} */ var destBit = Math.floor((bitNdx - firstNdx) % 8);

        /** @type {number} */ var sourceBitValue = (array[sourceByte] & Math.pow(2, sourceBit)) != 0 ? 1 : 0;

        outArray[destByte] = outArray[destByte] | (Math.pow(2, destBit) * sourceBitValue);
    }

    return deMath.arrayToNumber(outArray);
};

//Bit operations with the help of arrays

/**
 * @enum
 */
deMath.BinaryOp = {
    AND: 0,
    OR: 1
};

/**
 * Performs a normal (native) binary operation
 * @param {number} valueA First operand
 * @param {number} valueB Second operand
 * @param {deMath.BinaryOp} operation The desired operation to perform
 * @return {number}
 */
deMath.doNativeBinaryOp = function(valueA, valueB, operation) {
    switch (operation) {
        case deMath.BinaryOp.AND:
            return valueA & valueB;
        case deMath.BinaryOp.OR:
            return valueA | valueB;
        default:
            throw new Error('Unknown operation: ' + operation);
    }
};

/**
 * Performs a binary operation between two operands
 * with the help of arrays to avoid losing the internal binary representation.
 * If the operation is safe to perform in a native way, it will do that.
 * @param {number} valueA First operand
 * @param {number} valueB Second operand
 * @param {deMath.BinaryOp} binaryOpParm The desired operation to perform
 * @return {number}
 */
deMath.binaryOp = function(valueA, valueB, binaryOpParm) {
    valueA = valueA < 0 ? new Uint32Array([valueA])[0] : valueA;
    valueB = valueB < 0 ? new Uint32Array([valueB])[0] : valueB;
    /** @type {number} */ var valueABitSize = valueA == 0 ? 0 : Math.floor(Math.log2(valueA) + 1);
    /** @type {number} */ var valueBBitSize = valueB == 0 ? 0 : Math.floor(Math.log2(valueB) + 1);
    /** @type {number} */ var bitsSize = Math.max(valueABitSize, valueBBitSize);

    if (bitsSize <= 32)
        return deMath.doNativeBinaryOp(valueA, valueB, binaryOpParm);

    /** @type {number} */ var valueAByteSize = Math.floor(valueABitSize / 8) + ((valueABitSize % 8) > 0 ? 1 : 0);
    /** @type {number} */ var valueBByteSize = Math.floor(valueBBitSize / 8) + ((valueBBitSize % 8) > 0 ? 1 : 0);
    /** @type {number} */ var byteSize = Math.floor(bitsSize / 8) + ((bitsSize % 8) > 0 ? 1 : 0);

    /** @type {ArrayBuffer} */ var valueABuffer = new ArrayBuffer(valueAByteSize);
    /** @type {ArrayBuffer} */ var valueBBuffer = new ArrayBuffer(valueBByteSize);
    /** @type {ArrayBuffer} */ var buffer = new ArrayBuffer(byteSize);

    /** @type {Uint8Array} */ var inArrayA = new Uint8Array(valueABuffer);
    /** @type {Uint8Array} */ var inArrayB = new Uint8Array(valueBBuffer);
    /** @type {Uint8Array} */ var outArray = new Uint8Array(buffer);

    deMath.numberToArray(inArrayA, valueA);
    deMath.numberToArray(inArrayB, valueB);

    /** @type {Uint8Array} */ var largestArray = inArrayA.length > inArrayB.length ? inArrayA : inArrayB;

    /** @type {number} */ var minLength = Math.min(inArrayA.length, inArrayB.length);

    for (var byteNdx = 0; byteNdx < minLength; byteNdx++) {
        outArray[byteNdx] = deMath.doNativeBinaryOp(inArrayA[byteNdx], inArrayB[byteNdx], binaryOpParm);
    }

    while (byteNdx < byteSize) {
        outArray[byteNdx] = largestArray[byteNdx];
        byteNdx++;
    }

    return deMath.arrayToNumber(outArray);
};

/**
 * Performs a binary NOT operation in an operand
 * with the help of arrays.
 * @param {number} value Operand
 * @return {number}
 */
deMath.binaryNot = function(value) {
    if (value == 0) return 0;
    value = value < 0 ? new Uint32Array([value])[0] : value;
    /** @type {number} */ var bitsSize = value == 0 ? 0 : Math.floor(Math.log2(value) + 1);

    //This is not reliable. But left here commented as a warning.
    //if (bitsSize <= 32)
    //    return ~value;

    /** @type {number} */ var byteSize = Math.floor(bitsSize / 8) + ((bitsSize % 8) > 0 ? 1 : 0);

    /** @type {ArrayBuffer} */ var inBuffer = new ArrayBuffer(byteSize);
    /** @type {Uint8Array} */ var inArray = new Uint8Array(inBuffer);

    /** @type {ArrayBuffer} */ var buffer = new ArrayBuffer(byteSize);
    /** @type {Uint8Array} */ var outArray = new Uint8Array(buffer);

    deMath.numberToArray(inArray, value);

    for (var byteNdx = 0; byteNdx < byteSize; byteNdx++) {
        outArray[byteNdx] = ~inArray[byteNdx];
    }

    return deMath.arrayToNumber(outArray);
};

/**
 * Shifts the given value 'steps' bits to the left. Replaces << operator
 * This function should be used if the expected value will be wider than 32-bits.
 * If safe, it will perform a normal << operation
 * @param {number} value
 * @param {number} steps
 * @return {number}
 */
deMath.shiftLeft = function(value, steps) {
    value = value < 0 ? new Uint32Array([value])[0] : value;
    /** @type {number} */ var totalBitsRequired = value == 0 ? steps : Math.floor(Math.log2(value) + 1) + steps;

    if (totalBitsRequired < 32)
        return value << steps;

    totalBitsRequired = totalBitsRequired > 64 ? 64 : totalBitsRequired; //No more than 64-bits

    /** @type {number} */ var totalBytesRequired = Math.floor(totalBitsRequired / 8) + ((totalBitsRequired % 8) > 0 ? 1 : 0);

    /** @type {ArrayBuffer} */ var inBuffer = new ArrayBuffer(totalBytesRequired);
    /** @type {Uint8Array} */ var inArray = new Uint8Array(inBuffer);

    /** @type {ArrayBuffer} */ var buffer = new ArrayBuffer(totalBytesRequired);
    /** @type {Uint8Array} */ var outArray = new Uint8Array(buffer);

    deMath.numberToArray(inArray, value);

    for (var bitNdx = 0; bitNdx < totalBitsRequired; bitNdx++) {
        /** @type {number} */ var sourceByte = Math.floor(bitNdx / 8);
        /** @type {number} */ var sourceBit = Math.floor(bitNdx % 8);
        /** @type {number} */ var newbitNdx = bitNdx + steps;
        /** @type {number} */ var correspondingByte = Math.floor(newbitNdx / 8);
        /** @type {number} */ var correspondingBit = Math.floor(newbitNdx % 8);
        /** @type {number} */ var bitValue = (inArray[sourceByte] & Math.pow(2, sourceBit)) != 0 ? 1 : 0;
        outArray[correspondingByte] = outArray[correspondingByte] | (Math.pow(2, correspondingBit) * bitValue);
    }

    return deMath.arrayToNumber(outArray);
};

/**
 * Shifts the given value 'steps' bits to the right. Replaces >> operator
 * This function should be used if the expected value will be wider than 32-bits
 * If safe, it will perform a normal >> operation
 * @param {number} value
 * @param {number} steps
 * @return {number}
 */
deMath.shiftRight = function(value, steps) {
    value = value < 0 ? new Uint32Array([value])[0] : value;
    /** @type {number} */ var totalBitsRequired = value == 0 ? steps : Math.floor(Math.log2(value) + 1); //additional bits not needed (will be 0) + steps;

    if (totalBitsRequired < 32)
        return value >> steps;

    /** @type {number} */ var totalBytesRequired = Math.floor(totalBitsRequired / 8) + ((totalBitsRequired % 8) > 0 ? 1 : 0);

    /** @type {ArrayBuffer} */ var inBuffer = new ArrayBuffer(totalBytesRequired);
    /** @type {Uint8Array} */ var inArray = new Uint8Array(inBuffer);

    /** @type {ArrayBuffer} */ var buffer = new ArrayBuffer(totalBytesRequired);
    /** @type {Uint8Array} */ var outArray = new Uint8Array(buffer);

    deMath.numberToArray(inArray, value);

    for (var bitNdx = totalBitsRequired - 1; bitNdx >= steps; bitNdx--) {
        /** @type {number} */ var sourceByte = Math.floor(bitNdx / 8);
        /** @type {number} */ var sourceBit = Math.floor(bitNdx % 8);
        /** @type {number} */ var newbitNdx = bitNdx - steps;
        /** @type {number} */ var correspondingByte = Math.floor(newbitNdx / 8);
        /** @type {number} */ var correspondingBit = Math.floor(newbitNdx % 8);
        /** @type {number} */ var bitValue = (inArray[sourceByte] & Math.pow(2, sourceBit)) != 0 ? 1 : 0;
        outArray[correspondingByte] = outArray[correspondingByte] | (Math.pow(2, correspondingBit) * bitValue);
    }

    return deMath.arrayToNumber(outArray);
};

/** deMath.logicalAndBool over two arrays of booleans
 * @param {Array<boolean>} a
 * @param {Array<boolean>} b
 * @return {Array<boolean>}
 */
deMath.logicalAndBool = function(a, b) {
    if (!Array.isArray(a))
        throw new Error('The first parameter is not an array: (' + typeof(a) + ')' + a);
    if (!Array.isArray(b))
        throw new Error('The second parameter is not an array: (' + typeof(b) + ')' + b);
    if (a.length != b.length)
        throw new Error('The lengths of the passed arrays are not equivalent. (' + a.length + ' != ' + b.length + ')');

    /** @type {Array<boolean>} */ var result = [];
    for (var i = 0; i < a.length; i++) {
        if (a[i] & b[i])
            result.push(true);
        else
            result.push(false);
    }
    return result;
};

/** deMath.logicalOrBool over two arrays of booleans
 * @param {Array<boolean>} a
 * @param {Array<boolean>} b
 * @return {Array<boolean>}
 */
deMath.logicalOrBool = function(a, b) {
    if (!Array.isArray(a))
        throw new Error('The first parameter is not an array: (' + typeof(a) + ')' + a);
    if (!Array.isArray(b))
        throw new Error('The second parameter is not an array: (' + typeof(b) + ')' + b);
    if (a.length != b.length)
        throw new Error('The lengths of the passed arrays are not equivalent. (' + a.length + ' != ' + b.length + ')');

    /** @type {Array<boolean>} */ var result = [];
    for (var i = 0; i < a.length; i++) {
        if (a[i] | b[i])
            result.push(true);
        else
            result.push(false);
    }
    return result;
};

/** deMath.logicalNotBool over an array of booleans
 * @param {Array<boolean>} a
 * @return {Array<boolean>}
 */
deMath.logicalNotBool = function(a) {
    if (!Array.isArray(a))
        throw new Error('The passed value is not an array: (' + typeof(a) + ')' + a);

    /** @type {Array<boolean>} */ var result = [];
    for (var i = 0; i < a.length; i++)
        result.push(!a[i]);
    return result;
};

/** deMath.greaterThan over two arrays of booleans
 * @param {Array<number>} a
 * @param {Array<number>} b
 * @return {Array<boolean>}
 */
deMath.greaterThan = function(a, b) {
    if (!Array.isArray(a))
        throw new Error('The first parameter is not an array: (' + typeof(a) + ')' + a);
    if (!Array.isArray(b))
        throw new Error('The second parameter is not an array: (' + typeof(b) + ')' + b);
    if (a.length != b.length)
        throw new Error('The lengths of the passed arrays are not equivalent. (' + a.length + ' != ' + b.length + ')');

    /** @type {Array<boolean>} */ var result = [];
    for (var i = 0; i < a.length; i++)
        result.push(a[i] > b[i]);
    return result;
};

/** deMath.greaterThan over two arrays of booleans
 * @param {Array<number>} a
 * @param {Array<number>} b
 * @return {Array<boolean>}
 */
deMath.greaterThanEqual = function(a, b) {
    if (!Array.isArray(a))
        throw new Error('The first parameter is not an array: (' + typeof(a) + ')' + a);
    if (!Array.isArray(b))
        throw new Error('The second parameter is not an array: (' + typeof(b) + ')' + b);
    if (a.length != b.length)
        throw new Error('The lengths of the passed arrays are not equivalent. (' + a.length + ' != ' + b.length + ')');

    /** @type {Array<boolean>} */ var result = [];
    for (var i = 0; i < a.length; i++)
        result.push(a[i] >= b[i]);
    return result;
};

/**
 * Array of float to array of int (0, 255)
 * @param {Array<number>} a
 * @return {Array<number>}
 */

deMath.toIVec = function(a) {
    /** @type {Array<number>} */ var res = [];
    for (var i = 0; i < a.length; i++)
        res.push(Math.floor(a[i] * 255));
    return res;
};

/**
 * @param {number} a
 * @return {number}
 */
 deMath.clz32 = function(a) {
   /** @type {number} */ var maxValue = 2147483648; // max 32 bit number
   /** @type {number} */ var leadingZeros = 0;
   while (a < maxValue) {
     maxValue = maxValue >>> 1;
     leadingZeros++;
   }
   return leadingZeros;
};

});
