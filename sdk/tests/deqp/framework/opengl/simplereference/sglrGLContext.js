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
goog.provide('framework.opengl.simplereference.sglrGLContext');
goog.require('framework.common.tcuTexture');
goog.require('framework.delibs.debase.deUtil');
goog.require('framework.delibs.debase.deMath');
goog.require('framework.common.tcuTextureUtil');
goog.require('framework.common.tcuPixelFormat');
goog.require('framework.opengl.gluShaderProgram');
goog.require('framework.opengl.gluShaderUtil');
goog.require('framework.opengl.gluTextureUtil');
goog.require('framework.opengl.simplereference.sglrShaderProgram');
goog.require('framework.referencerenderer.rrDefs');
goog.require('framework.referencerenderer.rrMultisamplePixelBufferAccess');
goog.require('framework.referencerenderer.rrRenderer');
goog.require('framework.referencerenderer.rrRenderState');
goog.require('framework.referencerenderer.rrVertexAttrib');

goog.scope(function() {

    var sglrGLContext = framework.opengl.simplereference.sglrGLContext;
    var tcuTexture = framework.common.tcuTexture;
    var deUtil = framework.delibs.debase.deUtil;
    var deMath = framework.delibs.debase.deMath;
    var tcuTextureUtil = framework.common.tcuTextureUtil;
    var tcuPixelFormat = framework.common.tcuPixelFormat;
    var gluShaderProgram = framework.opengl.gluShaderProgram;
    var gluShaderUtil = framework.opengl.gluShaderUtil;
    var gluTextureUtil = framework.opengl.gluTextureUtil;
    var sglrShaderProgram = framework.opengl.simplereference.sglrShaderProgram;
    var rrDefs = framework.referencerenderer.rrDefs;
    var rrMultisamplePixelBufferAccess = framework.referencerenderer.rrMultisamplePixelBufferAccess;
    var rrRenderer = framework.referencerenderer.rrRenderer;
    var rrRenderState = framework.referencerenderer.rrRenderState;
    var rrVertexAttrib = framework.referencerenderer.rrVertexAttrib;

    sglrGLContext.DE_NULL = null;

    sglrGLContext.GLU_EXPECT_NO_ERROR = function(error, message) {
        if (error !== gl.NONE) {
            console.log('Assertion failed message:' + message);
            // throw new Error(message);
        }
    };

    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    /**
     * sglrGLContext.GLContext wraps the standard WebGL context to be able to be used interchangeably with the ReferenceContext
     * @constructor
     * @param {WebGL2RenderingContext} context
     */
    sglrGLContext.GLContext = function(context) {
        this.m_context = context;
        this.m_programs = [];
        this.m_allocatedVaos = [];

        // Copy all properties from the context.

        var prototypes = [];
        var prototype = Object.getPrototypeOf(this.m_context);

        //Traverse all the prototype hierarchy of the context object.
        while (prototype && prototype !== Object.prototype) {
            prototypes.push(prototype);
            prototype = Object.getPrototypeOf(prototype);
        }

        for (prototype in prototypes) {
            var keys = Object.keys(prototypes[prototype]);
            for(var key in keys) {
                var name = keys[key];

                var exists = false;
                var selfkeys = Object.keys(sglrGLContext.GLContext.prototype);
                for(var selfkey in selfkeys) {
                    var selfname = selfkeys[selfkey];

                    if(selfname == name) {
                        exists = true;
                        break;
                    }
                }

                if (!exists) {
                    Object.getPrototypeOf(this)[name] = (
                        function(originalobject, originalfunction) {
                            return function() {
                                return originalfunction.apply(originalobject, arguments);
                            };
                        }
                    )(this.m_context, this.m_context[name]);
                }
            }
        }
    };

    /**
     * createProgram
     * @param {sglrShaderProgram.ShaderProgram} shader
     * @return {WebGLProgram}
     */
    sglrGLContext.GLContext.prototype.createProgram = function(shader) {
        /** @type {gluShaderProgram.ShaderProgram} */ var program = null;

        program = new gluShaderProgram.ShaderProgram(
            this.m_context,
            gluShaderProgram.makeVtxFragSources(
                shader.m_vertSrc,
                shader.m_fragSrc
            )
        );

        if (!program.isOk()) {
            bufferedLogToConsole(program.toString());
            testFailedOptions("Compile failed", true);
        }

        return program.getProgram();
    };

    /**
     * createVertexArray - Creates a new vertex array object, stores it and returns the added array object.
     * @return {number} ID of created VAO
     */
    sglrGLContext.GLContext.prototype.createVertexArray = function() {
        var currentlength = this.m_allocatedVaos.length;

        var createdArray = this.m_context.createVertexArray();
        deUtil.dePushUniqueToArray(
            this.m_allocatedVaos,
            createdArray
        );

        return this.m_allocatedVaos[currentlength];
    };

    /**
     * Draws quads from vertex arrays
     * @param {number} first First vertex to begin drawing with
     * @param {number} count How many quads to draw (array should provide first + (count * 4) vertices at least)
     */
    sglrGLContext.GLContext.prototype.drawQuads = function (first, count) {
        this.m_context.drawArrays(gl.TRIANGLES, first, (count * 6) - first);
    };

});
