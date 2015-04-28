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
goog.provide('framework.referencerenderer.rrVertexAttrib');
goog.require('framework.delibs.debase.deMath');
goog.require('framework.common.tcuFloat');
goog.require('framework.referencerenderer.rrGenericVector');


goog.scope(function() {

var rrVertexAttrib = framework.referencerenderer.rrVertexAttrib;
var deMath = framework.delibs.debase.deMath;
var tcuFloat = framework.common.tcuFloat;
var rrGenericVector = framework.referencerenderer.rrGenericVector;

    rrVertexAttrib.DE_NULL = null;

    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    /**
     * rrVertexAttrib.NormalOrder
     * @enum
     */
    rrVertexAttrib.NormalOrder = {
        T0: 0,
        T1: 1,
        T2: 2,
        T3: 3
    };

    /**
     * rrVertexAttrib.BGRAOrder
     * @enum
     */
    rrVertexAttrib.BGRAOrder = {
        T0: 2,
        T1: 1,
        T2: 0,
        T3: 3
    };

    /**
     * rrVertexAttrib.VertexAttribType enum
     * @enum
     */
    rrVertexAttrib.VertexAttribType = {
        // Can only be rrVertexAttrib.read as floats
        FLOAT: 0,
        HALF: 1,
        FIXED: 2,
        DOUBLE: 3,

        // Can only be rrVertexAttrib.read as floats, will be normalized
        NONPURE_UNORM8: 4,
        NONPURE_UNORM16: 5,
        NONPURE_UNORM32: 6,
        NONPURE_UNORM_2_10_10_10_REV: 7,          //!< Packed format, only size = 4 is allowed

        // Clamped formats, GLES3-style conversion: max{c / (2^(b-1) - 1), -1 }
        NONPURE_SNORM8_CLAMP: 8,
        NONPURE_SNORM16_CLAMP: 9,
        NONPURE_SNORM32_CLAMP: 10,
        NONPURE_SNORM_2_10_10_10_REV_CLAMP: 11,    //!< Packed format, only size = 4 is allowed

        // Scaled formats, GLES2-style conversion: (2c + 1) / (2^b - 1)
        NONPURE_SNORM8_SCALE: 12,
        NONPURE_SNORM16_SCALE: 13,
        NONPURE_SNORM32_SCALE: 14,
        NONPURE_SNORM_2_10_10_10_REV_SCALE: 15,    //!< Packed format, only size = 4 is allowed

        // can only be rrVertexAttrib.read as float, will not be normalized
        NONPURE_UINT8: 16,
        NONPURE_UINT16: 17,
        NONPURE_UINT32: 18,

        NONPURE_INT8: 19,
        NONPURE_INT16: 20,
        NONPURE_INT32: 21,

        NONPURE_UINT_2_10_10_10_REV: 22,   //!< Packed format, only size = 4 is allowed
        NONPURE_INT_2_10_10_10_REV: 23,    //!< Packed format, only size = 4 is allowed

        // can only be rrVertexAttrib.read as integers
        PURE_UINT8: 24,
        PURE_UINT16: 25,
        PURE_UINT32: 26,

        PURE_INT8: 27,
        PURE_INT16: 28,
        PURE_INT32: 29,

        // reordered formats of GL_ARB_vertex_array_bgra
        NONPURE_UNORM8_BGRA: 30,
        NONPURE_UNORM_2_10_10_10_REV_BGRA: 31,
        NONPURE_SNORM_2_10_10_10_REV_CLAMP_BGRA: 32,
        NONPURE_SNORM_2_10_10_10_REV_SCALE_BGRA: 33,

        // can be rrVertexAttrib.read as anything
        DONT_CARE: 34                 //!< Do not enforce type checking when reading GENERIC attribute. Used for current client side attributes.
    };

    /**
     * rrVertexAttrib.VertexAttrib class
     * @constructor
     */
    rrVertexAttrib.VertexAttrib = function() {
        /** @type {rrVertexAttrib.VertexAttribType} */ this.type = rrVertexAttrib.VertexAttribType.FLOAT;
        /** @type {number} */ this.size = 0;
        /** @type {number} */ this.stride = 0;
        /** @type {number} */ this.instanceDivisor = 0;
        /** @type {ArrayBuffer} */ this.pointer = rrVertexAttrib.DE_NULL;
        /** @type {Array.<number>} */ this.generic; //!< Generic attribute, used if pointer is null.
    };

    /**
     * @param {rrVertexAttrib.VertexAttribType} type
     * @return {number}
     */
    rrVertexAttrib.getComponentSize = function(type) {
        switch (type)
        {
            case rrVertexAttrib.VertexAttribType.FLOAT: return 4;
            case rrVertexAttrib.VertexAttribType.HALF: return 2;
            case rrVertexAttrib.VertexAttribType.FIXED: return 4;
            case rrVertexAttrib.VertexAttribType.DOUBLE: return 8; //sizeof(double);
            case rrVertexAttrib.VertexAttribType.NONPURE_UNORM8: return 1;
            case rrVertexAttrib.VertexAttribType.NONPURE_UNORM16: return 2;
            case rrVertexAttrib.VertexAttribType.NONPURE_UNORM32: return 4;
            case rrVertexAttrib.VertexAttribType.NONPURE_UNORM_2_10_10_10_REV: return 1; //sizeof(deUint32)/4;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM8_CLAMP: return 1;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM16_CLAMP: return 2;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM32_CLAMP: return 4;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM_2_10_10_10_REV_CLAMP: return 1; //sizeof(deUint32)/4;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM8_SCALE: return 1;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM16_SCALE: return 2;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM32_SCALE: return 4;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM_2_10_10_10_REV_SCALE: return 1; //sizeof(deUint32)/4;
            case rrVertexAttrib.VertexAttribType.NONPURE_UINT8: return 1;
            case rrVertexAttrib.VertexAttribType.NONPURE_UINT16: return 2;
            case rrVertexAttrib.VertexAttribType.NONPURE_UINT32: return 4;
            case rrVertexAttrib.VertexAttribType.NONPURE_INT8: return 1;
            case rrVertexAttrib.VertexAttribType.NONPURE_INT16: return 2;
            case rrVertexAttrib.VertexAttribType.NONPURE_INT32: return 4;
            case rrVertexAttrib.VertexAttribType.NONPURE_UINT_2_10_10_10_REV: return 1; //sizeof(deUint32)/4;
            case rrVertexAttrib.VertexAttribType.NONPURE_INT_2_10_10_10_REV: return 1; //sizeof(deUint32)/4;
            case rrVertexAttrib.VertexAttribType.PURE_UINT8: return 1;
            case rrVertexAttrib.VertexAttribType.PURE_UINT16: return 2;
            case rrVertexAttrib.VertexAttribType.PURE_UINT32: return 4;
            case rrVertexAttrib.VertexAttribType.PURE_INT8: return 1;
            case rrVertexAttrib.VertexAttribType.PURE_INT16: return 2;
            case rrVertexAttrib.VertexAttribType.PURE_INT32: return 4;
            case rrVertexAttrib.VertexAttribType.NONPURE_UNORM8_BGRA: return 1;
            case rrVertexAttrib.VertexAttribType.NONPURE_UNORM_2_10_10_10_REV_BGRA: return 1; //sizeof(deUint32)/4;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM_2_10_10_10_REV_CLAMP_BGRA: return 1; //sizeof(deUint32)/4;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM_2_10_10_10_REV_SCALE_BGRA: return 1; //sizeof(deUint32)/4;
            default:
                throw new Error('rrVertexAttrib.getComponentSize - Invalid type');
                return 0;
        }
    };

    /**
     * rrVertexAttrib.isValidVertexAttrib function
     * @param {rrVertexAttrib.VertexAttrib} vertexAttrib
     * @return {boolean}
     */
    rrVertexAttrib.isValidVertexAttrib = function(vertexAttrib) {
        // Trivial range checks.
        if (!deMath.deInBounds32(vertexAttrib.type, 0, Object.keys(rrVertexAttrib.VertexAttribType).length) ||
            !deMath.deInRange32(vertexAttrib.size, 0, 4) ||
            vertexAttrib.instanceDivisor < 0)
            return false;

        // Generic attributes
        if (!vertexAttrib.pointer && vertexAttrib.type != rrVertexAttrib.VertexAttribType.DONT_CARE)
            return false;

        // Packed formats
        if ((vertexAttrib.type == rrVertexAttrib.VertexAttribType.NONPURE_INT_2_10_10_10_REV ||
            vertexAttrib.type == rrVertexAttrib.VertexAttribType.NONPURE_UINT_2_10_10_10_REV ||
            vertexAttrib.type == rrVertexAttrib.VertexAttribType.NONPURE_UNORM_2_10_10_10_REV ||
            vertexAttrib.type == rrVertexAttrib.VertexAttribType.NONPURE_SNORM_2_10_10_10_REV_CLAMP ||
            vertexAttrib.type == rrVertexAttrib.VertexAttribType.NONPURE_SNORM_2_10_10_10_REV_SCALE ||
            vertexAttrib.type == rrVertexAttrib.VertexAttribType.NONPURE_UNORM_2_10_10_10_REV_BGRA ||
            vertexAttrib.type == rrVertexAttrib.VertexAttribType.NONPURE_SNORM_2_10_10_10_REV_CLAMP_BGRA ||
            vertexAttrib.type == rrVertexAttrib.VertexAttribType.NONPURE_SNORM_2_10_10_10_REV_SCALE_BGRA) &&
            vertexAttrib.size != 4)
            return false;

        return true;
    };

    /**
     * rrVertexAttrib.readVertexAttrib function
     * @param {rrVertexAttrib.VertexAttrib} vertexAttrib
     * @param {number} instanceNdx
     * @param {number} vertexNdx
     * @param {rrGenericVector.GenericVecType} genericType
     * @return {TypedArray}
     */
    rrVertexAttrib.readVertexAttrib = function(vertexAttrib, instanceNdx, vertexNdx, genericType) {
        DE_ASSERT(rrVertexAttrib.isValidVertexAttrib(vertexAttrib));
        /** @type {TypedArray} */ var dst;

        if (vertexAttrib.pointer)
        {
            /** @type {number} */ var elementNdx = (vertexAttrib.instanceDivisor != 0) ? (instanceNdx / vertexAttrib.instanceDivisor) : vertexNdx;
            /** @type {number} */ var compSize = rrVertexAttrib.getComponentSize(vertexAttrib.type);
            /** @type {number} */ var stride = (vertexAttrib.stride != 0) ? (vertexAttrib.stride) : (vertexAttrib.size * compSize);
            /** @type {number} */ var byteOffset = elementNdx * stride;

            dst = [0, 0, 0, 1]; // defaults

            switch (genericType) {
                case rrGenericVector.GenericVecType.INT32:
                    dst = new Int32Array(dst);
                    break;
                case rrGenericVector.GenericVecType.UINT32:
                    dst = new Uint32Array(dst);
                    break;
                case rrGenericVector.GenericVecType.FLOAT:
                    dst = new Float32Array(dst);
                    break;
            }

            rrVertexAttrib.read(dst, vertexAttrib.type, vertexAttrib.size, new Uint8Array(vertexAttrib.pointer).subarray(byteOffset));
        }
        else
        {
            dst = new Uint32Array(vertexAttrib.generic);
        }

        return dst;
    };

    /**
     * rrVertexAttrib.readHalf
     * @param {TypedArray} dst
     * @param {number} size
     * @param {Uint8Array} ptr
     */
    rrVertexAttrib.readHalf = function(dst, size, ptr) {
        var arraysize16 = 2; //2 bytes

        //Reinterpret ptr as a uint16 array,
        //assuming original ptr is 8-bits per element.
        var aligned = new Uint16Array(ptr.buffer).subarray(
            ptr.byteOffset / arraysize16,
            (ptr.byteOffset + ptr.byteLength) / arraysize16);

        //Reinterpret aligned's values into the dst vector.
        dst[0] = tcuFloat.newFloat32From16(aligned[0]);
        if (size >= 2) dst[1] = tcuFloat.newFloat32From16(aligned[1]);
        if (size >= 3) dst[2] = tcuFloat.newFloat32From16(aligned[2]);
        if (size >= 4) dst[3] = tcuFloat.newFloat32From16(aligned[3]);
    };

    /**
     * rrVertexAttrib.readFixed
     * @param {TypedArray} dst
     * @param {number} size
     * @param {Uint8Array} ptr
     */
    rrVertexAttrib.readFixed = function(dst, size, ptr) {
        var arraysize32 = 4; //4 bytes

        //Reinterpret ptr as a uint16 array,
        //assuming original ptr is 8-bits per element
        var aligned = new Int32Array(ptr.buffer).subarray(
            ptr.byteOffset / arraysize32,
            (ptr.byteOffset + ptr.byteLength) / arraysize32);

        //Reinterpret aligned's values into the dst vector.
        dst[0] = aligned[0] / Float32Array([1 << 16])[0];
        if (size >= 2) dst[1] = aligned[1] / Float32Array([1 << 16])[0];
        if (size >= 3) dst[2] = aligned[2] / Float32Array([1 << 16])[0];
        if (size >= 4) dst[3] = aligned[3] / Float32Array([1 << 16])[0];
    };

    /**
     * TODO: Check 64 bit numbers are handled ok
     * rrVertexAttrib.readDouble
     * @param {TypedArray} dst
     * @param {number} size
     * @param {Uint8Array} ptr
     */
    rrVertexAttrib.readDouble = function(dst, size, ptr) {
        var arraysize64 = 8; //8 bytes

        //Reinterpret 'ptr' into 'aligned' as a float64 array,
        //assuming original ptr is 8-bits per element.
        var aligned = new Float64Array(ptr.buffer).subarray(
            ptr.byteOffset / arraysize64,
            (ptr.byteOffset + ptr.byteLength) / arraysize64);

        //Reinterpret aligned's values into the dst vector.
        dst[0] = aligned[0];
        if (size >= 2) dst[1] = aligned[1];
        if (size >= 3) dst[2] = aligned[2];
        if (size >= 4) dst[3] = aligned[3];
    };

    /**
     * rrVertexAttrib.readUnormOrder
     * @param {TypedArray} dst
     * @param {number} size
     * @param {Uint8Array} ptr
     * @param {(rrVertexAttrib.NormalOrder|rrVertexAttrib.BGRAOrder)} order
     * @param {TypedArray} readAsTypeArray
     */
    rrVertexAttrib.readUnormOrder = function(dst, size, ptr, order, readAsTypeArray) {
        var arrayelementsize = readAsTypeArray.BYTES_PER_ELEMENT;

        //Left shift within 32-bit range as 32-bit float.
        var range = new Float32Array([deMath.shiftLeft(1, arrayelementsize * 8) - 1])[0];

        //Reinterpret aligned as an array the same type of readAsTypeArray
        //but with ptr's buffer, assuming ptr is an 8-bit element array,
        //and convert to 32-bit float values.
        var aligned = new Float32Array(new readAsTypeArray(ptr.buffer).subarray(
            ptr.byteOffset / arrayelementsize,
            (ptr.byteOffset + ptr.byteLength) / arrayelementsize));

        //Reinterpret aligned's values into the dst vector.
        dst[order.T0] = aligned[0] / range;
        if (size >= 2) dst[order.T1] = aligned[1] / range;
        if (size >= 3) dst[order.T2] = aligned[2] / range;
        if (size >= 4) dst[order.T3] = aligned[3] / range;
    };

    /**
     * rrVertexAttrib.readOrder
     * @param {TypedArray} dst
     * @param {number} size
     * @param {Uint8Array} ptr
     * @param {(rrVertexAttrib.NormalOrder|rrVertexAttrib.BGRAOrder)} order
     * @param {TypedArray} readAsTypeArray
     */
    rrVertexAttrib.readOrder = function(dst, size, ptr, order, readAsTypeArray) {
        var arrayelementsize = readAsTypeArray.BYTES_PER_ELEMENT;

        //Reinterpret aligned as an array the same type of readAsTypeArray
        //but with ptr's buffer, assuming ptr is an 8-bit element array.
        var aligned = new readAsTypeArray(ptr.buffer).subarray(
            ptr.byteOffset / arrayelementsize,
            (ptr.byteOffset + ptr.byteLength) / arrayelementsize);

        //Reinterpret aligned's values into the dst vector.
        //(automatic in JS typed arrays).
        dst[order.T0] = aligned[0];
        if (size >= 2) dst[order.T1] = aligned[1];
        if (size >= 3) dst[order.T2] = aligned[2];
        if (size >= 4) dst[order.T3] = aligned[3];
    };

    /**
     * TODO: Implement missing rrVertexAttrib.read functions.
     * @param {TypedArray} dst
     * @param {rrVertexAttrib.VertexAttribType} type
     * @param {number} size
     * @param {Uint8Array} ptr
     */
    rrVertexAttrib.read = function(dst, type, size, ptr) {
        var order;

        switch (type) {
            case rrVertexAttrib.VertexAttribType.FLOAT:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Float32Array);
                break;
            case rrVertexAttrib.VertexAttribType.HALF:
                rrVertexAttrib.readHalf(dst, size, ptr);
                break;
            case rrVertexAttrib.VertexAttribType.FIXED:
                rrVertexAttrib.readFixed(dst, size, ptr);
                break;
            case rrVertexAttrib.VertexAttribType.DOUBLE:
                rrVertexAttrib.readDouble(dst, size, ptr);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_UNORM8:
                rrVertexAttrib.readUnormOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Uint8Array);
            case rrVertexAttrib.VertexAttribType.NONPURE_UNORM16:
                rrVertexAttrib.readUnormOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Uint16Array);
            case rrVertexAttrib.VertexAttribType.NONPURE_UNORM32:
                rrVertexAttrib.readUnormOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Uint32Array);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_UNORM_2_10_10_10_REV:
                readUnorm2101010RevOrder(dst, size, ptr, rrVertexAttrib.NormalOrder);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM8_CLAMP: //Int8
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM16_CLAMP: //Int16
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM32_CLAMP: //Int32
                readSnormClamp(dst, size, ptr);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM_2_10_10_10_REV_CLAMP:
                readSnorm2101010RevClampOrder(dst, size, ptr, rrVertexAttrib.NormalOrder);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM8_SCALE: //Int8
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM16_SCALE: //Int16
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM32_SCALE: //Int32
                readSnormScale(dst, size, ptr);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM_2_10_10_10_REV_SCALE:
                readSnorm2101010RevScaleOrder(dst, size, ptr, rrVertexAttrib.NormalOrder);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_UINT_2_10_10_10_REV:
                readUint2101010RevOrder(dst, size, ptr, rrVertexAttrib.NormalOrder);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_INT_2_10_10_10_REV:
                readInt2101010Rev(dst, size, ptr);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_UNORM8_BGRA:
                rrVertexAttrib.readUnormOrder(dst, size, ptr, rrVertexAttrib.BGRAOrder, Uint8Array);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_UNORM_2_10_10_10_REV_BGRA:
                readUnorm2101010RevOrder(dst, size, ptr, rrVertexAttrib.BGRAOrder);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM_2_10_10_10_REV_CLAMP_BGRA:
                readSnorm2101010RevClampOrder(dst, size, ptr, rrVertexAttrib.BGRAOrder);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_SNORM_2_10_10_10_REV_SCALE_BGRA:
                readSnorm2101010RevScaleOrder(dst, size, ptr, rrVertexAttrib.BGRAOrder);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_UINT8:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Uint8Array);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_UINT16:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Uint16Array);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_UINT32:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Uint32Array);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_INT8:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Int8Array);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_INT16:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Int16Array);
                break;
            case rrVertexAttrib.VertexAttribType.NONPURE_INT32:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Int32Array);
                break;
            case rrVertexAttrib.VertexAttribType.PURE_UINT8:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Uint8Array);
                break;
            case rrVertexAttrib.VertexAttribType.PURE_UINT16:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Uint16Array);
                break;
            case rrVertexAttrib.VertexAttribType.PURE_UINT32:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Uint32Array);
                break;
            case rrVertexAttrib.VertexAttribType.PURE_INT8:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Int8Array);
                break;
            case rrVertexAttrib.VertexAttribType.PURE_INT16:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Int16Array);
                break;
            case rrVertexAttrib.VertexAttribType.PURE_INT32:
                rrVertexAttrib.readOrder(dst, size, ptr, rrVertexAttrib.NormalOrder, Int32Array);
                break;

            default:
                throw new Error('rrVertexAttrib.read - Invalid type');
        }
    };

    
});
