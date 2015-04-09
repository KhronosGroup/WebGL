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

define(['framework/common/tcuTexture', 'framework/delibs/debase/deMath'], function(tcuTexture, deMath) {

var DE_ASSERT = function(x) {
    if (!x)
        throw new Error('Assert failed');
};

var linearInterpolate = function(t, minVal, maxVal)
{
    return minVal + (maxVal - minVal) * t;
};

/**
 * @enum Clear
 */
var Clear = {
    OPTIMIZE_THRESHOLD: 128,
    OPTIMIZE_MAX_PIXEL_SIZE: 8
};

/**
 * @param {tcuTexture.PixelBufferAccess} dst
 * @param {number} y
 * @param {number} z
 * @param {number} pixelSize
 * @param {ArrayBuffer} pixel
 */
var fillRow = function(dst, y, z, pixelSize, pixel) {
    var start = z * dst.getSlicePitch() + y * dst.getRowPitch();
    /** @type {ArrayBuffer} */ var dstPtr = dst.getBuffer();
    var width = dst.getWidth();

    //TODO: Optimize this for pixel sizes 8 and 4
    /** @type {Uint8Array} */ var dstPtr8 = new Uint8Array(dstPtr);
    /** @type {Uint8Array} */ var pixel8 = new Uint8Array(pixel);

    for (var i = 0; i < width; i++)
        for (var c = 0; c < pixelSize; c++)
            dstPtr8[start + (i * pixelSize + c)] = pixel8[c];
};

/**
 * @param {PixelBufferAccess} access
 * @param {Array.<number>} color
 */
var clear = function(access, color) {
    /** @type {number} */ var pixelSize = access.getFormat().getPixelSize();

    if (access.getWidth() * access.getHeight() * access.getDepth() >= Clear.OPTIMIZE_THRESHOLD &&
        pixelSize < Clear.OPTIMIZE_MAX_PIXEL_SIZE) {
        // Convert to destination format.
        /** @type {ArrayBuffer} */ var pixel = new ArrayBuffer(Clear.OPTIMIZE_MAX_PIXEL_SIZE);

        DE_ASSERT(pixel.byteLength == Clear.OPTIMIZE_MAX_PIXEL_SIZE);
        tcuTexture.PixelBufferAccess.newFromTextureFormat(access.getFormat(), 1, 1, 1, 0, 0, pixel).setPixel(color, 0, 0);

        for (var z = 0; z < access.getDepth(); z++)
            for (var y = 0; y < access.getHeight(); y++)
                fillRow(access, y, z, pixelSize, pixel);
    }
    else {
        for (var z = 0; z < access.getDepth(); z++)
            for (var y = 0; y < access.getHeight(); y++)
                for (var x = 0; x < access.getWidth(); x++)
                    access.setPixel(color, x, y, z);
    }
};

/**
 * Enums for TextureChannelClass
 * @enum {number}
 */
var TextureChannelClass = {

        SIGNED_FIXED_POINT: 0,
        UNSIGNED_FIXED_POINT: 1,
        SIGNED_INTEGER: 2,
        UNSIGNED_INTEGER: 3,
        FLOATING_POINT: 4
};

/** linearChannelToSRGB
 * @param {number} cl, a float in the C++ version
 * @return {Array}
 */
var linearChannelToSRGB = function(cl) {
    if (cl <= 0.0)
        return 0.0;
    else if (cl < 0.0031308)
        return 12.92 * cl;
    else if (cl < 1.0)
        return 1.055 * Math.pow(cl, 0.41666) - 0.055;
    else
        return 1.0;
};

/** linearToSRGB
 * @param {Array.<number>} cl
 * @return {Array.<number>}
 */
var linearToSRGB = function(cl) {
    return [linearChannelToSRGB(cl[0]),
            linearChannelToSRGB(cl[1]),
            linearChannelToSRGB(cl[2]),
            cl[3]
            ];
};

var getTextureChannelClass = function(channelType) {

    switch (channelType) {

    case tcuTexture.ChannelType.SNORM_INT8: return TextureChannelClass.SIGNED_FIXED_POINT;
    case tcuTexture.ChannelType.SNORM_INT16: return TextureChannelClass.SIGNED_FIXED_POINT;
    case tcuTexture.ChannelType.UNORM_INT8: return TextureChannelClass.UNSIGNED_FIXED_POINT;
    case tcuTexture.ChannelType.UNORM_INT16: return TextureChannelClass.UNSIGNED_FIXED_POINT;
    case tcuTexture.ChannelType.UNORM_SHORT_565: return TextureChannelClass.UNSIGNED_FIXED_POINT;
    case tcuTexture.ChannelType.UNORM_SHORT_555: return TextureChannelClass.UNSIGNED_FIXED_POINT;
    case tcuTexture.ChannelType.UNORM_SHORT_4444: return TextureChannelClass.UNSIGNED_FIXED_POINT;
    case tcuTexture.ChannelType.UNORM_SHORT_5551: return TextureChannelClass.UNSIGNED_FIXED_POINT;
    case tcuTexture.ChannelType.UNORM_INT_101010: return TextureChannelClass.UNSIGNED_FIXED_POINT;
    case tcuTexture.ChannelType.UNORM_INT_1010102_REV: return TextureChannelClass.UNSIGNED_FIXED_POINT;
    case tcuTexture.ChannelType.UNSIGNED_INT_1010102_REV: return TextureChannelClass.UNSIGNED_INTEGER;
    case tcuTexture.ChannelType.UNSIGNED_INT_11F_11F_10F_REV: return TextureChannelClass.FLOATING_POINT;
    case tcuTexture.ChannelType.UNSIGNED_INT_999_E5_REV: return TextureChannelClass.FLOATING_POINT;
    case tcuTexture.ChannelType.SIGNED_INT8: return TextureChannelClass.SIGNED_INTEGER;
    case tcuTexture.ChannelType.SIGNED_INT16: return TextureChannelClass.SIGNED_INTEGER;
    case tcuTexture.ChannelType.SIGNED_INT32: return TextureChannelClass.SIGNED_INTEGER;
    case tcuTexture.ChannelType.UNSIGNED_INT8: return TextureChannelClass.UNSIGNED_INTEGER;
    case tcuTexture.ChannelType.UNSIGNED_INT16: return TextureChannelClass.UNSIGNED_INTEGER;
    case tcuTexture.ChannelType.UNSIGNED_INT32: return TextureChannelClass.UNSIGNED_INTEGER;
    case tcuTexture.ChannelType.HALF_FLOAT: return TextureChannelClass.FLOATING_POINT;
    case tcuTexture.ChannelType.FLOAT: return TextureChannelClass.FLOATING_POINT;

    default: return TextureChannelClass.LAST;
    }

};

/**
 * getSubregion
 * @param {tcuTexture.PixelBufferAccess} access
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} width
 * @param {number} height
 * @param {number} depth
 * @return {tcuTexture.PixelBufferAccess}
 */
var getSubregion = function(access, x, y, z, width, height, depth) {

    DE_ASSERT(deMath.deInBounds32(x, 0, access.getWidth()) && deMath.deInRange32(x + width, x, access.getWidth()));
    DE_ASSERT(deMath.deInBounds32(y, 0, access.getHeight()) && deMath.deInRange32(y + height, y, access.getHeight()));
    DE_ASSERT(deMath.deInBounds32(z, 0, access.getDepth()) && deMath.deInRange32(z + depth, z, access.getDepth()));

    return new tcuTexture.PixelBufferAccess({
        format: access.getFormat(),
        width: width,
        height: height,
        depth: depth,
        rowPitch: access.getRowPitch(),
        slicePitch: access.getSlicePitch(),
        offset: access.getFormat().getPixelSize() * x + access.getRowPitch() * y + access.getSlicePitch() * z,
        data: access.getBuffer()
        });
};

var fillWithComponentGradients2D = function(/*const PixelBufferAccess&*/ access, /*const Vec4&*/ minVal, /*const Vec4&*/ maxVal) {
    for (var y = 0; y < access.getHeight(); y++) {
        for (var x = 0; x < access.getWidth(); x++) {
            var s = (x + 0.5) / access.getWidth();
            var t = (y + 0.5) / access.getHeight();

            var r = linearInterpolate((s + t) * 0.5, minVal[0], maxVal[0]);
            var g = linearInterpolate((s + (1 - t)) * 0.5, minVal[1], maxVal[1]);
            var b = linearInterpolate(((1 - s) + t) * 0.5, minVal[2], maxVal[2]);
            var a = linearInterpolate(((1 - s) + (1 - t)) * 0.5, minVal[3], maxVal[3]);

            access.setPixel([r, g, b, a], x, y);
        }
    }
};

var fillWithComponentGradients3D = function(/*const PixelBufferAccess&*/ dst, /*const Vec4&*/ minVal, /*const Vec4&*/ maxVal) {
    for (var z = 0; z < dst.getDepth(); z++) {
        for (var y = 0; y < dst.getHeight(); y++) {
            for (var x = 0; x < dst.getWidth(); x++) {
                var s = (x + 0.5) / dst.getWidth();
                var t = (y + 0.5) / dst.getHeight();
                var p = (z + 0.5) / dst.getDepth();

                var r = linearInterpolate(s, minVal[0], maxVal[0]);
                var g = linearInterpolate(t, minVal[1], maxVal[1]);
                var b = linearInterpolate(p, minVal[2], maxVal[2]);
                var a = linearInterpolate(1 - (s + t + p) / 3, minVal[3], maxVal[3]);
                dst.setPixel([r, g, b, a], x, y, z);
            }
        }
    }
};

var fillWithComponentGradients = function(/*const PixelBufferAccess&*/ access, /*const Vec4&*/ minVal, /*const Vec4&*/ maxVal) {
    if (access.getHeight() == 1 && access.getDepth() == 1)
        fillWithComponentGradients1D(access, minVal, maxVal);
    else if (access.getDepth() == 1)
        fillWithComponentGradients2D(access, minVal, maxVal);
    else
        fillWithComponentGradients3D(access, minVal, maxVal);
};

/**
 * Create TextureFormatInfo.
 * @constructor
 */
var TextureFormatInfo = function(valueMin, valueMax, lookupScale, lookupBias) {
    this.valueMin = valueMin;
    this.valueMax = valueMax;
    this.lookupScale = lookupScale;
    this.lookupBias = lookupBias;
};

/*static Vec2*/ var getChannelValueRange = function(/*TextureFormat::ChannelType*/ channelType) {
    var cMin = 0;
    var cMax = 0;

    switch (channelType) {
        // Signed normalized formats.
        case tcuTexture.ChannelType.SNORM_INT8:
        case tcuTexture.ChannelType.SNORM_INT16: cMin = -1; cMax = 1; break;

        // Unsigned normalized formats.
        case tcuTexture.ChannelType.UNORM_INT8:
        case tcuTexture.ChannelType.UNORM_INT16:
        case tcuTexture.ChannelType.UNORM_SHORT_565:
        case tcuTexture.ChannelType.UNORM_SHORT_4444:
        case tcuTexture.ChannelType.UNORM_INT_101010:
        case tcuTexture.ChannelType.UNORM_INT_1010102_REV: cMin = 0; cMax = 1; break;

        // Misc formats.
        case tcuTexture.ChannelType.SIGNED_INT8: cMin = -128; cMax = 127; break;
        case tcuTexture.ChannelType.SIGNED_INT16: cMin = -32768; cMax = 32767; break;
        case tcuTexture.ChannelType.SIGNED_INT32: cMin = -2147483648; cMax = 2147483647; break;
        case tcuTexture.ChannelType.UNSIGNED_INT8: cMin = 0; cMax = 255; break;
        case tcuTexture.ChannelType.UNSIGNED_INT16: cMin = 0; cMax = 65535; break;
        case tcuTexture.ChannelType.UNSIGNED_INT32: cMin = 0; cMax = 4294967295; break;
        case tcuTexture.ChannelType.HALF_FLOAT: cMin = -1e3; cMax = 1e3; break;
        case tcuTexture.ChannelType.FLOAT: cMin = -1e5; cMax = 1e5; break;
        case tcuTexture.ChannelType.UNSIGNED_INT_11F_11F_10F_REV: cMin = 0; cMax = 1e4; break;
        case tcuTexture.ChannelType.UNSIGNED_INT_999_E5_REV: cMin = 0; cMax = 1e5; break;

        default:
            DE_ASSERT(false);
    }

    return [cMin, cMax];
};

/**
 * Creates an array by choosing between 'a' and 'b' based on 'cond' array.
 * @param {Array} a
 * @param {Array} b
 * @param {Array<boolean>} cond Condtions
 * @return {Array}
 */
var select = function(a, b, cond) {
    var dst = [];
    for (var i = 0; i < cond.length; i++)
        if (cond[i])
            dst.push(a[i]);
        else
            dst.push(b[i]);
    return dst;
};

/*--------------------------------------------------------------------*//*!
 * \brief Get standard parameters for testing texture format
 *
 * Returns TextureFormatInfo that describes good parameters for exercising
 * given TextureFormat. Parameters include value ranges per channel and
 * suitable lookup scaling and bias in order to reduce result back to
 * 0..1 range.
 *//*--------------------------------------------------------------------*/
/*TextureFormatInfo*/ var getTextureFormatInfo = function(/*const TextureFormat&*/ format) {
    // Special cases.
    if (format.isEqual(new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNSIGNED_INT_1010102_REV)))
        return new TextureFormatInfo([0, 0, 0, 0],
                                 [1023, 1023, 1023, 3],
                                 [1 / 1023, 1 / 1023, 1 / 1023, 1 / 3],
                                 [0, 0, 0, 0]);
    else if (format.order == tcuTexture.ChannelOrder.D || format.order == tcuTexture.ChannelOrder.DS)
        return new TextureFormatInfo([0, 0, 0, 0],
                                 [1, 1, 1, 0],
                                 [1, 1, 1, 1],
                                 [0, 0, 0, 0]); // Depth / stencil formats.
    else if (format.isEqual(new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_SHORT_5551)))
        return new TextureFormatInfo([0, 0, 0, 0.5],
                                 [1, 1, 1, 1.5],
                                 [1, 1, 1, 1],
                                 [0, 0, 0, 0]);

    var cRange = getChannelValueRange(format.type);
    var chnMask = null;

    switch (format.order) {
        case tcuTexture.ChannelOrder.R: chnMask = [true, false, false, false]; break;
        case tcuTexture.ChannelOrder.A: chnMask = [false, false, false, true]; break;
        case tcuTexture.ChannelOrder.L: chnMask = [true, true, true, false]; break;
        case tcuTexture.ChannelOrder.LA: chnMask = [true, true, true, true]; break;
        case tcuTexture.ChannelOrder.RG: chnMask = [true, true, false, false]; break;
        case tcuTexture.ChannelOrder.RGB: chnMask = [true, true, true, false]; break;
        case tcuTexture.ChannelOrder.RGBA: chnMask = [true, true, true, true]; break;
        case tcuTexture.ChannelOrder.sRGB: chnMask = [true, true, true, false]; break;
        case tcuTexture.ChannelOrder.sRGBA: chnMask = [true, true, true, true]; break;
        case tcuTexture.ChannelOrder.D: chnMask = [true, true, true, false]; break;
        case tcuTexture.ChannelOrder.DS: chnMask = [true, true, true, true]; break;
        default:
            DE_ASSERT(false);
    }

    var scale = 1 / (cRange[1] - cRange[0]);
    var bias = -cRange[0] * scale;

    return new TextureFormatInfo(select(cRange[0], 0, chnMask),
                             select(cRange[1], 0, chnMask),
                             select(scale, 1, chnMask),
                             select(bias, 0, chnMask));
};

/** getChannelBitDepth
 * @param {tcuTexture.ChannelType} channelType
 * @return {Array.<number>}
 */
var getChannelBitDepth = function(channelType) {

    switch (channelType)
    {
        case tcuTexture.ChannelType.SNORM_INT8: return [8, 8, 8, 8];
        case tcuTexture.ChannelType.SNORM_INT16: return [16, 16, 16, 16];
        case tcuTexture.ChannelType.SNORM_INT32: return [32, 32, 32, 32];
        case tcuTexture.ChannelType.UNORM_INT8: return [8, 8, 8, 8];
        case tcuTexture.ChannelType.UNORM_INT16: return [16, 16, 16, 16];
        case tcuTexture.ChannelType.UNORM_INT32: return [32, 32, 32, 32];
        case tcuTexture.ChannelType.UNORM_SHORT_565: return [5, 6, 5, 0];
        case tcuTexture.ChannelType.UNORM_SHORT_4444: return [4, 4, 4, 4];
        case tcuTexture.ChannelType.UNORM_SHORT_555: return [5, 5, 5, 0];
        case tcuTexture.ChannelType.UNORM_SHORT_5551: return [5, 5, 5, 1];
        case tcuTexture.ChannelType.UNORM_INT_101010: return [10, 10, 10, 0];
        case tcuTexture.ChannelType.UNORM_INT_1010102_REV: return [10, 10, 10, 2];
        case tcuTexture.ChannelType.SIGNED_INT8: return [8, 8, 8, 8];
        case tcuTexture.ChannelType.SIGNED_INT16: return [16, 16, 16, 16];
        case tcuTexture.ChannelType.SIGNED_INT32: return [32, 32, 32, 32];
        case tcuTexture.ChannelType.UNSIGNED_INT8: return [8, 8, 8, 8];
        case tcuTexture.ChannelType.UNSIGNED_INT16: return [16, 16, 16, 16];
        case tcuTexture.ChannelType.UNSIGNED_INT32: return [32, 32, 32, 32];
        case tcuTexture.ChannelType.UNSIGNED_INT_1010102_REV: return [10, 10, 10, 2];
        case tcuTexture.ChannelType.UNSIGNED_INT_24_8: return [24, 0, 0, 8];
        case tcuTexture.ChannelType.HALF_FLOAT: return [16, 16, 16, 16];
        case tcuTexture.ChannelType.FLOAT: return [32, 32, 32, 32];
        case tcuTexture.ChannelType.UNSIGNED_INT_11F_11F_10F_REV: return [11, 11, 10, 0];
        case tcuTexture.ChannelType.UNSIGNED_INT_999_E5_REV: return [9, 9, 9, 0];
        case tcuTexture.ChannelType.FLOAT_UNSIGNED_INT_24_8_REV: return [32, 0, 0, 8];
        default:
            DE_ASSERT(false);
            return [0, 0, 0, 0];
    }
};

/** getTextureFormatBitDepth
 * @param {tcuTexture.TextureFormat} format
 * @return {Array.<number>}
 */
var getTextureFormatBitDepth = function(format) {

    /** @type {Array.<number>} */ var chnBits = getChannelBitDepth(format.type); // IVec4
    /** @type {Array.<boolean>} */ var chnMask = [false, false, false, false]; // BVec4
    /** @type {Array.<number>} */ var chnSwz = [0, 1, 2, 3]; // IVec4

    switch (format.order)
    {
        case tcuTexture.ChannelOrder.R: chnMask = [true, false, false, false]; break;
        case tcuTexture.ChannelOrder.A: chnMask = [false, false, false, true]; break;
        case tcuTexture.ChannelOrder.RA: chnMask = [true, false, false, true]; break;
        case tcuTexture.ChannelOrder.L: chnMask = [true, true, true, false]; break;
        case tcuTexture.ChannelOrder.I: chnMask = [true, true, true, true]; break;
        case tcuTexture.ChannelOrder.LA: chnMask = [true, true, true, true]; break;
        case tcuTexture.ChannelOrder.RG: chnMask = [true, true, false, false]; break;
        case tcuTexture.ChannelOrder.RGB: chnMask = [true, true, true, false]; break;
        case tcuTexture.ChannelOrder.RGBA: chnMask = [true, true, true, true]; break;
        case tcuTexture.ChannelOrder.BGRA: chnMask = [true, true, true, true]; chnSwz = [2, 1, 0, 3]; break;
        case tcuTexture.ChannelOrder.ARGB: chnMask = [true, true, true, true]; chnSwz = [1, 2, 3, 0]; break;
        case tcuTexture.ChannelOrder.sRGB: chnMask = [true, true, true, false]; break;
        case tcuTexture.ChannelOrder.sRGBA: chnMask = [true, true, true, true]; break;
        case tcuTexture.ChannelOrder.D: chnMask = [true, false, false, false]; break;
        case tcuTexture.ChannelOrder.DS: chnMask = [true, false, false, true]; break;
        case tcuTexture.ChannelOrder.S: chnMask = [false, false, false, true]; break;
        default:
            DE_ASSERT(false);
    }

    return select(deMath.swizzle(chnBits, [chnSwz[0], chnSwz[1], chnSwz[2], chnSwz[3]]), [0, 0, 0, 0], chnMask);

};

var linearChannelToSRGB = function(cl) {
    if (cl <= 0)
        return 0;
    else if (cl < 0.0031308)
        return 12.92 * cl;
    else if (cl < 1.0)
        return 1.055 * Math.pow(cl, 0.41666) - 0.055;
    else
        return 1.0;
};

var linearToSRGB = function(cl) {
    return [linearChannelToSRGB(cl[0]),
                linearChannelToSRGB(cl[1]),
                linearChannelToSRGB(cl[2]),
                cl[3]];
};

return {
    clear: clear,
    TextureChannelClass: TextureChannelClass,
    getTextureChannelClass: getTextureChannelClass,
    getSubregion: getSubregion,
    fillWithComponentGradients: fillWithComponentGradients,
    select: select,
    getTextureFormatInfo: getTextureFormatInfo,
    getChannelBitDepth: getChannelBitDepth,
    getTextureFormatBitDepth: getTextureFormatBitDepth,
    linearToSRGB: linearToSRGB
};

});
