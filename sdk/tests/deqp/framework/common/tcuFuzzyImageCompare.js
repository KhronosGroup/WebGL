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
goog.provide('framework.common.tcuFuzzyImageCompare');
goog.require('framework.common.tcuTexture');
goog.require('framework.common.tcuTextureUtil');
goog.require('framework.delibs.debase.deMath');
goog.require('framework.delibs.debase.deRandom');

goog.scope(function() {

var tcuFuzzyImageCompare = framework.common.tcuFuzzyImageCompare;
var deMath = framework.delibs.debase.deMath;
var deRandom = framework.delibs.debase.deRandom;
var tcuTexture = framework.common.tcuTexture;
var tcuTextureUtil = framework.common.tcuTextureUtil;

    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    tcuFuzzyImageCompare.DE_NULL = null;

    /**
     * tcuFuzzyImageCompare.FuzzyCompareParams struct
     * @constructor
     * @param {number=} maxSampleSkip_
     * @param {number=} minErrThreshold_
     * @param {number=} errExp_
     */
    tcuFuzzyImageCompare.FuzzyCompareParams = function(maxSampleSkip_, minErrThreshold_, errExp_) {
        /** @type {number} */ this.maxSampleSkip = maxSampleSkip_ === undefined ? 8 : maxSampleSkip_;
        /** @type {number} */ this.minErrThreshold = minErrThreshold_ === undefined ? 4 : minErrThreshold_;
        /** @type {number} */ this.errExp = errExp_ === undefined ? 4.0 : errExp_;
    };

    /**
     * @param {number} color
     * @param {number} channel
     * @return {number}
     */
    tcuFuzzyImageCompare.getChannel = function(color, channel) {
        if (channel > 4) return 0; //No point trying to get a channel beyond the color parameter's 32-bit boundary.
        var buffer = new ArrayBuffer(4);
        var result = new Uint32Array(buffer);
        result[0] = color;
        return (new Uint8Array(buffer))[channel];
    };

    /**
     * @param {number} color
     * @return {Uint8Array}
     */
    tcuFuzzyImageCompare.getChannels = function(color) {
        var result = new Uint32Array([color]);
        return new Uint8Array(result.buffer);
    };

    /**
     * @param {number} color
     * @param {number} channel
     * @param {number} val
     * @return {number}
     */
    tcuFuzzyImageCompare.setChannel = function(color, channel, val) {
        if (channel > 4) return color; //No point trying to set a channel beyond the color parameter's 32-bit boundary.
        var buffer = new ArrayBuffer(4);
        var result = new Uint32Array(buffer);
        result[0] = color;
        var preresult = new Uint8Array(buffer);
        preresult[channel] = val;

        return result[0];
    };

    /**
     * @param {number} color
     * @return {Array<number>}
     */
    tcuFuzzyImageCompare.toFloatVec = function(color) {
        return [tcuFuzzyImageCompare.getChannel(color, 0), tcuFuzzyImageCompare.getChannel(color, 1), tcuFuzzyImageCompare.getChannel(color, 2), tcuFuzzyImageCompare.getChannel(color, 3)];
    };

    /**
     * @param {number} v
     * @return {number}
     */
    tcuFuzzyImageCompare.roundToUint8Sat = function(v) {
        return new Uint8Array([deMath.clamp(v + 0.5, 0, 255)])[0];
    };

    /**
     * @param {Array<number>} v
     * @return {Uint8Array}
     */
    tcuFuzzyImageCompare.roundArray4ToUint8Sat = function(v) {
        return new Uint8Array([
            deMath.clamp(v[0] + 0.5, 0, 255),
            deMath.clamp(v[1] + 0.5, 0, 255),
            deMath.clamp(v[2] + 0.5, 0, 255),
            deMath.clamp(v[3] + 0.5, 0, 255)
        ]);
    };

    /**
     * @param {Array<number>} v
     * @return {number}
     */
    tcuFuzzyImageCompare.toColor = function(v) {
        var buffer = new ArrayBuffer(4);
        var result = new Uint8Array(buffer);
        result[0] = tcuFuzzyImageCompare.roundToUint8Sat(v[0]);
        result[1] = tcuFuzzyImageCompare.roundToUint8Sat(v[1]);
        result[2] = tcuFuzzyImageCompare.roundToUint8Sat(v[2]);
        result[3] = tcuFuzzyImageCompare.roundToUint8Sat(v[3]);

        return new Uint32Array(buffer)[0];
    };

    /**
     * @param {tcuTexture.ConstPixelBufferAccess} src
     * @param {number} x
     * @param {number} y
     * @param {number} NumChannels
     * @return {number}
     */
    tcuFuzzyImageCompare.readUnorm8 = function(src, x, y, NumChannels) {
        var start = src.getRowPitch() * y + x * NumChannels;
        var end = start + NumChannels;
        /** @type {goog.TypedArray} */ var ptr = src.getDataPtr().subarray(start, end);
        /** @type {Uint32Array} */ var v = new Uint32Array(ptr.buffer).subarray(
            start * ptr.BYTES_PER_ELEMENT / 4,
            start * ptr.BYTES_PER_ELEMENT / 4);

        return v[0]; //Expected return value is 32-bit max, regardless if it's made of more than 4 channels one byte each.
    };

    /**
     * @param {tcuTexture.PixelBufferAccess} dst
     * @param {number} x
     * @param {number} y
     * @param {number} val
     * @param {number} NumChannels
     */
    tcuFuzzyImageCompare.writeUnorm8 = function(dst, x, y, val, NumChannels) {
        var start = dst.getRowPitch() * y + x * NumChannels;
        /** @type {Uint8Array} */ var ptr = new Uint8Array(dst.getBuffer());

        for (var c = 0; c < NumChannels; c++)
            ptr[start + c] = tcuFuzzyImageCompare.getChannel(val, c);
    };

    /**
     * @param {number} pa
     * @param {number} pb
     * @param {number} minErrThreshold
     * @return {number}
     */
    tcuFuzzyImageCompare.compareColors = function(pa, pb, minErrThreshold) {
        /** @type {number}*/ var r = Math.max(Math.abs(tcuFuzzyImageCompare.getChannel(pa, 0) - tcuFuzzyImageCompare.getChannel(pb, 0)) - minErrThreshold, 0);
        /** @type {number}*/ var g = Math.max(Math.abs(tcuFuzzyImageCompare.getChannel(pa, 1) - tcuFuzzyImageCompare.getChannel(pb, 1)) - minErrThreshold, 0);
        /** @type {number}*/ var b = Math.max(Math.abs(tcuFuzzyImageCompare.getChannel(pa, 2) - tcuFuzzyImageCompare.getChannel(pb, 2)) - minErrThreshold, 0);
        /** @type {number}*/ var a = Math.max(Math.abs(tcuFuzzyImageCompare.getChannel(pa, 3) - tcuFuzzyImageCompare.getChannel(pb, 3)) - minErrThreshold, 0);

        /** @type {number}*/ var scale = 1.0 / (255 - minErrThreshold);
        /** @type {number}*/ var sqSum = (r * r + g * g + b * b + a * a) * (scale * scale);

        return Math.sqrt(sqSum);
    };

    /**
     * @param {tcuTexture.ConstPixelBufferAccess} src
     * @param {number} u
     * @param {number} v
     * @param {number} NumChannels
     * @return {number}
     */
    tcuFuzzyImageCompare.bilinearSample = function(src, u, v, NumChannels) {
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

        /** @type {number}*/ var a = (u - 0.5) - Math.floor(u - 0.5);
        /** @type {number}*/ var b = (u - 0.5) - Math.floor(u - 0.5);

        /** @type {number} */ var p00 = tcuFuzzyImageCompare.readUnorm8(src, i0, j0, NumChannels);
        /** @type {number} */ var p10 = tcuFuzzyImageCompare.readUnorm8(src, i1, j0, NumChannels);
        /** @type {number} */ var p01 = tcuFuzzyImageCompare.readUnorm8(src, i0, j1, NumChannels);
        /** @type {number} */ var p11 = tcuFuzzyImageCompare.readUnorm8(src, i1, j1, NumChannels);
        /** @type {number} */ var dst = 0;

        //Javascript optimization
        var p00_channels = tcuFuzzyImageCompare.getChannels(p00);
        var p10_channels = tcuFuzzyImageCompare.getChannels(p10);
        var p01_channels = tcuFuzzyImageCompare.getChannels(p01);
        var p11_channels = tcuFuzzyImageCompare.getChannels(p11);

        // Interpolate.
        for (var c = 0; c < NumChannels; c++) {
            /** @type {Array<number>}*/ var f = [];
                f[c] = p00_channels[c] * (1.0 - a) * (1.0 - b) +
                (p10_channels[c] * a * (1.0 - b)) +
                (p01_channels[c] * (1.0 - a) * b) +
                (p11_channels[c] * a * b);
        }

        //Javascript optimization - dst = tcuFuzzyImageCompare.setChannels(dst, c, tcuFuzzyImageCompare.roundArray4ToUint8Sat(f));
        dst = new Uint32Array(tcuFuzzyImageCompare.roundArray4ToUint8Sat(f).buffer)[0];

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
    tcuFuzzyImageCompare.separableConvolve = function(dst, src, shiftX, shiftY, kernelX, kernelY, DstChannels, SrcChannels) {
        DE_ASSERT(dst.getWidth() == src.getWidth() && dst.getHeight() == src.getHeight());

        /** @type {tcuTexture.TextureLevel} */ var tmp = new tcuTexture.TextureLevel(dst.getFormat(), dst.getHeight(), dst.getWidth());
        /** @type {tcuTexture.PixelBufferAccess} */ var tmpAccess = tmp.getAccess();

        /** @type {number} */ var kw = kernelX.length;
        /** @type {number} */ var kh = kernelY.length;

        /** @type {Array<number>} */ var sum;
        /** @type {number} */ var f;
        /** @type {number} */ var p;

        // Horizontal pass
        // \note Temporary surface is written in column-wise order
        for (var j = 0; j < src.getHeight(); j++) {
            for (var i = 0; i < src.getWidth(); i++) {
                sum = new Array(4);
                sum[0] = sum[1] = sum[2] = sum[3] = 0;
                for (var kx = 0; kx < kw; kx++) {
                    f = kernelX[kw - kx - 1];
                    p = tcuFuzzyImageCompare.readUnorm8(src, deMath.clamp(i + kx - shiftX, 0, src.getWidth() - 1), j, SrcChannels);
                    sum = deMath.add(sum, deMath.multiply(tcuFuzzyImageCompare.toFloatVec(p), tcuFuzzyImageCompare.toFloatVec(f)));
                }

                tcuFuzzyImageCompare.writeUnorm8(tmpAccess, j, i, tcuFuzzyImageCompare.toColor(sum), DstChannels);
            }
        }

        // Vertical pass
        for (var j = 0; j < src.getHeight(); j++) {
            for (var i = 0; i < src.getWidth(); i++) {
                sum = new Array(4);
                sum[0] = sum[1] = sum[2] = sum[3] = 0;
                for (var ky = 0; ky < kh; ky++) {
                    f = kernelY[kh - ky - 1];
                    p = tcuFuzzyImageCompare.readUnorm8(tmpAccess, deMath.clamp(j + ky - shiftY, 0, tmp.getWidth() - 1), i, DstChannels);
                    sum = deMath.add(sum, deMath.multiply(tcuFuzzyImageCompare.toFloatVec(p), tcuFuzzyImageCompare.toFloatVec(f)));
                }

                tcuFuzzyImageCompare.writeUnorm8(dst, i, j, tcuFuzzyImageCompare.toColor(sum), DstChannels);
            }
        }
    };

    /**
     * @param {tcuFuzzyImageCompare.FuzzyCompareParams} params
     * @param {deRandom.Random} rnd
     * @param {number} pixel
     * @param {tcuTexture.ConstPixelBufferAccess} surface
     * @param {number} x
     * @param {number} y
     * @param {number} NumChannels
     * @return {number}
     */
    tcuFuzzyImageCompare.compareToNeighbor = function(params, rnd, pixel, surface, x, y, NumChannels) {
        /** @type {number} */ var minErr = 100;

        // (x, y) + (0, 0)
        minErr = Math.min(minErr, tcuFuzzyImageCompare.compareColors(pixel, tcuFuzzyImageCompare.readUnorm8(surface, x, y, NumChannels), params.minErrThreshold));
        if (minErr == 0.0)
            return minErr;

        // Area around (x, y)
        /** @type {Array<Array.<number>>} */ var s_coords =
        [
            [-1, -1],
            [0, -1],
            [1, -1],
            [-1, 0],
            [1, 0],
            [-1, 1],
            [0, 1],
            [1, 1]
        ];

        /** @type {number} */ var dx;
        /** @type {number} */ var dy;

        for (var d = 0; d < s_coords.length; d++) {
            dx = x + s_coords[d][0];
            dy = y + s_coords[d][1];

            if (!deMath.deInBounds32(dx, 0, surface.getWidth()) || !deMath.deInBounds32(dy, 0, surface.getHeight()))
                continue;

            minErr = Math.min(minErr, tcuFuzzyImageCompare.compareColors(pixel, tcuFuzzyImageCompare.readUnorm8(surface, dx, dy, NumChannels), params.minErrThreshold));
            if (minErr == 0.0)
                return minErr;
        }

        // Random bilinear-interpolated samples around (x, y)
        for (var s = 0; s < 32; s++) {
            dx = x + rnd.getFloat() * 2.0 - 0.5;
            dy = y + rnd.getFloat() * 2.0 - 0.5;

            /** @type {number} */ var sample = tcuFuzzyImageCompare.bilinearSample(surface, dx, dy, NumChannels);

            minErr = Math.min(minErr, tcuFuzzyImageCompare.compareColors(pixel, sample, params.minErrThreshold));
            if (minErr == 0.0)
                return minErr;
        }

        return minErr;
    };

    /**
     * @param {Array<number>} c
     * @return {number}
     */
    tcuFuzzyImageCompare.toGrayscale = function(c) {
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };

    /**
     * @param {tcuTexture.TextureFormat} format
     * @return {boolean}
     */
    tcuFuzzyImageCompare.isFormatSupported = function(format) {
        return format.type == tcuTexture.ChannelType.UNORM_INT8 && (format.order == tcuTexture.ChannelOrder.RGB || format.order == tcuTexture.ChannelOrder.RGBA);
    };

    /**
     * @param {tcuFuzzyImageCompare.FuzzyCompareParams} params
     * @param {tcuTexture.ConstPixelBufferAccess} ref
     * @param {tcuTexture.ConstPixelBufferAccess} cmp
     * @param {tcuTexture.PixelBufferAccess} errorMask
     * @return {number}
     */
    tcuFuzzyImageCompare.fuzzyCompare = function(params, ref, cmp, errorMask) {
        assertMsgOptions(ref.getWidth() == cmp.getWidth() && ref.getHeight() == cmp.getHeight(),
            'Reference and result images have different dimensions', false, true);

        assertMsgOptions(ref.getWidth() == errorMask.getWidth() && ref.getHeight() == errorMask.getHeight(),
            'Reference and error mask images have different dimensions', false, true);

        if (!tcuFuzzyImageCompare.isFormatSupported(ref.getFormat()) || !tcuFuzzyImageCompare.isFormatSupported(cmp.getFormat()))
            throw new Error('Unsupported format in fuzzy comparison');

        /** @type {number} */ var width = ref.getWidth();
        /** @type {number} */ var height = ref.getHeight();
        /** @type {deRandom.Random} */ var rnd = new deRandom.Random(667);

        // Filtered
        /** @type {tcuTexture.TextureLevel} */ var refFiltered = new tcuTexture.TextureLevel(new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_INT8), width, height);
        /** @type {tcuTexture.TextureLevel} */ var cmpFiltered = new tcuTexture.TextureLevel(new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_INT8), width, height);

        // Kernel = {0.15, 0.7, 0.15}
        /** @type {Array<number>} */ var kernel = new Array(3);
        kernel[0] = kernel[2] = 0.1; kernel[1] = 0.8;
        /** @type {number} */ var shift = Math.floor((kernel.length - 1) / 2);

        switch (ref.getFormat().order) {
            case tcuTexture.ChannelOrder.RGBA: tcuFuzzyImageCompare.separableConvolve(tcuTexture.PixelBufferAccess.newFromTextureLevel(refFiltered), ref, shift, shift, kernel, kernel, 4, 4); break;
            case tcuTexture.ChannelOrder.RGB: tcuFuzzyImageCompare.separableConvolve(tcuTexture.PixelBufferAccess.newFromTextureLevel(refFiltered), ref, shift, shift, kernel, kernel, 4, 3); break;
            default:
                throw new Error('tcuFuzzyImageCompare.fuzzyCompare - Invalid ChannelOrder');
        }

        switch (cmp.getFormat().order) {
            case tcuTexture.ChannelOrder.RGBA: tcuFuzzyImageCompare.separableConvolve(tcuTexture.PixelBufferAccess.newFromTextureLevel(cmpFiltered), cmp, shift, shift, kernel, kernel, 4, 4); break;
            case tcuTexture.ChannelOrder.RGB: tcuFuzzyImageCompare.separableConvolve(tcuTexture.PixelBufferAccess.newFromTextureLevel(cmpFiltered), cmp, shift, shift, kernel, kernel, 4, 3); break;
            default:
                throw new Error('tcuFuzzyImageCompare.fuzzyCompare - Invalid ChannelOrder');
        }

        /** @type {number} */ var numSamples = 0;
        /** @type {number} */ var errSum = 0.0;

        // Clear error mask to green.
        errorMask.clear([0.0, 1.0, 0.0, 1.0]);

        /** @type {tcuTexture.ConstPixelBufferAccess} */ var refAccess = refFiltered.getAccess();
        /** @type {tcuTexture.ConstPixelBufferAccess} */ var cmpAccess = cmpFiltered.getAccess();

        for (var y = 1; y < height - 1; y++) {
            for (var x = 1; x < width - 1; x += params.maxSampleSkip > 0 ? rnd.getInt(0, params.maxSampleSkip) : 1) {
                /** @type {number} */ var err = Math.min(tcuFuzzyImageCompare.compareToNeighbor(params, rnd, tcuFuzzyImageCompare.readUnorm8(refAccess, x, y, 4), cmpAccess, x, y, 4),
                                       tcuFuzzyImageCompare.compareToNeighbor(params, rnd, tcuFuzzyImageCompare.readUnorm8(cmpAccess, x, y, 4), refAccess, x, y, 4));

                err = Math.pow(err, params.errExp);

                errSum += err;
                numSamples += 1;

                // Build error image.
                /** @type {number} */ var red = err * 500.0;
                /** @type {number} */ var luma = tcuFuzzyImageCompare.toGrayscale(cmp.getPixel(x, y));
                /** @type {number} */ var rF = 0.7 + 0.3 * luma;
                errorMask.setPixel([red * rF, (1.0 - red) * rF, 0.0, 1.0], x, y);

            }
        }

        // Scale error sum based on number of samples taken
        errSum *= ((width - 2) * (height - 2)) / numSamples;

        return errSum;
    };

});
