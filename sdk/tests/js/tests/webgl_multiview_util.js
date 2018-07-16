/*
** Copyright (c) 2018 The Khronos Group Inc.
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

"use strict";

function setupTexture(target)
{
    let texture = gl.createTexture();
    gl.bindTexture(target, texture);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    wtu.glErrorShouldBe(gl, gl.NO_ERROR, "texture parameter setup should succeed");
    return texture;
}

function getMultiviewPassthroughVertexShader(views) {
    let shaderCode = ['#version 300 es',
    '#extension GL_OVR_multiview : require',

    'layout(num_views = $(num_views)) in;',

    'in vec4 a_position;',

    'void main() {',
    '    gl_Position = a_position;',
    '}'].join('\n');
    return wtu.replaceParams(shaderCode, {'num_views': views});
}

function getMultiviewOffsetVertexShader(views) {
    let shaderCode = ['#version 300 es',
    '#extension GL_OVR_multiview : require',

    'layout(num_views = $(num_views)) in;',

    'in vec4 a_position;',

    'void main() {',
    '    vec4 pos = a_position;',
    "    // Transform the quad to a thin vertical strip that's offset along the x axis according to the view id.",
    '    pos.x = (pos.x * 0.5 + 0.5 + float(gl_ViewID_OVR)) * 2.0 / $(num_views).0 - 1.0;',
    '    gl_Position = pos;',
    '}'].join('\n');
    return wtu.replaceParams(shaderCode, {'num_views': views});
}

function getMultiviewColorFragmentShader() {
    return ['#version 300 es',
    '#extension GL_OVR_multiview : require',
    'precision highp float;',

    'out vec4 my_FragColor;',

    'void main() {',
    '    switch (gl_ViewID_OVR & 7u) {',
    '        case 0u:',
    '            my_FragColor = vec4(0.0, 0.0, 1.0, 1.0);',
    '            break;',
    '        case 1u:',
    '            my_FragColor = vec4(0.0, 1.0, 0.0, 1.0);',
    '            break;',
    '        case 2u:',
    '            my_FragColor = vec4(0.0, 1.0, 1.0, 1.0);',
    '            break;',
    '        case 3u:',
    '            my_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
    '            break;',
    '        case 4u:',
    '            my_FragColor = vec4(1.0, 0.0, 1.0, 1.0);',
    '            break;',
    '        case 5u:',
    '            my_FragColor = vec4(1.0, 1.0, 0.0, 1.0);',
    '            break;',
    '        case 6u:',
    '            my_FragColor = vec4(1.0, 1.0, 1.0, 1.0);',
    '            break;',
    '        default:',
    '            my_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',
    '            break;',
    '    }',
    '}'].join('\n');
}

function getExpectedColor(view) {
    var mask = (view + 1);
    return [(mask & 4) ? 255 : 0, (mask & 2) ? 255 : 0, (mask & 1) ? 255 : 0, 255];
}
