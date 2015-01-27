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


var deqpDraw = (function() {
'use strict';

/**
 * Description of a vertex array binding
 * @param {WebGLRenderingContext.GLEnum} type GL Type of data
 * @param {string|number} location Binding location
 * @param {number} components Number of components per vertex
 * @param {number} elements Number of elements in the array
 * @param {Array.<number>} data Source data
 */
var VertexArrayBinding = function(type, location, components, elements, data) {
    this.type = type;
    this.location = location;
    this.components = components;
    this.elements = elements;
    this.data = data;
};

/**
 * Creates vertex buffer, binds it and draws elements
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {number} program ID, vertexProgramID
 * @param {Array.<number>} vertexArrays
 * @param {PrimitiveList} primitives to draw
 * @param {function()} callback
 */
var draw = function(gl, program, vertexArrays, primitives, callback) {
    /** TODO: finish implementation */
    /** @type {Array.<WebGLBuffer>} */ var objects = [];

    for (var i = 0; i < vertexArrays.length; i++) {
        /** @type {WebGLBuffer} */ var buffer = vertexBuffer(gl, vertexArrays[i]);
        objects.push(buffer);
    }

    if (primitives.indices) {
        /** @type {WebGLBuffer} */ var elemBuffer = indexBuffer(gl, primitives);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elemBuffer);

        if (callback)
            callback.beforeDrawCall();

        drawIndexed(gl, primitives, 0);

        if (callback)
            callback.afterDrawCall();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    } else {
    /** TODO: implement */
    }

  assertMsgOptions(gl.getError() === gl.NO_ERROR, 'drawArrays', false, true);
    for (var i = 0; i < vertexArrays.length; i++) {
        gl.disableVertexAttribArray(vertexArrays[i].location);
    }
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

/**
 * Creates vertex buffer, binds it and draws elements
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {PrimitiveList} primitives Primitives to draw
 * @param {number} offset
 */
var drawIndexed = function(gl, primitives, offset) {
/** @type {WebGLRenderingContext.GLEnum} */ var mode = getPrimitiveGLType(gl, primitives.type);
    /** TODO: C++ implementation supports different index types, we use only int16.
        Could it cause any issues?

        deUint32 indexGLType = getIndexGLType(primitives.indexType);
    */

    gl.drawElements(mode, primitives.indices.length, gl.UNSIGNED_SHORT, offset);
};


/**
 * Enums for primitive types
 * @enum
 */
var primitiveType = {
    TRIANGLES: 0,
    TRIANGLE_STRIP: 1,
    TRIANGLE_FAN: 2,

    LINES: 3,
    LINE_STRIP: 4,
    LINE_LOOP: 5,

    POINTS: 6,

    PATCHES: 7
};

/**
 * get GL type from primitive type
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {primitiveType} type primitiveType
 * @return {WebGLRenderingContext.GLEnum} GL primitive type
 */
var getPrimitiveGLType = function(gl, type) {
    switch (type) {
        case primitiveType.TRIANGLES: return gl.TRIANGLES;
        case primitiveType.TRIANGLE_STRIP: return gl.TRIANGLE_STRIP;
        case primitiveType.TRIANGLE_FAN: return gl.TRIANGLE_FAN;
        case primitiveType.LINES: return gl.LINES;
        case primitiveType.LINE_STRIP: return gl.LINE_STRIP;
        case primitiveType.LINE_LOOP: return gl.LINE_LOOP;
        case primitiveType.POINTS: return gl.POINTS;
        case primitiveType.PATCHES: return gl.PATCHES;
        default:
            testFailedOptions('Unknown primitive type ' + type, true);
            return undefined;
    }
};

/**
 * Calls PrimitiveList() to create primitive list for Triangles
 * @param {number} indices
 */
var triangles = function(indices) {
    return new PrimitiveList(primitiveType.TRIANGLES, indices);
};

/**
 * Calls PrimitiveList() to create primitive list for Patches
 * @param {number} indices
 */
var patches = function(indices) {
    return new PrimitiveList(primitiveType.PATCHES, indices);
};

/**
 * Creates primitive list for Triangles or Patches, depending on type
 * @param {primitiveType} type primitiveType
 * @param {number} indices
 */
var PrimitiveList = function(type, indices) {
    this.type = type;
    this.indices = indices;
};

/**
 * Create Element Array Buffer
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {PrimitiveList} primitives to construct the buffer from
 * @return {WebGLBuffer} indexObject buffer with elements
 */
var indexBuffer = function(gl, primitives) {
    /** @type {WebGLBuffer} */ var indexObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexObject);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'bindBuffer', false, true);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(primitives.indices), gl.STATIC_DRAW);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'bufferData', false, true);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return indexObject;
};

/**
 * Create Array Buffer
 * @param {WebGLRenderingContext} gl WebGL context
 * @param {VertexArrayBinding} vertexArray primitives, Array buffer descriptor
 * @return {WebGLBuffer} buffer of vertices
 */
var vertexBuffer = function(gl, vertexArray) {
    /** @type {WebGLBuffer} */ var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'bindBuffer', false, true);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray.data), gl.STATIC_DRAW);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'bufferData', false, true);
    gl.enableVertexAttribArray(vertexArray.location);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'enableVertexAttribArray', false, true);
    gl.vertexAttribPointer(vertexArray.location, vertexArray.components, vertexArray.type, false, 0, 0);
    assertMsgOptions(gl.getError() === gl.NO_ERROR, 'vertexAttribPointer', false, true);
    _logToConsole(vertexArray);
    return buffer;
};

var Pixel = function(rgba) {
    this.rgba = rgba;
};

Pixel.prototype.getRed = function() {
    return this.rgba[0];
};
Pixel.prototype.getGreen = function() {
    return this.rgba[1];
};
Pixel.prototype.getBlue = function() {
    return this.rgba[2];
};
Pixel.prototype.getAlpha = function() {
    return this.rgba[3];
};

var Surface = function() {
};

Surface.prototype.readSurface = function(gl, x, y, width, height) {
    this.buffer = new Uint8Array(width * height * 4);
    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, this.buffer);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this.buffer;
};

Surface.prototype.getPixel = function(x, y) {
    /** @type {number} */ var base = (x + y * this.height) * 4;
    /** @type {Array.<number>} */
    var rgba = [
        this.buffer[base],
        this.buffer[base + 1],
        this.buffer[base + 2],
        this.buffer[base + 3]
        ];
    return new Pixel(rgba);
};


return {
    draw: draw,
    triangles: triangles,
    patches: patches,
    Surface: Surface,
    VertexArrayBinding: VertexArrayBinding
};
}());

