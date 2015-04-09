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

define([
    'framework/opengl/gluShaderUtil',
    'framework/opengl/gluDrawUtil',
    'framework/opengl/gluVarType',
    'framework/opengl/gluVarTypeUtil',
    'framework/opengl/gluShaderProgram',
    'framework/delibs/debase/deRandom',
    'framework/delibs/debase/deMath',
    'framework/delibs/debase/deString',
    'framework/common/tcuTestCase',
    'framework/common/tcuSurface',
    'framework/common/tcuImageCompare'
], function(
    gluShaderUtil, gluDrawUtil, gluVarType, gluVarTypeUtil, gluShaderProgram, deRandom, deMath, deString,
    tcuTestCase, tcuSurface, tcuImageCompare
) {
    'use strict';

    /** @const @type {number} */ var VIEWPORT_WIDTH = 128;
    /** @const @type {number} */ var VIEWPORT_HEIGHT = 128;
    /** @const @type {number} */ var BUFFER_GUARD_MULTIPLIER = 2;

    /**
     * Enums for interpolation
     * @enum {number}
     */
    var interpolation = {

        SMOOTH: 0,
        FLAT: 1,
        CENTROID: 2

    };

    /**
     * Returns interpolation name: smooth, flat or centroid
     * @param {number} interpol interpolation enum value
     * @return {string}
     */
    var getInterpolationName = function(interpol) {

        switch (interpol) {
        case interpolation.SMOOTH: return 'smooth';
        case interpolation.FLAT: return 'flat';
        case interpolation.CENTROID: return 'centroid';
        default:
            throw new Error('Unrecognized interpolation name ' + interpol);
       }

    };

    var GLU_EXPECT_NO_ERROR = function(gl, err, msg) {
        if (err != gl.NO_ERROR) {
            if (msg) msg += ': ';

            msg += "gl.GetError() returned " + err;

            throw new Error(msg)
        }
    };
    var DE_ASSERT = function(x) {
        if (!x)
            throw new Error('Assert failed');
    };

    /**
     * Returns a Varying object, it's a struct, invoked in the C version as a function
     * @param {string} name
     * @param {gluVarType.VarType} type
     * @param {number} interpolation
     * @return {Object}
     * @constructor
     */
    var Varying = function(name, type, interpolation) {
        this.name = name;
        this.type = type;
        this.interpolation = interpolation;
    };

    /** findAttributeNameEquals
     * Replaces original implementation of "VaryingNameEquals" and "AttributeNameEquals" in the C++ version
     * Returns an Attribute or Varying object which matches its name with the passed string value in the function
     * @param {Array.<Attribute> || Array.<Varying>} array
     * @param {string} name
     * @return {Attribute || Varying}
     */
    var findAttributeNameEquals = function(array, name) {
        for (var pos = 0; pos < array.length; pos++) {
            if (array[pos].name === name) {
                return array[pos];
            }
        }
    };

    /**
     * Constructs an Attribute object, it's a struct, invoked in the C version as a function
     * @param {string} name
     * @param {gluVarType.VarType} type
     * @param {number} offset
     * @constructor
     */
    var Attribute = function(name, type, offset) {
        this.name = name;
        this.type = type;
        this.offset = offset;
    };

    /**
     * Constructs an Output object
     * @constructor
     */
    var Output = function() {
        /** @type {number}            */ this.bufferNdx = 0;
        /** @type {number}            */ this.offset = 0;
        /** @type {string}            */ this.name = null;
        /** @type {gluVarType.VarType} */ this.type = null;
        /** @type {Array.<Attribute>} */ this.inputs = [];
    };

    /**
     * Constructs an object type DrawCall.
     * Contains the number of elements as well as whether the Transform Feedback is enabled or not.
     * It's a struct, but as occurs in Varying, is invoked in the C++ version as a function.
     * @param {number} numElements
     * @param {boolean} tfEnabled is Transform Feedback enabled or not
     * @constructor
     */
    var DrawCall = function(numElements, tfEnabled) {
        this.numElements = numElements;
        this.transformFeedbackEnabled = tfEnabled;
    };

    /**
     * @constructor
     */
    var ProgramSpec = function() {

    /** @type {Array.<gluVarType.StructType>} */ var m_structs = [];
    /** @type {Array.<Varying>}          */ var m_varyings = [];
    /** @type {Array.<string>}           */ var m_transformFeedbackVaryings = [];

        this.createStruct = function(name) {
            var struct = gluVarType.newStructType(name);
            m_structs.push(struct);
            return struct;
        };

        this.addVarying = function(name, type, interp) {
            m_varyings.push(new Varying(name, type, interp));
        };

        this.addTransformFeedbackVarying = function(name) {
            m_transformFeedbackVaryings.push(name);
        };

        this.getStructs = function() {
            return m_structs;
        };
        this.getVaryings = function() {
            return m_varyings;
        };
        this.getTransformFeedbackVaryings = function() {
            return m_transformFeedbackVaryings;
        };

        this.isPointSizeUsed = function() {
            for (var i = 0; i < m_transformFeedbackVaryings.length; ++i) {
                if (m_transformFeedbackVaryings[i] == 'gl_PointSize') return true;
            }
            return false;
        };

    };

    /** Returns if the program is supported or not
     * @param {WebGLRenderingContext} gl WebGL context
     * @param {ProgramSpec} spec
     * @param {number} tfMode
     * @return {boolean}
     */
    var isProgramSupported = function(gl, spec, tfMode) {

        // all ints
        /** @type {number} */ var maxVertexAttribs = 0;
        /** @type {number} */ var maxTfInterleavedComponents = 0;
        /** @type {number} */ var maxTfSeparateAttribs = 0;
        /** @type {number} */ var maxTfSeparateComponents = 0;

        maxVertexAttribs           = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        maxTfInterleavedComponents = gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS);
        maxTfSeparateAttribs       = gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS);
        maxTfSeparateComponents    = gl.getParameter(gl.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS);

        // Check vertex attribs.
        /** @type {number} */ var totalVertexAttribs = (
            1 /* a_position */ + (spec.isPointSizeUsed() ? 1 : 0)
        );

        for (var i = 0; i < spec.getVaryings().length; ++i) {
            for (var v_iter = gluVarTypeUtil.VectorTypeIterator(spec.getVaryings()[i]); !v_iter.end(); v_iter.next()) {
                totalVertexAttribs += 1;
            }
        }

        if (totalVertexAttribs > maxVertexAttribs)
            return false; // Vertex attribute count exceeded.

        // check varyings
        /** @type {number}                  */ var totalTfComponents = 0;
        /** @type {number}                  */ var totalTfAttribs = 0;
        /** @type {Object.<number, number>} */ var presetNumComponents = {
            gl_Position: 4,
            gl_PointSize: 1
        };
        for (var i = 0; i < spec.getTransformFeedbackVaryings().length; ++i) {
            /** @type {Array.<string>} */ var name = spec.getTransformFeedbackVaryings()[i];
            /** @type {number} */ var numComponents = 0;

            if (typeof(presetNumComponents[name]) != 'undefined') {
                numComponents = presetNumComponents[name];
            } else {
                var varName = gluVarTypeUtil.parseVariableName(name);
                // find the varying called varName
                /** @type {Varying} */ var varying = (function(varyings) {
                    for (var i = 0; i < varyings.length; ++i) {
                        if (varyings[i].name == varName) {
                            return varyings[i];
                        }
                    }
                    return null;
                }(spec.getVaryings()));

                // glu::TypeComponentVector
                var varPath = gluVarType.parseTypePath(name, varying.type);
                numComponents = gluVarTypeUtil.getVarType(varying.type, varPath).getScalarSize();
            }

            if (tfMode == gl.SEPARATE_ATTRIBS && numComponents > maxTfSeparateComponents)
                return false; // Per-attribute component count exceeded.

            totalTfComponents += numComponents;
            totalTfAttribs += 1;
        }

        if (tfMode == gl.SEPARATE_ATTRIBS && totalTfAttribs > maxTfSeparateAttribs)
            return false;

        if (tfMode == gl.INTERLEAVED_ATTRIBS && totalTfComponents > maxTfInterleavedComponents)
            return false;

        return true;

    };

    /**
     * @param {string} varyingName
     * @param {Array.<string>} path
     * @return {string}
     */
    var getAttributeName = function(varyingName, path) {
    /** @type {string} */ var str = 'a_' + varyingName.substr(/^v_/.test(varyingName) ? 2 : 0);

        for (var i = 0; i < path.length; ++i) {
        /** @type {string} */ var prefix;

            switch (path[i].type) {
                case gluVarTypeUtil.VarTypeComponent.s_Type.STRUCT_MEMBER: prefix = '_m'; break;
                case gluVarTypeUtil.VarTypeComponent.s_Type.ARRAY_ELEMENT: prefix = '_e'; break;
                case gluVarTypeUtil.VarTypeComponent.s_Type.MATRIX_COLUMN: prefix = '_c'; break;
                case gluVarTypeUtil.VarTypeComponent.s_Type.VECTOR_COMPONENT: prefix = '_s'; break;
                default:
                    throw new Error('invalid type in the component path.');
            }
            str += prefix + path[i].index;
        }
        return str;
    };

    /**
     * original definition:
     * static void genShaderSources (const ProgramSpec& spec, std::string& vertSource, std::string& fragSource, bool pointSizeRequired)
     * in place of the std::string references, this function returns those params in an object
     *
     * @param {ProgramSpec} spec
     * @param {boolean} pointSizeRequired
     * @return {Object.<string, string>}
     */
    var genShaderSources = function(spec, pointSizeRequired) {

        var vtx = { str: null };
        var frag = { str: null };
        var addPointSize = spec.isPointSizeUsed();

        vtx.str = '#version 300 es\n'
                 + 'in highp vec4 a_position;\n';
        frag.str = '#version 300 es\n'
                 + 'layout(location = 0) out mediump vec4 o_color;\n'
                 + 'uniform highp vec4 u_scale;\n'
                 + 'uniform highp vec4 u_bias;\n';

        if (addPointSize) {
            vtx.str += 'in highp float a_pointSize;\n';
        }

        // Declare attributes.
        for (var i = 0; i < spec.getVaryings().length; ++i) {

        /** @type {string} */ var name = spec.getVaryings()[i].name;
        /** @type {gluVarType.VarType} */ var type = spec.getVaryings()[i].type;

            for (var vecIter = new gluVarTypeUtil.VectorTypeIterator(type); !vecIter.end(); vecIter.next()) {

                /** @type {gluVarType.VarType} */
                var attribType = gluVarTypeUtil.getVarType(type, vecIter.getPath());

                /** @type {string} */
                var attribName = getAttributeName(name, vecIter.getPath());
                vtx.str += 'in ' + gluVarType.declareVariable(attribType, attribName) + ';\n';

            }
        }

        // Declare varyings.
        for (var ndx = 0; ndx < 2; ++ndx) {
        /** @type {string} */ var inout = ndx ? 'in' : 'out';
        /** @type {string} */ var shader = ndx ? frag : vtx;

            for (var i = 0; i < spec.getStructs().length; ++i) {
                var struct = spec.getStructs()[i];
                if (struct.hasTypeName()) {
                    shader.str += gluVarType.declareStructType(struct) + ';\n';
                }
            }

            /** @type {Array.<Varying>} */ var varyings = spec.getVaryings();
            for (var i = 0; i < varyings.length; ++i) {
            	var varying = varyings[i];
                shader.str += getInterpolationName(varying.interpolation)
                           + ' ' + inout + ' '
                           + gluVarType.declareVariable(varying.type, varying.name)
                           + ';\n';
            }
        }

        vtx.str  += '\nvoid main (void)\n{\n'
                 +  '\tgl_Position = a_position;\n';
        frag.str += '\nvoid main (void)\n{\n'
                 +  '\thighp vec4 res = vec4(0.0);\n';

        if (addPointSize) {
            vtx.str += '\tgl_PointSize = a_pointSize;\n';
        } else if (pointSizeRequired) {
            vtx.str += '\tgl_PointSize = 1.0;\n';
        }

        for (var i = 0; i < spec.getVaryings().length; ++i) {
        /** @type {string} */ var name = spec.getVaryings()[i].name;
        /** @type {gluVarType.VarType} */ var type = spec.getVaryings()[i].type;

            for (var vecIter = new gluVarTypeUtil.VectorTypeIterator(type); !vecIter.end(); vecIter.next()) {
            /** @type {gluVarType.VarType} */var subType = gluVarTypeUtil.getVarType(type, vecIter.getPath());
            /** @type {string} */ var attribName = getAttributeName(name, vecIter.getPath());

                if (!(
                    subType.isBasicType() &&
                    gluShaderUtil.isDataTypeScalarOrVector(subType.getBasicType())
                )) throw new Error('Not a scalar or vector.');

                // Vertex: assign from attribute.
                vtx.str += '\t' + name + vecIter.toString() + ' = ' + attribName + ';\n';

                // Fragment: add to res variable.
                var scalarSize = gluShaderUtil.getDataTypeScalarSize(subType.getBasicType());

                frag.str += '\tres += ';
                if (scalarSize == 1) frag.str += 'vec4(' + name + vecIter.toString() + ')';
                else if (scalarSize == 2) frag.str += 'vec2(' + name + vecIter.toString() + ').xxyy';
                else if (scalarSize == 3) frag.str += 'vec3(' + name + vecIter.toString() + ').xyzx';
                else if (scalarSize == 4) frag.str += 'vec4(' + name + vecIter.toString() + ')';

                frag.str += ';\n';
            }
        }

        frag.str += '\to_color = res * u_scale + u_bias;\n}\n';
        vtx.str += '}\n';

        return {
            vertSource: vtx.str,
            fragSource: frag.str
        };
    };

    /**
     * Returns a Shader program
     * @param {WebGLRenderingContext} gl WebGL context
     * @param {ProgramSpec} spec
     * @param {number} bufferMode
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @return {gluShaderProgram.ShaderProgram}
     */
    var count = 0;
    var createVertexCaptureProgram = function(gl, spec, bufferMode, primitiveType) {

    /** @type {Object.<string, string>} */ var source = genShaderSources(spec, primitiveType === gluDrawUtil.primitiveType.POINTS /* Is point size required? */);

    /** @type {gluShaderProgram.ShaderProgram} */ var programSources = new gluShaderProgram.ProgramSources();
        programSources.add(new gluShaderProgram.VertexSource(source.vertSource))
                      .add(new gluShaderProgram.FragmentSource(source.fragSource))
                      .add(new gluShaderProgram.TransformFeedbackVaryings(spec.getTransformFeedbackVaryings()))
                      .add(new gluShaderProgram.TransformFeedbackMode(bufferMode));

        return new gluShaderProgram.ShaderProgram(gl, programSources);

    };

    /**
     * @param {Array.<Attribute>} attributes
     * @param {Array.<Varying>} varyings
     * @param {boolean} usePointSize
     * @return {Number} input stride
     */
    var computeInputLayout = function(attributes, varyings, usePointSize) {

        var inputStride = 0;

        // Add position
        var dataTypeVec4 = gluVarType.newTypeBasic(gluShaderUtil.DataType.FLOAT_VEC4, gluShaderUtil.precision.PRECISION_HIGHP);
        attributes.push(new Attribute('a_position', dataTypeVec4, inputStride));
        inputStride += 4 * 4; /*sizeof(deUint32)*/

        if (usePointSize) {
            var dataTypeFloat = gluVarType.newTypeBasic(gluShaderUtil.DataType.FLOAT, gluShaderUtil.precision.PRECISION_HIGHP);
            attributes.push(new Attribute('a_pointSize', dataTypeFloat, inputStride));
            inputStride += 1 * 4; /*sizeof(deUint32)*/
        }

        for (var i = 0; i < varyings.length; i++) {
            for (var vecIter = new gluVarTypeUtil.VectorTypeIterator(varyings[i].type); !vecIter.end(); vecIter.next()) {
                var type = vecIter.getType(); // originally getType() in getVarType() within gluVARTypeUtil.hpp.
                var name = getAttributeName(varyings[i].name, vecIter.getPath());

                attributes.push(new Attribute(name, type, inputStride));
                inputStride += gluShaderUtil.getDataTypeScalarSize(type.getBasicType()) * 4; /*sizeof(deUint32)*/
            }
        }

        return inputStride;
    };

    /**
     * @param {Array.<Output>} transformFeedbackOutputs
     * @param {Array.<Attribute>} attributes
     * @param {Array.<Varying>} varyings
     * @param {Array.<string>} transformFeedbackVaryings
     * @param {number} bufferMode
     */
    var computeTransformFeedbackOutputs = function(gl, transformFeedbackOutputs, attributes, varyings, transformFeedbackVaryings, bufferMode) {

    /** @type {number} */ var accumulatedSize = 0;

        // transformFeedbackOutputs.resize(transformFeedbackVaryings.size());
        for (var varNdx = 0; varNdx < transformFeedbackVaryings.length; varNdx++)
        {
        /** @type {string} */ var name = transformFeedbackVaryings[varNdx];
        /** @type {number} */ var bufNdx = (bufferMode === gl.SEPARATE_ATTRIBS ? varNdx : 0);
        /** @type {number} */ var offset = (bufferMode === gl.SEPARATE_ATTRIBS ? 0 : accumulatedSize);
        /** @type {Output} */ var output = new Output();

            output.name = name;
            output.bufferNdx = bufNdx;
            output.offset = offset;

            if (name === 'gl_Position')
            {
            /** @type {Attribute} */ var posIn = findAttributeNameEquals(attributes, 'a_position');
                output.type = posIn.type;
                output.inputs.push(posIn);
            }
            else if (name === 'gl_PointSize')
            {
            /** @type {Attribute} */ var sizeIn = findAttributeNameEquals(attributes, 'a_pointSize');
                output.type = sizeIn.type;
                output.inputs.push(sizeIn);
            }
            else
            {
                /** @type {string} */ var varName = gluVarTypeUtil.parseVariableName(name);
                /** @type {Varying} */ var varying = findAttributeNameEquals(varyings, varName);

                var varPath = gluVarTypeUtil.parseTypePath(name, varying.type);
                output.type = gluVarTypeUtil.getVarType(varying.type, varPath);

                // Add all vectorized attributes as inputs.
                for (var iter = new gluVarTypeUtil.VectorTypeIterator(output.type); !iter.end(); iter.next())
                {
                    /** @type {array} */     var fullpath   = varPath.concat(iter.getPath());
                    /** @type {string} */    var attribName = getAttributeName(varName, fullpath);
                    /** @type {Attribute} */ var attrib     = findAttributeNameEquals(attributes, attribName);
                    output.inputs.push(attrib);
                }
            }
            transformFeedbackOutputs.push(output);
            accumulatedSize += output.type.getScalarSize() * 4; /*sizeof(deUint32)*/
        }
    };

    /**
     * @param {Attribute} attrib
     * @param {ArrayBuffer} buffer
     * @param {number} stride
     * @param {number} numElements
     * @param {deRandom} rnd
     */
    var genAttributeData = function(attrib, buffer, stride, numElements, rnd) {

        /** @type {number} */ var elementSize = 4; /*sizeof(deUint32)*/
        /** @type {boolean} */ var isFloat = gluShaderUtil.isDataTypeFloatOrVec(attrib.type.getBasicType());
        /** @type {boolean} */ var isInt = gluShaderUtil.isDataTypeIntOrIVec(attrib.type.getBasicType());
        /** @type {boolean} */ var isUint = gluShaderUtil.isDataTypeUintOrUVec(attrib.type.getBasicType());

        /** @type {gluShaderUtil.precision} */ var precision = attrib.type.getPrecision();

        /** @type {number} */ var numComps = gluShaderUtil.getDataTypeScalarSize(attrib.type.getBasicType());

        for (var elemNdx = 0; elemNdx < numElements; elemNdx++)
        {
            for (var compNdx = 0; compNdx < numComps; compNdx++)
            {
                /** @type {number} */ var offset = attrib.offset + elemNdx * stride + compNdx * elementSize;
                if (isFloat)
                {
                    var pos = new Float32Array(buffer, offset, 1);
                    switch (precision)
                    {
                        case gluShaderUtil.precision.PRECISION_LOWP:    pos[0] = 0.25 * rnd.getInt(0, 4); break;
                        case gluShaderUtil.precision.PRECISION_MEDIUMP: pos[0] = rnd.getFloat(-1e3, 1e3); break;
                        case gluShaderUtil.precision.PRECISION_HIGHP:   pos[0] = rnd.getFloat(-1e5, 1e5); break;
                        default: DE_ASSERT(false);
                    }
                }
                else if (isInt)
                {
                    var pos = new Int32Array(buffer, offset, 1);
                    switch (precision)
                    {
                        case gluShaderUtil.precision.PRECISION_LOWP:    pos[0] = rnd.getInt(-128, 127);     break;
                        case gluShaderUtil.precision.PRECISION_MEDIUMP: pos[0] = rnd.getInt(-32768, 32767); break;
                        case gluShaderUtil.precision.PRECISION_HIGHP:   pos[0] = rnd.getInt();              break;
                        default: DE_ASSERT(false);
                    }
                }
                else if (isUint)
                {
                    var pos = new Uint32Array(buffer, offset, 1);
                    switch (precision)
                    {
                        case gluShaderUtil.precision.PRECISION_LOWP:    pos[0] = rnd.getInt(0, 255);     break;
                        case gluShaderUtil.precision.PRECISION_MEDIUMP: pos[0] = rnd.getInt(0, 65535);   break;
                        case gluShaderUtil.precision.PRECISION_HIGHP:   pos[0] = Math.abs(rnd.getInt()); break;
                        default: DE_ASSERT(false);
                    }
                }
            }
        }
    };

    /**
     * @param {Array.<Attribute>} attributes
     * @param {number} numInputs
     * @param {number} inputStride
     * @param {deRandom} rnd
     * @return {ArrayBuffer}
     */
    var genInputData = function(attributes, numInputs, inputStride, rnd) {
        var buffer = new ArrayBuffer(numInputs * inputStride);

        var position = findAttributeNameEquals(attributes, 'a_position');
        if (!position)
            throw new Error('Position attribute not found.');

        for (var ndx = 0; ndx < numInputs; ndx++) {
            var pos = new Float32Array(buffer, position.offset + inputStride * ndx, 4);
            pos[0] = rnd.getFloat(-1.2, 1.2);
            pos[1] = rnd.getFloat(-1.2, 1.2);
            pos[2] = rnd.getFloat(-1.2, 1.2);
            pos[3] = rnd.getFloat(0.1, 2.0);
        }

        var pointSizePos = findAttributeNameEquals(attributes, 'a_pointSize');
        if (pointSizePos) {
            for (var ndx = 0; ndx < numInputs; ndx++) {
                var pos = new Float32Array(buffer, pointSizePos.offset + inputStride * ndx, 1);
                pos[0] = rnd.getFloat(1, 8);
            }
        }

        // Random data for rest of components.
        for (var i = 0; i < attributes.length; i++)
        {
            if (attributes[i].name != 'a_position' && attributes[i].name != 'a_pointSize')
                genAttributeData(attributes[i], buffer, inputStride, numInputs, rnd);
        }

        return buffer;
    };

    /**
     * Returns the number of outputs with the count for the Primitives in the Transform Feedback.
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @param {number} numElements
     * @return {number}
     */
    var getTransformFeedbackOutputCount = function(primitiveType, numElements) {

    switch (primitiveType) {
        case gluDrawUtil.primitiveType.TRIANGLES: return numElements - numElements % 3;
        case gluDrawUtil.primitiveType.TRIANGLE_STRIP: return Math.max(0, numElements - 2) * 3;
        case gluDrawUtil.primitiveType.TRIANGLE_FAN: return Math.max(0, numElements - 2) * 3;
        case gluDrawUtil.primitiveType.LINES: return numElements - numElements % 2;
        case gluDrawUtil.primitiveType.LINE_STRIP: return Math.max(0, numElements - 1) * 2;
        case gluDrawUtil.primitiveType.LINE_LOOP: return numElements > 1 ? numElements * 2 : 0;
        case gluDrawUtil.primitiveType.POINTS: return numElements;
        default:
            throw new Error('Unrecognized primitiveType ' + primitiveType);
       }

    };

    /**
     * Returns a number with the count for the Primitives in the Transform Feedback.
     * @param {WebGLRenderingContext} gl WebGL context
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @param {number} numElements
     * @return {number}
     */
    var getTransformFeedbackPrimitiveCount = function(gl, primitiveType, numElements) {

    switch (primitiveType) {
        case gl.TRIANGLES: return numElements - numElements / 3;
        case gl.TRIANGLE_STRIP: return Math.max(0, numElements - 2);
        case gl.TRIANGLE_FAN: return Math.max(0, numElements - 2);
        case gl.LINES: return numElements - numElements / 2;
        case gl.LINE_STRIP: return Math.max(0, numElements - 1);
        case gl.LINE_LOOP: return numElements > 1 ? numElements : 0;
        case gl.POINTS: return numElements;
        default:
            throw new Error('Unrecognized primitiveType ' + primitiveType);
       }

    };

    /**
     * Returns the type of Primitive Mode: Triangles for all Triangle Primitive's type and same for Line and Points.
     * @param {WebGLRenderingContext} gl WebGL context
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @return {gluDrawUtil.primitiveType} primitiveType
     */
    var getTransformFeedbackPrimitiveMode = function(gl, primitiveType) {

    switch (primitiveType) {
        case gl.TRIANGLES:
        case gl.TRIANGLE_STRIP:
        case gl.TRIANGLE_FAN:
            return gl.TRIANGLES;

        case gl.LINES:
        case gl.LINE_STRIP:
        case gl.LINE_LOOP:
            return gl.LINES;

        case gl.POINTS:
            return gl.POINTS;

        default:
            throw new Error('Unrecognized primitiveType ' + primitiveType);
       }

    };

    /**
     * Returns the attribute index for a certain primitive type.
     * @param {WebGLRenderingContext} gl WebGL context
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @param {number} numInputs
     * @param {number} outNdx
     * @return {number}
     */
    var getAttributeIndex = function(gl, primitiveType, numInputs, outNdx) {

    switch (primitiveType) {

        case gluDrawUtil.primitiveType.TRIANGLES: return outNdx;
        case gluDrawUtil.primitiveType.LINES: return outNdx;
        case gluDrawUtil.primitiveType.POINTS: return outNdx;

        case gluDrawUtil.primitiveType.TRIANGLE_STRIP:
        {
            /** @type {number} */ var triNdx = outNdx / 3;
            /** @type {number} */ var vtxNdx = outNdx % 3;
            return (triNdx % 2 != 0 && vtxNdx < 2) ? (triNdx + 1 - vtxNdx) : (triNdx + vtxNdx);
        }

        case gluDrawUtil.primitiveType.TRIANGLE_FAN:
            return (outNdx % 3 != 0) ? (outNdx / 3 + outNdx % 3) : 0;

        case gluDrawUtil.primitiveType.LINE_STRIP:
            return outNdx / 2 + outNdx % 2;

        case gluDrawUtil.primitiveType.LINE_LOOP:
        {
            var inNdx = outNdx / 2 + outNdx % 2;
            return inNdx < numInputs ? inNdx : 0;
        }

        default:
            throw new Error('Unrecognized primitiveType ' + primitiveType);
       }

    };

    /**
     * @param {gluDrawUtil.primitiveType} primitiveType type number in gluDrawUtil.primitiveType
     * @param {Output} output
     * @param {number} numInputs
     * @param {Object} buffers
     * @return {boolean} isOk
     */
    var compareTransformFeedbackOutput = function(primitiveType, output, numInputs, buffers) {
        /** @type {boolean} */ var isOk = true;
        /** @type {number} */ var outOffset = output.offset;

        for (var attrNdx = 0; attrNdx < output.inputs.length; attrNdx++) {
        /** @type {Attribute} */ var attribute = output.inputs[attrNdx];
        /** @type {gluShaderUtil.DataType} */ var type = attribute.type.getBasicType();
        /** @type {number} */ var numComponents = gluShaderUtil.getDataTypeScalarSize(type);

        /** @type {gluShaderUtil.precision} */ var precision = attribute.type.getPrecision();

        /** @type {string} */ var scalarType = gluShaderUtil.getDataTypeScalarType(type);
        /** @type {number} */ var numOutputs = getTransformFeedbackOutputCount(primitiveType, numInputs);

            for (var outNdx = 0; outNdx < numOutputs; outNdx++) {
            /** @type {number} */ var inNdx = getAttributeIndex(primitiveType, numInputs, outNdx);

                for (var compNdx = 0; compNdx < numComponents; compNdx++) {
                /** @type {boolean} */ var isEqual = false;

                    if (scalarType === 'float') {
                        var outBuffer = new Float32Array(buffers.output.buffer, buffers.output.offset + buffers.output.stride * outNdx + outOffset + compNdx * 4, 1);
                        var inBuffer = new Float32Array(buffers.input.buffer, buffers.input.offset + buffers.input.stride * inNdx + attribute.offset + compNdx * 4, 1);
                        var difInOut = inBuffer[0] - outBuffer[0];
                        /* TODO: Original code used ULP comparison for highp and mediump precision. This could cause failures. */
                        switch (precision) {
                            case gluShaderUtil.precision.PRECISION_HIGHP: {
                                isEqual = Math.abs(difInOut) < 0.1;
                                break;
                            }

                            case gluShaderUtil.precision.PRECISION_MEDIUMP: {
                                isEqual = Math.abs(difInOut) < 0.1;
                                break;
                            }

                            case gluShaderUtil.precision.PRECISION_LOWP: {
                                isEqual = Math.abs(difInOut) < 0.1;
                                break;
                            }
                            default:
                                DE_ASSERT(false);
                        }
                    } else {
                        var outBuffer = new Uint32Array(buffers.output.buffer, buffers.output.offset + buffers.output.stride * outNdx + outOffset + compNdx * 4, 1);
                        var inBuffer = new Uint32Array(buffers.input.buffer, buffers.input.offset + buffers.input.stride * inNdx + attribute.offset + compNdx * 4, 1);
                        isEqual = (inBuffer[0] == outBuffer[0]); // Bit-exact match required for integer types.
                    }

                    if (!isEqual) {
                        bufferedLogToConsole('Mismatch in ' + output.name + ' (' + attribute.name + '), output = ' + outNdx + ', input = ' + inNdx + ', component = ' + compNdx);
                        isOk = false;
                        break;
                    }
                }

                if (!isOk)
                    break;
            }

            if (!isOk)
                break;

            outOffset += numComponents * 4; /*sizeof(deUint32)*/
        }

        return isOk;
    };

    /**
     * Returns (for all the draw calls) the type of Primitive Mode, as it calls "getTransformFeedbackPrimitiveCount".
     * @param {WebGLRenderingContext} gl WebGL context
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @param {Object.<number, boolean>} array DrawCall object
     * @return {number} primCount
     */
    var computeTransformFeedbackPrimitiveCount = function(gl, primitiveType, array) {

    /** @type {number} */ var primCount = 0;

        for (var i = 0; i < array.length; ++ i) {

            if (array.transformFeedbackEnabled)
            primCount += getTransformFeedbackPrimitiveCount(gl, primitiveType, array.numElements);
        }

        return primCount;
    };

    /**
     * @param {WebGLRenderingContext} context gl WebGL context
     * @param {number} target
     * @param {number} bufferSize
     * @param {number} guardSize
     */
    var writeBufferGuard = function(gl, target, bufferSize, guardSize) {
        var buffer = new ArrayBuffer(guardSize);
        var view   = new Uint8Array(buffer);
        for (var i = 0 ; i < guardSize ; ++i) view[i] = 0xcd;
        gl.bufferSubData(target, bufferSize, buffer);
        GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'guardband write');
    };

    /**
     * Verifies guard
     * @param {Array.<number>} buffer
     * @return {boolean}
     */
    var verifyGuard = function(buffer, start) {
        var view = new Uint8Array(buffer);
        for (var i = (start || 0) ; i < view.length ; i++) {
            if (view[i] != 0xcd)
                return false;
        }
        return true;
    };

    /**
     * It is a child class of the orignal C++ TestCase
     * @param {WebGLRenderingContext} context gl WebGL context
     * @param {string} name
     * @param {string} desc
     * @param {number} bufferMode
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @constructor
     */
    var TransformFeedbackCase = function(context, name, desc, bufferMode, primitiveType) {

        this._construct = function(context, name, desc, bufferMode, primitiveType) {
            if (
                typeof(context) !== 'undefined' &&
                typeof(name) !== 'undefined' &&
                typeof(desc) !== 'undefined' &&
                typeof(bufferMode) !== 'undefined' &&
                typeof(primitiveType) !== 'undefined'
            ) {
                tcuTestCase.DeqpTest.call(this, name, description);
                this.m_gl = context;
                this.m_bufferMode = bufferMode;
                this.m_primitiveType = primitiveType;
		        this.m_progSpec = new ProgramSpec();
            }
        };

        this.init = function() {
        //  var log = this.m_testCtx.getLog(); // TestLog&
            var gl = this.m_gl; // const glw::Functions&

            if (this.m_program != null) { throw new Error('this.m_program isnt null.'); }
            this.m_program = createVertexCaptureProgram(
                gl,
                this.m_progSpec,
                this.m_bufferMode,
                this.m_primitiveType
            );

            bufferedLogToConsole(this.m_program);

            if (!this.m_program.isOk()) {

                var linkFail = this.m_program.shadersOK &&
                               !this.m_program.getProgramInfo().linkOk;

                if (linkFail) {
                    if (!isProgramSupported(gl, this.m_progSpec, this.m_bufferMode)) {
                        throw new Error('Not Supported. Implementation limits exceeded.');
                    } else if (hasArraysInTFVaryings(this.m_progSpec)) {
                        throw new Error('Capturing arrays is not supported (undefined in specification)');
                    } else {
                        throw new Error('Link failed');
                    }
                } else {
                    throw new Error('Compile failed');
                }
            }

//          bufferedLogToConsole('Transform feedback varyings: ' + tcu.formatArray(this.m_progSpec.getTransformFeedbackVaryings()));
            bufferedLogToConsole('Transform feedback varyings: ' + this.m_progSpec.getTransformFeedbackVaryings());

            // Print out transform feedback points reported by GL.
    	    // bufferedLogToConsole('Transform feedback varyings reported by compiler:');
            //logTransformFeedbackVaryings(log, gl, this.m_program.getProgram());

            // Compute input specification.
            this.m_inputStride = computeInputLayout(this.m_attributes, this.m_progSpec.getVaryings(), this.m_progSpec.isPointSizeUsed());

            // Build list of varyings used in transform feedback.
            computeTransformFeedbackOutputs(
            	this.m_gl,
                this.m_transformFeedbackOutputs,
                this.m_attributes,
                this.m_progSpec.getVaryings(),
                this.m_progSpec.getTransformFeedbackVaryings(),
                this.m_bufferMode
            );
            if (!this.m_transformFeedbackOutputs.length) {
                throw new Error('transformFeedbackOutputs cannot be empty.');
            }

            if (this.m_bufferMode == gl.SEPARATE_ATTRIBS) {
                for (var i = 0; i < this.m_transformFeedbackOutputs.length; ++i) {
                    this.m_bufferStrides.push(this.m_transformFeedbackOutputs[i].type.getScalarSize() * 4 /*sizeof(deUint32)*/);
                }
            } else {
                var totalSize = 0;
                for (var i = 0; i < this.m_transformFeedbackOutputs.length; ++i) {
                    totalSize += this.m_transformFeedbackOutputs[i].type.getScalarSize() * 4 /*sizeof(deUint32)*/;
                }
                this.m_bufferStrides.push(totalSize);
            }

            this.m_outputBuffers.length = this.m_bufferStrides.length;
            for (var i = 0; i < this.m_outputBuffers.length; i++)
                this.m_outputBuffers[i] = gl.createBuffer();

            DE_ASSERT(!this.m_transformFeedback);
            if (this.m_transformFeedback != null) {
                throw new Error('transformFeedback is already set.');
            }
            this.m_transformFeedback = gl.createTransformFeedback();

            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'init');

            this.m_iterNdx = 0;
//          this.m_testCtx.setTestResult(QP_TEST_RESULT_PASS, 'Pass');

        };
        this.deinit = function() {

            var gl = this.m_gl;

            for (var i = 0; i < this.m_outputBuffers.length; i++)
                gl.deleteBuffer(this.m_outputBuffers[i]);

        //    delete this.m_transformFeedback;
            this.m_transformFeedback = null;

        //    delete this.m_program;
            this.m_program = null;

            // Clean up state.
            this.m_attributes.clear();
            this.m_transformFeedbackOutputs.clear();
            this.m_bufferStrides.clear();
            this.m_inputStride = 0;

        };

        this.iterate = function() {

            // static vars
            var s = TransformFeedbackCase.s_iterate;

//          var log = this.m_textCtx.getLog();
            var isOk = true;
            var seed = /*deString.deStringHash(getName()) ^ */ deMath.deMathHash(this.m_iterNdx);
            var numIterations = TransformFeedbackCase.s_iterate.iterations.length;
            // first and end ignored.

            var sectionName = 'Iteration' + (this.m_iterNdx + 1);
            var sectionDesc = 'Iteration ' + (this.m_iterNdx + 1) + ' / ' + numIterations;
//            var section; // something weird.

            bufferedLogToConsole('Testing ' +
                s.testCases[s.iterations[this.m_iterNdx]].length +
                ' draw calls, (element count, TF state): ' +
            //  tcu.formatArray(
                    s.testCases[s.iterations[this.m_iterNdx]]
            //  )
            );

            isOk = this.runTest(s.testCases[s.iterations[this.m_iterNdx]], seed);

            if (!isOk) {
                // fail the test
                testFailedOptions('Result comparison failed', false);
//              this.m_testCtx.setTestResult(QP_TEST_RESULT_FAIL, 'Result comparison failed');
            }

            this.m_iterNdx += 1;

            return (isOk && this.m_iterNdx < numIterations)
                   ? tcuTestCase.runner.IterateResult.CONTINUE
                   : tcuTestCase.runner.IterateResult.STOP;

        };

        /* protected */
        this.m_bufferMode = null;
        this.m_primitiveType = null;

        /* private */
        this.runTest = function(calls, seed) {

            var _min = function(x, y) { return x < y ? x : y; };

        //  var log = this.m_testCtx.getLog();
        	var gl = this.m_gl;
            var rnd = new deRandom.Random(seed);
            var numInputs = 0;
            var numOutputs = 0;
            var width = gl.drawingBufferWidth;
            var height = gl.drawingBufferHeight;
            var viewportW = _min(VIEWPORT_WIDTH, width);
            var viewportH = _min(VIEWPORT_HEIGHT, height);
            var viewportX = rnd.getInt(0, width - viewportW);
            var viewportY = rnd.getInt(0, height - viewportH);
            var frameWithTf = new tcuSurface.Surface(viewportW, viewportH); // tcu::Surface
            var frameWithoutTf = new tcuSurface.Surface(viewportW, viewportH); // tcu::Surface
            var primitiveQuery = gl.createQuery();
            var outputsOk = true;
            var imagesOk = true;
            var queryOk = true;

            // Compute totals.
            for (var i = 0; i < calls.length; ++i) {
                var call = calls[i];
                numInputs += call.numElements;
                numOutputs += call.transformFeedbackEnabled ? getTransformFeedbackOutputCount(this.m_primitiveType, call.numElements) : 0;
            }

            // Input data.
            var inputData = genInputData(this.m_attributes, numInputs, this.m_inputStride, rnd);

            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.m_transformFeedback);
            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glBindTransformFeedback()');

            // Allocate storage for transform feedback output buffers and bind to targets.
            for (var bufNdx = 0; bufNdx < this.m_outputBuffers.length; ++bufNdx) {
                var buffer    = this.m_outputBuffers[bufNdx]; // deUint32
                var stride    = this.m_bufferStrides[bufNdx]; // int
                var target    = bufNdx; // int
                var size      = stride * numOutputs; // int
                var guardSize = stride * BUFFER_GUARD_MULTIPLIER; // int
                var usage     = gl.DYNAMIC_READ; // const deUint32

                gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buffer);
                GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'bindBuffer');
                gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, size + guardSize, usage);
                GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'bufferData');
                writeBufferGuard(gl, gl.TRANSFORM_FEEDBACK_BUFFER, size, guardSize);

                // \todo [2012-07-30 pyry] glBindBufferRange()?
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, target, buffer);

                GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'transform feedback buffer setup');
            }

            var attribBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, attribBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, inputData, gl.STATIC_DRAW);
            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'Attributes buffer setup');

            // Setup attributes.
            for (var i = 0; i < this.m_attributes.length; ++i) {
                var attrib = this.m_attributes[i];
                var loc = gl.getAttribLocation(this.m_program.getProgram(), attrib.name);
                /** @type {string} */
                var scalarType = gluShaderUtil.getDataTypeScalarType(attrib.type.getBasicType());
                /** @type {number} */
                var numComponents = gluShaderUtil.getDataTypeScalarSize(attrib.type.getBasicType());

                if (loc >= 0) {
                    gl.enableVertexAttribArray(loc);
                    switch (scalarType) {
                        case "float":
                            gl.vertexAttribPointer(loc, numComponents, gl.FLOAT, gl.FALSE, this.m_inputStride, attrib.offset); break;
                        case "int":
                            gl.vertexAttribIPointer(loc, numComponents, gl.INT, this.m_inputStride, attrib.offset); break;
                        case "uint":
                            gl.vertexAttribPointer(loc, numComponents, gl.UNSIGNED_INT, gl.FALSE, this.m_inputStride, attrib.offset); break;
                    }
                }
            }

            // Setup viewport.
            gl.viewport(viewportX, viewportY, viewportW, viewportH);

            // Setup program.
            gl.useProgram(this.m_program.getProgram());

            gl.uniform4fv(
                gl.getUniformLocation(this.m_program.getProgram(), 'u_scale'),
                [0.01, 0.01, 0.01, 0.01]
            );
            gl.uniform4fv(
                gl.getUniformLocation(this.m_program.getProgram(), 'u_bias'),
                [0.5, 0.5, 0.5, 0.5]
            );

            // Enable query.
            gl.beginQuery(gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN, primitiveQuery);
            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glBeginQuery(GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN)');

            // Draw
            {
                var offset = 0;
                var tfEnabled = true;

                gl.clear(gl.COLOR_BUFFER_BIT);

                gl.beginTransformFeedback(getTransformFeedbackPrimitiveMode(this.m_primitiveType));

                for (var i = 0; i < calls.length; ++i) {
                    var call = calls[i];

                    // Pause or resume transform feedback if necessary.
                    if (call.transformFeedbackEnabled != tfEnabled)
                    {
                        if (call.transformFeedbackEnabled)
                            gl.resumeTransformFeedback();
                        else
                            gl.pauseTransformFeedback();
                        tfEnabled = call.transformFeedbackEnabled;
                    }

                    gl.drawArrays(this.m_primitiveType, offset, call.numElements);
                    offset += call.numElements;
                }

                // Resume feedback before finishing it.
                if (!tfEnabled)
                    gl.resumeTransformFeedback();

                gl.endTransformFeedback();
                GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'render');
            };

            gl.endQuery(gl.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN);
            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glEndQuery(GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN)');

            // Check and log query status right after submit
            (function() {
                var available = gl.FALSE; // deUint32
                available = gl.getQueryParameter(primitiveQuery, gl.QUERY_RESULT_AVAILABLE);
                GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'getQueryParameter()'); // formerly glGetQueryObjectuiv()

                bufferedLogToConsole('GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN status after submit: ' +
                    (available != gl.FALSE ? 'GL_TRUE' : 'GL_FALSE'));
            })();

            // Compare result buffers.
            for (var bufferNdx = 0; bufferNdx < this.m_outputBuffers.length; ++bufferNdx) {
                var stride    = this.m_bufferStrides[bufferNdx];   // int
                var size      = stride * numOutputs;               // int
                var guardSize = stride * BUFFER_GUARD_MULTIPLIER;  // int
                var buffer    = new ArrayBuffer(size + guardSize); // const void*

                // Bind buffer for reading.
                gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, this.m_outputBuffers[bufferNdx]);

                gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer); // (spec says to use ArrayBufferData)
                GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'mapping buffer');

                // Verify all output variables that are written to this buffer.
                for (var i = 0; i < this.m_transformFeedbackOutputs.length; ++i) {
                    var out = this.m_transformFeedbackOutputs[i];

                    if (out.bufferNdx != bufferNdx)
                        continue;

                    var inputOffset  = 0;
                    var outputOffset = 0;

                    // Process all draw calls and check ones with transform feedback enabled
                    for (var callNdx = 0; callNdx < calls.length; ++callNdx) {
                        var call = calls[callNdx];

                        if (call.transformFeedbackEnabled) {
                            var inputPtr = inputData[0] + inputOffset * this.m_inputStride; // const deUint8*
                            var outputPtr = outputOffset * stride; // const deUint8*

                            if (!compareTransformFeedbackOutput(this.m_primitiveType, out, call.numElements, {
                                     input: {
                                        buffer: inputData,
                                        offset: inputOffset * this.m_inputStride,
                                        stride: this.m_inputStride
                                    },
                                    output: {
                                        buffer: buffer,
                                        offset: outputOffset * stride,
                                        stride: stride
                                    }
                                })) {
                                outputsOk = false;
                                break;
                            }
                        }

                        inputOffset += call.numElements;
                        outputOffset += call.transformFeedbackEnabled ? getTransformFeedbackOutputCount(this.m_primitiveType, call.numElements) : 0;

                    }
                }

                // Verify guardband.
                if (!verifyGuard(buffer, size)) {
                    bufferedLogToConsole('Error: Transform feedback buffer overrun detected');
                    outputsOk = false;
                }

            //    Javascript, and lazy memory management
            //    gl.unmapBuffer(GL_TRANSFORM_FEEDBACK_BUFFER);

            }

            // Check status after mapping buffers.
            {

                var mustBeReady = this.m_outputBuffers.length > 0; // Mapping buffer forces synchronization. // const bool
                var expectedCount = computeTransformFeedbackPrimitiveCount(gl, this.m_primitiveType, calls); // const int
                var available = gl.FALSE; // deUint32
                var numPrimitives = 0; // deUint32

                available = gl.getQueryParameter(primitiveQuery, gl.QUERY_RESULT_AVAILABLE);
                numPrimitives = gl.getQueryParameter(primitiveQuery, gl.QUERY_RESULT);
                GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'getQueryParameter()'); // formerly getQueryObjectuiv()

                if (!mustBeReady && available == gl.FALSE) {

                    bufferedLogToConsole('ERROR: GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN result not available after mapping buffers!');
                    queryOk = false;
                }

                bufferedLogToConsole('GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN = ' + numPrimitives);

                if (numPrimitives != expectedCount) {
                    bufferedLogToConsole('ERROR: Expected ' + expectedCount + ' primitives!');
                    queryOk = false;
                }
            }

            // Clear transform feedback state.
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK);
            for (var bufNdx = 0; bufNdx < this.m_outputBuffers.length; ++bufNdx) {
                gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, bufNdx, null);
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            // Read back rendered image.
            gl.readPixels(viewportX, viewportY, viewportW, viewportH, gl.RGBA, gl.UNSIGNED_BYTE, frameWithTf.getAccess().getDataPtr());

            GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glReadPixels()');

            // Render without transform feedback.
            {
                var offset = 0; // int

                gl.clear(gl.COLOR_BUFFER_BIT);

                for (var i = 0; i < calls.length; ++i) {
                    var call = calls[i];
                    gl.drawArrays(this.m_primitiveType, offset, call.numElements);
                    offset += call.numElements;
                }


                GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'render');
                gl.readPixels(viewportX, viewportY, viewportW, viewportH, gl.RGBA, gl.UNSIGNED_BYTE, frameWithoutTf.getAccess().getDataPtr());
                GLU_EXPECT_NO_ERROR(gl, gl.getError(), 'glReadPixels()');
            };

            // Compare images with and without transform feedback.
            imagesOk = tcuImageCompare.pixelThresholdCompare('Result', 'Image comparison result', frameWithoutTf, frameWithTf, [1,1,1,1], tcuImageCompare.CompareLogMode.ON_ERROR);

            if (imagesOk) {
                bufferedLogToConsole('Rendering result comparison between TF enabled and TF disabled passed.');
            } else {
                bufferedLogToConsole('ERROR: Rendering result comparison between TF enabled and TF disabled failed!');
            }

            return outputsOk && imagesOk && queryOk;

        }; // runTest();

        // Derived from ProgramSpec in init()
        this.m_inputStride       = 0;
        this.m_attributes        = [];    // vector<Attribute>
        this.m_transformFeedbackOutputs = []; // vector<Output>
        this.m_bufferStrides     = [];    // vector<int>

        // GL state.
        this.m_program           = null;  // glu::ShaderProgram
        this.m_transformFeedback = null;  // glu::TransformFeedback
        this.m_outputBuffers     = [];    // vector<deUint32>

        this.m_iterNdx           = 0;     // int

//      this.m_context = this.getState();
        this.m_gl                = null;  // render context

        this._construct(context, name, desc, bufferMode, primitiveType);

    };

	var dc = function(numElements, tfEnabled) {
		return new DrawCall(numElements,tfEnabled);
	};

    // static data
    TransformFeedbackCase.s_iterate = {

        testCases: {
            elemCount1:   [dc(  1, true )],
            elemCount2:   [dc(  2, true )],
            elemCount3:   [dc(  3, true )],
            elemCount4:   [dc(  4, true )],
            elemCount123: [dc(123, true )],
            basicPause1:  [dc( 64, true ), dc( 64, false), dc( 64, true)],
            basicPause2:  [dc( 13, true ), dc(  5, true ), dc( 17, false),
                           dc(  3, true ), dc(  7, false)],
            startPaused:  [dc(123, false), dc(123, true )],
            random1:      [dc( 65, true ), dc(135, false), dc( 74, true),
                           dc( 16, false), dc(226, false), dc(  9, true),
                           dc(174, false)],
            random2:      [dc(217, true ), dc(171, true ), dc(147, true),
                           dc(152, false), dc( 55, true )]
        },
        iterations: [
            'elemCount1',  'elemCount2',  'elemCount3', 'elemCount4', 'elemCount1234',
            'basicPause1', 'basicPause2', 'startPaused',
            'random1',     'random2'
        ]
    };

    TransformFeedbackCase.prototype = new tcuTestCase.DeqpTest();

    var hasArraysInTFVaryings = function(spec) {

        for (var i = 0 ; i < spec.getTransformFeedbackVaryings().length ; ++i) {
            var tfVar = spec.getTransformFeedbackVaryings()[i];
            var varName = gluVarTypeUtil.parseVariableName(tfVar);

            if (findAttributeNameEquals(spec.getVaryings(), varName)) return true;
        }
        return false;

    };



    /** PositionCase
     * It is a child class of TransformFeedbackCase
     * @param {WebGLRenderingContext} context gl WebGL context
     * @param {string} name
     * @param {string} desc
     * @param {number} bufferMode
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @constructor
     */
    var PositionCase = function(context, name, desc, bufferMode, primitiveType) {

        this._construct(context, name, desc, bufferMode, primitiveType);
        this.m_progSpec.addTransformFeedbackVarying('gl_Position');

    };

    PositionCase.prototype = new TransformFeedbackCase();

    /** PointSizeCase
     * It is a child class of TransformFeedbackCase
     * @param {WebGLRenderingContext} context gl WebGL context
     * @param {string} name
     * @param {string} desc
     * @param {number} bufferMode
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @constructor
     */
    var PointSizeCase = function(context, name, desc, bufferMode, primitiveType) {

        this._construct(context, name, desc, bufferMode, primitiveType);
        this.m_progSpec.addTransformFeedbackVarying('gl_PointSize');

    };

    PointSizeCase.prototype = new TransformFeedbackCase();

    /** BasicTypeCase
     * It is a child class of TransformFeedbackCase
     * @param {WebGLRenderingContext} context gl WebGL context
     * @param {string} name
     * @param {string} desc
     * @param {number} bufferMode
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @param {gluVarType.VarType} type
     * @param {gluShaderUtil.precision} precision
     * @param {interpolation} interpolation enum number in this javascript
     * @constructor
     */
    var BasicTypeCase = function(context, name, desc, bufferMode, primitiveType, type, precision, interpolation) {

        this._construct(context, name, desc, bufferMode, primitiveType);

        this.m_progSpec.addVarying('v_varA', gluVarType.newTypeBasic(type, precision), interpolation);
        this.m_progSpec.addVarying('v_varB', gluVarType.newTypeBasic(type, precision), interpolation);

        this.m_progSpec.addTransformFeedbackVarying('v_varA');
        this.m_progSpec.addTransformFeedbackVarying('v_varB');

    };

    BasicTypeCase.prototype = new TransformFeedbackCase();

    /** BasicArrayCase
     * It is a child class of TransformFeedbackCase
     * @param {WebGLRenderingContext} context gl WebGL context
     * @param {string} name
     * @param {string} desc
     * @param {number} bufferMode
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @param {gluVarType.VarType} type
     * @param {gluShaderUtil.precision} precision
     * @param {interpolation} interpolation enum number in this javascript
     * @constructor
     */
    var BasicArrayCase = function(context, name, desc, bufferMode, primitiveType, type, precision, interpolation) {

        this._construct(context, name, desc, bufferMode, primitiveType);

        if (gluShaderUtil.isDataTypeMatrix(type) || this.m_bufferMode === this.m_gl.SEPARATE_ATTRIBS)
        {
            // note For matrix types we need to use reduced array sizes or otherwise we will exceed maximum attribute (16)
            // or transform feedback component count (64).
            // On separate attribs mode maximum component count per varying is 4.
            this.m_progSpec.addVarying('v_varA', gluVarType.newTypeArray(gluVarType.newTypeBasic(type, precision), 1), interpolation);
            this.m_progSpec.addVarying('v_varB', gluVarType.newTypeArray(gluVarType.newTypeBasic(type, precision), 2), interpolation);
        }
        else
        {
            this.m_progSpec.addVarying('v_varA', gluVarType.newTypeArray(gluVarType.newTypeBasic(type, precision), 3), interpolation);
            this.m_progSpec.addVarying('v_varB', gluVarType.newTypeArray(gluVarType.newTypeBasic(type, precision), 4), interpolation);
        }

        this.m_progSpec.addTransformFeedbackVarying('v_varA');
        this.m_progSpec.addTransformFeedbackVarying('v_varB');

    };

    BasicArrayCase.prototype = new TransformFeedbackCase();

    /** ArrayElementCase
     * It is a child class of TransformFeedbackCase
     * @param {WebGLRenderingContext} context gl WebGL context
     * @param {string} name
     * @param {string} desc
     * @param {number} bufferMode
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @param {gluVarType.VarType} type
     * @param {gluShaderUtil.precision} precision
     * @param {interpolation} interpolation enum number in this javascript
     * @constructor
     */
    var ArrayElementCase = function(context, name, desc, bufferMode, primitiveType, type, precision, interpolation) {

        this._construct(context, name, desc, bufferMode, primitiveType);

        this.m_progSpec.addVarying('v_varA', gluVarType.newTypeBasic(type, precision), interpolation);
        this.m_progSpec.addVarying('v_varB', gluVarType.newTypeBasic(type, precision), interpolation);

        this.m_progSpec.addTransformFeedbackVarying('v_varA[1]');
        this.m_progSpec.addTransformFeedbackVarying('v_varB[0]');
        this.m_progSpec.addTransformFeedbackVarying('v_varB[3]');

    };

    ArrayElementCase.prototype = new TransformFeedbackCase();

    /** RandomCase
     * It is a child class of TransformFeedbackCase
     * @param {WebGLRenderingContext} context gl WebGL context
     * @param {string} name
     * @param {string} desc
     * @param {number} bufferMode
     * @param {gluDrawUtil.primitiveType} primitiveType GLenum that specifies what kind of primitive is
     * @param {number} seed
     * @constructor
     */
    var RandomCase = function(context, name, desc, bufferMode, primitiveType, seed) {

        this._construct(context, name, desc, bufferMode, primitiveType);

        var parent = {
            init: this.init
        };

        this.init = function() {

            /** @type {number} */
            var seed = /*deString.deStringHash(getName()) ^ */ deMath.deMathHash(this.m_iterNdx);

            /** @type {Array.<gluShaderUtil.DataType>} */
            var typeCandidates = [
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

                gluShaderUtil.DataType.FLOAT_MAT2,
                gluShaderUtil.DataType.FLOAT_MAT2X3,
                gluShaderUtil.DataType.FLOAT_MAT2X4,

                gluShaderUtil.DataType.FLOAT_MAT3X2,
                gluShaderUtil.DataType.FLOAT_MAT3,
                gluShaderUtil.DataType.FLOAT_MAT3X4,

                gluShaderUtil.DataType.FLOAT_MAT4X2,
                gluShaderUtil.DataType.FLOAT_MAT4X3,
                gluShaderUtil.DataType.FLOAT_MAT4
            ];

            /** @type {Array.<gluShaderUtil.precision>} */
            var precisions = [

                gluShaderUtil.precision.PRECISION_LOWP,
                gluShaderUtil.precision.PRECISION_MEDIUMP,
                gluShaderUtil.precision.PRECISION_HIGHP

                // glsUBC.UniformFlags.PRECISION_LOW,
                // glsUBC.UniformFlags.PRECISION_MEDIUM,
                // glsUBC.UniformFlags.PRECISION_HIGH
            ];

            /** @type {Array.<string, interpolation>} */
            var interpModes = [
                {name: 'smooth', interp: interpolation.SMOOTH},
                {name: 'flat', interp: interpolation.FLAT},
                {name: 'centroid', interp: interpolation.CENTROID}
            ];

            /** @type {number} */  var maxAttributeVectors      = 16;
           //** @type {number} */  var maxTransformFeedbackComponents    = 64; // note It is enough to limit attribute set size.
            /** @type {boolean} */ var isSeparateMode           = (this.m_bufferMode === this.m_gl.SEPARATE_ATTRIBS);
            /** @type {number} */  var maxTransformFeedbackVars = isSeparateMode ? 4 : maxAttributeVectors;
            /** @type {number} */  var arrayWeight              = 0.3;
            /** @type {number} */  var positionWeight           = 0.7;
            /** @type {number} */  var pointSizeWeight          = 0.1;
            /** @type {number} */  var captureFullArrayWeight   = 0.5;

            /** @type {deRandom.deRandom} */
                                   var rnd                      = new deRandom.Random(seed);
            /** @type {boolean} */ var usePosition              = rnd.getFloat() < positionWeight;
            /** @type {boolean} */ var usePointSize             = rnd.getFloat() < pointSizeWeight;
            /** @type {number} */  var numAttribVectorsToUse    = rnd.getInt(
                1, maxAttributeVectors - 1/*position*/ - (usePointSize ? 1 : 0)
            );

            /** @type {number} */  var numAttributeVectors      = 0;
            /** @type {number} */  var varNdx                   = 0;

            // Generate varyings.
            while (numAttributeVectors < numAttribVectorsToUse)
            {
                /** @type {number} */
                var maxVecs = isSeparateMode ? Math.min(2 /*at most 2*mat2*/, numAttribVectorsToUse - numAttributeVectors) : numAttribVectorsToUse - numAttributeVectors;
                /** @type {gluShaderUtil.DataType} */
                var begin   = typeCandidates[0];
                /** @type {number} */
                var endCandidates = begin + (
                    maxVecs >= 4 ? 21 : (
                        maxVecs >= 3 ? 18 : (
                            maxVecs >= 2 ? (isSeparateMode ? 13 : 15) : 12
                        )
                    )
                );
                /** @type {gluShaderUtil.DataType} */
                var end = typeCandidates[endCandidates];

                /** @type {gluShaderUtil.DataType} */
                var type = rnd.choose(typeCandidates)[0];

                /** @type {glsUBC.UniformFlags | gluShaderUtil.precision} */
                var precision = rnd.choose(precisions)[0];

                /** @type {interpolation} */
                var interp = gluShaderUtil.getDataTypeScalarType(type) === gluShaderUtil.DataType.FLOAT
                           ? rnd.choose(interpModes)
                           : interpolation.FLAT;

                /** @type {number} */
                var numVecs     = gluShaderUtil.isDataTypeMatrix(type) ? gluShaderUtil.getDataTypeMatrixNumColumns(type) : 1;
                /** @type {number} */
                var numComps    = gluShaderUtil.getDataTypeScalarSize(type);
                /** @type {number} */
                var maxArrayLen = Math.max(1, isSeparateMode ? (4 / numComps) : (maxVecs / numVecs));
                /** @type {boolean} */
                var useArray    = rnd.getFloat() < arrayWeight;
                /** @type {number} */
                var arrayLen    = useArray ? rnd.getInt(1, maxArrayLen) : 1;
                /** @type {string} */
                var name        = 'v_var' + varNdx;

                if (useArray)
                    this.m_progSpec.addVarying(name, gluVarType.newTypeArray(gluVarType.newTypeBasic(type, precision), arrayLen), interp);
                else
                    this.m_progSpec.addVarying(name, gluVarType.newTypeBasic(type, precision), interp);

                numAttributeVectors += arrayLen * numVecs;
                varNdx += 1;
            }

            // Generate transform feedback candidate set.
            /** @type {Array.<string>} */ var tfCandidates =[];

            if (usePosition) tfCandidates.push('gl_Position');
            if (usePointSize) tfCandidates.push('gl_PointSize');

            for (var ndx = 0; ndx < varNdx; ndx++)
            {
                /** @type {Varying} */
                var varying = this.m_progSpec.getVaryings()[ndx];

                if (varying.type.isArrayType())
                {
                    /** @type {boolean} */
                    var captureFull = rnd.getFloat() < captureFullArrayWeight;

                    if (captureFull)
                    {
                        tfCandidates.push(varying.name);
                    }
                    else
                    {
                        /** @type {number} */
                        var numElem = varying.type.getArraySize();
                        for (var elemNdx = 0; elemNdx < numElem; elemNdx++)
                            tfCandidates.push(varying.name + '[' + elemNdx + ']');
                    }
                }
                else
                    tfCandidates.push(varying.name);
            }

            // Pick random selection.
            var tfVaryings = [];
            rnd.choose(tfCandidates, tfVaryings, Math.min(tfCandidates.length, maxTransformFeedbackVars));
            rnd.shuffle(tfVaryings);
            for (var i = 0; i < tfVaryings.length; i++)
                this.m_progSpec.addTransformFeedbackVarying(tfVaryings[i]);

            parent.init.call(this);

        };
    };

    RandomCase.prototype = new TransformFeedbackCase();

    /**
     * Creates the test in order to be executed
    **/
    var init = function(context) {

        /** @const @type {tcuTestCase.DeqpTest} */
        var testGroup = tcuTestCase.runner.getState().testCases;

        /** @type {Array.<string, number>} */
        var bufferModes = [
            {name: 'separate', mode: context.SEPARATE_ATTRIBS},
            {name: 'interleaved', mode: context.INTERLEAVED_ATTRIBS}
        ];

        /** @type {Array.<string, gluDrawUtil.primitiveType>} */
        var primitiveTypes = [
            {name: 'points', type: gluDrawUtil.primitiveType.POINTS},
            {name: 'lines', type: gluDrawUtil.primitiveType.LINES},
            {name: 'triangles', type: gluDrawUtil.primitiveType.TRIANGLES}
        ];

        /** @type {Array.<gluShaderUtil.DataType>} */
        var basicTypes = [
            gluShaderUtil.DataType.FLOAT,
            gluShaderUtil.DataType.FLOAT_VEC2,
            gluShaderUtil.DataType.FLOAT_VEC3,
            gluShaderUtil.DataType.FLOAT_VEC4,
            gluShaderUtil.DataType.FLOAT_MAT2,
            gluShaderUtil.DataType.FLOAT_MAT2X3,
            gluShaderUtil.DataType.FLOAT_MAT2X4,
            gluShaderUtil.DataType.FLOAT_MAT3X2,
            gluShaderUtil.DataType.FLOAT_MAT3,
            gluShaderUtil.DataType.FLOAT_MAT3X4,
            gluShaderUtil.DataType.FLOAT_MAT4X2,
            gluShaderUtil.DataType.FLOAT_MAT4X3,
            gluShaderUtil.DataType.FLOAT_MAT4,
            gluShaderUtil.DataType.INT,
            gluShaderUtil.DataType.INT_VEC2,
            gluShaderUtil.DataType.INT_VEC3,
            gluShaderUtil.DataType.INT_VEC4,
            gluShaderUtil.DataType.UINT,
            gluShaderUtil.DataType.UINT_VEC2,
            gluShaderUtil.DataType.UINT_VEC3,
            gluShaderUtil.DataType.UINT_VEC4
        ];

        /** @type {Array.<gluShaderUtil.precision>} */
        var precisions = [

            gluShaderUtil.precision.PRECISION_LOWP,
            gluShaderUtil.precision.PRECISION_MEDIUMP,
            gluShaderUtil.precision.PRECISION_HIGHP

            // glsUBC.UniformFlags.PRECISION_LOW,
            // glsUBC.UniformFlags.PRECISION_MEDIUM,
            // glsUBC.UniformFlags.PRECISION_HIGH
        ];

        /** @type {Array.<string, interpolation>} */
        var interpModes = [
            {name: 'smooth', interp: interpolation.SMOOTH},
            {name: 'flat', interp: interpolation.FLAT},
            {name: 'centroid', interp: interpolation.CENTROID}
        ];

        // .position
        /** @type {tcuTestCase.DeqpTest} */
        var positionGroup = tcuTestCase.newTest('position', 'gl_Position capture using transform feedback');
        testGroup.addChild(positionGroup);

        for (var primitiveType = 0; primitiveType < primitiveTypes.length; primitiveType++)
        {
            for (var bufferMode = 0; bufferMode < bufferModes.length; bufferMode++)
            {
                /** @type {string} */
                var name = primitiveTypes[primitiveType].name + '_' + bufferModes[bufferMode].name;

                positionGroup.addChild(new PositionCase(
                    context,
                    name,
                    '',
                    bufferModes[bufferMode].mode,
                    primitiveTypes[primitiveType].type
                ));
            }
        }

        // .point_size
        /** @type {tcuTestCase.DeqpTest} */ var pointSizeGroup = tcuTestCase.newTest('point_size', 'gl_PointSize capture using transform feedback');
        testGroup.addChild(pointSizeGroup);

        for (var primitiveType = 0; primitiveType < primitiveTypes.length; primitiveType++)
        {
            for (var bufferMode = 0; bufferMode < bufferModes.length; bufferMode++)
            {
                /** @type {string} */
                var name = primitiveTypes[primitiveType].name + '_' + bufferModes[bufferMode].name;

                pointSizeGroup.addChild(new PointSizeCase(
                    context,
                    name,
                    '',
                    bufferModes[bufferMode].mode,
                    primitiveTypes[primitiveType].type
                ));
            }
        }

        // .basic_type
        /** @type {tcuTestCase.DeqpTest} */
        var basicTypeGroup = tcuTestCase.newTest('basic_types', 'Basic types in transform feedback');
        testGroup.addChild(basicTypeGroup);

        for (var bufferModeNdx = 0; bufferModeNdx < bufferModes.length; bufferModeNdx++)
        {
            /** @type {tcuTestCase.DeqpTest} */
            var modeGroup = tcuTestCase.newTest(bufferModes[bufferModeNdx].name, '');
            /** @type {number} */
            var bufferMode = bufferModes[bufferModeNdx].mode;
            basicTypeGroup.addChild(modeGroup);

            for (var primitiveTypeNdx = 0; primitiveTypeNdx < primitiveTypes.length; primitiveTypeNdx++)
            {
                /** @type {tcuTestCase.DeqpTest} */
                var primitiveGroup = tcuTestCase.newTest(primitiveTypes[primitiveTypeNdx].name, '');
                /** @type {number} */
                var primitiveType    = primitiveTypes[primitiveTypeNdx].type;
                modeGroup.addChild(primitiveGroup);

                for (var typeNdx = 0; typeNdx < basicTypes.length; typeNdx++)
                {
                    /** @type {gluShaderUtil.DataType} */
                    var type = basicTypes[typeNdx];
                    /** @type {boolean} */
                    var isFloat = gluShaderUtil.getDataTypeScalarType(type) == gluShaderUtil.DataType.FLOAT;

                    for (var precNdx = 0; precNdx < precisions.length; precNdx++)
                    {
                        /** @type {gluShaderUtil.precision} */
                        var precision = precisions[precNdx];
                        /** @type {string} */
                        var name = gluShaderUtil.getPrecisionName(precision) + '_' + gluShaderUtil.getDataTypeName(type);

                        primitiveGroup.addChild(new BasicTypeCase(
                            context,
                            name,
                            '',
                            bufferMode,
                            primitiveType,
                            type,
                            precision,
                            isFloat ? interpolation.SMOOTH : interpolation.FLAT
                        ));
                    }
                }
            }
        }

        // .array
        /** @type {tcuTestCase.DeqpTest} */ var arrayGroup = tcuTestCase.newTest('array', 'Capturing whole array in TF');
        testGroup.addChild(arrayGroup);

        for (var bufferModeNdx = 0; bufferModeNdx < bufferModes.length; bufferModeNdx++)
        {
            /** @type {tcuTestCase.DeqpTest} */ var modeGroup = tcuTestCase.newTest(bufferModes[bufferModeNdx].name, '');
            /** @type {number} */ var bufferMode = bufferModes[bufferModeNdx].mode;
            arrayGroup.addChild(modeGroup);

            for (var primitiveTypeNdx = 0; primitiveTypeNdx < primitiveTypes.length; primitiveTypeNdx++)
            {
                /** @type {tcuTestCase.DeqpTest} */
                var primitiveGroup = tcuTestCase.newTest(primitiveTypes[primitiveTypeNdx].name, '');
                /** @type {number} */
                var primitiveType  = primitiveTypes[primitiveTypeNdx].type;
                modeGroup.addChild(primitiveGroup);

                for (var typeNdx = 0; typeNdx < basicTypes.length; typeNdx++)
                {
                    /** @type {gluShaderUtil.DataType} */
                    var type = basicTypes[typeNdx];
                    /** @type {boolean} */
                    var isFloat = gluShaderUtil.getDataTypeScalarType(type) == gluShaderUtil.DataType.FLOAT;

                    for (var precNdx = 0; precNdx < precisions.length; precNdx++)
                    {
                        /** @type {gluShaderUtil.precision} */
                        var precision = precisions[precNdx];
                        /** @type {string} */
                        var name = gluShaderUtil.getPrecisionName(precision) + '_' + gluShaderUtil.getDataTypeName(type);

                        primitiveGroup.addChild(new BasicArrayCase(
                            context,
                            name,
                            '',
                            bufferMode,
                            primitiveType,
                            type,
                            precision,
                            isFloat ? interpolation.SMOOTH : interpolation.FLAT
                        ));
                    }
                }
            }
        }

        // .array_element
        /** @type {tcuTestCase.DeqpTest} */
        var arrayElemGroup = tcuTestCase.newTest('array_element', 'Capturing single array element in TF');
        testGroup.addChild(arrayElemGroup);

        for (var bufferModeNdx = 0; bufferModeNdx < bufferModes.length; bufferModeNdx++)
        {
            /** @type {tcuTestCase.DeqpTest} */
            var modeGroup  = tcuTestCase.newTest(bufferModes[bufferModeNdx].name, '');
            /** @type {number} */
            var bufferMode = bufferModes[bufferModeNdx].mode;
            arrayElemGroup.addChild(modeGroup);

            for (var primitiveTypeNdx = 0; primitiveTypeNdx < primitiveTypes.length; primitiveTypeNdx++)
            {
                /** @type {tcuTestCase.DeqpTest} */
                var primitiveGroup = tcuTestCase.newTest(primitiveTypes[primitiveTypeNdx].name, '');
                /** @type {number} */
                var primitiveType  = primitiveTypes[primitiveTypeNdx].type;
                modeGroup.addChild(primitiveGroup);

                for (var typeNdx = 0; typeNdx < basicTypes.length; typeNdx++)
                {
                    /** @type {gluShaderUtil.DataType} */
                    var type = basicTypes[typeNdx];
                    /** @type {boolean} */
                    var isFloat = gluShaderUtil.getDataTypeScalarType(type) == gluShaderUtil.DataType.FLOAT;

                    for (var precNdx = 0; precNdx < precisions.length; precNdx++)
                    {
                        /** @type {gluShaderUtil.precision} */
                        var precision = precisions[precNdx];
                        /** @type {string} */
                        var name = gluShaderUtil.getPrecisionName(precision) + '_' + gluShaderUtil.getDataTypeName(type);

                        primitiveGroup.addChild(new ArrayElementCase(
                            context,
                            name,
                            '',
                            bufferMode,
                            primitiveType,
                            type,
                            precision,
                            isFloat ? interpolation.SMOOTH : interpolation.FLAT
                        ));
                    }
                }
            }
        }

        // .interpolation
        /** @type {tcuTestCase.DeqpTest} */
        var interpolationGroup = tcuTestCase.newTest(
            'interpolation', 'Different interpolation modes in transform feedback varyings'
        );
        testGroup.addChild(interpolationGroup);

        for (var modeNdx = 0; modeNdx < interpModes.length; modeNdx++)
        {
        /** @type {interpolation} */
        var interp = interpModes[modeNdx].interp;
        /** @type {tcuTestCase.DeqpTest} */
        var modeGroup = tcuTestCase.newTest(interpModes[modeNdx].name, '');

            interpolationGroup.addChild(modeGroup);

            for (var precNdx = 0; precNdx < precisions.length; precNdx++)
            {
                /** @type {gluShaderUtil.precision} */
                var precision = precisions[precNdx];

                for (var primitiveType = 0; primitiveType < primitiveTypes.length; primitiveType++)
                {
                    for (var bufferMode = 0; bufferMode < bufferModes.length; bufferMode++)
                    {
                        /** @type {string} */
                        var name = (
                            gluShaderUtil.getPrecisionName(precision)         +
                            '_vec4_' + primitiveTypes[primitiveType].name +
                            '_'      + bufferModes[bufferMode].name
                        );

                        modeGroup.addChild(new BasicTypeCase(
                            context,
                            name,
                            '',
                            bufferModes[bufferMode].mode,
                            primitiveTypes[primitiveType].type,
                            gluShaderUtil.DataType.FLOAT_VEC4,
                            precision,
                            interp
                        ));
                    }
                }
            }
        }

        // .random
        /** @type {tcuTestCase.DeqpTest} */
        var randomGroup = tcuTestCase.newTest('random', 'Randomized transform feedback cases');
        testGroup.addChild(randomGroup);

        for (var bufferModeNdx = 0; bufferModeNdx < bufferModes.length; bufferModeNdx++)
        {
            /** @type {tcuTestCase.DeqpTest} */
            var modeGroup  = tcuTestCase.newTest(bufferModes[bufferModeNdx].name, '');
            /** @type {number} */
            var bufferMode = bufferModes[bufferModeNdx].mode;
            randomGroup.addChild(modeGroup);

            for (var primitiveTypeNdx = 0; primitiveTypeNdx < primitiveTypes.length; primitiveTypeNdx++)
            {
                /** @type {tcuTestCase.DeqpTest} */
                var primitiveGroup = tcuTestCase.newTest(primitiveTypes[primitiveTypeNdx].name, '');
                /** @type {number} */
                var  primitiveType = primitiveTypes[primitiveTypeNdx].type;
                modeGroup.addChild(primitiveGroup);

                for (var ndx = 0; ndx < 10; ndx++)
                {
                    /** @type {number} */
                    var seed = deMath.deMathHash(bufferMode) ^ deMath.deMathHash(primitiveType) ^ deMath.deMathHash(ndx);

                    primitiveGroup.addChild(new RandomCase(
                        context,
                        (ndx + 1).toString(),
                        '',
                        bufferMode,
                        primitiveType,
                        seed
                    ));
                }
            }
        }

    };


    /**
     * Create and execute the test cases
     */
    var run = function(gl) {
		var testName = 'transform_feedback';
        var testDescription = 'Transform Feedback Tests';
        var state = tcuTestCase.runner.getState();

        state.testName = testName;
        state.testCases = tcuTestCase.newTest(testName, testDescription, null);

        //Set up name and description of this test series.
        setCurrentTestName(testName);
        description(testDescription);
        try {
            init(gl);
            tcuTestCase.runner.runCallback(tcuTestCase.runTestCases);
        } catch (err) {
        	console.log(err);
            bufferedLogToConsole(err);
            tcuTestCase.runner.terminate();
        }

    };


    return {
        run: run
    };

});
