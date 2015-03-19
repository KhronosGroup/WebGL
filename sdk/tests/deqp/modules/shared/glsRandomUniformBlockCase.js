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

define(['framework/opengl/gluShaderUtil', 'modules/shared/glsUniformBlockCase', 'framework/common/tcuTestCase', 'framework/delibs/debase/deMath', 'framework/delibs/debase/deRandom'], function(deqpUtils, glsUBC, deqpTests, deMath, deRandom) {
    'use strict';

    var FeatureBits = {
        FEATURE_VECTORS: (1 << 0),
        FEATURE_MATRICES: (1 << 1),
        FEATURE_ARRAYS: (1 << 2),
        FEATURE_STRUCTS: (1 << 3),
        FEATURE_NESTED_STRUCTS: (1 << 4),
        FEATURE_INSTANCE_ARRAYS: (1 << 5),
        FEATURE_VERTEX_BLOCKS: (1 << 6),
        FEATURE_FRAGMENT_BLOCKS: (1 << 7),
        FEATURE_SHARED_BLOCKS: (1 << 8),
        FEATURE_UNUSED_UNIFORMS: (1 << 9),
        FEATURE_UNUSED_MEMBERS: (1 << 10),
        FEATURE_PACKED_LAYOUT: (1 << 11),
        FEATURE_SHARED_LAYOUT: (1 << 12),
        FEATURE_STD140_LAYOUT: (1 << 13),
        FEATURE_MATRIX_LAYOUT: (1 << 14),    //!< Matrix layout flags.
        FEATURE_ARRAYS_OF_ARRAYS: (1 << 15)
    };

    /**
     * RandomUniformBlockCase class
     * @param {string} name
     * @param {string} description
     * @param {glsUBC.BufferMode} bufferMode
     * @param {deMath.deUint32} features
     * @param {deMath.deUint32} seed
     */
    var RandomUniformBlockCase = function(name, description, bufferMode, features, seed) {
        glsUBC.UniformBlockCase.call(this, name, description, bufferMode);
        this.m_features = features;
        this.m_maxVertexBlocks = ((features & FeatureBits.FEATURE_VERTEX_BLOCKS) ? 4 : 0);
        this.m_maxFragmentBlocks = ((features & FeatureBits.FEATURE_FRAGMENT_BLOCKS) ? 4 : 0);
        this.m_maxSharedBlocks = ((features & FeatureBits.FEATURE_SHARED_BLOCKS) ? 4 : 0);
        this.m_maxInstances = ((features & FeatureBits.FEATURE_INSTANCE_ARRAYS) ? 3 : 0);
        this.m_maxArrayLength = ((features & FeatureBits.FEATURE_ARRAYS) ? 8 : 0);
        this.m_maxStructDepth = ((features & FeatureBits.FEATURE_STRUCTS) ? 2 : 0);
        this.m_maxBlockMembers = 5;
        this.m_maxStructMembers = 4;
        this.m_seed = seed;
        this.m_blockNdx = 1;
        this.m_uniformNdx = 1;
        this.m_structNdx = 1;
    };

    RandomUniformBlockCase.prototype = Object.create(glsUBC.UniformBlockCase.prototype);
    RandomUniformBlockCase.prototype.constructor = RandomUniformBlockCase;

    /**
     * generateType
     * @param {deRandom.Random} rnd
     * @param {number} typeDepth
     * @param {boolean} arrayOk
     * @return {glsUBC.VarType}
     */
    RandomUniformBlockCase.prototype.generateType = function(rnd, typeDepth, arrayOk)
    {
        /** @type {number} */ var structWeight = 0.1;
        /** @type {number} */ var arrayWeight = 0.1;

        if (typeDepth < this.m_maxStructDepth && rnd.getFloat() < structWeight)
        {
            /** @type {number} */ var unusedVtxWeight = 0.15;
            /** @type {number} */ var unusedFragWeight = 0.15;
            /** @type {boolean} */ var unusedOk = (this.m_features & FeatureBits.FEATURE_UNUSED_MEMBERS) != 0;
            /** @type {Array.<glsUBC.VarType>} */ var memberTypes = [];
            /** @type {number} */ var numMembers = rnd.getInt(1, this.m_maxStructMembers);

            // Generate members first so nested struct declarations are in correct order.
            for (var ndx = 0; ndx < numMembers; ndx++)
                memberTypes.push(this.generateType(rnd, typeDepth + 1, true));

            /** @type {glsUBC.StructType} */ var structType = this.m_interface.allocStruct('s' + this.genName('A'.charCodeAt(0), 'Z'.charCodeAt(0), this.m_structNdx));
            this.m_structNdx += 1;

            assertMsgOptions(this.m_blockNdx <= 'Z'.charCodeAt(0) - 'A'.charCodeAt(0), 'generateType', false, true);
            for (var ndx = 0; ndx < numMembers; ndx++)
            {
                /** @type {deMath.deUint32} */ var flags = 0;

                flags |= (unusedOk && rnd.getFloat() < unusedVtxWeight) ? glsUBC.UniformFlags.UNUSED_VERTEX : 0;
                flags |= (unusedOk && rnd.getFloat() < unusedFragWeight) ? glsUBC.UniformFlags.UNUSED_FRAGMENT : 0;

                structType.addMember('m' + ('A'.charCodeAt(0) + ndx), memberTypes[ndx], flags);
            }

            return glsUBC.newVarTypeStruct(structType);
        }
        else if (this.m_maxArrayLength > 0 && arrayOk && rnd.getFloat() < arrayWeight)
        {
            /** @type {boolean} */ var arraysOfArraysOk = (this.m_features & FeatureBits.FEATURE_ARRAYS_OF_ARRAYS) != 0;
            /** @type {number} */ var arrayLength = rnd.getInt(1, this.m_maxArrayLength);
            /** @type {glsUBC.VarType} */ var elementType = this.generateType(rnd, typeDepth, arraysOfArraysOk);
            return glsUBC.newVarTypeArray(elementType, arrayLength);
        }
        else
        {
            /** @type {Array.<deqpUtils.DataType>} */ var typeCandidates = [];

            typeCandidates.push(deqpUtils.DataType.FLOAT);
            typeCandidates.push(deqpUtils.DataType.INT);
            typeCandidates.push(deqpUtils.DataType.UINT);
            typeCandidates.push(deqpUtils.DataType.BOOL);

            if (this.m_features & FeatureBits.FEATURE_VECTORS)
            {
                typeCandidates.push(deqpUtils.DataType.FLOAT_VEC2);
                typeCandidates.push(deqpUtils.DataType.FLOAT_VEC3);
                typeCandidates.push(deqpUtils.DataType.FLOAT_VEC4);
                typeCandidates.push(deqpUtils.DataType.INT_VEC2);
                typeCandidates.push(deqpUtils.DataType.INT_VEC3);
                typeCandidates.push(deqpUtils.DataType.INT_VEC4);
                typeCandidates.push(deqpUtils.DataType.UINT_VEC2);
                typeCandidates.push(deqpUtils.DataType.UINT_VEC3);
                typeCandidates.push(deqpUtils.DataType.UINT_VEC4);
                typeCandidates.push(deqpUtils.DataType.BOOL_VEC2);
                typeCandidates.push(deqpUtils.DataType.BOOL_VEC3);
                typeCandidates.push(deqpUtils.DataType.BOOL_VEC4);
            }

            if (this.m_features & FeatureBits.FEATURE_MATRICES)
            {
                typeCandidates.push(deqpUtils.DataType.FLOAT_MAT2);
                typeCandidates.push(deqpUtils.DataType.FLOAT_MAT2X3);
                typeCandidates.push(deqpUtils.DataType.FLOAT_MAT3X2);
                typeCandidates.push(deqpUtils.DataType.FLOAT_MAT3);
                typeCandidates.push(deqpUtils.DataType.FLOAT_MAT3X4);
                typeCandidates.push(deqpUtils.DataType.FLOAT_MAT4X2);
                typeCandidates.push(deqpUtils.DataType.FLOAT_MAT4X3);
                typeCandidates.push(deqpUtils.DataType.FLOAT_MAT4);
            }

            /** @type {deqpUtils.DataType} */ var type = rnd.choose(typeCandidates)[0];
            /** @type {deMath.deUint32} */ var flags = 0;

            if (!deqpUtils.isDataTypeBoolOrBVec(type))
            {
                // Precision.
                /** @type {Array.<deMath.deUint32>} */ var precisionCandidates = [glsUBC.UniformFlags.PRECISION_LOW, glsUBC.UniformFlags.PRECISION_MEDIUM, glsUBC.UniformFlags.PRECISION_HIGH];
                flags |= rnd.choose(precisionCandidates)[0];
            }

            return glsUBC.newVarTypeBasic(type, flags);
        }
    };

    /**
     * genName
     * @param {number} first
     * @param {number} last
     * @param {number} ndx
     * @return {string}
     */
    RandomUniformBlockCase.prototype.genName = function(first, last, ndx)
    {
        /** @type {string} */ var str = '';
        /** @type {number} */ var alphabetLen = last - first + 1;

        while (ndx > alphabetLen)
        {
            str = String.fromCharCode(first + ((ndx - 1) % alphabetLen)) + str;
            ndx = Math.floor((ndx - 1) / alphabetLen);
        }

        str = String.fromCharCode(first + (ndx % (alphabetLen + 1)) - 1) + str;

        return str;
    };

    /**
     * generateUniform
     * @param {deRandom.Random} rnd
     * @param {glsUBC.UniformBlock} block
     * @param {number} ndx
     */
    RandomUniformBlockCase.prototype.generateUniform = function(rnd, block)
    {
        /** @type {number} */ var unusedVtxWeight = 0.15;
        /** @type {number} */ var unusedFragWeight = 0.15;
        /** @type {boolean} */ var unusedOk = (this.m_features & FeatureBits.FEATURE_UNUSED_UNIFORMS) != 0;
        /** @type {deMath.deUint32} */ var flags = 0;
        /** @type {string} */ var name = this.genName('a'.charCodeAt(0), 'z'.charCodeAt(0), this.m_uniformNdx);
        /** @type {glsUBC.VarType} */ var type = this.generateType(rnd, 0, true); //TODO: implement this.

        flags |= (unusedOk && rnd.getFloat() < unusedVtxWeight) ? glsUBC.UniformFlags.UNUSED_VERTEX : 0;
        flags |= (unusedOk && rnd.getFloat() < unusedFragWeight) ? glsUBC.UniformFlags.UNUSED_FRAGMENT : 0;

        block.addUniform(new glsUBC.Uniform(name, type, flags));

        this.m_uniformNdx += 1;
    };

    /**
     * generateBlock
     * @param {deRandom.Random} rnd
     * @param {deMath.deUint32} layoutFlags
     */
    RandomUniformBlockCase.prototype.generateBlock = function(rnd, layoutFlags) {
        assertMsgOptions(this.m_blockNdx <= 'z'.charCodeAt(0) - 'a'.charCodeAt(0), 'generateBlock', false, true);

        /** @type {number} */ var instanceArrayWeight = 0.3;
        /** @type {glsUBC.UniformBlock} */ var block = this.m_interface.allocBlock('Block' + String.fromCharCode('A'.charCodeAt(0) + this.m_blockNdx));
        /** @type {number} */ var numInstances = (this.m_maxInstances > 0 && rnd.getFloat() < instanceArrayWeight) ? rnd.getInt(0, this.m_maxInstances) : 0;
        /** @type {number} */ var numUniforms = rnd.getInt(1, this.m_maxBlockMembers);

        if (numInstances > 0)
            block.setArraySize(numInstances);

        if (numInstances > 0 || rnd.getBool())
            block.setInstanceName('block' + String.fromCharCode('A'.charCodeAt(0) + this.m_blockNdx));

        // Layout flag candidates.
        /** @type {Array.<deMath.deUint32>} */ var layoutFlagCandidates = [];
        layoutFlagCandidates.push(0);
        if (this.m_features & FeatureBits.FEATURE_PACKED_LAYOUT)
            layoutFlagCandidates.push(glsUBC.UniformFlags.LAYOUT_SHARED);
        if ((this.m_features & FeatureBits.FEATURE_SHARED_LAYOUT) && ((layoutFlags & glsUBC.UniformFlags.DECLARE_BOTH) != glsUBC.UniformFlags.DECLARE_BOTH))
            layoutFlagCandidates.push(glsUBC.UniformFlags.LAYOUT_PACKED); // \note packed layout can only be used in a single shader stage.
        if (this.m_features & FeatureBits.FEATURE_STD140_LAYOUT)
            layoutFlagCandidates.push(glsUBC.UniformFlags.LAYOUT_STD140);

        layoutFlags |= rnd.choose(layoutFlagCandidates)[0]; //In Javascript, this function returns an array, so taking element 0.

        if (this.m_features & FeatureBits.FEATURE_MATRIX_LAYOUT)
        {
            /** @type {Array.<deMath.deUint32>}*/ var matrixCandidates = [0, glsUBC.UniformFlags.LAYOUT_ROW_MAJOR, glsUBC.UniformFlags.LAYOUT_COLUMN_MAJOR];
            layoutFlags |= rnd.choose(matrixCandidates)[0];
        }

        block.setFlags(layoutFlags);

        for (var ndx = 0; ndx < numUniforms; ndx++)
            this.generateUniform(rnd, block);

        this.m_blockNdx += 1;
    };

    /**
     * Initializes the RandomUniformBlockCase
     */
    RandomUniformBlockCase.prototype.init = function() {
        /** @type {deRandom.Random} */ var rnd = new deRandom.Random(this.m_seed);

        /** @type {number} */ var numShared = this.m_maxSharedBlocks > 0 ? rnd.getInt(1, this.m_maxSharedBlocks) : 0;
        /** @type {number} */ var numVtxBlocks = this.m_maxVertexBlocks - numShared > 0 ? rnd.getInt(1, this.m_maxVertexBlocks - numShared) : 0;
        /** @type {number} */ var numFragBlocks = this.m_maxFragmentBlocks - numShared > 0 ? rnd.getInt(1, this.m_maxFragmentBlocks - numShared) : 0;

        for (var ndx = 0; ndx < numShared; ndx++)
            this.generateBlock(rnd, glsUBC.UniformFlags.DECLARE_VERTEX | glsUBC.UniformFlags.DECLARE_FRAGMENT);

        for (var ndx = 0; ndx < numVtxBlocks; ndx++)
            this.generateBlock(rnd, glsUBC.UniformFlags.DECLARE_VERTEX);

        for (var ndx = 0; ndx < numFragBlocks; ndx++)
            this.generateBlock(rnd, glsUBC.UniformFlags.DECLARE_FRAGMENT);
    };

    return {
        RandomUniformBlockCase: RandomUniformBlockCase,
        FeatureBits: FeatureBits
    };

});
