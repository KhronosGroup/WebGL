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
goog.provide('framework.opengl.simplereference.sglrReferenceContext');
goog.require('framework.common.tcuMatrix');
goog.require('framework.common.tcuMatrixUtil');
goog.require('framework.common.tcuPixelFormat');
goog.require('framework.common.tcuTexture');
goog.require('framework.common.tcuTextureUtil');
goog.require('framework.delibs.debase.deMath');
goog.require('framework.opengl.gluShaderUtil');
goog.require('framework.opengl.gluTextureUtil');
goog.require('framework.referencerenderer.rrDefs');
goog.require('framework.referencerenderer.rrMultisamplePixelBufferAccess');
goog.require('framework.referencerenderer.rrRenderer');
goog.require('framework.referencerenderer.rrRenderState');
goog.require('framework.referencerenderer.rrVertexAttrib');
goog.require('framework.opengl.simplereference.sglrReferenceUtils');
goog.require('framework.opengl.simplereference.sglrShaderProgram');

goog.scope(function() {

    var sglrReferenceContext = framework.opengl.simplereference.sglrReferenceContext;
    var rrMultisamplePixelBufferAccess = framework.referencerenderer.rrMultisamplePixelBufferAccess;
    var tcuTexture = framework.common.tcuTexture;
    var deMath = framework.delibs.debase.deMath;
    var gluTextureUtil = framework.opengl.gluTextureUtil;
    var tcuTextureUtil = framework.common.tcuTextureUtil;
    var tcuPixelFormat = framework.common.tcuPixelFormat;
    var gluShaderUtil = framework.opengl.gluShaderUtil;
    var rrRenderer = framework.referencerenderer.rrRenderer;
    var rrDefs = framework.referencerenderer.rrDefs;
    var rrVertexAttrib = framework.referencerenderer.rrVertexAttrib;
    var rrRenderState = framework.referencerenderer.rrRenderState;
    var sglrReferenceUtils = framework.opengl.simplereference.sglrReferenceUtils;
    var sglrShaderProgram = framework.opengl.simplereference.sglrShaderProgram;
var tcuMatrix = framework.common.tcuMatrix;
var tcuMatrixUtil = framework.common.tcuMatrixUtil;

    sglrReferenceContext.rrMPBA = rrMultisamplePixelBufferAccess;

    sglrReferenceContext.GLU_EXPECT_NO_ERROR = function(error, message) {
        if (error !== gl.NONE) {
            console.log('Assertion failed message:' + message);
            // throw new Error(message);
        }
    };

    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    // /* TODO: remove */
    // /** @type {WebGL2RenderingContext} */ var gl;

    sglrReferenceContext.MAX_TEXTURE_SIZE_LOG2 = 14;
    sglrReferenceContext.MAX_TEXTURE_SIZE = 1<<sglrReferenceContext.MAX_TEXTURE_SIZE_LOG2;

    sglrReferenceContext.getNumMipLevels2D = function(width, height) {
        return Math.floor(Math.log2(Math.max(width, height))+1);
    };

    sglrReferenceContext.getMipLevelSize = function(baseLevelSize, levelNdx) {
        return Math.max(baseLevelSize >> levelNdx, 1);
    };

    sglrReferenceContext.isMipmapFilter = function(/*const tcu::Sampler::FilterMode*/ mode) {
        return mode != tcuTexture.FilterMode.NEAREST && mode != tcuTexture.FilterMode.LINEAR;
    };

    sglrReferenceContext.getFixedRestartIndex = function(indexType) {
        switch (indexType) {
            case rrDefs.IndexType.INDEXTYPE_UINT8: return 0xFF;
            case rrDefs.IndexType.INDEXTYPE_UINT16: return 0xFFFF;
            case rrDefs.IndexType.INDEXTYPE_UINT32: return 0xFFFFFFFF;
            default:
                throw new Error('Unrecognized index type: ' + indexType);
            }
    };

    /* TODO: This belongs to refrast. Where to move it? */
    /**
    * @constructor
    * @param {number=} a
    * @param {number=} b
    * @param {number=} c
    * @param {number=} d
    */
    sglrReferenceContext.GenericVec4 = function(a, b, c, d) {
        this.data = [a || 0, b || 0, c || 0, d || 0];
    };

    /**
    * @constructor
    * @param {sglrShaderProgram.ShaderProgram} program
    */
    sglrReferenceContext.ShaderProgramObjectContainer = function(program) {
        this.m_program = program;
        /** @type {boolean} */ this.m_deleteFlag = false;
    };

    /**
    * @constructor
    */
    sglrReferenceContext.ReferenceContextLimits = function(gl) {
        this.maxTextureImageUnits = 16;
        this.maxTexture2DSize = 2048;
        this.maxTextureCubeSize = 2048;
        this.maxTexture2DArrayLayers = 256;
        this.maxTexture3DSize = 256;
        this.maxRenderbufferSize = 2048;
        this.maxVertexAttribs = 16;

        if (gl) {
            this.maxTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
            this.maxTexture2DSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            this.maxTextureCubeSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
            this.maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
            this.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
            this.maxTexture2DArrayLayers = gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS);
            this.maxTexture3DSize = gl.getParameter(gl.MAX_3D_TEXTURE_SIZE);

            // Limit texture sizes to supported values
            this.maxTexture2DSize = Math.min(this.maxTexture2DSize, sglrReferenceContext.MAX_TEXTURE_SIZE);
            this.maxTextureCubeSize = Math.min(this.maxTextureCubeSize, sglrReferenceContext.MAX_TEXTURE_SIZE);
            this.maxTexture3DSize = Math.min(this.maxTexture3DSize, sglrReferenceContext.MAX_TEXTURE_SIZE);

            sglrReferenceContext.GLU_EXPECT_NO_ERROR(gl.getError(), gl.NO_ERROR);
        }

        /* TODO: Port
        // \todo [pyry] Figure out following things:
        // + supported fbo configurations
        // ...

        // \todo [2013-08-01 pyry] Do we want to make these conditional based on renderCtx?
        addExtension("gl.EXT_color_buffer_half_float");
        addExtension("gl.EXT_color_buffer_float");
        */
    };

    // /**
    //  * @constructor
    //  */
    // var NamedObject = function(name) {
    //     this.m_name = name;
    //     this.m_refCount = 1;
    // };

    // NamedObject.prototype.getName = function() { return this.m_name; };
    // NamedObject.prototype.getRefCount = function() { return this.m_refCount; };
    // NamedObject.prototype.incRefCount = function() { this.m_refCount += 1; };
    // NamedObject.prototype.decRefCount = function() {
    //     if (this.m_refCount == 0)
    //         throw new Error("Refcount is already 0");
    //     this.m_refCount -= 1;
    // };

    /**
    * @enum
    */
    sglrReferenceContext.TextureType = {
        TYPE_2D: 0,
        TYPE_CUBE_MAP: 1,
        TYPE_2D_ARRAY: 2,
        TYPE_3D: 3,
        TYPE_CUBE_MAP_ARRAY: 4
    };

    /**
    * @constructor
 * @implements {rrDefs.Sampler}
    * @param {sglrReferenceContext.TextureType} type
    */
    sglrReferenceContext.Texture = function(type) {
        // NamedObject.call(this, name);
        this.m_type = type;
        this.m_immutable = false;
        this.m_baseLevel = 0;
        this.m_maxLevel = 1000;
        this.m_sampler = new tcuTexture.Sampler(tcuTexture.WrapMode.REPEAT_GL,
                                                tcuTexture.WrapMode.REPEAT_GL,
                                                tcuTexture.WrapMode.REPEAT_GL,
                                                tcuTexture.FilterMode.NEAREST_MIPMAP_LINEAR,
                                                tcuTexture.FilterMode.LINEAR,
                                                0,
                                                true,
                                                tcuTexture.CompareMode.COMPAREMODE_NONE,
                                                0,
                                                [0, 0, 0, 0],
                                                true);
    };
sglrReferenceContext.Texture.prototype.sample = function(pos, lod) {throw new Error('Intentionally empty. Call method from child class instead'); };
sglrReferenceContext.Texture.prototype.sample4 = function(packetTexcoords, lodBias) {throw new Error('Intentionally empty. Call method from child class instead'); };

    // sglrReferenceContext.Texture.prototype = Object.create(NamedObject.prototype);
    // sglrReferenceContext.Texture.prototype.constructor = sglrReferenceContext.Texture;

    sglrReferenceContext.Texture.prototype.getType = function() { return this.m_type; };
    sglrReferenceContext.Texture.prototype.getBaseLevel = function() { return this.m_baseLevel; };
    sglrReferenceContext.Texture.prototype.getMaxLevel = function() { return this.m_maxLevel; };
    sglrReferenceContext.Texture.prototype.isImmutable = function() { return this.m_immutable; };
    sglrReferenceContext.Texture.prototype.setBaseLevel = function(baseLevel) { this.m_baseLevel = baseLevel; };
    sglrReferenceContext.Texture.prototype.setMaxLevel = function(maxLevel) { this.m_maxLevel = maxLevel; };
    sglrReferenceContext.Texture.prototype.setImmutable = function() { this.m_immutable = true; };

    sglrReferenceContext.Texture.prototype.getSampler = function() { return this.m_sampler; };

    /**
    * @constructor
    */
    sglrReferenceContext.TextureLevelArray = function() {
        this.m_data = [];
        this.m_access = [];
    };

    sglrReferenceContext.TextureLevelArray.prototype.hasLevel = function(level) { return this.m_data[level] != null; };
    sglrReferenceContext.TextureLevelArray.prototype.getLevel = function(level) {
        if (!this.hasLevel(level))
            throw new Error("Level: " + level + " is not defined.");

        return this.m_access[level];
    };

    sglrReferenceContext.TextureLevelArray.prototype.getLevels = function() { return this.m_access; };

    sglrReferenceContext.TextureLevelArray.prototype.allocLevel = function(level, format, width, height, depth) {
        var dataSize = format.getPixelSize()*width*height*depth;
        if (this.hasLevel(level))
            this.clearLevel(level);

        this.m_data[level] = new ArrayBuffer(dataSize);
        this.m_access[level] = new tcuTexture.PixelBufferAccess({
            format: format,
            width: width,
            height: height,
            depth: depth,
            data: this.m_data[level]});
    };

    sglrReferenceContext.TextureLevelArray.prototype.clearLevel = function(level) {
        delete this.m_data[level];
        delete this.m_access[level];
    };

    sglrReferenceContext.TextureLevelArray.prototype.clear = function() {
        for (var key in this.m_data)
            delete this.m_data[key];

        for (var key in this.m_access)
            delete this.m_access[key];
    };

    /**
    * @constructor
    * @extends {sglrReferenceContext.Texture}
    */
    sglrReferenceContext.Texture2D = function() {
        sglrReferenceContext.Texture.call(this, sglrReferenceContext.TextureType.TYPE_2D);
        this.m_view = new tcuTexture.Texture2DView(0, null);
        this.m_levels = new sglrReferenceContext.TextureLevelArray();
    };

    sglrReferenceContext.Texture2D.prototype = Object.create(sglrReferenceContext.Texture.prototype);
    sglrReferenceContext.Texture2D.prototype.constructor = sglrReferenceContext.Texture2D;

    sglrReferenceContext.Texture2D.prototype.clearLevels = function() { this.m_levels.clear(); };
    sglrReferenceContext.Texture2D.prototype.hasLevel = function(level) { return this.m_levels.hasLevel(level); };
    sglrReferenceContext.Texture2D.prototype.getLevel = function(level) { return this.m_levels.getLevel(level); };
    sglrReferenceContext.Texture2D.prototype.allocLevel = function(level, format, width, height) { this.m_levels.allocLevel(level, format, width, height, 1); };
    sglrReferenceContext.Texture2D.prototype.isComplete = function() {
        var baseLevel = this.getBaseLevel();

        if (this.hasLevel(baseLevel)) {
            var level0 = this.getLevel(baseLevel);
            /** @type {boolean} */ var mipmap = sglrReferenceContext.isMipmapFilter(this.getSampler().minFilter);

            if (mipmap) {
                var format = level0.getFormat();
                var w = level0.getWidth();
                var h = level0.getHeight();
                var numLevels = Math.min(this.getMaxLevel()-baseLevel+1, sglrReferenceContext.getNumMipLevels2D(w, h));

                for (var levelNdx = 1; levelNdx < numLevels; levelNdx++) {
                    if (this.hasLevel(baseLevel+levelNdx)) {
                        var level = this.getLevel(baseLevel+levelNdx);
                        var expectedW = sglrReferenceContext.getMipLevelSize(w, levelNdx);
                        var expectedH = sglrReferenceContext.getMipLevelSize(h, levelNdx);

                        if (level.getWidth() != expectedW ||
                            level.getHeight() != expectedH ||
                            level.getFormat() != format)
                            return false;
                    } else
                        return false;
                }
            }

            return true;
        } else
            return false;
    };

    sglrReferenceContext.Texture2D.prototype.updateView = function() {
        var baseLevel = this.getBaseLevel();

        if (this.hasLevel(baseLevel) && !this.getLevel(baseLevel).isEmpty()) {
            // Update number of levels in mipmap pyramid.
            var width = this.getLevel(baseLevel).getWidth();
            var height = this.getLevel(baseLevel).getHeight();
            var isMipmap = sglrReferenceContext.isMipmapFilter(this.getSampler().minFilter);
            var numLevels = isMipmap ? Math.min(this.getMaxLevel()-baseLevel+1, sglrReferenceContext.getNumMipLevels2D(width, height)) : 1;

            this.m_view = new tcuTexture.Texture2DView(numLevels, this.m_levels.getLevels().slice(baseLevel));
        } else
            this.m_view = new tcuTexture.Texture2DView(0, null);
    };

    sglrReferenceContext.Texture2D.prototype.sample = function(pos, lod) { return this.m_view.sample(this.getSampler(), pos, lod) };

    /**
    * @param {Array<Array<number>>} packetTexcoords 4 vec2 coordinates
    * @return {Array<Array<number>>} 4 vec4 samples
    */
    sglrReferenceContext.Texture2D.prototype.sample4 = function(packetTexcoords, lodBias_) {
        var lodBias = lodBias_ || 0;
        var texWidth = this.m_view.getWidth();
        var texHeight = this.m_view.getHeight();
        var output = [];

        var dFdx0 = deMath.subtract(packetTexcoords[1], packetTexcoords[0]);
        var dFdx1 = deMath.subtract(packetTexcoords[3], packetTexcoords[2]);
        var dFdy0 = deMath.subtract(packetTexcoords[2], packetTexcoords[0]);
        var dFdy1 = deMath.subtract(packetTexcoords[3], packetTexcoords[1]);

        for (var fragNdx = 0; fragNdx < 4; ++fragNdx) {
            var dFdx = (fragNdx & 2) ? dFdx1 : dFdx0;
            var dFdy = (fragNdx & 1) ? dFdy1 : dFdy0;

            var mu = Math.max(Math.abs(dFdx[0]), Math.abs(dFdy[0]));
            var mv = Math.max(Math.abs(dFdx[1]), Math.abs(dFdy[1]));
            var p = Math.max(mu * texWidth, mv * texHeight);

            var lod = Math.log2(p) + lodBias;

            output.push(this.sample(packetTexcoords[fragNdx][0], packetTexcoords[fragNdx][1], lod));
        }

        return output;
    };

    /**
    * A container object for storing one of texture types;
    * @constructor
    */
    sglrReferenceContext.TextureContainer = function() {
        this.texture = null;
        this.textureType = null;
    };

    sglrReferenceContext.TextureContainer.prototype.init = function(target) {
        switch(target) {
            case gl.TEXTURE_2D:
                this.texture = new sglrReferenceContext.Texture2D();
                this.textureType = sglrReferenceContext.TextureType.TYPE_2D;
                break;
            /* TODO: Implement other types */
            // case gl.TEXTURE_CUBE_MAP:
            //     his.textureType = sglrReferenceContext.TextureType.TYPE_CUBE_MAP;
            //     break;
            // case gl.TEXTURE_2D_ARRAY:
            //     this.textureType = sglrReferenceContext.TextureType.TYPE_2D_ARRAY;
            //     break;
            // case gl.TEXTURE_3D:
            //     this.textureType = sglrReferenceContext.TextureType.TYPE_3D;
            //     break;
            // case gl.TEXTURE_CUBE_MAP_ARRAY:
            //     this.textureType = sglrReferenceContext.TextureType.TYPE_CUBE_MAP_ARRAY;
            //     break;
            default: throw new Error("Unrecognized target: " + target);
        };
    };

    /**
    * @enum
    */
    sglrReferenceContext.AttachmentPoint = {
        ATTACHMENTPOINT_COLOR0: 0,
        ATTACHMENTPOINT_DEPTH: 1,
        ATTACHMENTPOINT_STENCIL: 2
    };

    sglrReferenceContext.mapGLAttachmentPoint = function(attachment) {
        switch (attachment) {
            case gl.COLOR_ATTACHMENT0: return sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_COLOR0;
            case gl.DEPTH_ATTACHMENT: return sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_DEPTH;
            case gl.STENCIL_ATTACHMENT: return sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_STENCIL;
            default: throw new Error('Wrong attachment point:' + attachment);
        }
    };

    /**
    * @enum
    */
    sglrReferenceContext.AttachmentType = {
        ATTACHMENTTYPE_RENDERBUFFER: 0,
        ATTACHMENTTYPE_TEXTURE: 1
    };

    /**
    * @enum
    */
    sglrReferenceContext.TexTarget = {
        TEXTARGET_2D: 0,
        TEXTARGET_CUBE_MAP_POSITIVE_X: 1,
        TEXTARGET_CUBE_MAP_POSITIVE_Y: 2,
        TEXTARGET_CUBE_MAP_POSITIVE_Z: 3,
        TEXTARGET_CUBE_MAP_NEGATIVE_X: 4,
        TEXTARGET_CUBE_MAP_NEGATIVE_Y: 5,
        TEXTARGET_CUBE_MAP_NEGATIVE_Z: 6,
        TEXTARGET_2D_ARRAY: 7,
        TEXTARGET_3D: 8,
        TEXTARGET_CUBE_MAP_ARRAY: 9
    };

    /**
    * @param {sglrReferenceContext.TexTarget} target
    * @return {?tcuTexture.CubeFace}
    */
    sglrReferenceContext.texTargetToFace = function(target) {
        switch (target) {
            case sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_NEGATIVE_X: return tcuTexture.CubeFace.CUBEFACE_NEGATIVE_X;
            case sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_POSITIVE_X: return tcuTexture.CubeFace.CUBEFACE_POSITIVE_X;
            case sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_NEGATIVE_Y: return tcuTexture.CubeFace.CUBEFACE_NEGATIVE_Y;
            case sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_POSITIVE_Y: return tcuTexture.CubeFace.CUBEFACE_POSITIVE_Y;
            case sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_NEGATIVE_Z: return tcuTexture.CubeFace.CUBEFACE_NEGATIVE_Z;
            case sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_POSITIVE_Z: return tcuTexture.CubeFace.CUBEFACE_POSITIVE_Z;
            default: return null;
        }
    };

    sglrReferenceContext.mapGLFboTexTarget = function(target) {
        switch (target) {
            case gl.TEXTURE_2D: return sglrReferenceContext.TexTarget.TEXTARGET_2D;
            case gl.TEXTURE_CUBE_MAP_POSITIVE_X: return sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_POSITIVE_X;
            case gl.TEXTURE_CUBE_MAP_POSITIVE_Y: return sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_POSITIVE_Y;
            case gl.TEXTURE_CUBE_MAP_POSITIVE_Z: return sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_POSITIVE_Z;
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_X: return sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_NEGATIVE_X;
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_Y: return sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_NEGATIVE_Y;
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_Z: return sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_NEGATIVE_Z;
            default: throw new Error('Wrong texture target:' + target);
        }
    };

    /**
    * @constructor
    */
    sglrReferenceContext.Attachment = function() {
        /** @type {?sglrReferenceContext.AttachmentType} */ this.type = null;
        this.object = null;
        /** @type {?sglrReferenceContext.TexTarget} */ this.texTarget = null;
        this.level = 0;
        this.layer = 0;
    };

    /**
    * @constructor
    */
    sglrReferenceContext.Framebuffer = function() {
        this.m_attachments = [];
        for (var key in sglrReferenceContext.AttachmentPoint)
            this.m_attachments[sglrReferenceContext.AttachmentPoint[key]] = new sglrReferenceContext.Attachment();
    };

    /**
    * @param {sglrReferenceContext.AttachmentPoint} point
    * @return {sglrReferenceContext.Attachment}
    */
    sglrReferenceContext.Framebuffer.prototype.getAttachment = function(point) { return this.m_attachments[point]; };

    /**
    * @param {sglrReferenceContext.AttachmentPoint} point
    * @param {sglrReferenceContext.Attachment} attachment
    */
    sglrReferenceContext.Framebuffer.prototype.setAttachment = function(point, attachment) { this.m_attachments[point] = attachment; };

    // /**
    //  * @enum
    //  */
    // var Format = {
    //     FORMAT_DEPTH_COMPONENT16: 0,
    //     FORMAT_RGBA4: 1,
    //     FORMAT_RGB5_A1: 2,
    //     FORMAT_RGB565: 3,
    //     FORMAT_STENCIL_INDEX8: 4
    // };

    /**
    * @constructor
    */
    sglrReferenceContext.Renderbuffer = function() {
        /** @type {tcuTexture.TextureLevel} */ this.m_data;
    };

    /**
    * @param {tcuTexture.TextureFormat} format
    */
    sglrReferenceContext.Renderbuffer.prototype.setStorage = function(format, width, height) {
        this.m_data = new tcuTexture.TextureLevel(format, width, height);
    };
    sglrReferenceContext.Renderbuffer.prototype.getWidth = function() { return this.m_data.getWidth(); };
    sglrReferenceContext.Renderbuffer.prototype.getHeight = function() { return this.m_data.getHeight(); };
    sglrReferenceContext.Renderbuffer.prototype.getFormat = function() { return this.m_data.getFormat(); };
    sglrReferenceContext.Renderbuffer.prototype.getAccess = function() { return this.m_data.getAccess(); };

    /**
    * @constructor
    */
    sglrReferenceContext.VertexArray = function(maxVertexAttribs) {
        /** @constructor */
        var VertexAttribArray = function() {
            this.enabled = false;
            this.size = 4;
            this.stride = 0;
            this.type = gl.FLOAT;

            this.normalized = false;
            this.integer = false;
            this.divisor = 0;
            this.offset = 0;
            this.bufferBinding = null;
        };

        this.m_elementArrayBufferBinding = null;

        this.m_arrays = [];
        for (var i = 0; i < maxVertexAttribs; i++)
            this.m_arrays.push(new VertexAttribArray());
    };

    /**
    * @constructor
    */
    sglrReferenceContext.DataBuffer = function() {
        /** @type {ArrayBuffer|null} */ this.m_data = null;
    };

    sglrReferenceContext.DataBuffer.prototype.setStorage = function(size) {this.m_data = new ArrayBuffer(size); };
    sglrReferenceContext.DataBuffer.prototype.getSize = function() {
        var size = 0;
        if (this.m_data)
            size = this.m_data.byteLength;
        return size;
    };
    sglrReferenceContext.DataBuffer.prototype.getData = function() { return this.m_data; };

    sglrReferenceContext.DataBuffer.prototype.setData = function(data) {
        var buffer;
        var offset = 0;
        var byteLength = data.byteLength;
        if (data instanceof ArrayBuffer)
            buffer = data;
        else {
            buffer = data.buffer;
            offset = data.byteOffset;
        }

        if (!buffer)
            throw new Error("Invalid buffer");

        this.m_data = buffer.slice(offset, offset + byteLength);
    };

    sglrReferenceContext.DataBuffer.prototype.setSubData = function(offset, data) {
        var buffer;
        var srcOffset = 0;
        var byteLength = data.byteLength;
        if (data instanceof ArrayBuffer)
            buffer = data;
        else {
            buffer = data.buffer;
            srcOffset = data.byteOffset;
        }

        if (!buffer)
            throw new Error("Invalid buffer");

        var src = new Uint8Array(buffer, srcOffset, byteLength);
        var dst = new Uint8Array(this.m_data, offset, byteLength);
        dst.set(src);
    };

    // /**
    //  * @constructor
    //  */
    // var ObjectManager = function() {
    //     this.m_objects = {};
    // };

    // ObjectManager.prototype.insert = function(obj) {
    //     var name = obj.getName();
    //     if (!name)
    //         throw new Error("Cannot insert unnamed object");
    //     this.m_objects[name] = obj;
    // };

    // ObjectManager.prototype.find = function(name) { return this.m_objects[name]; };

    // ObjectManager.prototype.acquireReference = function(obj) {
    //     if (this.find(obj.getName()) !== obj)
    //         throw new Error("Object is not in the object manager");
    //     obj.incRefCount();
    // };

    // ObjectManager.prototype.releaseReference = function(obj) {
    //     if (this.find(obj.getName()) !== obj)
    //         throw new Error("Object is not in the object manager");

    //     obj.decRefCount();

    //     if (obj.getRefCount() == 0)
    //         delete this.m_objects[obj.getName()];
    // };

    // ObjectManager.prototype.getAll = function() { return this.m_objects; };

    /**
    * @constructor
    */
    sglrReferenceContext.TextureUnit = function() {
        this.tex2DBinding = null;
        this.texCubeBinding = null;
        this.tex2DArrayBinding = null;
        this.tex3DBinding = null;
        this.texCubeArrayBinding = null;
        this.default2DTex = 0;
        this.defaultCubeTex = 0;
        this.default2DArrayTex = 0;
        this.default3DTex = 0;
        this.defaultCubeArrayTex = 0;
    };

    /**
    * @constructor
    */
    sglrReferenceContext.StencilState = function() {
        this.func = gl.ALWAYS;
        this.ref = 0;
        this.opMask = ~0;
        this.opStencilFail = gl.KEEP;
        this.opDepthFail = gl.KEEP;
        this.opDepthPass = gl.KEEP;
        this.writeMask = ~0;
    };

    /**
    * @param {tcuPixelFormat.PixelFormat} pixelFmt
    * @return {tcuTexture.TextureFormat}
    */
    sglrReferenceContext.toTextureFormat = function(pixelFmt) {
        if (pixelFmt.equals(8,8,8,8))
            return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_INT8);
        else if (pixelFmt.equals(8,8,8,0))
            return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGB, tcuTexture.ChannelType.UNORM_INT8);
        else if (pixelFmt.equals(4,4,4,4))
            return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_SHORT_4444);
        else if (pixelFmt.equals(5,5,5,1))
            return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_SHORT_5551);
        else if (pixelFmt.equals(5,6,5,0))
            return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGB, tcuTexture.ChannelType.UNORM_SHORT_565);

        throw new Error("Could not map pixel format:" + pixelFmt);
    };

    sglrReferenceContext.getDepthFormat = function(depthBits) {
        switch (depthBits) {
            case 8: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.D, tcuTexture.ChannelType.UNORM_INT8);
            case 16: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.D, tcuTexture.ChannelType.UNORM_INT16);
            case 24: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.D, tcuTexture.ChannelType.UNSIGNED_INT_24_8);
            case 32: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.D, tcuTexture.ChannelType.FLOAT);
            default:
                throw new Error("Can't map depth buffer format, bits: " + depthBits);
        }
    };

    sglrReferenceContext.getStencilFormat = function(stencilBits) {
        switch (stencilBits) {
            case 8: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.S, tcuTexture.ChannelType.UNSIGNED_INT8);
            case 16: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.S, tcuTexture.ChannelType.UNSIGNED_INT16);
            case 24: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.S, tcuTexture.ChannelType.UNSIGNED_INT_24_8);
            case 32: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.S, tcuTexture.ChannelType.UNSIGNED_INT32);
            default:
                throw new Error("Can't map stencil buffer format, bits: " + stencilBits);
        }
    };

    /**
    * @constructor
    * @param {tcuPixelFormat.PixelFormat} colorBits
    */
    sglrReferenceContext.ReferenceContextBuffers = function(colorBits, depthBits, stencilBits, width, height, samples_) {
        var samples = samples_;
        if (typeof samples_ == 'undefined')
            samples = 1;
        this.m_colorbuffer = new tcuTexture.TextureLevel(sglrReferenceContext.toTextureFormat(colorBits), samples, width, height);

        if (depthBits > 0)
            this.m_depthbuffer = new tcuTexture.TextureLevel(sglrReferenceContext.getDepthFormat(depthBits), samples, width, height);

        if (stencilBits > 0)
            this.m_stencilbuffer = new tcuTexture.TextureLevel(sglrReferenceContext.getStencilFormat(stencilBits), samples, width, height);
    };

    sglrReferenceContext.ReferenceContextBuffers.prototype.getColorbuffer = function() { return rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess.fromMultisampleAccess(this.m_colorbuffer.getAccess()); }
    sglrReferenceContext.ReferenceContextBuffers.prototype.getDepthbuffer = function() { return this.m_depthbuffer !== undefined ? rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess.fromMultisampleAccess(this.m_depthbuffer.getAccess()) : null; }
    sglrReferenceContext.ReferenceContextBuffers.prototype.getStencilbuffer = function() { return this.m_stencilbuffer !== undefined ? rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess.fromMultisampleAccess(this.m_stencilbuffer.getAccess()) : null; }

    /**
    * @param {sglrReferenceContext.ReferenceContextLimits} limits
    * @param {rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess} colorbuffer
    * @param {rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess} depthbuffer
    * @param {rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess} stencilbuffer
    * @constructor
    */
    sglrReferenceContext.ReferenceContext = function(limits, colorbuffer, depthbuffer, stencilbuffer) {
        this.m_limits = limits;
        this.m_defaultColorbuffer = colorbuffer;
        this.m_defaultDepthbuffer = depthbuffer;
        this.m_defaultStencilbuffer = stencilbuffer;
        this.m_viewport = [0, 0, colorbuffer.raw().getHeight(), colorbuffer.raw().getWidth()];
        this.m_textureUnits = [];
        for (var i = 0; i < this.m_limits.maxTextureImageUnits; i++)
            this.m_textureUnits.push(new sglrReferenceContext.TextureUnit());
        this.m_lastError = gl.NO_ERROR;
        // this.m_textures = new ObjectManager();
        this.m_pixelUnpackRowLength = 0;
        this.m_pixelUnpackSkipRows = 0;
        this.m_pixelUnpackSkipPixels = 0;
        this.m_pixelUnpackImageHeight = 0;
        this.m_pixelUnpackSkipImages = 0;
        this.m_pixelUnpackAlignment = 4;
        this.m_pixelPackAlignment = 4;
        this.m_clearColor = [0, 0, 0, 0];
        this.m_clearDepth = 1;
        this.m_clearStencil = 0;
        this.m_scissorBox = this.m_viewport;
        this.m_blendEnabled = false;
        this.m_scissorEnabled = false;
        this.m_depthTestEnabled = false;
        this.m_stencilTestEnabled = false;
        this.m_polygonOffsetFillEnabled = false;
        this.m_primitiveRestartFixedIndex = true; //always on
        this.m_primitiveRestartSettableIndex = true; //always on
        this.m_stencil = [];
        for (var type in rrDefs.FaceType)
            this.m_stencil[rrDefs.FaceType[type]] = new sglrReferenceContext.StencilState();
        this.m_depthFunc = gl.LESS;
        this.m_depthRangeNear = 0;
        this.m_depthRangeFar = 1;
        this.m_polygonOffsetFactor = 0;
        this.m_polygonOffsetUnits = 0;
        this.m_blendModeRGB = gl.FUNC_ADD;
        this.m_blendModeAlpha = gl.FUNC_ADD;
        this.m_blendFactorSrcRGB = gl.ONE;
        this.m_blendFactorDstRGB = gl.ZERO;
        this.m_blendFactorSrcAlpha = gl.ONE;
        this.m_blendFactorDstAlpha = gl.ZERO;
        this.m_blendColor = [0, 0, 0, 0];
        this.m_colorMask = [true, true, true, true];
        this.m_depthMask = true;
        this.m_defaultVAO = new sglrReferenceContext.VertexArray(this.m_limits.maxVertexAttribs);
        this.m_vertexArrayBinding = this.m_defaultVAO;
        this.m_arrayBufferBinding = null;
        this.m_copyReadBufferBinding = null;
        this.m_copyWriteBufferBinding = null;
        this.m_drawIndirectBufferBinding = null;
        this.m_pixelPackBufferBinding = null;
        this.m_pixelUnpackBufferBinding = null;
        this.m_transformFeedbackBufferBinding = null;
        this.m_uniformBufferBinding = null;
        this.m_readFramebufferBinding = null;
        this.m_drawFramebufferBinding = null;
        this.m_renderbufferBinding = null;
        this.m_programs = [];
        this.m_currentProgram = null;
        this.m_currentAttribs = [];
        for (var i = 0; i < this.m_limits.maxVertexAttribs; i++)
            this.m_currentAttribs.push(new sglrReferenceContext.GenericVec4());
        this.m_lineWidth = 1;

        this.m_emptyTex2D = new sglrReferenceContext.TextureContainer();
        this.m_emptyTex2D.init(gl.TEXTURE_2D);
        this.m_emptyTex2D.texture.getSampler().wrapS = tcuTexture.WrapMode.CLAMP_TO_EDGE;
        this.m_emptyTex2D.texture.getSampler().wrapT = tcuTexture.WrapMode.CLAMP_TO_EDGE;
        this.m_emptyTex2D.texture.getSampler().minFilter = tcuTexture.FilterMode.NEAREST;
        this.m_emptyTex2D.texture.getSampler().magFilter = tcuTexture.FilterMode.NEAREST;
        this.m_emptyTex2D.texture.allocLevel(0, new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_INT8), 1, 1);
        this.m_emptyTex2D.texture.getLevel(0).setPixel([0, 0, 0, 1], 0, 0);
        this.m_emptyTex2D.texture.updateView();

        /** @type {sglrReferenceContext.TextureType} */ this.m_type;

        /** @type {boolean} */ this.m_immutable;

        /** @type {tcuTexture.Sampler} */ this.m_sampler;
        /** @type {number} */ this.m_baseLevel;
        /** @type {number} */ this.m_maxLevel;
    };

    sglrReferenceContext.ReferenceContext.prototype.getWidth = function() { return this.m_defaultColorbuffer.raw().getHeight(); };
    sglrReferenceContext.ReferenceContext.prototype.getHeight = function() { return this.m_defaultColorbuffer.raw().getDepth(); };
    sglrReferenceContext.ReferenceContext.prototype.viewport = function(x, y, width, height) { this.m_viewport = [x, y, width, height]; };
    sglrReferenceContext.ReferenceContext.prototype.activeTexture = function(texture) {
        if (deMath.deInBounds32(texture, gl.TEXTURE0, gl.TEXTURE0 + this.m_textureUnits.length))
            this.m_activeTexture = texture - gl.TEXTURE0;
        else
            this.setError(gl.INVALID_ENUM);
    };

    sglrReferenceContext.ReferenceContext.prototype.setError = function(error) {
        if (this.m_lastError == gl.NO_ERROR)
            this.m_lastError = error;
    };

    /**
    * @return {number} error
    */
    sglrReferenceContext.ReferenceContext.prototype.getError = function() {
        var err = this.m_lastError;
        this.m_lastError = gl.NO_ERROR;
        return err;
    };

    sglrReferenceContext.ReferenceContext.prototype.condtionalSetError = function(condition, error) {
        if (condition)
            this.setError(error)
        return condition;
    };

    /**
    * @param {sglrReferenceContext.TextureContainer} texture
    */
    sglrReferenceContext.ReferenceContext.prototype.bindTexture = function(target, texture) {
        var unitNdx = this.m_activeTexture;

        if (this.condtionalSetError((target != gl.TEXTURE_2D &&
                    target != gl.TEXTURE_CUBE_MAP &&
                    target != gl.TEXTURE_2D_ARRAY &&
                    target != gl.TEXTURE_3D), // &&
                    // target != gl.TEXTURE_CUBE_MAP_ARRAY),
                    gl.INVALID_ENUM))
            return;

        if (!texture) {
            // Clear binding.
            switch (target) {
                case gl.TEXTURE_2D: this.setTex2DBinding (unitNdx, null); break;
                //TODO: Implement - case gl.TEXTURE_CUBE_MAP: this.setTexCubeBinding (unitNdx, null); break;
                //TODO: Implement - case gl.TEXTURE_2D_ARRAY: this.setTex2DArrayBinding (unitNdx, null); break;
                //TODO: Implement - case gl.TEXTURE_3D: this.setTex3DBinding (unitNdx, null); break;
                default:
                    throw new Error("Unrecognized target: " + target);
            }
        } else {
            if (!texture.textureType) {
                texture.init(target);
            } else {
                // Validate type.
                var expectedType;
                switch(target) {
                    case gl.TEXTURE_2D: expectedType = sglrReferenceContext.TextureType.TYPE_2D; break;
                    case gl.TEXTURE_CUBE_MAP: expectedType = sglrReferenceContext.TextureType.TYPE_CUBE_MAP; break;
                    case gl.TEXTURE_2D_ARRAY: expectedType = sglrReferenceContext.TextureType.TYPE_2D_ARRAY; break;
                    case gl.TEXTURE_3D: expectedType = sglrReferenceContext.TextureType.TYPE_3D; break;
                    default: throw new Error("Unrecognized target: " + target);
                };
                if (this.condtionalSetError((texture.textureType != expectedType), gl.INVALID_OPERATION))
                    return;
            }
            switch (target) {
                case gl.TEXTURE_2D: this.setTex2DBinding (unitNdx, texture); break;
                //TODO: Implement - case gl.TEXTURE_CUBE_MAP: this.setTexCubeBinding (unitNdx, texture); break;
                //TODO: Implement - case gl.TEXTURE_2D_ARRAY: this.setTex2DArrayBinding (unitNdx, texture); break;
                //TODO: Implement - case gl.TEXTURE_3D: this.setTex3DBinding (unitNdx, texture); break;
                default:
                    throw new Error("Unrecognized target: " + target);
            }
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.setTex2DBinding = function(unitNdx, texture) {
        if (this.m_textureUnits[unitNdx].tex2DBinding) {
            // this.m_textures.releaseReference(this.m_textureUnits[unitNdx].tex2DBinding);
            this.m_textureUnits[unitNdx].tex2DBinding = null;
        }

        if (texture) {
            // this.m_textures.acquireReference(texture);
            this.m_textureUnits[unitNdx].tex2DBinding = texture;
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.createTexture = function() { return new sglrReferenceContext.TextureContainer(); };

    sglrReferenceContext.ReferenceContext.prototype.bindFramebuffer = function(target, fbo) {
        if (this.condtionalSetError((target != gl.FRAMEBUFFER &&
                    target != gl.DRAW_FRAMEBUFFER &&
                    target != gl.READ_FRAMEBUFFER), gl.INVALID_ENUM))
                    return;
        for (var ndx = 0; ndx < 2; ndx++) {
            var bindingTarget = ndx ? gl.DRAW_FRAMEBUFFER : gl.READ_FRAMEBUFFER;

            if (target != gl.FRAMEBUFFER && target != bindingTarget)
                continue; // Doesn't match this target.

            if (ndx)
                this.m_drawFramebufferBinding = fbo;
            else
                this.m_readFramebufferBinding = fbo;
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.createFramebuffer = function() { return new sglrReferenceContext.Framebuffer(); };

    sglrReferenceContext.ReferenceContext.prototype.bindRenderbuffer = function(target, rbo) {
        if (this.condtionalSetError(target != gl.RENDERBUFFER, gl.INVALID_ENUM))
            return;

        this.m_renderbufferBinding = rbo;
    };

    sglrReferenceContext.ReferenceContext.prototype.createRenderbuffer = function() { return new sglrReferenceContext.Renderbuffer(); };

    sglrReferenceContext.ReferenceContext.prototype.pixelStorei = function(pname, param) {
        switch (pname) {
            case gl.UNPACK_ALIGNMENT:
                if (this.condtionalSetError((param != 1 && param != 2 && param != 4 && param != 8), gl.INVALID_VALUE)) return;
                this.m_pixelUnpackAlignment = param;
                break;

            case gl.PACK_ALIGNMENT:
                if (this.condtionalSetError((param != 1 && param != 2 && param != 4 && param != 8), gl.INVALID_VALUE)) return;
                this.m_pixelPackAlignment = param;
                break;

            case gl.UNPACK_ROW_LENGTH:
                if (this.condtionalSetError(param < 0, gl.INVALID_VALUE)) return;
                this.m_pixelUnpackRowLength = param;
                break;

            case gl.UNPACK_SKIP_ROWS:
                if (this.condtionalSetError(param < 0, gl.INVALID_VALUE)) return;
                this.m_pixelUnpackSkipRows = param;
                break;

            case gl.UNPACK_SKIP_PIXELS:
                if (this.condtionalSetError(param < 0, gl.INVALID_VALUE)) return;
                this.m_pixelUnpackSkipPixels = param;
                break;

            case gl.UNPACK_IMAGE_HEIGHT:
                if (this.condtionalSetError(param < 0, gl.INVALID_VALUE)) return;
                this.m_pixelUnpackImageHeight = param;
                break;

            case gl.UNPACK_SKIP_IMAGES:
                if (this.condtionalSetError(param < 0, gl.INVALID_VALUE)) return;
                this.m_pixelUnpackSkipImages = param;
                break;

            default:
                this.setError(gl.INVALID_ENUM);
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.clearColor = function(red, green, blue, alpha) {
        this.m_clearColor = [deMath.clamp(red, 0, 1),
                            deMath.clamp(green, 0, 1),
                            deMath.clamp(blue, 0, 1),
                            deMath.clamp(alpha, 0, 1)];
    };

    sglrReferenceContext.ReferenceContext.prototype.clearDepthf = function(depth) {
        this.m_clearDepth = deMath.clamp(depth, 0, 1);
    }

    sglrReferenceContext.ReferenceContext.prototype.clearStencil = function(stencil) {
        this.m_clearStencil = stencil;
    };

    sglrReferenceContext.ReferenceContext.prototype.scissor = function(x, y, width, height) {
        if (this.condtionalSetError(width < 0 || height < 0, gl.INVALID_VALUE))
            return;
        this.m_scissorBox = [x, y, width, height];
    };

    sglrReferenceContext.ReferenceContext.prototype.enable = function(cap) {
        switch (cap) {
            case gl.BLEND: this.m_blendEnabled = true; break;
            case gl.SCISSOR_TEST: this.m_scissorEnabled = true; break;
            case gl.DEPTH_TEST: this.m_depthTestEnabled = true; break;
            case gl.STENCIL_TEST: this.m_stencilTestEnabled = true; break;
            case gl.POLYGON_OFFSET_FILL: this.m_polygonOffsetFillEnabled = true; break;

            case gl.DITHER:
                // Not implemented - just ignored.
                break;

            default:
                this.setError(gl.INVALID_ENUM);
                break;
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.disable = function(cap) {
        switch (cap) {
            case gl.BLEND: this.m_blendEnabled = false; break;
            case gl.SCISSOR_TEST: this.m_scissorEnabled = false; break;
            case gl.DEPTH_TEST: this.m_depthTestEnabled = false; break;
            case gl.STENCIL_TEST: this.m_stencilTestEnabled = false; break;
            case gl.POLYGON_OFFSET_FILL: this.m_polygonOffsetFillEnabled = false; break;

            case gl.DITHER:
                // Not implemented - just ignored.
                break;

            default:
                this.setError(gl.INVALID_ENUM);
                break;
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.stencilFunc = function(func, ref, mask) {
        this.stencilFuncSeparate(gl.FRONT_AND_BACK, func, ref, mask);
    }

    sglrReferenceContext.ReferenceContext.prototype.stencilFuncSeparate = function(face, func, ref, mask) {
        var setFront = face == gl.FRONT || face == gl.FRONT_AND_BACK;
        var setBack = face == gl.BACK || face == gl.FRONT_AND_BACK;

        if (this.condtionalSetError(!sglrReferenceContext.isValidCompareFunc(func), gl.INVALID_ENUM))
            return;
        if (this.condtionalSetError(!setFront && !setBack, gl.INVALID_ENUM))
            return;

        for (var type in rrDefs.FaceType) {
            if ((type == rrDefs.FaceType.FACETYPE_FRONT && setFront) ||
                (type == rrDefs.FaceType.FACETYPE_BACK && setBack)) {
                this.m_stencil[type].func = func;
                this.m_stencil[type].ref = ref;
                this.m_stencil[type].opMask = mask;
            }
        }
    };

    sglrReferenceContext.isValidCompareFunc = function(func) {
        switch (func) {
            case gl.NEVER:
            case gl.LESS:
            case gl.LEQUAL:
            case gl.GREATER:
            case gl.GEQUAL:
            case gl.EQUAL:
            case gl.NOTEQUAL:
            case gl.ALWAYS:
                return true;

            default:
                return false;
        }
    };

    sglrReferenceContext.isValidStencilOp = function(op) {
        switch (op) {
            case gl.KEEP:
            case gl.ZERO:
            case gl.REPLACE:
            case gl.INCR:
            case gl.INCR_WRAP:
            case gl.DECR:
            case gl.DECR_WRAP:
            case gl.INVERT:
                return true;

            default:
                return false;
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.stencilOp = function(sfail, dpfail, dppass) {
        this.stencilOpSeparate(gl.FRONT_AND_BACK, sfail, dpfail, dppass);
    }

    sglrReferenceContext.ReferenceContext.prototype.stencilOpSeparate = function(face, sfail, dpfail, dppass) {
        var setFront = face == gl.FRONT || face == gl.FRONT_AND_BACK;
        var setBack = face == gl.BACK || face == gl.FRONT_AND_BACK;

        if (this.condtionalSetError((!sglrReferenceContext.isValidStencilOp(sfail) ||
                    !sglrReferenceContext.isValidStencilOp(dpfail) ||
                    !sglrReferenceContext.isValidStencilOp(dppass)),
                    gl.INVALID_ENUM))
            return;

        if (this.condtionalSetError(!setFront && !setBack, gl.INVALID_ENUM))
            return;

    for (var type in rrDefs.FaceType) {
            if ((type == rrDefs.FaceType.FACETYPE_FRONT && setFront) ||
                (type == rrDefs.FaceType.FACETYPE_BACK && setBack)) {
                this.m_stencil[type].opStencilFail = sfail;
                this.m_stencil[type].opDepthFail = dpfail;
                this.m_stencil[type].opDepthPass = dppass;
            }
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.depthFunc = function(func) {
        if (this.condtionalSetError(!sglrReferenceContext.isValidCompareFunc(func), gl.INVALID_ENUM))
            return;
        this.m_depthFunc = func;
    };

    sglrReferenceContext.ReferenceContext.prototype.depthRange = function(n, f) {
        this.m_depthRangeNear = deMath.clamp(n, 0, 1);
        this.m_depthRangeFar = deMath.clamp(f, 0, 1);
    };

    sglrReferenceContext.ReferenceContext.prototype.polygonOffset = function(factor, units) {
        this.m_polygonOffsetFactor = factor;
        this.m_polygonOffsetUnits = units;
    };

    sglrReferenceContext.isValidBlendEquation = function(mode) {
        return mode == gl.FUNC_ADD ||
            mode == gl.FUNC_SUBTRACT ||
            mode == gl.FUNC_REVERSE_SUBTRACT ||
            mode == gl.MIN ||
            mode == gl.MAX;
    };

    sglrReferenceContext.isValidBlendFactor = function(factor) {
        switch (factor) {
            case gl.ZERO:
            case gl.ONE:
            case gl.SRC_COLOR:
            case gl.ONE_MINUS_SRC_COLOR:
            case gl.DST_COLOR:
            case gl.ONE_MINUS_DST_COLOR:
            case gl.SRC_ALPHA:
            case gl.ONE_MINUS_SRC_ALPHA:
            case gl.DST_ALPHA:
            case gl.ONE_MINUS_DST_ALPHA:
            case gl.CONSTANT_COLOR:
            case gl.ONE_MINUS_CONSTANT_COLOR:
            case gl.CONSTANT_ALPHA:
            case gl.ONE_MINUS_CONSTANT_ALPHA:
            case gl.SRC_ALPHA_SATURATE:
                return true;

            default:
                return false;
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.blendEquation = function(mode) {
        if (this.condtionalSetError(!sglrReferenceContext.isValidBlendEquation(mode), gl.INVALID_ENUM))
            return;
        this.m_blendModeRGB = mode;
        this.m_blendModeAlpha = mode;
    };

    sglrReferenceContext.ReferenceContext.prototype.blendEquationSeparate = function(modeRGB, modeAlpha) {
        if (this.condtionalSetError(!sglrReferenceContext.isValidBlendEquation(modeRGB) ||
                    !sglrReferenceContext.isValidBlendEquation(modeAlpha),
                    gl.INVALID_ENUM))
            return;

        this.m_blendModeRGB = modeRGB;
        this.m_blendModeAlpha = modeAlpha;
    };

    sglrReferenceContext.ReferenceContext.prototype.blendFunc = function(src, dst) {
        if (this.condtionalSetError(!sglrReferenceContext.isValidBlendFactor(src) ||
                    !sglrReferenceContext.isValidBlendFactor(dst),
                    gl.INVALID_ENUM))
            return;

        this.m_blendFactorSrcRGB = src;
        this.m_blendFactorSrcAlpha = src;
        this.m_blendFactorDstRGB = dst;
        this.m_blendFactorDstAlpha = dst;
    };

    sglrReferenceContext.ReferenceContext.prototype.blendFuncSeparate = function(srcRGB, dstRGB, srcAlpha, dstAlpha) {
        if (this.condtionalSetError(!sglrReferenceContext.isValidBlendFactor(srcRGB) ||
                    !sglrReferenceContext.isValidBlendFactor(dstRGB) ||
                    !sglrReferenceContext.isValidBlendFactor(srcAlpha) ||
                    !sglrReferenceContext.isValidBlendFactor(dstAlpha),
                    gl.INVALID_ENUM))
            return;

        this.m_blendFactorSrcRGB = srcRGB;
        this.m_blendFactorSrcAlpha = srcAlpha;
        this.m_blendFactorDstRGB = dstRGB;
        this.m_blendFactorDstAlpha = dstAlpha;
    };

    sglrReferenceContext.ReferenceContext.prototype.blendColor = function(red, green, blue, alpha) {
        this.m_blendColor = [deMath.clamp(red, 0, 1),
                            deMath.clamp(green, 0, 1),
                            deMath.clamp(blue, 0, 1),
                            deMath.clamp(alpha, 0, 1)];
    };

    sglrReferenceContext.ReferenceContext.prototype.colorMask = function(r, g, b, a) {
        this.m_colorMask = [r, g, b, a];
    };

    sglrReferenceContext.ReferenceContext.prototype.depthMask = function(mask) {
        this.m_depthMask = mask;
    };

    sglrReferenceContext.ReferenceContext.prototype.stencilMask = function(mask) {
        this.stencilMaskSeparate(gl.FRONT_AND_BACK, mask);
    };

    sglrReferenceContext.ReferenceContext.prototype.stencilMaskSeparate = function(face, mask) {
        var setFront = face == gl.FRONT || face == gl.FRONT_AND_BACK;
        var setBack = face == gl.BACK || face == gl.FRONT_AND_BACK;

        if (this.condtionalSetError(!setFront && !setBack, gl.INVALID_ENUM))
            return;

        if (setFront) this.m_stencil[rrDefs.FaceType.FACETYPE_FRONT].writeMask = mask;
        if (setBack) this.m_stencil[rrDefs.FaceType.FACETYPE_BACK].writeMask = mask;
    };

    sglrReferenceContext.ReferenceContext.prototype.bindVertexArray = function(array) {
        if (array)
            this.m_vertexArrayBinding = array;
        else
            this.m_vertexArrayBinding = this.m_defaultVAO;
    };

    sglrReferenceContext.ReferenceContext.prototype.createVertexArray = function() { return new sglrReferenceContext.VertexArray(this.m_limits.maxVertexAttribs); };
    sglrReferenceContext.ReferenceContext.prototype.deleteVertexArray = function() {};

    sglrReferenceContext.ReferenceContext.prototype.vertexAttribPointer = function(index, rawSize, type, normalized, stride, offset) {
        var allowBGRA = false;
        var effectiveSize = rawSize;

        if (this.condtionalSetError(index >= this.m_limits.maxVertexAttribs, gl.INVALID_VALUE))
            return;
        if (this.condtionalSetError(effectiveSize <= 0 || effectiveSize > 4, gl.INVALID_VALUE))
            return;
        if (this.condtionalSetError(type != gl.BYTE && type != gl.UNSIGNED_BYTE &&
                    type != gl.SHORT && type != gl.UNSIGNED_SHORT &&
                    type != gl.INT && type != gl.UNSIGNED_INT &&
                    type != gl.FLOAT && type != gl.HALF_FLOAT &&
                    type != gl.INT_2_10_10_10_REV && type != gl.UNSIGNED_INT_2_10_10_10_REV, gl.INVALID_ENUM))
            return;
        if (this.condtionalSetError(normalized != true && normalized != false, gl.INVALID_ENUM))
            return;
        if (this.condtionalSetError(stride < 0, gl.INVALID_VALUE))
            return;
        if (this.condtionalSetError((type == gl.INT_2_10_10_10_REV || type == gl.UNSIGNED_INT_2_10_10_10_REV) && effectiveSize != 4, gl.INVALID_OPERATION))
            return;
        if (this.condtionalSetError(this.m_vertexArrayBinding != null && this.m_arrayBufferBinding == null && offset != 0, gl.INVALID_OPERATION))
            return;

        var array = this.m_vertexArrayBinding.m_arrays[index];

        array.size = rawSize;
        array.stride = stride;
        array.type = type;
        array.normalized = normalized;
        array.integer = false;
        array.offset = offset;

        array.bufferBinding = this.m_arrayBufferBinding;
    };

    sglrReferenceContext.ReferenceContext.prototype.vertexAttribIPointer = function(index, size, type, stride, offset) {
        if (this.condtionalSetError(index >= this.m_limits.maxVertexAttribs, gl.INVALID_VALUE))
            return;
        if (this.condtionalSetError(size <= 0 || size > 4, gl.INVALID_VALUE))
            return;
        if (this.condtionalSetError(type != gl.BYTE && type != gl.UNSIGNED_BYTE &&
                    type != gl.SHORT && type != gl.UNSIGNED_SHORT &&
                    type != gl.INT && type != gl.UNSIGNED_INT, gl.INVALID_ENUM))
            return;
        if (this.condtionalSetError(stride < 0, gl.INVALID_VALUE))
            return;
        if (this.condtionalSetError(this.m_vertexArrayBinding != null && this.m_arrayBufferBinding == null && offset != 0, gl.INVALID_OPERATION))
            return;

        var array = this.m_vertexArrayBinding.m_arrays[index];

        array.size = size;
        array.stride = stride;
        array.type = type;
        array.normalized = false;
        array.integer = true;
        array.offset = offset;

        array.bufferBinding = this.m_arrayBufferBinding;
    };

    sglrReferenceContext.ReferenceContext.prototype.enableVertexAttribArray = function(index) {
        if (this.condtionalSetError(index >= this.m_limits.maxVertexAttribs, gl.INVALID_VALUE))
            return;

        this.m_vertexArrayBinding.m_arrays[index].enabled = true;
    };

    sglrReferenceContext.ReferenceContext.prototype.disableVertexAttribArray = function(index) {
        if (this.condtionalSetError(index >= this.m_limits.maxVertexAttribs, gl.INVALID_VALUE))
            return;

        this.m_vertexArrayBinding.m_arrays[index].enabled = false;
    };

    sglrReferenceContext.ReferenceContext.prototype.vertexAttribDivisor = function(index, divisor) {
        if (this.condtionalSetError(index >= this.m_limits.maxVertexAttribs, gl.INVALID_VALUE))
            return;

        this.m_vertexArrayBinding.m_arrays[index].divisor = divisor;
    };

    sglrReferenceContext.ReferenceContext.prototype.vertexAttrib1f = function(index, x) {
        if (this.condtionalSetError(index >= this.m_limits.maxVertexAttribs, gl.INVALID_VALUE))
            return;

        this.m_currentAttribs[index] = new sglrReferenceContext.GenericVec4(x, 0, 0, 1);
    };

    sglrReferenceContext.ReferenceContext.prototype.vertexAttrib2f = function(index, x, y) {
        if (this.condtionalSetError(index >= this.m_limits.maxVertexAttribs, gl.INVALID_VALUE))
            return;

        this.m_currentAttribs[index] = new sglrReferenceContext.GenericVec4(x, y, 0, 1);
    };

    sglrReferenceContext.ReferenceContext.prototype.vertexAttrib3f = function(index, x, y, z) {
        if (this.condtionalSetError(index >= this.m_limits.maxVertexAttribs, gl.INVALID_VALUE))
            return;

        this.m_currentAttribs[index] = new sglrReferenceContext.GenericVec4(x, y, z, 1);
    };
    sglrReferenceContext.ReferenceContext.prototype.vertexAttrib4f = function(index, x, y, z, w) {
        if (this.condtionalSetError(index >= this.m_limits.maxVertexAttribs, gl.INVALID_VALUE))
            return;

        this.m_currentAttribs[index] = new sglrReferenceContext.GenericVec4(x, y, z, w);
    };
    sglrReferenceContext.ReferenceContext.prototype.vertexAttribI4i = function(index, x, y, z, w) {
        if (this.condtionalSetError(index >= this.m_limits.maxVertexAttribs, gl.INVALID_VALUE))
            return;

        this.m_currentAttribs[index] = new sglrReferenceContext.GenericVec4(x, y, z, w);
    };
    sglrReferenceContext.ReferenceContext.prototype.vertexAttribI4ui = function(index, x, y, z, w) {
        if (this.condtionalSetError(index >= this.m_limits.maxVertexAttribs, gl.INVALID_VALUE))
            return;

        this.m_currentAttribs[index] = new sglrReferenceContext.GenericVec4(x, y, z, w);
    };

    sglrReferenceContext.ReferenceContext.prototype.getAttribLocation = function(program, name) {
        if (this.condtionalSetError(!(program >= 0), gl.INVALID_OPERATION))
            return -1;

        for (var i = 0; i < this.m_programs[program].m_attributeNames.length; i++)
            if (this.m_programs[program].m_attributeNames[i] === name)
                return i;

        return -1;
    };

    sglrReferenceContext.ReferenceContext.prototype.uniformValue = function(location, type, value) {
        if (this.condtionalSetError(!this.m_currentProgram, gl.INVALID_OPERATION))
            return;

        if (location === null)
            return;

        var uniform = this.m_currentProgram.m_uniforms[location];

        if (this.condtionalSetError(!uniform, gl.INVALID_OPERATION))
            return;
        if (this.condtionalSetError(uniform.type != type, gl.INVALID_OPERATION))
            return;
        /* TODO: Do we need to copy objects? */
        uniform.value = value;
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform1f = function(location, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.FLOAT, [x]);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform1fv = function(location, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.FLOAT, x);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform1i = function(location, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.INT, [x]);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform1iv = function(location, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.INT, x);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform2f = function(location, x, y) {
        return this.uniformValue(location, gluShaderUtil.DataType.FLOAT, [x, y]);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform2fv = function(location, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.FLOAT, x);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform2i = function(location, x, y) {
        return this.uniformValue(location, gluShaderUtil.DataType.INT, [x, y]);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform2iv = function(location, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.INT, x);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform3f = function(location, x, y, z) {
        return this.uniformValue(location, gluShaderUtil.DataType.FLOAT, [x, y, z]);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform3fv = function(location, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.FLOAT, x);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform3i = function(location, x, y, z) {
        return this.uniformValue(location, gluShaderUtil.DataType.INT, [x, y, z]);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform3iv = function(location, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.INT, x);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform4f = function(location, x, y, z, w) {
        return this.uniformValue(location, gluShaderUtil.DataType.FLOAT, [x, y, z, w]);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform4fv = function(location, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.FLOAT, x);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform4i = function(location, x, y, z, w) {
        return this.uniformValue(location, gluShaderUtil.DataType.INT, [x, y, z, w]);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniform4iv = function(location, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.INT, x);
    };

    /** transpose matrix 'x' of 'size' columns and rows */
    sglrReferenceContext.trans = function(size, x) {
        var result = [];
        for (var row = 0; row < size; ++row)
            for (var col = 0; col < size; ++col)
            result[row*size+col] = x[col*size+row];

        return result;
    };

    sglrReferenceContext.ReferenceContext.prototype.uniformMatrix2fv = function(location, transpose, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.FLOAT, transpose ? sglrReferenceContext.trans(2, x) : x);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniformMatrix3fv = function(location, transpose, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.FLOAT, transpose ? sglrReferenceContext.trans(3, x) : x);
    };

    sglrReferenceContext.ReferenceContext.prototype.uniformMatrix4fv = function(location, transpose, x) {
        return this.uniformValue(location, gluShaderUtil.DataType.FLOAT, transpose ? sglrReferenceContext.trans(4, x) : x);
    };

    sglrReferenceContext.ReferenceContext.prototype.getUniformLocation = function(program, name) {
        if (this.condtionalSetError(!(program >= 0), gl.INVALID_OPERATION))
            return -1;

        for (var i = 0; i < this.m_programs[program].m_uniforms.length; i++)
            if (this.m_programs[program].m_uniforms[i].name === name)
                return i;

        return -1;
    };

    sglrReferenceContext.ReferenceContext.prototype.lineWidth = function(w) {
        if (this.condtionalSetError(w < 0, gl.INVALID_VALUE))
            return;
        this.m_lineWidth = w;
    };

    sglrReferenceContext.isValidBufferTarget = function(target) {
        switch (target) {
            case gl.ARRAY_BUFFER:
            case gl.COPY_READ_BUFFER:
            case gl.COPY_WRITE_BUFFER:
            case gl.ELEMENT_ARRAY_BUFFER:
            case gl.PIXEL_PACK_BUFFER:
            case gl.PIXEL_UNPACK_BUFFER:
            case gl.TRANSFORM_FEEDBACK_BUFFER:
            case gl.UNIFORM_BUFFER:
                return true;

            default:
                return false;
        }
    }

    sglrReferenceContext.ReferenceContext.prototype.setBufferBinding = function(target, buffer) {
        switch (target) {
            case gl.ARRAY_BUFFER: this.m_arrayBufferBinding = buffer; break
            case gl.COPY_READ_BUFFER: this.m_copyReadBufferBinding = buffer; break
            case gl.COPY_WRITE_BUFFER: this.m_copyWriteBufferBinding = buffer; break
            case gl.ELEMENT_ARRAY_BUFFER: this.m_vertexArrayBinding.m_elementArrayBufferBinding = buffer; break
            case gl.PIXEL_PACK_BUFFER: this.m_pixelPackBufferBinding = buffer; break
            case gl.PIXEL_UNPACK_BUFFER: this.m_pixelUnpackBufferBinding = buffer; break
            case gl.TRANSFORM_FEEDBACK_BUFFER: this.m_transformFeedbackBufferBinding = buffer; break
            case gl.UNIFORM_BUFFER: this.m_uniformBufferBinding = buffer; break
            default:
                throw new Error("Unrecognized target: " + target);
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.getBufferBinding = function(target) {
        switch (target) {
            case gl.ARRAY_BUFFER: return this.m_arrayBufferBinding;
            case gl.COPY_READ_BUFFER: return this.m_copyReadBufferBinding;
            case gl.COPY_WRITE_BUFFER: return this.m_copyWriteBufferBinding;
            case gl.ELEMENT_ARRAY_BUFFER: return this.m_vertexArrayBinding.m_elementArrayBufferBinding;
            case gl.PIXEL_PACK_BUFFER: return this.m_pixelPackBufferBinding;
            case gl.PIXEL_UNPACK_BUFFER: return this.m_pixelUnpackBufferBinding;
            case gl.TRANSFORM_FEEDBACK_BUFFER: return this.m_transformFeedbackBufferBinding;
            case gl.UNIFORM_BUFFER: return this.m_uniformBufferBinding;
            default:
                throw new Error("Unrecognized target: " + target);
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.bindBuffer = function(target, buffer) {
        if (this.condtionalSetError(!sglrReferenceContext.isValidBufferTarget(target), gl.INVALID_ENUM))
            return;

        this.setBufferBinding(target, buffer);
    };

    sglrReferenceContext.ReferenceContext.prototype.createBuffer = function() { return new sglrReferenceContext.DataBuffer(); };

    sglrReferenceContext.ReferenceContext.prototype.bufferData = function(target, input, usage) {
        if (this.condtionalSetError(!sglrReferenceContext.isValidBufferTarget(target), gl.INVALID_ENUM))
            return;
        var buffer = this.getBufferBinding(target);
        if (this.condtionalSetError(!buffer, gl.INVALID_OPERATION))
            return;

        if (typeof input == 'number') {
            if (this.condtionalSetError(input < 0, gl.INVALID_VALUE))
                return;
            buffer.setStorage(input);
        } else {
            buffer.setData(input);
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.bufferSubData = function(target, offset, data) {
        if (this.condtionalSetError(!sglrReferenceContext.isValidBufferTarget(target), gl.INVALID_ENUM))
            return;
        if (this.condtionalSetError(offset < 0, gl.INVALID_VALUE))
            return;
        var buffer = this.getBufferBinding(target);
        if (this.condtionalSetError(!buffer, gl.INVALID_OPERATION))
            return;

        if (this.condtionalSetError(offset + data.byteLength > buffer.getSize(), gl.INVALID_VALUE))
            return;
        buffer.setSubData(offset, data);
    };

    sglrReferenceContext.ReferenceContext.prototype.readPixels = function(x, y, width, height, format, type, pixels) {
        var src = this.getReadColorbuffer();

        // Map transfer format.
        var transferFmt = gluTextureUtil.mapGLTransferFormat(format, type);

        // Clamp input values
        var copyX = deMath.clamp(x, 0, src.raw().getHeight());
        var copyY = deMath.clamp(y, 0, src.raw().getDepth());
        var copyWidth = deMath.clamp(width, 0, src.raw().getHeight()-x);
        var copyHeight = deMath.clamp(height, 0, src.raw().getDepth()-y);

        var data;
        var offset;
        if (this.m_pixelPackBufferBinding) {
            if (this.condtionalSetError(typeof pixels !== 'number', gl.INVALID_VALUE))
                return;
            data = this.m_pixelPackBufferBinding.getData();
            offset = pixels;
        } else {
            if (pixels instanceof ArrayBuffer) {
                data = pixels;
                offset = 0;
            } else {
                data = pixels.buffer;
                offset = pixels.byteOffset;
            }
        }

        var dst = new tcuTexture.PixelBufferAccess({
            format: transferFmt,
            width: width,
            height: height,
            depth: 1,
            rowPitch: deMath.deAlign32(width*transferFmt.getPixelSize(), this.m_pixelPackAlignment),
            slicePitch: 0,
            data: data,
            offset: offset});

        src = src.getSubregion([copyX, copyY, copyWidth, copyHeight]);
        src.resolveMultisampleColorBuffer(tcuTextureUtil.getSubregion(dst, 0, 0, 0, copyWidth, copyHeight, 1));
    };

    sglrReferenceContext.ReferenceContext.prototype.getType = function() {
        return this.m_type;
    };

    sglrReferenceContext.nullAccess = function() {
        return new tcuTexture.PixelBufferAccess({
            width: 0,
            height: 0});
    };

    sglrReferenceContext.ReferenceContext.prototype.getFboAttachment = function(framebuffer, point) {
        var attachment = framebuffer.getAttachment(point);

        switch (attachment.type) {
            case sglrReferenceContext.AttachmentType.ATTACHMENTTYPE_TEXTURE: {
                var texture = attachment.object;

                if (texture.getType() == sglrReferenceContext.TextureType.TYPE_2D)
                    return texture.getLevel(attachment.level);
                else if (texture.getType() == sglrReferenceContext.TextureType.TYPE_CUBE_MAP)
                    return texture.getFace(attachment.level, sglrReferenceContext.texTargetToFace(attachment.texTarget));
                else if (texture.getType() == sglrReferenceContext.TextureType.TYPE_2D_ARRAY ||
                        texture.getType() == sglrReferenceContext.TextureType.TYPE_3D ||
                        texture.getType() == sglrReferenceContext.TextureType.TYPE_CUBE_MAP_ARRAY) {
                    var level = texture.getLevel(attachment.level);

                    return new tcuTexture.PixelBufferAccess({
                        format: level.getFormat(),
                        width: level.getWidth(),
                        height: level.getHeight(),
                        depth: 1,
                        rowPitch: level.getRowPitch(),
                        slicePitch: 0,
                        data: level.getDataPtr(),
                        offset: level.getSlicePitch() * attachment.layer});
                } else
                    return sglrReferenceContext.nullAccess();
            }

            case sglrReferenceContext.AttachmentType.ATTACHMENTTYPE_RENDERBUFFER: {
                var rbo = attachment.object;
                return rbo.getAccess();
            }

            default:
                return sglrReferenceContext.nullAccess();
        }
    }

    sglrReferenceContext.ReferenceContext.prototype.getReadColorbuffer = function() {
        if (this.m_readFramebufferBinding)
            return rrMultisamplePixelBufferAccess.fromSinglesampleAccess(this.getFboAttachment(this.m_readFramebufferBinding, sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_COLOR0));
        else
            return this.m_defaultColorbuffer;
    };

    // sglrReferenceContext.ReferenceContext.prototype.drawArrays = function(mode, first, count) {
    //     this.drawArraysInstanced(mode, first, count, 1);
    // };

    sglrReferenceContext.ReferenceContext.prototype.checkFramebufferStatus = function(target) {
        if (this.condtionalSetError(target != gl.FRAMEBUFFER &&
                    target != gl.DRAW_FRAMEBUFFER &&
                    target != gl.READ_FRAMEBUFFER, gl.INVALID_ENUM))
            return 0;

        // Select binding point.
        var framebufferBinding = (target == gl.FRAMEBUFFER || target == gl.DRAW_FRAMEBUFFER) ? this.m_drawFramebufferBinding : this.m_readFramebufferBinding;

        // Default framebuffer is always complete.
        if (!framebufferBinding)
            return gl.FRAMEBUFFER_COMPLETE;

        var width = -1;
        var height = -1;
        var hasAttachment = false;
        var attachmentComplete = true;
        var dimensionsOk = true;

        for (var key in sglrReferenceContext.AttachmentPoint) {
            var point = sglrReferenceContext.AttachmentPoint[key];
            var attachment = framebufferBinding.getAttachment(point);
            var attachmentWidth = 0;
            var attachmentHeight = 0;
            var attachmentFormat;

            if (attachment.type == sglrReferenceContext.AttachmentType.ATTACHMENTTYPE_TEXTURE) {
                /** @type {sglrReferenceContext.TextureContainer} */ var container = attachment.object;
                var level;

                if (attachment.texTarget == sglrReferenceContext.TexTarget.TEXTARGET_2D) {
                    DE_ASSERT(container.textureType == sglrReferenceContext.TextureType.TYPE_2D);
                    var tex2D = container.texture;

                    if (tex2D.hasLevel(attachment.level))
                        level = tex2D.getLevel(attachment.level);
                } else if (deMath.deInRange32(attachment.texTarget, sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_POSITIVE_X,
                                                        sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_NEGATIVE_Z)) {
                    DE_ASSERT(container.textureType == sglrReferenceContext.TextureType.TYPE_CUBE_MAP);

                    var texCube = container.texture;
                    var face = sglrReferenceContext.texTargetToFace(attachment.texTarget);

                    if (texCube.hasFace(attachment.level, face))
                        level = texCube.getFace(attachment.level, face);
                } else if (attachment.texTarget == sglrReferenceContext.TexTarget.TEXTARGET_2D_ARRAY) {
                    DE_ASSERT(container.textureType == sglrReferenceContext.TextureType.TYPE_2D_ARRAY);
                    var tex2DArr = container.texture;

                    if (tex2DArr.hasLevel(attachment.level))
                        level = tex2DArr.getLevel(attachment.level); // \note Slice doesn't matter here.
                } else if (attachment.texTarget == sglrReferenceContext.TexTarget.TEXTARGET_3D) {
                    DE_ASSERT(container.textureType == sglrReferenceContext.TextureType.TYPE_3D);
                    var tex3D = container.texture;

                    if (tex3D.hasLevel(attachment.level))
                        level = tex3D.getLevel(attachment.level); // \note Slice doesn't matter here.
                } else if (attachment.texTarget == sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_ARRAY) {
                    DE_ASSERT(container.textureType == sglrReferenceContext.TextureType.TYPE_CUBE_MAP_ARRAY);
                    var texCubeArr = container.texture;

                    if (texCubeArr.hasLevel(attachment.level))
                        level = texCubeArr.getLevel(attachment.level); // \note Slice doesn't matter here.
                } else
                    throw new Error("sglrReferenceContext.Framebuffer attached to a texture but no valid target specified");

                attachmentWidth = level.getWidth();
                attachmentHeight = level.getHeight();
                attachmentFormat = level.getFormat();
            } else if (attachment.type == sglrReferenceContext.AttachmentType.ATTACHMENTTYPE_RENDERBUFFER) {
                var renderbuffer =attachment.object;

                attachmentWidth = renderbuffer.getWidth();
                attachmentHeight = renderbuffer.getHeight();
                attachmentFormat = renderbuffer.getFormat();
            } else
                continue; // Skip rest of checks.

            if (!hasAttachment && attachmentWidth > 0 && attachmentHeight > 0) {
                width = attachmentWidth;
                height = attachmentHeight;
                hasAttachment = true;
            } else if (attachmentWidth != width || attachmentHeight != height)
                dimensionsOk = false;

            // Validate attachment point compatibility.
            switch (attachmentFormat.order) {
                case tcuTexture.ChannelOrder.R:
                case tcuTexture.ChannelOrder.RG:
                case tcuTexture.ChannelOrder.RGB:
                case tcuTexture.ChannelOrder.RGBA:
                case tcuTexture.ChannelOrder.sRGB:
                case tcuTexture.ChannelOrder.sRGBA:
                    if (point != sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_COLOR0)
                        attachmentComplete = false;
                    break;

                case tcuTexture.ChannelOrder.D:
                    if (point != sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_DEPTH)
                        attachmentComplete = false;
                    break;

                case tcuTexture.ChannelOrder.S:
                    if (point != sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_STENCIL)
                        attachmentComplete = false;
                    break;

                case tcuTexture.ChannelOrder.DS:
                    if (point != sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_DEPTH &&
                        point != sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_STENCIL)
                        attachmentComplete = false;
                    break;

                default:
                    throw new Error("Unsupported attachment channel order:" + attachmentFormat.order);
            }
        }

        if (!attachmentComplete)
            return gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT;
        else if (!hasAttachment)
            return gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT;
        else if (!dimensionsOk)
            return gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS;
        else
            return gl.FRAMEBUFFER_COMPLETE;
    };

    sglrReferenceContext.ReferenceContext.prototype.predrawErrorChecks = function(mode) {
        if (this.condtionalSetError(mode != gl.POINTS &&
                    mode != gl.LINE_STRIP && mode != gl.LINE_LOOP && mode != gl.LINES &&
                    mode != gl.TRIANGLE_STRIP && mode != gl.TRIANGLE_FAN && mode != gl.TRIANGLES,
                    gl.INVALID_ENUM))
            return false;

        // \todo [jarkko] Uncomment following code when the buffer mapping support is added
        //for (size_t ndx = 0; ndx < vao.m_arrays.length; ++ndx)
        //  if (vao.m_arrays[ndx].enabled && vao.m_arrays[ndx].bufferBinding && vao.m_arrays[ndx].bufferBinding->isMapped)
        //      RC_ERROR_RET(gl.INVALID_OPERATION, RC_RET_VOID);

        if (this.condtionalSetError(this.checkFramebufferStatus(gl.DRAW_FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE, gl.INVALID_FRAMEBUFFER_OPERATION))
            return false;

        return true;
    };

    // sglrReferenceContext.ReferenceContext.prototype.drawArraysInstanced = function(mode, first, count, instanceCount) {
    //     if (this.condtionalSetError(first < 0 || count < 0 || instanceCount < 0, gl.INVALID_VALUE))
    //         return;

    //     if (!this.predrawErrorChecks(mode))
    //         return;

    //     // All is ok
    //     var primitiveType = sglrReferenceUtils.mapGLPrimitiveType(mode);

    //     this.drawWithReference(new rrRenderer.PrimitiveList(primitiveType, count, first), instanceCount);
    // };

    // sglrReferenceContext.ReferenceContext.prototype.drawElements = function(mode, count, type, offset) {
    //     this.drawElementsInstanced(mode, count, type, offset, 1);
    // };

    // sglrReferenceContext.ReferenceContext.prototype.drawElementsInstanced = function(mode, count, type, offset, instanceCount) {
    //     this.drawElementsInstancedBaseVertex(mode, count, type, offset, instanceCount, 0);
    // }

    // sglrReferenceContext.ReferenceContext.prototype.drawElementsInstancedBaseVertex = function(mode, count, type, offset, instanceCount, baseVertex) {
    //     var vao = this.m_vertexArrayBinding;

    //     if (this.condtionalSetError(type != gl.UNSIGNED_BYTE &&
    //                 type != gl.UNSIGNED_SHORT &&
    //                 type != gl.UNSIGNED_INT, gl.INVALID_ENUM))
    //         return;
    //     if (this.condtionalSetError(count < 0 || instanceCount < 0, gl.INVALID_VALUE))
    //         return;

    //     if (!this.predrawErrorChecks(mode))
    //         return;

    //     if (this.condtionalSetError(count >0 && !vao.m_elementArrayBufferBinding, gl.INVALID_OPERATION))
    //         return;
    //     // All is ok
    //     var primitiveType = sglrReferenceUtils.mapGLPrimitiveType(mode);
    //     var data = vao.m_elementArrayBufferBinding.getData();
    //     var indices = new rrRenderer.DrawIndices(data, sglrReferenceUtils.mapGLIndexType(type), baseVertex);

    //     this.drawWithReference(new rrRenderer.PrimitiveList(primitiveType, count, indices), instanceCount);
    // };

    /**
    * @param {rrMultisampleConstPixelBufferAccess.MultisampleConstPixelBufferAccess} access
    * @return {Array<number>}
    */
    sglrReferenceContext.getBufferRect = function(access) { return [0, 0, access.raw().getHeight(), access.raw().getDepth()]; };

    sglrReferenceContext.ReferenceContext.prototype.getDrawColorbuffer = function() {
        if (this.m_drawFramebufferBinding)
            return rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess.fromSinglesampleAccess(this.getFboAttachment(this.m_drawFramebufferBinding, sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_COLOR0));
        return this.m_defaultColorbuffer;
    };

    sglrReferenceContext.ReferenceContext.prototype.getDrawDepthbuffer = function() {
        if (this.m_drawFramebufferBinding)
            return rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess.fromSinglesampleAccess(this.getFboAttachment(this.m_drawFramebufferBinding, sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_DEPTH));
        return this.m_defaultDepthbuffer;
    };

    sglrReferenceContext.ReferenceContext.prototype.getDrawStencilbuffer = function() {
        if (this.m_drawFramebufferBinding)
            return rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess.fromSinglesampleAccess(this.getFboAttachment(this.m_drawFramebufferBinding, sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_STENCIL));
        return this.m_defaultStencilbuffer;
    };

    sglrReferenceContext.ReferenceContext.prototype.getReadColorbuffer = function() {
        if (this.m_readFramebufferBinding)
            return rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess.fromSinglesampleAccess(this.getFboAttachment(this.m_readFramebufferBinding, sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_COLOR0));
        return this.m_defaultColorbuffer;
    };

    sglrReferenceContext.ReferenceContext.prototype.getReadDepthbuffer = function() {
        if (this.m_readFramebufferBinding)
            return rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess.fromSinglesampleAccess(this.getFboAttachment(this.m_readFramebufferBinding, sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_DEPTH));
        return this.m_defaultDepthbuffer;
    };

    sglrReferenceContext.ReferenceContext.prototype.getReadStencilbuffer = function() {
        if (this.m_readFramebufferBinding)
            return rrMultisamplePixelBufferAccess.MultisamplePixelBufferAccess.fromSinglesampleAccess(this.getFboAttachment(this.m_readFramebufferBinding, sglrReferenceContext.AttachmentPoint.ATTACHMENTPOINT_STENCIL));
        return this.m_defaultStencilbuffer;
    };

    /**
    * @param {rrMultisampleConstPixelBufferAccess.MultisampleConstPixelBufferAccess} access
    */
    sglrReferenceContext.writeDepthOnly = function(access, s, x, y, depth) { access.raw().setPixDepth(depth, s, x, y); };

    /**
    * @param {rrMultisampleConstPixelBufferAccess.MultisampleConstPixelBufferAccess} access
    */
    sglrReferenceContext.writeStencilOnly = function(access, s, x, y, stencil, writeMask) {
        var oldVal = access.raw().getPixelInt(s, x, y)[3];
        access.raw().setPixStencil((oldVal & ~writeMask) | (stencil & writeMask), s, x, y);
    };

    sglrReferenceContext.maskStencil = function(bits, s) { return s & ((1<<bits)-1); };

    sglrReferenceContext.ReferenceContext.prototype.clear = function(buffers) {
        if (this.condtionalSetError((buffers & ~(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT)) != 0, gl.INVALID_VALUE))
            return;

        var colorBuf0 = this.getDrawColorbuffer();
        var depthBuf = this.getDrawDepthbuffer();
        var stencilBuf = this.getDrawStencilbuffer();
        var hasColor0 = colorBuf0 && !colorBuf0.isEmpty();
        var hasDepth = depthBuf && !depthBuf.isEmpty();
        var hasStencil = stencilBuf && !stencilBuf.isEmpty();
        var baseArea = this.m_scissorEnabled ? this.m_scissorBox : [0, 0, 0x7fffffff, 0x7fffffff];

        if (hasColor0 && (buffers & gl.COLOR_BUFFER_BIT) != 0) {
            var colorArea = deMath.intersect(baseArea, sglrReferenceContext.getBufferRect(colorBuf0));
            var access = colorBuf0.getSubregion(colorArea);
            var c = this.m_clearColor;
            var maskUsed = !this.m_colorMask[0] || !this.m_colorMask[1] || !this.m_colorMask[2] || !this.m_colorMask[3];
            var maskZero = !this.m_colorMask[0] && !this.m_colorMask[1] && !this.m_colorMask[2] && !this.m_colorMask[3];

            if (!maskUsed)
                access.clear(c);
            else if (!maskZero) {
                for (var y = 0; y < access.raw().getDepth(); y++)
                    for (var x = 0; x < access.raw().getHeight(); x++)
                        for (var s = 0; s < access.getNumSamples(); s++)
                            access.raw().setPixel(tcuTextureUtil.select(c, access.raw().getPixel(s, x, y), this.m_colorMask), s, x, y);
            }
            // else all channels masked out
        }

        if (hasDepth && (buffers & gl.DEPTH_BUFFER_BIT) != 0 && this.m_depthMask) {
            var depthArea = deMath.intersect(baseArea, sglrReferenceContext.getBufferRect(depthBuf));
            var access = depthBuf.getSubregion(depthArea);
            var isSharedDepthStencil = depthBuf.raw().getFormat().order != tcuTexture.ChannelOrder.D;

            if (isSharedDepthStencil) {
                // Slow path where stencil is masked out in write.
                for (var y = 0; y < access.raw().getDepth(); y++)
                    for (var x = 0; x < access.raw().getHeight(); x++)
                        for (var s = 0; s < access.getNumSamples(); s++)
                            sglrReferenceContext.writeDepthOnly(access, s, x, y, this.m_clearDepth);
            } else
                access.clear([this.m_clearDepth, 0, 0, 0]);
        }

        if (hasStencil && (buffers & gl.STENCIL_BUFFER_BIT) != 0) {
            var stencilArea = deMath.intersect(baseArea, sglrReferenceContext.getBufferRect(stencilBuf));
            var access = stencilBuf.getSubregion(stencilArea);
            var stencilBits = stencilBuf.raw().getFormat().getNumStencilBits();
            var stencil = sglrReferenceContext.maskStencil(stencilBits, this.m_clearStencil);
            var isSharedDepthStencil = stencilBuf.raw().getFormat().order != tcuTexture.ChannelOrder.S;

            if (isSharedDepthStencil || ((this.m_stencil[rrDefs.FaceType.FACETYPE_FRONT].writeMask & ((1<<stencilBits)-1)) != ((1<<stencilBits)-1))) {
                // Slow path where depth or stencil is masked out in write.
                for (var y = 0; y < access.raw().getDepth(); y++)
                    for (var x = 0; x < access.raw().getHeight(); x++)
                        for (var s = 0; s < access.getNumSamples(); s++)
                            sglrReferenceContext.writeStencilOnly(access, s, x, y, stencil, this.m_stencil[rrDefs.FaceType.FACETYPE_FRONT].writeMask);
            } else
                access.clear([0, 0, 0, stencil]);
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.clearBufferiv = function(buffer, drawbuffer, value) {
        if (this.condtionalSetError(buffer != gl.COLOR && buffer != gl.STENCIL, gl.INVALID_ENUM))
            return;
        if (this.condtionalSetError(drawbuffer != 0, gl.INVALID_VALUE))
            return;

        var baseArea = this.m_scissorEnabled ? this.m_scissorBox : [0, 0, 0x7fffffff, 0x7fffffff];

        if (buffer == gl.COLOR) {
            var colorBuf = this.getDrawColorbuffer();
            var maskUsed = !this.m_colorMask[0] || !this.m_colorMask[1] || !this.m_colorMask[2] || !this.m_colorMask[3];
            var maskZero = !this.m_colorMask[0] && !this.m_colorMask[1] && !this.m_colorMask[2] && !this.m_colorMask[3];

            if (!colorBuf.isEmpty() && !maskZero) {
            var colorArea = deMath.intersect(baseArea, sglrReferenceContext.getBufferRect(colorBuf));
            var access = colorBuf.getSubregion(colorArea);

                if (!maskUsed)
                    access.clear(value);
                else {
                for (var y = 0; y < access.raw().getDepth(); y++)
                    for (var x = 0; x < access.raw().getHeight(); x++)
                        for (var s = 0; s < access.getNumSamples(); s++)
                            access.raw().setPixel(tcuTextureUtil.select(value, access.raw().getPixel(s, x, y), this.m_colorMask), s, x, y);
                }
            }
        } else {
            if (buffer !== gl.STENCIL)
                throw new Error("Unexpected buffer type: " + buffer);

            var stencilBuf = this.getDrawStencilbuffer();

            if (!stencilBuf.isEmpty() && this.m_stencil[rrDefs.FaceType.FACETYPE_FRONT].writeMask != 0) {
                var area = deMath.intersect(baseArea, sglrReferenceContext.getBufferRect(stencilBuf));
                var access = stencilBuf.getSubregion(area);
                var stencil = value[0];

            for (var y = 0; y < access.raw().getDepth(); y++)
                    for (var x = 0; x < access.raw().getHeight(); x++)
                        for (var s = 0; s < access.getNumSamples(); s++)
                            sglrReferenceContext.writeStencilOnly(access, s, x, y, stencil, this.m_stencil[rrDefs.FaceType.FACETYPE_FRONT].writeMask);
            }
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.clearBufferfv = function(buffer, drawbuffer, value) {
        if (this.condtionalSetError(buffer != gl.COLOR && buffer != gl.DEPTH, gl.INVALID_ENUM))
            return;
        if (this.condtionalSetError(drawbuffer != 0, gl.INVALID_VALUE))
            return;

        var baseArea = this.m_scissorEnabled ? this.m_scissorBox : [0, 0, 0x7fffffff, 0x7fffffff];

        if (buffer == gl.COLOR) {
            var colorBuf = this.getDrawColorbuffer();
            var maskUsed = !this.m_colorMask[0] || !this.m_colorMask[1] || !this.m_colorMask[2] || !this.m_colorMask[3];
            var maskZero = !this.m_colorMask[0] && !this.m_colorMask[1] && !this.m_colorMask[2] && !this.m_colorMask[3];

            if (!colorBuf.isEmpty() && !maskZero) {
            var colorArea = deMath.intersect(baseArea, sglrReferenceContext.getBufferRect(colorBuf));
            var access = colorBuf.getSubregion(colorArea);

                if (!maskUsed)
                    access.clear(value);
                else {
                for (var y = 0; y < access.raw().getDepth(); y++)
                    for (var x = 0; x < access.raw().getHeight(); x++)
                        for (var s = 0; s < access.getNumSamples(); s++)
                            access.raw().setPixel(tcuTextureUtil.select(value, access.raw().getPixel(s, x, y), this.m_colorMask), s, x, y);
                }
            }
        } else {
        if (buffer !== gl.DEPTH)
                throw new Error("Unexpected buffer type: " + buffer);

            var depthBuf = this.getDrawDepthbuffer();

            if (!depthBuf.isEmpty() && this.m_depthMask) {
                var area = deMath.intersect(baseArea, sglrReferenceContext.getBufferRect(depthBuf));
                var access = depthBuf.getSubregion(area);
                var depth = value[0];

                for (var y = 0; y < access.raw().getDepth(); y++)
                    for (var x = 0; x < access.raw().getHeight(); x++)
                        for (var s = 0; s < access.getNumSamples(); s++)
                            sglrReferenceContext.writeDepthOnly(access, s, x, y, depth);
            }
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.clearBufferuiv = function(buffer, drawbuffer, value) {
        if (this.condtionalSetError(buffer != gl.COLOR, gl.INVALID_ENUM))
            return;
        if (this.condtionalSetError(drawbuffer != 0, gl.INVALID_VALUE))
            return;

        var baseArea = this.m_scissorEnabled ? this.m_scissorBox : [0, 0, 0x7fffffff, 0x7fffffff];

        var colorBuf = this.getDrawColorbuffer();
        var maskUsed = !this.m_colorMask[0] || !this.m_colorMask[1] || !this.m_colorMask[2] || !this.m_colorMask[3];
        var maskZero = !this.m_colorMask[0] && !this.m_colorMask[1] && !this.m_colorMask[2] && !this.m_colorMask[3];

        if (!colorBuf.isEmpty() && !maskZero) {
        var colorArea = deMath.intersect(baseArea, sglrReferenceContext.getBufferRect(colorBuf));
        var access = colorBuf.getSubregion(colorArea);

            if (!maskUsed)
                access.clear(value);
            else {
            for (var y = 0; y < access.raw().getDepth(); y++)
                for (var x = 0; x < access.raw().getHeight(); x++)
                    for (var s = 0; s < access.getNumSamples(); s++)
                        access.raw().setPixel(tcuTextureUtil.select(value, access.raw().getPixel(s, x, y), this.m_colorMask), s, x, y);
            }
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.clearBufferfi = function(buffer, drawbuffer, depth, stencil) {
        if (this.condtionalSetError(buffer != gl.DEPTH_STENCIL, gl.INVALID_ENUM))
            return;
        this.clearBufferfv(gl.DEPTH, drawbuffer, [depth]);
        this.clearBufferiv(gl.STENCIL, drawbuffer, [stencil]);
    };

    sglrReferenceContext.ReferenceContext.prototype.framebufferTexture2D = function(target, attachment, textarget, texture, level) {
        if (attachment == gl.DEPTH_STENCIL_ATTACHMENT) {
            // Attach to both depth and stencil.
            this.framebufferTexture2D(target, gl.DEPTH_ATTACHMENT, textarget, texture, level);
            this.framebufferTexture2D(target, gl.STENCIL_ATTACHMENT, textarget, texture, level);
        } else {
            var point = sglrReferenceContext.mapGLAttachmentPoint(attachment);
            var fboTexTarget = sglrReferenceContext.mapGLFboTexTarget(textarget);

            if (this.condtionalSetError(target != gl.FRAMEBUFFER &&
                        target != gl.DRAW_FRAMEBUFFER &&
                        target != gl.READ_FRAMEBUFFER, gl.INVALID_ENUM))
                return;
            if (this.condtionalSetError(point == undefined, gl.INVALID_ENUM))
                return;

            // Select binding point.
            var framebufferBinding = (target == gl.FRAMEBUFFER || target == gl.DRAW_FRAMEBUFFER) ? this.m_drawFramebufferBinding : this.m_readFramebufferBinding;
            if (this.condtionalSetError(!framebufferBinding, gl.INVALID_OPERATION))
                return;

            if (texture) {
                if (this.condtionalSetError(level != 0, gl.INVALID_VALUE))
                    return;

                if (texture.getType() == sglrReferenceContext.TextureType.TYPE_2D)
                    if (this.condtionalSetError(fboTexTarget != sglrReferenceContext.TexTarget.TEXTARGET_2D, gl.INVALID_OPERATION))
                        return;
                else {
                    if (texture.getType() == sglrReferenceContext.TextureType.TYPE_CUBE_MAP)
                        throw new Error("Unsupported texture type");
                    if (this.condtionalSetError(!deMath.deInRange32(fboTexTarget, sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_POSITIVE_X, sglrReferenceContext.TexTarget.TEXTARGET_CUBE_MAP_NEGATIVE_Z), gl.INVALID_OPERATION))
                        return;
                }
            }

            var fboAttachment = new sglrReferenceContext.Attachment();

            if (texture) {
                fboAttachment.type = sglrReferenceContext.AttachmentType.ATTACHMENTTYPE_TEXTURE;
                fboAttachment.object = texture
                fboAttachment.texTarget = fboTexTarget;
                fboAttachment.level = level;
            }
            framebufferBinding.setAttachment(point, fboAttachment);
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.framebufferRenderbuffer = function(target, attachment, renderbuffertarget, renderbuffer) {
        if (attachment == gl.DEPTH_STENCIL_ATTACHMENT) {
            // Attach both to depth and stencil.
            this.framebufferRenderbuffer(target, gl.DEPTH_ATTACHMENT, renderbuffertarget, renderbuffer);
            this.framebufferRenderbuffer(target, gl.STENCIL_ATTACHMENT, renderbuffertarget, renderbuffer);
        } else {
            var point = sglrReferenceContext.mapGLAttachmentPoint(attachment);

            if (this.condtionalSetError(target != gl.FRAMEBUFFER &&
                        target != gl.DRAW_FRAMEBUFFER &&
                        target != gl.READ_FRAMEBUFFER, gl.INVALID_ENUM))
                return;
            if (this.condtionalSetError(point == undefined, gl.INVALID_ENUM))
                return;

            // Select binding point.
            var framebufferBinding = (target == gl.FRAMEBUFFER || target == gl.DRAW_FRAMEBUFFER) ? this.m_drawFramebufferBinding : this.m_readFramebufferBinding;
            if (this.condtionalSetError(!framebufferBinding, gl.INVALID_OPERATION))
                return;

            if (renderbuffer) {
                if (this.condtionalSetError(renderbuffertarget != gl.RENDERBUFFER, gl.INVALID_ENUM))
                    return;
            }

            var fboAttachment = new sglrReferenceContext.Attachment();

            if (renderbuffer) {
                fboAttachment.type = sglrReferenceContext.AttachmentType.ATTACHMENTTYPE_RENDERBUFFER;
                fboAttachment.object = renderbuffer;
            }
            framebufferBinding.setAttachment(point, fboAttachment);
        }
    };

    sglrReferenceContext.ReferenceContext.prototype.renderbufferStorage = function(target, internalformat, width, height) {
        var format = gluTextureUtil.mapGLInternalFormat(internalformat);

        if (this.condtionalSetError(target != gl.RENDERBUFFER, gl.INVALID_ENUM))
            return;
        if (this.condtionalSetError(!this.m_renderbufferBinding, gl.INVALID_OPERATION))
            return;
        if (this.condtionalSetError(!deMath.deInRange32(width, 0, this.m_limits.maxRenderbufferSize) ||
                    !deMath.deInRange32(height, 0, this.m_limits.maxRenderbufferSize),
                    gl.INVALID_OPERATION))
            return;
        if (this.condtionalSetError(!format, gl.INVALID_ENUM))
            return;

        this.m_renderbufferBinding.setStorage(format, width, height);
    };

    /**
    * @param {rrRenderer.PrimitiveType} derivedType
    * @return {rrRenderer.PrimitiveType}
    */
    sglrReferenceContext.getPrimitiveBaseType = function(derivedType) {
        switch (derivedType) {
            case rrRenderer.PrimitiveType.TRIANGLES:
            case rrRenderer.PrimitiveType.TRIANGLE_STRIP:
            case rrRenderer.PrimitiveType.TRIANGLE_FAN:
                return rrRenderer.PrimitiveType.TRIANGLES;

            case rrRenderer.PrimitiveType.LINES:
            case rrRenderer.PrimitiveType.LINE_STRIP:
            case rrRenderer.PrimitiveType.LINE_LOOP:
                return rrRenderer.PrimitiveType.LINES;

            case rrRenderer.PrimitiveType.POINTS:
                return rrRenderer.PrimitiveType.POINTS;

            default:
                throw new Error('Unrecognized primitive type:' + derivedType);
        }
    };

    // sglrReferenceContext.ReferenceContext.prototype.drawWithReference = function(primitives, instanceCount) {
    //     // undefined results
    //     if (!this.m_currentProgram)
    //         return;

    //     var colorBuf0 = this.getDrawColorbuffer();
    //     var depthBuf = this.getDrawDepthbuffer();
    //     var stencilBuf = this.getDrawStencilbuffer();
    //     var hasStencil = stencilBuf && !stencilBuf.isEmpty();
    //     var stencilBits = (hasStencil) ? stencilBuf.raw().getFormat().getNumStencilBits() : (0);

    //     var renderTarget = new rrRenderer.RenderTarget(colorBuf0, depthBuf, stencilBuf);
    //     var program = this.m_currentProgram;
    //     var state = new rrRenderState.RenderState(colorBuf0);

    //     var vertexAttribs = [];

    //     // Gen state
    //     var baseType = sglrReferenceContext.getPrimitiveBaseType(primitives.getPrimitiveType());
    //     var polygonOffsetEnabled = (baseType == rrRenderer.PrimitiveType.TRIANGLES) ? (this.m_polygonOffsetFillEnabled) : (false);

    //     //state.cullMode = m_cullMode

    //     state.fragOps.scissorTestEnabled = this.m_scissorEnabled;
    //     state.fragOps.scissorRectangle = new rrRenderState.WindowRectangle(this.m_scissorBox[0], this.m_scissorBox[1], this.m_scissorBox[2], this.m_scissorBox[3]);

    //     state.fragOps.numStencilBits = stencilBits;
    //     state.fragOps.stencilTestEnabled = this.m_stencilTestEnabled;

    //     for (var key in rrDefs.FaceType) {
    //         var faceType = rrDefs.FaceType[key];
    //         state.fragOps.stencilStates[faceType].compMask = this.m_stencil[faceType].opMask;
    //         state.fragOps.stencilStates[faceType].writeMask = this.m_stencil[faceType].writeMask;
    //         state.fragOps.stencilStates[faceType].ref = this.m_stencil[faceType].ref;
    //         state.fragOps.stencilStates[faceType].func = sglrReferenceUtils.mapGLTestFunc(this.m_stencil[faceType].func);
    //         state.fragOps.stencilStates[faceType].sFail = sglrReferenceUtils.mapGLStencilOp(this.m_stencil[faceType].opStencilFail);
    //         state.fragOps.stencilStates[faceType].dpFail = sglrReferenceUtils.mapGLStencilOp(this.m_stencil[faceType].opDepthFail);
    //         state.fragOps.stencilStates[faceType].dpPass = sglrReferenceUtils.mapGLStencilOp(this.m_stencil[faceType].opDepthPass);
    //     }

    //     state.fragOps.depthTestEnabled = this.m_depthTestEnabled;
    //     state.fragOps.depthFunc = sglrReferenceUtils.mapGLTestFunc(this.m_depthFunc);
    //     state.fragOps.depthMask = this.m_depthMask;

    //     state.fragOps.blendMode = this.m_blendEnabled ? rrRenderState.BlendMode.STANDARD : rrRenderState.BlendMode.NONE;
    //     state.fragOps.blendRGBState.equation = sglrReferenceUtils.mapGLBlendEquation(this.m_blendModeRGB);
    //     state.fragOps.blendRGBState.srcFunc = sglrReferenceUtils.mapGLBlendFunc(this.m_blendFactorSrcRGB);
    //     state.fragOps.blendRGBState.dstFunc = sglrReferenceUtils.mapGLBlendFunc(this.m_blendFactorDstRGB);
    //     state.fragOps.blendAState.equation = sglrReferenceUtils.mapGLBlendEquation(this.m_blendModeAlpha);
    //     state.fragOps.blendAState.srcFunc = sglrReferenceUtils.mapGLBlendFunc(this.m_blendFactorSrcAlpha);
    //     state.fragOps.blendAState.dstFunc = sglrReferenceUtils.mapGLBlendFunc(this.m_blendFactorDstAlpha);
    //     state.fragOps.blendColor = this.m_blendColor;

    //     state.fragOps.colorMask = this.m_colorMask;

    //     state.viewport.rect = new rrRenderState.WindowRectangle(this.m_viewport);
    //     state.viewport.zn = this.m_depthRangeNear;
    //     state.viewport.zf = this.m_depthRangeFar;

    //     //state.point.pointSize = this.m_pointSize;
    //     state.line.lineWidth = this.m_lineWidth;

    //     state.fragOps.polygonOffsetEnabled = polygonOffsetEnabled;
    //     state.fragOps.polygonOffsetFactor = this.m_polygonOffsetFactor;
    //     state.fragOps.polygonOffsetUnits = this.m_polygonOffsetUnits;

    //     /* TODO: Check this logic */
    //     var indexType = primitives.getIndexType();

    //     if (this.m_primitiveRestartFixedIndex && indexType) {
    //         state.restart.enabled = true;
    //         state.restart.restartIndex = sglrReferenceContext.getFixedRestartIndex(indexType);
    //     } else {
    //         state.restart.enabled = false;
    //     }

    //     state.provokingVertexConvention = (this.m_provokingFirstVertexConvention) ? (rrDefs.ProvokingVertex.PROVOKINGVERTEX_FIRST) : (rrDefs.ProvokingVertex.PROVOKINGVERTEX_LAST);

    //     // gen attributes
    //     var vao = this.m_vertexArrayBinding;

    //     for (var ndx = 0; ndx < vao.m_arrays.length; ++ndx) {
    //         vertexAttribs[ndx] = new rrVertexAttrib.VertexAttrib();
    //         if (!vao.m_arrays[ndx].enabled) {
    //             vertexAttribs[ndx].type = rrVertexAttrib.VertexAttribType.DONT_CARE; // reading with wrong type is allowed, but results are undefined
    //             vertexAttribs[ndx].generic = this.m_currentAttribs[ndx];
    //         } else {
    //             vertexAttribs[ndx].type = (vao.m_arrays[ndx].integer) ?
    //                                                     (sglrReferenceUtils.mapGLPureIntegerVertexAttributeType(vao.m_arrays[ndx].type)) :
    //                                                     (sglrReferenceUtils.mapGLFloatVertexAttributeType(vao.m_arrays[ndx].type, vao.m_arrays[ndx].normalized, vao.m_arrays[ndx].size));
    //             vertexAttribs[ndx].size = sglrReferenceUtils.mapGLSize(vao.m_arrays[ndx].size);
    //             vertexAttribs[ndx].stride = vao.m_arrays[ndx].stride;
    //             vertexAttribs[ndx].instanceDivisor = vao.m_arrays[ndx].divisor;
    //             vertexAttribs[ndx].pointer = vao.m_arrays[ndx].bufferBinding.getData();
    //             vertexAttribs[ndx].offset = vao.m_arrays[ndx].offset;
    //         }
    //     }

    //     // Set shader samplers
    //     for (var uniformNdx = 0; uniformNdx < this.m_currentProgram.m_uniforms.length; ++uniformNdx) {
    //         var texNdx = this.m_currentProgram.m_uniforms[uniformNdx].value;

    //         switch (this.m_currentProgram.m_uniforms[uniformNdx].type) {
    //             case gluShaderUtil.DataType.SAMPLER_2D:
    //             case gluShaderUtil.DataType.UINT_SAMPLER_2D:
    //             case gluShaderUtil.DataType.INT_SAMPLER_2D: {
    //                 var tex = null;

    //                 if (texNdx >= 0 && texNdx < this.m_textureUnits.length)
    //                     tex = (this.m_textureUnits[texNdx].tex2DBinding) ? (this.m_textureUnits[texNdx].tex2DBinding) : (this.m_textureUnits[texNdx].default2DTex);

    //                 if (tex && tex.isComplete()) {
    //                     tex.updateView();
    //                     this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex2D = tex;
    //                 } else
    //                     this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex2D = this.m_emptyTex2D;

    //                 break;
    //             }
    //             /* TODO: Port
    //             case gluShaderUtil.DataType.SAMPLER_CUBE:
    //             case gluShaderUtil.DataType.UINT_SAMPLER_CUBE:
    //             case gluShaderUtil.DataType.INT_SAMPLER_CUBE: {
    //                 rc::TextureCube* tex = DE_NULL;

    //                 if (texNdx >= 0 && (size_t)texNdx < this.m_textureUnits.length)
    //                     tex = (this.m_textureUnits[texNdx].texCubeBinding) ? (this.m_textureUnits[texNdx].texCubeBinding) : (&this.m_textureUnits[texNdx].defaultCubeTex);

    //                 if (tex && tex.isComplete()) {
    //                     tex.updateView();
    //                     this.m_currentProgram.m_uniforms[uniformNdx].sampler.texCube = tex;
    //                 } else
    //                     this.m_currentProgram.m_uniforms[uniformNdx].sampler.texCube = &this.m_emptyTexCube;

    //                 break;
    //             }
    //             case gluShaderUtil.DataType.SAMPLER_2D_ARRAY:
    //             case gluShaderUtil.DataType.UINT_SAMPLER_2D_ARRAY:
    //             case gluShaderUtil.DataType.INT_SAMPLER_2D_ARRAY: {
    //                 rc::Texture2DArray* tex = DE_NULL;

    //                 if (texNdx >= 0 && (size_t)texNdx < this.m_textureUnits.length)
    //                     tex = (this.m_textureUnits[texNdx].tex2DArrayBinding) ? (this.m_textureUnits[texNdx].tex2DArrayBinding) : (&this.m_textureUnits[texNdx].default2DArrayTex);

    //                 if (tex && tex.isComplete()) {
    //                     tex.updateView();
    //                     this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex2DArray = tex;
    //                 } else
    //                     this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex2DArray = &this.m_emptyTex2DArray;

    //                 break;
    //             }
    //             case gluShaderUtil.DataType.SAMPLER_3D:
    //             case gluShaderUtil.DataType.UINT_SAMPLER_3D:
    //             case gluShaderUtil.DataType.INT_SAMPLER_3D: {
    //                 rc::Texture3D* tex = DE_NULL;

    //                 if (texNdx >= 0 && (size_t)texNdx < m_textureUnits.length)
    //                     tex = (this.m_textureUnits[texNdx].tex3DBinding) ? (this.m_textureUnits[texNdx].tex3DBinding) : (&this.m_textureUnits[texNdx].default3DTex);

    //                 if (tex && tex.isComplete()) {
    //                     tex.updateView();
    //                     this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex3D = tex;
    //                 } else
    //                     this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex3D = &this.m_emptyTex3D;

    //                 break;
    //             }
    //             case gluShaderUtil.DataType.SAMPLER_CUBE_ARRAY:
    //             case gluShaderUtil.DataType.UINT_SAMPLER_CUBE_ARRAY:
    //             case gluShaderUtil.DataType.INT_SAMPLER_CUBE_ARRAY: {
    //                 rc::TextureCubeArray* tex = DE_NULL;

    //                 if (texNdx >= 0 && (size_t)texNdx < m_textureUnits.length)
    //                     tex = (this.m_textureUnits[texNdx].texCubeArrayBinding) ? (this.m_textureUnits[texNdx].texCubeArrayBinding) : (&this.m_textureUnits[texNdx].defaultCubeArrayTex);

    //                 if (tex && tex.isComplete()) {
    //                     tex.updateView();
    //                     this.m_currentProgram.m_uniforms[uniformNdx].sampler.texCubeArray = tex;
    //                 } else
    //                     this.m_currentProgram.m_uniforms[uniformNdx].sampler.texCubeArray = &this.m_emptyTexCubeArray;

    //                 break;
    //             }
    //             */
    //             default:
    //                 // nothing
    //                 break;
    //         }
    //     }

    //     var command = new rrRenderer.DrawCommand(state, renderTarget, program, vertexAttribs.length, vertexAttribs, primitives);
    //     rrRenderer.drawInstanced(command, instanceCount);
    // };

    /**
    * createProgram
    * @param {sglrShaderProgram.ShaderProgram} program
    * @return {number}
    */
    sglrReferenceContext.ReferenceContext.prototype.createProgram = function (program) {
        //Push and return position
        this.m_programs.push(program);
        return this.m_programs.length - 1;
    };

    /**
     * deleteProgram
     * @param {number} program
     */
    sglrReferenceContext.ReferenceContext.prototype.deleteProgram = function () {};

    /**
    * @param {number} program
    */
    sglrReferenceContext.ReferenceContext.prototype.useProgram = function(program) {
        this.m_currentProgram = program == null ? null : this.m_programs[program];
    };

    /**
    * Draws quads from vertex arrays
    * @param {number} first First vertex to begin drawing with
    * @param {number} count How many quads to draw (array should provide first + (count * 4) vertices at least)
    */
    sglrReferenceContext.ReferenceContext.prototype.drawQuads = function (first, count) {
        // undefined results
        if (!this.m_currentProgram)
            return;

        // Check we have enough vertices in the array
        var vao = this.m_vertexArrayBinding;

        assertMsgOptions(vao.m_arrays.length >= first + (count * 6), 'Not enough vertices to draw all quads', false, true);

        var colorBuf0 = this.getDrawColorbuffer();
        var depthBuf = this.getDrawDepthbuffer();
        var stencilBuf = this.getDrawStencilbuffer();
        var hasStencil = (stencilBuf && !stencilBuf.isEmpty());
        var stencilBits = (hasStencil) ?
        stencilBuf.raw().getFormat().getNumStencilBits() :
        (0);

        var renderTarget = new rrRenderer.RenderTarget(colorBuf0,
                                                    depthBuf,
                                                    stencilBuf);
        var program = this.m_currentProgram;

        /*new rrRenderer.Program(
        *   this.m_currentProgram.getVertexShader(),
        *   this.m_currentProgram.getFragmentShader());*/

        var state = new rrRenderState.RenderState(colorBuf0);

        var vertexAttribs = [];

        // Gen state
        var baseType = rrRenderer.PrimitiveType.TRIANGLES;
        var polygonOffsetEnabled =
            (baseType == rrRenderer.PrimitiveType.TRIANGLES) ?
            (this.m_polygonOffsetFillEnabled) :
            (false);

        //state.cullMode = m_cullMode

        state.fragOps.scissorTestEnabled = this.m_scissorEnabled;
        state.fragOps.scissorRectangle = new rrRenderState.WindowRectangle(this.m_scissorBox);

        state.fragOps.numStencilBits = stencilBits;
        state.fragOps.stencilTestEnabled = this.m_stencilTestEnabled;

        for (var key in rrDefs.FaceType) {
            var faceType = rrDefs.FaceType[key];
            state.fragOps.stencilStates[faceType].compMask = this.m_stencil[faceType].opMask;
            state.fragOps.stencilStates[faceType].writeMask = this.m_stencil[faceType].writeMask;
            state.fragOps.stencilStates[faceType].ref = this.m_stencil[faceType].ref;
            state.fragOps.stencilStates[faceType].func = sglrReferenceUtils.mapGLTestFunc(this.m_stencil[faceType].func);
            state.fragOps.stencilStates[faceType].sFail = sglrReferenceUtils.mapGLStencilOp(this.m_stencil[faceType].opStencilFail);
            state.fragOps.stencilStates[faceType].dpFail = sglrReferenceUtils.mapGLStencilOp(this.m_stencil[faceType].opDepthFail);
            state.fragOps.stencilStates[faceType].dpPass = sglrReferenceUtils.mapGLStencilOp(this.m_stencil[faceType].opDepthPass);
        }

        state.fragOps.depthTestEnabled = this.m_depthTestEnabled;
        state.fragOps.depthFunc = sglrReferenceUtils.mapGLTestFunc(this.m_depthFunc);
        state.fragOps.depthMask = this.m_depthMask;

        state.fragOps.blendMode = this.m_blendEnabled ? rrRenderState.BlendMode.STANDARD : rrRenderState.BlendMode.NONE;
        state.fragOps.blendRGBState.equation = sglrReferenceUtils.mapGLBlendEquation(this.m_blendModeRGB);
        state.fragOps.blendRGBState.srcFunc = sglrReferenceUtils.mapGLBlendFunc(this.m_blendFactorSrcRGB);
        state.fragOps.blendRGBState.dstFunc = sglrReferenceUtils.mapGLBlendFunc(this.m_blendFactorDstRGB);
        state.fragOps.blendAState.equation = sglrReferenceUtils.mapGLBlendEquation(this.m_blendModeAlpha);
        state.fragOps.blendAState.srcFunc = sglrReferenceUtils.mapGLBlendFunc(this.m_blendFactorSrcAlpha);
        state.fragOps.blendAState.dstFunc = sglrReferenceUtils.mapGLBlendFunc(this.m_blendFactorDstAlpha);
        state.fragOps.blendColor = this.m_blendColor;

        state.fragOps.colorMask = this.m_colorMask;

        state.viewport.rect = new rrRenderState.WindowRectangle(this.m_viewport);
        state.viewport.zn = this.m_depthRangeNear;
        state.viewport.zf = this.m_depthRangeFar;

        //state.point.pointSize = this.m_pointSize;
        state.line.lineWidth = this.m_lineWidth;

        state.fragOps.polygonOffsetEnabled = polygonOffsetEnabled;
        state.fragOps.polygonOffsetFactor = this.m_polygonOffsetFactor;
        state.fragOps.polygonOffsetUnits = this.m_polygonOffsetUnits;

        state.provokingVertexConvention = (this.m_provokingFirstVertexConvention) ? (rrDefs.ProvokingVertex.PROVOKINGVERTEX_FIRST) : (rrDefs.ProvokingVertex.PROVOKINGVERTEX_LAST);

        // gen attributes
        for (var ndx = 0; ndx < vao.m_arrays.length; ++ndx) {
            vertexAttribs[ndx] = new rrVertexAttrib.VertexAttrib();
            if (!vao.m_arrays[ndx].enabled) {
                vertexAttribs[ndx].type = rrVertexAttrib.VertexAttribType.DONT_CARE; // reading with wrong type is allowed, but results are undefined
                vertexAttribs[ndx].generic = this.m_currentAttribs[ndx];
            }
            else {
                vertexAttribs[ndx].type = (vao.m_arrays[ndx].integer) ?
                (sglrReferenceUtils.mapGLPureIntegerVertexAttributeType(vao.m_arrays[ndx].type)) :
                (sglrReferenceUtils.mapGLFloatVertexAttributeType(vao.m_arrays[ndx].type, vao.m_arrays[ndx].normalized, vao.m_arrays[ndx].size, this.getType()));
                vertexAttribs[ndx].size = sglrReferenceUtils.mapGLSize(vao.m_arrays[ndx].size);
                vertexAttribs[ndx].stride = vao.m_arrays[ndx].stride;
                vertexAttribs[ndx].instanceDivisor  = vao.m_arrays[ndx].divisor;
                vertexAttribs[ndx].pointer = vao.m_arrays[ndx].bufferBinding.getData();
                vertexAttribs[ndx].offset = vao.m_arrays[ndx].offset;
            }
        }

        // Set shader samplers
        for (var uniformNdx = 0; uniformNdx < this.m_currentProgram.m_uniforms.length; ++uniformNdx) {
            var texNdx = this.m_currentProgram.m_uniforms[uniformNdx].value;

            switch (this.m_currentProgram.m_uniforms[uniformNdx].type) {
                case gluShaderUtil.DataType.SAMPLER_2D:
                case gluShaderUtil.DataType.UINT_SAMPLER_2D:
                case gluShaderUtil.DataType.INT_SAMPLER_2D: {
                    var tex = null;

                    if (texNdx >= 0 && texNdx < this.m_textureUnits.length)
                        tex = (this.m_textureUnits[texNdx].tex2DBinding) ? (this.m_textureUnits[texNdx].tex2DBinding) : (this.m_textureUnits[texNdx].default2DTex);

                    if (tex && tex.isComplete()) {
                        tex.updateView();
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex2D = tex;
                    }
                    else
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex2D = this.m_emptyTex2D;

                    break;
                }
                /* TODO: Port
                case gluShaderUtil.DataType.SAMPLER_CUBE:
                case gluShaderUtil.DataType.UINT_SAMPLER_CUBE:
                case gluShaderUtil.DataType.INT_SAMPLER_CUBE:
                {
                    rc::TextureCube* tex = DE_NULL;

                    if (texNdx >= 0 && (size_t)texNdx < this.m_textureUnits.length)
                        tex = (this.m_textureUnits[texNdx].texCubeBinding) ? (this.m_textureUnits[texNdx].texCubeBinding) : (&this.m_textureUnits[texNdx].defaultCubeTex);

                    if (tex && tex.isComplete())
                    {
                        tex.updateView();
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.texCube = tex;
                    }
                    else
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.texCube = &this.m_emptyTexCube;

                    break;
                }
                case gluShaderUtil.DataType.SAMPLER_2D_ARRAY:
                case gluShaderUtil.DataType.UINT_SAMPLER_2D_ARRAY:
                case gluShaderUtil.DataType.INT_SAMPLER_2D_ARRAY:
                {
                    rc::Texture2DArray* tex = DE_NULL;

                    if (texNdx >= 0 && (size_t)texNdx < this.m_textureUnits.length)
                        tex = (this.m_textureUnits[texNdx].tex2DArrayBinding) ? (this.m_textureUnits[texNdx].tex2DArrayBinding) : (&this.m_textureUnits[texNdx].default2DArrayTex);

                    if (tex && tex.isComplete())
                    {
                        tex.updateView();
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex2DArray = tex;
                    }
                    else
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex2DArray = &this.m_emptyTex2DArray;

                    break;
                }
                case gluShaderUtil.DataType.SAMPLER_3D:
                case gluShaderUtil.DataType.UINT_SAMPLER_3D:
                case gluShaderUtil.DataType.INT_SAMPLER_3D:
                {
                    rc::Texture3D* tex = DE_NULL;

                    if (texNdx >= 0 && (size_t)texNdx < m_textureUnits.length)
                        tex = (this.m_textureUnits[texNdx].tex3DBinding) ? (this.m_textureUnits[texNdx].tex3DBinding) : (&this.m_textureUnits[texNdx].default3DTex);

                    if (tex && tex.isComplete())
                    {
                        tex.updateView();
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex3D = tex;
                    }
                    else
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex3D = &this.m_emptyTex3D;

                    break;
                }
                case gluShaderUtil.DataType.SAMPLER_CUBE_ARRAY:
                case gluShaderUtil.DataType.UINT_SAMPLER_CUBE_ARRAY:
                case gluShaderUtil.DataType.INT_SAMPLER_CUBE_ARRAY:
                {
                    rc::TextureCubeArray* tex = DE_NULL;

                    if (texNdx >= 0 && (size_t)texNdx < m_textureUnits.length)
                        tex = (this.m_textureUnits[texNdx].texCubeArrayBinding) ? (this.m_textureUnits[texNdx].texCubeArrayBinding) : (&this.m_textureUnits[texNdx].defaultCubeArrayTex);

                    if (tex && tex.isComplete())
                    {
                        tex.updateView();
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.texCubeArray = tex;
                    }
                    else
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.texCubeArray = &this.m_emptyTexCubeArray;

                    break;
                }
                */
                default:
                    // nothing
                    break;
            }
        }

        rrRenderer.drawQuads(state, renderTarget, program, vertexAttribs, first, count);
    };

    /**
    * @param {Array<number>} topLeft Coordinates of top left corner of the rectangle
    * @param {Array<number>} bottomRight Coordinates of bottom right corner of the rectangle
    */
    sglrReferenceContext.ReferenceContext.prototype.drawQuad = function(topLeft, bottomRight) {
        // undefined results
        if (!this.m_currentProgram)
            return;

        var colorBuf0 = this.getDrawColorbuffer();
        var depthBuf = this.getDrawDepthbuffer();
        var stencilBuf = this.getDrawStencilbuffer();
        var hasStencil = (stencilBuf && !stencilBuf.isEmpty());
        var stencilBits = (hasStencil) ?
            stencilBuf.raw().getFormat().getNumStencilBits() :
            (0);

        var renderTarget = new rrRenderer.RenderTarget(colorBuf0,
                                                    depthBuf,
                                                    stencilBuf);
        var program = this.m_currentProgram;

        var state = new rrRenderState.RenderState(colorBuf0);

        var vertexAttribs = [];

        // Gen state
        var baseType = rrRenderer.PrimitiveType.TRIANGLES;
        var polygonOffsetEnabled =
            (baseType == rrRenderer.PrimitiveType.TRIANGLES) ?
            (this.m_polygonOffsetFillEnabled) :
            (false);

        //state.cullMode = m_cullMode

        state.fragOps.scissorTestEnabled = this.m_scissorEnabled;
        state.fragOps.scissorRectangle = new rrRenderState.WindowRectangle(this.m_scissorBox);

        state.fragOps.numStencilBits = stencilBits;
        state.fragOps.stencilTestEnabled = this.m_stencilTestEnabled;

        for (var key in rrDefs.FaceType) {
            var faceType = rrDefs.FaceType[key];
            state.fragOps.stencilStates[faceType].compMask = this.m_stencil[faceType].opMask;
            state.fragOps.stencilStates[faceType].writeMask = this.m_stencil[faceType].writeMask;
            state.fragOps.stencilStates[faceType].ref = this.m_stencil[faceType].ref;
            state.fragOps.stencilStates[faceType].func = sglrReferenceUtils.mapGLTestFunc(this.m_stencil[faceType].func);
            state.fragOps.stencilStates[faceType].sFail = sglrReferenceUtils.mapGLStencilOp(this.m_stencil[faceType].opStencilFail);
            state.fragOps.stencilStates[faceType].dpFail = sglrReferenceUtils.mapGLStencilOp(this.m_stencil[faceType].opDepthFail);
            state.fragOps.stencilStates[faceType].dpPass = sglrReferenceUtils.mapGLStencilOp(this.m_stencil[faceType].opDepthPass);
        }

        state.fragOps.depthTestEnabled = this.m_depthTestEnabled;
        state.fragOps.depthFunc = sglrReferenceUtils.mapGLTestFunc(this.m_depthFunc);
        state.fragOps.depthMask = this.m_depthMask;

        state.fragOps.blendMode = this.m_blendEnabled ? rrRenderState.BlendMode.STANDARD : rrRenderState.BlendMode.NONE;
        state.fragOps.blendRGBState.equation = sglrReferenceUtils.mapGLBlendEquation(this.m_blendModeRGB);
        state.fragOps.blendRGBState.srcFunc = sglrReferenceUtils.mapGLBlendFunc(this.m_blendFactorSrcRGB);
        state.fragOps.blendRGBState.dstFunc = sglrReferenceUtils.mapGLBlendFunc(this.m_blendFactorDstRGB);
        state.fragOps.blendAState.equation = sglrReferenceUtils.mapGLBlendEquation(this.m_blendModeAlpha);
        state.fragOps.blendAState.srcFunc = sglrReferenceUtils.mapGLBlendFunc(this.m_blendFactorSrcAlpha);
        state.fragOps.blendAState.dstFunc = sglrReferenceUtils.mapGLBlendFunc(this.m_blendFactorDstAlpha);
        state.fragOps.blendColor = this.m_blendColor;

        state.fragOps.colorMask = this.m_colorMask;

        state.viewport.rect = new rrRenderState.WindowRectangle(this.m_viewport);
        state.viewport.zn = this.m_depthRangeNear;
        state.viewport.zf = this.m_depthRangeFar;

        //state.point.pointSize = this.m_pointSize;
        state.line.lineWidth = this.m_lineWidth;

        state.fragOps.polygonOffsetEnabled = polygonOffsetEnabled;
        state.fragOps.polygonOffsetFactor = this.m_polygonOffsetFactor;
        state.fragOps.polygonOffsetUnits = this.m_polygonOffsetUnits;

        state.provokingVertexConvention = (this.m_provokingFirstVertexConvention) ? (rrDefs.ProvokingVertex.PROVOKINGVERTEX_FIRST) : (rrDefs.ProvokingVertex.PROVOKINGVERTEX_LAST);

        // gen attributes
        var vao = this.m_vertexArrayBinding;

        for (var ndx = 0; ndx < vao.m_arrays.length; ++ndx) {
            vertexAttribs[ndx] = new rrVertexAttrib.VertexAttrib();
            if (!vao.m_arrays[ndx].enabled) {
                vertexAttribs[ndx].type = rrVertexAttrib.VertexAttribType.DONT_CARE; // reading with wrong type is allowed, but results are undefined
                vertexAttribs[ndx].generic = this.m_currentAttribs[ndx];
            } else {
                vertexAttribs[ndx].type = (vao.m_arrays[ndx].integer) ?
                                        (sglrReferenceUtils.mapGLPureIntegerVertexAttributeType(vao.m_arrays[ndx].type)) :
                                        (sglrReferenceUtils.mapGLFloatVertexAttributeType(vao.m_arrays[ndx].type, vao.m_arrays[ndx].normalized, vao.m_arrays[ndx].size, this.getType()));
                vertexAttribs[ndx].size = sglrReferenceUtils.mapGLSize(vao.m_arrays[ndx].size);
                vertexAttribs[ndx].stride = vao.m_arrays[ndx].stride;
                vertexAttribs[ndx].instanceDivisor = vao.m_arrays[ndx].divisor;
                vertexAttribs[ndx].pointer = vao.m_arrays[ndx].bufferBinding.getData();
                vertexAttribs[ndx].offset = vao.m_arrays[ndx].offset;
            }
        }

        // Set shader samplers
        for (var uniformNdx = 0; uniformNdx < this.m_currentProgram.m_uniforms.length; ++uniformNdx) {
            var texNdx = this.m_currentProgram.m_uniforms[uniformNdx].value;

            switch (this.m_currentProgram.m_uniforms[uniformNdx].type) {
                case gluShaderUtil.DataType.SAMPLER_2D:
                case gluShaderUtil.DataType.UINT_SAMPLER_2D:
                case gluShaderUtil.DataType.INT_SAMPLER_2D: {
                    var tex = null;

                    if (texNdx >= 0 && texNdx < this.m_textureUnits.length)
                        tex = (this.m_textureUnits[texNdx].tex2DBinding) ? (this.m_textureUnits[texNdx].tex2DBinding) : (this.m_textureUnits[texNdx].default2DTex);

                    if (tex && tex.isComplete()) {
                        tex.updateView();
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex2D = tex;
                    } else
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex2D = this.m_emptyTex2D;

                    break;
                }
                /* TODO: Port
                case gluShaderUtil.DataType.SAMPLER_CUBE:
                case gluShaderUtil.DataType.UINT_SAMPLER_CUBE:
                case gluShaderUtil.DataType.INT_SAMPLER_CUBE: {
                    rc::TextureCube* tex = DE_NULL;

                    if (texNdx >= 0 && (size_t)texNdx < this.m_textureUnits.length)
                        tex = (this.m_textureUnits[texNdx].texCubeBinding) ? (this.m_textureUnits[texNdx].texCubeBinding) : (&this.m_textureUnits[texNdx].defaultCubeTex);

                    if (tex && tex.isComplete()) {
                        tex.updateView();
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.texCube = tex;
                    } else
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.texCube = &this.m_emptyTexCube;

                    break;
                }
                case gluShaderUtil.DataType.SAMPLER_2D_ARRAY:
                case gluShaderUtil.DataType.UINT_SAMPLER_2D_ARRAY:
                case gluShaderUtil.DataType.INT_SAMPLER_2D_ARRAY: {
                    rc::Texture2DArray* tex = DE_NULL;

                    if (texNdx >= 0 && (size_t)texNdx < this.m_textureUnits.length)
                        tex = (this.m_textureUnits[texNdx].tex2DArrayBinding) ? (this.m_textureUnits[texNdx].tex2DArrayBinding) : (&this.m_textureUnits[texNdx].default2DArrayTex);

                    if (tex && tex.isComplete()) {
                        tex.updateView();
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex2DArray = tex;
                    } else
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex2DArray = &this.m_emptyTex2DArray;

                    break;
                }
                case gluShaderUtil.DataType.SAMPLER_3D:
                case gluShaderUtil.DataType.UINT_SAMPLER_3D:
                case gluShaderUtil.DataType.INT_SAMPLER_3D: {
                    rc::Texture3D* tex = DE_NULL;

                    if (texNdx >= 0 && (size_t)texNdx < m_textureUnits.length)
                        tex = (this.m_textureUnits[texNdx].tex3DBinding) ? (this.m_textureUnits[texNdx].tex3DBinding) : (&this.m_textureUnits[texNdx].default3DTex);

                    if (tex && tex.isComplete()) {
                        tex.updateView();
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex3D = tex;
                    } else
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.tex3D = &this.m_emptyTex3D;

                    break;
                }
                case gluShaderUtil.DataType.SAMPLER_CUBE_ARRAY:
                case gluShaderUtil.DataType.UINT_SAMPLER_CUBE_ARRAY:
                case gluShaderUtil.DataType.INT_SAMPLER_CUBE_ARRAY: {
                    rc::TextureCubeArray* tex = DE_NULL;

                    if (texNdx >= 0 && (size_t)texNdx < m_textureUnits.length)
                        tex = (this.m_textureUnits[texNdx].texCubeArrayBinding) ? (this.m_textureUnits[texNdx].texCubeArrayBinding) : (&this.m_textureUnits[texNdx].defaultCubeArrayTex);

                    if (tex && tex.isComplete()) {
                        tex.updateView();
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.texCubeArray = tex;
                    } else
                        this.m_currentProgram.m_uniforms[uniformNdx].sampler.texCubeArray = &this.m_emptyTexCubeArray;

                    break;
                }
                */
                default:
                    // nothing
                    break;
            }
        }

        rrRenderer.drawQuad(state, renderTarget, program, vertexAttribs, topLeft, bottomRight);
    };

    sglrReferenceContext.isEmpty = function(rect) { return rect[2] == 0 || rect[3] == 0; };

    sglrReferenceContext.ReferenceContext.prototype.blitResolveMultisampleFramebuffer = function(mask, srcRect, dstRect, flipX, flipY) {
        throw new Error('Unimplemented');
    };

    sglrReferenceContext.ReferenceContext.prototype.blitFramebuffer = function(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter) {
        // p0 in inclusive, p1 exclusive.
        // Negative width/height means swap.
        var swapSrcX = srcX1 < srcX0;
        var swapSrcY = srcY1 < srcY0;
        var swapDstX = dstX1 < dstX0;
        var swapDstY = dstY1 < dstY0;
        var srcW = Math.abs(srcX1-srcX0);
        var srcH = Math.abs(srcY1-srcY0);
        var dstW = Math.abs(dstX1-dstX0);
        var dstH = Math.abs(dstY1-dstY0);
        var scale = srcW != dstW || srcH != dstH;
        var srcOriginX = swapSrcX ? srcX1 : srcX0;
        var srcOriginY = swapSrcY ? srcY1 : srcY0;
        var dstOriginX = swapDstX ? dstX1 : dstX0;
        var dstOriginY = swapDstY ? dstY1 : dstY0;
        var srcRect = [srcOriginX, srcOriginY, srcW, srcH];
        var dstRect = [dstOriginX, dstOriginY, dstW, dstH];

        if (this.condtionalSetError(filter != gl.NEAREST && filter != gl.LINEAR, gl.INVALID_ENUM))
            return;
        if (this.condtionalSetError((mask & (gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT)) != 0 && filter != gl.NEAREST, gl.INVALID_OPERATION))
            return;

        // Validate that both targets are complete.
        if (this.condtionalSetError(this.checkFramebufferStatus(gl.DRAW_FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE ||
                    this.checkFramebufferStatus(gl.READ_FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE, gl.INVALID_OPERATION))
            return;

        // Check samples count is valid
        if (this.condtionalSetError(this.getDrawColorbuffer().getNumSamples() != 1, gl.INVALID_OPERATION))
            return

        // Check size restrictions of multisampled case
        if (this.getReadColorbuffer().getNumSamples() != 1) {
            // Src and Dst rect dimensions must be the same
            if (this.condtionalSetError(srcW != dstW || srcH != dstH, gl.INVALID_OPERATION))
                return;

            // sglrReferenceContext.Framebuffer formats must match
            if (mask & gl.COLOR_BUFFER_BIT)
                if (this.condtionalSetError(this.getReadColorbuffer().raw().getFormat() != this.getDrawColorbuffer().raw().getFormat(), gl.INVALID_OPERATION))
                    return;
            if (mask & gl.DEPTH_BUFFER_BIT)
                if (this.condtionalSetError(this.getReadDepthbuffer().raw().getFormat() != this.getDrawDepthbuffer().raw().getFormat(), gl.INVALID_OPERATION))
                    return;
            if (mask & gl.STENCIL_BUFFER_BIT)
            if (this.condtionalSetError(this.getReadStencilbuffer().raw().getFormat() != this.getDrawStencilbuffer().raw().getFormat(), gl.INVALID_OPERATION))
                return;
        }

        // Compute actual source rect.
        srcRect = (mask & gl.COLOR_BUFFER_BIT) ? deMath.intersect(srcRect, sglrReferenceContext.getBufferRect(this.getReadColorbuffer())) : srcRect;
        srcRect = (mask & gl.DEPTH_BUFFER_BIT) ? deMath.intersect(srcRect, sglrReferenceContext.getBufferRect(this.getReadDepthbuffer())) : srcRect;
        srcRect = (mask & gl.STENCIL_BUFFER_BIT) ? deMath.intersect(srcRect, sglrReferenceContext.getBufferRect(this.getReadStencilbuffer())) : srcRect;

        // Compute destination rect.
        dstRect = (mask & gl.COLOR_BUFFER_BIT) ? deMath.intersect(dstRect, sglrReferenceContext.getBufferRect(this.getDrawColorbuffer())) : dstRect;
        dstRect = (mask & gl.DEPTH_BUFFER_BIT) ? deMath.intersect(dstRect, sglrReferenceContext.getBufferRect(this.getDrawDepthbuffer())) : dstRect;
        dstRect = (mask & gl.STENCIL_BUFFER_BIT) ? deMath.intersect(dstRect, sglrReferenceContext.getBufferRect(this.getDrawStencilbuffer())) : dstRect;
        dstRect = this.m_scissorEnabled ? deMath.intersect(dstRect, this.m_scissorBox) : dstRect;

        if (sglrReferenceContext.isEmpty(srcRect) || sglrReferenceContext.isEmpty(dstRect))
            return; // Don't attempt copy.

        // Multisampled read buffer is a special case
        if (this.getReadColorbuffer().getNumSamples() != 1) {
            var error = this.blitResolveMultisampleFramebuffer(mask, srcRect, dstRect, swapSrcX ^ swapDstX, swapSrcY ^ swapDstY);

            if (error != gl.NO_ERROR)
                this.setError(error);

            return;
        }

        // \note Multisample pixel buffers can now be accessed like non-multisampled because multisample read buffer case is already handled. => sample count must be 1

        // Coordinate transformation:
        // Dst offset space -> dst rectangle space -> src rectangle space -> src offset space.
        var matrix = tcuMatrixUtil.translationMatrix([srcX0 - srcRect[0], srcY0 - srcRect[1]]);
    matrix = tcuMatrix.multiply(matrix, tcuMatrix.matrixFromVector(3, 3, [(srcX1-srcX0) / (dstX1-dstX0), (srcY1-srcY0) / (dstY1-dstY0), 1]));
    matrix = tcuMatrix.multiply(matrix, tcuMatrixUtil.translationMatrix([dstRect[0] - dstX0, dstRect[1] - dstY0]));
        var transform = function(x, y) { return matrix.get(x, y); };

        if (mask & gl.COLOR_BUFFER_BIT) {
            var src = tcuTextureUtil.getSubregion(this.getReadColorbuffer().toSinglesampleAccess(), srcRect[0], srcRect[1], srcRect[2], srcRect[3]);
            var dst = tcuTextureUtil.getSubregion(this.getDrawColorbuffer().toSinglesampleAccess(), dstRect[0], dstRect[1], dstRect[2], dstRect[3]);
            var dstClass = tcuTextureUtil.getTextureChannelClass(dst.getFormat().type);
            var dstIsFloat = dstClass == tcuTextureUtil.TextureChannelClass.FLOATING_POINT ||
                                                        dstClass == tcuTextureUtil.TextureChannelClass.UNSIGNED_FIXED_POINT ||
                                                        dstClass == tcuTextureUtil.TextureChannelClass.SIGNED_FIXED_POINT;
            var sFilter = (scale && filter == gl.LINEAR) ? tcuTexture.FilterMode.LINEAR : tcuTexture.FilterMode.NEAREST;
            var sampler = new tcuTexture.Sampler(tcuTexture.WrapMode.CLAMP_TO_EDGE, tcuTexture.WrapMode.CLAMP_TO_EDGE, tcuTexture.WrapMode.CLAMP_TO_EDGE,
                                                        sFilter, sFilter, 0.0 /* lod threshold */, false /* non-normalized coords */);
            var srcIsSRGB = src.getFormat().order == tcuTexture.ChannelOrder.sRGB || src.getFormat().order == tcuTexture.ChannelOrder.sRGBA;
            var dstIsSRGB = dst.getFormat().order == tcuTexture.ChannelOrder.sRGB || dst.getFormat().order == tcuTexture.ChannelOrder.sRGBA;
            var convertSRGB = false;

            // \note We don't check for unsupported conversions, unlike spec requires.

            for (var yo = 0; yo < dstRect[3]; yo++) {
                for (var xo = 0; xo < dstRect[2]; xo++) {
                    var dX = xo + 0.5;
                    var dY = yo + 0.5;

                    // \note Only affine part is used.
                    var sX = transform(0, 0)*dX + transform(0, 1)*dY + transform(0, 2);
                    var sY = transform(1, 0)*dX + transform(1, 1)*dY + transform(1, 2);

                    // do not copy pixels outside the modified source region (modified by buffer intersection)
                    if (sX < 0.0 || sX >= srcRect[2] ||
                        sY < 0.0 || sY >= srcRect[3])
                        continue;

                    if (dstIsFloat || srcIsSRGB || filter == tcuTexture.FilterMode.LINEAR) {
                        var p = src.sample2D(sampler, sampler.minFilter, sX, sY, 0);
                        dst.setPixel((dstIsSRGB && convertSRGB) ? tcuTextureUtil.linearToSRGB(p) : p, xo, yo);
                    } else
                        dst.setPixelInt(src.getPixelInt(Math.floor(sX), Math.floor(sY)), xo, yo);
                }
            }
        }

        if ((mask & gl.DEPTH_BUFFER_BIT) && this.m_depthMask) {
            var src = this.getReadDepthbuffer().getSubregion(srcRect);
            var dst = this.getDrawDepthbuffer().getSubregion(dstRect);

            for (var yo = 0; yo < dstRect[3]; yo++) {
                for (var xo = 0; xo < dstRect[2]; xo++) {
                    var sampleNdx = 0; // multisample read buffer case is already handled

                    var dX = xo + 0.5;
                    var dY = yo + 0.5;
                    var sX = transform(0, 0)*dX + transform(0, 1)*dY + transform(0, 2);
                    var sY = transform(1, 0)*dX + transform(1, 1)*dY + transform(1, 2);

                    sglrReferenceContext.writeDepthOnly(dst, sampleNdx, xo, yo, src.raw().getPixel(sampleNdx, Math.floor(sX), Math.floor(sY))[0]);
                }
            }
        }

        if (mask & gl.STENCIL_BUFFER_BIT) {
            var src = this.getReadStencilbuffer().getSubregion(srcRect);
            var dst = this.getDrawStencilbuffer().getSubregion(dstRect);

            for (var yo = 0; yo < dstRect[3]; yo++) {
                for (var xo = 0; xo < dstRect[2]; xo++) {
                    var sampleNdx = 0; // multisample read buffer case is already handled

                    var dX = xo + 0.5;
                    var dY = yo + 0.5;
                    var sX = transform(0, 0)*dX + transform(0, 1)*dY + transform(0, 2);
                    var sY = transform(1, 0)*dX + transform(1, 1)*dY + transform(1, 2);

                    sglrReferenceContext.writeStencilOnly(dst, sampleNdx, xo, yo, src.raw().getPixelInt(sampleNdx, Math.floor(sX), Math.floor(sY))[3], this.m_stencil[rrDefs.FaceType.FACETYPE_FRONT].writeMask);
                }
            }
        }
    };

    sglrReferenceContext.mapInternalFormat = function(internalFormat) {
        switch (internalFormat) {
            case gl.ALPHA: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.A, tcuTexture.ChannelType.UNORM_INT8);
            case gl.LUMINANCE: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.L, tcuTexture.ChannelType.UNORM_INT8);
            case gl.LUMINANCE_ALPHA: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.LA, tcuTexture.ChannelType.UNORM_INT8);
            case gl.RGB: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGB, tcuTexture.ChannelType.UNORM_INT8);
            case gl.RGBA: return new tcuTexture.TextureFormat(tcuTexture.ChannelOrder.RGBA, tcuTexture.ChannelType.UNORM_INT8);

            default:
                return gluTextureUtil.mapGLInternalFormat(internalFormat);
        }
    };

    /**
    * @param {tcuTexture.PixelBufferAccess} dst
    * @param {tcuTexture.PixelBufferAccess} src
    */
    sglrReferenceContext.depthValueFloatClampCopy = function(dst, src) {
        var width = dst.getWidth();
        var height = dst.getHeight();
        var depth = dst.getDepth();

        DE_ASSERT(src.getWidth() == width && src.getHeight() == height && src.getDepth() == depth);

        // clamping copy
        for (var z = 0; z < depth; z++)
        for (var y = 0; y < height; y++)
        for (var x = 0; x < width; x++) {
            var data = src.getPixel(x, y, z);
            dst.setPixel([deMath.clamp(data[0], 0.0, 1.0), data[1], data[2], data[3]], x, y, z);
        }
    }

    sglrReferenceContext.ReferenceContext.prototype.texImage2D = function(target, level, internalFormat, width, height, border, format, type, pixels) {
        this.texImage3D(target, level, internalFormat, width, height, 1, border, format, type, pixels);
    };

    sglrReferenceContext.ReferenceContext.prototype.texImage3D = function(target, level, internalFormat, width, height, depth, border, format, type, pixels) {
        var unit = this.m_textureUnits[this.m_activeTexture];
        var data = null;
        var offset = 0;
        if (this.m_pixelUnpackBufferBinding) {
            if (this.condtionalSetError(typeof pixels !== 'number', gl.INVALID_VALUE))
                return;
            data = this.m_pixelUnpackBufferBinding.getData();
            offset = pixels;
        } else {
            if (pixels instanceof ArrayBuffer) {
                data = pixels;
                offset = 0;
            } else {
                data = pixels.buffer;
                offset = pixels.byteOffset;
            }
        }
        var isDstFloatDepthFormat = (internalFormat == gl.DEPTH_COMPONENT32F || internalFormat == gl.DEPTH32F_STENCIL8); // depth components are limited to [0,1] range

        if (this.condtionalSetError(border != 0, gl.INVALID_VALUE))
            return;
        if (this.condtionalSetError(width < 0 || height < 0 || depth < 0 || level < 0, gl.INVALID_VALUE))
            return;

        // Map storage format.
        var storageFmt = sglrReferenceContext.mapInternalFormat(internalFormat);
        if (this.condtionalSetError(!storageFmt, gl.INVALID_ENUM))
            return;

        // Map transfer format.
        var transferFmt = gluTextureUtil.mapGLTransferFormat(format, type);
        if (this.condtionalSetError(!transferFmt, gl.INVALID_ENUM))
            return;

        if (target == gl.TEXTURE_2D) {
            // Validate size and level.
            if (this.condtionalSetError(width > this.m_limits.maxTexture2DSize || height > this.m_limits.maxTexture2DSize || depth != 1, gl.INVALID_VALUE))
                return;
            if (this.condtionalSetError(level > Math.log2(this.m_limits.maxTexture2DSize), gl.INVALID_VALUE))
                return;

            var texture = unit.tex2DBinding ? unit.tex2DBinding : unit.default2DTex;

            if (texture.isImmutable()) {
                if (this.condtionalSetError(!texture.hasLevel(level), gl.INVALID_OPERATION))
                    return;

                var texLevel = texture.getLevel(level);
                var dst = tcuTexture.newFromTextureLevel(texture.getLevel(level));
                if (this.condtionalSetError(storageFmt != dst.getFormat() ||
                            width != dst.getWidth() ||
                            height != dst.getHeight(), gl.INVALID_OPERATION))
                    return;
            } else
                texture.allocLevel(level, storageFmt, width, height);

            if (data) {
                var src = new tcuTexture.tcuTexture.PixelBufferAccess({
                    format: transferFmt,
                    width: width,
                    height: height,
                    data: data,
                    offset: offset});
                var dst = tcuTexture.newFromTextureLevel(texture.getLevel(level));

                if (isDstFloatDepthFormat)
                    sglrReferenceContext.depthValueFloatClampCopy(dst, src);
                else
                    tcuTextureUtil.copy(dst, src);
            } else {
                // No data supplied, clear to black.
                var dst = tcuTexture.newFromTextureLevel(texture.getLevel(level));
                dst.clear([0.0, 0.0, 0.0, 1.0]);
            }
        }
        // else if (target == gl.TEXTURE_CUBE_MAP_NEGATIVE_X ||
        //          target == gl.TEXTURE_CUBE_MAP_POSITIVE_X ||
        //          target == gl.TEXTURE_CUBE_MAP_NEGATIVE_Y ||
        //          target == gl.TEXTURE_CUBE_MAP_POSITIVE_Y ||
        //          target == gl.TEXTURE_CUBE_MAP_NEGATIVE_Z ||
        //          target == gl.TEXTURE_CUBE_MAP_POSITIVE_Z)
        // {
        //     // Validate size and level.
        //     RC_IF_ERROR(width != height || width > m_limits.maxTextureCubeSize || depth != 1, gl.INVALID_VALUE, RC_RET_VOID);
        //     RC_IF_ERROR(level > deLog2Floor32(m_limits.maxTextureCubeSize), gl.INVALID_VALUE, RC_RET_VOID);

        //     TextureCube*    texture = unit.texCubeBinding ? unit.texCubeBinding : &unit.defaultCubeTex;
        //     tcu::CubeFace face = mapGLCubeFace(target);

        //     if (texture->isImmutable())
        //     {
        //         RC_IF_ERROR(!texture->hasFace(level, face), gl.INVALID_OPERATION, RC_RET_VOID);

        //         ConstPixelBufferAccess dst(texture->getFace(level, face));
        //         RC_IF_ERROR(storageFmt != dst.getFormat() ||
        //                     width != dst.getWidth() ||
        //                     height != dst.getHeight(), gl.INVALID_OPERATION, RC_RET_VOID);
        //     }
        //     else
        //         texture->allocFace(level, face, storageFmt, width, height);

        //     if (unpackPtr)
        //     {
        //         ConstPixelBufferAccess src = getUnpack2DAccess(transferFmt, width, height, unpackPtr);
        //         PixelBufferAccess dst (texture->getFace(level, face));

        //         if (isDstFloatDepthFormat)
        //             sglrReferenceContext.depthValueFloatClampCopy(dst, src);
        //         else
        //             tcu::copy(dst, src);
        //     }
        //     else
        //     {
        //         // No data supplied, clear to black.
        //         PixelBufferAccess dst = texture->getFace(level, face);
        //         tcu::clear(dst, Vec4(0.0f, 0.0f, 0.0f, 1.0f));
        //     }
        // }
        // else if (target == gl.TEXTURE_2D_ARRAY)
        // {
        //     // Validate size and level.
        //     RC_IF_ERROR(width > m_limits.maxTexture2DSize ||
        //                 height > m_limits.maxTexture2DSize ||
        //                 depth > m_limits.maxTexture2DArrayLayers, gl.INVALID_VALUE, RC_RET_VOID);
        //     RC_IF_ERROR(level > deLog2Floor32(m_limits.maxTexture2DSize), gl.INVALID_VALUE, RC_RET_VOID);

        //     Texture2DArray* texture = unit.tex2DArrayBinding ? unit.tex2DArrayBinding : &unit.default2DArrayTex;

        //     if (texture->isImmutable())
        //     {
        //         RC_IF_ERROR(!texture->hasLevel(level), gl.INVALID_OPERATION, RC_RET_VOID);

        //         ConstPixelBufferAccess dst(texture->getLevel(level));
        //         RC_IF_ERROR(storageFmt != dst.getFormat() ||
        //                     width != dst.getWidth() ||
        //                     height != dst.getHeight() ||
        //                     depth != dst.getDepth(), gl.INVALID_OPERATION, RC_RET_VOID);
        //     }
        //     else
        //         texture->allocLevel(level, storageFmt, width, height, depth);

        //     if (unpackPtr)
        //     {
        //         ConstPixelBufferAccess src = getUnpack3DAccess(transferFmt, width, height, depth, unpackPtr);
        //         PixelBufferAccess dst (texture->getLevel(level));

        //         if (isDstFloatDepthFormat)
        //             sglrReferenceContext.depthValueFloatClampCopy(dst, src);
        //         else
        //             tcu::copy(dst, src);
        //     }
        //     else
        //     {
        //         // No data supplied, clear to black.
        //         PixelBufferAccess dst = texture->getLevel(level);
        //         tcu::clear(dst, Vec4(0.0f, 0.0f, 0.0f, 1.0f));
        //     }
        // }
        // else if (target == gl.TEXTURE_3D)
        // {
        //     // Validate size and level.
        //     RC_IF_ERROR(width > m_limits.maxTexture3DSize ||
        //                 height > m_limits.maxTexture3DSize ||
        //                 depth > m_limits.maxTexture3DSize, gl.INVALID_VALUE, RC_RET_VOID);
        //     RC_IF_ERROR(level > deLog2Floor32(m_limits.maxTexture3DSize), gl.INVALID_VALUE, RC_RET_VOID);

        //     Texture3D* texture = unit.tex3DBinding ? unit.tex3DBinding : &unit.default3DTex;

        //     if (texture->isImmutable())
        //     {
        //         RC_IF_ERROR(!texture->hasLevel(level), gl.INVALID_OPERATION, RC_RET_VOID);

        //         ConstPixelBufferAccess dst(texture->getLevel(level));
        //         RC_IF_ERROR(storageFmt != dst.getFormat() ||
        //                     width != dst.getWidth() ||
        //                     height != dst.getHeight() ||
        //                     depth != dst.getDepth(), gl.INVALID_OPERATION, RC_RET_VOID);
        //     }
        //     else
        //         texture->allocLevel(level, storageFmt, width, height, depth);

        //     if (unpackPtr)
        //     {
        //         ConstPixelBufferAccess src = getUnpack3DAccess(transferFmt, width, height, depth, unpackPtr);
        //         PixelBufferAccess dst (texture->getLevel(level));

        //         if (isDstFloatDepthFormat)
        //             sglrReferenceContext.depthValueFloatClampCopy(dst, src);
        //         else
        //             tcu::copy(dst, src);
        //     }
        //     else
        //     {
        //         // No data supplied, clear to black.
        //         PixelBufferAccess dst = texture->getLevel(level);
        //         tcu::clear(dst, Vec4(0.0f, 0.0f, 0.0f, 1.0f));
        //     }
        // }
        // else if (target == gl.TEXTURE_CUBE_MAP_ARRAY)
        // {
        //     // Validate size and level.
        //     RC_IF_ERROR(width != height ||
        //                 width > m_limits.maxTexture2DSize ||
        //                 depth % 6 != 0 ||
        //                 depth > m_limits.maxTexture2DArrayLayers, gl.INVALID_VALUE, RC_RET_VOID);
        //     RC_IF_ERROR(level > deLog2Floor32(m_limits.maxTexture2DSize), gl.INVALID_VALUE, RC_RET_VOID);

        //     TextureCubeArray* texture = unit.texCubeArrayBinding ? unit.texCubeArrayBinding : &unit.defaultCubeArrayTex;

        //     if (texture->isImmutable())
        //     {
        //         RC_IF_ERROR(!texture->hasLevel(level), gl.INVALID_OPERATION, RC_RET_VOID);

        //         ConstPixelBufferAccess dst(texture->getLevel(level));
        //         RC_IF_ERROR(storageFmt != dst.getFormat() ||
        //                     width != dst.getWidth() ||
        //                     height != dst.getHeight() ||
        //                     depth != dst.getDepth(), gl.INVALID_OPERATION, RC_RET_VOID);
        //     }
        //     else
        //         texture->allocLevel(level, storageFmt, width, height, depth);

        //     if (unpackPtr)
        //     {
        //         ConstPixelBufferAccess src = getUnpack3DAccess(transferFmt, width, height, depth, unpackPtr);
        //         PixelBufferAccess dst (texture->getLevel(level));

        //         if (isDstFloatDepthFormat)
        //             sglrReferenceContext.depthValueFloatClampCopy(dst, src);
        //         else
        //             tcu::copy(dst, src);
        //     }
        //     else
        //     {
        //         // No data supplied, clear to black.
        //         PixelBufferAccess dst = texture->getLevel(level);
        //         tcu::clear(dst, Vec4(0.0f, 0.0f, 0.0f, 1.0f));
        //     }
        // } /**/
        else
            this.setError(gl.INVALID_ENUM);
    };
});
