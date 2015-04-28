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
goog.provide('framework.referencerenderer.rrShadingContext');
goog.require('framework.delibs.debase.deMath');
goog.require('framework.referencerenderer.rrDefs');
goog.require('framework.referencerenderer.rrFragmentPacket');
goog.require('framework.referencerenderer.rrGenericVector');


goog.scope(function() {

var rrShadingContext = framework.referencerenderer.rrShadingContext;
var deMath = framework.delibs.debase.deMath;
var rrDefs = framework.referencerenderer.rrDefs;
var rrFragmentPacket = framework.referencerenderer.rrFragmentPacket;
var rrGenericVector = framework.referencerenderer.rrGenericVector;
    

    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    rrShadingContext.DE_NULL = null;

    /**
     * Fragment shading context
     *
     * Contains per-primitive information used in fragment shading
     * @constructor
     * @param {Array<number>} varying0 (GenericVec4*)
     * @param {Array<number>} varying1 (GenericVec4*)
     * @param {Array<number>} varying2 (GenericVec4*)
     * @param {Array<number>} outputArray (GenericVec4*)
     * @param {Array<number>} fragmentDepths (float*)
     * @param {number} numFragmentOutputs
     * @param {number} numSamples
     */
    rrShadingContext.FragmentShadingContext = function (varying0, varying1, varying2, outputArray, fragmentDepths, numFragmentOutputs, numSamples) {
        /** @type {Array<Array<number>>} (GenericVec4**) */ this.varyings = [varying0, varying1, varying2]; //!< Vertex shader outputs. Pointer will be NULL if there is no such vertex.
        /** @type {Array<number>} (GenericVec4*) */ this.outputArray = outputArray; //!< Fragment output array
        /** @type {number} */ this.numFragmentOutputs = numFragmentOutputs; //!< Fragment output count
        /** @type {number} */ this.numSamples = numSamples; //!< Number of samples
        /** @type {Array<number>} (float*) */ this.fragmentDepths = fragmentDepths; //!< Fragment packet depths. Pointer will be NULL if there is no depth buffer. Each sample has per-sample depth values
    };

    // Write output

    /**
     * rrShadingContext.writeFragmentOutput
     * @param {rrShadingContext.FragmentShadingContext} context
     * @param {number} packetNdx
     * @param {number} fragNdx
     * @param {number} outputNdx
     * @param {Object} value
     */
    rrShadingContext.writeFragmentOutput = function (context, packetNdx, fragNdx, outputNdx, value) {
        DE_ASSERT(packetNdx >= 0);
        DE_ASSERT(fragNdx >= 0 && fragNdx < 4);
        DE_ASSERT(outputNdx >= 0 && outputNdx < context.numFragmentOutputs);

        context.outputArray[outputNdx + context.numFragmentOutputs * (fragNdx + packetNdx * 4)] = value;
    };

    // Read Varying

    /**
     * @param {rrFragmentPacket.FragmentPacket} packet
     * @param {rrShadingContext.FragmentShadingContext} context
     * @param {number} varyingLoc
     * @param {number} fragNdx
     * @return {Array<number>} (Vector<T, 4>)
     */
    rrShadingContext.readPointVarying = function (packet, context, varyingLoc, fragNdx) {
        //DE_UNREF(fragNdx);
        //DE_UNREF(packet);

        return context.varyings[0][varyingLoc];
    };

    /**
     * @param {rrFragmentPacket.FragmentPacket} packet
     * @param {rrShadingContext.FragmentShadingContext} context
     * @param {number} varyingLoc
     * @param {number} fragNdx
     * @return {Array<number>} (Vector<T, 4>)
     */
    rrShadingContext.readLineVarying = function (packet, context, varyingLoc, fragNdx) {
        return   packet.barycentric[0][fragNdx] * context.varyings[0][varyingLoc] +
            packet.barycentric[1][fragNdx] * context.varyings[1][varyingLoc];
    };

    //REMOVED: @param {number} fragNdx
    /**
     * @param {rrFragmentPacket.FragmentPacket} packet
     * @param {rrShadingContext.FragmentShadingContext} context
     * @param {number} varyingLoc
     * @return {Array<number>} (Vector<T, 4>)
     */
    rrShadingContext.readTriangleVarying = function (packet, context, varyingLoc) {
        return deMath.add (
            deMath.scale(
                context.varyings[0][varyingLoc],
                packet.barycentric[0]
            ),
            deMath.add(
                deMath.scale(
                    context.varyings[1][varyingLoc],
                    packet.barycentric[1]
                ),
                deMath.scale(
                    context.varyings[2][varyingLoc],
                    packet.barycentric[2]
                )
            )
        );
    };

    /**
     * @param {rrFragmentPacket.FragmentPacket} packet
     * @param {rrShadingContext.FragmentShadingContext} context
     * @param {number} varyingLoc
     * @param {number} fragNdx
     * @return {Array<number>} (Vector<T, 4>)
     */
    rrShadingContext.readVarying = function (packet, context, varyingLoc, fragNdx) {
        if (context.varyings[1] == rrShadingContext.DE_NULL) return rrShadingContext.readPointVarying(packet, context, varyingLoc, fragNdx);
        if (context.varyings[2] == rrShadingContext.DE_NULL) return rrShadingContext.readLineVarying(packet, context, varyingLoc, fragNdx);
        return rrShadingContext.readTriangleVarying(packet, context, varyingLoc, fragNdx);
    };

    // Derivative

    /**
     * rrShadingContext.dFdxLocal
     * @param {Array<Array<number>>} outFragmentdFdx
     * @param {Array<Array<number>>} func
     */
    rrShadingContext.dFdxLocal = function (outFragmentdFdx, func) {
        /** @type {Array<Array<number>>} */ var dFdx = [
            deMath.subtract(func[1], func[0]),
            deMath.subtract(func[3], func[2])
        ];

        outFragmentdFdx[0] = deMath.assign(dFdx[0]);
        outFragmentdFdx[1] = deMath.assign(dFdx[0]);
        outFragmentdFdx[2] = deMath.assign(dFdx[1]);
        outFragmentdFdx[3] = deMath.assign(dFdx[1]);
    };

    /**
     * rrShadingContext.dFdyLocal
     * @param {Array<Array<number>>} outFragmentdFdy
     * @param {Array<Array<number>>} func
     */
    rrShadingContext.dFdyLocal = function (outFragmentdFdy, func) {
        /** @type {Array<Array<number>>} */ var dFdy = [
            deMath.subtract(func[2], func[0]),
            deMath.subtract(func[3], func[1])
        ];

        outFragmentdFdy[0] = deMath.assign(dFdy[0]);
        outFragmentdFdy[1] = deMath.assign(dFdy[1]);
        outFragmentdFdy[2] = deMath.assign(dFdy[0]);
        outFragmentdFdy[3] = deMath.assign(dFdy[1]);
    };

    /**
     * rrShadingContext.dFdxVarying
     * @param {Array<Array<number>>} outFragmentdFdx
     * @param {rrFragmentPacket.FragmentPacket} packet
     * @param {rrShadingContext.FragmentShadingContext} context
     * @param {number} varyingLoc
     */
    rrShadingContext.dFdxVarying = function (outFragmentdFdx, packet, context, varyingLoc) {
        /** @type {Array<Array<number>>} */ var func = [
            rrShadingContext.readVarying(packet, context, varyingLoc, 0),
            rrShadingContext.readVarying(packet, context, varyingLoc, 1),
            rrShadingContext.readVarying(packet, context, varyingLoc, 2),
            rrShadingContext.readVarying(packet, context, varyingLoc, 3)
        ];

        rrShadingContext.dFdxLocal(outFragmentdFdx, func);
    };

    /**
     * rrShadingContext.dFdyVarying
     * @param {Array<Array<number>>} outFragmentdFdy
     * @param {rrFragmentPacket.FragmentPacket} packet
     * @param {rrShadingContext.FragmentShadingContext} context
     * @param {number} varyingLoc
     */
    rrShadingContext.dFdyVarying = function (outFragmentdFdy, packet, context, varyingLoc) {
        /** @type {Array<Array<number>>} */ var func = [
            rrShadingContext.readVarying(packet, context, varyingLoc, 0),
            rrShadingContext.readVarying(packet, context, varyingLoc, 1),
            rrShadingContext.readVarying(packet, context, varyingLoc, 2),
            rrShadingContext.readVarying(packet, context, varyingLoc, 3)
        ];

        rrShadingContext.dFdyLocal(outFragmentdFdy, func);
    };

    // Fragent depth

    /**
     * rrShadingContext.readFragmentDepth
     * @param {rrShadingContext.FragmentShadingContext} context
     * @param {number} packetNdx
     * @param {number} fragNdx
     * @param {number} sampleNdx
     * @return {number}
     */
    rrShadingContext.readFragmentDepth = function (context, packetNdx, fragNdx, sampleNdx) {
        // Reading or writing to fragment depth values while there is no depth buffer is legal but not supported by rr
        DE_ASSERT(context.fragmentDepths);
        return context.fragmentDepths[(packetNdx * 4 + fragNdx) * context.numSamples + sampleNdx];
    };

    /**
     * rrShadingContext.writeFragmentDepth
     * @param {rrShadingContext.FragmentShadingContext} context
     * @param {number} packetNdx
     * @param {number} fragNdx
     * @param {number} sampleNdx
     * @param {number} depthValue
     */
    rrShadingContext.writeFragmentDepth = function (context, packetNdx, fragNdx, sampleNdx, depthValue) {
        // Reading or writing to fragment depth values while there is no depth buffer is legal but not supported by rr
        DE_ASSERT(context.fragmentDepths);
        context.fragmentDepths[(packetNdx * 4 + fragNdx) * context.numSamples + sampleNdx] = depthValue;
    };

    
});