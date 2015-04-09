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

define(['framework/delibs/debase/deMath', 'framework/common/tcuFloat'], function(deMath, tcuFloat)  {
'use strict';

var DE_ASSERT = function(x) {
    if (!x)
        throw new Error('Assert failed');
};

/**
 * Texture channel order
 * @enum
 */
var ChannelOrder = {
    R: 0,
    A: 1,
    I: 2,
    L: 3,
    LA: 4,
    RG: 5,
    RA: 6,
    RGB: 7,
    RGBA: 8,
    ARGB: 9,
    BGRA: 10,

    sRGB: 11,
    sRGBA: 12,

    D: 13,
    S: 14,
    DS: 15
};

/**
 * Texture channel type
 * @enum
 */
var ChannelType = {
    SNORM_INT8: 0,
    SNORM_INT16: 1,
    SNORM_INT32: 2,
    UNORM_INT8: 3,
    UNORM_INT16: 4,
    UNORM_INT32: 5,
    UNORM_SHORT_565: 6,
    UNORM_SHORT_555: 7,
    UNORM_SHORT_4444: 8,
    UNORM_SHORT_5551: 9,
    UNORM_INT_101010: 10,
    UNORM_INT_1010102_REV: 11,
    UNSIGNED_INT_1010102_REV: 12,
    UNSIGNED_INT_11F_11F_10F_REV: 13,
    UNSIGNED_INT_999_E5_REV: 14,
    UNSIGNED_INT_24_8: 15,
    SIGNED_INT8: 16,
    SIGNED_INT16: 17,
    SIGNED_INT32: 18,
    UNSIGNED_INT8: 19,
    UNSIGNED_INT16: 20,
    UNSIGNED_INT32: 21,
    HALF_FLOAT: 22,
    FLOAT: 23,
    FLOAT_UNSIGNED_INT_24_8_REV: 24
};

/**
 * Contruct texture format
 * @param {ChannelOrder} order
 * @param {ChannelType} type
 *
 * @constructor
 */
var TextureFormat = function(order, type) {
    this.order = order;
    this.type = type;
};

/**
 * Compare two formats
 * @param {TextureFormat} format Format to compare with
 * @return {boolean}
 */
TextureFormat.prototype.isEqual = function(format) {
    return this.order === format.order && this.type === format.type;
};

/**
 * Is format sRGB?
 * @return {boolean}
 */
TextureFormat.prototype.isSRGB = function() {
    return this.order === ChannelOrder.sRGB || this.order === ChannelOrder.sRGBA;
};

TextureFormat.prototype.getNumStencilBits = function() {
    switch (this.order) {
        case ChannelOrder.S:
            switch (this.type)
            {
                case ChannelType.UNSIGNED_INT8: return 8;
                case ChannelType.UNSIGNED_INT16: return 16;
                case ChannelType.UNSIGNED_INT32: return 32;
                default:
                    throw new Error('Wrong type: ' + this.type);
            }

        case ChannelOrder.DS:
            switch (this.type)
            {
                case ChannelType.UNSIGNED_INT_24_8: return 8;
                case ChannelType.FLOAT_UNSIGNED_INT_24_8_REV: return 8;
                default:
                    throw new Error('Wrong type: ' + this.type);
            }

        default:
            throw new Error('Wrong order: ' + this.order);
    }
};

/**
 * Get TypedArray type that can be used to access texture.
 * @param {ChannelType} type
 * @return {TypedArray} TypedArray that supports the channel type.
 */
var getTypedArray = function(type) {
    switch (type) {
        case ChannelType.SNORM_INT8: return Int8Array;
        case ChannelType.SNORM_INT16: return Int16Array;
        case ChannelType.SNORM_INT32: return Int32Array;
        case ChannelType.UNORM_INT8: return Uint8Array;
        case ChannelType.UNORM_INT16: return Uint16Array;
        case ChannelType.UNORM_INT32: return Uint32Array;
        case ChannelType.UNORM_SHORT_565: return Uint16Array;
        case ChannelType.UNORM_SHORT_555: return Uint16Array;
        case ChannelType.UNORM_SHORT_4444: return Uint16Array;
        case ChannelType.UNORM_SHORT_5551: return Uint16Array;
        case ChannelType.UNORM_INT_101010: return Uint32Array;
        case ChannelType.UNORM_INT_1010102_REV: return Uint32Array;
        case ChannelType.UNSIGNED_INT_1010102_REV: return Uint32Array;
        case ChannelType.UNSIGNED_INT_11F_11F_10F_REV: return Uint32Array;
        case ChannelType.UNSIGNED_INT_999_E5_REV: return Uint32Array;
        case ChannelType.UNSIGNED_INT_24_8: return Uint32Array;
        case ChannelType.FLOAT: return Float32Array;
        case ChannelType.SIGNED_INT8: return Int8Array;
        case ChannelType.SIGNED_INT16: return Int16Array;
        case ChannelType.SIGNED_INT32: return Int32Array;
        case ChannelType.UNSIGNED_INT8: return Uint8Array;
        case ChannelType.UNSIGNED_INT16: return Uint16Array;
        case ChannelType.UNSIGNED_INT32: return Uint32Array;
        case ChannelType.HALF_FLOAT: return Uint16Array;
        case ChannelType.FLOAT_UNSIGNED_INT_24_8_REV: return Float32Array; /* this type is a special case */
    }

    throw new Error('Unrecognized type ' + type);
};

/**
 * @return {Number} pixel size in bytes
 */
TextureFormat.prototype.getPixelSize = function() {
    if (this.type == null || this.order == null)
    {
        // Invalid/empty format.
        return 0;
    }
    else if (this.type == ChannelType.UNORM_SHORT_565 ||
             this.type == ChannelType.UNORM_SHORT_555 ||
             this.type == ChannelType.UNORM_SHORT_4444 ||
             this.type == ChannelType.UNORM_SHORT_5551)
    {
        DE_ASSERT(this.order == ChannelOrder.RGB || this.order == ChannelOrder.RGBA);
        return 2;
    }
    else if (this.type == ChannelType.UNORM_INT_101010 ||
             this.type == ChannelType.UNSIGNED_INT_999_E5_REV ||
             this.type == ChannelType.UNSIGNED_INT_11F_11F_10F_REV)
    {
        DE_ASSERT(this.order == ChannelOrder.RGB);
        return 4;
    }
    else if (this.type == ChannelType.UNORM_INT_1010102_REV ||
             this.type == ChannelType.UNSIGNED_INT_1010102_REV)
    {
        DE_ASSERT(this.order == ChannelOrder.RGBA);
        return 4;
    }
    else if (this.type == ChannelType.UNSIGNED_INT_24_8)
    {
        DE_ASSERT(this.order == ChannelOrder.D || this.order == ChannelOrder.DS);
        return 4;
    }
    else if (this.type == ChannelType.FLOAT_UNSIGNED_INT_24_8_REV)
    {
        DE_ASSERT(this.order == ChannelOrder.DS);
        return 8;
    }
    else
    {
        var numChannels;
        var channelSize;

        switch (this.order)
        {
            case ChannelOrder.R: numChannels = 1; break;
            case ChannelOrder.A: numChannels = 1; break;
            case ChannelOrder.I: numChannels = 1; break;
            case ChannelOrder.L: numChannels = 1; break;
            case ChannelOrder.LA: numChannels = 2; break;
            case ChannelOrder.RG: numChannels = 2; break;
            case ChannelOrder.RA: numChannels = 2; break;
            case ChannelOrder.RGB: numChannels = 3; break;
            case ChannelOrder.RGBA: numChannels = 4; break;
            case ChannelOrder.ARGB: numChannels = 4; break;
            case ChannelOrder.BGRA: numChannels = 4; break;
            case ChannelOrder.sRGB: numChannels = 3; break;
            case ChannelOrder.sRGBA: numChannels = 4; break;
            case ChannelOrder.D: numChannels = 1; break;
            case ChannelOrder.S: numChannels = 1; break;
            case ChannelOrder.DS: numChannels = 2; break;
            default: DE_ASSERT(false);
        }

        switch (this.type)
        {
            case ChannelType.SNORM_INT8: channelSize = 1; break;
            case ChannelType.SNORM_INT16: channelSize = 2; break;
            case ChannelType.SNORM_INT32: channelSize = 4; break;
            case ChannelType.UNORM_INT8: channelSize = 1; break;
            case ChannelType.UNORM_INT16: channelSize = 2; break;
            case ChannelType.UNORM_INT32: channelSize = 4; break;
            case ChannelType.SIGNED_INT8: channelSize = 1; break;
            case ChannelType.SIGNED_INT16: channelSize = 2; break;
            case ChannelType.SIGNED_INT32: channelSize = 4; break;
            case ChannelType.UNSIGNED_INT8: channelSize = 1; break;
            case ChannelType.UNSIGNED_INT16: channelSize = 2; break;
            case ChannelType.UNSIGNED_INT32: channelSize = 4; break;
            case ChannelType.HALF_FLOAT: channelSize = 2; break;
            case ChannelType.FLOAT: channelSize = 4; break;
            default: DE_ASSERT(false);
        }

        return numChannels * channelSize;
    }
};

/**
 * @enum
 */
var CubeFace = {
    CUBEFACE_NEGATIVE_X: 0,
    CUBEFACE_POSITIVE_X: 1,
    CUBEFACE_NEGATIVE_Y: 2,
    CUBEFACE_POSITIVE_Y: 3,
    CUBEFACE_NEGATIVE_Z: 4,
    CUBEFACE_POSITIVE_Z: 5,
};

/**
 * Renamed from ArrayBuffer due to name clash
 * Wraps ArrayBuffer.
 * @constructor
 */
var DeqpArrayBuffer = function(numElements) {
    if (numElements)
        this.m_ptr = new ArrayBuffer(numElements);
};

/**
 * Set array size
 * @param {Number} numElements Size in bytes
 */
DeqpArrayBuffer.prototype.setStorage = function(numElements) {
    this.m_ptr = new ArrayBuffer(numElements);
};

/**
 * @return {Number} Buffer size
 */
DeqpArrayBuffer.prototype.size = function() {
    if (this.m_ptr)
        return this.m_ptr.byteLength;

    return 0;
};

/**
 * Is the buffer empty (zero size)?
 * @return {boolean}
 */
DeqpArrayBuffer.prototype.empty = function() {
    if (!this.m_ptr)
        return true;
    return this.size() == 0;
};

/**
 * @enum
 * The values are negative to avoid conflict with channels 0 - 3
 */
var channel = {
    ZERO: -1,
    ONE: -2
};

/**
 * @param {ChannelOrder} order
 * @return {Array<Number|channel>}
 */
var getChannelReadMap = function(order) {
    switch (order) {
    /*static const Channel INV[]    = { channel.ZERO,    channel.ZERO,    channel.ZERO,    channel.ONE }; */

    case ChannelOrder.R: return [0, channel.ZERO, channel.ZERO, channel.ONE];
    case ChannelOrder.A: return [channel.ZERO, channel.ZERO, channel.ZERO, 0];
    case ChannelOrder.I: return [0, 0, 0, 0];
    case ChannelOrder.L: return [0, 0, 0, channel.ONE];
    case ChannelOrder.LA: return [0, 0, 0, 1];
    case ChannelOrder.RG: return [0, 1, channel.ZERO, channel.ONE];
    case ChannelOrder.RA: return [0, channel.ZERO, channel.ZERO, 1];
    case ChannelOrder.RGB: return [0, 1, 2, channel.ONE];
    case ChannelOrder.RGBA: return [0, 1, 2, 3];
    case ChannelOrder.BGRA: return [2, 1, 0, 3];
    case ChannelOrder.ARGB: return [1, 2, 3, 0];
    case ChannelOrder.sRGB: return [0, 1, 2, channel.ONE];
    case ChannelOrder.sRGBA: return [0, 1, 2, 3];
    case ChannelOrder.D: return [0, channel.ZERO, channel.ZERO, channel.ONE];
    case ChannelOrder.S: return [channel.ZERO, channel.ZERO, channel.ZERO, 0];
    case ChannelOrder.DS: return [0, channel.ZERO, channel.ZERO, 1];
    }

    throw new Error('Unrecognized order ' + order);
};

/**
 * @param {ChannelOrder} order
 * @return {Array<Number>}
 */
var getChannelWriteMap = function(order) {
    switch (order) {
        case ChannelOrder.R: return [0];
        case ChannelOrder.A: return [3];
        case ChannelOrder.I: return [0];
        case ChannelOrder.L: return [0];
        case ChannelOrder.LA: return [0, 3];
        case ChannelOrder.RG: return [0, 1];
        case ChannelOrder.RA: return [0, 3];
        case ChannelOrder.RGB: return [0, 1, 2];
        case ChannelOrder.RGBA: return [0, 1, 2, 3];
        case ChannelOrder.ARGB: return [3, 0, 1, 2];
        case ChannelOrder.BGRA: return [2, 1, 0, 3];
        case ChannelOrder.sRGB: return [0, 1, 2];
        case ChannelOrder.sRGBA: return [0, 1, 2, 3];
        case ChannelOrder.D: return [0];
        case ChannelOrder.S: return [3];
        case ChannelOrder.DS: return [0, 3];
    }
    throw new Error('Unrecognized order ' + order);
};

/**
 * @param {ChannelType} type
 * @return {Number}
 */
var getChannelSize = function(type) {
    switch (type) {
        case ChannelType.SNORM_INT8: return 1;
        case ChannelType.SNORM_INT16: return 2;
        case ChannelType.SNORM_INT32: return 4;
        case ChannelType.UNORM_INT8: return 1;
        case ChannelType.UNORM_INT16: return 2;
        case ChannelType.UNORM_INT32: return 4;
        case ChannelType.SIGNED_INT8: return 1;
        case ChannelType.SIGNED_INT16: return 2;
        case ChannelType.SIGNED_INT32: return 4;
        case ChannelType.UNSIGNED_INT8: return 1;
        case ChannelType.UNSIGNED_INT16: return 2;
        case ChannelType.UNSIGNED_INT32: return 4;
        case ChannelType.HALF_FLOAT: return 2;
        case ChannelType.FLOAT: return 4;

    }
    throw new Error('Unrecognized type ' + type);
};

/**
 * @param {Number} src Source value
 * @param {Number} bits Source value size in bits
 * @return {Number} Normalized value
 */
var channelToNormFloat = function(src, bits) {
    var maxVal = (1 << bits) - 1;
    return src / maxVal;
};

/**
 * @param {Number} value Source value
 * @param {ChannelType} type
 * @return {Number} Source value converted to float
 */
var channelToFloat = function(value, type) {
    switch (type) {
        case ChannelType.SNORM_INT8: return Math.max(-1, value / 127);
        case ChannelType.SNORM_INT16: return Math.max(-1, value / 32767);
        case ChannelType.SNORM_INT32: return Math.max(-1, value / 2147483647);
        case ChannelType.UNORM_INT8: return value / 255;
        case ChannelType.UNORM_INT16: return value / 65535;
        case ChannelType.UNORM_INT32: return value / 4294967295;
        case ChannelType.SIGNED_INT8: return value;
        case ChannelType.SIGNED_INT16: return value;
        case ChannelType.SIGNED_INT32: return value;
        case ChannelType.UNSIGNED_INT8: return value;
        case ChannelType.UNSIGNED_INT16: return value;
        case ChannelType.UNSIGNED_INT32: return value;
        case ChannelType.HALF_FLOAT: return tcuFloat.halfFloatToNumber(value);
        case ChannelType.FLOAT: return value;
    }
    throw new Error('Unrecognized channel type ' + type);
};

/**
 * @param {Number} value Source value
 * @param {ChannelType} type
 * @return {Number} Source value converted to int
 */
var channelToInt = function(value, type) {
    switch (type) {
        case ChannelType.HALF_FLOAT: return Math.round(tcuFloat.halfFloatToNumber(value));
        case ChannelType.FLOAT: return Math.round(value);
        default:
            return value;
    }
};

/**
 * @param {ChannelOrder} order
 * @return {Number}
 */
var getNumUsedChannels = function(order) {
    switch (order) {
        case ChannelOrder.R: return 1;
        case ChannelOrder.A: return 1;
        case ChannelOrder.I: return 1;
        case ChannelOrder.L: return 1;
        case ChannelOrder.LA: return 2;
        case ChannelOrder.RG: return 2;
        case ChannelOrder.RA: return 2;
        case ChannelOrder.RGB: return 3;
        case ChannelOrder.RGBA: return 4;
        case ChannelOrder.ARGB: return 4;
        case ChannelOrder.BGRA: return 4;
        case ChannelOrder.sRGB: return 3;
        case ChannelOrder.sRGBA: return 4;
        case ChannelOrder.D: return 1;
        case ChannelOrder.S: return 1;
        case ChannelOrder.DS: return 2;
    }
    throw new Error('Unrecognized channel order ' + order);
};

/**
 * @enum
 */
var WrapMode = {
    CLAMP_TO_EDGE: 0,    //! Clamp to edge
    CLAMP_TO_BORDER: 1,    //! Use border color at edge
    REPEAT_GL: 2,            //! Repeat with OpenGL semantics
    REPEAT_CL: 3,            //! Repeat with OpenCL semantics
    MIRRORED_REPEAT_GL: 4,    //! Mirrored repeat with OpenGL semantics
    MIRRORED_REPEAT_CL: 5 //! Mirrored repeat with OpenCL semantics
};

/**
 * @enum
 */
var FilterMode = {
    NEAREST: 0,
    LINEAR: 1,

    NEAREST_MIPMAP_NEAREST: 2,
    NEAREST_MIPMAP_LINEAR: 3,
    LINEAR_MIPMAP_NEAREST: 4,
    LINEAR_MIPMAP_LINEAR: 5
};

/**
 * @enum
 */
var CompareMode = {
    COMPAREMODE_NONE: 0,
    COMPAREMODE_LESS: 1,
    COMPAREMODE_LESS_OR_EQUAL: 2,
    COMPAREMODE_GREATER: 3,
    COMPAREMODE_GREATER_OR_EQUAL: 4,
    COMPAREMODE_EQUAL: 5,
    COMPAREMODE_NOT_EQUAL: 6,
    COMPAREMODE_ALWAYS: 7,
    COMPAREMODE_NEVER: 8
};

/**
 * @constructor
 * @param {WrapMode} wrapS
 * @param {WrapMode} wrapT
 * @param {WrapMode} wrapR
 * @param {FilterMode} minFilter
 * @param {FilterMode} magFilter
 * @param {Number} lodThreshold
 * @param {boolean} normalizedCoords
 * @param {CompareMode} compare
 * @param {Number} compareChannel
 * @param {Array<Number>} borderColor
 * @param {boolean} seamlessCubeMap
 */
var Sampler = function(wrapS, wrapT, wrapR, minFilter, magFilter, lodThreshold, normalizedCoords, compare, compareChannel, borderColor, seamlessCubeMap) {
    this.wrapS = wrapS;
    this.wrapT = wrapT;
    this.wrapR = wrapR;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.lodThreshold = lodThreshold || 0;
    this.normalizedCoords = normalizedCoords || true;
    this.compare = compare || CompareMode.COMPAREMODE_NONE;
    this.compareChannel = compareChannel || 0;
    this.borderColor = borderColor || [0, 0, 0, 0];
    this.seamlessCubeMap = seamlessCubeMap || false;
};

/**
 * Special unnormalization for REPEAT_CL and MIRRORED_REPEAT_CL wrap modes; otherwise ordinary unnormalization.
 * @param {WrapMode} mode
 * @param {Number} c Value to unnormalize
 * @param {Number} size Unnormalized type size (integer)
 * @return {Number}
 */
var unnormalize = function(mode, c, size) {
    switch (mode) {
        case WrapMode.CLAMP_TO_EDGE:
        case WrapMode.CLAMP_TO_BORDER:
        case WrapMode.REPEAT_GL:
        case WrapMode.MIRRORED_REPEAT_GL: // Fall-through (ordinary case).
            return size * c;

        case WrapMode.REPEAT_CL:
            return size * (c - Math.floor(c));

        case WrapMode.MIRRORED_REPEAT_CL:
            return size * Math.abs(c - 2 * deMath.rint(0.5 * c));
    }
    throw new Error('Unrecognized wrap mode ' + mode);
};

/**
 * @param {WrapMode} mode
 * @param {Number} c Source value (integer)
 * @param {Number} size Type size (integer)
 * @return {Number}
 */
var wrap = function(mode, c, size) {
    switch (mode) {
        case WrapMode.CLAMP_TO_BORDER:
            return deMath.clamp(c, -1, size);

        case WrapMode.CLAMP_TO_EDGE:
            return deMath.clamp(c, 0, size - 1);

        case WrapMode.REPEAT_GL:
            return deMath.imod(c, size);

        case WrapMode.REPEAT_CL:
            return deMath.imod(c, size);

        case WrapMode.MIRRORED_REPEAT_GL:
            return (size - 1) - deMath.mirror(deMath.imod(c, 2 * size) - size);

        case WrapMode.MIRRORED_REPEAT_CL:
            return deMath.clamp(c, 0, size - 1); // \note Actual mirroring done already in unnormalization function.
    }
    throw new Error('Unrecognized wrap mode ' + mode);
};

/**
 * @param {Number} cs
 * @return {Number}
 */
var sRGBChannelToLinear = function(cs) {
    if (cs <= 0.04045)
        return cs / 12.92;
    else
        return Math.pow((cs + 0.055) / 1.055, 2.4);
};

/**
 * Convert sRGB to linear colorspace
 * @param {Array<Number>} cs Vec4
 * @return {Array<Number>} Vec4
 */
var sRGBToLinear = function(cs) {
    return [
        sRGBChannelToLinear(cs[0]),
        sRGBChannelToLinear(cs[1]),
        sRGBChannelToLinear(cs[2]),
        cs[3]
        ];
};

/**
 * Texel lookup with color conversion.
 * @param {ConstPixelBufferAccess} access
 * @param {Number} i
 * @param {Number} j
 * @param {Number} k
 * @return {Array<Number>} Vec4 pixel color
 */
var lookup = function(access, i, j, k) {
    var p = access.getPixel(i, j, k);
    // console.log('Lookup at ' + i + ' ' + j + ' ' + k + ' ' + p);
    return access.getFormat().isSRGB() ? sRGBToLinear(p) : p;
};

/**
 * @param {ConstPixelBufferAccess} access
 * @param {Sampler} sampler
 * @param {Number} u
 * @param {Number} v
 * @param {Number} depth (integer)
 * @return {Array<Number>} Vec4 pixel color
 */
var sampleNearest2D = function(access, sampler, u, v, depth) {
    var width = access.getWidth();
    var height = access.getHeight();

    /* TODO: Shouldn't it be just Math.round? */
    var x = Math.round(Math.floor(u));
    var y = Math.round(Math.floor(v));

    // Check for CLAMP_TO_BORDER.
    if ((sampler.wrapS == WrapMode.CLAMP_TO_BORDER && !deMath.deInBounds32(x, 0, width)) ||
        (sampler.wrapT == WrapMode.CLAMP_TO_BORDER && !deMath.deInBounds32(y, 0, height)))
        return sampler.borderColor;

    var i = wrap(sampler.wrapS, x, width);
    var j = wrap(sampler.wrapT, y, height);

    return lookup(access, i, j, depth);
};

/**
 * @param {ConstPixelBufferAccess} access
 * @param {Sampler} sampler
 * @param {Number} u
 * @param {Number} v
 * @param {Number} w
 * @return {Array<Number>} Vec4 pixel color
 */
var sampleNearest3D = function(access, sampler, u, v, w) {
    var width = access.getWidth();
    var height = access.getHeight();
    var depth = access.getDepth();

    var x = Math.round(Math.floor(u));
    var y = Math.round(Math.floor(v));
    var z = Math.round(Math.floor(w));

    // Check for CLAMP_TO_BORDER.
    if ((sampler.wrapS == WrapMode.CLAMP_TO_BORDER && !deMath.deInBounds32(x, 0, width)) ||
        (sampler.wrapT == WrapMode.CLAMP_TO_BORDER && !deMath.deInBounds32(y, 0, height)) ||
        (sampler.wrapR == WrapMode.CLAMP_TO_BORDER && !deMath.deInBounds32(z, 0, depth)))
        return sampler.borderColor;

    var i = wrap(sampler.wrapS, x, width);
    var j = wrap(sampler.wrapT, y, height);
    var k = wrap(sampler.wrapR, z, depth);

    return lookup(access, i, j, k);
};

/**
 * @param {Array<Number>} color Vec4 color
 * @return {Number} The color in packed 32 bit format
 */
var packRGB999E5 = function(color) {
    /** @const */ var mBits = 9;
    /** @const */ var eBits = 5;
    /** @const */ var eBias = 15;
    /** @const */ var eMax = (1 << eBits) - 1;
    /** @const */ var maxVal = (((1 << mBits) - 1) * (1 << (eMax - eBias))) / (1 << mBits);

    var rc = deMath.clamp(color[0], 0, maxVal);
    var gc = deMath.clamp(color[1], 0, maxVal);
    var bc = deMath.clamp(color[2], 0, maxVal);
    var maxc = Math.max(rc, gc, bc);
    var expp = Math.max(-eBias - 1, Math.floor(Math.log2(maxc))) + 1 + eBias;
    var e = Math.pow(2, expp - eBias - mBits);
    var maxs = Math.floor(maxc / e + 0.5);

    var exps = maxs == (1 << mBits) ? expp + 1 : expp;
    var rs = deMath.clamp(Math.floor(rc / e + 0.5), 0, (1 << 9) - 1);
    var gs = deMath.clamp(Math.floor(gc / e + 0.5), 0, (1 << 9) - 1);
    var bs = deMath.clamp(Math.floor(bc / e + 0.5), 0, (1 << 9) - 1);

    DE_ASSERT((exps & ~((1 << 5) - 1)) == 0);
    DE_ASSERT((rs & ~((1 << 9) - 1)) == 0);
    DE_ASSERT((gs & ~((1 << 9) - 1)) == 0);
    DE_ASSERT((bs & ~((1 << 9) - 1)) == 0);

    return rs | (gs << 9) | (bs << 18) | (exps << 27);
};

/**
 * @param {Number} color Color in packed 32 bit format
 * @return {Array<Number>} The color in unpacked format
 */
var unpackRGB999E5 = function(color) {
    var mBits = 9;
    var eBias = 15;

    var exp = (color >> 27) & ((1 << 5) - 1);
    var bs = (color >> 18) & ((1 << 9) - 1);
    var gs = (color >> 9) & ((1 << 9) - 1);
    var rs = color & ((1 << 9) - 1);

    var e = Math.pow(2, (exp - eBias - mBits));
    var r = rs * e;
    var g = gs * e;
    var b = bs * e;

    return [r, g, b, 1];
};

/**
 * \brief Read-only pixel data access
 *
 * ConstPixelBufferAccess encapsulates pixel data pointer along with
 * format and layout information. It can be used for read-only access
 * to arbitrary pixel buffers.
 *
 * Access objects are like iterators or pointers. They can be passed around
 * as values and are valid as long as the storage doesn't change.
 * @constructor
 */
var ConstPixelBufferAccess = function(descriptor) {
    if (descriptor) {
        this.m_offset = descriptor.offset || 0;
        this.m_format = descriptor.format || new TextureFormat(ChannelOrder.RGBA, ChannelType.FLOAT);
        this.m_width = descriptor.width;
        this.m_height = descriptor.height;
        if (descriptor.depth)
            this.m_depth = descriptor.depth;
        else
            this.m_depth = 1;
        this.m_data = descriptor.data;
        if (descriptor.rowPitch)
            this.m_rowPitch = descriptor.rowPitch;
        else
            this.m_rowPitch = this.m_width * this.m_format.getPixelSize();

        if (descriptor.slicePitch)
            this.m_slicePitch = descriptor.slicePitch;
        else
            this.m_slicePitch = this.m_rowPitch * this.m_height;
    }
};

/** @return {Number} */
ConstPixelBufferAccess.prototype.getDataSize = function() { return this.m_depth * this.m_slicePitch; };
ConstPixelBufferAccess.prototype.isEmpty = function() { return this.m_width == 0 || this.m_height == 0 || this.m_depth == 0; };
/** @return {TypedArray} */
ConstPixelBufferAccess.prototype.getDataPtr = function() {
    var arrayType = getTypedArray(this.m_format.type);
    return new arrayType(this.m_data, this.m_offset);
};
/** @return {ArrayBuffer} */
ConstPixelBufferAccess.prototype.getBuffer = function() {
    return this.m_data;
};
/** @return {Number} */
ConstPixelBufferAccess.prototype.getRowPitch = function() { return this.m_rowPitch; };
/** @return {Number} */
ConstPixelBufferAccess.prototype.getWidth = function() { return this.m_width; };
/** @return {Number} */
ConstPixelBufferAccess.prototype.getHeight = function() { return this.m_height; };
/** @return {Number} */
ConstPixelBufferAccess.prototype.getDepth = function() { return this.m_depth; };
/** @return {Number} */
ConstPixelBufferAccess.prototype.getSlicePitch = function() { return this.m_slicePitch; };
/** @return {TextureFormat} */
ConstPixelBufferAccess.prototype.getFormat = function() { return this.m_format; };

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @return {Array<Number>} Pixel value as Vec4
 */
ConstPixelBufferAccess.prototype.getPixel = function(x, y, z) {
    if (z == null)
        z = 0;
    // console.log(this);
    // console.log('(' + x + ',' + y + ',' + z + ')');

    DE_ASSERT(deMath.deInBounds32(x, 0, this.m_width));
    DE_ASSERT(deMath.deInBounds32(y, 0, this.m_height));
    DE_ASSERT(deMath.deInBounds32(z, 0, this.m_depth));

    var pixelSize = this.m_format.getPixelSize();
    var arrayType = getTypedArray(this.m_format.type);
    var offset = z * this.m_slicePitch + y * this.m_rowPitch + x * pixelSize;
    var pixelPtr = new arrayType(this.m_data, offset + this.m_offset);

    var ub = function(pixel, offset, count) {
        return (pixel >> offset) & ((1 << count) - 1);
    };
    var nb = function(pixel, offset, count) {
        return channelToNormFloat(ub(pixel, offset, count), count);
    };

    var pixel = pixelPtr[0];

    // Packed formats.
    switch (this.m_format.type) {
        case ChannelType.UNORM_SHORT_565: return [nb(pixel, 11, 5), nb(pixel, 5, 6), nb(pixel, 0, 5), 1];
        case ChannelType.UNORM_SHORT_555: return [nb(pixel, 10, 5), nb(pixel, 5, 5), nb(pixel, 0, 5), 1];
        case ChannelType.UNORM_SHORT_4444: return [nb(pixel, 12, 4), nb(pixel, 8, 4), nb(pixel, 4, 4), nb(pixel, 0, 4)];
        case ChannelType.UNORM_SHORT_5551: return [nb(pixel, 11, 5), nb(pixel, 6, 5), nb(pixel, 1, 5), nb(pixel, 0, 1)];
        case ChannelType.UNORM_INT_101010: return [nb(pixel, 22, 10), nb(pixel, 12, 10), nb(pixel, 2, 10), 1];
        case ChannelType.UNORM_INT_1010102_REV: return [nb(pixel, 0, 10), nb(pixel, 10, 10), nb(pixel, 20, 10), nb(pixel, 30, 2)];
        case ChannelType.UNSIGNED_INT_1010102_REV: return [ub(pixel, 0, 10), ub(pixel, 10, 10), ub(pixel, 20, 10), ub(pixel, 30, 2)];
        case ChannelType.UNSIGNED_INT_999_E5_REV: return unpackRGB999E5(pixel);

        case ChannelType.UNSIGNED_INT_24_8:
            switch (this.m_format.order) {
                // \note Stencil is always ignored.
                case ChannelOrder.D: return [nb(pixel, 8, 24), 0, 0, 1];
                case ChannelOrder.DS: return [nb(pixel, 8, 24), 0, 0, 1 /* (float)ub(0, 8) */];
                default:
                    DE_ASSERT(false);
            }

        case ChannelType.FLOAT_UNSIGNED_INT_24_8_REV: {
            DE_ASSERT(this.m_format.order == ChannelOrder.DS);
            // \note Stencil is ignored.
            return [pixel, 0, 0, 1];
        }

        case ChannelType.UNSIGNED_INT_11F_11F_10F_REV: {
            var f11 = function(value) {
                return tcuFloat.float11ToNumber(value);
            };
            var f10 = function(value) {
                return tcuFloat.float10ToNumber(value);
            };
            return [f11(ub(pixel, 0, 11)), f11(ub(pixel, 11, 11)), f10(ub(pixel, 22, 10)), 1];
        }

        default:
            break;
    }

    // Generic path.
    var result = [];
    result.length = 4;
    var channelMap = getChannelReadMap(this.m_format.order);
    var channelSize = getChannelSize(this.m_format.type);

    for (var c = 0; c < 4; c++) {
        var map = channelMap[c];
        if (map == channel.ZERO)
            result[c] = 0;
        else if (map == channel.ONE)
            result[c] = 1;
        else
            result[c] = channelToFloat(pixelPtr[map], this.m_format.type);
    }

    return result;
};

/**
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @return {Array<Number>} Pixel value as Vec4
 */
ConstPixelBufferAccess.prototype.getPixelInt = function(x, y, z) {
    if (z == null)
        z = 0;
    DE_ASSERT(deMath.deInBounds32(x, 0, this.m_width));
    DE_ASSERT(deMath.deInBounds32(y, 0, this.m_height));
    DE_ASSERT(deMath.deInBounds32(z, 0, this.m_depth));

    var pixelSize = this.m_format.getPixelSize();
    var arrayType = getTypedArray(this.m_format.type);
    var offset = z * this.m_slicePitch + y * this.m_rowPitch + x * pixelSize;
    var pixelPtr = new arrayType(this.m_data, offset + this.m_offset);

    var ub = function(pixel, offset, count) {
        return (pixel >> offset) & ((1 << count) - 1);
    };

    var pixel = pixelPtr[0];

    // Packed formats.
    switch (this.m_format.type) {
        case ChannelType.UNORM_SHORT_565: return [ub(pixel, 11, 5), ub(pixel, 5, 6), ub(pixel, 0, 5), 1];
        case ChannelType.UNORM_SHORT_555: return [ub(pixel, 10, 5), ub(pixel, 5, 5), ub(pixel, 0, 5), 1];
        case ChannelType.UNORM_SHORT_4444: return [ub(pixel, 12, 4), ub(pixel, 8, 4), ub(pixel, 4, 4), ub(pixel, 0, 4)];
        case ChannelType.UNORM_SHORT_5551: return [ub(pixel, 11, 5), ub(pixel, 6, 5), ub(pixel, 1, 5), ub(pixel, 0, 1)];
        case ChannelType.UNORM_INT_101010: return [ub(pixel, 22, 10), ub(pixel, 12, 10), ub(pixel, 2, 10), 1];
        case ChannelType.UNORM_INT_1010102_REV: return [ub(pixel, 0, 10), ub(pixel, 10, 10), ub(pixel, 20, 10), ub(pixel, 30, 2)];
        case ChannelType.UNSIGNED_INT_1010102_REV: return [ub(pixel, 0, 10), ub(pixel, 10, 10), ub(pixel, 20, 10), ub(pixel, 30, 2)];

        case ChannelType.UNSIGNED_INT_24_8:
            switch (this.m_format.order) {
                // \note Stencil is always ignored.
                case ChannelOrder.D: return [ub(pixel, 8, 24), 0, 0, 1];
                case ChannelOrder.DS: return [ub(pixel, 8, 24), 0, 0, 1 /* (float)ub(0, 8) */];
                default:
                    DE_ASSERT(false);
            }

        case ChannelType.FLOAT_UNSIGNED_INT_24_8_REV: {
            DE_ASSERT(this.m_format.order == ChannelOrder.DS);
            // \note Stencil is ignored.
            return [pixel, 0, 0, 1];
        }

        default:
            break;
    }

    // Generic path.
    var result = [];
    result.length = 4;
    var channelMap = getChannelReadMap(this.m_format.order);
    var channelSize = getChannelSize(this.m_format.type);

    for (var c = 0; c < 4; c++) {
        var map = channelMap[c];
        if (map == channel.ZERO)
            result[c] = 0;
        else if (map == channel.ONE)
            result[c] = 1;
        else
            result[c] = channelToInt(pixelPtr[map], this.m_format.type);
    }

    return result;
};

/**
 * @param {Sampler} sampler
 * @param {FilterMode} filter
 * @param {Number} s
 * @param {Number} t
 * @param {Number} depth (integer)
 * @return {Array<Number>} Sample color
 */
ConstPixelBufferAccess.prototype.sample2D = function(sampler, filter, s, t, depth) {
    DE_ASSERT(deMath.deInBounds32(depth, 0, this.m_depth));

    // Non-normalized coordinates.
    var u = s;
    var v = t;

    if (sampler.normalizedCoords) {
        u = unnormalize(sampler.wrapS, s, this.m_width);
        v = unnormalize(sampler.wrapT, t, this.m_height);
    }

    switch (filter) {
        case FilterMode.NEAREST: return sampleNearest2D(this, sampler, u, v, depth);
        // case Sampler::LINEAR:    return sampleLinear2D    (*this, sampler, u, v, depth);
        // default:
        //     DE_ASSERT(false);
        //     return Vec4(0.0f);
    }
    throw new Error('Unimplemented');
};

/**
 * @param {Sampler} sampler
 * @param {FilterMode} filter
 * @param {Number} s
 * @param {Number} t
 * @param {Number} r
 * @return {Array<Number>} Sample color
 */
ConstPixelBufferAccess.prototype.sample3D = function(sampler, filter, s, t, r) {
    // Non-normalized coordinates.
    var u = s;
    var v = t;
    var w = r;

    if (sampler.normalizedCoords) {
        u = unnormalize(sampler.wrapS, s, this.m_width);
        v = unnormalize(sampler.wrapT, t, this.m_height);
        w = unnormalize(sampler.wrapR, r, this.m_depth);
    }

    switch (filter) {
        case FilterMode.NEAREST: return sampleNearest3D(this, sampler, u, v, w);
        // case Sampler::LINEAR:    return sampleLinear3D    (*this, sampler, u, v, w);
        // default:
        //     DE_ASSERT(false);
        //     return Vec4(0.0f);
    }
    throw new Error('Unimplemented');
};

    /* TODO: do we need any of these? */
    {
        // template<typename T>
        // Vector<T, 4>            getPixelT                    (int x, int y, int z = 0) const;

        // float                    getPixDepth                    (int x, int y, int z = 0) const;
        // int                        getPixStencil                (int x, int y, int z = 0) const;

        // Vec4                    sample1D                    (const Sampler& sampler, Sampler::FilterMode filter, float s, int level) const;
        // Vec4                    sample3D                    (const Sampler& sampler, Sampler::FilterMode filter, float s, float t, float r) const;

        // Vec4                    sample1DOffset                (const Sampler& sampler, Sampler::FilterMode filter, float s, const IVec2& offset) const;
        // Vec4                    sample2DOffset                (const Sampler& sampler, Sampler::FilterMode filter, float s, float t, const IVec3& offset) const;
        // Vec4                    sample3DOffset                (const Sampler& sampler, Sampler::FilterMode filter, float s, float t, float r, const IVec3& offset) const;

        // float                    sample1DCompare                (const Sampler& sampler, Sampler::FilterMode filter, float ref, float s, const IVec2& offset) const;
        // float                    sample2DCompare                (const Sampler& sampler, Sampler::FilterMode filter, float ref, float s, float t, const IVec3& offset) const;
    };

/* Common type limits */
var deTypes = {
    deInt8: {min: -(1 << 7), max: (1 << 7) - 1},
    deInt16: {min: -(1 << 15), max: (1 << 15) - 1},
    deMath: {min: -(1 << 31), max: (1 << 31) - 1},
    deUint8: {min: 0, max: (1 << 8) - 1},
    deUint16: {min: 0, max: (1 << 16) - 1},
    deUint32: {min: 0, max: 4294967295}
};

/**
 * Round to even and saturate
 * @param {deTypes} deType
 * @param {Number} value
 * @return {Number}
 */
var convertSatRte = function(deType, value) {
    var minVal = deType.min;
    var maxVal = deType.max;
    var floor = Math.floor(value);
    var frac = value - floor;
    if (frac == 0.5)
        if (floor % 2 != 0)
            floor += 1;
    else if (frac > 0.5)
        floor += 1;

    return Math.max(minVal, Math.min(maxVal, floor));
};

/**
 * @param {Number} src
 * @param {Number} bits
 * @return {Number}
 */
var normFloatToChannel = function(src, bits) {
    var maxVal = (1 << bits) - 1;
    var intVal = convertSatRte(deTypes.deUint32, src * maxVal);
    return Math.min(maxVal, intVal);
};

/**
 * @param {Number} src
 * @param {Number} bits
 * @return {Number}
 */
var uintToChannel = function(src, bits) {
    var maxVal = (1 << bits) - 1;
    return Math.min(maxVal, src);
};

/**
 * @param {Number} src
 * @param {ChannelType} type
 * @return {Number} Converted src color value
 */
var floatToChannel = function(src, type) {
    switch (type)
    {
        case ChannelType.SNORM_INT8: return convertSatRte(deTypes.deInt8, src * 127);
        case ChannelType.SNORM_INT16: return convertSatRte(deTypes.deInt16, src * 32767);
        case ChannelType.SNORM_INT32: return convertSatRte(deTypes.deMath, src * 2147483647);
        case ChannelType.UNORM_INT8: return convertSatRte(deTypes.deUint8, src * 255);
        case ChannelType.UNORM_INT16: return convertSatRte(deTypes.deUint16, src * 65535);
        case ChannelType.UNORM_INT32: return convertSatRte(deTypes.deUint32, src * 4294967295);
        case ChannelType.SIGNED_INT8: return convertSatRte(deTypes.deInt8, src);
        case ChannelType.SIGNED_INT16: return convertSatRte(deTypes.deInt16, src);
        case ChannelType.SIGNED_INT32: return convertSatRte(deTypes.deMath, src);
        case ChannelType.UNSIGNED_INT8: return convertSatRte(deTypes.deUint8, src);
        case ChannelType.UNSIGNED_INT16: return convertSatRte(deTypes.deUint16, src);
        case ChannelType.UNSIGNED_INT32: return convertSatRte(deTypes.deUint32, src);
        case ChannelType.HALF_FLOAT: return tcuFloat.numberToHalfFloat(src);
        case ChannelType.FLOAT: return src;
    }
    throw new Error('Unrecognized type ' + type);
};

/**
 * \brief Read-write pixel data access
 *
 * This class extends read-only access object by providing write functionality.
 *
 * \note PixelBufferAccess may not have any data members nor add any
 *         virtual functions. It must be possible to reinterpret_cast<>
 *         PixelBufferAccess to ConstPixelBufferAccess.
 * @constructor
 * @extends {ConstPixelBufferAccess}
 *
 */
var PixelBufferAccess = function(descriptor) {
    ConstPixelBufferAccess.call(this, descriptor);
};

PixelBufferAccess.prototype = Object.create(ConstPixelBufferAccess.prototype);
PixelBufferAccess.prototype.constructor = PixelBufferAccess;

/**
 * @param {Array<Number>} color Vec4 color to set
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
PixelBufferAccess.prototype.setPixel = function(color, x, y, z) {
    if (z == null)
        z = 0;
    DE_ASSERT(deMath.deInBounds32(x, 0, this.m_width));
    DE_ASSERT(deMath.deInBounds32(y, 0, this.m_height));
    DE_ASSERT(deMath.deInBounds32(z, 0, this.m_depth));

    var pixelSize = this.m_format.getPixelSize();
    var arrayType = getTypedArray(this.m_format.type);
    var offset = z * this.m_slicePitch + y * this.m_rowPitch + x * pixelSize;
    var pixelPtr = new arrayType(this.m_data, offset + this.m_offset);

    var pn = function(val, offs, bits) {
        return normFloatToChannel(val, bits) << offs;
    };

    var pu = function(val, offs, bits) {
        return uintToChannel(val, bits) << offs;
    };

    // Packed formats.
    switch (this.m_format.type) {
        case ChannelType.UNORM_SHORT_565: pixelPtr[0] = pn(color[0], 11, 5) | pn(color[1], 5, 6) | pn(color[2], 0, 5); break;
        case ChannelType.UNORM_SHORT_555: pixelPtr[0] = pn(color[0], 10, 5) | pn(color[1], 5, 5) | pn(color[2], 0, 5); break;
        case ChannelType.UNORM_SHORT_4444: pixelPtr[0] = pn(color[0], 12, 4) | pn(color[1], 8, 4) | pn(color[2], 4, 4) | pn(color[3], 0, 4); break;
        case ChannelType.UNORM_SHORT_5551: pixelPtr[0] = pn(color[0], 11, 5) | pn(color[1], 6, 5) | pn(color[2], 1, 5) | pn(color[3], 0, 1); break;
        case ChannelType.UNORM_INT_101010: pixelPtr[0] = pn(color[0], 22, 10) | pn(color[1], 12, 10) | pn(color[2], 2, 10); break;
        case ChannelType.UNORM_INT_1010102_REV: pixelPtr[0] = pn(color[0], 0, 10) | pn(color[1], 10, 10) | pn(color[2], 20, 10) | pn(color[3], 30, 2); break;
        case ChannelType.UNSIGNED_INT_1010102_REV: pixelPtr[0] = pu(color[0], 0, 10) | pu(color[1], 10, 10) | pu(color[2], 20, 10) | pu(color[3], 30, 2); break;
        case ChannelType.UNSIGNED_INT_999_E5_REV: pixelPtr[0] = packRGB999E5(color); break;

        case ChannelType.UNSIGNED_INT_24_8:
            switch (this.m_format.order) {
                // \note Stencil is always ignored.
                case ChannelOrder.D: pixelPtr[0] = pn(color[0], 8, 24); break;
                case ChannelOrder.S: pixelPtr[0] = pn(color[3], 8, 24); break;
                case ChannelOrder.DS: pixelPtr[0] = pn(color[0], 8, 24) | pu(color[3], 0, 8); break;
                default:
                    throw new Error('Unsupported channel order ' + this.m_format.order);
            }
            break;

        case ChannelType.FLOAT_UNSIGNED_INT_24_8_REV: {
            pixelPtr[0] = color[0];
            var u32array = new Uint32Array(this.m_data, offset + 4, 1);
            u32array[0] = pu(color[3], 0, 8);
            break;
        }

        case ChannelType.UNSIGNED_INT_11F_11F_10F_REV: {
            var f11 = function(value) {
                return tcuFloat.numberToFloat11(value);
            };
            var f10 = function(value) {
                return tcuFloat.numberToFloat10(value);
            };

            pixelPtr[0] = f11(color[0]) | (f11(color[1]) << 11) | (f10(color[2]) << 22);
            break;
        }
        case ChannelType.FLOAT:
            if (this.m_format.order == ChannelOrder.D) {
                pixelPtr[0] = color[0];
                break;
            }
            // else fall-through to default case!

        default:
        {
            // Generic path.
            var numChannels = getNumUsedChannels(this.m_format.order);
            var map = getChannelWriteMap(this.m_format.order);

            for (var c = 0; c < numChannels; c++)
                pixelPtr[c] = floatToChannel(color[map[c]], this.m_format.type);
        }
    }
};

/**
 * @param {Array<number>=} color Vec4 color to set, optional.
 * @param {Array<number>=} x Range in x axis, optional.
 * @param {Array<number>=} y Range in y axis, optional.
 * @param {Array<number>=} z Range in z axis, optional.
 */
PixelBufferAccess.prototype.clear = function(color, x, y, z) {
    var c = color || [0, 0, 0, 0];
    /** @type {ArrayBuffer} */ var pixel = new ArrayBuffer(16);
    PixelBufferAccess.newFromTextureFormat(this.getFormat(), 1, 1, 1, 0, 0, pixel).setPixel(c, 0, 0);
    var pixelSize = this.m_format.getPixelSize();
    var arrayType = getTypedArray(this.m_format.type);
    var dst = this.getDataPtr();
    var src = new arrayType(pixel);
    var numChannels = getNumUsedChannels(this.m_format.order);
    var elemSize = arrayType.BYTES_PER_ELEMENT;
    var range_x = x || [0, this.m_width];
    var range_y = y || [0, this.m_height];
    var range_z = z || [0, this.m_depth];

    for (var slice = range_z[0]; slice < range_z[1]; slice++) {
        var slice_offset = slice * this.m_slicePitch;
        for (var row = range_y[0]; row < range_y[1]; row++) {
            var row_offset = row * this.m_rowPitch;
            for (var col = range_x[0]; col < range_x[1]; col++) {
                var col_offset = col * pixelSize;
                var index = (slice_offset + row_offset + col_offset) / elemSize;
                for (var i = 0; i < numChannels; i++) {
                    dst[index + i] = src[i];
                }
            }
        }
    }
};

/**
 * @param {number} depth to set
 * @param {number} x
 * @param {number} y
 * @param {number=} z
 */
PixelBufferAccess.prototype.setPixDepth = function(depth, x, y, z) {
    if (z == null)
        z = 0;
    DE_ASSERT(deMath.deInBounds32(x, 0, this.m_width));
    DE_ASSERT(deMath.deInBounds32(y, 0, this.m_height));
    DE_ASSERT(deMath.deInBounds32(z, 0, this.m_depth));

    var pixelSize = this.m_format.getPixelSize();
    var arrayType = getTypedArray(this.m_format.type);
    var offset = z * this.m_slicePitch + y * this.m_rowPitch + x * pixelSize;
    var pixelPtr = new arrayType(this.m_data, offset + this.m_offset);

    var pn = function(val, offs, bits) {
        return normFloatToChannel(val, bits) << offs;
    };


    // Packed formats.
    switch (this.m_format.type) {
        case ChannelType.UNSIGNED_INT_24_8:
            switch (this.m_format.order) {
                case ChannelOrder.D: pixelPtr[0] = pn(depth, 8, 24); break;
                case ChannelOrder.DS: pixelPtr[0] = pn(depth, 8, 24) | (pixelPtr[0] & 0xFF); break;
                default:
                    throw new Error('Unsupported channel order ' + this.m_format.order);
            }
            break;

        case ChannelType.FLOAT_UNSIGNED_INT_24_8_REV: {
            DE_ASSERT(this.m_format.order == ChannelOrder.DS);
            pixelPtr[0] = depth;
            break;
        }

        default: {
            DE_ASSERT(this.m_format.order == ChannelOrder.D || this.m_format.order == ChannelOrder.DS);
            pixelPtr[0] = floatToChannel(depth, this.m_format.type);
        }
    }
};

/**
 * @param {number} stencil to set
 * @param {number} x
 * @param {number} y
 * @param {number=} z
 */
PixelBufferAccess.prototype.setPixStencil = function(stencil, x, y, z) {
    if (z == null)
        z = 0;
    DE_ASSERT(deMath.deInBounds32(x, 0, this.m_width));
    DE_ASSERT(deMath.deInBounds32(y, 0, this.m_height));
    DE_ASSERT(deMath.deInBounds32(z, 0, this.m_depth));

    var pixelSize = this.m_format.getPixelSize();
    var arrayType = getTypedArray(this.m_format.type);
    var offset = z * this.m_slicePitch + y * this.m_rowPitch + x * pixelSize;
    var pixelPtr = new arrayType(this.m_data, offset + this.m_offset);

    var pu = function(val, offs, bits) {
        return uintToChannel(val, bits) << offs;
    };

    // Packed formats.
    switch (this.m_format.type) {
        case ChannelType.UNSIGNED_INT_24_8:
            switch (this.m_format.order) {
                case ChannelOrder.S: pixelPtr[0] = pu(stencil, 8, 24); break;
                case ChannelOrder.DS: pixelPtr[0] = pu(stencil, 0, 8) | (pixelPtr[0] & 0xFFFFFF00); break;
                default:
                    throw new Error('Unsupported channel order ' + this.m_format.order);
            }
            break;

        case ChannelType.FLOAT_UNSIGNED_INT_24_8_REV: {
            var u32array = new Uint32Array(this.m_data, offset + 4, 1);
            u32array[0] = pu(stencil, 0, 8);
            break;
        }

        default: {
            if (this.m_format.order == ChannelOrder.S)
                pixelPtr[0] = floatToChannel(stencil, this.m_format.type);
            else {
                DE_ASSERT(this.m_format.order == ChannelOrder.DS);
                pixelPtr[3] = floatToChannel(stencil, this.m_format.type);
            }
        }
    }
};

/**
 * newFromTextureLevel
 * @param {TextureLevel} level
 */
PixelBufferAccess.newFromTextureLevel = function(level) {
    var descriptor = new Object();
    descriptor.format = level.getFormat();
    descriptor.width = level.getWidth();
    descriptor.height = level.getHeight();
    descriptor.depth = level.m_depth;
    descriptor.data = level.m_data.m_ptr;

    return new PixelBufferAccess(descriptor);
};

/**
 * newFromTextureFormat
 * @param {TextureFormat} format
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @param {number} rowPitch
 * @param {number} slicePitch
 * @param {ArrayBuffer} data
 */
PixelBufferAccess.newFromTextureFormat = function(format, width, height, depth, rowPitch, slicePitch, data) {
    var descriptor = new Object();
    descriptor.format = format;
    descriptor.width = width;
    descriptor.height = height;
    descriptor.depth = depth;
    descriptor.rowPitch = rowPitch;
    descriptor.slicePitch = slicePitch;
    descriptor.data = data;

    return new PixelBufferAccess(descriptor);
};

/* TODO: Port */
// {
// public:
//                             PixelBufferAccess            (void) {}
//                             PixelBufferAccess            (const TextureFormat& format, int width, int height, int depth, void* data);


//     void*                    getDataPtr                    (void) const { return m_data; }

//     void                    setPixels                    (const void* buf, int bufSize) const;
//     void                    setPixel                    (const tcu::Vec4& color, int x, int y, int z = 0) const;
//     void                    setPixel                    (const tcu::IVec4& color, int x, int y, int z = 0) const;
//     void                    setPixel                    (const tcu::UVec4& color, int x, int y, int z = 0) const { setPixel(color.cast<int>(), x, y, z); }

//     void                    setPixDepth                    (float depth, int x, int y, int z = 0) const;
//     void                    setPixStencil                (int stencil, int x, int y, int z = 0) const;
// };

/**
 * @constructor
 * @param {TextureFormat} format
 * @param {Number} numLevels
 */
var TextureLevelPyramid = function(format, numLevels) {
    /* TextureFormat */this.m_format = format;
    /* LevelData */ this.m_data = [];
    for (var i = 0; i < numLevels; i++)
        this.m_data.push(new DeqpArrayBuffer());
    /* {Array<PixelBufferAccess>} */ this.m_access = [];
    this.m_access.length = numLevels;
};

/** @return {bool} */
TextureLevelPyramid.prototype.isLevelEmpty = function(levelNdx) { return this.m_data[levelNdx].empty(); };
/** @return {TextureFormat} */
TextureLevelPyramid.prototype.getFormat = function()            { return this.m_format; };
/** @return {Number} */
TextureLevelPyramid.prototype.getNumLevels = function()            { return this.m_access.length; };
/** @return {PixelBufferAccess} */
TextureLevelPyramid.prototype.getLevel = function(ndx)             { return this.m_access[ndx]; };
/** @return {Array<PixelBufferAccess>} */
TextureLevelPyramid.prototype.getLevels = function()            { return this.m_access; };

/**
 * @param {Number} levelNdx
 * @param {Number} width
 * @param {Number} height
 * @param {Number} depth
 */
TextureLevelPyramid.prototype.allocLevel = function(levelNdx, width, height, depth) {
    var size = this.m_format.getPixelSize() * width * height * depth;

    DE_ASSERT(this.isLevelEmpty(levelNdx));

    this.m_data[levelNdx].setStorage(size);
    this.m_access[levelNdx] = new PixelBufferAccess({
        format: this.m_format,
        width: width,
        height: height,
        depth: depth,
        data: this.m_data[levelNdx].m_ptr
    });
};

TextureLevelPyramid.prototype.clearLevel = function(levelNdx) {
    /* TODO: Implement */
    throw new Error('Not implemented');
};

/**
 * @param {Array<ConstPixelBufferAccess>} levels
 * @param {Number} numLevels
 * @param {Sampler} sampler
 * @param {Number} s
 * @param {Number} t
 * @param {Number} depth (integer)
 * @param {Number} lod
 * @return {Array<Number>} Vec4 pixel color
 */
var sampleLevelArray2D = function(levels, numLevels, sampler, s, t, depth, lod) {
    var magnified = lod <= sampler.lodThreshold;
    var filterMode = magnified ? sampler.magFilter : sampler.minFilter;

    switch (filterMode) {
        case FilterMode.NEAREST: return levels[0].sample2D(sampler, filterMode, s, t, depth);
        /* TODO: Implement other filters */
        // case Sampler::LINEAR:    return levels[0].sample2D(sampler, filterMode, s, t, depth);

        // case Sampler::NEAREST_MIPMAP_NEAREST:
        // case Sampler::LINEAR_MIPMAP_NEAREST:
        // {
        //     int                    maxLevel    = (int)numLevels-1;
        //     int                    level        = deClamp32((int)deFloatCeil(lod + 0.5f) - 1, 0, maxLevel);
        //     Sampler::FilterMode    levelFilter    = (filterMode == Sampler::LINEAR_MIPMAP_NEAREST) ? Sampler::LINEAR : Sampler::NEAREST;

        //     return levels[level].sample2D(sampler, levelFilter, s, t, depth);
        // }

        // case Sampler::NEAREST_MIPMAP_LINEAR:
        // case Sampler::LINEAR_MIPMAP_LINEAR:
        // {
        //     int                    maxLevel    = (int)numLevels-1;
        //     int                    level0        = deClamp32((int)deFloatFloor(lod), 0, maxLevel);
        //     int                    level1        = de::min(maxLevel, level0 + 1);
        //     Sampler::FilterMode    levelFilter    = (filterMode == Sampler::LINEAR_MIPMAP_LINEAR) ? Sampler::LINEAR : Sampler::NEAREST;
        //     float                f            = deFloatFrac(lod);
        //     tcu::Vec4            t0            = levels[level0].sample2D(sampler, levelFilter, s, t, depth);
        //     tcu::Vec4            t1            = levels[level1].sample2D(sampler, levelFilter, s, t, depth);

        //     return t0*(1.0f - f) + t1*f;
        // }

        // default:
        //     DE_ASSERT(false);
        //     return Vec4(0.0f);
    }
    throw new Error('Unimplemented');
};

/**
 * @param {Array<ConstPixelBufferAccess>} levels
 * @param {Number} numLevels
 * @param {Sampler} sampler
 * @param {Number} s
 * @param {Number} t
 * @param {Number} r
 * @param {Number} lod
 * @return {Array<Number>} Vec4 pixel color
 */
var sampleLevelArray3D = function(levels, numLevels, sampler, s, t, r, lod) {
    var magnified = lod <= sampler.lodThreshold;
    var filterMode = magnified ? sampler.magFilter : sampler.minFilter;

    switch (filterMode) {
        case FilterMode.NEAREST: return levels[0].sample3D(sampler, filterMode, s, t, r);
        // case Sampler::LINEAR:    return levels[0].sample3D(sampler, filterMode, s, t, r);

        // case Sampler::NEAREST_MIPMAP_NEAREST:
        // case Sampler::LINEAR_MIPMAP_NEAREST:
        // {
        //     int                    maxLevel    = (int)numLevels-1;
        //     int                    level        = deClamp32((int)deFloatCeil(lod + 0.5f) - 1, 0, maxLevel);
        //     Sampler::FilterMode    levelFilter    = (filterMode == Sampler::LINEAR_MIPMAP_NEAREST) ? Sampler::LINEAR : Sampler::NEAREST;

        //     return levels[level].sample3D(sampler, levelFilter, s, t, r);
        // }

        // case Sampler::NEAREST_MIPMAP_LINEAR:
        // case Sampler::LINEAR_MIPMAP_LINEAR:
        // {
        //     int                    maxLevel    = (int)numLevels-1;
        //     int                    level0        = deClamp32((int)deFloatFloor(lod), 0, maxLevel);
        //     int                    level1        = de::min(maxLevel, level0 + 1);
        //     Sampler::FilterMode    levelFilter    = (filterMode == Sampler::LINEAR_MIPMAP_LINEAR) ? Sampler::LINEAR : Sampler::NEAREST;
        //     float                f            = deFloatFrac(lod);
        //     tcu::Vec4            t0            = levels[level0].sample3D(sampler, levelFilter, s, t, r);
        //     tcu::Vec4            t1            = levels[level1].sample3D(sampler, levelFilter, s, t, r);

        //     return t0*(1.0f - f) + t1*f;
        // }

        // default:
        //     DE_ASSERT(false);
        //     return Vec4(0.0f);
    }
    throw new Error('Unimplemented');
};

/**
 * @constructor
 * @param {CubeFace} face
 * @param {Array<Number>} coords
 */
var CubeFaceCoords = function(face, coords) {
    this.face = face;
    this.s = coords[0];
    this.t = coords[1];
};

/**
 * \brief 2D Texture View
 * @constructor
 * @param {Number} numLevels
 * @param {Array<ConstPixelBufferAccess>} levels
 */
var Texture2DView = function(numLevels, levels) {
    this.m_numLevels = numLevels;
    this.m_levels = levels;
};

/** @return {Number} */
Texture2DView.prototype.getNumLevels = function()    { return this.m_numLevels; };
/** @return {Number} */
Texture2DView.prototype.getWidth = function()     { return this.m_numLevels > 0 ? this.m_levels[0].getWidth() : 0; };
/** @return {Number} */
Texture2DView.prototype.getHeight = function() { return this.m_numLevels > 0 ? this.m_levels[0].getHeight() : 0; };
/**
 * @param {Number} ndx
 * @return {ConstPixelBufferAccess}
 */
Texture2DView.prototype.getLevel = function(ndx) { DE_ASSERT(deMath.deInBounds32(ndx, 0, this.m_numLevels)); return this.m_levels[ndx]; };
/** @return {Array<ConstPixelBufferAccess>} */
Texture2DView.prototype.getLevels = function() { return this.m_levels; };

/**
 * @param {Number} baseLevel
 * @param {Number} maxLevel
 * return {Texture2DView}
 */
Texture2DView.prototype.getSubView = function(baseLevel, maxLevel) {
    var clampedBase = deMath.clamp(baseLevel, 0, this.m_numLevels - 1);
    var clampedMax = deMath.clamp(maxLevel, clampedBase, this.m_numLevels - 1);
    var numLevels = clampedMax - clampedBase + 1;
    return new Texture2DView(numLevels, this.m_levels.slice(clampedBase, numLevels));
};

/**
 * @param {Sampler} sampler
 * @param {Array<Number>} texCoord
 * @param {Number} lod
 * @return {Array<Number>} Pixel color
 */
Texture2DView.prototype.sample = function(sampler, texCoord, lod) {
    return sampleLevelArray2D(this.m_levels, this.m_numLevels, sampler, texCoord[0], texCoord[1], 0 /* depth */, lod);
};

    /* TODO: Port
    Vec4                            sample                (const Sampler& sampler, float s, float t, float lod) const;
    Vec4                            sampleOffset        (const Sampler& sampler, float s, float t, float lod, const IVec2& offset) const;
    float                            sampleCompare        (const Sampler& sampler, float ref, float s, float t, float lod) const;
    float                            sampleCompareOffset    (const Sampler& sampler, float ref, float s, float t, float lod, const IVec2& offset) const;

    Vec4                            gatherOffsets        (const Sampler& sampler, float s, float t, int componentNdx, const IVec2 (&offsets)[4]) const;
    Vec4                            gatherOffsetsCompare(const Sampler& sampler, float ref, float s, float t, const IVec2 (&offsets)[4]) const;
    */

/**
 * @constructor
 * @param {Number} numLevels
 * @param {Array<ConstPixelBufferAccess>} levels
 */
var Texture2DArrayView = function(numLevels, levels) {
    this.m_numLevels = numLevels;
    this.m_levels = levels;
};

/** @return {Number} */
Texture2DArrayView.prototype.getNumLevels = function()    { return this.m_numLevels; };
/** @return {Number} */
Texture2DArrayView.prototype.getWidth = function()     { return this.m_numLevels > 0 ? this.m_levels[0].getWidth() : 0; };
/** @return {Number} */
Texture2DArrayView.prototype.getHeight = function() { return this.m_numLevels > 0 ? this.m_levels[0].getHeight() : 0; };
/** @return {Number} */
Texture2DArrayView.prototype.getNumLayers = function() { return this.m_numLevels > 0 ? this.m_levels[0].getDepth() : 0; };
/**
 * @param {Number} ndx
 * @return {ConstPixelBufferAccess}
 */
Texture2DArrayView.prototype.getLevel = function(ndx) { DE_ASSERT(deMath.deInBounds32(ndx, 0, this.m_numLevels)); return this.m_levels[ndx]; };
/** @return {Array<ConstPixelBufferAccess>} */
Texture2DArrayView.prototype.getLevels = function() { return this.m_levels; };

/**
 * @param {Number} r
 * @return {Number} layer corresponding to requested sampling 'r' coordinate
 */
Texture2DArrayView.prototype.selectLayer = function(r) {
    DE_ASSERT(this.m_numLevels > 0 && this.m_levels);
    return deMath.clamp(Math.round(r), 0, this.m_levels[0].getDepth() - 1);
};

/**
 * @param {Sampler} sampler
 * @param {Array<Number>} texCoord
 * @param {Number} lod
 * @return {Array<Number>} Pixel color
 */
Texture2DArrayView.prototype.sample = function(sampler, texCoord, lod) {
    return sampleLevelArray2D(this.m_levels, this.m_numLevels, sampler, texCoord[0], texCoord[1], this.selectLayer(texCoord[2]), lod);
};

/**
 * @constructor
 * @param {Number} numLevels
 * @param {Array<ConstPixelBufferAccess>} levels
 */
var Texture3DView = function(numLevels, levels) {
    this.m_numLevels = numLevels;
    this.m_levels = levels;
};

/** @return {Number} */
Texture3DView.prototype.getNumLevels = function()    { return this.m_numLevels; };
/** @return {Number} */
Texture3DView.prototype.getWidth = function()     { return this.m_numLevels > 0 ? this.m_levels[0].getWidth() : 0; };
/** @return {Number} */
Texture3DView.prototype.getHeight = function() { return this.m_numLevels > 0 ? this.m_levels[0].getHeight() : 0; };
/** @return {Number} */
Texture3DView.prototype.getDepth = function() { return this.m_numLevels > 0 ? this.m_levels[0].getDepth() : 0; };
/**
 * @param {Number} ndx
 * @return {ConstPixelBufferAccess}
 */
Texture3DView.prototype.getLevel = function(ndx) { DE_ASSERT(deMath.deInBounds32(ndx, 0, this.m_numLevels)); return this.m_levels[ndx]; };
/** @return {Array<ConstPixelBufferAccess>} */
Texture3DView.prototype.getLevels = function() { return this.m_levels; };

/**
 * @param {Number} baseLevel
 * @param {Number} maxLevel
 * return {Texture3DView}
 */
Texture3DView.prototype.getSubView = function(baseLevel, maxLevel) {
    var clampedBase = deMath.clamp(baseLevel, 0, this.m_numLevels - 1);
    var clampedMax = deMath.clamp(maxLevel, clampedBase, this.m_numLevels - 1);
    var numLevels = clampedMax - clampedBase + 1;
    return new Texture3DView(numLevels, this.m_levels.slice(clampedBase, numLevels));
};

/**
 * @param {Sampler} sampler
 * @param {Array<Number>} texCoord
 * @param {Number} lod
 * @return {Array<Number>} Pixel color
 */
Texture3DView.prototype.sample = function(sampler, texCoord, lod) {
    return sampleLevelArray3D(this.m_levels, this.m_numLevels, sampler, texCoord[0], texCoord[1], texCoord[2], lod);
};

/* TODO: All view classes are very similar. They should have a common base class */

/**
 * @param {Number} width
 * @param {Number} height
 * @return {Number} Number of pyramid levels
 */
var computeMipPyramidLevels = function(width, height) {
    var h = height || width;
    return Math.floor(Math.log2(Math.max(width, h))) + 1;
};

/**
 * @param {Number} baseLevelSize
 * @param {Number} levelNdx
 */
var getMipPyramidLevelSize = function(baseLevelSize, levelNdx) {
    return Math.max(baseLevelSize >> levelNdx, 1);
};

/**
 * @param {Array<Number>} coords Vec3 cube coordinates
 * @return {CubeFaceCoords}
 */
var getCubeFaceCoords = function(coords) {
    var face = selectCubeFace(coords);
    return new CubeFaceCoords(face, projectToFace(face, coords));
};

/**
 * @constructor
 * @extends {TextureLevelPyramid}
 * @param {TextureFormat} format
 * @param {Number} width
 * @param {Number} height
 */
var Texture2D = function(format, width, height) {
    TextureLevelPyramid.call(this, format, computeMipPyramidLevels(width, height));
    this.m_width = width;
    this.m_height = height;
    this.m_view = new Texture2DView(this.getNumLevels(), this.getLevels());
};

Texture2D.prototype = Object.create(TextureLevelPyramid.prototype);
Texture2D.prototype.constructor = Texture2D;

Texture2D.prototype.getWidth = function() { return this.m_width; };
Texture2D.prototype.getHeight = function() { return this.m_height; };

/**
 * @param {Number} baseLevel
 * @param {Number} maxLevel
 * @return {Texture2DView}
 */
Texture2D.prototype.getSubView = function(baseLevel, maxLevel) { return this.m_view.getSubView(baseLevel, maxLevel); };

/**
 * @param {Number} levelNdx
 */
Texture2D.prototype.allocLevel = function(levelNdx) {
    DE_ASSERT(deMath.deInBounds32(levelNdx, 0, this.getNumLevels()));

    var width = getMipPyramidLevelSize(this.m_width, levelNdx);
    var height = getMipPyramidLevelSize(this.m_height, levelNdx);

    // console.log('w ' + width + ' h ' + height);
    TextureLevelPyramid.prototype.allocLevel.call(this, levelNdx, width, height, 1);
};

/**
 * @constructor
 * @extends {TextureLevelPyramid}
 * @param {TextureFormat} format
 * @param {Number} width
 * @param {Number} height
 * @param {Number} numLayers
 */
var Texture2DArray = function(format, width, height, numLayers) {
    TextureLevelPyramid.call(this, format, computeMipPyramidLevels(width, height));
    this.m_width = width;
    this.m_height = height;
    this.m_numLayers = numLayers;
    this.m_view = new Texture2DArrayView(this.getNumLevels(), this.getLevels());
};

Texture2DArray.prototype = Object.create(TextureLevelPyramid.prototype);
Texture2DArray.prototype.constructor = Texture2DArray;
/** @return {Texture2DArrayView} */
Texture2DArray.prototype.getView = function() { return this.m_view; };

/**
 * @param {Number} levelNdx
 */
Texture2DArray.prototype.allocLevel = function(levelNdx) {
    DE_ASSERT(deMath.deInBounds32(levelNdx, 0, this.getNumLevels()));

    var width = getMipPyramidLevelSize(this.m_width, levelNdx);
    var height = getMipPyramidLevelSize(this.m_height, levelNdx);

    TextureLevelPyramid.prototype.allocLevel.call(this, levelNdx, width, height, this.m_numLayers);
};

/**
 * @constructor
 * @extends {TextureLevelPyramid}
 * @param {TextureFormat} format
 * @param {Number} width
 * @param {Number} height
 * @param {Number} depth
 */
var Texture3D = function(format, width, height, depth) {
    TextureLevelPyramid.call(this, format, computeMipPyramidLevels(width, height));
    this.m_width = width;
    this.m_height = height;
    this.m_depth = depth;
    this.m_view = new Texture3DView(this.getNumLevels(), this.getLevels());
};

Texture3D.prototype = Object.create(TextureLevelPyramid.prototype);
Texture3D.prototype.constructor = Texture3D;

Texture3D.prototype.getWidth = function() { return this.m_width; };
Texture3D.prototype.getHeight = function() { return this.m_height; };

/**
 * @param {Number} baseLevel
 * @param {Number} maxLevel
 * @return {Texture3DView}
 */
Texture3D.prototype.getSubView = function(baseLevel, maxLevel) { return this.m_view.getSubView(baseLevel, maxLevel); };

/**
 * @param {Number} levelNdx
 */
Texture3D.prototype.allocLevel = function(levelNdx) {
    DE_ASSERT(deMath.deInBounds32(levelNdx, 0, this.getNumLevels()));

    var width = getMipPyramidLevelSize(this.m_width, levelNdx);
    var height = getMipPyramidLevelSize(this.m_height, levelNdx);
    var depth = getMipPyramidLevelSize(this.m_depth, levelNdx);

    TextureLevelPyramid.prototype.allocLevel.call(this, levelNdx, width, height, depth);
};


/**
 * @constructor
 * @param {Number} numLevels
 * @param {Array<Array<ConstPixelBufferAccess>>} levels
 */
var TextureCubeView = function(numLevels, levels) {
    this.m_numLevels = numLevels;
    this.m_levels = levels;
};

/**
 * @param {Sampler} sampler
 * @param {Array<Number>} texCoord
 * @param {Number} lod
 * @return {Array<Number>} Pixel color
 */
TextureCubeView.prototype.sample = function(sampler, texCoord, lod) {
    DE_ASSERT(sampler.compare == CompareMode.COMPAREMODE_NONE);

    // Computes (face, s, t).
    var coords = getCubeFaceCoords(texCoord);
    if (sampler.seamlessCubeMap)
        return sampleLevelArrayCubeSeamless(this.m_levels, this.m_numLevels, coords.face, sampler, coords.s, coords.t, 0 /* depth */, lod);
    else
        return sampleLevelArray2D(this.m_levels[coords.face], this.m_numLevels, sampler, coords.s, coords.t, 0 /* depth */, lod);
};

/**
 * @param {CubeFace} face
 * @return {Array<ConstPixelBufferAccess>}
 */
TextureCubeView.prototype.getFaceLevels = function(face) { return this.m_levels[face]; };
/** @return {Number} */
TextureCubeView.prototype.getSize = function() { return this.m_numLevels > 0 ? this.m_levels[0][0].getWidth() : 0; };

/**
 * @param {Number} baseLevel
 * @param {Number} maxLevel
 * @return {TextureCubeView}
 */
TextureCubeView.prototype.getSubView = function(baseLevel, maxLevel) {
    var clampedBase = deMath.clamp(baseLevel, 0, this.m_numLevels - 1);
    var clampedMax = deMath.clamp(maxLevel, clampedBase, this.m_numLevels - 1);
    var numLevels = clampedMax - clampedBase + 1;
    var levels = [];
    for (var face in CubeFace)
        levels.push(this.getFaceLevels(CubeFace[face]).slice(clampedBase, numLevels));

    return new TextureCubeView(numLevels, levels);
};

/**
 * @constructor
 * @param {TextureFormat} format
 * @param {Number} size
 */
var TextureCube = function(format, size) {
    this.m_format = format;
    this.m_size = size;
    this.m_data = [];
    this.m_data.length = Object.keys(CubeFace).length;
    this.m_access = [];
    this.m_access.length = Object.keys(CubeFace).length;

    var numLevels = computeMipPyramidLevels(this.m_size);
    var levels = [];
    levels.length = Object.keys(CubeFace).length;

    for (var face in CubeFace) {
        this.m_data[CubeFace[face]] = [];
        for (var i = 0; i < numLevels; i++)
            this.m_data[CubeFace[face]].push(new DeqpArrayBuffer());
        this.m_access[CubeFace[face]] = [];
        this.m_access[CubeFace[face]].length = numLevels;
        levels[CubeFace[face]] = this.m_access[CubeFace[face]];
    }

    this.m_view = new TextureCubeView(numLevels, levels);
};

/** @return {TextureFormat} */
TextureCube.prototype.getFormat = function() { return this.m_format; };
/** @return {Number} */
TextureCube.prototype.getSize = function() { return this.m_size; };
/**
 * @param {Number} ndx Level index
 * @param {CubeFace} face
 * @return {ConstPixelBufferAccess}
 */
TextureCube.prototype.getLevelFace = function(ndx, face)        { return this.m_access[face][ndx]; };
/** @return {Number} */
TextureCube.prototype.getNumLevels = function() { return this.m_access[0].length; };

/**
 * @param {Sampler} sampler
 * @param {Array<Number>} texCoord
 * @param {Number} lod
 * @return {Array<Number>} Pixel color
 */
TextureCube.prototype.sample = function(sampler, texCoord, lod) {
    this.m_view.sample(sampler, texCoord, lod);
};

/**
 * @param {Number} baseLevel
 * @param {Number} maxLevel
 * @return {TextureCubeView}
 */
TextureCube.prototype.getSubView = function(baseLevel, maxLevel) { return this.m_view.getSubView(baseLevel, maxLevel); };

/**
 * @param {CubeFace} face
 * @param {Number} levelNdx
 * @return {boolean}
 */
TextureCube.prototype.isLevelEmpty = function(face, levelNdx) {
    return this.m_data[face][levelNdx].empty();
};

/**
 * @param {CubeFace} face
 * @param {Number} levelNdx
 */
TextureCube.prototype.allocLevel = function(face, levelNdx) {
    /** @const */ var size = getMipPyramidLevelSize(this.m_size, levelNdx);
    /** @const*/ var dataSize = this.m_format.getPixelSize() * size * size;
    DE_ASSERT(this.isLevelEmpty(face, levelNdx));

    this.m_data[face][levelNdx].setStorage(dataSize);
    this.m_access[face][levelNdx] = new PixelBufferAccess({
        format: this.m_format,
        width: size,
        height: size,
        depth: 1,
        data: this.m_data[face][levelNdx].m_ptr
    });
};

/**
 * @param {Array<Number>} coords Cube coordinates
 * @return {CubeFace}
 */
var selectCubeFace = function(coords) {
    var x = coords[0];
    var y = coords[1];
    var z = coords[2];
    var ax = Math.abs(x);
    var ay = Math.abs(y);
    var az = Math.abs(z);

    if (ay < ax && az < ax)
        return x >= 0 ? CubeFace.CUBEFACE_POSITIVE_X : CubeFace.CUBEFACE_NEGATIVE_X;
    else if (ax < ay && az < ay)
        return y >= 0 ? CubeFace.CUBEFACE_POSITIVE_Y : CubeFace.CUBEFACE_NEGATIVE_Y;
    else if (ax < az && ay < az)
        return z >= 0 ? CubeFace.CUBEFACE_POSITIVE_Z : CubeFace.CUBEFACE_NEGATIVE_Z;
    else {
        // Some of the components are equal. Use tie-breaking rule.
        if (ax == ay) {
            if (ax < az)
                return z >= 0 ? CubeFace.CUBEFACE_POSITIVE_Z : CubeFace.CUBEFACE_NEGATIVE_Z;
            else
                return x >= 0 ? CubeFace.CUBEFACE_POSITIVE_X : CubeFace.CUBEFACE_NEGATIVE_X;
        } else if (ax == az) {
            if (az < ay)
                return y >= 0 ? CubeFace.CUBEFACE_POSITIVE_Y : CubeFace.CUBEFACE_NEGATIVE_Y;
            else
                return z >= 0 ? CubeFace.CUBEFACE_POSITIVE_Z : CubeFace.CUBEFACE_NEGATIVE_Z;
        } else if (ay == az) {
            if (ay < ax)
                return x >= 0 ? CubeFace.CUBEFACE_POSITIVE_X : CubeFace.CUBEFACE_NEGATIVE_X;
            else
                return y >= 0 ? CubeFace.CUBEFACE_POSITIVE_Y : CubeFace.CUBEFACE_NEGATIVE_Y;
        } else
            return x >= 0 ? CubeFace.CUBEFACE_POSITIVE_X : CubeFace.CUBEFACE_NEGATIVE_X;
    }
};

/**
 * @param {CubeFace} face
 * @param {Array<Number>} coord  Cube coordinates (Vec3)
 * @return {Array<Number>} face coordinates (Vec2)
 */
var projectToFace = function(face, coord) {
    var rx = coord[0];
    var ry = coord[1];
    var rz = coord[2];
    var sc = 0;
    var tc = 0;
    var ma = 0;

    switch (face) {
        case CubeFace.CUBEFACE_NEGATIVE_X: sc = +rz; tc = -ry; ma = -rx; break;
        case CubeFace.CUBEFACE_POSITIVE_X: sc = -rz; tc = -ry; ma = +rx; break;
        case CubeFace.CUBEFACE_NEGATIVE_Y: sc = +rx; tc = -rz; ma = -ry; break;
        case CubeFace.CUBEFACE_POSITIVE_Y: sc = +rx; tc = +rz; ma = +ry; break;
        case CubeFace.CUBEFACE_NEGATIVE_Z: sc = -rx; tc = -ry; ma = -rz; break;
        case CubeFace.CUBEFACE_POSITIVE_Z: sc = +rx; tc = -ry; ma = +rz; break;
        default:
            throw new Error('Unrecognized face ' + face);
    }

    // Compute s, t
    var s = ((sc / ma) + 1) / 2;
    var t = ((tc / ma) + 1) / 2;

    return [s, t];
};

/**
 * @constructor
 * @param {TextureFormat} format
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 */
var TextureLevel = function(format, width, height, depth) {
    this.m_format = format;
    this.m_width = width;
    this.m_height = height;
    this.m_depth = depth === undefined ? 1 : depth;
    this.m_data = new DeqpArrayBuffer();
    this.setSize(this.m_width, this.m_height, this.m_depth);
};

TextureLevel.prototype.constructor = TextureLevel;

/**
 * @param {TextureFormat} format
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 */
TextureLevel.prototype.setStorage = function(format, width, height, depth)
{
    this.m_format = format;
    this.setSize(width, height, depth);
};

/**
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 */
TextureLevel.prototype.setSize = function(width, height, depth)
{
    var pixelSize = this.m_format.getPixelSize();

    this.m_width = width;
    this.m_height = height;
    this.m_depth = depth;

    this.m_data.setStorage(this.m_width * this.m_height * this.m_depth * pixelSize);
};

TextureLevel.prototype.getAccess = function() {
    return new PixelBufferAccess({
                    format: this.m_format,
                    width: this.m_width,
                    height: this.m_height,
                    depth: this.m_depth,
                    data: this.m_data.m_ptr
                });

};

/**
 * @return {number}
 */
TextureLevel.prototype.getWidth = function()
{
    return this.m_width;
};

/**
 * @return {number}
 */
TextureLevel.prototype.getHeight = function()
{
    return this.m_height;
};

/**
 * @return {number}
 */
TextureLevel.prototype.getDepth = function()
{
    return this.m_depth;
};

/**
 * @return {number}
 */
TextureLevel.prototype.getFormat = function()
{
    return this.m_format;
};

return {
    TextureFormat: TextureFormat,
    ChannelType: ChannelType,
    ChannelOrder: ChannelOrder,
    CubeFace: CubeFace,
    DeqpArrayBuffer: DeqpArrayBuffer,
    ConstPixelBufferAccess: ConstPixelBufferAccess,
    PixelBufferAccess: PixelBufferAccess,
    Texture2D: Texture2D,
    Texture2DView: Texture2DView,
    TextureCube: TextureCube,
    Texture2DArray: Texture2DArray,
    Texture3D: Texture3D,
    WrapMode: WrapMode,
    FilterMode: FilterMode,
    CompareMode: CompareMode,
    Sampler: Sampler,
    selectCubeFace: selectCubeFace,
    TextureLevel: TextureLevel
};

});
