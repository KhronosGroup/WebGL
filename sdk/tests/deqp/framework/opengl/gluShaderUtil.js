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

define(['framework/delibs/debase/deMath'], function(deMath) {
    'use strict';

var DE_ASSERT = function(x) {
    if (!x)
        throw new Error('Assert failed');
};

/**
 * ShadingLanguageVersion
 * @enum
 */
var GLSLVersion = {
    V100_ES: 0, //!< GLSL ES 1.0
    V300_ES: 1 //!< GLSL ES 3.0
};

GLSLVersion.V_LAST = Object.keys(GLSLVersion).length;

/**
 * getGLSLVersion - Returns a GLSLVersion based on a given webgl context.
 * @param {WebGLRenderingContext} gl
 * @return {GLSLVersion}
 */
var getGLSLVersion = function(gl) {
    var glslversion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);

    if (glslversion.indexOf('WebGL GLSL ES 1.0') != -1) return GLSLVersion.V100_ES;
       if (glslversion.indexOf('WebGL GLSL ES 3.0') != -1) return GLSLVersion.V300_ES;

    throw new Error('Invalid WebGL version');
};

/**
 * getGLSLVersionDeclaration - Returns a string declaration for the glsl version in a shader.
 * @param {GLSLVersion} version
 * @return {string}
 */
var getGLSLVersionDeclaration = function(version) {
    /** @type {Array.<string>} */ var s_decl =
    [
        '#version 100',
        '#version 300 es'
    ];

    if (version > s_decl.length - 1)
        DE_ASSERT(false);

    return s_decl[version];
};

/**
 * @enum
 */
var precision = {
    PRECISION_LOWP: 0,
    PRECISION_MEDIUMP: 1,
    PRECISION_HIGHP: 2
};

precision.PRECISION_LAST = Object.keys(precision).length;

var getPrecisionName = function(prec) {
    var s_names = [
        'lowp',
        'mediump',
        'highp'
    ];

    return s_names[prec];
};

/** @const */ var deUint32_size = 4; //To replace all sizeof calls
/**
 * The Type constants
 * @enum {number}
 */
var DataType = {
    INVALID: 0,

    FLOAT: 1,
    FLOAT_VEC2: 2,
    FLOAT_VEC3: 3,
    FLOAT_VEC4: 4,
    FLOAT_MAT2: 5,
    FLOAT_MAT2X3: 6,
    FLOAT_MAT2X4: 7,
    FLOAT_MAT3X2: 8,
    FLOAT_MAT3: 9,
    FLOAT_MAT3X4: 10,
    FLOAT_MAT4X2: 11,
    FLOAT_MAT4X3: 12,
    FLOAT_MAT4: 13,

    INT: 14,
    INT_VEC2: 15,
    INT_VEC3: 16,
    INT_VEC4: 17,

    UINT: 18,
    UINT_VEC2: 19,
    UINT_VEC3: 20,
    UINT_VEC4: 21,

    BOOL: 22,
    BOOL_VEC2: 23,
    BOOL_VEC3: 24,
    BOOL_VEC4: 25,

    SAMPLER_2D: 26,
    SAMPLER_CUBE: 27,
    SAMPLER_2D_ARRAY: 28,
    SAMPLER_3D: 29,

    SAMPLER_2D_SHADOW: 30,
    SAMPLER_CUBE_SHADOW: 31,
    SAMPLER_2D_ARRAY_SHADOW: 32,

    INT_SAMPLER_2D: 33,
    INT_SAMPLER_CUBE: 34,
    INT_SAMPLER_2D_ARRAY: 35,
    INT_SAMPLER_3D: 36,

    UINT_SAMPLER_2D: 37,
    UINT_SAMPLER_CUBE: 38,
    UINT_SAMPLER_2D_ARRAY: 39,
    UINT_SAMPLER_3D: 40
};

DataType.LAST = Object.keys(DataType).length;

/**
 * Returns type of float scalars
 * @param {DataType} dataType
 * @return {string} type of float scalar
 */
var getDataTypeFloatScalars = function(dataType) {

    switch (dataType) {
        case DataType.FLOAT: return 'float';
        case DataType.FLOAT_VEC2: return 'vec2';
        case DataType.FLOAT_VEC3: return 'vec3';
        case DataType.FLOAT_VEC4: return 'vec4';
        case DataType.FLOAT_MAT2: return 'mat2';
        case DataType.FLOAT_MAT2X3: return 'mat2x3';
        case DataType.FLOAT_MAT2X4: return 'mat2x4';
        case DataType.FLOAT_MAT3X2: return 'mat3x2';
        case DataType.FLOAT_MAT3: return 'mat3';
        case DataType.FLOAT_MAT3X4: return 'mat3x4';
        case DataType.FLOAT_MAT4X2: return 'mat4x2';
        case DataType.FLOAT_MAT4X3: return 'mat4x3';
        case DataType.FLOAT_MAT4: return 'mat4';
        case DataType.INT: return 'float';
        case DataType.INT_VEC2: return 'vec2';
        case DataType.INT_VEC3: return 'vec3';
        case DataType.INT_VEC4: return 'vec4';
        case DataType.UINT: return 'float';
        case DataType.UINT_VEC2: return 'vec2';
        case DataType.UINT_VEC3: return 'vec3';
        case DataType.UINT_VEC4: return 'vec4';
        case DataType.BOOL: return 'float';
        case DataType.BOOL_VEC2: return 'vec2';
        case DataType.BOOL_VEC3: return 'vec3';
        case DataType.BOOL_VEC4: return 'vec4';
    }
    throw Error('Unrecognized dataType ' + dataType);
};

/**
 * getDataTypeVector
 * @param {DataType} scalarType
 * @param {number} size
 * @return {DataType}
 */
var getDataTypeVector = function(scalarType, size)
{
    //DE_ASSERT(deInRange32(size, 1, 4));
    switch (scalarType)
    {
        case DataType.FLOAT:
        case DataType.INT:
        case DataType.UINT:
        case DataType.BOOL:
            return scalarType + size - 1;
        default:
            return DataType.INVALID;
    }
};

/**
 * getDataTypeFloatVec
 * @param {number} vecSize
 * @return {DataType}
 */
var getDataTypeFloatVec = function(vecSize)
{
    return getDataTypeVector(DataType.FLOAT, vecSize);
};

/**
 * isDataTypeBoolOrBVec
 * @param {DataType} dataType
 * @return {boolean}
 */
var isDataTypeBoolOrBVec = function(dataType) {
    return (dataType >= DataType.BOOL) && (dataType <= DataType.BOOL_VEC4);
};

/**
 * Returns type of scalar
 * @param {DataType} dataType shader
 * @return {string} type of scalar type
 */
var getDataTypeScalarType = function(dataType) {
    switch (dataType) {
        case DataType.FLOAT: return 'float';
        case DataType.FLOAT_VEC2: return 'float';
        case DataType.FLOAT_VEC3: return 'float';
        case DataType.FLOAT_VEC4: return 'float';
        case DataType.FLOAT_MAT2: return 'float';
        case DataType.FLOAT_MAT2X3: return 'float';
        case DataType.FLOAT_MAT2X4: return 'float';
        case DataType.FLOAT_MAT3X2: return 'float';
        case DataType.FLOAT_MAT3: return 'float';
        case DataType.FLOAT_MAT3X4: return 'float';
        case DataType.FLOAT_MAT4X2: return 'float';
        case DataType.FLOAT_MAT4X3: return 'float';
        case DataType.FLOAT_MAT4: return 'float';
        case DataType.INT: return 'int';
        case DataType.INT_VEC2: return 'int';
        case DataType.INT_VEC3: return 'int';
        case DataType.INT_VEC4: return 'int';
        case DataType.UINT: return 'uint';
        case DataType.UINT_VEC2: return 'uint';
        case DataType.UINT_VEC3: return 'uint';
        case DataType.UINT_VEC4: return 'uint';
        case DataType.BOOL: return 'bool';
        case DataType.BOOL_VEC2: return 'bool';
        case DataType.BOOL_VEC3: return 'bool';
        case DataType.BOOL_VEC4: return 'bool';
        case DataType.SAMPLER_2D: return 'sampler2D';
        case DataType.SAMPLER_CUBE: return 'samplerCube';
        case DataType.SAMPLER_2D_ARRAY: return 'sampler2DArray';
        case DataType.SAMPLER_3D: return 'sampler3D';
        case DataType.SAMPLER_2D_SHADOW: return 'sampler2DShadow';
        case DataType.SAMPLER_CUBE_SHADOW: return 'samplerCubeShadow';
        case DataType.SAMPLER_2D_ARRAY_SHADOW: return 'sampler2DArrayShadow';
        case DataType.INT_SAMPLER_2D: return 'isampler2D';
        case DataType.INT_SAMPLER_CUBE: return 'isamplerCube';
        case DataType.INT_SAMPLER_2D_ARRAY: return 'isampler2DArray';
        case DataType.INT_SAMPLER_3D: return 'isampler3D';
        case DataType.UINT_SAMPLER_2D: return 'usampler2D';
        case DataType.UINT_SAMPLER_CUBE: return 'usamplerCube';
        case DataType.UINT_SAMPLER_2D_ARRAY: return 'usampler2DArray';
        case DataType.UINT_SAMPLER_3D: return 'usampler3D';
    }
    throw Error('Unrecognized dataType ' + dataType);
};

/**
 * Returns type of scalar
 * @param {DataType} dataType shader
 * @return {DataType} type of scalar type
 */
var getDataTypeScalarTypeAsDataType = function(dataType) {
    switch (dataType) {
        case DataType.FLOAT: return DataType.FLOAT;
        case DataType.FLOAT_VEC2: return DataType.FLOAT;
        case DataType.FLOAT_VEC3: return DataType.FLOAT;
        case DataType.FLOAT_VEC4: return DataType.FLOAT;
        case DataType.FLOAT_MAT2: return DataType.FLOAT;
        case DataType.FLOAT_MAT2X3: return DataType.FLOAT;
        case DataType.FLOAT_MAT2X4: return DataType.FLOAT;
        case DataType.FLOAT_MAT3X2: return DataType.FLOAT;
        case DataType.FLOAT_MAT3: return DataType.FLOAT;
        case DataType.FLOAT_MAT3X4: return DataType.FLOAT;
        case DataType.FLOAT_MAT4X2: return DataType.FLOAT;
        case DataType.FLOAT_MAT4X3: return DataType.FLOAT;
        case DataType.FLOAT_MAT4: return DataType.FLOAT;
        case DataType.INT: return DataType.INT;
        case DataType.INT_VEC2: return DataType.INT;
        case DataType.INT_VEC3: return DataType.INT;
        case DataType.INT_VEC4: return DataType.INT;
        case DataType.UINT: return DataType.UINT;
        case DataType.UINT_VEC2: return DataType.UINT;
        case DataType.UINT_VEC3: return DataType.UINT;
        case DataType.UINT_VEC4: return DataType.UINT;
        case DataType.BOOL: return DataType.BOOL;
        case DataType.BOOL_VEC2: return DataType.BOOL;
        case DataType.BOOL_VEC3: return DataType.BOOL;
        case DataType.BOOL_VEC4: return DataType.BOOL;
        case DataType.SAMPLER_2D:
        case DataType.SAMPLER_CUBE:
        case DataType.SAMPLER_2D_ARRAY:
        case DataType.SAMPLER_3D:
        case DataType.SAMPLER_2D_SHADOW:
        case DataType.SAMPLER_CUBE_SHADOW:
        case DataType.SAMPLER_2D_ARRAY_SHADOW:
        case DataType.INT_SAMPLER_2D:
        case DataType.INT_SAMPLER_CUBE:
        case DataType.INT_SAMPLER_2D_ARRAY:
        case DataType.INT_SAMPLER_3D:
        case DataType.UINT_SAMPLER_2D:
        case DataType.UINT_SAMPLER_CUBE:
        case DataType.UINT_SAMPLER_2D_ARRAY:
        case DataType.UINT_SAMPLER_3D:
            return dataType;
    }
    throw Error('Unrecognized dataType ' + dataType);
};

/**
 * Checks if dataType is integer or vectors of integers
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType integer or integer vector
 */
var isDataTypeIntOrIVec = function(dataType) {
    /** @type {boolean} */ var retVal = false;
    switch (dataType) {
        case DataType.INT:
        case DataType.INT_VEC2:
        case DataType.INT_VEC3:
        case DataType.INT_VEC4:
            retVal = true;
    }

    return retVal;
};

/**
 * Checks if dataType is unsigned integer or vectors of unsigned integers
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType unsigned integer or unsigned integer vector
 */
var isDataTypeUintOrUVec = function(dataType) {
    /** @type {boolean} */ var retVal = false;
    switch (dataType) {
        case DataType.UINT:
        case DataType.UINT_VEC2:
        case DataType.UINT_VEC3:
        case DataType.UINT_VEC4:
            retVal = true;
    }

    return retVal;
};

/**
* Returns type of scalar size
* @param {DataType} dataType shader
* @return {number} with size of the type of scalar
*/
var getDataTypeScalarSize = function(dataType) {
    switch (dataType) {
        case DataType.FLOAT: return 1;
        case DataType.FLOAT_VEC2: return 2;
        case DataType.FLOAT_VEC3: return 3;
        case DataType.FLOAT_VEC4: return 4;
        case DataType.FLOAT_MAT2: return 4;
        case DataType.FLOAT_MAT2X3: return 6;
        case DataType.FLOAT_MAT2X4: return 8;
        case DataType.FLOAT_MAT3X2: return 6;
        case DataType.FLOAT_MAT3: return 9;
        case DataType.FLOAT_MAT3X4: return 12;
        case DataType.FLOAT_MAT4X2: return 8;
        case DataType.FLOAT_MAT4X3: return 12;
        case DataType.FLOAT_MAT4: return 16;
        case DataType.INT: return 1;
        case DataType.INT_VEC2: return 2;
        case DataType.INT_VEC3: return 3;
        case DataType.INT_VEC4: return 4;
        case DataType.UINT: return 1;
        case DataType.UINT_VEC2: return 2;
        case DataType.UINT_VEC3: return 3;
        case DataType.UINT_VEC4: return 4;
        case DataType.BOOL: return 1;
        case DataType.BOOL_VEC2: return 2;
        case DataType.BOOL_VEC3: return 3;
        case DataType.BOOL_VEC4: return 4;
        case DataType.SAMPLER_2D: return 1;
        case DataType.SAMPLER_CUBE: return 1;
        case DataType.SAMPLER_2D_ARRAY: return 1;
        case DataType.SAMPLER_3D: return 1;
        case DataType.SAMPLER_2D_SHADOW: return 1;
        case DataType.SAMPLER_CUBE_SHADOW: return 1;
        case DataType.SAMPLER_2D_ARRAY_SHADOW: return 1;
        case DataType.INT_SAMPLER_2D: return 1;
        case DataType.INT_SAMPLER_CUBE: return 1;
        case DataType.INT_SAMPLER_2D_ARRAY: return 1;
        case DataType.INT_SAMPLER_3D: return 1;
        case DataType.UINT_SAMPLER_2D: return 1;
        case DataType.UINT_SAMPLER_CUBE: return 1;
        case DataType.UINT_SAMPLER_2D_ARRAY: return 1;
        case DataType.UINT_SAMPLER_3D: return 1;
    }
    throw Error('Unrecognized dataType ' + dataType);
};

/**
 * Checks if dataType is float or vector
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType float or vector
 */
var isDataTypeFloatOrVec = function(dataType) {
    switch (dataType) {
        case DataType.FLOAT:
        case DataType.FLOAT_VEC2:
        case DataType.FLOAT_VEC3:
        case DataType.FLOAT_VEC4:
            return true;
    }
    return false;
};

/**
 * Checks if dataType is a matrix
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType matrix or not
 */
var isDataTypeMatrix = function(dataType) {
    switch (dataType) {
        case DataType.FLOAT_MAT2:
        case DataType.FLOAT_MAT2X3:
        case DataType.FLOAT_MAT2X4:
        case DataType.FLOAT_MAT3X2:
        case DataType.FLOAT_MAT3:
        case DataType.FLOAT_MAT3X4:
        case DataType.FLOAT_MAT4X2:
        case DataType.FLOAT_MAT4X3:
        case DataType.FLOAT_MAT4:
            return true;
    }
    return false;
};

/**
 * Checks if dataType is a vector
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType vector or not
 */
var isDataTypeScalar = function(dataType) {
    switch (dataType) {
        case DataType.FLOAT:
        case DataType.INT:
        case DataType.UINT:
        case DataType.BOOL:
            return true;
    }
    return false;
};

/**
 * Checks if dataType is a vector
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType vector or not
 */
var isDataTypeVector = function(dataType) {
    switch (dataType) {
        case DataType.FLOAT_VEC2:
        case DataType.FLOAT_VEC3:
        case DataType.FLOAT_VEC4:
        case DataType.INT_VEC2:
        case DataType.INT_VEC3:
        case DataType.INT_VEC4:
        case DataType.UINT_VEC2:
        case DataType.UINT_VEC3:
        case DataType.UINT_VEC4:
        case DataType.BOOL_VEC2:
        case DataType.BOOL_VEC3:
        case DataType.BOOL_VEC4:
            return true;
    }
    return false;
};

/**
 * Checks if dataType is a vector or a scalar type
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType vector or scalar or not
 */
var isDataTypeScalarOrVector = function(dataType) {
    switch (dataType) {
        case DataType.FLOAT:
        case DataType.FLOAT_VEC2:
        case DataType.FLOAT_VEC3:
        case DataType.FLOAT_VEC4:
        case DataType.INT:
        case DataType.INT_VEC2:
        case DataType.INT_VEC3:
        case DataType.INT_VEC4:
        case DataType.UINT:
        case DataType.UINT_VEC2:
        case DataType.UINT_VEC3:
        case DataType.UINT_VEC4:
        case DataType.BOOL:
        case DataType.BOOL_VEC2:
        case DataType.BOOL_VEC3:
        case DataType.BOOL_VEC4:
            return true;
    }
    return false;
};

/**
 * Checks if dataType is a sampler
 * @param {DataType} dataType shader
 * @return {boolean} Is dataType vector or scalar or not
 */
var isDataTypeSampler = function(dataType) {
    return (dataType >= DataType.SAMPLER_2D) && (dataType <= DataType.UINT_SAMPLER_3D);
};

/**
 * Returns a DataType based on given rows and columns
 * @param {number} numCols
 * @param {number} numRows
 * @return {DataType}
 */
var getDataTypeMatrix = function(numCols, numRows) {
    DE_ASSERT(deMath.deInRange32(numCols, 2, 4) && deMath.deInRange32(numRows, 2, 4));
    return (DataType.FLOAT_MAT2 + (numCols - 2) * 3 + (numRows - 2));
};

/**
* Returns number of rows of a DataType Matrix
* @param {DataType} dataType shader
* @return {number} with number of rows depending on DataType Matrix
*/
var getDataTypeMatrixNumRows = function(dataType) {
    switch (dataType) {
        case DataType.FLOAT_MAT2: return 2;
        case DataType.FLOAT_MAT2X3: return 3;
        case DataType.FLOAT_MAT2X4: return 4;
        case DataType.FLOAT_MAT3X2: return 2;
        case DataType.FLOAT_MAT3: return 3;
        case DataType.FLOAT_MAT3X4: return 4;
        case DataType.FLOAT_MAT4X2: return 2;
        case DataType.FLOAT_MAT4X3: return 3;
        case DataType.FLOAT_MAT4: return 4;
    }
    throw Error('Unrecognized dataType ' + dataType);
};

/**
* Returns number of columns of a DataType Matrix
* @param {DataType} dataType shader
* @return {number} with number of columns depending on DataType Matrix
*/
var getDataTypeMatrixNumColumns = function(dataType) {
    switch (dataType) {
        case DataType.FLOAT_MAT2: return 2;
        case DataType.FLOAT_MAT2X3: return 2;
        case DataType.FLOAT_MAT2X4: return 2;
        case DataType.FLOAT_MAT3X2: return 3;
        case DataType.FLOAT_MAT3: return 3;
        case DataType.FLOAT_MAT3X4: return 3;
        case DataType.FLOAT_MAT4X2: return 4;
        case DataType.FLOAT_MAT4X3: return 4;
        case DataType.FLOAT_MAT4: return 4;
    }
    throw Error('Unrecognized dataType ' + dataType);
};

/**
 * Returns name of the dataType
 * @param {DataType} dataType shader
 * @return {string} dataType name
 */
var getDataTypeName = function(dataType)  {
    switch (dataType) {
        case DataType.INVALID: return 'invalid';

        case DataType.FLOAT: return 'float';
        case DataType.FLOAT_VEC2: return 'vec2';
        case DataType.FLOAT_VEC3: return 'vec3';
        case DataType.FLOAT_VEC4: return 'vec4';
        case DataType.FLOAT_MAT2: return 'mat2';
        case DataType.FLOAT_MAT2X3: return 'mat2x3';
        case DataType.FLOAT_MAT2X4: return 'mat2x4';
        case DataType.FLOAT_MAT3X2: return 'mat3x2';
        case DataType.FLOAT_MAT3: return 'mat3';
        case DataType.FLOAT_MAT3X4: return 'mat3x4';
        case DataType.FLOAT_MAT4X2: return 'mat4x2';
        case DataType.FLOAT_MAT4X3: return 'mat4x3';
        case DataType.FLOAT_MAT4: return 'mat4';

        case DataType.INT: return 'int';
        case DataType.INT_VEC2: return 'ivec2';
        case DataType.INT_VEC3: return 'ivec3';
        case DataType.INT_VEC4: return 'ivec4';

        case DataType.UINT: return 'uint';
        case DataType.UINT_VEC2: return 'uvec2';
        case DataType.UINT_VEC3: return 'uvec3';
        case DataType.UINT_VEC4: return 'uvec4';

        case DataType.BOOL: return 'bool';
        case DataType.BOOL_VEC2: return 'bvec2';
        case DataType.BOOL_VEC3: return 'bvec3';
        case DataType.BOOL_VEC4: return 'bvec4';

        case DataType.SAMPLER_2D: return 'sampler2D';
        case DataType.SAMPLER_CUBE: return 'samplerCube';
        case DataType.SAMPLER_2D_ARRAY: return 'sampler2DArray';
        case DataType.SAMPLER_3D: return 'sampler3D';

        case DataType.SAMPLER_2D_SHADOW: return 'sampler2DShadow';
        case DataType.SAMPLER_CUBE_SHADOW: return 'samplerCubeShadow';
        case DataType.SAMPLER_2D_ARRAY_SHADOW: return 'sampler2DArrayShadow';

        case DataType.INT_SAMPLER_2D: return 'isampler2D';
        case DataType.INT_SAMPLER_CUBE: return 'isamplerCube';
        case DataType.INT_SAMPLER_2D_ARRAY: return 'isampler2DArray';
        case DataType.INT_SAMPLER_3D: return 'isampler3D';

        case DataType.UINT_SAMPLER_2D: return 'usampler2D';
        case DataType.UINT_SAMPLER_CUBE: return 'usamplerCube';
        case DataType.UINT_SAMPLER_2D_ARRAY: return 'usampler2DArray';
        case DataType.UINT_SAMPLER_3D: return 'usampler3D';
    }
    throw Error('Unrecognized dataType ' + dataType);
};

/**
 * Returns the DataType from the GL type
 * @param {deMath.deUint32} glType
 * @return {DataType}
 */
var getDataTypeFromGLType = function(glType) {
    switch (glType)
    {
        case gl.FLOAT: return DataType.FLOAT;
        case gl.FLOAT_VEC2: return DataType.FLOAT_VEC2;
        case gl.FLOAT_VEC3: return DataType.FLOAT_VEC3;
        case gl.FLOAT_VEC4: return DataType.FLOAT_VEC4;

        case gl.FLOAT_MAT2: return DataType.FLOAT_MAT2;
        case gl.FLOAT_MAT2x3: return DataType.FLOAT_MAT2X3;
        case gl.FLOAT_MAT2x4: return DataType.FLOAT_MAT2X4;

        case gl.FLOAT_MAT3x2: return DataType.FLOAT_MAT3X2;
        case gl.FLOAT_MAT3: return DataType.FLOAT_MAT3;
        case gl.FLOAT_MAT3x4: return DataType.FLOAT_MAT3X4;

        case gl.FLOAT_MAT4x2: return DataType.FLOAT_MAT4X2;
        case gl.FLOAT_MAT4x3: return DataType.FLOAT_MAT4X3;
        case gl.FLOAT_MAT4: return DataType.FLOAT_MAT4;

        case gl.INT: return DataType.INT;
        case gl.INT_VEC2: return DataType.INT_VEC2;
        case gl.INT_VEC3: return DataType.INT_VEC3;
        case gl.INT_VEC4: return DataType.INT_VEC4;

        case gl.UNSIGNED_INT: return DataType.UINT;
        case gl.UNSIGNED_INT_VEC2: return DataType.UINT_VEC2;
        case gl.UNSIGNED_INT_VEC3: return DataType.UINT_VEC3;
        case gl.UNSIGNED_INT_VEC4: return DataType.UINT_VEC4;

        case gl.BOOL: return DataType.BOOL;
        case gl.BOOL_VEC2: return DataType.BOOL_VEC2;
        case gl.BOOL_VEC3: return DataType.BOOL_VEC3;
        case gl.BOOL_VEC4: return DataType.BOOL_VEC4;

        case gl.SAMPLER_2D: return DataType.SAMPLER_2D;
        case gl.SAMPLER_CUBE: return DataType.SAMPLER_CUBE;
        case gl.SAMPLER_2D_ARRAY: return DataType.SAMPLER_2D_ARRAY;
        case gl.SAMPLER_3D: return DataType.SAMPLER_3D;

        case gl.SAMPLER_2D_SHADOW: return DataType.SAMPLER_2D_SHADOW;
        case gl.SAMPLER_CUBE_SHADOW: return DataType.SAMPLER_CUBE_SHADOW;
        case gl.SAMPLER_2D_ARRAY_SHADOW: return DataType.SAMPLER_2D_ARRAY_SHADOW;

        case gl.INT_SAMPLER_2D: return DataType.INT_SAMPLER_2D;
        case gl.INT_SAMPLER_CUBE: return DataType.INT_SAMPLER_CUBE;
        case gl.INT_SAMPLER_2D_ARRAY: return DataType.INT_SAMPLER_2D_ARRAY;
        case gl.INT_SAMPLER_3D: return DataType.INT_SAMPLER_3D;

        case gl.UNSIGNED_INT_SAMPLER_2D: return DataType.UINT_SAMPLER_2D;
        case gl.UNSIGNED_INT_SAMPLER_CUBE: return DataType.UINT_SAMPLER_CUBE;
        case gl.UNSIGNED_INT_SAMPLER_2D_ARRAY: return DataType.UINT_SAMPLER_2D_ARRAY;
        case gl.UNSIGNED_INT_SAMPLER_3D: return DataType.UINT_SAMPLER_3D;

        default:
            return DataType.LAST;
    }
};

return {
    GLSLVersion: GLSLVersion,
    getGLSLVersion: getGLSLVersion,
    getGLSLVersionDeclaration: getGLSLVersionDeclaration,
    precision: precision,
    getPrecisionName: getPrecisionName,
    deUint32_size: deUint32_size,
    DataType: DataType,
    getDataTypeFloatScalars: getDataTypeFloatScalars,
    getDataTypeScalarType: getDataTypeScalarType,
    getDataTypeScalarTypeAsDataType: getDataTypeScalarTypeAsDataType,
    isDataTypeIntOrIVec: isDataTypeIntOrIVec,
    isDataTypeUintOrUVec: isDataTypeUintOrUVec,
    getDataTypeVector: getDataTypeVector,
    getDataTypeFloatVec: getDataTypeFloatVec,
    isDataTypeBoolOrBVec: isDataTypeBoolOrBVec,
    getDataTypeScalarSize: getDataTypeScalarSize,
    isDataTypeFloatOrVec: isDataTypeFloatOrVec,
    isDataTypeMatrix: isDataTypeMatrix,
    isDataTypeScalar: isDataTypeScalar,
    isDataTypeVector: isDataTypeVector,
    isDataTypeScalarOrVector: isDataTypeScalarOrVector,
    isDataTypeSampler: isDataTypeSampler,
    getDataTypeMatrix: getDataTypeMatrix,
    getDataTypeMatrixNumColumns: getDataTypeMatrixNumColumns,
    getDataTypeMatrixNumRows: getDataTypeMatrixNumRows,
    getDataTypeName: getDataTypeName,
    getDataTypeFromGLType: getDataTypeFromGLType
};

});
