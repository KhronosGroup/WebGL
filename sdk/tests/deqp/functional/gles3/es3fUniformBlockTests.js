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

define(['framework/opengl/gluShaderUtil',
    'modules/shared/glsUniformBlockCase',
    'modules/shared/glsRandomUniformBlockCase',
    'framework/common/tcuTestCase',
    'framework/delibs/debase/deMath',
    'framework/delibs/debase/deRandom'],
    function(
        gluShaderUtil,
        glsUniformBlockCase,
        glsRandomUniformBlockCase,
        tcuTestCase,
        deMath,
        deRandom) {
    'use strict';

    /**
     * createRandomCaseGroup
     * @param {tcuTestCase.DeqpTest} parentGroup
     * @param {string} groupName
     * @param {string} description
     * @param {glsUniformBlockCase.BufferMode} bufferMode
     * @param {deMath.deUint32} features
     * @param {number} numCases
     * @param {deMath.deUint32} baseSeed
     */
    var createRandomCaseGroup = function(parentGroup, groupName, description, bufferMode, features, numCases, baseSeed) {
        /** @type {tcuTestCase.DeqpTest} */
        var group = new tcuTestCase.newTest(groupName, description);
        parentGroup.addChild(group);

        baseSeed += (new deRandom.Random()).getBaseSeed();

        for (var ndx = 0; ndx < numCases; ndx++)
            group.addChild(new glsRandomUniformBlockCase.RandomUniformBlockCase('' + ndx, '', bufferMode, features, ndx + baseSeed));
    };

    /**
     * BlockBasicTypeCase constructor
     * @param {string} name The name of the test
     * @param {string} description The description of the test
     * @param {glsUniformBlockCase.VarType} type The type of the block
     * @param {glsUniformBlockCase.UniformLayout} layoutFlags
     * @param {number} numInstances
     */
    var BlockBasicTypeCase = function(name, description, type, layoutFlags, numInstances) {
        glsUniformBlockCase.UniformBlockCase.call(this, name, description, glsUniformBlockCase.BufferMode.BUFFERMODE_PER_BLOCK);
        /** @type {glsUniformBlockCase.UniformBlock}*/ var block = this.m_interface.allocBlock('Block');
        block.addUniform(new glsUniformBlockCase.Uniform('var', type, 0));
        block.setFlags(layoutFlags);

        if (numInstances > 0)
        {
            block.setArraySize(numInstances);
            block.setInstanceName('block');
        }
    };

    BlockBasicTypeCase.prototype = Object.create(glsUniformBlockCase.UniformBlockCase.prototype);
    BlockBasicTypeCase.prototype.constructor = BlockBasicTypeCase;

    var createBlockBasicTypeCases = function(group, name, type, layoutFlags, numInstances) {
        group.addChild(new BlockBasicTypeCase(name + '_vertex', '', type, layoutFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX, numInstances));
        group.addChild(new BlockBasicTypeCase(name + '_fragment', '', type, layoutFlags | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, numInstances));

        //alert(group.spec[0].m_instance);
        if (!(layoutFlags & glsUniformBlockCase.UniformFlags.LAYOUT_PACKED))
            group.addChild(new BlockBasicTypeCase(name + '_both', '', type, layoutFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, numInstances));
    };

    /**
     * BlockSingleStructCase constructor
     * @param {string} name The name of the test
     * @param {string} description The description of the test
     * @param {deMath.deUint32} layoutFlags
     * @param {glsUniformBlockCase.BufferMode} bufferMode
     * @param {number} numInstances
     */
    var BlockSingleStructCase = function(name, description, layoutFlags, bufferMode, numInstances) {
        glsUniformBlockCase.UniformBlockCase.call(this, name, description, bufferMode);
        this.m_layoutFlags = layoutFlags;
        this.m_numInstances = numInstances;
    };

    BlockSingleStructCase.prototype = Object.create(glsUniformBlockCase.UniformBlockCase.prototype);
    BlockSingleStructCase.prototype.constructor = BlockSingleStructCase;

    BlockSingleStructCase.prototype.init = function() {
        /**@type {glsUniformBlockCase.StructType}*/ var typeS = this.m_interface.allocStruct('S');
        typeS.addMember('a', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.INT_VEC3, glsUniformBlockCase.UniformFlags.PRECISION_HIGH), glsUniformBlockCase.UniformFlags.UNUSED_BOTH); // First member is unused.
        typeS.addMember('b', glsUniformBlockCase.newVarTypeArray(glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_MAT3, glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM), 4));
        typeS.addMember('c', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_VEC4, glsUniformBlockCase.UniformFlags.PRECISION_HIGH));

        /** @type {glsUniformBlockCase.UniformBlock} */ var block = this.m_interface.allocBlock('Block');
        block.addUniform(new glsUniformBlockCase.Uniform('s', glsUniformBlockCase.newVarTypeStruct(typeS), 0));
        block.setFlags(this.m_layoutFlags);

        if (this.m_numInstances > 0)
        {
            block.setInstanceName('block');
            block.setArraySize(this.m_numInstances);
        }
    };

    /**
     * BlockSingleStructArrayCase constructor
     * @param {string} name The name of the test
     * @param {string} description The description of the test
     * @param {deMath.deUint32} layoutFlags
     * @param {glsUniformBlockCase.BufferMode} bufferMode
     * @param {number} numInstances
     */
    var BlockSingleStructArrayCase = function(name, description, layoutFlags, bufferMode, numInstances) {
        glsUniformBlockCase.UniformBlockCase.call(this, name, description, bufferMode);
        this.m_layoutFlags = layoutFlags;
        this.m_numInstances = numInstances;
    };

    BlockSingleStructArrayCase.prototype = Object.create(glsUniformBlockCase.UniformBlockCase.prototype);
    BlockSingleStructArrayCase.prototype.constructor = BlockSingleStructArrayCase;

    BlockSingleStructArrayCase.prototype.init = function() {
        /**@type {glsUniformBlockCase.StructType}*/ var typeS = this.m_interface.allocStruct('S');
        typeS.addMember('a', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.INT_VEC3, glsUniformBlockCase.UniformFlags.PRECISION_HIGH), glsUniformBlockCase.UniformFlags.UNUSED_BOTH); // First member is unused.
        typeS.addMember('b', glsUniformBlockCase.newVarTypeArray(glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_MAT3, glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM), 4));
        typeS.addMember('c', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_VEC4, glsUniformBlockCase.UniformFlags.PRECISION_HIGH));

        /** @type {glsUniformBlockCase.UniformBlock} */ var block = this.m_interface.allocBlock('Block');
        block.addUniform(new glsUniformBlockCase.Uniform('u', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.UINT, glsUniformBlockCase.UniformFlags.PRECISION_LOW)));
        block.addUniform(new glsUniformBlockCase.Uniform('s', glsUniformBlockCase.newVarTypeArray(glsUniformBlockCase.newVarTypeStruct(typeS), 3)));
        block.addUniform(new glsUniformBlockCase.Uniform('v', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_VEC4, glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM)));
        block.setFlags(this.m_layoutFlags);

        if (this.m_numInstances > 0)
        {
            block.setInstanceName('block');
            block.setArraySize(this.m_numInstances);
        }
    };

    /**
     * BlockSingleNestedStructCase constructor
     * @param {string} name The name of the test
     * @param {string} description The description of the test
     * @param {deMath.deUint32} layoutFlags
     * @param {glsUniformBlockCase.BufferMode} bufferMode
     * @param {number} numInstances
     */
    var BlockSingleNestedStructCase = function(name, description, layoutFlags, bufferMode, numInstances) {
        glsUniformBlockCase.UniformBlockCase.call(this, name, description, bufferMode);
        this.m_layoutFlags = layoutFlags;
        this.m_numInstances = numInstances;
    };

    BlockSingleNestedStructCase.prototype = Object.create(glsUniformBlockCase.UniformBlockCase.prototype);
    BlockSingleNestedStructCase.prototype.constructor = BlockSingleNestedStructCase;

    BlockSingleNestedStructCase.prototype.init = function() {
        /**@type {glsUniformBlockCase.StructType}*/ var typeS = this.m_interface.allocStruct('S');
        typeS.addMember('a', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.INT_VEC3, glsUniformBlockCase.UniformFlags.PRECISION_HIGH));
        typeS.addMember('b', glsUniformBlockCase.newVarTypeArray(glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_MAT3, glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM), 4));
        typeS.addMember('c', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_VEC4, glsUniformBlockCase.UniformFlags.PRECISION_HIGH), glsUniformBlockCase.UniformFlags.UNUSED_BOTH);

        /**@type {glsUniformBlockCase.StructType}*/ var typeT = this.m_interface.allocStruct('T');
        typeT.addMember('a', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_MAT3, glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM));
        typeT.addMember('b', glsUniformBlockCase.newVarTypeStruct(typeS));

        /** @type {glsUniformBlockCase.UniformBlock} */ var block = this.m_interface.allocBlock('Block');
        block.addUniform(new glsUniformBlockCase.Uniform('s', glsUniformBlockCase.newVarTypeStruct(typeS), 0));
        block.addUniform(new glsUniformBlockCase.Uniform('v', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_VEC2, glsUniformBlockCase.UniformFlags.PRECISION_LOW), glsUniformBlockCase.UniformFlags.UNUSED_BOTH));
        block.addUniform(new glsUniformBlockCase.Uniform('t', glsUniformBlockCase.newVarTypeStruct(typeT), 0));
        block.addUniform(new glsUniformBlockCase.Uniform('u', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.UINT, glsUniformBlockCase.UniformFlags.PRECISION_HIGH), 0));
        block.setFlags(this.m_layoutFlags);

        if (this.m_numInstances > 0)
        {
            block.setInstanceName('block');
            block.setArraySize(this.m_numInstances);
        }
    };

    /**
     * BlockSingleNestedStructArrayCase constructor
     * @param {string} name The name of the test
     * @param {string} description The description of the test
     * @param {deMath.deUint32} layoutFlags
     * @param {glsUniformBlockCase.BufferMode} bufferMode
     * @param {number} numInstances
     */
    var BlockSingleNestedStructArrayCase = function(name, description, layoutFlags, bufferMode, numInstances) {
        glsUniformBlockCase.UniformBlockCase.call(this, name, description, bufferMode);
        this.m_layoutFlags = layoutFlags;
        this.m_numInstances = numInstances;
    };

    BlockSingleNestedStructArrayCase.prototype = Object.create(glsUniformBlockCase.UniformBlockCase.prototype);
    BlockSingleNestedStructArrayCase.prototype.constructor = BlockSingleNestedStructArrayCase;

    BlockSingleNestedStructArrayCase.prototype.init = function() {
        /**@type {glsUniformBlockCase.StructType}*/ var typeS = this.m_interface.allocStruct('S');
        typeS.addMember('a', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.INT_VEC3, glsUniformBlockCase.UniformFlags.PRECISION_HIGH));
        typeS.addMember('b', glsUniformBlockCase.newVarTypeArray(glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.INT_VEC2, glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM), 4));
        typeS.addMember('c', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_VEC4, glsUniformBlockCase.UniformFlags.PRECISION_HIGH), glsUniformBlockCase.UniformFlags.UNUSED_BOTH);

        /**@type {glsUniformBlockCase.StructType}*/ var typeT = this.m_interface.allocStruct('T');
        typeT.addMember('a', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_MAT3, glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM));
        typeT.addMember('b', glsUniformBlockCase.newVarTypeArray(glsUniformBlockCase.newVarTypeStruct(typeS), 3));

        /** @type {glsUniformBlockCase.UniformBlock} */ var block = this.m_interface.allocBlock('Block');
        block.addUniform(new glsUniformBlockCase.Uniform('s', glsUniformBlockCase.newVarTypeStruct(typeS), 0));
        block.addUniform(new glsUniformBlockCase.Uniform('v', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_VEC2, glsUniformBlockCase.UniformFlags.PRECISION_LOW), glsUniformBlockCase.UniformFlags.UNUSED_BOTH));
        block.addUniform(new glsUniformBlockCase.Uniform('t', glsUniformBlockCase.newVarTypeArray(glsUniformBlockCase.newVarTypeStruct(typeT), 2), 0));
        block.addUniform(new glsUniformBlockCase.Uniform('u', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.UINT, glsUniformBlockCase.UniformFlags.PRECISION_HIGH), 0));
        block.setFlags(this.m_layoutFlags);

        if (this.m_numInstances > 0)
        {
            block.setInstanceName('block');
            block.setArraySize(this.m_numInstances);
        }
    };

    /**
     * BlockMultiBasicTypesCase constructor
     * @param {string} name The name of the test
     * @param {string} description The description of the test
     * @param {deMath.deUint32} flagsA
     * @param {deMath.deUint32} flagsB
     * @param {glsUniformBlockCase.BufferMode} bufferMode
     * @param {number} numInstances
     */
    var BlockMultiBasicTypesCase = function(name, description, flagsA, flagsB, bufferMode, numInstances) {
        glsUniformBlockCase.UniformBlockCase.call(this, name, description, bufferMode);
        this.m_flagsA = flagsA;
        this.m_flagsB = flagsB;
        this.m_numInstances = numInstances;
    };

    BlockMultiBasicTypesCase.prototype = Object.create(glsUniformBlockCase.UniformBlockCase.prototype);
    BlockMultiBasicTypesCase.prototype.constructor = BlockMultiBasicTypesCase;

    BlockMultiBasicTypesCase.prototype.init = function() {
        /** @type {glsUniformBlockCase.UniformBlock} */ var blockA = this.m_interface.allocBlock('BlockA');
        blockA.addUniform(new glsUniformBlockCase.Uniform('a', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT, glsUniformBlockCase.UniformFlags.PRECISION_HIGH)));
        blockA.addUniform(new glsUniformBlockCase.Uniform('b', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.UINT_VEC3, glsUniformBlockCase.UniformFlags.PRECISION_LOW), glsUniformBlockCase.UniformFlags.UNUSED_BOTH));
        blockA.addUniform(new glsUniformBlockCase.Uniform('c', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_MAT2, glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM)));
        blockA.setInstanceName('blockA');
        blockA.setFlags(this.m_flagsA);

        /** @type {glsUniformBlockCase.UniformBlock} */ var blockB = this.m_interface.allocBlock('BlockB');
        blockB.addUniform(new glsUniformBlockCase.Uniform('a', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_MAT3, glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM)));
        blockB.addUniform(new glsUniformBlockCase.Uniform('b', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.INT_VEC2, glsUniformBlockCase.UniformFlags.PRECISION_LOW)));
        blockB.addUniform(new glsUniformBlockCase.Uniform('c', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_VEC4, glsUniformBlockCase.UniformFlags.PRECISION_HIGH), glsUniformBlockCase.UniformFlags.UNUSED_BOTH));
        blockB.addUniform(new glsUniformBlockCase.Uniform('d', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.BOOL, 0)));
        blockB.setInstanceName('blockB');
        blockB.setFlags(this.m_flagsB);

        if (this.m_numInstances > 0)
        {
            blockA.setArraySize(this.m_numInstances);
            blockB.setArraySize(this.m_numInstances);
        }
    };

    /**
     * BlockMultiNestedStructCase constructor
     * @param {string} name The name of the test
     * @param {string} description The description of the test
     * @param {deMath.deUint32} flagsA
     * @param {deMath.deUint32} flagsB
     * @param {glsUniformBlockCase.BufferMode} bufferMode
     * @param {number} numInstances
     */
    var BlockMultiNestedStructCase = function(name, description, flagsA, flagsB, bufferMode, numInstances) {
        glsUniformBlockCase.UniformBlockCase.call(this, name, description, bufferMode);
        this.m_flagsA = flagsA;
        this.m_flagsB = flagsB;
        this.m_numInstances = numInstances;
    };

    BlockMultiNestedStructCase.prototype = Object.create(glsUniformBlockCase.UniformBlockCase.prototype);
    BlockMultiNestedStructCase.prototype.constructor = BlockMultiNestedStructCase;

    BlockMultiNestedStructCase.prototype.init = function() {
        /**@type {glsUniformBlockCase.StructType}*/ var typeS = this.m_interface.allocStruct('S');
        typeS.addMember('a', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_MAT3, glsUniformBlockCase.UniformFlags.PRECISION_LOW));
        typeS.addMember('b', glsUniformBlockCase.newVarTypeArray(glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.INT_VEC2, glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM), 4));
        typeS.addMember('c', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_VEC4, glsUniformBlockCase.UniformFlags.PRECISION_HIGH));

        /**@type {glsUniformBlockCase.StructType}*/ var typeT = this.m_interface.allocStruct('T');
        typeT.addMember('a', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.UINT, glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM), glsUniformBlockCase.UniformFlags.UNUSED_BOTH);
        typeT.addMember('b', glsUniformBlockCase.newVarTypeStruct(typeS));
        typeT.addMember('c', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.BOOL_VEC4, 0));

        /** @type {glsUniformBlockCase.UniformBlock} */ var blockA = this.m_interface.allocBlock('BlockA');
        blockA.addUniform(new glsUniformBlockCase.Uniform('a', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT, glsUniformBlockCase.UniformFlags.PRECISION_HIGH)));
        blockA.addUniform(new glsUniformBlockCase.Uniform('b', glsUniformBlockCase.newVarTypeStruct(typeS)));
        blockA.addUniform(new glsUniformBlockCase.Uniform('c', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.UINT_VEC3, glsUniformBlockCase.UniformFlags.PRECISION_LOW), glsUniformBlockCase.UniformFlags.UNUSED_BOTH));
        blockA.setInstanceName('blockA');
        blockA.setFlags(this.m_flagsA);

        /** @type {glsUniformBlockCase.UniformBlock} */ var blockB = this.m_interface.allocBlock('BlockB');
        blockB.addUniform(new glsUniformBlockCase.Uniform('a', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.FLOAT_MAT2, glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM)));
        blockB.addUniform(new glsUniformBlockCase.Uniform('b', glsUniformBlockCase.newVarTypeStruct(typeT)));
        blockB.addUniform(new glsUniformBlockCase.Uniform('c', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.BOOL_VEC4, 0), glsUniformBlockCase.UniformFlags.UNUSED_BOTH));
        blockB.addUniform(new glsUniformBlockCase.Uniform('d', glsUniformBlockCase.newVarTypeBasic(gluShaderUtil.DataType.BOOL, 0)));
        blockB.setInstanceName('blockB');
        blockB.setFlags(this.m_flagsB);

        if (this.m_numInstances > 0)
        {
            blockA.setArraySize(this.m_numInstances);
            blockB.setArraySize(this.m_numInstances);
        }
    };

    /**
     * Creates the test hierarchy to be executed.
     * @param {string} filter A filter to select particular tests.
     **/
    var init = function() {
        /** @const @type {tcuTestCase.DeqpTest} */ var testGroup = tcuTestCase.runner.getState().testCases;

        /** @type {gluShaderUtil.DataType} */
        var basicTypes = [
            gluShaderUtil.DataType.FLOAT,
            gluShaderUtil.DataType.FLOAT_VEC2,
            gluShaderUtil.DataType.FLOAT_VEC3,
            gluShaderUtil.DataType.FLOAT_VEC4,
            gluShaderUtil.DataType.INT,
            gluShaderUtil.DataType.INT_VEC2,
            gluShaderUtil.DataType.INT_VEC3,
            gluShaderUtil.DataType.INT_VEC4,
            gluShaderUtil.DataType.UINT,
            gluShaderUtil.DataType.UINT_VEC2,
            gluShaderUtil.DataType.UINT_VEC3,
            gluShaderUtil.DataType.UINT_VEC4,
            gluShaderUtil.DataType.BOOL,
            gluShaderUtil.DataType.BOOL_VEC2,
            gluShaderUtil.DataType.BOOL_VEC3,
            gluShaderUtil.DataType.BOOL_VEC4,
            gluShaderUtil.DataType.FLOAT_MAT2,
            gluShaderUtil.DataType.FLOAT_MAT3,
            gluShaderUtil.DataType.FLOAT_MAT4,
            gluShaderUtil.DataType.FLOAT_MAT2X3,
            gluShaderUtil.DataType.FLOAT_MAT2X4,
            gluShaderUtil.DataType.FLOAT_MAT3X2,
            gluShaderUtil.DataType.FLOAT_MAT3X4,
            gluShaderUtil.DataType.FLOAT_MAT4X2,
            gluShaderUtil.DataType.FLOAT_MAT4X3
        ];

        /** @type {Array.<string, glsUniformBlockCase.UniformFlags>} */
        var precisionFlags = [
            { name: 'lowp', flags: glsUniformBlockCase.UniformFlags.PRECISION_LOW },
            { name: 'mediump', flags: glsUniformBlockCase.UniformFlags.PRECISION_MEDIUM },
            { name: 'highp', flags: glsUniformBlockCase.UniformFlags.PRECISION_HIGH }
        ];

        /** @type {Array.<string, glsUniformBlockCase.UniformFlags>} */
        var layoutFlags = [
            { name: 'shared', flags: glsUniformBlockCase.UniformFlags.LAYOUT_SHARED },
            //{ name: 'packed', flags: glsUniformBlockCase.UniformFlags.LAYOUT_PACKED },
            { name: 'std140', flags: glsUniformBlockCase.UniformFlags.LAYOUT_STD140 }
        ];

        /** @type {Array.<string, glsUniformBlockCase.UniformFlags>} */
        var matrixFlags = [
            { name: 'row_major', flags: glsUniformBlockCase.UniformFlags.LAYOUT_ROW_MAJOR },
            { name: 'column_major', flags: glsUniformBlockCase.UniformFlags.LAYOUT_COLUMN_MAJOR }
        ];

        /** @type {Array.<string, glsUniformBlockCase.BufferMode>} */
        var bufferModes = [
            { name: 'per_block_buffer', mode: glsUniformBlockCase.BufferMode.BUFFERMODE_PER_BLOCK },
            { name: 'single_buffer', mode: glsUniformBlockCase.BufferMode.BUFFERMODE_SINGLE }
        ];

        // ubo.single_basic_type
        /** @type {tcuTestCase.DeqpTest} */
        var singleBasicTypeGroup = tcuTestCase.newTest('single_basic_type', 'Single basic variable in single buffer');

        testGroup.addChild(singleBasicTypeGroup);

        for (var layoutFlagNdx = 0; layoutFlagNdx < layoutFlags.length; layoutFlagNdx++)
        {
            /** @type {tcuTestCase.deqpTest} */
            var layoutGroup = new tcuTestCase.newTest(layoutFlags[layoutFlagNdx].name, '', null);
            singleBasicTypeGroup.addChild(layoutGroup);

            for (var basicTypeNdx = 0; basicTypeNdx < basicTypes.length; basicTypeNdx++)
            {
                /** @type {gluShaderUtil.DataType} */ var type = basicTypes[basicTypeNdx];
                /** @type {string} */ var typeName = gluShaderUtil.getDataTypeName(type);

                if (gluShaderUtil.isDataTypeBoolOrBVec(type))
                    createBlockBasicTypeCases(layoutGroup, typeName, glsUniformBlockCase.newVarTypeBasic(type, 0), layoutFlags[layoutFlagNdx].flags);
                else
                {
                    for (var precNdx = 0; precNdx < precisionFlags.length; precNdx++)
                        createBlockBasicTypeCases(layoutGroup, precisionFlags[precNdx].name + '_' + typeName,
                        glsUniformBlockCase.newVarTypeBasic(type, precisionFlags[precNdx].flags), layoutFlags[layoutFlagNdx].flags);
                }

                if (gluShaderUtil.isDataTypeMatrix(type))
                {
                    for (var matFlagNdx = 0; matFlagNdx < matrixFlags.length; matFlagNdx++)
                    {
                        for (var precNdx = 0; precNdx < precisionFlags.length; precNdx++)
                            createBlockBasicTypeCases(layoutGroup, matrixFlags[matFlagNdx].name + '_' + precisionFlags[precNdx].name + '_' + typeName,
                            glsUniformBlockCase.newVarTypeBasic(type, precisionFlags[precNdx].flags), layoutFlags[layoutFlagNdx].flags | matrixFlags[matFlagNdx].flags);
                    }
                }
            }
        }
        bufferedLogToConsole('ubo.single_basic_type: Tests created');

        // ubo.single_basic_array
        /** @type {tcuTestCase.DeqpTest} */
        var singleBasicArrayGroup = tcuTestCase.newTest('single_basic_array', 'Single basic array variable in single buffer');
        testGroup.addChild(singleBasicArrayGroup);

        for (var layoutFlagNdx = 0; layoutFlagNdx < layoutFlags.length; layoutFlagNdx++)
        {
            /** @type {tcuTestCase.deqpTest} */
            var layoutGroup = new tcuTestCase.newTest(layoutFlags[layoutFlagNdx].name, '', null);
            singleBasicArrayGroup.addChild(layoutGroup);

            for (var basicTypeNdx = 0; basicTypeNdx < basicTypes.length; basicTypeNdx++)
            {
                /** @type {gluShaderUtil.DataType} */ var type = basicTypes[basicTypeNdx];
                /** @type {string} */ var typeName = gluShaderUtil.getDataTypeName(type);
                /** @type {number} */ var arraySize = 3;

                createBlockBasicTypeCases(layoutGroup, typeName,
                    glsUniformBlockCase.newVarTypeArray(glsUniformBlockCase.newVarTypeBasic(type, gluShaderUtil.isDataTypeBoolOrBVec(type) ? 0 : glsUniformBlockCase.UniformFlags.PRECISION_HIGH), arraySize),
                    layoutFlags[layoutFlagNdx].flags);

                if (gluShaderUtil.isDataTypeMatrix(type))
                {
                    for (var matFlagNdx = 0; matFlagNdx < matrixFlags.length; matFlagNdx++)
                        createBlockBasicTypeCases(layoutGroup, matrixFlags[matFlagNdx].name + '_' + typeName,
                        glsUniformBlockCase.newVarTypeArray(glsUniformBlockCase.newVarTypeBasic(type, glsUniformBlockCase.UniformFlags.PRECISION_HIGH), arraySize),
                            layoutFlags[layoutFlagNdx].flags | matrixFlags[matFlagNdx].flags);
                }
            }
        }
        bufferedLogToConsole('ubo.single_basic_array: Tests created');

        // ubo.single_struct
        /** @type {tcuTestCase.DeqpTest} */
        var singleStructGroup = tcuTestCase.newTest('single_struct', 'Single struct in uniform block');
        testGroup.addChild(singleStructGroup);

        for (var modeNdx = 0; modeNdx < bufferModes.length; modeNdx++)
        {
            /** @type {tcuTestCase.deqpTest} */
            var modeGroup = new tcuTestCase.newTest(bufferModes[modeNdx].name, '');
            singleStructGroup.addChild(modeGroup);

            for (var layoutFlagNdx = 0; layoutFlagNdx < layoutFlags.length; layoutFlagNdx++)
            {
                for (var isArray = 0; isArray < 2; isArray++)
                {
                    /** @type {string} */ var baseName = layoutFlags[layoutFlagNdx].name;
                    /** @type {deMath.deUint32} */ var baseFlags = layoutFlags[layoutFlagNdx].flags;

                    if (bufferModes[modeNdx].mode == glsUniformBlockCase.BufferMode.BUFFERMODE_SINGLE && isArray == 0)
                        continue; // Doesn't make sense to add this variant.

                    if (isArray)
                        baseName += '_instance_array';

                    modeGroup.addChild(new BlockSingleStructCase(baseName + '_vertex', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX, bufferModes[modeNdx].mode, isArray ? 3 : 0));
                    modeGroup.addChild(new BlockSingleStructCase(baseName + '_fragment', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));

                    if (!(baseFlags & glsUniformBlockCase.UniformFlags.LAYOUT_PACKED))
                        modeGroup.addChild(new BlockSingleStructCase(baseName + '_both', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));
                }
            }
        }
        bufferedLogToConsole('ubo.single_struct: Tests created');

        // ubo.single_struct_array
        /** @type {tcuTestCase.DeqpTest} */
        var singleStructArrayGroup = tcuTestCase.newTest('single_struct_array', 'Struct array in one uniform block');
        testGroup.addChild(singleStructArrayGroup);

        for (var modeNdx = 0; modeNdx < bufferModes.length; modeNdx++)
        {
            /** @type {tcuTestCase.deqpTest} */
            var modeGroup = new tcuTestCase.newTest(bufferModes[modeNdx].name, '');
            singleStructArrayGroup.addChild(modeGroup);

            for (var layoutFlagNdx = 0; layoutFlagNdx < layoutFlags.length; layoutFlagNdx++)
            {
                for (var isArray = 0; isArray < 2; isArray++)
                {
                    /** @type {string} */ var baseName = layoutFlags[layoutFlagNdx].name;
                    /** @type {deMath.deUint32} */ var baseFlags = layoutFlags[layoutFlagNdx].flags;

                    if (bufferModes[modeNdx].mode == glsUniformBlockCase.BufferMode.BUFFERMODE_SINGLE && isArray == 0)
                        continue; // Doesn't make sense to add this variant.

                    if (isArray)
                        baseName += '_instance_array';

                    modeGroup.addChild(new BlockSingleStructArrayCase(baseName + '_vertex', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX, bufferModes[modeNdx].mode, isArray ? 3 : 0));
                    modeGroup.addChild(new BlockSingleStructArrayCase(baseName + '_fragment', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));

                    if (!(baseFlags & glsUniformBlockCase.UniformFlags.LAYOUT_PACKED))
                        modeGroup.addChild(new BlockSingleStructArrayCase(baseName + '_both', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));
                }
            }
        }
        bufferedLogToConsole('ubo.single_struct_array: Tests created');

        // ubo.single_nested_struct
        /** @type {tcuTestCase.DeqpTest} */
        var singleNestedStructGroup = tcuTestCase.newTest('single_nested_struct', 'Nested struct in one uniform block');
        testGroup.addChild(singleNestedStructGroup);

        for (var modeNdx = 0; modeNdx < bufferModes.length; modeNdx++)
        {
            /** @type {tcuTestCase.deqpTest} */
            var modeGroup = new tcuTestCase.newTest(bufferModes[modeNdx].name, '');
            singleNestedStructGroup.addChild(modeGroup);

            for (var layoutFlagNdx = 0; layoutFlagNdx < layoutFlags.length; layoutFlagNdx++)
            {
                for (var isArray = 0; isArray < 2; isArray++)
                {
                    /** @type {string} */ var baseName = layoutFlags[layoutFlagNdx].name;
                    /** @type {deMath.deUint32} */ var baseFlags = layoutFlags[layoutFlagNdx].flags;

                    if (bufferModes[modeNdx].mode == glsUniformBlockCase.BufferMode.BUFFERMODE_SINGLE && isArray == 0)
                        continue; // Doesn't make sense to add this variant.

                    if (isArray)
                        baseName += '_instance_array';

                    modeGroup.addChild(new BlockSingleNestedStructCase(baseName + '_vertex', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX, bufferModes[modeNdx].mode, isArray ? 3 : 0));
                    modeGroup.addChild(new BlockSingleNestedStructCase(baseName + '_fragment', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));

                    if (!(baseFlags & glsUniformBlockCase.UniformFlags.LAYOUT_PACKED))
                        modeGroup.addChild(new BlockSingleNestedStructCase(baseName + '_both', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));
                }
            }
        }
        bufferedLogToConsole('ubo.single_nested_struct: Tests created');

        // ubo.single_nested_struct_array
        /** @type {tcuTestCase.DeqpTest} */
        var singleNestedStructArrayGroup = tcuTestCase.newTest('single_nested_struct_array', 'Nested struct array in one uniform block');
        testGroup.addChild(singleNestedStructArrayGroup);

        for (var modeNdx = 0; modeNdx < bufferModes.length; modeNdx++)
        {
            /** @type {tcuTestCase.deqpTest} */
            var modeGroup = new tcuTestCase.newTest(bufferModes[modeNdx].name, '');
            singleNestedStructArrayGroup.addChild(modeGroup);

            for (var layoutFlagNdx = 0; layoutFlagNdx < layoutFlags.length; layoutFlagNdx++)
            {
                for (var isArray = 0; isArray < 2; isArray++)
                {
                    /** @type {string} */ var baseName = layoutFlags[layoutFlagNdx].name;
                    /** @type {deMath.deUint32} */ var baseFlags = layoutFlags[layoutFlagNdx].flags;

                    if (bufferModes[modeNdx].mode == glsUniformBlockCase.BufferMode.BUFFERMODE_SINGLE && isArray == 0)
                        continue; // Doesn't make sense to add this variant.

                    if (isArray)
                        baseName += '_instance_array';

                    modeGroup.addChild(new BlockSingleNestedStructArrayCase(baseName + '_vertex', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX, bufferModes[modeNdx].mode, isArray ? 3 : 0));
                    modeGroup.addChild(new BlockSingleNestedStructArrayCase(baseName + '_fragment', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));

                    if (!(baseFlags & glsUniformBlockCase.UniformFlags.LAYOUT_PACKED))
                        modeGroup.addChild(new BlockSingleNestedStructArrayCase(baseName + '_both', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));
                }
            }
        }
        bufferedLogToConsole('ubo.single_nested_struct_array: Tests created');

        // ubo.instance_array_basic_type
        /** @type {tcuTestCase.DeqpTest} */
        var instanceArrayBasicTypeGroup = tcuTestCase.newTest('instance_array_basic_type', 'Single basic variable in instance array');
        testGroup.addChild(instanceArrayBasicTypeGroup);

        for (var layoutFlagNdx = 0; layoutFlagNdx < layoutFlags.length; layoutFlagNdx++)
        {
            /** @type {tcuTestCase.deqpTest} */
            var layoutGroup = new tcuTestCase.newTest(layoutFlags[layoutFlagNdx].name, '');
            instanceArrayBasicTypeGroup.addChild(layoutGroup);

            for (var basicTypeNdx = 0; basicTypeNdx < basicTypes.length; basicTypeNdx++)
            {
                /** @type {gluShaderUtil.DataType} */ var type = basicTypes[basicTypeNdx];
                /** @type {string} */ var typeName = gluShaderUtil.getDataTypeName(type);
                /** @type {number} */ var numInstances = 3;

                createBlockBasicTypeCases(layoutGroup, typeName,
                    glsUniformBlockCase.newVarTypeBasic(type, gluShaderUtil.isDataTypeBoolOrBVec(type) ? 0 : glsUniformBlockCase.UniformFlags.PRECISION_HIGH),
                    layoutFlags[layoutFlagNdx].flags, numInstances);

                if (gluShaderUtil.isDataTypeMatrix(type))
                {
                    for (var matFlagNdx = 0; matFlagNdx < matrixFlags.length; matFlagNdx++)
                        createBlockBasicTypeCases(layoutGroup, matrixFlags[matFlagNdx].name + '_' + typeName,
                        glsUniformBlockCase.newVarTypeBasic(type, glsUniformBlockCase.UniformFlags.PRECISION_HIGH), layoutFlags[layoutFlagNdx].flags | matrixFlags[matFlagNdx].flags,
                            numInstances);
                }
            }
        }
        bufferedLogToConsole('ubo.instance_array_basic_type: Tests created');

        // ubo.multi_basic_types
        /** @type {tcuTestCase.DeqpTest} */
        var multiBasicTypesGroup = tcuTestCase.newTest('multi_basic_types', 'Multiple buffers with basic types');
        testGroup.addChild(multiBasicTypesGroup);

        for (var modeNdx = 0; modeNdx < bufferModes.length; modeNdx++)
        {
            /** @type {tcuTestCase.deqpTest} */
            var modeGroup = new tcuTestCase.newTest(bufferModes[modeNdx].name, '');
            multiBasicTypesGroup.addChild(modeGroup);

            for (var layoutFlagNdx = 0; layoutFlagNdx < layoutFlags.length; layoutFlagNdx++)
            {
                for (var isArray = 0; isArray < 2; isArray++)
                {
                    /** @type {string} */ var baseName = layoutFlags[layoutFlagNdx].name;
                    /** @type {deMath.deUint32} */ var baseFlags = layoutFlags[layoutFlagNdx].flags;

                    if (isArray)
                        baseName += '_instance_array';

                    modeGroup.addChild(new BlockMultiBasicTypesCase(baseName + '_vertex', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX, baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX, bufferModes[modeNdx].mode, isArray ? 3 : 0));
                    modeGroup.addChild(new BlockMultiBasicTypesCase(baseName + '_fragment', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));

                    if (!(baseFlags & glsUniformBlockCase.UniformFlags.LAYOUT_PACKED))
                        modeGroup.addChild(new BlockMultiBasicTypesCase(baseName + '_both', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));

                    modeGroup.addChild(new BlockMultiBasicTypesCase(baseName + '_mixed', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX, baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));
                }
            }
        }
        bufferedLogToConsole('ubo.multi_basic_types: Tests created');

        // ubo.multi_nested_struct
        /** @type {tcuTestCase.DeqpTest} */
        var multiNestedStructGroup = tcuTestCase.newTest('multi_nested_struct', 'Multiple buffers with basic types');
        testGroup.addChild(multiNestedStructGroup);

        for (var modeNdx = 0; modeNdx < bufferModes.length; modeNdx++)
        {
            /** @type {tcuTestCase.deqpTest} */
            var modeGroup = new tcuTestCase.newTest(bufferModes[modeNdx].name, '');
            multiNestedStructGroup.addChild(modeGroup);

            for (var layoutFlagNdx = 0; layoutFlagNdx < layoutFlags.length; layoutFlagNdx++)
            {
                for (var isArray = 0; isArray < 2; isArray++)
                {
                    /** @type {string} */ var baseName = layoutFlags[layoutFlagNdx].name;
                    /** @type {deMath.deUint32} */ var baseFlags = layoutFlags[layoutFlagNdx].flags;

                    if (isArray)
                        baseName += '_instance_array';

                    modeGroup.addChild(new BlockMultiNestedStructCase(baseName + '_vertex', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX, baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX, bufferModes[modeNdx].mode, isArray ? 3 : 0));
                    modeGroup.addChild(new BlockMultiNestedStructCase(baseName + '_fragment', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));

                    if (!(baseFlags & glsUniformBlockCase.UniformFlags.LAYOUT_PACKED))
                        modeGroup.addChild(new BlockMultiNestedStructCase(baseName + '_both', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));

                    modeGroup.addChild(new BlockMultiNestedStructCase(baseName + '_mixed', '', baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_VERTEX, baseFlags | glsUniformBlockCase.UniformFlags.DECLARE_FRAGMENT, bufferModes[modeNdx].mode, isArray ? 3 : 0));
                }
            }
        }
        bufferedLogToConsole('ubo.multi_nested_struct: Tests created');

        // ubo.random
        {
             /** @type {deMath.deUint32} */ var allShaders = glsRandomUniformBlockCase.FeatureBits.FEATURE_VERTEX_BLOCKS | glsRandomUniformBlockCase.FeatureBits.FEATURE_FRAGMENT_BLOCKS | glsRandomUniformBlockCase.FeatureBits.FEATURE_SHARED_BLOCKS;
             /** @type {deMath.deUint32} */ var allLayouts = glsRandomUniformBlockCase.FeatureBits.FEATURE_PACKED_LAYOUT | glsRandomUniformBlockCase.FeatureBits.FEATURE_SHARED_LAYOUT | glsRandomUniformBlockCase.FeatureBits.FEATURE_STD140_LAYOUT;
             /** @type {deMath.deUint32} */ var allBasicTypes = glsRandomUniformBlockCase.FeatureBits.FEATURE_VECTORS | glsRandomUniformBlockCase.FeatureBits.FEATURE_MATRICES;
             /** @type {deMath.deUint32} */ var unused = glsRandomUniformBlockCase.FeatureBits.FEATURE_UNUSED_MEMBERS | glsRandomUniformBlockCase.FeatureBits.FEATURE_UNUSED_UNIFORMS;
             /** @type {deMath.deUint32} */ var matFlags = glsRandomUniformBlockCase.FeatureBits.FEATURE_MATRIX_LAYOUT;
             /** @type {deMath.deUint32} */ var allFeatures = (~glsRandomUniformBlockCase.FeatureBits.FEATURE_ARRAYS_OF_ARRAYS & 0xFFFF);

             /** @type {tcuTestCase.DeqpTest} */
             var randomGroup = new tcuTestCase.newTest('random', 'Random Uniform Block cases');
             testGroup.addChild(randomGroup);

             // Basic types.
             createRandomCaseGroup(randomGroup, 'scalar_types', 'Scalar types only, per-block buffers', glsUniformBlockCase.BufferMode.BUFFERMODE_PER_BLOCK, allShaders | allLayouts | unused, 25, 0);
             createRandomCaseGroup(randomGroup, 'vector_types', 'Scalar and vector types only, per-block buffers', glsUniformBlockCase.BufferMode.BUFFERMODE_PER_BLOCK, allShaders | allLayouts | unused | glsRandomUniformBlockCase.FeatureBits.FEATURE_VECTORS, 25, 25);
             createRandomCaseGroup(randomGroup, 'basic_types', 'All basic types, per-block buffers', glsUniformBlockCase.BufferMode.BUFFERMODE_PER_BLOCK, allShaders | allLayouts | unused | allBasicTypes | matFlags, 25, 50);
             createRandomCaseGroup(randomGroup, 'basic_arrays', 'Arrays, per-block buffers', glsUniformBlockCase.BufferMode.BUFFERMODE_PER_BLOCK, allShaders | allLayouts | unused | allBasicTypes | matFlags | glsRandomUniformBlockCase.FeatureBits.FEATURE_ARRAYS, 25, 50);

             createRandomCaseGroup(randomGroup, 'basic_instance_arrays', 'Basic instance arrays, per-block buffers', glsUniformBlockCase.BufferMode.BUFFERMODE_PER_BLOCK, allShaders | allLayouts | unused | allBasicTypes | matFlags | glsRandomUniformBlockCase.FeatureBits.FEATURE_INSTANCE_ARRAYS, 25, 75);
             createRandomCaseGroup(randomGroup, 'nested_structs', 'Nested structs, per-block buffers', glsUniformBlockCase.BufferMode.BUFFERMODE_PER_BLOCK, allShaders | allLayouts | unused | allBasicTypes | matFlags | glsRandomUniformBlockCase.FeatureBits.FEATURE_STRUCTS, 25, 100);
             createRandomCaseGroup(randomGroup, 'nested_structs_arrays', 'Nested structs, arrays, per-block buffers', glsUniformBlockCase.BufferMode.BUFFERMODE_PER_BLOCK, allShaders | allLayouts | unused | allBasicTypes | matFlags | glsRandomUniformBlockCase.FeatureBits.FEATURE_STRUCTS | glsRandomUniformBlockCase.FeatureBits.FEATURE_ARRAYS, 25, 150);
             createRandomCaseGroup(randomGroup, 'nested_structs_instance_arrays', 'Nested structs, instance arrays, per-block buffers', glsUniformBlockCase.BufferMode.BUFFERMODE_PER_BLOCK, allShaders | allLayouts | unused | allBasicTypes | matFlags | glsRandomUniformBlockCase.FeatureBits.FEATURE_STRUCTS | glsRandomUniformBlockCase.FeatureBits.FEATURE_INSTANCE_ARRAYS, 25, 125);
             createRandomCaseGroup(randomGroup, 'nested_structs_arrays_instance_arrays', 'Nested structs, instance arrays, per-block buffers', glsUniformBlockCase.BufferMode.BUFFERMODE_PER_BLOCK, allShaders | allLayouts | unused | allBasicTypes | matFlags | glsRandomUniformBlockCase.FeatureBits.FEATURE_STRUCTS | glsRandomUniformBlockCase.FeatureBits.FEATURE_ARRAYS | glsRandomUniformBlockCase.FeatureBits.FEATURE_INSTANCE_ARRAYS, 25, 175);

             createRandomCaseGroup(randomGroup, 'all_per_block_buffers', 'All random features, per-block buffers', glsUniformBlockCase.BufferMode.BUFFERMODE_PER_BLOCK, allFeatures, 50, 200);
             createRandomCaseGroup(randomGroup, 'all_shared_buffer', 'All random features, shared buffer', glsUniformBlockCase .BufferMode.BUFFERMODE_SINGLE, allFeatures, 50, 250);
         }
         bufferedLogToConsole('ubo.random: Tests created');
    };

    /**
     * Create and execute the test cases
     */
    var run = function() {
        //Set up Test Root parameters
        var testName = 'ubo';
        var testDescription = 'Uniform Block Tests';
        var state = tcuTestCase.runner.getState();

        state.testName = testName;
        state.testCases = tcuTestCase.newTest(testName, testDescription, null);

        //Set up name and description of this test series.
        setCurrentTestName(testName);
        description(testDescription);

        try {
            //Create test cases
            init();
            //Run test cases
            tcuTestCase.runTestCases();
        }
        catch (err) {
            testFailedOptions('Failed to run tests', false);
            tcuTestCase.runner.terminate();
        }
    };

    return {
        run: run
    };
});
