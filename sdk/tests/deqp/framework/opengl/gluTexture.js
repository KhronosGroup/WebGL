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

define(['framework/opengl/gluTextureUtil' , 'framework/common/tcuTexture', 'framework/common/tcuCompressedTexture', 'framework/delibs/debase/deMath'], function(gluTextureUtil, tcuTexture, tcuCompressedTexture, deMath) {
    'use strict';

var DE_ASSERT = function(x) {
    if (!x)
        throw new Error('Assert failed');
};
var DE_FALSE = false;

var Texture2D = function(gl, format, isCompressed, refTexture) {
    this.gl = gl;
    this.m_glTexture = gl.createTexture();
    this.m_isCompressed = isCompressed;
    this.m_format = format; // Internal format
    this.m_refTexture = refTexture;
};

Texture2D.prototype.getRefTexture = function() {
    return this.m_refTexture;
};

Texture2D.prototype.getGLTexture = function() {
    return this.m_glTexture;
};

var texture2DFromFormat = function(gl, format, dataType, width, height) {
    var tex = new Texture2D(gl, format, false, new tcuTexture.Texture2D(gluTextureUtil.mapGLTransferFormat(format, dataType), width, height));
    return tex;
};

var texture2DFromInternalFormat = function(gl, internalFormat, width, height) {
    var tex = new Texture2D(gl, internalFormat, false, new tcuTexture.Texture2D(gluTextureUtil.mapGLInternalFormat(internalFormat), width, height));
    return tex;
};

var computePixelStore = function(/*const tcu::TextureFormat&*/ format)
{
    var pixelSize = format.getPixelSize();
    if (deMath.deIsPowerOfTwo32(pixelSize))
        return Math.min(pixelSize, 8);
    else
        return 1;
};

var cubeFaceToGLFace = function(/*tcu::CubeFace*/ face)
{
    switch (face)
    {
        case tcuTexture.CubeFace.CUBEFACE_NEGATIVE_X: return gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
        case tcuTexture.CubeFace.CUBEFACE_POSITIVE_X: return gl.TEXTURE_CUBE_MAP_POSITIVE_X;
        case tcuTexture.CubeFace.CUBEFACE_NEGATIVE_Y: return gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
        case tcuTexture.CubeFace.CUBEFACE_POSITIVE_Y: return gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
        case tcuTexture.CubeFace.CUBEFACE_NEGATIVE_Z: return gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;
        case tcuTexture.CubeFace.CUBEFACE_POSITIVE_Z: return gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
    }
    throw new Error('Unrecognized face: ' + face);
};

Texture2D.prototype.upload = function() {
    DE_ASSERT(!this.m_isCompressed);

    if (this.m_glTexture == null)
        testFailedOptions('Failed to create GL texture', true);

    gl.bindTexture(gl.TEXTURE_2D, this.m_glTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, computePixelStore(this.m_refTexture.getFormat()));
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'Setting pixel store failed', false, true);

    var transferFormat = gluTextureUtil.getTransferFormat(this.m_refTexture.getFormat());

    for (var levelNdx = 0; levelNdx < this.m_refTexture.getNumLevels(); levelNdx++)
    {
        if (this.m_refTexture.isLevelEmpty(levelNdx))
            continue; // Don't upload.

        var access = this.m_refTexture.getLevel(levelNdx);
        DE_ASSERT(access.getRowPitch() == access.getFormat().getPixelSize() * access.getWidth());
        var data = access.getDataPtr();
        // console.log(data);
        // console.log('Level ' + levelNdx + ' format ' + this.m_format.toString(16) + ' transfer Format ' + transferFormat.format.toString(16) + ' datatype ' + transferFormat.dataType.toString(16));
        gl.texImage2D(gl.TEXTURE_2D, levelNdx, this.m_format, access.getWidth(), access.getHeight(), 0 /* border */, transferFormat.format, transferFormat.dataType, access.getDataPtr());
    }

    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'Texture upload failed', false, true);
};

var TextureCube = function(gl, format, isCompressed, refTexture) {
    Texture2D.call(this, gl, format, isCompressed, refTexture);
};

TextureCube.prototype = Object.create(Texture2D.prototype);
TextureCube.prototype.constructor = TextureCube;

TextureCube.prototype.upload = function() {
    DE_ASSERT(!this.m_isCompressed);

    if (this.m_glTexture == null)
        testFailedOptions('Failed to create GL texture', true);

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.m_glTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, computePixelStore(this.m_refTexture.getFormat()));
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'Setting pixel store failed', false, true);

    var transferFormat = gluTextureUtil.getTransferFormat(this.m_refTexture.getFormat());

    for (var face in tcuTexture.CubeFace)
    {
        for (var levelNdx = 0; levelNdx < this.m_refTexture.getNumLevels(); levelNdx++)
        {
            if (this.m_refTexture.isLevelEmpty(tcuTexture.CubeFace[face], levelNdx))
                continue; // Don't upload.

            /*tcu::ConstPixelBufferAccess*/ var access = this.m_refTexture.getLevelFace(levelNdx, tcuTexture.CubeFace[face]);
            DE_ASSERT(access.getRowPitch() == access.getFormat().getPixelSize() * access.getWidth());
            gl.texImage2D(cubeFaceToGLFace(tcuTexture.CubeFace[face]), levelNdx, this.m_format, access.getWidth(), access.getHeight(), 0 /* border */, transferFormat.format, transferFormat.dataType, access.getDataPtr());
        }
    }

    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'Texture upload failed', false, true);
};

var cubeFromFormat = function(gl, format, dataType, size) {
    var tex = new TextureCube(gl, format, false, new tcuTexture.TextureCube(gluTextureUtil.mapGLTransferFormat(format, dataType), size));
    return tex;
};

var cubeFromInternalFormat = function(gl, internalFormat, size) {
    var tex = new TextureCube(gl, internalFormat, false, new tcuTexture.TextureCube(gluTextureUtil.mapGLInternalFormat(internalFormat), size));
    return tex;
};

var Texture2DArray = function(gl, format, isCompressed, refTexture) {
    Texture2D.call(this, gl, format, isCompressed, refTexture);
};

Texture2DArray.prototype = Object.create(Texture2D.prototype);
Texture2DArray.prototype.constructor = Texture2DArray;

Texture2DArray.prototype.upload = function() {
    if (!gl.texImage3D)
        throw new Error('gl.TexImage3D() is not supported');

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.m_glTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, computePixelStore(this.m_refTexture.getFormat()));
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'Texture upload failed', false, true);

    var transferFormat = gluTextureUtil.getTransferFormat(this.m_refTexture.getFormat());

    for (var levelNdx = 0; levelNdx < this.m_refTexture.getNumLevels(); levelNdx++) {
        if (this.m_refTexture.isLevelEmpty(levelNdx))
            continue; // Don't upload.

        /*tcu::ConstPixelBufferAccess*/ var access = this.m_refTexture.getLevel(levelNdx);
        DE_ASSERT(access.getRowPitch() == access.getFormat().getPixelSize() * access.getWidth());
        DE_ASSERT(access.getSlicePitch() == access.getFormat().getPixelSize() * access.getWidth() * access.getHeight());
        gl.texImage3D(gl.TEXTURE_2D_ARRAY, levelNdx, this.m_format, access.getWidth(), access.getHeight(), access.getDepth(), 0 /* border */, transferFormat.format, transferFormat.dataType, access.getDataPtr());
    }

    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'Texture upload failed', false, true);
};

var texture2DArrayFromFormat = function(gl, format, dataType, width, height, numLayers) {
    var tex = new Texture2DArray(gl, format, false, new tcuTexture.Texture2DArray(gluTextureUtil.mapGLTransferFormat(format, dataType), width, height, numLayers));
    return tex;
};

var texture2DArrayFromInternalFormat = function(gl, internalFormat, width, height, numLayers) {
    var tex = new Texture2DArray(gl, internalFormat, false, new tcuTexture.Texture2DArray(gluTextureUtil.mapGLInternalFormat(internalFormat), width, height, numLayers));
    return tex;
};

var Texture3D = function(gl, format, isCompressed, refTexture) {
    Texture2D.call(this, gl, format, isCompressed, refTexture);
};

Texture3D.prototype = Object.create(Texture2D.prototype);
Texture3D.prototype.constructor = Texture3D;

Texture3D.prototype.upload = function() {
    if (!gl.texImage3D)
        throw new Error('gl.TexImage3D() is not supported');

    gl.bindTexture(gl.TEXTURE_3D, this.m_glTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, computePixelStore(this.m_refTexture.getFormat()));
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'Texture upload failed', false, true);

    var transferFormat = gluTextureUtil.getTransferFormat(this.m_refTexture.getFormat());

    for (var levelNdx = 0; levelNdx < this.m_refTexture.getNumLevels(); levelNdx++) {
        if (this.m_refTexture.isLevelEmpty(levelNdx))
            continue; // Don't upload.

        /*tcu::ConstPixelBufferAccess*/ var access = this.m_refTexture.getLevel(levelNdx);
        DE_ASSERT(access.getRowPitch() == access.getFormat().getPixelSize() * access.getWidth());
        DE_ASSERT(access.getSlicePitch() == access.getFormat().getPixelSize() * access.getWidth() * access.getHeight());
        gl.texImage3D(gl.TEXTURE_3D, levelNdx, this.m_format, access.getWidth(), access.getHeight(), access.getDepth(), 0 /* border */, transferFormat.format, transferFormat.dataType, access.getDataPtr());
    }

    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'Texture upload failed', false, true);
};

var texture3DFromFormat = function(gl, format, dataType, width, height, depth) {
    var tex = new Texture3D(gl, format, false, new tcuTexture.Texture3D(gluTextureUtil.mapGLTransferFormat(format, dataType), width, height, depth));
    return tex;
};

var texture3DFromInternalFormat = function(gl, internalFormat, width, height, depth) {
    var tex = new Texture3D(gl, internalFormat, false, new tcuTexture.Texture3D(gluTextureUtil.mapGLInternalFormat(internalFormat), width, height, depth));
    return tex;
};

var Compressed2D = function(gl, format, isCompressed, refTexture) {
    Texture2D.call(this, gl, format, isCompressed, refTexture);
};

Compressed2D.prototype = Object.create(Texture2D.prototype);
Compressed2D.prototype.constructor = Compressed2D;

Compressed2D.prototype.upload = function(level, source) {
    DE_ASSERT(this.m_isCompressed);

    if (this.m_glTexture == null)
        testFailedOptions('Failed to create GL texture', true);

    gl.bindTexture(gl.TEXTURE_2D, this.m_glTexture);

    gl.compressedTexImage2D(gl.TEXTURE_2D, level, this.m_format, source.m_width, source.m_height, 0 /* border */, source.m_data);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'Texture upload failed', false, true);
};

var CompressedCube = function(gl, format, isCompressed, refTexture) {
    Texture2D.call(this, gl, format, isCompressed, refTexture);
};

CompressedCube.prototype = Object.create(Texture2D.prototype);
CompressedCube.prototype.constructor = CompressedCube;

CompressedCube.prototype.upload = function(level, source) {
    DE_ASSERT(this.m_isCompressed);

    if (this.m_glTexture == null)
        testFailedOptions('Failed to create GL texture', true);

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.m_glTexture);

    for (var face in tcuTexture.CubeFace) {

        // Upload to GL texture in compressed form.
        gl.compressedTexImage2D(cubeFaceToGLFace(tcuTexture.CubeFace[face]), 0, this.m_format,
                                source.m_width, source.m_height, 0 /* border */, source.m_data);
        assertMsgOptions(gl.getError() === gl.NO_ERROR, 'Texture upload failed', false, true);
    }

};

var compressed2DFromInternalFormat = function(gl, format, width, height, compressed) {
    var tex = new Compressed2D(gl, gluTextureUtil.getGLFormat(format), true, new tcuTexture.Texture2D(compressed.getUncompressedFormat(), width, height));
    tex.m_refTexture.allocLevel(0);
    compressed.decompress(tex.m_refTexture.getLevel(0));
    tex.upload(0, compressed);
    return tex;
};

var compressedCubeFromInternalFormat = function(gl, format, size, compressed) {
    var tex = new CompressedCube(gl, gluTextureUtil.getGLFormat(format), true, new tcuTexture.TextureCube(compressed.getUncompressedFormat(), size));
    for (var face in tcuTexture.CubeFace) {
        tex.m_refTexture.allocLevel(tcuTexture.CubeFace[face], 0);

        /*tcu::ConstPixelBufferAccess*/ var access = tex.m_refTexture.getLevelFace(0, tcuTexture.CubeFace[face]);
        DE_ASSERT(access.getRowPitch() == access.getFormat().getPixelSize() * access.getWidth());
        compressed.decompress(access);
    }
    tex.upload(0, compressed);
    return tex;
};

return {
    Texture2D: Texture2D,
    TextureCube: TextureCube,
    Texture2DArray: Texture2DArray,
    Texture3D: Texture3D,
    texture2DFromFormat: texture2DFromFormat,
    texture2DFromInternalFormat: texture2DFromInternalFormat,
    cubeFromFormat: cubeFromFormat,
    cubeFromInternalFormat: cubeFromInternalFormat,
    texture2DArrayFromFormat: texture2DArrayFromFormat,
    texture2DArrayFromInternalFormat: texture2DArrayFromInternalFormat,
    texture3DFromFormat: texture3DFromFormat,
    texture3DFromInternalFormat: texture3DFromInternalFormat,
    compressed2DFromInternalFormat: compressed2DFromInternalFormat,
    compressedCubeFromInternalFormat: compressedCubeFromInternalFormat
};

});
