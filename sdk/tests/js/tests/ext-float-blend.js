'use strict';

const trivialVsSrc = `
void main()
{
    gl_Position = vec4(0,0,0,1);
}
`;
const trivialFsSrc = `
void main()
{
    gl_FragColor = vec4(0,1,0,1);
}
`;

function testExtFloatBlend(shouldBlend, internalFormat) {
    const prog = wtu.setupProgram(gl, [trivialVsSrc, trivialFsSrc]);
    gl.useProgram(prog);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 1, 1, 0, gl.RGBA, gl.FLOAT, null);

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    shouldBe('gl.checkFramebufferStatus(gl.FRAMEBUFFER)', 'gl.FRAMEBUFFER_COMPLETE');

    gl.disable(gl.BLEND);
    gl.drawArrays(gl.POINTS, 0, 1);
    wtu.glErrorShouldBe(gl, 0, 'Float32 draw target without blending');

    gl.enable(gl.BLEND);
    gl.drawArrays(gl.POINTS, 0, 1);
    wtu.glErrorShouldBe(gl, shouldBlend ? 0 : gl.INVALID_OPERATION,
                        'Float32 blending is ' + (shouldBlend ? '' : 'not ') + 'allowed ');
}

/*
** Copyright (c) 2013 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** 'Materials'), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/
