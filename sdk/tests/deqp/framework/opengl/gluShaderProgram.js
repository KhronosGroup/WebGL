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

define(function() {
'use strict';

/**
 * Shader type enum
 * @enum {number}
 */
var shaderType = {
    VERTEX: 0,
    FRAGMENT: 1
};

/**
 * Get GL shader type from shaderType
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {shaderType} type Shader Type
 * @return {WebGLRenderingContext.GLEnum} GL shader type
 */
var getGLShaderType = function(gl, type) {
    var _glShaderType;
    switch (type) {
    case shaderType.VERTEX: _glShaderType = gl.VERTEX_SHADER; break;
    case shaderType.FRAGMENT: _glShaderType = gl.FRAGMENT_SHADER; break;
    default:
        testFailedOptions('Unknown shader type ' + type, true);
    }

    return _glShaderType;
};

/**
 * Declares shader information
 */
var ShaderInfo = function(type, source) {
    this.type = type;               /** Shader type. */
    this.source = source;             /** Shader source. */
    this.infoLog;            /** Compile info log. */
    this.compileOk = false;  /** Did compilation succeed? */
    this.compileTimeUs = 0;  /** Compile time in microseconds (us). */
};

/**
 * Generates vertex shader info from source
 * @param {string} source
 * @return {ShaderInfo} vertex shader info
 */
var genVertexSource = function(source) {
/** @type {ShaderInfo} */ var shader = new ShaderInfo();
    shader.source = source;
    shader.type = shaderType.VERTEX;
    return shader;
};

/**
 * Generates fragment shader info from source
 * @param {string} source
 * @return {ShaderInfo} fragment shader info
 */
var genFragmentSource = function(source) {
/** @type {ShaderInfo} */ var shader = new ShaderInfo();
    shader.source = source;
    shader.type = shaderType.FRAGMENT;
    return shader;
};

/**
 * Generates shader from WebGL context and type
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {shaderType} type Shader Type
 */
var Shader = function(gl, type) {
    this.gl = gl;
    this.info = new ShaderInfo();  /** Client-side clone of state for debug / perf reasons. */
    this.info.type = type;
    this.shader = gl.createShader(getGLShaderType(gl, type));
    assertMsgOptions(gl.getError() == gl.NO_ERROR, 'glCreateShader()', false, true);

    this.setSources = function(source) {
        this.gl.shaderSource(this.shader, source);
        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'glshaderSource()', false, true);
        this.info.source = source;
    };

    this.getCompileStatus = function() {
        return this.info.compileOk;
    };

    this.compile = function() {
        this.info.compileOk = false;
        this.info.compileTimeUs = 0;
        this.info.infoLog = '';

        /** @type {Date} */ var compileStart = new Date();
        this.gl.compileShader(this.shader);
        /** @type {Date} */ var compileEnd = new Date();
        this.info.compileTimeUs = 1000 * (compileEnd.getTime() - compileStart.getTime());

        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'glCompileShader()', false, true);

        var compileStatus = this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS);
        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'glGetShaderParameter()', false, true);

        this.info.compileOk = compileStatus;
        this.info.infoLog = this.gl.getShaderInfoLog(this.shader);
    };

    this.getShader = function() {
        return this.shader;
    };

};

var ProgramInfo = function() {
    /** @type {string} */ var infoLog;
    /** @type {boolean} */ var linkOk = false;
    /** @type {number} */ var linkTimeUs = 0;
};

/**
 * Creates program.
 * Inner methods: attach shaders, bind attributes location, link program and transform Feedback Varyings
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {WebGLProgram} programID
 */
var Program = function(gl, programID) {
    this.gl = gl;
    this.program = programID;
    this.info = new ProgramInfo();

    if (programID == null) {
        this.program = gl.createProgram();
        assertMsgOptions(gl.getError() == gl.NO_ERROR, 'glCreateProgram()', false, true);
    }

    this.attachShader = function(shader) {
        this.gl.attachShader(this.program, shader);
        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'gl.attachShader()', false, true);
    };

    this.bindAttribLocation = function(location, name) {
        this.gl.bindAttribLocation(this.program, location, name);
        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'gl.bindAttribLocation()', false, true);
    };

    this.link = function() {
        this.info.linkOk = false;
        this.info.linkTimeUs = 0;
        this.info.infoLog = '';

        /** @type {Date} */ var linkStart = new Date();
        this.gl.linkProgram(this.program);
        /** @type {Date} */ var linkEnd = new Date();
        this.info.linkTimeUs = 1000 * (linkEnd.getTime() - linkStart.getTime());

        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'glLinkProgram()', false, true);

        var linkStatus = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'gl.getProgramParameter()', false, true);
        this.info.linkOk = linkStatus;
        this.info.infoLog = this.gl.getProgramInfoLog(this.program);
    };

    this.transformFeedbackVaryings = function(varyings, bufferMode) {
        this.gl.transformFeedbackVaryings(this.program, varyings, bufferMode);
        assertMsgOptions(this.gl.getError() == this.gl.NO_ERROR, 'gl.transformFeedbackVaryings()', false, true);
    };
};

/**
 * Assigns gl WebGL context and programSources. Declares array of shaders and new program()
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {ProgramSources} programSources
 */
var ShaderProgram = function(gl, programSources) {
    this.gl = gl;
    this.programSources = programSources;
    this.shaders = [];
    this.program = new Program(gl);

    this.getProgram = function() {
        return this.program.program;
        };

    this.getProgramInfo = function() {
        return this.program.info;
    };

    /** @type {boolean} */ this.shadersOK = true;

        for (var i = 0; i < programSources.sources.length; i++) {
        /** @type {Shader} */ var shader = new Shader(gl, programSources.sources[i].type);
            shader.setSources(programSources.sources[i].source);
            shader.compile();
            this.shaders.push(shader);
            this.shadersOK = this.shadersOK && shader.getCompileStatus();
        }

        if (this.shadersOK) {
            for (var i = 0; i < this.shaders.length; i++)
                this.program.attachShader(this.shaders[i].getShader());

            for (var attrib in programSources.attribLocationBindings)
                this.program.bindAttribLocation(programSources.attribLocationBindings[attrib], attrib);

            if (programSources.transformFeedbackBufferMode)
                if (programSources.transformFeedbackBufferMode === gl.NONE)
                    assertMsgOptions(programSources.transformFeedbackVaryings.length === 0, 'Transform feedback sanity check', false, true);
                else
                    this.program.transformFeedbackVaryings(programSources.transformFeedbackVaryings, programSources.transformFeedbackBufferMode);

            /* TODO: GLES 3.1: set separable flag */

            this.program.link();

        }

};

ShaderProgram.prototype.isOk = function() {
    return this.shadersOK;
};

var containerTypes = {
    ATTRIB_LOCATION_BINDING: 0,
    TRANSFORM_FEEDBACK_MODE: 1,
    TRANSFORM_FEEDBACK_VARYING: 2,
    TRANSFORM_FEEDBACK_VARYINGS: 3,
    SHADER_SOURCE: 4,
    PROGRAM_SEPARABLE: 5,
    PROGRAM_SOURCES: 6,

    CONTAINER_TYPE_LAST: 7,
    ATTACHABLE_BEGIN: 0,     // ATTRIB_LOCATION_BINDING
    ATTACHABLE_END: 5 + 1 // PROGRAM_SEPARABLE + 1
};

var AttribLocationBinding = function(name, location) {
    this.name = name;
    this.location = location;

    this.getContainerType = function() {
        return containerTypes.ATTRIB_LOCATION_BINDING;
    };
};

var TransformFeedbackMode = function(mode) {
    this.mode = mode;

    this.getContainerType = function() {
        return containerTypes.TRANSFORM_FEEDBACK_MODE;
    };
};

var TransformFeedbackVarying = function(name) {
    this.name = name;

    this.getContainerType = function() {
        return containerTypes.TRANSFORM_FEEDBACK_VARYING;
    };
};

var TransformFeedbackVaryings = function(array) {
    this.array = array;

    this.getContainerType = function() {
        return containerTypes.TRANSFORM_FEEDBACK_VARYINGS;
    };
};

var ProgramSeparable = function(separable) {
    this.separable = separable;

    this.getContainerType = function() {
        return containerTypes.PROGRAM_SEPARABLE;
    };
};

var VertexSource = function(str) {
    this.shaderType = shaderType.VERTEX;
    this.source = str;

    this.getContainerType = function() {
        return containerTypes.SHADER_SOURCE;
    };
};

var FragmentSource = function(str) {
    this.shaderType = shaderType.FRAGMENT;
    this.source = str;

    this.getContainerType = function() {
        return containerTypes.SHADER_SOURCE;
    };
};

var ProgramSources = function() {
    /** @type {Array.<ShaderInfo>} */ this.sources = [];
    this.attribLocalBindings = [];
    this.transformFeedbackVaryings = [];
    this.transformFeedbackBufferMode = 0;
    this.separable = false;

    this.getContainerType = function() {
        return containerTypes.PROGRAM_SOURCES;
    };

    this.add = function(item) {

        var type = 'undefined';
        if (typeof(item.getContainerType) == 'function') {
            type = item.getContainerType();
            if (
                typeof(type) != 'number' ||
                type < containerTypes.ATTACHABLE_BEGIN ||
                type >= containerTypes.ATTACHABLE_END
            ) {
                type = 'undefined';
            }
        }

        switch (type) {
            case containerTypes.ATTRIB_LOCATION_BINDING:
                this.attribLocationBindings.push(item);
                break;

            case containerTypes.TRANSFORM_FEEDBACK_MODE:
                this.transformFeedbackBufferMode = item.mode;
                break;

            case containerTypes.TRANSFORM_FEEDBACK_VARYING:
                this.transformFeedbackVaryings.push(item);
                break;

            case containerTypes.TRANSFORM_FEEDBACK_VARYINGS:
                this.transformFeedbackVaryings.concat(item);
                break;

            case containerTypes.SHADER_SOURCE:
                this.sources.push(new ShaderInfo(item.shaderType, item.source));
                break;

            case containerTypes.PROGRAM_SEPARABLE:
                this.separable = item.separable;
                break;

            default:
                throw Error('Type \"' + type + '\" cannot be added to ProgramSources.');
                break;
        }

        return this;
    };
};

/**
 * //! Helper for constructing vertex-fragment source pair.
 * @param {string} vertexSrc
 * @param {string} fragmentSrc
 * @return {ProgramSources}
 */
var makeVtxFragSources = function(vertexSrc, fragmentSrc) {
    /** @type  {ProgramSources} */ var sources = new ProgramSources();
    sources.sources.push(genVertexSource(vertexSrc));
    sources.sources.push(genFragmentSource(fragmentSrc));
    return sources;
};

return {
    ShaderProgram: ShaderProgram,
    shaderType: shaderType,
    genVertexSource: genVertexSource,
    genFragmentSource: genFragmentSource,
    containerTypes: containerTypes,
    AttribLocationBinding: AttribLocationBinding,
    TransformFeedbackMode: TransformFeedbackMode,
    TransformFeedbackVarying: TransformFeedbackVarying,
    TransformFeedbackVaryings: TransformFeedbackVaryings,
    VertexSource: VertexSource,
    FragmentSource: FragmentSource,
    ProgramSeparable: ProgramSeparable,
    ProgramSources: ProgramSources,
    makeVtxFragSources: makeVtxFragSources
};

});
