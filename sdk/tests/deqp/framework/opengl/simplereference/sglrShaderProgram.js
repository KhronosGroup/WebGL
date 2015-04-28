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
goog.provide('framework.opengl.simplereference.sglrShaderProgram');
goog.require('framework.referencerenderer.rrShaders');
goog.require('framework.referencerenderer.rrGenericVector');
goog.require('framework.referencerenderer.rrDefs');
goog.require('framework.common.tcuTexture');
goog.require('framework.delibs.debase.deMath');
goog.require('framework.opengl.gluTextureUtil');
goog.require('framework.opengl.gluShaderUtil');
//goog.require('framework.opengl.simplereference.sglrReferenceContext');
goog.require('framework.common.tcuTextureUtil');


goog.scope(function() {

    var sglrShaderProgram = framework.opengl.simplereference.sglrShaderProgram;
    var rrShaders = framework.referencerenderer.rrShaders;
    var rrGenericVector = framework.referencerenderer.rrGenericVector;
    var tcuTexture = framework.common.tcuTexture;
    var deMath = framework.delibs.debase.deMath;
    var gluTextureUtil = framework.opengl.gluTextureUtil;
    var gluShaderUtil = framework.opengl.gluShaderUtil;
    //var sglrReferenceContext = framework.opengl.simplereference.sglrReferenceContext;
    var tcuTextureUtil = framework.common.tcuTextureUtil;
var rrDefs = framework.referencerenderer.rrDefs;

    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    /**
     * sglrShaderProgram.VaryingFlags
     * @enum
     */
    sglrShaderProgram.VaryingFlags = function() {
        this.NONE = true; //TODO: is NONE necessary?
        this.FLATSHADE = false;
    };

    /**
     * sglrShaderProgram.VertexAttribute
     * @constructor
     * @param {string} name_
     * @param {rrGenericVector.GenericVecType} type_
     */
    sglrShaderProgram.VertexAttribute = function (name_, type_) {
        this.name = name_;
        this.type = type_;
    };

    /**
     * sglrShaderProgram.VertexToFragmentVarying
     * @constructor
     * @param {rrGenericVector.GenericVecType=} type_
     */
    sglrShaderProgram.VertexToFragmentVarying = function (type_, flags) {
        this.type = type_;
        this.flatshade = flags === undefined ? new sglrShaderProgram.VaryingFlags().FLATSHADE : flags.FLATSHADE;
    };

    /**
     * sglrShaderProgram.FragmentOutput
     * @constructor
     * @param {rrGenericVector.GenericVecType} type_
     */
    sglrShaderProgram.FragmentOutput = function (type_) {
        this.type = type_;
    };

    /**
     * sglrShaderProgram.Uniform
     * @constructor
     * @param {string} name_
     * @param {gluShaderUtil.DataType} type_
     */
    sglrShaderProgram.Uniform = function (name_, type_) {
        this.name = name_;
        this.type = type_;
    };

    /**
     * sglrShaderProgram.VertexSource
     * @constructor
     * @param {string} str
     */
    sglrShaderProgram.VertexSource = function (str) {
        this.source = str;
    };

    /**
     * sglrShaderProgram.FragmentSource
     * @constructor
     * @param {string} str
     */
    sglrShaderProgram.FragmentSource = function (str) {
        this.source = str;
    };

    /**
     * sglrShaderProgram.ShaderProgramDeclaration
     * @constructor
     */
    sglrShaderProgram.ShaderProgramDeclaration = function () {
        /** @type {Array<sglrShaderProgram.VertexAttribute>} */ this.m_vertexAttributes = [];
        /** @type {Array<sglrShaderProgram.VertexToFragmentVarying>} */ this.m_vertexToFragmentVaryings = [];
        /** @type {Array<sglrShaderProgram.FragmentOutput>} */ this.m_fragmentOutputs = [];
        /** @type {Array<sglrShaderProgram.Uniform>} */ this.m_uniforms = [];
        /** @type {string} */ this.m_vertexSource;
        /** @type {string} */ this.m_fragmentSource;

        /** @type {boolean} */ this.m_vertexShaderSet = false;
        /** @type {boolean} */ this.m_fragmentShaderSet = false;
    };

    /**
     * Add a vertex attribute to the shader program declaration.
     * @param {sglrShaderProgram.VertexAttribute} v
     * @return {sglrShaderProgram.ShaderProgramDeclaration}
     */
    sglrShaderProgram.ShaderProgramDeclaration.prototype.pushVertexAttribute = function (v) {
        this.m_vertexAttributes.push(v);
        return this;
    };

    /**
     * Add a vertex to fragment varying to the shader program declaration.
     * @param {sglrShaderProgram.VertexToFragmentVarying} v
     * @return {sglrShaderProgram.ShaderProgramDeclaration}
     */
    sglrShaderProgram.ShaderProgramDeclaration.prototype.pushVertexToFragmentVarying = function (v) {
        this.m_vertexToFragmentVaryings.push(v);
        return this;
    };

    /**
     * Add a fragment output to the shader program declaration.
     * @param {sglrShaderProgram.FragmentOutput} v
     * @return {sglrShaderProgram.ShaderProgramDeclaration}
     */
    sglrShaderProgram.ShaderProgramDeclaration.prototype.pushFragmentOutput = function (v) {
        this.m_fragmentOutputs.push(v);
        return this;
    };

    /**
     * Add a uniform to the shader program declaration.
     * @param {sglrShaderProgram.Uniform} v
     * @return {sglrShaderProgram.ShaderProgramDeclaration}
     */
    sglrShaderProgram.ShaderProgramDeclaration.prototype.pushUniform = function (v) {
        this.m_uniforms.push(v);
        return this;
    };

    /**
     * @param {sglrShaderProgram.VertexSource} c
     */
    sglrShaderProgram.ShaderProgramDeclaration.prototype.pushVertexSource = function (c) {
        DE_ASSERT(!this.m_vertexShaderSet);
        this.m_vertexSource = c.source;
        this.m_vertexShaderSet = true;
        return this;
    };

    /**
     * @param {sglrShaderProgram.FragmentSource} c
     */
    sglrShaderProgram.ShaderProgramDeclaration.prototype.pushFragmentSource = function (c) {
        DE_ASSERT(!this.m_fragmentSource);
        this.m_fragmentSource = c.source;
        this.m_fragmentShaderSet = true;
        return this;
    };

    /**
     * @return {boolean}
     */
    sglrShaderProgram.ShaderProgramDeclaration.prototype.valid = function () {
        if (!this.m_vertexShaderSet || !this.m_fragmentShaderSet)
            return false;

        if (this.m_fragmentOutputs.length == 0)
            return false;

        return true;
    };

    /**
     * @return {number}
     */
    sglrShaderProgram.ShaderProgramDeclaration.prototype.getVertexInputCount = function () {
        return this.m_vertexAttributes.length;
    };

    /**
     * @return {number}
     */
    sglrShaderProgram.ShaderProgramDeclaration.prototype.getVertexOutputCount = function () {
        return this.m_vertexToFragmentVaryings.length;
    };

    /**
     * @return {number}
     */
    sglrShaderProgram.ShaderProgramDeclaration.prototype.getFragmentInputCount = function () {
        return this.m_vertexToFragmentVaryings.length;
    };

    /**
     * @return {number}
     */
    sglrShaderProgram.ShaderProgramDeclaration.prototype.getFragmentOutputCount = function () {
        return this.m_fragmentOutputs.length;
    };

    /**
     * @constructor
     * sglrShaderProgram.UniformSlot
     */
    sglrShaderProgram.UniformSlot = function () {
        /** @type {string} */ this.name = '';
        /** @type {gluShaderUtil.DataType} */ this.type = undefined;
        /** @type {number} */ this.value = 0;
        /** @type {?rrDefs.Sampler} */ this.sampler = null;
    };

    /**
     * @constructor
     * @param {sglrShaderProgram.ShaderProgramDeclaration} decl
     */
    sglrShaderProgram.ShaderProgram = function (decl) {
        this.vertexShader = new rrShaders.VertexShader(decl.getVertexInputCount(), decl.getVertexOutputCount());
        this.vertexShader.shadeVertices = this.shadeVertices;
        this.fragmentShader = new rrShaders.FragmentShader(decl.getFragmentInputCount(), decl.getFragmentOutputCount());
        this.fragmentShader.shadeFragments = this.shadeFragments;

        /** @type {Array<string>} */ this.m_attributeNames = new Array(decl.getFragmentInputCount());
        /** @type {Array<sglrShaderProgram.UniformSlot>} */ this.m_uniforms = new Array(decl.m_uniforms.length);
        /** @type {string} */ this.m_vertSrc = decl.m_vertexSource;
        /** @type {string} */ this.m_fragSrc = decl.m_fragmentSource;

        DE_ASSERT(decl.valid());

        // Set up shader IO

        for (var ndx = 0; ndx < decl.m_vertexAttributes.length; ++ndx) {
            this.vertexShader.m_inputs[ndx].type  = decl.m_vertexAttributes[ndx].type;
            this.m_attributeNames[ndx] = decl.m_vertexAttributes[ndx].name;
        }

        for (var ndx = 0; ndx < decl.m_vertexToFragmentVaryings.length; ++ndx) {
            this.vertexShader.m_outputs[ndx].type = decl.m_vertexToFragmentVaryings[ndx].type;
            this.vertexShader.m_outputs[ndx].flatshade = decl.m_vertexToFragmentVaryings[ndx].flatshade;

            this.fragmentShader.m_inputs[ndx] = this.vertexShader.m_outputs[ndx];
        }

        for (var ndx = 0; ndx < decl.m_fragmentOutputs.length; ++ndx)
            this.fragmentShader.m_outputs[ndx].type = decl.m_fragmentOutputs[ndx].type;

        // Set up uniforms

        for (var ndx = 0; ndx < decl.m_uniforms.length; ++ndx)
            this.m_uniforms[ndx] = new sglrShaderProgram.Uniform(decl.m_uniforms[ndx].name, decl.m_uniforms[ndx].type);
    };

    /**
     * @return {rrShaders.VertexShader}
     */
    sglrShaderProgram.ShaderProgram.prototype.getVertexShader = function () {
        return this.vertexShader;
    };

    /**
     * @return {rrShaders.FragmentShader}
     */
    sglrShaderProgram.ShaderProgram.prototype.getFragmentShader = function () {
        return this.fragmentShader;
    };

    /**
     * @param {string} name
     * @return {sglrShaderProgram.UniformSlot}
     */
    sglrShaderProgram.ShaderProgram.prototype.getUniformByName = function (name) {
        DE_ASSERT(name);

        for (var ndx = 0; ndx < this.m_uniforms.length; ++ndx)
            if (this.m_uniforms[ndx].name == name)
                return this.m_uniforms[ndx];

        DE_ASSERT(!"Invalid uniform name, uniform not found.");
        return this.m_uniforms[0];
    };



});
