/*
** Copyright (c) 2015 The Khronos Group Inc.
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

function generateTest(internalFormat, pixelFormat, pixelType, prologue, resourcePath) {
    var wtu = WebGLTestUtils;
    var tiu = TexImageUtils;
    var gl = null;
    var successfullyParsed = false;
    var blackColor = [0, 0, 0];
    var redColor = [255, 0, 0];
    var greenColor = [0, 255, 0];
    var bitmaps = [];

    function init()
    {
        description('Verify texImage2D and texSubImage2D code paths taking ImageBitmap (' + internalFormat + '/' + pixelFormat + '/' + pixelType + ')');

        if(!window.createImageBitmap || !window.ImageBitmap) {
            finishTest();
            return;
        }

        gl = wtu.create3DContext("example");

        if (!prologue(gl)) {
            finishTest();
            return;
        }

        switch (gl[pixelFormat]) {
          case gl.RED:
          case gl.RED_INTEGER:
            greenColor = [0, 0, 0];
            break;
          default:
            break;
        }

        gl.clearColor(0,0,0,1);
        gl.clearDepth(1);
        gl.disable(gl.BLEND);

        var imageData = new ImageData(new Uint8ClampedArray(
                                      [255, 0, 0, 255,
                                      255, 0, 0, 0,
                                      0, 255, 0, 255,
                                      0, 255, 0, 0]),
                                      2, 2);

        var p1 = createImageBitmap(imageData).then(function(imageBitmap) { bitmaps.defaultOption = imageBitmap });
        var p2 = createImageBitmap(imageData, {imageOrientation: "none"}).then(function(imageBitmap) { bitmaps.noFlipY = imageBitmap });
        var p3 = createImageBitmap(imageData, {imageOrientation: "flipY"}).then(function(imageBitmap) { bitmaps.flipY = imageBitmap });
        Promise.all([p1, p2, p3]).then(function() {
            runTest();
        }, function() {
            // createImageBitmap with options could be rejected if it is not supported
            finishTest();
            return;
        });
    }

    function runOneIteration(useTexSubImage2D, bindingTarget, program, bitmap, flipY)
    {
        debug('Testing ' + (useTexSubImage2D ? 'texSubImage2D' : 'texImage2D') +
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
                gl.texImage2D(targets[tt], 0, gl[internalFormat], bitmap.width, bitmap.height, 0,
                              gl[pixelFormat], gl[pixelType], null);
                gl.texSubImage2D(targets[tt], 0, 0, 0, gl[pixelFormat], gl[pixelType], bitmap);
            } else {
                gl.texImage2D(targets[tt], 0, gl[internalFormat], gl[pixelFormat], gl[pixelType], bitmap);
            }
        }

        var width = gl.canvas.width;
        var halfWidth = Math.floor(width / 2);
        var height = gl.canvas.height;
        var halfHeight = Math.floor(height / 2);

        var top = flipY ? 0 : (height - halfHeight);
        var bottom = flipY ? (height - halfHeight) : 0;

        var tl = redColor;
        var tr = blackColor;
        var bl = greenColor;
        var br = blackColor;

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
            debug("Checking " + (flipY ? "top" : "bottom"));
            wtu.checkCanvasRect(gl, 0, bottom, halfWidth, halfHeight, tl, "shouldBe " + tl);
            wtu.checkCanvasRect(gl, halfWidth, bottom, halfWidth, halfHeight, tr, "shouldBe " + tr);
            debug("Checking " + (flipY ? "bottom" : "top"));
            wtu.checkCanvasRect(gl, 0, top, halfWidth, halfHeight, bl, "shouldBe " + bl);
            wtu.checkCanvasRect(gl, halfWidth, top, halfWidth, halfHeight, br, "shouldBe " + br);
        }
    }

    function runTest()
    {
        var program = tiu.setupTexturedQuad(gl, internalFormat);
        runTestOnBindingTarget(gl.TEXTURE_2D, program);
        program = tiu.setupTexturedQuadWithCubeMap(gl, internalFormat);
        runTestOnBindingTarget(gl.TEXTURE_CUBE_MAP, program);

        wtu.glErrorShouldBe(gl, gl.NO_ERROR, "should be no errors");
        finishTest();
    }

    function runTestOnBindingTarget(bindingTarget, program) {
        var cases = [
            { sub: false },
            { sub: true },
        ];

        for (var i in cases) {
            runOneIteration(cases[i].sub, bindingTarget, program, bitmaps.defaultOption, false);
            runOneIteration(cases[i].sub, bindingTarget, program, bitmaps.noFlipY, false);
            runOneIteration(cases[i].sub, bindingTarget, program, bitmaps.flipY, true);
        }
    }

    return init;
}
