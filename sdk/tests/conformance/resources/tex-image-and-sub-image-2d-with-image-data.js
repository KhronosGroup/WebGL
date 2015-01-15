/*
** Copyright (c) 2012 The Khronos Group Inc.
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

function generateTest(pixelFormat, pixelType, prologue) {
    var wtu = WebGLTestUtils;
    var gl = null;
    var successfullyParsed = false;
    var imageData = null;

    var init = function()
    {
        description('Verify texImage2D and texSubImage2D code paths taking ImageData (' + pixelFormat + '/' + pixelType + ')');

        gl = wtu.create3DContext("example");

        if (!prologue(gl)) {
            finishTest();
            return;
        }

        gl.clearColor(0,0,0,1);
        gl.clearDepth(1);
        gl.disable(gl.BLEND);

        var canvas2d = document.getElementById("texcanvas");
        var context2d = canvas2d.getContext("2d");
        imageData = context2d.createImageData(2, 2);
        var data = imageData.data;
        data[0] = 255;
        data[1] = 0;
        data[2] = 0;
        data[3] = 255;
        data[4] = 255;
        data[5] = 0;
        data[6] = 0;
        data[7] = 255;
        data[8] = 0;
        data[9] = 255;
        data[10] = 0;
        data[11] = 0;
        data[12] = 0;
        data[13] = 255;
        data[14] = 0;
        data[15] = 0;

        runTest();
    }

    function runOneIteration(useTexSubImage2D, flipY, premultiplyAlpha, topColor, bottomColor, bindingTarget, program)
    {
        debug('Testing ' + (useTexSubImage2D ? 'texSubImage2D' : 'texImage2D') +
              ' with flipY=' + flipY + ' and premultiplyAlpha=' + premultiplyAlpha +
              ', bindingTarget=' + (bindingTarget == gl.TEXTURE_2D ? 'TEXTURE_2D' : 'TEXTURE_CUBE_MAP'));
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Enable writes to the RGBA channels
        gl.colorMask(1, 1, 1, 0);
        var texture = gl.createTexture();
        // Bind the texture to texture unit 0
        gl.bindTexture(bindingTarget, texture);
        // Set up texture parameters
        gl.texParameteri(bindingTarget, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(bindingTarget, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        // Set up pixel store parameters
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiplyAlpha);
        var targets = [gl.TEXTURE_2D];
        if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
            targets = [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                       gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                       gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                       gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                       gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                       gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
        }
        // Upload the image into the texture
        for (var tt = 0; tt < targets.length; ++tt) {
            if (useTexSubImage2D) {
                // Initialize the texture to black first
                gl.texImage2D(targets[tt], 0, gl[pixelFormat], imageData.width, imageData.height, 0,
                              gl[pixelFormat], gl[pixelType], null);
                gl.texSubImage2D(targets[tt], 0, 0, 0, gl[pixelFormat], gl[pixelType], imageData);
            } else {
                gl.texImage2D(targets[tt], 0, gl[pixelFormat], gl[pixelFormat], gl[pixelType], imageData);
            }
        }

        var loc;
        if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
            loc = gl.getUniformLocation(program, "face");
        }

        for (var tt = 0; tt < targets.length; ++tt) {
            if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
                gl.uniform1i(loc, targets[tt]);
            }
            // Draw the triangles
            wtu.clearAndDrawUnitQuad(gl, [0, 0, 0, 255]);

            // Check the top pixel and bottom pixel and make sure they have
            // the right color.
            debug("Checking bottom pixel");
            wtu.checkCanvasRect(gl, 0, 0, 1, 1, bottomColor, "shouldBe " + bottomColor);
            debug("Checking top pixel");
            wtu.checkCanvasRect(gl, 0, 1, 1, 1, topColor, "shouldBe " + topColor);
        }
    }

    function runTest()
    {
        var program = wtu.setupTexturedQuad(gl);
        runTestOnBindingTarget(gl.TEXTURE_2D, program);
        program = wtu.setupTexturedQuadWithCubeMap(gl);
        runTestOnBindingTarget(gl.TEXTURE_CUBE_MAP, program);

        wtu.glErrorShouldBe(gl, gl.NO_ERROR, "should be no errors");
        finishTest();
    }

    function runTestOnBindingTarget(bindingTarget, program) {
        var red = [255, 0, 0, 255];
        var green = [0, 255, 0, 255];
        var redPremultiplyAlpha = [255, 0, 0, 255];
        var greenPremultiplyAlpha = [0, 0, 0, 255];
        var cases = [
            { sub: false, flipY: true, premultiplyAlpha: false, topColor: red, bottomColor: green },
            { sub: false, flipY: false, premultiplyAlpha: false, topColor: green, bottomColor: red },
            { sub: false, flipY: true, premultiplyAlpha: true, topColor: redPremultiplyAlpha, bottomColor: greenPremultiplyAlpha },
            { sub: false, flipY: false, premultiplyAlpha: true, topColor: greenPremultiplyAlpha, bottomColor: redPremultiplyAlpha },
            { sub: true, flipY: true, premultiplyAlpha: false, topColor: red, bottomColor: green },
            { sub: true, flipY: false, premultiplyAlpha: false, topColor: green, bottomColor: red },
            { sub: true, flipY: true, premultiplyAlpha: true, topColor: redPremultiplyAlpha, bottomColor: greenPremultiplyAlpha },
            { sub: true, flipY: false, premultiplyAlpha: true, topColor: greenPremultiplyAlpha, bottomColor: redPremultiplyAlpha },
        ];

        for (var i in cases) {
            runOneIteration(cases[i].sub, cases[i].flipY, cases[i].premultiplyAlpha,
                            cases[i].topColor, cases[i].bottomColor, bindingTarget, program);
        }
    }

    return init;
}
