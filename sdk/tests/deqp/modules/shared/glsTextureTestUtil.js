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

define(['framework/opengl/gluDrawUtil', 'framework/opengl/gluShaderProgram', 'framework/common/tcuTexture', 'framework/opengl/gluShaderUtil', 'framework/common/tcuStringTemplate', 'framework/delibs/debase/deMath', 'framework/common/tcuImageCompare'],
    function(deqpDraw, gluShaderProgram, tcuTexture, gluShaderUtil, tcuStringTemplate, deMath, tcuImageCompare) {
    'use strict';
var DE_ASSERT = function(x) {
    if (!x)
        throw new Error('Assert failed');
};
var GLU_EXPECT_NO_ERROR = function(error, message) {
    assertMsgOptions(error === gl.NONE, message, false, true);
};

/**
 * @enum
 */
var textureType = {
    TEXTURETYPE_2D: 0,
    TEXTURETYPE_CUBE: 1,
    TEXTURETYPE_2D_ARRAY: 2,
    TEXTURETYPE_3D: 3,
    TEXTURETYPE_CUBE_ARRAY: 4,
    TEXTURETYPE_1D: 5,
    TEXTURETYPE_1D_ARRAY: 6,
    TEXTURETYPE_BUFFER: 7
};

/**
 * @enum
 */
var samplerType = {
    SAMPLERTYPE_FLOAT: 0,
    SAMPLERTYPE_INT: 1,
    SAMPLERTYPE_UINT: 2,
    SAMPLERTYPE_SHADOW: 3,

    SAMPLERTYPE_FETCH_FLOAT: 4,
    SAMPLERTYPE_FETCH_INT: 5,
    SAMPLERTYPE_FETCH_UINT: 6
};

/**
 * @param {tcuTexture.TextureFormat} format
 * @return {samplerType}
 */
var getSamplerType = function(format) {
    if (format == null)
        throw new Error('Missing format information');

    switch (format.type) {
        case tcuTexture.ChannelType.SIGNED_INT8:
        case tcuTexture.ChannelType.SIGNED_INT16:
        case tcuTexture.ChannelType.SIGNED_INT32:
            return samplerType.SAMPLERTYPE_INT;

        case tcuTexture.ChannelType.UNSIGNED_INT8:
        case tcuTexture.ChannelType.UNSIGNED_INT32:
        case tcuTexture.ChannelType.UNSIGNED_INT_1010102_REV:
            return samplerType.SAMPLERTYPE_UINT;

        // Texture formats used in depth/stencil textures.
        case tcuTexture.ChannelType.UNSIGNED_INT16:
        case tcuTexture.ChannelType.UNSIGNED_INT_24_8:
            return (format.order == tcuTexture.ChannelOrder.D || format.order == tcuTexture.ChannelOrder.DS) ? samplerType.SAMPLERTYPE_FLOAT : samplerType.SAMPLERTYPE_UINT;

        default:
            return samplerType.SAMPLERTYPE_FLOAT;
    }
};

/**
 * @constructor
 * @param {canvas} canvas
 * @param {Number} preferredWidth
 * @param {Number} preferredHeight
 * @param {Number} seed
 */
var RandomViewport = function(canvas, preferredWidth, preferredHeight, seed) {
    this.x = 0;
    this.y = 0;
    this.width = Math.min(canvas.width, preferredWidth);
    this.height = Math.min(canvas.height, preferredHeight);
    /* TODO: Implement 'randomness' */
};

/**
 * @constructor
 * @param {textureType} texType
 */
var RenderParams = function(texType) {
    this.flags = {
        projected: false,
        use_bias: false,
        log_programs: false,
        log_uniforms: false
    };
    this.texType = texType;
    this.w = [1, 1, 1, 1];
    this.bias = 0;
    this.ref = 0;
    this.colorScale = [1, 1, 1, 1];
    this.colorBias = [0, 0, 0, 0];
    this.samplerType = samplerType.SAMPLERTYPE_FLOAT;
};

/**
 * @enum
 */
var lodMode = {
    EXACT: 0,        //!< Ideal lod computation.
    MIN_BOUND: 1,        //!< Use estimation range minimum bound.
    MAX_BOUND: 2        //!< Use estimation range maximum bound.

};

/**
 * @constructor
 * @extends {RenderParams}
 * @param {textureType} texType
 * @param {tcuTexture.Sampler} sampler
 * @param {lodMode} lodMode_
 */
var ReferenceParams = function(texType, sampler, lodMode_) {
    RenderParams.call(this, texType);
    if (sampler)
        this.sampler = sampler;
    if (lodMode_)
        this.lodMode = lodMode_;
    else
        this.lodMode = lodMode.EXACT;
    this.minLod = -1000;
    this.maxLod = 1000;
    this.baseLevel = 0;
    this.maxLevel = 1000;
};

ReferenceParams.prototype = Object.create(RenderParams.prototype);
ReferenceParams.prototype.constructor = ReferenceParams;

/**
 * @param {Array<Number>} bottomLeft
 * @param {Array<Number>} topRight
 * @return {Array<Number>}
 */
var computeQuadTexCoord2D = function(bottomLeft, topRight)
{
    var dst = [];
    dst.length = 4 * 2;

    dst[0] = bottomLeft[0]; dst[1] = bottomLeft[1];
    dst[2] = bottomLeft[0]; dst[3] = topRight[1];
    dst[4] = topRight[0]; dst[5] = bottomLeft[1];
    dst[6] = topRight[0]; dst[7] = topRight[1];

    return dst;
};

/**
 * @param {tcuTexture.CubeFace} face
 * @return {Array<Number>}
 */
var computeQuadTexCoordCube = function(face) {
    var texCoordNegX = [
        -1, 1, -1,
        -1, -1, -1,
        -1, 1, 1,
        -1, -1, 1
    ];
    var texCoordPosX = [
        +1, 1, 1,
        +1, -1, 1,
        +1, 1, -1,
        +1, -1, -1
    ];
    var texCoordNegY = [
        -1, -1, 1,
        -1, -1, -1,
         1, -1, 1,
         1, -1, -1
    ];
    var texCoordPosY = [
        -1, +1, -1,
        -1, +1, 1,
         1, +1, -1,
         1, +1, 1
    ];
    var texCoordNegZ = [
         1, 1, -1,
         1, -1, -1,
        -1, 1, -1,
        -1, -1, -1
    ];
    var texCoordPosZ = [
        -1, 1, +1,
        -1, -1, +1,
         1, 1, +1,
         1, -1, +1
    ];

    switch (face) {
        case tcuTexture.CubeFace.CUBEFACE_NEGATIVE_X: return texCoordNegX;
        case tcuTexture.CubeFace.CUBEFACE_POSITIVE_X: return texCoordPosX;
        case tcuTexture.CubeFace.CUBEFACE_NEGATIVE_Y: return texCoordNegY;
        case tcuTexture.CubeFace.CUBEFACE_POSITIVE_Y: return texCoordPosY;
        case tcuTexture.CubeFace.CUBEFACE_NEGATIVE_Z: return texCoordNegZ;
        case tcuTexture.CubeFace.CUBEFACE_POSITIVE_Z: return texCoordPosZ;
    }
    throw new Error('Unrecognized face ' + face);
};

/**
 * @param {Number} layerNdx
 * @param {Array<Number>} bottomLeft
 * @param {Array<Number>} topRight
 * @return {Array<Number>}
 */
var computeQuadTexCoord2DArray = function(layerNdx, bottomLeft, topRight) {
    var dst = [];
    dst.length = 4 * 3;

    dst[0] = bottomLeft[0]; dst[1] = bottomLeft[1]; dst[2] = layerNdx;
    dst[3] = bottomLeft[0]; dst[4] = topRight[1]; dst[5] = layerNdx;
    dst[6] = topRight[0]; dst[7] = bottomLeft[1]; dst[8] = layerNdx;
    dst[9] = topRight[0]; dst[10] = topRight[1]; dst[11] = layerNdx;

    return dst;
};

/**
 * @param {Array<Number>} a
 * @param {Array<Number>} b
 * @param {Array<Number>} c
 * @return {Array<Number>} a + (b - a) * c
 */
var selectCoords = function(a, b, c) {
    var x1 = deMath.subtract(b, a);
    var x2 = deMath.multiply(x1, c);
    var x3 = deMath.add(a, x2);
    return x3;
};

/**
 * @param {Array<Number>} p0
 * @param {Array<Number>} p1
 * @param {Array<Number>} dirSwz
 * @return {Array<Number>}
 */
var computeQuadTexCoord3D = function(p0, p1, dirSwz) {
    var dst = [];
    dst.length = 4 * 3;

    var f0 = deMath.swizzle(([0, 0, 0]), [dirSwz[0], dirSwz[1], dirSwz[2]]);
    var f1 = deMath.swizzle(([0, 1, 0]), [dirSwz[0], dirSwz[1], dirSwz[2]]);
    var f2 = deMath.swizzle(([1, 0, 0]), [dirSwz[0], dirSwz[1], dirSwz[2]]);
    var f3 = deMath.swizzle(([1, 1, 0]), [dirSwz[0], dirSwz[1], dirSwz[2]]);

    var v0 = selectCoords(p0, p1, f0);
    var v1 = selectCoords(p0, p1, f1);
    var v2 = selectCoords(p0, p1, f2);
    var v3 = selectCoords(p0, p1, f3);

    dst[0] = v0[0]; dst[1] = v0[1]; dst[2] = v0[2];
    dst[3] = v1[0]; dst[4] = v1[1]; dst[5] = v1[2];
    dst[6] = v2[0]; dst[7] = v2[1]; dst[8] = v2[2];
    dst[9] = v3[0]; dst[10] = v3[1]; dst[11] = v3[2];

    return dst;
};

/**
 * @enum
 */
var programType = {
    PROGRAM_2D_FLOAT: 0,
    PROGRAM_2D_INT: 1,
    PROGRAM_2D_UINT: 2,
    PROGRAM_2D_SHADOW: 3,

    PROGRAM_2D_FLOAT_BIAS: 4,
    PROGRAM_2D_INT_BIAS: 5,
    PROGRAM_2D_UINT_BIAS: 6,
    PROGRAM_2D_SHADOW_BIAS: 7,

    PROGRAM_1D_FLOAT: 8,
    PROGRAM_1D_INT: 9,
    PROGRAM_1D_UINT: 10,
    PROGRAM_1D_SHADOW: 11,

    PROGRAM_1D_FLOAT_BIAS: 12,
    PROGRAM_1D_INT_BIAS: 13,
    PROGRAM_1D_UINT_BIAS: 14,
    PROGRAM_1D_SHADOW_BIAS: 15,

    PROGRAM_CUBE_FLOAT: 16,
    PROGRAM_CUBE_INT: 17,
    PROGRAM_CUBE_UINT: 18,
    PROGRAM_CUBE_SHADOW: 19,

    PROGRAM_CUBE_FLOAT_BIAS: 20,
    PROGRAM_CUBE_INT_BIAS: 21,
    PROGRAM_CUBE_UINT_BIAS: 22,
    PROGRAM_CUBE_SHADOW_BIAS: 23,

    PROGRAM_1D_ARRAY_FLOAT: 24,
    PROGRAM_1D_ARRAY_INT: 25,
    PROGRAM_1D_ARRAY_UINT: 26,
    PROGRAM_1D_ARRAY_SHADOW: 27,

    PROGRAM_2D_ARRAY_FLOAT: 28,
    PROGRAM_2D_ARRAY_INT: 29,
    PROGRAM_2D_ARRAY_UINT: 30,
    PROGRAM_2D_ARRAY_SHADOW: 31,

    PROGRAM_3D_FLOAT: 32,
    PROGRAM_3D_INT: 33,
    PROGRAM_3D_UINT: 34,

    PROGRAM_3D_FLOAT_BIAS: 35,
    PROGRAM_3D_INT_BIAS: 36,
    PROGRAM_3D_UINT_BIAS: 37,

    PROGRAM_CUBE_ARRAY_FLOAT: 38,
    PROGRAM_CUBE_ARRAY_INT: 39,
    PROGRAM_CUBE_ARRAY_UINT: 40,
    PROGRAM_CUBE_ARRAY_SHADOW: 41,

    PROGRAM_BUFFER_FLOAT: 42,
    PROGRAM_BUFFER_INT: 43,
    PROGRAM_BUFFER_UINT: 44
};

/**
 * @constructor
 * @param {string} version GL version
 * @param {gluShaderUtil.precision} precision
 */
var ProgramLibrary = function(version, precision) {
    this.m_glslVersion = version;
    this.m_texCoordPrecision = precision;
};

/**
 * @param {programType} program
 * @return {gluShaderProgram.ShaderProgram}
 */
ProgramLibrary.prototype.getProgram = function(program) {
    /* TODO: Implement */
    // if (m_programs.find(program) != m_programs.end())
    //     return m_programs[program]; // Return from cache.

    var vertShaderTemplate =
        '${VTX_HEADER}' +
        '${VTX_IN} highp vec4 a_position;\n' +
        '${VTX_IN} ${PRECISION} ${TEXCOORD_TYPE} a_texCoord;\n' +
        '${VTX_OUT} ${PRECISION} ${TEXCOORD_TYPE} v_texCoord;\n' +
        '\n' +
        'void main (void)\n' +
        '{\n' +
        '    gl_Position = a_position;\n' +
        '    v_texCoord = a_texCoord;\n' +
        '}\n';
    var fragShaderTemplate =
        '${FRAG_HEADER}' +
        '${FRAG_IN} ${PRECISION} ${TEXCOORD_TYPE} v_texCoord;\n' +
        'uniform ${PRECISION} float u_bias;\n' +
        'uniform ${PRECISION} float u_ref;\n' +
        'uniform ${PRECISION} vec4 u_colorScale;\n' +
        'uniform ${PRECISION} vec4 u_colorBias;\n' +
        'uniform ${PRECISION} ${SAMPLER_TYPE} u_sampler;\n' +
        '\n' +
        'void main (void)\n' +
        '{\n' +
        '    ${FRAG_COLOR} = ${LOOKUP} * u_colorScale + u_colorBias;\n' +
        '}\n';

    var params = [];

    var isCube = deMath.deInRange32(program, programType.PROGRAM_CUBE_FLOAT, programType.PROGRAM_CUBE_SHADOW_BIAS);
    var isArray = deMath.deInRange32(program, programType.PROGRAM_2D_ARRAY_FLOAT, programType.PROGRAM_2D_ARRAY_SHADOW)
                            || deMath.deInRange32(program, programType.PROGRAM_1D_ARRAY_FLOAT, programType.PROGRAM_1D_ARRAY_SHADOW);

    var is1D = deMath.deInRange32(program, programType.PROGRAM_1D_FLOAT, programType.PROGRAM_1D_UINT_BIAS)
                            || deMath.deInRange32(program, programType.PROGRAM_1D_ARRAY_FLOAT, programType.PROGRAM_1D_ARRAY_SHADOW)
                            || deMath.deInRange32(program, programType.PROGRAM_BUFFER_FLOAT, programType.PROGRAM_BUFFER_UINT);

    var is2D = deMath.deInRange32(program, programType.PROGRAM_2D_FLOAT, programType.PROGRAM_2D_UINT_BIAS)
                            || deMath.deInRange32(program, programType.PROGRAM_2D_ARRAY_FLOAT, programType.PROGRAM_2D_ARRAY_SHADOW);

    var is3D = deMath.deInRange32(program, programType.PROGRAM_3D_FLOAT, programType.PROGRAM_3D_UINT_BIAS);
    var isCubeArray = deMath.deInRange32(program, programType.PROGRAM_CUBE_ARRAY_FLOAT, programType.PROGRAM_CUBE_ARRAY_SHADOW);
    var isBuffer = deMath.deInRange32(program, programType.PROGRAM_BUFFER_FLOAT, programType.PROGRAM_BUFFER_UINT);

    if (this.m_glslVersion == '100 es') {
        params['FRAG_HEADER'] =  '';
        params['VTX_HEADER'] =  '';
        params['VTX_IN'] =  'attribute';
        params['VTX_OUT'] =  'varying';
        params['FRAG_IN'] =  'varying';
        params['FRAG_COLOR'] =  'gl_FragColor';
    } else if (this.m_glslVersion == '300 es' || this.m_glslVersion == '310 es' || this.m_glslVersion == '330') {
        var ext = null;

        // if (isCubeArray && glu::glslVersionIsES(m_glslVersion))
        //     ext = "GL_EXT_texture_cube_map_array";
        // else if (isBuffer && glu::glslVersionIsES(m_glslVersion))
        //     ext = "GL_EXT_texture_buffer";

        var extension = '';
        if (ext)
            extension = '\n#extension ' + ext + ' : require';

        params['FRAG_HEADER'] =  '#version ' + this.m_glslVersion + extension + '\nlayout(location = 0) out mediump vec4 dEQP_FragColor;\n';
        params['VTX_HEADER'] =  '#version ' + this.m_glslVersion + '\n';
        params['VTX_IN'] =  'in';
        params['VTX_OUT'] =  'out';
        params['FRAG_IN'] =  'in';
        params['FRAG_COLOR'] =  'dEQP_FragColor';
    } else
        throw new Error('Unsupported version: ' + this.m_glslVersion);

    params['PRECISION'] =  gluShaderUtil.getPrecisionName(this.m_texCoordPrecision);

    if (isCubeArray)
        params['TEXCOORD_TYPE'] =  'vec4';
    else if (isCube || (is2D && isArray) || is3D)
        params['TEXCOORD_TYPE'] =  'vec3';
    else if ((is1D && isArray) || is2D)
        params['TEXCOORD_TYPE'] =  'vec2';
    else if (is1D)
        params['TEXCOORD_TYPE'] =  'float';
    else
        DE_ASSERT(false);

    var sampler = null;
    var lookup = null;

    if (this.m_glslVersion == '300 es' || this.m_glslVersion == '310 es' || this.m_glslVersion == '330') {
        switch (program) {
            case programType.PROGRAM_2D_FLOAT: sampler = 'sampler2D'; lookup = 'texture(u_sampler, v_texCoord)'; break;
            case programType.PROGRAM_2D_INT: sampler = 'isampler2D'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_2D_UINT: sampler = 'usampler2D'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_2D_SHADOW: sampler = 'sampler2DShadow'; lookup = 'vec4(texture(u_sampler, vec3(v_texCoord, u_ref)), 0.0, 0.0, 1.0)'; break;
            case programType.PROGRAM_2D_FLOAT_BIAS: sampler = 'sampler2D'; lookup = 'texture(u_sampler, v_texCoord, u_bias)'; break;
            case programType.PROGRAM_2D_INT_BIAS: sampler = 'isampler2D'; lookup = 'vec4(texture(u_sampler, v_texCoord, u_bias))'; break;
            case programType.PROGRAM_2D_UINT_BIAS: sampler = 'usampler2D'; lookup = 'vec4(texture(u_sampler, v_texCoord, u_bias))'; break;
            case programType.PROGRAM_2D_SHADOW_BIAS: sampler = 'sampler2DShadow'; lookup = 'vec4(texture(u_sampler, vec3(v_texCoord, u_ref), u_bias), 0.0, 0.0, 1.0)'; break;
            case programType.PROGRAM_1D_FLOAT: sampler = 'sampler1D'; lookup = 'texture(u_sampler, v_texCoord)'; break;
            case programType.PROGRAM_1D_INT: sampler = 'isampler1D'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_1D_UINT: sampler = 'usampler1D'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_1D_SHADOW: sampler = 'sampler1DShadow'; lookup = 'vec4(texture(u_sampler, vec3(v_texCoord, u_ref)), 0.0, 0.0, 1.0)'; break;
            case programType.PROGRAM_1D_FLOAT_BIAS: sampler = 'sampler1D'; lookup = 'texture(u_sampler, v_texCoord, u_bias)'; break;
            case programType.PROGRAM_1D_INT_BIAS: sampler = 'isampler1D'; lookup = 'vec4(texture(u_sampler, v_texCoord, u_bias))'; break;
            case programType.PROGRAM_1D_UINT_BIAS: sampler = 'usampler1D'; lookup = 'vec4(texture(u_sampler, v_texCoord, u_bias))'; break;
            case programType.PROGRAM_1D_SHADOW_BIAS: sampler = 'sampler1DShadow'; lookup = 'vec4(texture(u_sampler, vec3(v_texCoord, u_ref), u_bias), 0.0, 0.0, 1.0)'; break;
            case programType.PROGRAM_CUBE_FLOAT: sampler = 'samplerCube'; lookup = 'texture(u_sampler, v_texCoord)'; break;
            case programType.PROGRAM_CUBE_INT: sampler = 'isamplerCube'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_CUBE_UINT: sampler = 'usamplerCube'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_CUBE_SHADOW: sampler = 'samplerCubeShadow'; lookup = 'vec4(texture(u_sampler, vec4(v_texCoord, u_ref)), 0.0, 0.0, 1.0)'; break;
            case programType.PROGRAM_CUBE_FLOAT_BIAS: sampler = 'samplerCube'; lookup = 'texture(u_sampler, v_texCoord, u_bias)'; break;
            case programType.PROGRAM_CUBE_INT_BIAS: sampler = 'isamplerCube'; lookup = 'vec4(texture(u_sampler, v_texCoord, u_bias))'; break;
            case programType.PROGRAM_CUBE_UINT_BIAS: sampler = 'usamplerCube'; lookup = 'vec4(texture(u_sampler, v_texCoord, u_bias))'; break;
            case programType.PROGRAM_CUBE_SHADOW_BIAS: sampler = 'samplerCubeShadow'; lookup = 'vec4(texture(u_sampler, vec4(v_texCoord, u_ref), u_bias), 0.0, 0.0, 1.0)'; break;
            case programType.PROGRAM_2D_ARRAY_FLOAT: sampler = 'sampler2DArray'; lookup = 'texture(u_sampler, v_texCoord)'; break;
            case programType.PROGRAM_2D_ARRAY_INT: sampler = 'isampler2DArray'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_2D_ARRAY_UINT: sampler = 'usampler2DArray'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_2D_ARRAY_SHADOW: sampler = 'sampler2DArrayShadow'; lookup = 'vec4(texture(u_sampler, vec4(v_texCoord, u_ref)), 0.0, 0.0, 1.0)'; break;
            case programType.PROGRAM_3D_FLOAT: sampler = 'sampler3D'; lookup = 'texture(u_sampler, v_texCoord)'; break;
            case programType.PROGRAM_3D_INT: sampler = 'isampler3D'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_3D_UINT: sampler = ' usampler3D'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_3D_FLOAT_BIAS: sampler = 'sampler3D'; lookup = 'texture(u_sampler, v_texCoord, u_bias)'; break;
            case programType.PROGRAM_3D_INT_BIAS: sampler = 'isampler3D'; lookup = 'vec4(texture(u_sampler, v_texCoord, u_bias))'; break;
            case programType.PROGRAM_3D_UINT_BIAS: sampler = ' usampler3D'; lookup = 'vec4(texture(u_sampler, v_texCoord, u_bias))'; break;
            case programType.PROGRAM_CUBE_ARRAY_FLOAT: sampler = 'samplerCubeArray'; lookup = 'texture(u_sampler, v_texCoord)'; break;
            case programType.PROGRAM_CUBE_ARRAY_INT: sampler = 'isamplerCubeArray'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_CUBE_ARRAY_UINT: sampler = 'usamplerCubeArray'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_CUBE_ARRAY_SHADOW: sampler = 'samplerCubeArrayShadow'; lookup = 'vec4(texture(u_sampler, vec4(v_texCoord, u_ref)), 0.0, 0.0, 1.0)'; break;
            case programType.PROGRAM_1D_ARRAY_FLOAT: sampler = 'sampler1DArray'; lookup = 'texture(u_sampler, v_texCoord)'; break;
            case programType.PROGRAM_1D_ARRAY_INT: sampler = 'isampler1DArray'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_1D_ARRAY_UINT: sampler = 'usampler1DArray'; lookup = 'vec4(texture(u_sampler, v_texCoord))'; break;
            case programType.PROGRAM_1D_ARRAY_SHADOW: sampler = 'sampler1DArrayShadow'; lookup = 'vec4(texture(u_sampler, vec4(v_texCoord, u_ref)), 0.0, 0.0, 1.0)'; break;
            case programType.PROGRAM_BUFFER_FLOAT: sampler = 'samplerBuffer'; lookup = 'texelFetch(u_sampler, int(v_texCoord))'; break;
            case programType.PROGRAM_BUFFER_INT: sampler = 'isamplerBuffer'; lookup = 'vec4(texelFetch(u_sampler, int(v_texCoord)))'; break;
            case programType.PROGRAM_BUFFER_UINT: sampler = 'usamplerBuffer'; lookup = 'vec4(texelFetch(u_sampler, int(v_texCoord)))'; break;
            default:
                DE_ASSERT(false);
        }
    } else if (this.m_glslVersion == '100 es') {
        sampler = isCube ? 'samplerCube' : 'sampler2D';

        switch (program) {
            case programType.PROGRAM_2D_FLOAT: lookup = 'texture2D(u_sampler, v_texCoord)'; break;
            case programType.PROGRAM_2D_FLOAT_BIAS: lookup = 'texture2D(u_sampler, v_texCoord, u_bias)'; break;
            case programType.PROGRAM_CUBE_FLOAT: lookup = 'textureCube(u_sampler, v_texCoord)'; break;
            case programType.PROGRAM_CUBE_FLOAT_BIAS: lookup = 'textureCube(u_sampler, v_texCoord, u_bias)'; break;
            default:
                DE_ASSERT(false);
        }
    } else
        DE_ASSERT(!'Unsupported version');

    params['SAMPLER_TYPE'] =  sampler;
    params['LOOKUP'] =  lookup;

    var vertSrc = tcuStringTemplate.specialize(vertShaderTemplate, params);
    var fragSrc = tcuStringTemplate.specialize(fragShaderTemplate, params);
    // console.log(fragSrc);
    // console.log(vertSrc);
    var sources = [];
    sources.push(gluShaderProgram.genVertexSource(vertSrc));
    sources.push(gluShaderProgram.genFragmentSource(fragSrc));
    var programSources = {
        sources: sources
    };
    var progObj = new gluShaderProgram.ShaderProgram(gl, programSources);
    // if (!progObj.isOk()) {
    //     // log << *progObj;
    //     testFailedOptions("Failed to create shader", true);
    // }

    // try
    // {
    //     m_programs[program] =  progObj;
    // }
    // catch (...)
    // {
    //     delete progObj;
    //     throw;
    // }

    return progObj;
};

// public:
//                                             ProgramLibrary            (const glu::RenderContext& context, tcu::TestContext& testCtx, glu::GLSLVersion glslVersion, glu::Precision texCoordPrecision);
//                                             ~ProgramLibrary            (void);

//     glu::ShaderProgram*                        getProgram                (Program program);
//     void                                    clear                    (void);

// private:
//                                             ProgramLibrary            (const ProgramLibrary& other);
//     ProgramLibrary&                            operator=                (const ProgramLibrary& other);

//     const glu::RenderContext&                m_context;
//     tcu::TestContext&                        m_testCtx;
//     glu::GLSLVersion                        m_glslVersion;
//     glu::Precision                            m_texCoordPrecision;
//     std::map<Program, glu::ShaderProgram*>    m_programs;
// };


/**
 * @constructor
 * @param {string} version GL version
 * @param {gluShaderUtil.precision} precision
 */
var TextureRenderer = function(version,  precision) {
    this.m_programLibrary = new ProgramLibrary(version, precision);
};

/**
 * @param {Number} texUnit
 * @param {Array<Number>} texCoord
 * @param {RenderParams} params
 */
TextureRenderer.prototype.renderQuad = function(texUnit, texCoord, params) {
    var wCoord = params.flags.projected ? params.w : [1, 1, 1, 1];
    var useBias = params.flags.use_bias;
    var logUniforms = params.flags.log_uniforms;

    // Render quad with texture.
    var position = [
        -1 * wCoord[0], -1 * wCoord[0], 0, wCoord[0],
        -1 * wCoord[1], +1 * wCoord[1], 0, wCoord[1],
        +1 * wCoord[2], -1 * wCoord[2], 0, wCoord[2],
        +1 * wCoord[3], +1 * wCoord[3], 0, wCoord[3]
    ];
    /** @const */ var indices = [0, 1, 2, 2, 1, 3];

    /** @type {programType} */ var progSpec = undefined;
    var numComps = 0;
    if (params.texType == textureType.TEXTURETYPE_2D) {
        numComps = 2;

        switch (params.samplerType) {
            case samplerType.SAMPLERTYPE_FLOAT: progSpec = useBias ? programType.PROGRAM_2D_FLOAT_BIAS : programType.PROGRAM_2D_FLOAT; break;
            case samplerType.SAMPLERTYPE_INT: progSpec = useBias ? programType.PROGRAM_2D_INT_BIAS : programType.PROGRAM_2D_INT; break;
            case samplerType.SAMPLERTYPE_UINT: progSpec = useBias ? programType.PROGRAM_2D_UINT_BIAS : programType.PROGRAM_2D_UINT; break;
            case samplerType.SAMPLERTYPE_SHADOW: progSpec = useBias ? programType.PROGRAM_2D_SHADOW_BIAS : programType.PROGRAM_2D_SHADOW; break;
            default: DE_ASSERT(false);
        }
    } else if (params.texType == textureType.TEXTURETYPE_1D) {
        numComps = 1;

        switch (params.samplerType) {
            case samplerType.SAMPLERTYPE_FLOAT: progSpec = useBias ? programType.PROGRAM_1D_FLOAT_BIAS : programType.PROGRAM_1D_FLOAT; break;
            case samplerType.SAMPLERTYPE_INT: progSpec = useBias ? programType.PROGRAM_1D_INT_BIAS : programType.PROGRAM_1D_INT; break;
            case samplerType.SAMPLERTYPE_UINT: progSpec = useBias ? programType.PROGRAM_1D_UINT_BIAS : programType.PROGRAM_1D_UINT; break;
            case samplerType.SAMPLERTYPE_SHADOW: progSpec = useBias ? programType.PROGRAM_1D_SHADOW_BIAS : programType.PROGRAM_1D_SHADOW; break;
            default: DE_ASSERT(false);
        }
    } else if (params.texType == textureType.TEXTURETYPE_CUBE) {
        numComps = 3;

        switch (params.samplerType) {
            case samplerType.SAMPLERTYPE_FLOAT: progSpec = useBias ? programType.PROGRAM_CUBE_FLOAT_BIAS : programType.PROGRAM_CUBE_FLOAT; break;
            case samplerType.SAMPLERTYPE_INT: progSpec = useBias ? programType.PROGRAM_CUBE_INT_BIAS : programType.PROGRAM_CUBE_INT; break;
            case samplerType.SAMPLERTYPE_UINT: progSpec = useBias ? programType.PROGRAM_CUBE_UINT_BIAS : programType.PROGRAM_CUBE_UINT; break;
            case samplerType.SAMPLERTYPE_SHADOW: progSpec = useBias ? programType.PROGRAM_CUBE_SHADOW_BIAS : programType.PROGRAM_CUBE_SHADOW; break;
            default: DE_ASSERT(false);
        }
    } else if (params.texType == textureType.TEXTURETYPE_3D) {
        numComps = 3;

        switch (params.samplerType) {
            case samplerType.SAMPLERTYPE_FLOAT: progSpec = useBias ? programType.PROGRAM_3D_FLOAT_BIAS : programType.PROGRAM_3D_FLOAT; break;
            case samplerType.SAMPLERTYPE_INT: progSpec = useBias ? programType.PROGRAM_3D_INT_BIAS : programType.PROGRAM_3D_INT; break;
            case samplerType.SAMPLERTYPE_UINT: progSpec = useBias ? programType.PROGRAM_3D_UINT_BIAS : programType.PROGRAM_3D_UINT; break;
            default: DE_ASSERT(false);
        }
    } else if (params.texType == textureType.TEXTURETYPE_2D_ARRAY) {
        DE_ASSERT(!useBias); // \todo [2012-02-17 pyry] Support bias.

        numComps = 3;

        switch (params.samplerType) {
            case samplerType.SAMPLERTYPE_FLOAT: progSpec = programType.PROGRAM_2D_ARRAY_FLOAT; break;
            case samplerType.SAMPLERTYPE_INT: progSpec = programType.PROGRAM_2D_ARRAY_INT; break;
            case samplerType.SAMPLERTYPE_UINT: progSpec = programType.PROGRAM_2D_ARRAY_UINT; break;
            case samplerType.SAMPLERTYPE_SHADOW: progSpec = programType.PROGRAM_2D_ARRAY_SHADOW; break;
            default: DE_ASSERT(false);
        }
    } else if (params.texType == textureType.TEXTURETYPE_CUBE_ARRAY) {
        DE_ASSERT(!useBias);

        numComps = 4;

        switch (params.samplerType) {
            case samplerType.SAMPLERTYPE_FLOAT: progSpec = programType.PROGRAM_CUBE_ARRAY_FLOAT; break;
            case samplerType.SAMPLERTYPE_INT: progSpec = programType.PROGRAM_CUBE_ARRAY_INT; break;
            case samplerType.SAMPLERTYPE_UINT: progSpec = programType.PROGRAM_CUBE_ARRAY_UINT; break;
            case samplerType.SAMPLERTYPE_SHADOW: progSpec = programType.PROGRAM_CUBE_ARRAY_SHADOW; break;
            default: DE_ASSERT(false);
        }
    } else if (params.texType == textureType.TEXTURETYPE_1D_ARRAY) {
        DE_ASSERT(!useBias); // \todo [2012-02-17 pyry] Support bias.

        numComps = 2;

        switch (params.samplerType) {
            case samplerType.SAMPLERTYPE_FLOAT: progSpec = programType.PROGRAM_1D_ARRAY_FLOAT; break;
            case samplerType.SAMPLERTYPE_INT: progSpec = programType.PROGRAM_1D_ARRAY_INT; break;
            case samplerType.SAMPLERTYPE_UINT: progSpec = programType.PROGRAM_1D_ARRAY_UINT; break;
            case samplerType.SAMPLERTYPE_SHADOW: progSpec = programType.PROGRAM_1D_ARRAY_SHADOW; break;
            default: DE_ASSERT(false);
        }
    } else if (params.texType == textureType.TEXTURETYPE_BUFFER) {
        numComps = 1;

        switch (params.samplerType) {
            case samplerType.SAMPLERTYPE_FETCH_FLOAT: progSpec = programType.PROGRAM_BUFFER_FLOAT; break;
            case samplerType.SAMPLERTYPE_FETCH_INT: progSpec = programType.PROGRAM_BUFFER_INT; break;
            case samplerType.SAMPLERTYPE_FETCH_UINT: progSpec = programType.PROGRAM_BUFFER_UINT; break;
            default: DE_ASSERT(false);
        }
    } else
        DE_ASSERT(false);

    /* glu::ShaderProgram* */ var program = this.m_programLibrary.getProgram(progSpec);

    // \todo [2012-09-26 pyry] Move to ProgramLibrary and log unique programs only(?)
    /* TODO: Port logging
    if (params.flags.log_programs)
        log << *program;
    */
    GLU_EXPECT_NO_ERROR(gl.getError(), 'Set vertex attributes');

    // Program and uniforms.
    var prog = program.getProgram();
    gl.useProgram(prog);

    gl.uniform1i(gl.getUniformLocation(prog, 'u_sampler'), texUnit);
    // if (logUniforms)
    //     log << TestLog::Message << "u_sampler = " << texUnit << TestLog::EndMessage;

    if (useBias) {
        gl.uniform1f(gl.getUniformLocation(prog, 'u_bias'), params.bias);
        // if (logUniforms)
        //     log << TestLog::Message << "u_bias = " << params.bias << TestLog::EndMessage;
    }

    if (params.samplerType == samplerType.SAMPLERTYPE_SHADOW) {
        gl.uniform1f(gl.getUniformLocation(prog, 'u_ref'), params.ref);
        // if (logUniforms)
        //     log << TestLog::Message << "u_ref = " << params.ref << TestLog::EndMessage;
    }

    gl.uniform4fv(gl.getUniformLocation(prog, 'u_colorScale'), params.colorScale);
    gl.uniform4fv(gl.getUniformLocation(prog, 'u_colorBias'), params.colorBias);

    // if (logUniforms)
    // {
    //     log << TestLog::Message << "u_colorScale = " << params.colorScale << TestLog::EndMessage;
    //     log << TestLog::Message << "u_colorBias = " << params.colorBias << TestLog::EndMessage;
    // }

    GLU_EXPECT_NO_ERROR(gl.getError(), 'Set program state');

    {
        var vertexArrays = [];
        // console.log(position);
        // console.log(texCoord);

        var posLoc = gl.getAttribLocation(prog, 'a_position');
        if (posLoc === -1) {
            testFailedOptions("no location found for attribute 'a_position'", true);
        }
        var texLoc = gl.getAttribLocation(prog, 'a_texCoord');
        if (texLoc === -1) {
            testFailedOptions("no location found for attribute 'a_texCoord'", true);
        }

        vertexArrays.push(new deqpDraw.VertexArrayBinding(gl.FLOAT, posLoc, 4, 4, position));
        vertexArrays.push(new deqpDraw.VertexArrayBinding(gl.FLOAT, texLoc, numComps, 4, texCoord));
        deqpDraw.draw(gl, prog, vertexArrays, deqpDraw.triangles(indices));
    }
};
// public:
//                                 TextureRenderer            (const glu::RenderContext& context, tcu::TestContext& testCtx, glu::GLSLVersion glslVersion, glu::Precision texCoordPrecision);
//                                 ~TextureRenderer        (void);

//     void                        clear                    (void); //!< Frees allocated resources. Destructor will call clear() as well.

//     void                        renderQuad                (int texUnit, const float* texCoord, TextureType texType);
//     void                        renderQuad                (int texUnit, const float* texCoord, const RenderParams& params);

// private:
//                                 TextureRenderer            (const TextureRenderer& other);
//     TextureRenderer&            operator=                (const TextureRenderer& other);

//     const glu::RenderContext&    m_renderCtx;
//     tcu::TestContext&            m_testCtx;
//     ProgramLibrary                m_programLibrary;
// };

/**
 * @constructor
 * @param {tcuSurface.Surface} surface
 * @param {PixelFormat} colorFmt
 * @param {Number} x
 * @param {Number} y
 * @param {Number} width
 * @param {Number} heigth
 */
var SurfaceAccess = function(surface, colorFmt, x, y, width, height) {
    this.m_surface = surface;
    this.colorMask = undefined; /*TODO*/
    this.m_x = x || 0;
    this.m_y = y || 0;
    this.m_width = width || surface.getWidth();
    this.m_height = height || surface.getHeight();
};

/** @return {Number} */
SurfaceAccess.prototype.getWidth = function() { return this.m_width; };
/** @return {Number} */
SurfaceAccess.prototype.getHeight = function() { return this.m_height; };

/**
 * @param {Array<Number>} color
 * @param {Number} x
 * @param {Number} y
 */
SurfaceAccess.prototype.setPixel = function(color, x, y) {
    /* TODO: Apply color mask */
    var c = color;
    for (var i = 0; i < c.length; i++)
        c[i] = deMath.clamp(Math.round(color[i] * 255), 0, 255);
    this.m_surface.setPixel(x, y, c);
};

/**
 * @param {lodMode} mode
 * @param {Number} dudx
 * @param {Number} dvdx
 * @param {Number} dwdx
 * @param {Number} dudy
 * @param {Number} dvdy
 * @param {Number} dwdy
 * @return {Number}
 */
var computeLodFromDerivates = function(/*LodMode*/ mode, dudx, dvdx, dwdx, dudy, dvdy, dwdy) {
    var p = 0;
    switch (mode) {
        case lodMode.EXACT:
            p = Math.max(Math.sqrt(dudx * dudx + dvdx * dvdx + dwdx * dwdx), Math.sqrt(dudy * dudy + dvdy * dvdy + dwdy * dwdy));
            break;

        case lodMode.MIN_BOUND:
        case lodMode.MAX_BOUND: {
            var mu = Math.max(Math.abs(dudx), Math.abs(dudy));
            var mv = Math.max(Math.abs(dvdx), Math.abs(dvdy));
            var mw = Math.max(Math.abs(dwdx), Math.abs(dwdy));

            p = (mode == lodMode.MIN_BOUND) ? Math.max(mu, mv, mw) : mu + mv + mw;
            break;
        }

        default:
            DE_ASSERT(false);
    }

    return Math.round(Math.log2(p));
};

/**
 * @param {lodMode} mode
 * @param {Array<Number>} dstSize
 * @param {Array<Number>} srcSize
 * @param {Array<Number>} sq
 * @param {Array<Number>} tq
 * @param {Array<Number>} rq
 * @return {Number}
 */
var computeNonProjectedTriLod = function(mode, dstSize, srcSize, sq, tq, rq) {
    var dux = (sq[2] - sq[0]) * srcSize[0];
    var duy = (sq[1] - sq[0]) * srcSize[0];
    var dvx = (tq[2] - tq[0]) * srcSize[1];
    var dvy = (tq[1] - tq[0]) * srcSize[1];
    var dwx = 0;
    var dwy = 0;
    if (rq) {
        dwx = (rq[2] - rq[0]) * srcSize[2];
        dwy = (rq[1] - rq[0]) * srcSize[2];
    }
    var dx = dstSize[0];
    var dy = dstSize[1];

    return computeLodFromDerivates(mode, dux / dx, dvx / dx, dwx / dx, duy / dy, dvy / dy, dwy / dy);
};

/**
 * @param {Array<Number>} v
 * @param {Number} x
 * @param {Number} y
 * @return {Array<Number>}
 */
var triangleInterpolate = function(v, x, y) {
    return v[0] + (v[2] - v[0]) * x + (v[1] - v[0]) * y;
};

/**
 * @param {Array<Number>} s
 * @param {Array<Number>} w
 * @param {Number} wx
 * @param {Number} width
 * @param {Number} ny
 * @return {Number}
 */ 
var triDerivateX = function(/*const tcu::Vec3&*/ s, /*const tcu::Vec3&*/ w, wx, width, ny) {
    var d = w[1] * w[2] * (width * (ny - 1) + wx) - w[0] * (w[2] * width * ny + w[1] * wx);
    return (w[0] * w[1] * w[2] * width * (w[1] * (s[0] - s[2]) * (ny - 1) + ny * (w[2] * (s[1] - s[0]) + w[0] * (s[2] - s[1])))) / (d * d);
};

/**
 * @param {Array<Number>} s
 * @param {Array<Number>} w
 * @param {Number} wy
 * @param {Number} heigth
 * @param {Number} nx
 * @return {Number}
 */
var triDerivateY = function(/*const tcu::Vec3&*/ s, /*const tcu::Vec3&*/ w, wy, height, nx) {
    var d = w[1] * w[2] * (height * (nx - 1) + wy) - w[0] * (w[1] * height * nx + w[2] * wy);
    return (w[0] * w[1] * w[2] * height * (w[2] * (s[0] - s[1]) * (nx - 1) + nx * (w[0] * (s[1] - s[2]) + w[1] * (s[2] - s[0])))) / (d * d);
};

/**
 * @param {tcuTexture.Texture2DView} src
 * @param {ReferenceParams} params
 * @param {Array<Number>} texCoord Texture coordinates
 * @param {Number} lod
 * @return {Array<Number>} sample
 */
var execSample = function(/*const tcu::Texture2DView&*/ src, /*const ReferenceParams&*/ params, texCoord, lod)
{
    if (params.samplerType == samplerType.SAMPLERTYPE_SHADOW)
        return [src.sampleCompare(params.sampler, params.ref, texCoord, lod), 0, 0, 1];
    else
        return src.sample(params.sampler, texCoord, lod);
};

/**
 * @param {Array<Number>} pixel
 * @param {Array<Number>} scale
 * @param {Array<Number>} bias
 * return {Array<Number>}
 */
var applyScaleAndBias = function(pixel, scale, bias) {
    var pixel1 = deMath.multiply(pixel, scale);
    var pixel2 = deMath.add(pixel1, bias);
    return pixel2;
};

/**
 * @param {SurfaceAccess} dst
 * @param {tcuTexture.Texture2DView} src
 * @param {Array<Number>} sq
 * @param {Array<Number>} tq
 * @param {ReferenceParams} params
 * @return {Array<Number>} sample
 */
var sampleTextureNonProjected2D = function(dst, src, sq, tq, params) {
    var lodBias = params.flags.use_bias ? params.bias : 0;

    var dstSize = [dst.getWidth(), dst.getHeight()];
    var srcSize = [src.getWidth(), src.getHeight()];

    // Coordinates and lod per triangle.
    var triS = [deMath.swizzle(sq, [0, 1, 2]), deMath.swizzle(sq, [3, 2, 1])];
    var triT = [deMath.swizzle(tq, [0, 1, 2]), deMath.swizzle(tq, [3, 2, 1])];
    var triLod = [deMath.clamp((computeNonProjectedTriLod(params.lodMode, dstSize, srcSize, triS[0], triT[0]) + lodBias), params.minLod, params.maxLod),
                    deMath.clamp((computeNonProjectedTriLod(params.lodMode, dstSize, srcSize, triS[1], triT[1]) + lodBias), params.minLod, params.maxLod)];

    for (var y = 0; y < dst.getHeight(); y++) {
        for (var x = 0; x < dst.getWidth(); x++) {
            var yf = (y + 0.5) / dst.getHeight();
            var xf = (x + 0.5) / dst.getWidth();

            var triNdx = xf + yf >= 1 ? 1 : 0; // Top left fill rule.
            var triX = triNdx ? 1 - xf : xf;
            var triY = triNdx ? 1 - yf : yf;

            var s = triangleInterpolate(triS[triNdx], triX, triY);
            var t = triangleInterpolate(triT[triNdx], triX, triY);
            var lod = triLod[triNdx];

            var pixel = execSample(src, params, [s, t], lod);
            dst.setPixel(applyScaleAndBias(pixel, params.colorScale, params.colorBias), x, y);
        }
    }
};

/**
 * @param {SurfaceAccess} dst
 * @param {tcuTexture.Texture2DArrayView} src
 * @param {Array<Number>} sq
 * @param {Array<Number>} tq
 * @param {Array<Number>} rq
 * @param {ReferenceParams} params
 * @return {Array<Number>} sample
 */
var sampleTextureNonProjected2DArray = function(dst, src, sq, tq, rq, params) {
    var lodBias = (params.flags.use_bias) ? params.bias : 0;

    var dstSize = [dst.getWidth(), dst.getHeight()];
    var srcSize = [src.getWidth(), src.getHeight()];

    // Coordinates and lod per triangle.
    var triS = [deMath.swizzle(sq, [0, 1, 2]), deMath.swizzle(sq, [3, 2, 1])];
    var triT = [deMath.swizzle(tq, [0, 1, 2]), deMath.swizzle(tq, [3, 2, 1])];
    var triR = [deMath.swizzle(rq, [0, 1, 2]), deMath.swizzle(rq, [3, 2, 1])];
    var triLod = [computeNonProjectedTriLod(params.lodMode, dstSize, srcSize, triS[0], triT[0]) + lodBias,
                                computeNonProjectedTriLod(params.lodMode, dstSize, srcSize, triS[1], triT[1]) + lodBias];

    for (var y = 0; y < dst.getHeight(); y++) {
        for (var x = 0; x < dst.getWidth(); x++) {
            var yf = (y + 0.5) / dst.getHeight();
            var xf = (x + 0.5) / dst.getWidth();

            var triNdx = xf + yf >= 1 ? 1 : 0; // Top left fill rule.
            var triX = triNdx ? 1 - xf : xf;
            var triY = triNdx ? 1 - yf : yf;

            var s = triangleInterpolate(triS[triNdx], triX, triY);
            var t = triangleInterpolate(triT[triNdx], triX, triY);
            var r = triangleInterpolate(triR[triNdx], triX, triY);
            var lod = triLod[triNdx];

            var pixel = execSample(src, params, [s, t, r], lod);
            dst.setPixel(applyScaleAndBias(pixel, params.colorScale, params.colorBias), x, y);
        }
    }
};

/**
 * @param {SurfaceAccess} dst
 * @param {tcuTexture.Texture2DView} src
 * @param {Array<Number>} texCoord
 * @param {ReferenceParams} params
 * @return {Array<Number>} sample
 */
var sampleTexture2D = function(dst, src, texCoord, params) {
    var view = src.getSubView(params.baseLevel, params.maxLevel);
    var sq = [texCoord[0 + 0], texCoord[2 + 0], texCoord[4 + 0], texCoord[6 + 0]];
    var tq = [texCoord[0 + 1], texCoord[2 + 1], texCoord[4 + 1], texCoord[6 + 1]];

    if (params.flags.projected)
        sampleTextureProjected(dst, view, sq, tq, params);
    else
        sampleTextureNonProjected2D(dst, view, sq, tq, params);
};

/**
 * @param {lodMode} lodMode
 * @param {Array<Number>} coord
 * @param {Array<Number>} coordDx
 * @param {Array<Number>} coordDy
 * @param {Number} faceSize
 * @return {Number}
 */
var computeCubeLodFromDerivates = function(lodMode, coord, coordDx, coordDy, faceSize) {
    var face = tcuTexture.selectCubeFace(coord);
    var maNdx = 0;
    var sNdx = 0;
    var tNdx = 0;

    // \note Derivate signs don't matter when computing lod
    switch (face) {
        case tcuTexture.CubeFace.CUBEFACE_NEGATIVE_X:
        case tcuTexture.CubeFace.CUBEFACE_POSITIVE_X: maNdx = 0; sNdx = 2; tNdx = 1; break;
        case tcuTexture.CubeFace.CUBEFACE_NEGATIVE_Y:
        case tcuTexture.CubeFace.CUBEFACE_POSITIVE_Y: maNdx = 1; sNdx = 0; tNdx = 2; break;
        case tcuTexture.CubeFace.CUBEFACE_NEGATIVE_Z:
        case tcuTexture.CubeFace.CUBEFACE_POSITIVE_Z: maNdx = 2; sNdx = 0; tNdx = 1; break;
        default:
            throw new Error('Unrecognized face ' + face);
    }

    {
        var sc = coord[sNdx];
        var tc = coord[tNdx];
        var ma = Math.abs(coord[maNdx]);
        var scdx = coordDx[sNdx];
        var tcdx = coordDx[tNdx];
        var madx = Math.abs(coordDx[maNdx]);
        var scdy = coordDy[sNdx];
        var tcdy = coordDy[tNdx];
        var mady = Math.abs(coordDy[maNdx]);
        var dudx = faceSize * 0.5 * (scdx * ma - sc * madx) / (ma * ma);
        var dvdx = faceSize * 0.5 * (tcdx * ma - tc * madx) / (ma * ma);
        var dudy = faceSize * 0.5 * (scdy * ma - sc * mady) / (ma * ma);
        var dvdy = faceSize * 0.5 * (tcdy * ma - tc * mady) / (ma * ma);
        return computeLodFromDerivates(lodMode, dudx, dvdx, dudy, dvdy);
    }
};

/**
 * @param {SurfaceAccess} dst
 * @param {tcuTexture.TextureCubeView} src
 * @param {Array<Number>} sq
 * @param {Array<Number>} tq
 * @param {Array<Number>} rq
 * @param {ReferenceParams} params
 * @return {Array<Number>} sample
 */
var sampleTextureCube_str = function(dst, src, sq, tq, rq, params) {
    var dstSize = [dst.getWidth(), dst.getHeight()];
    var dstW = dstSize[0];
    var dstH = dstSize[1];
    var srcSize = src.getSize();

    // Coordinates per triangle.
    var        triS            = [ deMath.swizzle(sq, [0, 1, 2]), deMath.swizzle(sq, [3, 2, 1]) ];
    var        triT            = [ deMath.swizzle(tq, [0, 1, 2]), deMath.swizzle(tq, [3, 2, 1]) ];
    var        triR            = [ deMath.swizzle(rq, [0, 1, 2]), deMath.swizzle(rq, [3, 2, 1]) ];
    var        triW            = [ deMath.swizzle(params.w, [0, 1, 2]), deMath.swizzle(params.w, [3, 2, 1]) ];

    var            lodBias        = (params.flags.use_bias ? params.bias : 0);

    for (var py = 0; py < dst.getHeight(); py++) {
        for (var px = 0; px < dst.getWidth(); px++) {
            var        wx        = px + 0.5;
            var        wy        = py + 0.5;
            var        nx        = wx / dstW;
            var        ny        = wy / dstH;
            var     triNdx    = nx + ny >= 1 ? 1 : 0;
            var        triNx    = triNdx ? 1 - nx : nx;
            var        triNy    = triNdx ? 1 - ny : ny;

            var    coord        = [triangleInterpolate(triS[triNdx], triNx, triNy),
                                         triangleInterpolate(triT[triNdx], triNx, triNy),
                                         triangleInterpolate(triR[triNdx], triNx, triNy)];
            var    coordDx        = [triDerivateX(triS[triNdx], triW[triNdx], wx, dstW, triNy),
                                         triDerivateX(triT[triNdx], triW[triNdx], wx, dstW, triNy),
                                         triDerivateX(triR[triNdx], triW[triNdx], wx, dstW, triNy)];
            var    coordDy        = [triDerivateY(triS[triNdx], triW[triNdx], wy, dstH, triNx),
                                         triDerivateY(triT[triNdx], triW[triNdx], wy, dstH, triNx),
                                         triDerivateY(triR[triNdx], triW[triNdx], wy, dstH, triNx)];

            var        lod        = deMath.clamp((computeCubeLodFromDerivates(params.lodMode, coord, coordDx, coordDy, srcSize) + lodBias), params.minLod, params.maxLod);

            var pixel  = execSample(src, params, coord, lod);
            dst.setPixel(applyScaleAndBias(pixel, params.colorScale, params.colorBias), px, py);
        }
    }
};

/**
 * @param {SurfaceAccess} dst
 * @param {tcuTexture.TextureCubeView} src
 * @param {Array<Number>} texCoord
 * @param {ReferenceParams} params
 * @return {Array<Number>} sample
 */
var sampleTextureCube = function(dst, src, texCoord, params) {
    /*const tcu::TextureCubeView*/ var    view    = src.getSubView(params.baseLevel, params.maxLevel);
    var                sq        = [texCoord[0+0], texCoord[3+0], texCoord[6+0], texCoord[9+0]];
    var                tq        = [texCoord[0+1], texCoord[3+1], texCoord[6+1], texCoord[9+1]];
    var                rq        = [texCoord[0+2], texCoord[3+2], texCoord[6+2], texCoord[9+2]];

    return sampleTextureCube_str(dst, view, sq, tq, rq, params);
};

/**
 * @param {SurfaceAccess} dst
 * @param {tcuTexture.Texture2DArrayView} src
 * @param {Array<Number>} texCoord
 * @param {ReferenceParams} params
 * @return {Array<Number>} sample
 */
var sampleTexture2DArray = function(dst,src, texCoord, params) {
    var sq = [texCoord[0+0], texCoord[3+0], texCoord[6+0], texCoord[9+0]];
    var tq = [texCoord[0+1], texCoord[3+1], texCoord[6+1], texCoord[9+1]];
    var rq = [texCoord[0+2], texCoord[3+2], texCoord[6+2], texCoord[9+2]];

    DE_ASSERT(!(params.flags.projected)); // \todo [2012-02-17 pyry] Support projected lookups.
    sampleTextureNonProjected2DArray(dst, src.getView(), sq, tq, rq, params);
};

/**
 * @param {SurfaceAccess} dst
 * @param {tcuTexture.Texture3DView} src
 * @param {Array<Number>} sq
 * @param {Array<Number>} tq
 * @param {Array<Number>} rq
 * @param {ReferenceParams} params
 * @return {Array<Number>} sample
 */
var sampleTextureNonProjected3D = function(dst, src, sq, tq, rq, params) {
    var        lodBias        = params.flags.use_bias ? params.bias : 0;

    var    dstSize        = [dst.getWidth(), dst.getHeight()];
    var    srcSize        = [src.getWidth(), src.getHeight(), src.getDepth()];

    // Coordinates and lod per triangle.
    var    triS        = [ deMath.swizzle(sq, [0, 1, 2]), deMath.swizzle(sq, [3, 2, 1]) ];
    var    triT        = [ deMath.swizzle(tq, [0, 1, 2]), deMath.swizzle(tq, [3, 2, 1]) ];
    var    triR        = [ deMath.swizzle(rq, [0, 1, 2]), deMath.swizzle(rq, [3, 2, 1]) ];
    var triLod    = [ deMath.clamp((computeNonProjectedTriLod(params.lodMode, dstSize, srcSize, triS[0], triT[0], triR[0]) + lodBias), params.minLod, params.maxLod),
                                deMath.clamp((computeNonProjectedTriLod(params.lodMode, dstSize, srcSize, triS[1], triT[1], triR[1]) + lodBias), params.minLod, params.maxLod) ];

    for (var y = 0; y < dst.getHeight(); y++) {
        for (var x = 0; x < dst.getWidth(); x++) {
            var    yf        = (y + 0.5) / dst.getHeight();
            var    xf        = (x + 0.5) / dst.getWidth();

            var    triNdx    = xf + yf >= 1 ? 1 : 0; // Top left fill rule.
            var    triX    = triNdx ? 1-xf : xf;
            var    triY    = triNdx ? 1-yf : yf;

            var    s        = triangleInterpolate(triS[triNdx], triX, triY);
            var    t        = triangleInterpolate(triT[triNdx], triX, triY);
            var    r        = triangleInterpolate(triR[triNdx], triX, triY);
            var    lod        = triLod[triNdx];

            var pixel  = src.sample(params.sampler, [s, t, r], lod);
            dst.setPixel(applyScaleAndBias(pixel, params.colorScale, params.colorBias), x, y);
        }
    }
};

/**
 * @param {SurfaceAccess} dst
 * @param {tcuTexture.Texture3DView} src
 * @param {Array<Number>} texCoord
 * @param {ReferenceParams} params
 * @return {Array<Number>} sample
 */
var sampleTexture3D = function(dst, src, texCoord, params) {
    /*const tcu::TextureCubeView*/ var    view    = src.getSubView(params.baseLevel, params.maxLevel);
    var                sq        = [texCoord[0+0], texCoord[3+0], texCoord[6+0], texCoord[9+0]];
    var                tq        = [texCoord[0+1], texCoord[3+1], texCoord[6+1], texCoord[9+1]];
    var                rq        = [texCoord[0+2], texCoord[3+2], texCoord[6+2], texCoord[9+2]];

    return sampleTextureNonProjected3D(dst, view, sq, tq, rq, params);
};

/**
 * @param {tcuSurface.Surface} reference
 * @param {tcuSurface.Surface} rendered
 * @param {Array<Number>} threshold
 *
 * @return {bool}
 */
var compareImages = function(/*const tcu::Surface&*/ reference, /*const tcu::Surface&*/ rendered, /*tcu::RGBA*/ threshold) {
    return tcuImageCompare.pixelThresholdCompare("Result", "Image comparison result", reference, rendered, threshold, undefined /*tcu::COMPARE_LOG_RESULT*/);
};

return {
    RandomViewport: RandomViewport,
    ReferenceParams: ReferenceParams,
    textureType: textureType,
    getSamplerType: getSamplerType,
    computeQuadTexCoord2D: computeQuadTexCoord2D,
    computeQuadTexCoordCube: computeQuadTexCoordCube,
    computeQuadTexCoord2DArray: computeQuadTexCoord2DArray,
    computeQuadTexCoord3D: computeQuadTexCoord3D,
    TextureRenderer: TextureRenderer,
    SurfaceAccess: SurfaceAccess,
    sampleTexture2D: sampleTexture2D,
    sampleTextureCube: sampleTextureCube,
    sampleTexture2DArray: sampleTexture2DArray,
    sampleTexture3D: sampleTexture3D,
    compareImages: compareImages
};
});
