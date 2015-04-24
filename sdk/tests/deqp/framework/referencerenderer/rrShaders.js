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
goog.provide('framework.referencerenderer.rrShaders');
goog.require('framework.common.tcuTexture');
goog.require('framework.delibs.debase.deMath');
goog.require('framework.referencerenderer.rrFragmentPacket');
goog.require('framework.referencerenderer.rrGenericVector');
goog.require('framework.referencerenderer.rrShadingContext');
goog.require('framework.referencerenderer.rrVertexAttrib');
goog.require('framework.referencerenderer.rrVertexPacket');


goog.scope(function() {

var rrShaders = framework.referencerenderer.rrShaders;
var tcuTexture = framework.common.tcuTexture;
var deMath = framework.delibs.debase.deMath;
var rrFragmentPacket = framework.referencerenderer.rrFragmentPacket;
var rrGenericVector = framework.referencerenderer.rrGenericVector;
var rrShadingContext = framework.referencerenderer.rrShadingContext;
var rrVertexAttrib = framework.referencerenderer.rrVertexAttrib;
var rrVertexPacket = framework.referencerenderer.rrVertexPacket;

    /**
     * Vertex shader input information
     * @constructor
     */
    rrShaders.VertexInputInfo = function () {
        /** @type {rrGenericVector.GenericVecType} */ this.type = undefined;
    };

    /**
     * Shader varying information
     * @constructor
     */
    rrShaders.VertexVaryingInfo = function () {
        /** @type {rrGenericVector.GenericVecType} */ this.type = undefined;
        /** @type {boolean} */ var flatshade   = false;
    };

    rrShaders.VertexOutputInfo = rrShaders.VertexVaryingInfo;
    rrShaders.FragmentInputInfo = rrShaders.VertexVaryingInfo;

    /**
     * Fragment shader output information
     * @constructor
     */
    rrShaders.FragmentOutputInfo = function () {
        //Sensible defaults
        /** @type {rrGenericVector.GenericVecType} */ this.type = undefined;
    };

    /**
     * Vertex shader interface
     *
     * Vertex shaders execute shading for set of vertex packets. See VertexPacket
     * documentation for more details on shading API.
     * @constructor
     * @param {number} numInputs
     * @param {number} numOutputs
     */
    rrShaders.VertexShader = function (numInputs, numOutputs) {
        /** @type {Array.<rrShaders.VertexInputInfo>} */ this.m_inputs = new Array(numInputs);
        for(var ndx = 0; ndx < numInputs; ndx++) this.m_inputs[ndx] = new rrShaders.VertexInputInfo();
        /** @type {Array.<rrShaders.VertexOutputInfo>} */ this.m_outputs = new Array(numOutputs);
        for(var ndx = 0; ndx < numOutputs; ndx++) this.m_outputs[ndx] = new rrShaders.VertexOutputInfo();
    };

    /**
     * shadeVertices - abstract function, to be implemented by children classes
     * @param {rrVertexAttrib.VertexAttrib} inputs
     * @param {rrVertexPacket.VertexPacket} packets
     * @param {number} numPackets
     */
     rrShaders.VertexShader.prototype.shadeVertices = function(inputs, packets, numPackets) {
     };

     /**
      * getInputs
      * @return {Array.<rrShaders.VertexInputInfo>}
      */
     rrShaders.VertexShader.prototype.getInputs = function () {return this.m_inputs;};

     /**
      * getOutputs
      * @return {Array.<rrShaders.VertexOutputInfo>}
      */
    rrShaders.VertexShader.prototype.getOutputs = function () {return this.m_outputs;}

    /**
     * Fragment shader interface
     *
     * Fragment shader executes shading for list of fragment packets. See
     * FragmentPacket documentation for more details on shading API.
     * @constructor
     * @param {number} numInputs
     * @param {number} numOutputs
     */
    rrShaders.FragmentShader = function (numInputs, numOutputs) {
        /** @type {Array.<rrShaders.FragmentInputInfo>} */ this.m_inputs = new Array(numInputs);
        for(var ndx = 0; ndx < numInputs; ndx++) this.m_inputs[ndx] = new rrShaders.FragmentInputInfo();
        /** @type {Array.<rrShaders.FragmentOutputInfo>} */ this.m_outputs = new Array(numOutputs);
        for(var ndx = 0; ndx < numOutputs; ndx++) this.m_outputs[ndx] = new rrShaders.FragmentOutputInfo();
    };

    /**
     * shadeFragments - abstract function, to be implemented by children classes
     * note that numPackets must be greater than zero.
     * @param {Array.<rrFragmentPacket.FragmentPacket>} packets
     * @param {number} numPackets
     * @param {rrShadingContext.FragmentShadingContext} context
     */
    rrShaders.FragmentShader.prototype.shadeFragments = function(packets, numPackets, context) {};

    /**
     * getInputs
     * @return {Array.<rrShaders.FragmentInputInfo>}
     */
    rrShaders.FragmentShader.prototype.getInputs = function () {return this.m_inputs;};

    /**
     * getOutputs
     * @return {Array.<rrShaders.FragmentOutputInfo>}
     */
    rrShaders.FragmentShader.prototype.getOutputs = function () {return this.m_outputs;}

    // Helpers for shader implementations.

    /**
     * rrShaders.VertexShaderLoop
     * @constructor
     * @param {Object} shader
     */
    rrShaders.VertexShaderLoop = function (shader) {
        rrShaders.VertexShader.call(this);
        this.m_shader = shader;
    };

    rrShaders.VertexShaderLoop.prototype = Object.create(rrShaders.VertexShader.prototype);
    rrShaders.VertexShaderLoop.prototype.constructor = rrShaders.VertexShaderLoop;

    /**
     * shadeVertices
     * @param {Array.<rrVertexAttrib.VertexAttrib>} inputs
     * @param {Array.<rrVertexPacket.VertexPacket>} packets
     * @param {number} numPackets
     * @param {Object} shader
     */
    rrShaders.VertexShaderLoop.prototype.shadeVertices = function (inputs, packets, numPackets, shader) {
        for (var ndx = 0; ndx < numPackets; ndx++)
            this.m_shader.shadeVertex(inputs, packets[ndx]);
    };

    /**
     * rrShaders.FragmentShaderLoop
     * @constructor
     * @param {Object} shader
     */
    rrShaders.FragmentShaderLoop = function (shader) {
        rrShaders.FragmentShader.call(this);
        this.m_shader = shader;
    };

    /**
     * shadeFragments
     * @param {Array.<rrFragmentPacket>} packets
     * @param {number} numPackets
     * @param {Object} shader
     */
    rrShaders.FragmentShaderLoop.prototype.shadeFragments = function (packets, numPackets) {
        for (var ndx = 0; ndx < numPackets; ndx++)
            this.m_shader.shadeFragment(packets[ndx]);
    };


});
