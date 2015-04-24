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
goog.provide('framework.common.tcuBilinearImageCompare');
goog.require('framework.common.tcuRGBA');
goog.require('framework.common.tcuTexture');
goog.require('framework.delibs.debase.deMath');

goog.scope(function() {

    var tcuBilinearImageCompare = framework.common.tcuBilinearImageCompare;
    var deMath = framework.delibs.debase.deMath;
    var tcuTexture = framework.common.tcuTexture;
    var tcuRGBA = framework.common.tcuRGBA;

    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    // for bilinear interpolation
    /** @const {number} */ tcuBilinearImageCompare.NUM_SUBPIXEL_BITS = 8;

    // Algorithm assumes that colors are packed to 32-bit values as dictated by
    // tcu::RGBA::*_SHIFT values.

    /**
     * @param {number} color
     * @param {number} channel
     * @return {number}
     */
    tcuBilinearImageCompare.getChannel = function(color, channel) {
        if (channel > 4) return 0;
        var buffer = new ArrayBuffer(4);
        var result = new Uint32Array(buffer);
        result[0] = color;
        return (new Uint8Array(buffer))[channel];
    };

    /**
     * @param {tcuTexture.ConstPixelBufferAccess} src
     * @param {number} x
     * @param {number} y
     * @return {number}
     */
    tcuBilinearImageCompare.readRGBA8Raw = function(src, x, y) {
        var start = src.getRowPitch() * y + x * 4;
        var end = start + 4; // RGBA uses 4 channels
        /** @type {goog.TypedArray} */
        var ptr = src.getDataPtr().subarray(start, end);
        /** @type {Uint32Array} */ var v = new Uint32Array(ptr);
        return v[0];
    };

    /**
     * @param {tcuTexture.ConstPixelBufferAccess} src
     * @param {number} x
     * @param {number} y
     * @return {tcuRGBA.RGBA}
     */
    tcuBilinearImageCompare.readRGBA8 = function(src, x, y) {
        /** @type {number} */ var raw = tcuBilinearImageCompare.readRGBA8Raw(src, x, y);
        /** @type {Array<number>} */ var res = [
            tcuBilinearImageCompare.getChannel(raw, 0),
            tcuBilinearImageCompare.getChannel(raw, 1),
            tcuBilinearImageCompare.getChannel(raw, 2),
            tcuBilinearImageCompare.getChannel(raw, 3)
        ];
        return tcuRGBA.newRGBAFromArray(res);
    };

    /**
    * @param {number} fx1 deUint32
    * @param {number} fy1 deUint32
    * @param {number} p00 deUint8
    * @param {number} p01 deUint8
    * @param {number} p10 deUint8
    * @param {number} p11 deUint8
    * @return {number} deUint8
    */
    tcuBilinearImageCompare.interpolateChannel = function(fx1, fy1, p00, p01, p10, p11) {
        /** @const {number} */ var fx0 = (1 << tcuBilinearImageCompare.NUM_SUBPIXEL_BITS) - fx1;
        /** @const {number} */ var fy0 = (1 << tcuBilinearImageCompare.NUM_SUBPIXEL_BITS) - fy1;
        /** @const {number} */
        var half = 1 << (tcuBilinearImageCompare.NUM_SUBPIXEL_BITS * 2 - 1);
        /** @const {number} */ var sum =
            (fx0 * fy0 * p00) +
            (fx1 * fy0 * p10) +
            (fx0 * fy1 * p01) +
            (fx1 * fy1 * p11);
        /** @const {number} */
        var rounded = (sum + half) >> (tcuBilinearImageCompare.NUM_SUBPIXEL_BITS * 2);

        DE_ASSERT(deMath.deInRange32(rounded, 0, 0xff));
        return rounded;
    };

    /**
     * @param {tcuTexture.ConstPixelBufferAccess} access
     * @param {number} u
     * @param {number} v
     * @return {tcuRGBA.RGBA}
     */
    tcuBilinearImageCompare.bilinearSampleRGBA8 = function(access, u, v) {
        /** @type {number} */ var x0 = u >> tcuBilinearImageCompare.NUM_SUBPIXEL_BITS;
        /** @type {number} */ var y0 = v >> tcuBilinearImageCompare.NUM_SUBPIXEL_BITS;
        /** @type {number} */ var x1 = x0 + 1;
        /** @type {number} */ var y1 = y0 + 1;

        DE_ASSERT(x1 < access.getWidth());
        DE_ASSERT(y1 < access.getHeight());

        /** @type {number} */ var fx1 = u - (x0 << tcuBilinearImageCompare.NUM_SUBPIXEL_BITS);
        /** @type {number} */ var fy1 = v - (y0 << tcuBilinearImageCompare.NUM_SUBPIXEL_BITS);

        /** @type {number} */ var p00 = tcuBilinearImageCompare.readRGBA8Raw(access, x0, y0);
        /** @type {number} */ var p10 = tcuBilinearImageCompare.readRGBA8Raw(access, x1, y0);
        /** @type {number} */ var p01 = tcuBilinearImageCompare.readRGBA8Raw(access, x0, y1);
        /** @type {number} */ var p11 = tcuBilinearImageCompare.readRGBA8Raw(access, x1, y1);

        /** @type {Array<number>} */ var res = [];

        res[0] = tcuBilinearImageCompare.interpolateChannel(fx1, fy1, tcuBilinearImageCompare.getChannel(p00, 0),
            tcuBilinearImageCompare.getChannel(p01, 0), tcuBilinearImageCompare.getChannel(p10, 0), tcuBilinearImageCompare.getChannel(p11, 0));
        res[1] = tcuBilinearImageCompare.interpolateChannel(fx1, fy1, tcuBilinearImageCompare.getChannel(p00, 1),
            tcuBilinearImageCompare.getChannel(p01, 1), tcuBilinearImageCompare.getChannel(p10, 1), tcuBilinearImageCompare.getChannel(p11, 1));
        res[2] = tcuBilinearImageCompare.interpolateChannel(fx1, fy1, tcuBilinearImageCompare.getChannel(p00, 2),
            tcuBilinearImageCompare.getChannel(p01, 2), tcuBilinearImageCompare.getChannel(p10, 2), tcuBilinearImageCompare.getChannel(p11, 2));
        res[3] = tcuBilinearImageCompare.interpolateChannel(fx1, fy1, tcuBilinearImageCompare.getChannel(p00, 3),
            tcuBilinearImageCompare.getChannel(p01, 3), tcuBilinearImageCompare.getChannel(p10, 3), tcuBilinearImageCompare.getChannel(p11, 3));

        return tcuRGBA.newRGBAFromArray(res);
    };

    /**
     * @param {tcuTexture.ConstPixelBufferAccess} reference
     * @param {tcuTexture.ConstPixelBufferAccess} result
     * @param {tcuRGBA.RGBA} threshold
     * @param {number} x
     * @param {number} y
     * @return {boolean}
     */
    tcuBilinearImageCompare.comparePixelRGBA8 = function(reference, result, threshold, x, y) {
        /** @const {tcuRGBA.RGBA} */ var resPix = tcuBilinearImageCompare.readRGBA8(result, x, y);

        // Step 1: Compare result pixel to 3x3 neighborhood pixels in reference.
        /** @const {number} */ var x0 = Math.max(x - 1, 0);
        /** @const {number} */ var x1 = x;
        /** @const {number} */
        var x2 = Math.min(x + 1, reference.getWidth() - 1);
        /** @const {number} */ var y0 = Math.max(y - 1, 0);
        /** @const {number} */ var y1 = y;
        /** @const {number} */
        var y2 = Math.min(y + 1, reference.getHeight() - 1);

        if (tcuRGBA.compareThreshold(resPix, tcuBilinearImageCompare.readRGBA8(reference, x1, y1), threshold) ||
            tcuRGBA.compareThreshold(resPix, tcuBilinearImageCompare.readRGBA8(reference, x0, y1), threshold) ||
            tcuRGBA.compareThreshold(resPix, tcuBilinearImageCompare.readRGBA8(reference, x2, y1), threshold) ||
            tcuRGBA.compareThreshold(resPix, tcuBilinearImageCompare.readRGBA8(reference, x0, y0), threshold) ||
            tcuRGBA.compareThreshold(resPix, tcuBilinearImageCompare.readRGBA8(reference, x1, y0), threshold) ||
            tcuRGBA.compareThreshold(resPix, tcuBilinearImageCompare.readRGBA8(reference, x2, y0), threshold) ||
            tcuRGBA.compareThreshold(resPix, tcuBilinearImageCompare.readRGBA8(reference, x0, y2), threshold) ||
            tcuRGBA.compareThreshold(resPix, tcuBilinearImageCompare.readRGBA8(reference, x1, y2), threshold) ||
            tcuRGBA.compareThreshold(resPix, tcuBilinearImageCompare.readRGBA8(reference, x2, y2), threshold))
            return true;

        // Step 2: Compare using bilinear sampling.
        // \todo [pyry] Optimize sample positions!
        /** @const {Array<Array<number>>} */ var s_offsets = [
            [226, 186],
            [335, 235],
            [279, 334],
            [178, 272],
            [112, 202],
            [306, 117],
            [396, 299],
            [206, 382],
            [146, 96],
            [423, 155],
            [361, 412],
            [84, 339],
            [48, 130],
            [367, 43],
            [455, 367],
            [105, 439],
            [83, 46],
            [217, 24],
            [461, 71],
            [450, 459],
            [239, 469],
            [67, 267],
            [459, 255],
            [13, 416],
            [10, 192],
            [141, 502],
            [503, 304],
            [380, 506]
        ];

        for (var sampleNdx = 0; sampleNdx < s_offsets.length; sampleNdx++) {
            /** @const {number} */
            var u = ((x - 1) << tcuBilinearImageCompare.NUM_SUBPIXEL_BITS) + s_offsets[sampleNdx][0];
            /** @const {number} */
            var v = ((y - 1) << tcuBilinearImageCompare.NUM_SUBPIXEL_BITS) + s_offsets[sampleNdx][1];

            if (!deMath.deInBounds32(u, 0, (reference.getWidth() - 1) << tcuBilinearImageCompare.NUM_SUBPIXEL_BITS) ||
                !deMath.deInBounds32(v, 0, (reference.getHeight() - 1) << tcuBilinearImageCompare.NUM_SUBPIXEL_BITS))
                continue;

            if (tcuRGBA.compareThreshold(resPix, tcuBilinearImageCompare.bilinearSampleRGBA8(reference, u, v), threshold))
                return true;
        }

        return false;
    };

    /**
     * @param {tcuTexture.ConstPixelBufferAccess} reference
     * @param {tcuTexture.ConstPixelBufferAccess} result
     * @param {tcuTexture.PixelBufferAccess} errorMask
     * @param {tcuRGBA.RGBA} threshold
     * @return {boolean}
     */
    tcuBilinearImageCompare.bilinearCompareRGBA8 = function(reference, result, errorMask, threshold) {
        DE_ASSERT(reference.getFormat().isEqual(new tcuTexture.TextureFormat(
            tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_INT8)));
        DE_ASSERT(result.getFormat().isEqual(new tcuTexture.TextureFormat(
            tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_INT8)));

        // Clear error mask first to green (faster this way).
        errorMask.clear([0.0, 1.0, 0.0, 1.0]);

        /** @type {boolean} */ var allOk = true;

        for (var y = 0; y < reference.getHeight(); y++) {
            for (var x = 0; x < reference.getWidth(); x++) {
                if (!tcuBilinearImageCompare.comparePixelRGBA8(reference, result, threshold, x, y) &&
                    !tcuBilinearImageCompare.comparePixelRGBA8(result, reference, threshold, x, y)) {
                    allOk = false;
                    errorMask.setPixel([1.0, 0.0, 0.0, 1.0], x, y);
                }
            }
        }

        return allOk;
    };

    /**
     * @param {tcuTexture.ConstPixelBufferAccess} reference
     * @param {tcuTexture.ConstPixelBufferAccess} result
     * @param {tcuTexture.PixelBufferAccess} errorMask
     * @param {tcuRGBA.RGBA} threshold
     * @return {boolean}
     */
    tcuBilinearImageCompare.bilinearCompare = function(reference, result, errorMask, threshold) {
        DE_ASSERT(reference.getWidth() == result.getWidth() &&
                  reference.getHeight() == result.getHeight() &&
                  reference.getDepth() == result.getDepth() &&
                  reference.getFormat() == result.getFormat());
        DE_ASSERT(reference.getWidth() == errorMask.getWidth() &&
                  reference.getHeight() == errorMask.getHeight() &&
                  reference.getDepth() == errorMask.getDepth());

        /** @type {boolean} */ var isEqual = reference.getFormat().isEqual(
            new tcuTexture.TextureFormat(
                tcuTexture.ChannelOrder.RGBA,
                tcuTexture.ChannelType.UNORM_INT8));
        if (isEqual)
            return tcuBilinearImageCompare.bilinearCompareRGBA8(reference, result, errorMask, threshold);
        else
            throw new Error('Unsupported format for bilinear comparison');
    };

});
