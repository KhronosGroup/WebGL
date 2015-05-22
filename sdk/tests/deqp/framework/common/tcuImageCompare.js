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
goog.provide('framework.common.tcuImageCompare');
goog.require('framework.common.tcuBilinearImageCompare');
goog.require('framework.common.tcuFuzzyImageCompare');
goog.require('framework.common.tcuRGBA');
goog.require('framework.common.tcuSurface');
goog.require('framework.common.tcuTexture');
goog.require('framework.delibs.debase.deMath');

goog.scope(function() {

var tcuImageCompare = framework.common.tcuImageCompare;
var tcuSurface = framework.common.tcuSurface;
var deMath = framework.delibs.debase.deMath;
var tcuTexture = framework.common.tcuTexture;
var tcuFuzzyImageCompare = framework.common.tcuFuzzyImageCompare;
var tcuBilinearImageCompare = framework.common.tcuBilinearImageCompare;
var tcuRGBA = framework.common.tcuRGBA;

/**
 * @enum
 */
tcuImageCompare.CompareLogMode = {
    EVERYTHING: 0,
    RESULT: 1,
    ON_ERROR: 2
};

/**
 * @param {string} id HTML element name
 * @param {number} width Canvas width
 * @param {number} height Canvas height
 * @param {boolean=} displayRef True if we display [result, ref, error] canvases, False if we display [result] only. Default True.
 * @return {Array} Array of drawing contexts - one per canvas.
 */
tcuImageCompare.displayResultPane = function(id, width, height, displayRef) {
    if (displayRef == undefined) displayRef = true;
    tcuImageCompare.displayResultPane.counter = tcuImageCompare.displayResultPane.counter || 0;
    var i = tcuImageCompare.displayResultPane.counter++;
    var elem = document.getElementById(id);
    var span = document.createElement('span');
    elem.appendChild(span);
    if (displayRef) {
        span.innerHTML = '<table><tr><td>Result</td><td>Reference</td><td>Error mask</td></tr>' +
                                '<tr><td><canvas id="result' + i + '" width=' + width + ' height=' + height + '</td><td><canvas id="reference' + i + '" width=' + width + ' height=' + height + '</td><td><canvas id="diff' + i + '" width=' + width + ' height=' + height + '</td>' +
                         '</table>';
        var canvasResult = document.getElementById('result' + i);
        var ctxResult = canvasResult.getContext('2d');
        var canvasRef = document.getElementById('reference' + i);
        var ctxRef = canvasRef.getContext('2d');
        var canvasDiff = document.getElementById('diff' + i);
        var ctxDiff = canvasDiff.getContext('2d');
        return [ctxResult, ctxRef, ctxDiff];
    } else {
        span.innerHTML = '<table><tr><td>Result</td></tr>' +
                                '<tr><td><canvas id="result' + i + '" width=' + width + ' height=' + height + '</td>' +
                         '</table>';
        var canvasResult = document.getElementById('result' + i);
        var ctxResult = canvasResult.getContext('2d');
        return [ctxResult];
    }
};

/**
 * @param {framework.common.tcuTexture.ConstPixelBufferAccess} result
 * @param {framework.common.tcuTexture.ConstPixelBufferAccess=} reference
 * @param {framework.common.tcuTexture.ConstPixelBufferAccess=} diff
 */
tcuImageCompare.displayImages = function(result, reference, diff) {
    var createImage = function(ctx, src) {
        var w = src.getWidth();
        var h = src.getHeight();
        var imgData = ctx.createImageData(w, h);
        var index = 0;
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var pixel = src.getPixelInt(x, h - y - 1, 0);
                for (var i = 0; i < 4; i++) {
                    imgData.data[index] = pixel[i];
                    index = index + 1;
                }
            }
        }
        return imgData;
    };
    var w = result.getWidth();
    var h = result.getHeight();

    var contexts = tcuImageCompare.displayResultPane('console', w, h, reference != null);
    contexts[0].putImageData(createImage(contexts[0], result), 0, 0);
    if (reference)
        contexts[1].putImageData(createImage(contexts[1], reference), 0, 0);
    if (diff)
        contexts[2].putImageData(createImage(contexts[2], diff), 0, 0);
};

//** TODO: implement this
 // * @param {tcuTexture.ConstPixelBufferAccess} reference
 // * @param {tcuTexture.ConstPixelBufferAccess} result
 // * @param {Float32Array} scale (Vec4)
 // * @param {Float32Array} bias (Vec4)
 // */
/*var computeScaleAndBias = function(reference, result, scale, bias) {
    Vec4 minVal;
    Vec4 maxVal;
    const float eps = 0.0001f; {
        Vec4 refMin;
        Vec4 refMax;
        estimatePixelValueRange(reference, refMin, refMax);

        minVal = refMin;
        maxVal = refMax;
    } {
        Vec4 resMin;
        Vec4 resMax;

        estimatePixelValueRange(result, resMin, resMax);

        minVal[0] = de::min(minVal[0], resMin[0]);
        minVal[1] = de::min(minVal[1], resMin[1]);
        minVal[2] = de::min(minVal[2], resMin[2]);
        minVal[3] = de::min(minVal[3], resMin[3]);

        maxVal[0] = de::max(maxVal[0], resMax[0]);
        maxVal[1] = de::max(maxVal[1], resMax[1]);
        maxVal[2] = de::max(maxVal[2], resMax[2]);
        maxVal[3] = de::max(maxVal[3], resMax[3]);
    }

    for (int c = 0; c < 4; c++) {
        if (maxVal[c] - minVal[c] < eps) {
            scale[c] = (maxVal[c] < eps) ? 1.0f : (1.0f / maxVal[c]);
            bias[c] = (c == 3) ? (1.0f - maxVal[c]*scale[c]) : (0.0f - minVal[c]*scale[c]);
        } else {
            scale[c] = 1.0f / (maxVal[c] - minVal[c]);
            bias[c] = 0.0f - minVal[c]*scale[c];
        }
    }
};*/

/**
 * \brief Per-pixel threshold-based comparison
 *
 * This compare computes per-pixel differences between result and reference
 * image. Comparison fails if any pixels exceed the given threshold value.
 *
 * This comparison can be used for integer- and fixed-point texture formats.
 * Difference is computed in integer space.
 *
 * On failure error image is generated that shows where the failing pixels
 * are.
 *
 * @param {string} imageSetName Name for image set when logging results
 * @param {string} imageSetDesc Description for image set
 * @param {tcuTexture.ConstPixelBufferAccess} reference Reference image
 * @param {tcuTexture.ConstPixelBufferAccess} result Result image
 * @param {Array<number>} threshold Maximum allowed difference
 * @param {tcuImageCompare.CompareLogMode=} logMode
 * @return {boolean} true if comparison passes, false otherwise
 */
tcuImageCompare.intThresholdCompare = function(imageSetName, imageSetDesc, reference, result, threshold, logMode) {
    var width = reference.getWidth();
    var height = reference.getHeight();
    var depth = reference.getDepth();
    var errorMask = new tcuSurface.Surface(width, height);

    var maxDiff = [0, 0, 0, 0];
    // var pixelBias = [0, 0, 0, 0]; // Vec4 // TODO: check, only used in computeScaleAndBias, which is not included
    // var pixelScale = [1, 1, 1, 1]; // Vec4 // TODO: check, only used in computeScaleAndBias

    assertMsgOptions(result.getWidth() == width && result.getHeight() == height && result.getDepth() == depth,
        'Reference and result images have different dimensions', false, true);

    for (var z = 0; z < depth; z++) {
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
            var refPix = reference.getPixelInt(x, y, z);
                var cmpPix = result.getPixelInt(x, y, z);

                var diff = deMath.absDiff(refPix, cmpPix);
                var isOk = deMath.boolAll(deMath.lessThanEqual(diff, threshold));

                maxDiff = deMath.max(maxDiff, diff);
                var color = [0, 255, 0, 255];
                if (!isOk)
                    color = [255, 0, 0, 255];
                errorMask.setPixel(x, y, color);
            }
        }
    }

    var compareOk = deMath.boolAll(deMath.lessThanEqual(maxDiff, threshold));

    if (!compareOk) {
        debug('Image comparison failed: max difference = ' + maxDiff + ', threshold = ' + threshold);
        tcuImageCompare.displayImages(result, reference, errorMask.getAccess());
    }

    return compareOk;
};

/**
 * tcuImageCompare.floatUlpThresholdCompare
 * @param {string} imageSetName
 * @param {string} imageSetDesc
 * @param {tcuTexture.ConstPixelBufferAccess} reference
 * @param {tcuTexture.ConstPixelBufferAccess} result
 * @param {Array<number>} threshold - previously used as an Uint32Array
 * @return {boolean}
 */
tcuImageCompare.floatUlpThresholdCompare = function(imageSetName, imageSetDesc, reference, result, threshold) {
    /** @type {number} */ var width = reference.getWidth();
    /** @type {number} */ var height = reference.getHeight();
    /** @type {number} */ var depth = reference.getDepth();
    /** @type {tcuSurface.Surface} */ var errorMask = new tcuSurface.Surface(width, height);

    /** @type {Array<number>} */ var maxDiff = [0, 0, 0, 0]; // UVec4
    // var pixelBias = [0, 0, 0, 0]; // Vec4
    // var pixelScale = [1, 1, 1, 1]; // Vec4

    assertMsgOptions(result.getWidth() == width && result.getHeight() == height && result.getDepth() == depth,
            'Reference and result images have different dimensions', false, true);

    for (var z = 0; z < depth; z++) {
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                /** @type {ArrayBuffer} */ var arrayBufferRef = new ArrayBuffer(4);
                /** @type {ArrayBuffer} */ var arrayBufferCmp = new ArrayBuffer(4);

                /** @type {Array<number>} */ var refPix = reference.getPixel(x, y, z); // getPixel returns a Vec4 pixel color

                /** @type {Array<number>} */ var cmpPix = result.getPixel(x, y, z); // getPixel returns a Vec4 pixel color

                /** @type {Uint32Array} */ var refBits = new Uint32Array(arrayBufferRef); // UVec4
                /** @type {Uint32Array} */ var cmpBits = new Uint32Array(arrayBufferCmp); // UVec4

                // Instead of memcpy(), which is the way to do float->uint32 reinterpretation in C++
                for (var i = 0; i < refPix.length; i++) {
                    refBits[i] = refPix[i];
                    cmpBits[i] = cmpPix[i];
                }

                /** @type {Array<number>} */ var diff = deMath.absDiff(refBits, cmpBits); // UVec4
                /** @type {boolean} */ var isOk = deMath.boolAll(deMath.lessThanEqual(diff, threshold));

                maxDiff = deMath.max(maxDiff, diff);

                errorMask.setPixel(x, y, isOk ? [0, 1, 0, 1] : [1, 0, 0, 1]);
            }
        }
    }

    /** @type {boolean} */ var compareOk = deMath.boolAll(deMath.lessThanEqual(maxDiff, threshold));

    if (!compareOk) {
        debug('Image comparison failed: max difference = ' + maxDiff + ', threshold = ' + threshold);
        tcuImageCompare.displayImages(result, reference, errorMask.getAccess());
    }

    /*if (!compareOk || logMode == COMPARE_LOG_EVERYTHING) {
        // All formats except normalized unsigned fixed point ones need remapping in order to fit into unorm channels in logged images.
        if (tcu::getTextureChannelClass(reference.getFormat().type) != tcu::TEXTURECHANNELCLASS_UNSIGNED_FIXED_POINT ||
            tcu::getTextureChannelClass(result.getFormat().type) != tcu::TEXTURECHANNELCLASS_UNSIGNED_FIXED_POINT) {
            computeScaleAndBias(reference, result, pixelScale, pixelBias);
            log << TestLog::Message << "Result and reference images are normalized with formula p * " << pixelScale << " + " << pixelBias << TestLog::EndMessage;
        }

        if (!compareOk)
            log << TestLog::Message << "Image comparison failed: max difference = " << maxDiff << ", threshold = " << threshold << TestLog::EndMessage;

        log << TestLog::ImageSet(imageSetName, imageSetDesc)
            << TestLog::Image("Result", "Result", result, pixelScale, pixelBias)
            << TestLog::Image("Reference", "Reference", reference, pixelScale, pixelBias)
            << TestLog::Image("ErrorMask", "Error mask", errorMask)
            << TestLog::EndImageSet;
    } else if (logMode == COMPARE_LOG_RESULT) {
        if (result.getFormat() != TextureFormat(TextureFormat::RGBA, TextureFormat::UNORM_INT8))
            computePixelScaleBias(result, pixelScale, pixelBias);

        log << TestLog::ImageSet(imageSetName, imageSetDesc)
            << TestLog::Image("Result", "Result", result, pixelScale, pixelBias)
            << TestLog::EndImageSet;
    }*/

    return compareOk;
};

/**
 * tcuImageCompare.floatThresholdCompare
 * @param {string} imageSetName
 * @param {string} imageSetDesc
 * @param {tcuTexture.ConstPixelBufferAccess} reference
 * @param {tcuTexture.ConstPixelBufferAccess} result
 * @param {Array<number>} threshold
 * @return {boolean}
 */
tcuImageCompare.floatThresholdCompare = function(imageSetName, imageSetDesc, reference, result, threshold) {
    /** @type {number} */ var width = reference.getWidth();
    /** @type {number} */ var height = reference.getHeight();
    /** @type {number} */ var depth = reference.getDepth();
    /** @type {tcuSurface.Surface} */ var errorMask = new tcuSurface.Surface(width, height);

    /** @type {Array<number>} */ var maxDiff = [0, 0, 0, 0]; // Vec4
    // var pixelBias = [0, 0, 0, 0]; // Vec4
    // var pixelScale = [1, 1, 1, 1]; // Vec4

    assertMsgOptions(result.getWidth() == width && result.getHeight() == height && result.getDepth() == depth,
            'Reference and result images have different dimensions', false, true);

    for (var z = 0; z < depth; z++) {
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var refPix = reference.getPixel(x, y, z); // Vec4
                var cmpPix = result.getPixel(x, y, z); // Vec4

                /** @type {Array<number>} */ var diff = deMath.absDiff(refPix, cmpPix); // Vec4
                /** @type {boolean} */ var isOk = deMath.boolAll(deMath.lessThanEqual(diff, threshold));

                maxDiff = deMath.max(maxDiff, diff);

                errorMask.setPixel(x, y, isOk ? [0, 1, 0, 1] : [1, 0, 0, 1]);
            }
        }
    }

    /** @type {boolean} */ var compareOk = deMath.boolAll(deMath.lessThanEqual(maxDiff, threshold));

    if (!compareOk) {
        debug('Image comparison failed: max difference = ' + maxDiff + ', threshold = ' + threshold);
        tcuImageCompare.displayImages(result, reference, errorMask.getAccess());
    }

    /*if (!compareOk || logMode == COMPARE_LOG_EVERYTHING) {
        // All formats except normalized unsigned fixed point ones need remapping in order to fit into unorm channels in logged images.
        if (tcu::getTextureChannelClass(reference.getFormat().type) != tcu::TEXTURECHANNELCLASS_UNSIGNED_FIXED_POINT ||
            tcu::getTextureChannelClass(result.getFormat().type) != tcu::TEXTURECHANNELCLASS_UNSIGNED_FIXED_POINT) {
            computeScaleAndBias(reference, result, pixelScale, pixelBias);
            log << TestLog::Message << "Result and reference images are normalized with formula p * " << pixelScale << " + " << pixelBias << TestLog::EndMessage;
        }

        if (!compareOk)
            log << TestLog::Message << "Image comparison failed: max difference = " << maxDiff << ", threshold = " << threshold << TestLog::EndMessage;

        log << TestLog::ImageSet(imageSetName, imageSetDesc)
            << TestLog::Image("Result", "Result", result, pixelScale, pixelBias)
            << TestLog::Image("Reference", "Reference", reference, pixelScale, pixelBias)
            << TestLog::Image("ErrorMask", "Error mask", errorMask)
            << TestLog::EndImageSet;
    } else if (logMode == COMPARE_LOG_RESULT) {
        if (result.getFormat() != TextureFormat(TextureFormat::RGBA, TextureFormat::UNORM_INT8))
            computePixelScaleBias(result, pixelScale, pixelBias);

        log << TestLog::ImageSet(imageSetName, imageSetDesc)
            << TestLog::Image("Result", "Result", result, pixelScale, pixelBias)
            << TestLog::EndImageSet;
    }*/

    return compareOk;
};

/**
 * \brief Per-pixel threshold-based comparison
 *
 * This compare computes per-pixel differences between result and reference
 * image. Comparison fails if any pixels exceed the given threshold value.
 *
 * On failure error image is generated that shows where the failing pixels
 * are.
 *
 * @param {string} imageSetName Name for image set when logging results
 * @param {string} imageSetDesc Description for image set
 * @param {tcuSurface.Surface} reference Reference image
 * @param {tcuSurface.Surface} result Result image
 * @param {Array<number>} threshold Maximum allowed difference
 * @param {tcuImageCompare.CompareLogMode=} logMode
 * @return {boolean} true if comparison passes, false otherwise
 */
tcuImageCompare.pixelThresholdCompare = function(imageSetName, imageSetDesc, reference, result, threshold, logMode) {
    return tcuImageCompare.intThresholdCompare(imageSetName, imageSetDesc, reference.getAccess(), result.getAccess(), threshold, logMode);
};

 /**
  * tcuImageCompare.fuzzyCompare
  * @param {string} imageSetName
  * @param {string} imageSetDesc
  * @param {tcuTexture.ConstPixelBufferAccess} reference
  * @param {tcuTexture.ConstPixelBufferAccess} result
  * @param {number} threshold
  * @param {tcuImageCompare.CompareLogMode=} logMode
  * @return {boolean}
  */
tcuImageCompare.fuzzyCompare = function(imageSetName, imageSetDesc, reference, result, threshold, logMode) {
    /** @type {tcuFuzzyImageCompare.FuzzyCompareParams} */ var params = new tcuFuzzyImageCompare.FuzzyCompareParams(); // Use defaults.
    /** @type {tcuTexture.TextureLevel} */ var errorMask = new tcuTexture.TextureLevel(
                                                                new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGB,
                                                                              tcuTexture.ChannelType.UNORM_INT8),
                                                                reference.getWidth(),
                                                                reference.getHeight()
                                                           );
    /** @type {number} */ var difference = tcuFuzzyImageCompare.fuzzyCompare(
                                                                params,
                                                                reference,
                                                                result,
                                                                tcuTexture.PixelBufferAccess.newFromTextureLevel(errorMask)
                                                               );
    /** @type {boolean} */ var isOk = difference <= threshold;
    /** @type {Array<number>} */ var pixelBias = [0.0, 0.0, 0.0, 0.0];
    /** @type {Array<number>} */ var pixelScale = [1.0, 1.0, 1.0, 1.0];

    if (!isOk) {
        debug('Fuzzy image comparison failed: difference = ' + difference + ', threshold = ' + threshold);
        tcuImageCompare.displayImages(result, reference, errorMask.getAccess());
    }

    /*
    if (!isOk || logMode == COMPARE_LOG_EVERYTHING) {
        // Generate more accurate error mask.
        params.maxSampleSkip = 0;
        tcuImageCompare.fuzzyCompare(params, reference, result, errorMask.getAccess());

        if (result.getFormat() != TextureFormat(TextureFormat::RGBA, TextureFormat::UNORM_INT8) && reference.getFormat() != TextureFormat(TextureFormat::RGBA, TextureFormat::UNORM_INT8))
            computeScaleAndBias(reference, result, pixelScale, pixelBias);

        if (!isOk)
            log << TestLog::Message << "Image comparison failed: difference = " << difference << ", threshold = " << threshold << TestLog::EndMessage;

        log << TestLog::ImageSet(imageSetName, imageSetDesc)
            << TestLog::Image("Result", "Result", result, pixelScale, pixelBias)
            << TestLog::Image("Reference", "Reference", reference, pixelScale, pixelBias)
            << TestLog::Image("ErrorMask", "Error mask", errorMask)
            << TestLog::EndImageSet;
    } else if (logMode == COMPARE_LOG_RESULT) {
        if (result.getFormat() != TextureFormat(TextureFormat::RGBA, TextureFormat::UNORM_INT8))
            computePixelScaleBias(result, pixelScale, pixelBias);

        log << TestLog::ImageSet(imageSetName, imageSetDesc)
            << TestLog::Image("Result", "Result", result, pixelScale, pixelBias)
            << TestLog::EndImageSet;
    }
    */
    return isOk;
};

/**
 * Bilinear image comparison
 * On failure error image is generated that shows where the failing pixels
 * are.
 * Currently supports only RGBA, UNORM_INT8 formats
 *
 * @param {string} imageSetName Name for image set when logging results
 * @param {string} imageSetDesc Description for image set
 * @param {tcuTexture.ConstPixelBufferAccess} reference Reference image
 * @param {tcuTexture.ConstPixelBufferAccess} result Result image
 * @param {tcuRGBA.RGBA} threshold Maximum local difference
 * @param {tcuImageCompare.CompareLogMode=} logMode Logging mode
 * @return {boolean} if comparison passes, false otherwise
 */
tcuImageCompare.bilinearCompare = function(imageSetName, imageSetDesc, reference, result, threshold, logMode) {
    /** @type {tcuTexture.TextureLevel} */
    var errorMask = new tcuTexture.TextureLevel(
        new tcuTexture.TextureFormat(
            tcuTexture.ChannelOrder.RGB,
            tcuTexture.ChannelType.UNORM_INT8),
        reference.getWidth(),
        reference.getHeight());

    /** @type {boolean} */
    var isOk = tcuBilinearImageCompare.bilinearCompare(
        reference,
        result,
        tcuTexture.PixelBufferAccess.newFromTextureLevel(errorMask),
        threshold);

    if (!isOk) {
        debug('Image comparison failed: threshold = ' + threshold);
        tcuImageCompare.displayImages(result, reference, errorMask.getAccess());
    }

    // /* @type {Array<number>} */ var pixelBias = [0.0, 0.0, 0.0, 0.0];
    // /* @type {Array<number>} */ var pixelScale = [1.0, 1.0, 1.0, 1.0];
    // if (!isOk || logMode == COMPARE_LOG_EVERYTHING)
    // {
    //     if (result.getFormat() != TextureFormat(TextureFormat::RGBA, TextureFormat::UNORM_INT8) && reference.getFormat() != TextureFormat(TextureFormat::RGBA, TextureFormat::UNORM_INT8))
    //         computeScaleAndBias(reference, result, pixelScale, pixelBias);
    //
    //     if (!isOk)
    //         log << TestLog::Message << "Image comparison failed, threshold = " << threshold << TestLog::EndMessage;
    //
    //     log << TestLog::ImageSet(imageSetName, imageSetDesc)
    //         << TestLog::Image("Result", "Result", result, pixelScale, pixelBias)
    //         << TestLog::Image("Reference", "Reference", reference, pixelScale, pixelBias)
    //         << TestLog::Image("ErrorMask", "Error mask", errorMask)
    //         << TestLog::EndImageSet;
    // }
    // else if (logMode == COMPARE_LOG_RESULT)
    // {
    //     if (result.getFormat() != TextureFormat(TextureFormat::RGBA, TextureFormat::UNORM_INT8))
    //         computePixelScaleBias(result, pixelScale, pixelBias);
    //
    //     log << TestLog::ImageSet(imageSetName, imageSetDesc)
    //         << TestLog::Image("Result", "Result", result, pixelScale, pixelBias)
    //         << TestLog::EndImageSet;
    // }

    return isOk;
};

});
