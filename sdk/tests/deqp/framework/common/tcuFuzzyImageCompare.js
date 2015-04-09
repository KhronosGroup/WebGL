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

define([
    'framework/delibs/debase/deMath',
    'framework/delibs/debase/deRandom',
    'framework/common/tcuTexture',
    'framework/common/tcuTextureUtil'],
    function (
        deMath,
        deRandom,
        tcuTexture,
        tcuTextureUtil
    ) {
    'use strict';

    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    var DE_NULL = null;

    /**
     * FuzzyCompareParams struct
     * @constructor
     * @param {number} maxSampleSkip_
     * @param {number} minErrThreshold_
     * @param {number} errExp_
     */
    var FuzzyCompareParams = function (maxSampleSkip_, minErrThreshold_, errExp_) {
        /** @type {number} */ this.maxSampleSkip = maxSampleSkip_ === undefined ? 8 : maxSampleSkip_;
        /** @type {number} */ this.minErrThreshold = minErrThreshold_ === undefined ? 4 : minErrThreshold_;
        /** @type {number} */ this.errExp = errExp_ === undefined ? 4.0 : errExp_;
    };

    /**
     * @param {number} color
     * @param {number} channel
     * @return {number}
     */
    var getChannel = function (color, channel) {
        if (channel > 4) return 0; //No point trying to get a channel beyond the color parameter's 32-bit boundary.
        var buffer = new ArrayBuffer(4);
        var result = new Uint32Array(buffer);
        result[0] = color;
        return (new Uint8Array(buffer))[channel];
    };

    /**
     * @param {number} color
     * @param {number} channel
     * @param {number} val
     * @return {number}
     */
    var setChannel = function (color, channel, val) {
        if(channel > 4) return color; //No point trying to set a channel beyond the color parameter's 32-bit boundary.
        var buffer = new ArrayBuffer(4);
        var result = new Uint32Array(buffer);
        result[0] = color;
        var preresult = new Uint8Array(buffer);
        preresult[channel] = val;

        return result[0];
    };

    /**
     * @param {number} color
     * @return {Array<deMath.deUint32>}
     */
    var toFloatVec = function (color) {
        return [getChannel(color, 0), getChannel(color, 1), getChannel(color, 2), getChannel(color, 3)];
    };

    /**
     * @param {number} v
     * @return {number}
     */
    var roundToUint8Sat = function (v) {
        return new Uint8Array([deMath.clamp(v + 0.5, 0, 255)])[0];
    };

    /**
     * @param {Array<number>} v
     * @return {number}
     */
    var toColor = function (v) {
        var buffer = new ArrayBuffer(4);
        var result = new Uint8Array(buffer);
        result[0] = roundToUint8Sat(v[0]);
        result[1] = roundToUint8Sat(v[1]);
        result[2] = roundToUint8Sat(v[2]);
        result[3] = roundToUint8Sat(v[3]);

        return new Uint32Array(buffer)[0];
    };

    /**
     * @param {tcuTexture.ConstPixelBufferAccess} src
     * @param {number} x
     * @param {number} y
     * @param {number} NumChannels
     * @return {number}
     */
    var readUnorm8 = function (src, x, y, NumChannels) {
        var start = src.getRowPitch() * y + x * NumChannels;
        var end = start + NumChannels;
        /** @type {TypedArray} */ var ptr = src.getDataPtr().subarray(start, end);
        /** @type {Uint32Array} */ var v = new Uint32Array(ptr); //Small buffer copy

        return v[0]; //Expected return value is 32-bit max, regardless if it's made of more than 4 channels one byte each.
    };

    /**
     * @param {tcuTexture.PixelBufferAccess} dst
     * @param {number} x
     * @param {number} y
     * @param {number} val
     * @param {number} NumChannels
     */
    var writeUnorm8 = function (dst, x, y, val, NumChannels) {
        var start = dst.getRowPitch() * y + x * NumChannels;
        /** @type {Uint8Array} */ var ptr = new Uint8Array(dst.getBuffer());

        for (var c = 0; c < NumChannels; c++)
            ptr[start + c] = getChannel(val, c);
    };

    /**
     * @param {number} pa
     * @param {number} pb
     * @param {number} minErrThreshold
     * @return {number}
     */
    var compareColors = function (pa, pb, minErrThreshold) {
        /** @type {number}*/ var r = Math.max(Math.abs(getChannel(pa, 0) - getChannel(pb, 0)) - minErrThreshold, 0);
        /** @type {number}*/ var g = Math.max(Math.abs(getChannel(pa, 1) - getChannel(pb, 1)) - minErrThreshold, 1);
        /** @type {number}*/ var b = Math.max(Math.abs(getChannel(pa, 2) - getChannel(pb, 2)) - minErrThreshold, 2);
        /** @type {number}*/ var a = Math.max(Math.abs(getChannel(pa, 3) - getChannel(pb, 3)) - minErrThreshold, 3);

        /** @type {number}*/ var scale = 1.0 / (255 - minErrThreshold);
        /** @type {number}*/ var sqSum = (r * r + g * g + b * b + a * a) * (scale * scale);

        return Math.sqrt(sqSum);
    };

    /**
     * @param {ConstPixelBufferAccess} src
     * @param {number} u
     * @param {number} v
     * @param {number} NumChannels
     * @return {number}
     */
    var bilinearSample = function (src, u, v, NumChannels) {
        /** @type {number}*/ var w = src.getWidth();
        /** @type {number}*/ var h = src.getHeight();

        /** @type {number}*/ var x0 = Math.floor(u - 0.5);
        /** @type {number}*/ var x1 = x0 + 1;
        /** @type {number}*/ var y0 = Math.floor(v - 0.5);
        /** @type {number}*/ var y1 = y0 + 1;

        /** @type {number}*/ var i0 = deMath.clamp(x0, 0, w - 1);
        /** @type {number}*/ var i1 = deMath.clamp(x1, 0, w - 1);
        /** @type {number}*/ var j0 = deMath.clamp(y0, 0, h - 1);
        /** @type {number}*/ var j1 = deMath.clamp(y1, 0, h - 1);

        /** @type {number}*/ var a = (u - 0.5) - Math.floor(u - 0.5);;
        /** @type {number}*/ var b = (u - 0.5) - Math.floor(u - 0.5);;

        /** @type {number} */ var p00 = readUnorm8(src, i0, j0, NumChannels);
        /** @type {number} */ var p10 = readUnorm8(src, i1, j0, NumChannels);
        /** @type {number} */ var p01 = readUnorm8(src, i0, j1, NumChannels);
        /** @type {number} */ var p11 = readUnorm8(src, i1, j1, NumChannels);
        /** @type {number} */ var dst = 0;

        // Interpolate.
        for (var c = 0; c < NumChannels; c++)
        {
            /** @type {number}*/ var f = getChannel(p00, c) * (1.0 - a) * (1.0 - b) +
                (getChannel(p10, c) * a * (1.0 - b)) +
                (getChannel(p01, c) * (1.0 - a) * b) +
                (getChannel(p11, c) * a * b);
            dst = setChannel(dst, c, roundToUint8Sat(f));
        }

        return dst;
    };

    /**
     * @param {tcuTexture.PixelBufferAccess} dst
     * @param {tcuTexture.ConstPixelBufferAccess} src
     * @param {number} shiftX
     * @param {number} shiftY
     * @param {Array<number>} kernelX
     * @param {Array<number>} kernelY
     * @param {number} DstChannels
     * @param {number} SrcChannels
     */
    var separableConvolve = function (dst, src, shiftX, shiftY, kernelX, kernelY, DstChannels, SrcChannels) {
        DE_ASSERT(dst.getWidth() == src.getWidth() && dst.getHeight() == src.getHeight());

        /** @type {tcuTexture.TextureLevel} */ var tmp = new tcuTexture.TextureLevel(dst.getFormat(), dst.getHeight(), dst.getWidth());
        /** @type {tcuTexture.PixelBufferAccess} */ var tmpAccess = tmp.getAccess();

        /** @type {number} */ var kw = kernelX.length;
        /** @type {number} */ var kh = kernelY.length;

        // Horizontal pass
        // \note Temporary surface is written in column-wise order
        for (var j = 0; j < src.getHeight(); j++) {
            for (var i = 0; i < src.getWidth(); i++) {
                /** @type {Array<number>} */ var sum = new Array(4);
                sum[0] = sum[1] = sum[2] = sum[3] = 0;
                for (var kx = 0; kx < kw; kx++) {
                    /** @type {number} */ var f = kernelX[kw - kx - 1];
                    /** @type {number} */ var p = readUnorm8(src, deMath.clamp(i + kx - shiftX, 0, src.getWidth()-1), j, SrcChannels);
                    sum = deMath.add(sum, deMath.multiply(toFloatVec(p), toFloatVec(f)));
                }

                writeUnorm8(tmpAccess, j, i, toColor(sum), DstChannels);
            }
        }

        // Vertical pass
        for (var j = 0; j < src.getHeight(); j++) {
            for (var i = 0; i < src.getWidth(); i++) {
                /** @type {Array<number>} */ var sum = new Array(4);
                sum[0] = sum[1] = sum[2] = sum[3] = 0;
                for (var ky = 0; ky < kh; ky++) {
                    /** @type {number} */ var f = kernelY[kh - ky - 1];
                    /** @type {number} */ var p = readUnorm8(tmpAccess, deMath.clamp(j + ky - shiftY, 0, tmp.getWidth()-1), i, DstChannels);
                    sum = deMath.add(sum, deMath.multiply(toFloatVec(p), toFloatVec(f)));
                }

                writeUnorm8(dst, i, j, toColor(sum), DstChannels);
            }
        }
    };

    /**
     * @param {FuzzyCompareParams} params
     * @param {deRandom.Random} rnd
     * @param {number} pixel
     * @param {ConstPixelBufferAccess} surface
     * @param {number} x
     * @param {number} y
     * @param {number} NumChannels
     * @return {number}
     */
    var compareToNeighbor = function (params, rnd, pixel, surface, x, y, NumChannels) {
        /** @type {number} */ var minErr = 100;

        // (x, y) + (0, 0)
        minErr = Math.min(minErr, compareColors(pixel, readUnorm8(surface, x, y, NumChannels), params.minErrThreshold));
        if (minErr == 0.0)
            return minErr;

        // Area around (x, y)
        /** @type {Array<Array.<number>>} */ var s_coords =
        [
            [-1, -1],
            [ 0, -1],
            [ 1, -1],
            [-1,  0],
            [ 1,  0],
            [-1,  1],
            [ 0,  1],
            [ 1,  1]
        ];

        for (var d = 0; d < s_coords.length; d++) {
            /** @type {number} */ var dx = x + s_coords[d][0];
            /** @type {number} */ var dy = y + s_coords[d][1];

            if (!deMath.deInBounds32(dx, 0, surface.getWidth()) || !deMath.deInBounds32(dy, 0, surface.getHeight()))
                continue;

            minErr = Math.min(minErr, compareColors(pixel, readUnorm8(surface, dx, dy, NumChannels), params.minErrThreshold));
            if (minErr == 0.0)
                return minErr;
        }

        // Random bilinear-interpolated samples around (x, y)
        for (var s = 0; s < 32; s++) {
            /** @type {number} */ var dx = x + rnd.getFloat() * 2.0 - 0.5;
            /** @type {number} */ var dy = y + rnd.getFloat() * 2.0 - 0.5;

            /** @type {number} */ var sample = bilinearSample(surface, dx, dy, NumChannels);

            minErr = Math.min(minErr, compareColors(pixel, sample, params.minErrThreshold));
            if (minErr == 0.0)
                return minErr;
        }

        return minErr;
    };

    /**
     * @param {Array<number>} c
     * @return {number}
     */
    var toGrayscale = function (c) {
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };

    /**
     * @param {tcuTexture.TextureFormat} format
     * @return {boolean}
     */
    var isFormatSupported = function (format) {
        return format.type == tcuTexture.ChannelType.UNORM_INT8 && (format.order == tcuTexture.ChannelOrder.RGB || format.order == tcuTexture.ChannelOrder.RGBA);
    };

    /**
     * @param {FuzzyCompareParams} params
     * @param {tcuTexture.ConstPixelBufferAccess} ref
     * @param {tcuTexture.ConstPixelBufferAccess} cmp
     * @param {tcuTexture.PixelBufferAccess} errorMask
     * @return {number}
     */
    var fuzzyCompare = function (params, ref, cmp, errorMask) {
        DE_ASSERT(ref.getWidth() == cmp.getWidth() && ref.getHeight() == cmp.getHeight());
        DE_ASSERT(errorMask.getWidth() == ref.getWidth() && errorMask.getHeight() == ref.getHeight());
        // TODO: this is a work around to debug/test (errorMask_)
        var errorMask_ = tcuTexture.PixelBufferAccess.newFromTextureLevel(errorMask);
        if (!isFormatSupported(ref.getFormat()) || !isFormatSupported(cmp.getFormat()))
            throw new Error("Unsupported format in fuzzy comparison");

        /** @type {number} */ var width = ref.getWidth();
        /** @type {number} */ var height = ref.getHeight();
        /** @type {deRandom.Random} */ var rnd = new deRandom.Random(667);

        // Filtered
        /** @type {tcuTexture.TextureLevel} */ var refFiltered = new tcuTexture.TextureLevel(new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_INT8), width, height);
        /** @type {tcuTexture.TextureLevel} */ var cmpFiltered = new tcuTexture.TextureLevel(new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_INT8), width, height);

        // Kernel = {0.15, 0.7, 0.15}
        /** @type {Array<number>} */ var kernel = new Array(3);
        kernel[0] = kernel[2] = 0.1; kernel[1]= 0.8;
        /** @type {number} */ var shift = Math.floor((kernel.length - 1) / 2);

        switch (ref.getFormat().order) {
            case tcuTexture.ChannelOrder.RGBA: separableConvolve(tcuTexture.PixelBufferAccess.newFromTextureLevel(refFiltered), ref, shift, shift, kernel, kernel, 4, 4); break;
            case tcuTexture.ChannelOrder.RGB: separableConvolve(tcuTexture.PixelBufferAccess.newFromTextureLevel(refFiltered), ref, shift, shift, kernel, kernel, 4, 3); break;
            default:
                throw new Error('fuzzyCompare - Invalid ChannelOrder');
        }

        switch (cmp.getFormat().order) {
            case tcuTexture.ChannelOrder.RGBA: separableConvolve(tcuTexture.PixelBufferAccess.newFromTextureLevel(cmpFiltered), cmp, shift, shift, kernel, kernel, 4, 4); break;
            case tcuTexture.ChannelOrder.RGB: separableConvolve(tcuTexture.PixelBufferAccess.newFromTextureLevel(cmpFiltered), cmp, shift, shift, kernel, kernel, 4, 3); break;
            default:
                throw new Error('fuzzyCompare - Invalid ChannelOrder');
        }

        /** @type {number} */ var numSamples  = 0;
        /** @type {number} */ var errSum      = 0.0;

        // Clear error mask to green.
        tcuTextureUtil.clear(errorMask, [0.0, 1.0, 0.0, 1.0]);

        /** @type {ConstPixelBufferAccess} */ var refAccess = refFiltered.getAccess();
        /** @type {ConstPixelBufferAccess} */ var cmpAccess = cmpFiltered.getAccess();

        for (var y = 1; y < height-1; y++) {
            for (var x = 1; x < width-1; x += params.maxSampleSkip > 0 ? rnd.getInt(0, params.maxSampleSkip) : 1) {
                /** @type {number} */ var err = Math.min(compareToNeighbor(params, rnd, readUnorm8(refAccess, x, y, 4), cmpAccess, x, y, 4),
                                       compareToNeighbor(params, rnd, readUnorm8(cmpAccess, x, y, 4), refAccess, x, y, 4));

                err = Math.pow(err, params.errExp);

                errSum      += err;
                numSamples  += 1;

                // Build error image.
                /** @type {number} */ var red = err * 500.0;
                /** @type {number} */ var luma = toGrayscale(cmp.getPixel(x, y));
                /** @type {number} */ var rF = 0.7 + 0.3 * luma;
                errorMask_.setPixel([red * rF, (1.0 - red) * rF, 0.0, 1.0], x, y);

            }
        }

        // Scale error sum based on number of samples taken
        errSum *= ((width-2) * (height-2)) / numSamples;

        return errSum;
    };

return {
    FuzzyCompareParams: FuzzyCompareParams,
    fuzzyCompare: fuzzyCompare
}

});
