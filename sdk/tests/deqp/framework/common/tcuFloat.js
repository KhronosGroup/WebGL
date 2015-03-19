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

define(['framework/delibs/debase/deMath'], function(deMath)  {
'use strict';

var DE_ASSERT = function(x) {
    if (!x)
        throw new Error('Assert failed');
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
 * @param {BinaryOp} operation The desired operation to perform
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
        return ~value;*/

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

var FloatFlags = {
    FLOAT_HAS_SIGN: (1 << 0),
    FLOAT_SUPPORT_DENORM: (1 << 1)
};

/**
 * Defines a FloatDescription object, which is an essential part of the deFloat type.
 * Holds the information that shapes the deFloat.
 */
var FloatDescription = function(exponentBits, mantissaBits, exponentBias, flags) {
    this.ExponentBits = exponentBits;
    this.MantissaBits = mantissaBits;
    this.ExponentBias = exponentBias;
    this.Flags = flags;

    this.totalBitSize = 1 + this.ExponentBits + this.MantissaBits;
    this.totalByteSize = Math.floor(this.totalBitSize / 8) + ((this.totalBitSize % 8) > 0 ? 1 : 0);
};

/**
 * Builds a zero float of the current binary description.
 * @param {number} sign
 * @return {deFloat}
 */
FloatDescription.prototype.zero = function(sign) {
    return newDeFloatFromParameters(
        shiftLeft((sign > 0 ? 0 : 1), (this.ExponentBits + this.MantissaBits)),
        new FloatDescription(this.ExponentBits, this.MantissaBits, this.ExponentBias, this.Flags)
    );
};

/**
 * Builds an infinity float representation of the current binary description.
 * @param {number} sign
 * @return {deFloat}
 */
FloatDescription.prototype.inf = function(sign) {
    return newDeFloatFromParameters(((sign > 0 ? 0 : 1) << (this.ExponentBits + this.MantissaBits)) |
        shiftLeft(((1 << this.ExponentBits) - 1), this.MantissaBits), //Unless using very large exponent types, native shift is safe here, i guess.
        new FloatDescription(this.ExponentBits, this.MantissaBits, this.ExponentBias, this.Flags)
    );
};

/**
 * Builds a NaN float representation of the current binary description.
 * @return {deFloat}
 */
FloatDescription.prototype.nan = function() {
    return newDeFloatFromParameters(shiftLeft(1, (this.ExponentBits + this.MantissaBits)) - 1,
        new FloatDescription(this.ExponentBits, this.MantissaBits, this.ExponentBias, this.Flags)
    );
};

/**
 * Builds a deFloat number based on the description and the given
 * sign, exponent and mantissa values.
 * @param {number} sign
 * @param {number} exponent
 * @param {number} mantissa
 * @return {deFloat}
 */
FloatDescription.prototype.construct = function(sign, exponent, mantissa) {
    // Repurpose this otherwise invalid input as a shorthand notation for zero (no need for caller to care about internal representation)
    /** @type {boolean} */ var isShorthandZero = exponent == 0 && mantissa == 0;

    // Handles the typical notation for zero (min exponent, mantissa 0). Note that the exponent usually used exponent (-ExponentBias) for zero/subnormals is not used.
    // Instead zero/subnormals have the (normally implicit) leading mantissa bit set to zero.

    /** @type {boolean} */ var isDenormOrZero = (exponent == 1 - this.ExponentBias) && (shiftRight(mantissa, this.MantissaBits) == 0);
    /** @type {number} */ var s = shiftLeft((sign < 0 ? 1 : 0), (this.ExponentBits + this.MantissaBits));
    /** @type {number} */ var exp = (isShorthandZero || isDenormOrZero) ? 0 : exponent + this.ExponentBias;

    DE_ASSERT(sign == +1 || sign == -1);
    DE_ASSERT(isShorthandZero || isDenormOrZero || shiftRight(mantissa, this.MantissaBits) == 1);
    DE_ASSERT((exp >> this.ExponentBits) == 0); //Native shift is safe

    return newDeFloatFromParameters(
        binaryOp(
            binaryOp(
                s,
                shiftLeft(exp, this.MantissaBits),
                BinaryOp.OR
            ),
            binaryOp(
                mantissa,
                shiftLeft(1, this.MantissaBits) - 1,
                BinaryOp.AND
            ),
            BinaryOp.OR
        ),
        new FloatDescription(this.ExponentBits, this.MantissaBits, this.ExponentBias, this.Flags)
    );
};

/**
 * Builds a deFloat number based on the description and the given
 * sign, exponent and binary mantissa values.
 * @param {number} sign
 * @param {number} exponent
 * @param {number} mantissaBits The raw binary representation.
 * @return {deFloat}
 */
FloatDescription.prototype.constructBits = function(sign, exponent, mantissaBits) {
    /** @type {number} */ var signBit = sign < 0 ? 1 : 0;
    /** @type {number} */ var exponentBits = exponent + this.ExponentBias;

    DE_ASSERT(sign == +1 || sign == -1);
    DE_ASSERT((exponentBits >> this.ExponentBits) == 0);
    DE_ASSERT(shiftRight(mantissaBits >> this.MantissaBits) == 0);

    return newDeFloatFromParameters(
        binaryOp(
            binaryOp(
                shiftLeft(
                    signBit,
                    this.ExponentBits + this.MantissaBits
                ),
                shiftLeft(exponentBits, this.MantissaBits),
                BinaryOp.OR
            ),
            mantissaBits,
            BinaryOp.OR
        ),
        new FloatDescription(this.ExponentBits, this.MantissaBits, this.ExponentBias, this.Flags)
    );
};

/**
 * Converts a deFloat from it's own format description into the format described
 * by this description.
 * @param {deFloat} other Other float to convert to this format description.
 * @return {deFloat} converted deFloat
 */
FloatDescription.prototype.convert = function(other) {
    /** @type {number} */ var otherExponentBits = other.description.ExponentBits;
    /** @type {number} */ var otherMantissaBits = other.description.MantissaBits;
    /** @type {number} */ var otherExponentBias = other.description.ExponentBias;
    /** @type {number} */ var otherFlags = other.description.Flags;

    if (!(this.Flags & FloatFlags.FLOAT_HAS_SIGN) && other.sign() < 0)
    {
        // Negative number, truncate to zero.
        return this.zero(+1);
    }
    else if (other.isInf())
    {
        return this.inf(other.sign());
    }
    else if (other.isNaN())
    {
        return this.nan();
    }
    else if (other.isZero())
    {
        return this.zero(other.sign());
    }
    else
    {
        /** @type {number} */ var eMin = 1 - this.ExponentBias;
        /** @type {number} */ var eMax = ((1 << this.ExponentBits) - 2) - this.ExponentBias;

        /** @type {number} */ var s = shiftLeft(other.signBit(), (this.ExponentBits + this.MantissaBits)); // \note Not sign, but sign bit.
        /** @type {number} */ var e = other.exponent();
        /** @type {number} */ var m = other.mantissa();

        // Normalize denormalized values prior to conversion.
        while (!binaryOp(m, shiftLeft(1, otherMantissaBits), BinaryOp.AND))
        {
            m = shiftLeft(m, 1);
            e -= 1;
        }

        if (e < eMin)
        {
            // Underflow.
            if ((this.Flags & FloatFlags.FLOAT_SUPPORT_DENORM) && (eMin - e - 1 <= this.MantissaBits))
            {
                // Shift and round (RTE).
                /** @type {number} */ var bitDiff = (otherMantissaBits - this.MantissaBits) + (eMin - e);
                /** @type {number} */ var half = shiftLeft(1, (bitDiff - 1)) - 1;
                /** @type {number} */ var bias = binaryOp(shiftRight(m, bitDiff), 1, BinaryOp.AND);

                return newDeFloatFromParameters(
                    binaryOp(
                        s,
                        shiftRight(
                            m + half + bias,
                            bitDiff
                        ),
                        BinaryOp.OR
                    ),
                    new FloatDescription(this.ExponentBits, this.MantissaBits, this.ExponentBias, this.Flags)
                );
            }
            else
                return this.zero(other.sign());
        }
        else
        {
            // Remove leading 1.
            m = binaryOp(m, binaryNot(shiftLeft(1, otherMantissaBits)), BinaryOp.AND);

            if (this.MantissaBits < otherMantissaBits)
            {
                // Round mantissa (round to nearest even).
                /** @type {number} */ var bitDiff = otherMantissaBits - this.MantissaBits;
                /** @type {number} */ var half = shiftLeft(1, (bitDiff - 1)) - 1;
                /** @type {number} */ var bias = binaryOp(shiftRight(m, bitDiff), 1, BinaryOp.AND);

                m = shiftRight(m + half + bias, bitDiff);

                if (binaryOp(m, shiftLeft(1, this.MantissaBits), BinaryOp.AND))
                {
                    // Overflow in mantissa.
                    m = 0;
                    e += 1;
                }
            }
            else
            {
                /** @type {number} */ var bitDiff = this.MantissaBits - otherMantissaBits;
                m = shiftLeft(m, bitDiff);
            }

            if (e > eMax)
            {
                // Overflow.
                return this.inf(other.sign());
            }
            else
            {
                DE_ASSERT(deMath.deInRange32(e, eMin, eMax));
                DE_ASSERT(binaryOp((e + this.ExponentBias), binaryNot(shiftLeft(1, this.ExponentBits) - 1), BinaryOp.AND) == 0);
                DE_ASSERT(binaryOp(m, binaryNot(shiftLeft(1, this.MantissaBits) - 1), BinaryOp.AND) == 0);

                return newDeFloatFromParameters(
                    binaryOp(
                        binaryOp(
                            s,
                            shiftLeft(
                                e + this.ExponentBias,
                                this.MantissaBits
                            ),
                            BinaryOp.OR
                        ),
                        m,
                        BinaryOp.OR
                    ),
                    new FloatDescription(this.ExponentBits, this.MantissaBits, this.ExponentBias, this.Flags)
                );
            }
        }
    }
};

/**
 * deFloat class - Empty constructor, builds a 32 bit float by default
 */
var deFloat = function() {
    this.description = new FloatDescription(8, 23, 127, FloatFlags.FLOAT_HAS_SIGN | FloatFlags.FLOAT_SUPPORT_DENORM);

    this.buffer = new ArrayBuffer(this.description.totalByteSize);
    this.array = new Uint8Array(this.buffer);

    this.m_value = 0;
};

/**
 * deFloatNumber - To be used immediately after constructor
 * Builds a 32-bit deFloat based on a 64-bit JS number.
 * @param {number} jsnumber
 * @return {deFloat}
 */
deFloat.prototype.deFloatNumber = function(jsnumber) {
    var view32 = new DataView(this.buffer);
    view32.setFloat32(0, jsnumber, true); //little-endian
    this.m_value = view32.getFloat32(0, true); //little-endian

    return this;
};

/**
 * Convenience function to build a 32-bit deFloat based on a 64-bit JS number
 * Builds a 32-bit deFloat based on a 64-bit JS number.
 * @param {number} jsnumber
 * @return {deFloat}
 */
var newDeFloatFromNumber = function(jsnumber) {
    return new deFloat().deFloatNumber(jsnumber);
};

/**
 * deFloatBuffer - To be used immediately after constructor
 * Builds a deFloat based on a buffer and a format description.
 * The buffer is assumed to contain data of the given description.
 * @param {ArrayBuffer} buffer
 * @param {FloatDescription} description
 * @return {deFloat}
 */
deFloat.prototype.deFloatBuffer = function(buffer, description) {
    this.buffer = buffer;
    this.array = new Uint8Array(this.buffer);

    this.m_value = arrayToNumber(this.array);

    return this;
};

/**
 * Convenience function to build a deFloat based on a buffer and a format description
 * The buffer is assumed to contain data of the given description.
 * @param {number} jsnumber
 * @return {deFloat}
 */
var newDeFloatFromBuffer = function(buffer, description) {
    return new deFloat().deFloatBuffer(buffer, description);
};

/**
 * Initializes a deFloat from the given number,
 * with the specified format description.
 * It does not perform any conversion, it assumes the number contains a
 * binary representation of the given description.
 * @param {number} jsnumber
 * @param {Floatdescription} description
 * @return {deFloat}
 **/
deFloat.prototype.deFloatParameters = function(jsnumber, description) {
    this.m_value = jsnumber;
    this.description = description;

    this.buffer = new ArrayBuffer(this.description.totalByteSize);
    this.array = new Uint8Array(this.buffer);

    numberToArray(this.array, jsnumber);

    return this;
};

/**
 * Convenience function to create a deFloat from the given number,
 * with the specified format description.
 * It does not perform any conversion, it assumes the number contains a
 * binary representation of the given description.
 * @param {number} jsnumber
 * @param {FloatDescription} description
 * @return {deFloat}
 **/
var newDeFloatFromParameters = function(jsnumber, description) {
    return new deFloat().deFloatParameters(jsnumber, description);
};

/**
 * Returns the raw binary representation value of the deFloat
 * @return {number}
 */
deFloat.prototype.bits = function() {return arrayToNumber(this.array);};

/**
 * Returns the raw binary sign bit
 * @return {number}
 */
deFloat.prototype.signBit = function() {
    return getBitRange(this.array, this.description.totalBitSize - 1, this.description.totalBitSize);
};

/**
 * Returns the raw binary exponent bits
 * @return {number}
 */
deFloat.prototype.exponentBits = function() {
    return getBitRange(this.array, this.description.MantissaBits, this.description.MantissaBits + this.description.ExponentBits);
};

/**
 * Returns the raw binary mantissa bits
 * @return {number}
 */
deFloat.prototype.mantissaBits = function() {
    return getBitRange(this.array, 0, this.description.MantissaBits);
};

/**
 * Returns the sign as a factor (-1 or 1)
 * @return {number}
 */
deFloat.prototype.sign = function() {
    var sign = this.signBit();
    var signvalue = sign ? -1 : 1;
    return signvalue;
};

/**
 * Returns the real exponent, checking if it's a denorm or zero number or not
 * @return {number}
 */
deFloat.prototype.exponent = function() {return this.isDenorm() ? 1 - this.description.ExponentBias : this.exponentBits() - this.description.ExponentBias;};

/**
 * Returns the (still raw) mantissa, checking if it's a denorm or zero number or not
 * Makes the normally implicit bit explicit.
 * @return {number}
 */
deFloat.prototype.mantissa = function() {return this.isZero() || this.isDenorm() ? this.mantissaBits() : binaryOp(this.mantissaBits(), shiftLeft(1, this.description.MantissaBits), BinaryOp.OR);};

/**
 * Returns if the number is infinity or not.
 * @return {boolean}
 */
deFloat.prototype.isInf = function() {return this.exponentBits() == ((1 << this.description.ExponentBits) - 1) && this.mantissaBits() == 0;};

/**
 * Returns if the number is NaN or not.
 * @return {boolean}
 */
deFloat.prototype.isNaN = function() {return this.exponentBits() == ((1 << this.description.ExponentBits) - 1) && this.mantissaBits() != 0;};

/**
 * Returns if the number is zero or not.
 * @return {boolean}
 */
deFloat.prototype.isZero = function() {return this.exponentBits() == 0 && this.mantissaBits() == 0;};

/**
 * Returns if the number is denormalized or not.
 * @return {boolean}
 */
deFloat.prototype.isDenorm = function() {return this.exponentBits() == 0 && this.mantissaBits() != 0;};

/**
 * Builds a zero float of the current binary description.
 * @param {number} sign
 * @return {deFloat}
 */
deFloat.prototype.zero = function(sign) {
    return this.description.zero(sign);
};

/**
 * Builds an infinity float representation of the current binary description.
 * @param {number} sign
 * @return {deFloat}
 */
deFloat.prototype.inf = function(sign) {
    return this.description.inf(sign);
};

/**
 * Builds a NaN float representation of the current binary description.
 * @return {deFloat}
 */
deFloat.prototype.nan = function() {
    return this.description.nan();
};

/**
 * Builds a float of the current binary description.
 * Given a sign, exponent and mantissa.
 * @param {number} sign
 * @param {number} exponent
 * @param {number} mantissa
 * @return {deFloat}
 */
deFloat.prototype.construct = function(sign, exponent, mantissa) {
    return this.description.construct(sign, exponent, mantissa);
};

/**
 * Builds a float of the current binary description.
 * Given a sign, exponent and a raw binary mantissa.
 * @param {number} sign
 * @param {number} exponent
 * @param {number} mantissaBits Raw binary mantissa.
 * @return {deFloat}
 */
deFloat.prototype.constructBits = function(sign, exponent, mantissaBits) {
    return this.description.constructBits(sign, exponent, mantissaBits);
};

/**
 * Calculates the JS float number from the internal representation.
 * @return {number} The JS float value represented by this deFloat.
 */
deFloat.prototype.getValue = function() {
    /**@type {number} */ var mymantissa = this.mantissa();
    /**@type {number} */ var myexponent = this.exponent();
    /**@type {number} */ var sign = this.sign();

    /**@type {number} */ var value = mymantissa / Math.pow(2, this.description.MantissaBits) * Math.pow(2, myexponent);

    if (this.description.Flags | FloatFlags.FLOAT_HAS_SIGN != 0)
        value = value * sign;

    return value;
};

/**
 * Builds a 10 bit deFloat
 * @param {number} value (64-bit JS float)
 * @return {deFloat}
 */
var newFloat10 = function(value) {
    /**@type {deFloat} */ var other32 = new deFloat().deFloatNumber(value);
    /**@type {FloatDescription} */ var description10 = new FloatDescription(5, 5, 15, 0);
    return description10.convert(other32);
};

/**
 * Builds a 11 bit deFloat
 * @param {number} value (64-bit JS float)
 * @return {deFloat}
 */
var newFloat11 = function(value) {
    /**@type {deFloat} */ var other32 = new deFloat().deFloatNumber(value);
    /**@type {FloatDescription} */ var description11 = new FloatDescription(5, 6, 15, 0);
    return description11.convert(other32);
};

/**
 * Builds a 16 bit deFloat
 * @param {number} value (64-bit JS float)
 * @return {deFloat}
 */
var newFloat16 = function(value) {
    /**@type {deFloat} */ var other32 = new deFloat().deFloatNumber(value);
    /**@type {FloatDescription} */ var description16 = new FloatDescription(5, 10, 15, FloatFlags.FLOAT_HAS_SIGN | FloatFlags.FLOAT_SUPPORT_DENORM);
    return description16.convert(other32);
};

/**
 * Builds a 32 bit deFloat
 * @param {number} value (64-bit JS float)
 * @return {deFloat}
 */
var newFloat32 = function(value) {
    return new deFloat().deFloatNumber(value);
};

var numberToFloat11 = function(value) {
    return newFloat11(value).bits();
};

var float11ToNumber = function(float11) {
    var description11 = new FloatDescription(5, 6, 15, 0);
    var x = newDeFloatFromParameters(float11, description11);
    return x.getValue();
};

var numberToFloat10 = function(value) {
    return newFloat10(value).bits();
};

var float10ToNumber = function(float10) {
    var description10 = new FloatDescription(5, 5, 15, 0);
    var x = newDeFloatFromParameters(float10, description10);
    return x.getValue();
};

var numberToHalfFloat = function(value) {
    return newFloat16(value).bits();
};

var halfFloatToNumber = function(half) {
    var description16 = new FloatDescription(5, 10, 15, FloatFlags.FLOAT_HAS_SIGN | FloatFlags.FLOAT_SUPPORT_DENORM);
    var x = newDeFloatFromParameters(half, description16);
    return x.getValue();
};

return {
    numberToFloat11: numberToFloat11,
    float11ToNumber: float11ToNumber,
    numberToFloat10: numberToFloat10,
    float10ToNumber: float10ToNumber,
    numberToHalfFloat: numberToHalfFloat,
    halfFloatToNumber: halfFloatToNumber
};

});
