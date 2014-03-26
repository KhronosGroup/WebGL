/*
** Copyright (c) 2014 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/

'use strict';

var OutOfBoundsTest = (function() {

var runInt32OverflowTest = function(callTemplate, gl, wtu, ext) {
    // 0xffffffff needs to convert to a 'long' IDL argument as -1, as per
    // WebIDL 4.1.7.  JS ToInt32(0xffffffff) == -1, which is the first step
    // of the conversion.  Thus INVALID_VALUE.
    wtu.shouldGenerateGLError(gl, gl.INVALID_VALUE, wtu.replaceParams(callTemplate, {count: '0xffffffff', type: 'gl.UNSIGNED_SHORT', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_VALUE, wtu.replaceParams(callTemplate, {count: 1, type: 'gl.UNSIGNED_SHORT', offset: '0xffffffff'}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_VALUE, wtu.replaceParams(callTemplate, {count: '0xffffffff', type: 'gl.UNSIGNED_SHORT', offset: '0xffffffff'}));
};

var runCommonInvalidValueTests = function(callTemplate, gl, wtu, ext) {
    wtu.shouldGenerateGLError(gl, gl.INVALID_VALUE, wtu.replaceParams(callTemplate, {count: -1, type: 'gl.UNSIGNED_BYTE', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_VALUE, wtu.replaceParams(callTemplate, {count: 0, type: 'gl.UNSIGNED_BYTE', offset: -1}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_VALUE, wtu.replaceParams(callTemplate, {count: -1, type: 'gl.UNSIGNED_BYTE', offset: 1}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_VALUE, wtu.replaceParams(callTemplate, {count: 1, type: 'gl.UNSIGNED_BYTE', offset: -1}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_VALUE, wtu.replaceParams(callTemplate, {count: '0xffffffff', type: 'gl.UNSIGNED_BYTE', offset: 0}));
};

var setupProgramAndBindVertexArray = function(gl, wtu) {
    var program = wtu.loadStandardProgram(gl);

    gl.useProgram(program);
    var vertexObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexObject);
    gl.enableVertexAttribArray(0);

    return program;
};

var setupProgram2 = function(gl, wtu) {
    var vshader = [
        'attribute vec3 aOne;',
        'attribute vec2 aTwo;',
        'void main() {',
        '  gl_Position = vec4(aOne, 1.0) + vec4(aTwo, 0.0, 1.0);',
        '}'
    ].join('\n');

    var fshader = [
        'void main() {',
        '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
        '}'
    ].join('\n');

    var program = wtu.setupProgram(gl, [vshader, fshader], [ "aOne", "aTwo" ]);
    if (!program) {
        testFailed("failed to create test program");
    }
    return program;
};

var runDrawArraysTest = function(callTemplate, gl, wtu, ext) {
    var program = setupProgramAndBindVertexArray(gl, wtu);

    debug("Test empty buffer")
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([  ]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {offset: 0, count: 1}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {offset: 0, count: 10000}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {offset: 0, count: 10000000000000}));
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {offset: 1, count: 0}));
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {offset: 0, count: 0}));
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {offset: 100, count: 0}));
    runCommonInvalidValueTests(callTemplate, gl, wtu, ext);

    debug("")
    debug("Test buffer with 3 float vectors")
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0,0.5,0, -0.5,-0.5,0, 0.5,-0.5,0 ]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {offset: 0, count: 3}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {offset: 3, count: 2}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {offset: 0, count: 10000}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {offset: 0, count: 10000000000000}));
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {offset: 0, count: 0}));
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {offset: 100, count: 0}));
    runCommonInvalidValueTests(callTemplate, gl, wtu, ext);

    debug("")
    debug("Test buffer with interleaved (3+2) float vectors")

    setupProgram2(gl, wtu);

    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // enough for 9 vertices, so 3 triangles
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(9*5), gl.STATIC_DRAW);

    // bind first 3 elements, with a stride of 5 float elements
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5*4, 0);
    // bind 2 elements, starting after the first 3; same stride of 5 float elements
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5*4, 3*4);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {offset: 0, count: 9}));

    // negative values must generate INVALID_VALUE; they can never be valid
    wtu.shouldGenerateGLError(gl, gl.INVALID_VALUE, wtu.replaceParams(callTemplate, {offset: 0, count: -500}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_VALUE, wtu.replaceParams(callTemplate, {offset: -200, count: 1}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_VALUE, wtu.replaceParams(callTemplate, {offset: -200, count: -500}));

    runInt32OverflowTest(callTemplate, gl, wtu, ext);

    // values that could otherwise be valid but aren't due to bindings generate
    // INVALID_OPERATION
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {offset: 0, count: 200}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {offset: 0, count: '0x7fffffff'}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {offset: '0x7fffffff', count: 1}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {offset: '0x7fffffff', count: '0x7fffffff'}));
};

var runDrawElementsTest = function(callTemplate, gl, wtu, ext) {
    var program = setupProgramAndBindVertexArray(gl, wtu);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ 0,0.5,0, -0.5,-0.5,0, 0.5,-0.5,0 ]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    var indexObject = gl.createBuffer();

    debug('Test empty index buffer');
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([  ]), gl.STATIC_DRAW);
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {count: 0, type: 'gl.UNSIGNED_BYTE', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 3, type: 'gl.UNSIGNED_BYTE', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 10000, type: 'gl.UNSIGNED_BYTE', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 10000000000000, type: 'gl.UNSIGNED_BYTE', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 1, type: 'gl.UNSIGNED_BYTE', offset: 0}));
    runCommonInvalidValueTests(callTemplate, gl, wtu, ext);

    debug('');
    debug('Test buffer with 3 byte indexes');
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([ 0, 1, 2 ]), gl.STATIC_DRAW);
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {count: 3, type: 'gl.UNSIGNED_BYTE', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 3, type: 'gl.UNSIGNED_BYTE', offset: 2}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 10000, type: 'gl.UNSIGNED_BYTE', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 10000000000000, type: 'gl.UNSIGNED_BYTE', offset: 0}));
    runCommonInvalidValueTests(callTemplate, gl, wtu, ext);
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {count: 0, type: 'gl.UNSIGNED_BYTE', offset: 4}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: '0x7fffffff', type: 'gl.UNSIGNED_BYTE', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: '0x7fffffff', type: 'gl.UNSIGNED_BYTE', offset: '0x7fffffff'}));

    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, 'gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, (new Uint8Array([ 3, 0, 1, 2 ])).subarray(1), gl.STATIC_DRAW)');
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {count: 3, type: 'gl.UNSIGNED_BYTE', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, 'gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, new Uint8Array([ 3, 0, 1]))');
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 3, type: 'gl.UNSIGNED_BYTE', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, 'gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, (new Uint8Array([ 3, 0, 1, 2 ])).subarray(1))');
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {count: 3, type: 'gl.UNSIGNED_BYTE', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {count: 0, type: 'gl.UNSIGNED_BYTE', offset: 0}));

    debug('');
    debug('Test buffer with interleaved (3+2) float vectors');

    setupProgram2(gl, wtu);

    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // enough for 9 vertices, so 3 triangles
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(9*5), gl.STATIC_DRAW);

    // bind first 3 elements, with a stride of 5 float elements
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5*4, 0);
    // bind 2 elements, starting after the first 3; same stride of 5 float elements
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5*4, 3*4);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    var ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(
        [ 0, 1, 2,
          1, 2, 0,
          2, 0, 1,
          200, 200, 200,
          0x7fff, 0x7fff, 0x7fff,
          0xffff, 0xffff, 0xffff ]),
        gl.STATIC_DRAW);

    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {count: 9, type: 'gl.UNSIGNED_SHORT', offset: 0}));


    // invalid operation with indices that would be valid with correct bindings
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 9, type: 'gl.UNSIGNED_SHORT', offset: 1000}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 12, type: 'gl.UNSIGNED_SHORT', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 15, type: 'gl.UNSIGNED_SHORT', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 18, type: 'gl.UNSIGNED_SHORT', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 3, type: 'gl.UNSIGNED_SHORT', offset: 2*15}));

    runInt32OverflowTest(callTemplate, gl, wtu, ext);
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: '0x7fffffff', type: 'gl.UNSIGNED_SHORT', offset: 0}));

    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {count: 0, type: 'gl.UNSIGNED_SHORT', offset: 0}));

    // invalid operation with offset that's not a multiple of the type size
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {count: 6, type: 'gl.UNSIGNED_SHORT', offset: 0}));
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 6, type: 'gl.UNSIGNED_SHORT', offset: 1}));
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {count: 6, type: 'gl.UNSIGNED_SHORT', offset: 2}));

    // invalid operation if no buffer is bound to ELEMENT_ARRAY_BUFFER
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 6, type: 'gl.UNSIGNED_SHORT', offset: 0}));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);

    debug('');
    debug('Test buffer setting attrib 0 to a buffer too small and disable it.');
    var smallVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, smallVBO);
    gl.bufferData(gl.ARRAY_BUFFER, 1, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0x10);
    gl.disableVertexAttribArray(0);
    wtu.shouldGenerateGLError(gl, gl.NO_ERROR, wtu.replaceParams(callTemplate, {count: 6, type: 'gl.UNSIGNED_SHORT', offset: 2}));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    wtu.shouldGenerateGLError(gl, gl.INVALID_OPERATION, wtu.replaceParams(callTemplate, {count: 6, type: 'gl.UNSIGNED_SHORT', offset: 2}));
};

return {
    runDrawArraysTest: runDrawArraysTest,
    runDrawElementsTest: runDrawElementsTest
};

})();
