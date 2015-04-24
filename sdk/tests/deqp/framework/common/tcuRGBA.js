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
goog.provide('framework.common.tcuRGBA');
goog.require('framework.delibs.debase.deMath');

goog.scope(function() {

var tcuRGBA = framework.common.tcuRGBA;
var deMath = framework.delibs.debase.deMath;

    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    /**
     * class tcuRGBA.RGBA
     * @constructor
     */
    tcuRGBA.RGBA = function() {
        /** @type {Uint32Array} */ this.m_value = new Uint32Array(4);

    };

    /**
     * @enum
     * In JS, these are not shift values, but positions in a typed array
     */
    tcuRGBA.RGBA.Shift = {
        RED: 0,
        GREEN: 1,
        BLUE: 2,
        ALPHA: 3
    };

    /**
     * @enum
     * Mask used as flags
     * Hopefully will not use typed arrays
     */
    tcuRGBA.RGBA.Mask = function() {
        return {
            RED: false,
            GREEN: false,
            BLUE: false,
            ALPHA: false
        };
    };

    /**
     * Builds an tcuRGBA.RGBA object from color components
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     * @return {tcuRGBA.RGBA}
     */
    tcuRGBA.newRGBAComponents = function(r, g, b, a) {
        /** @type {tcuRGBA.RGBA} */ var rgba = new tcuRGBA.RGBA();
        DE_ASSERT(deMath.deInRange32(r, 0, 255));
        DE_ASSERT(deMath.deInRange32(g, 0, 255));
        DE_ASSERT(deMath.deInRange32(b, 0, 255));
        DE_ASSERT(deMath.deInRange32(a, 0, 255));

        var result = new Uint8Array(4);
        result[tcuRGBA.RGBA.Shift.RED] = r;
        result[tcuRGBA.RGBA.Shift.GREEN] = g;
        result[tcuRGBA.RGBA.Shift.BLUE] = b;
        result[tcuRGBA.RGBA.Shift.ALPHA] = a;

        rgba.m_value = new Uint32Array(result);

        return rgba;
    };

    /**
     * Builds an tcuRGBA.RGBA object from a 32 bit value
     * @param {number} val
     * @return {tcuRGBA.RGBA}
     */
    tcuRGBA.newRGBAValue = function(val) {
        /** @type {tcuRGBA.RGBA} */ var rgba = new tcuRGBA.RGBA();
        rgba.m_value = new Uint32Array([val]);

        return rgba;
    };

    /**
     * Builds an tcuRGBA.RGBA object from a number array
     * @param {goog.NumberArray} v
     * @return {tcuRGBA.RGBA}
     */
    tcuRGBA.newRGBAFromArray = function(v) {
        /** @type {tcuRGBA.RGBA} */ var rgba = new tcuRGBA.RGBA();
        var result = new Uint8Array(v);

        rgba.m_value = new Uint32Array(result);

        return rgba;
    };

    /**
     * @param {number} v
     */
    tcuRGBA.RGBA.prototype.setRed = function(v) { DE_ASSERT(deMath.deInRange32(v, 0, 255)); this.m_value[tcuRGBA.RGBA.Shift.RED] = v; };

    /**
     * @param {number} v
     */
    tcuRGBA.RGBA.prototype.setGreen = function(v) { DE_ASSERT(deMath.deInRange32(v, 0, 255)); this.m_value[tcuRGBA.RGBA.Shift.GREEN] = v; };

    /**
     * @param {number} v
     */
    tcuRGBA.RGBA.prototype.setBlue = function(v) { DE_ASSERT(deMath.deInRange32(v, 0, 255)); this.m_value[tcuRGBA.RGBA.Shift.BLUE] = v; };

    /**
     * @param {number} v
     */
    tcuRGBA.RGBA.prototype.setAlpha = function(v) { DE_ASSERT(deMath.deInRange32(v, 0, 255)); this.m_value[tcuRGBA.RGBA.Shift.ALPHA] = v; };

    /**
     * @return {number}
     */
    tcuRGBA.RGBA.prototype.getRed = function() { return this.m_value[tcuRGBA.RGBA.Shift.RED]; };

    /**
     * @return {number}
     */
    tcuRGBA.RGBA.prototype.getGreen = function() { return this.m_value[tcuRGBA.RGBA.Shift.GREEN]; };

    /**
     * @return {number}
     */
    tcuRGBA.RGBA.prototype.getBlue = function() { return this.m_value[tcuRGBA.RGBA.Shift.BLUE]; };

    /**
     * @return {number}
     */
    tcuRGBA.RGBA.prototype.getAlpha = function() { return this.m_value[tcuRGBA.RGBA.Shift.ALPHA]; };

    /**
     * @return {number}
     */
    tcuRGBA.RGBA.prototype.getPacked = function() { return this.m_value[0]; };

    /**
     * @param {tcuRGBA.RGBA} thr
     * @return {boolean}
     */
    tcuRGBA.RGBA.prototype.isBelowThreshold = function(thr) { return (this.getRed() <= thr.getRed()) && (this.getGreen() <= thr.getGreen()) && (this.getBlue() <= thr.getBlue()) && (this.getAlpha() <= thr.getAlpha()); };

    /**
     * @param {Uint8Array} bytes
     * @return {tcuRGBA.RGBA}
     */
    tcuRGBA.RGBA.fromBytes = function(bytes) { return tcuRGBA.newRGBAFromArray(bytes); };

    /**
     * @param {Uint8Array} bytes
     */
    tcuRGBA.RGBA.prototype.toBytes = function(bytes) { var result = new Uint8Array(this.m_value); bytes[0] = result[0]; bytes[1] = result[1]; bytes[2] = result[2]; bytes[3] = result[3]; };

    /**
     * @return {Array<number>}
     */
    tcuRGBA.RGBA.prototype.toVec = function() {
        return [
            this.getRed() / 255.0,
            this.getGreen() / 255.0,
            this.getBlue() / 255.0,
            this.getAlpha() / 255.0
        ];
    };

    /**
     * @return {Array<number>}
     */
    tcuRGBA.RGBA.prototype.toIVec = function() {
        return [
            this.getRed(),
            this.getGreen(),
            this.getBlue(),
            this.getAlpha()
        ];
    };

    /**
     * @param {tcuRGBA.RGBA} v
     * @return {boolean}
     */
    tcuRGBA.RGBA.prototype.equals = function(v) {
        return (
            this.m_value[0] == v.m_value[0] &&
            this.m_value[1] == v.m_value[1] &&
            this.m_value[2] == v.m_value[2] &&
            this.m_value[3] == v.m_value[3]
        );
    };

    /**
     * @param {tcuRGBA.RGBA} a
     * @param {tcuRGBA.RGBA} b
     * @param {tcuRGBA.RGBA} threshold
     * @return {boolean}
     */
    tcuRGBA.compareThreshold = function(a, b, threshold) {
        if (a.equals(b)) return true; // Quick-accept
        return tcuRGBA.computeAbsDiff(a, b).isBelowThreshold(threshold);
    };

    /**
     * @param {tcuRGBA.RGBA} a
     * @param {tcuRGBA.RGBA} b
     * @return {tcuRGBA.RGBA}
     */
    tcuRGBA.computeAbsDiff = function(a, b) {
        return tcuRGBA.newRGBAComponents(
            Math.abs(a.getRed() - b.getRed()),
            Math.abs(a.getGreen() - b.getGreen()),
            Math.abs(a.getBlue() - b.getBlue()),
            Math.abs(a.getAlpha() - b.getAlpha())
        );
    };

    /**
     * @param {tcuRGBA.RGBA} a
     * @param {tcuRGBA.RGBA} b
     * @return {tcuRGBA.RGBA}
     */
    tcuRGBA.max = function(a, b) {
        return tcuRGBA.newRGBAComponents(
            Math.max(a.getRed(), b.getRed()),
            Math.max(a.getGreen(), b.getGreen()),
            Math.max(a.getBlue(), b.getBlue()),
            Math.max(a.getAlpha(), b.getAlpha())
        );
    };

    // Color constants
    tcuRGBA.RGBA.red = tcuRGBA.newRGBAComponents(0xFF, 0, 0, 0xFF);
    tcuRGBA.RGBA.green = tcuRGBA.newRGBAComponents(0, 0xFF, 0, 0xFF);
    tcuRGBA.RGBA.blue = tcuRGBA.newRGBAComponents(0, 0, 0xFF, 0xFF);
    tcuRGBA.RGBA.gray = tcuRGBA.newRGBAComponents(0x80, 0x80, 0x80, 0xFF);
    tcuRGBA.RGBA.white = tcuRGBA.newRGBAComponents(0xFF, 0xFF, 0xFF, 0xFF);
    tcuRGBA.RGBA.black = tcuRGBA.newRGBAComponents(0, 0, 0, 0xFF);

});
