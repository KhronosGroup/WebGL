/*
** Copyright (c) 2016 The Khronos Group Inc.
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
    var halfRedColor = [128, 0, 0];
    var halfGreenColor = [0, 128, 0];
    var redColor = [255, 0, 0];
    var greenColor = [0, 255, 0];
    var bitmaps = [];

    function init()
    {
        description('Verify texImage3D and texSubImage3D code paths taking ImageBitmap created from an HTMLImageElement (' + internalFormat + '/' + pixelFormat + '/' + pixelType + ')');

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

        var image = new Image();
        image.onload = function() {
            var p1 = createImageBitmap(image, {imageOrientation: "none", premultiplyAlpha: "default"}).then(function(imageBitmap) { bitmaps.noFlipYPremul = imageBitmap });
            var p2 = createImageBitmap(image, {imageOrientation: "none", premultiplyAlpha: "none"}).then(function(imageBitmap) { bitmaps.noFlipYUnpremul = imageBitmap });
            var p3 = createImageBitmap(image, {imageOrientation: "flipY", premultiplyAlpha: "default"}).then(function(imageBitmap) { bitmaps.flipYPremul = imageBitmap });
            var p4 = createImageBitmap(image, {imageOrientation: "flipY", premultiplyAlpha: "none"}).then(function(imageBitmap) { bitmaps.flipYUnpremul = imageBitmap });
            Promise.all([p1, p2, p3, p4]).then(function() {
                runTest();
            }, function() {
                // createImageBitmap with options could be rejected if it is not supported
                finishTest();
                return;
            });
        }
        image.src = resourcePath + "red-green-semi-transparent.png";
    }

    function runOneIteration(bindingTarget, program, bitmap, flipY, premultiplyAlpha)
    {
        debug('Testing ' + + ' with flipY=' + flipY + ' and premultiplyAlpha=' + premultiplyAlpha +
              ', bindingTarget=' + (bindingTarget == gl.TEXTURE_3D ? 'TEXTURE_3D' : 'TEXTURE_2D_ARRAY'));
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Enable writes to the RGBA channels
        gl.colorMask(1, 1, 1, 0);
        var texture = gl.createTexture();
        // Bind the texture to texture unit 0
        gl.bindTexture(bindingTarget, texture);
        // Set up texture parameters
        gl.texParameteri(bindingTarget, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(bindingTarget, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Upload the image into the texture
        gl.texImage3D(bindingTarget, 0, gl[internalFormat], bitmap.width, bitmap.height, 1 /* depth */, 0,
                      gl[pixelFormat], gl[pixelType], null);
        gl.texSubImage3D(bindingTarget, 0, 0, 0, 0, gl[pixelFormat], gl[pixelType], bitmap);

        var width = gl.canvas.width;
        var halfWidth = Math.floor(width / 2);
        var quaterWidth = Math.floor(halfWidth / 2);
        var height = gl.canvas.height;
        var halfHeight = Math.floor(height / 2);
        var quaterHeight = Math.floor(halfHeight / 2);

        var top = flipY ? quaterHeight : (height - halfHeight + quaterHeight);
        var bottom = flipY ? (height - halfHeight + quaterHeight) : quaterHeight;

        var tl = redColor;
        var tr = premultiplyAlpha ? halfRedColor : redColor;
        var bl = greenColor;
        var br = premultiplyAlpha ? halfGreenColor : greenColor;

        // Draw the triangles
        wtu.clearAndDrawUnitQuad(gl, [0, 0, 0, 255]);

        // Check a few pixels near the top and bottom and make sure they have
        // the right color.
        var tolerance = 8;
        debug("Checking " + (flipY ? "top" : "bottom"));
        wtu.checkCanvasRect(gl, quaterWidth, bottom, 2, 2, tl, "shouldBe " + tl);
        wtu.checkCanvasRect(gl, halfWidth + quaterWidth, bottom, 2, 2, tr, "shouldBe " + tr, tolerance);
        debug("Checking " + (flipY ? "bottom" : "top"));
        wtu.checkCanvasRect(gl, quaterWidth, top, 2, 2, bl, "shouldBe " + bl);
        wtu.checkCanvasRect(gl, halfWidth + quaterWidth, top, 2, 2, br, "shouldBe " + br, tolerance);
    }

    function runTest()
    {
        var program = tiu.setupTexturedQuadWith3D(gl, internalFormat);
        runTestOnBindingTarget(gl.TEXTURE_3D, program);
        program = tiu.setupTexturedQuadWith2DArray(gl, internalFormat);
        runTestOnBindingTarget(gl.TEXTURE_2D_ARRAY, program);

        wtu.glErrorShouldBe(gl, gl.NO_ERROR, "should be no errors");
        finishTest();
    }

    function runTestOnBindingTarget(bindingTarget, program) {
        runOneIteration(bindingTarget, program, bitmaps.noFlipYPremul, false, true);
        runOneIteration(bindingTarget, program, bitmaps.noFlipYUnpremul, false, false);
        runOneIteration(bindingTarget, program, bitmaps.flipYPremul, true, true);
        runOneIteration(bindingTarget, program, bitmaps.flipYUnpremul, true, false);
    }

    return init;
}
