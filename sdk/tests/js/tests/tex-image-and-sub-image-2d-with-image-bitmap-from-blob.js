/*
Copyright (c) 2019 The Khronos Group Inc.
Use of this source code is governed by an MIT-style license that can be
found in the LICENSE.txt file.
*/

function generateTest(internalFormat, pixelFormat, pixelType, prologue, resourcePath, defaultContextVersion) {
    var wtu = WebGLTestUtils;
    var tiu = TexImageUtils;
    var gl = null;
    var successfullyParsed = false;

    async function init()
    {
        description('Verify texImage2D and texSubImage2D code paths taking ImageBitmap created from a Blob (' + internalFormat + '/' + pixelFormat + '/' + pixelType + ')');

        if(!window.createImageBitmap || !window.ImageBitmap) {
            finishTest();
            return;
        }

        // Set the default context version while still allowing the webglVersion URL query string to override it.
        wtu.setDefault3DContextVersion(defaultContextVersion);
        gl = wtu.create3DContext("example");

        if (!prologue(gl)) {
            finishTest();
            return;
        }

        gl.clearColor(0,0,0,1);
        gl.clearDepth(1);

        fetch(resourcePath + "red-green-semi-transparent.png")
            .then(response => {
                if (!response.ok) {
                    throw new Error('Fetch of red-green-semi-transparent.png failed');
                }
                return response.blob();
            })
            .then(blob => {
                debug('*** Running tests against red-green-semi-transparent.png ***');
                return runImageBitmapTest(blob, 0.5, internalFormat, pixelFormat, pixelType, gl, tiu, wtu, false);
            })
            .then(() => {
                return fetch(resourcePath + "red-green-128x128-linear-profile.jpg");
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Fetch of red-green-128x128-linear-profile.jpg failed');
                }
                return response.blob();
            })
            .then(blob => {
                debug('*** Running tests against red-green-128x128-linear-profile.jpg ***');
                // This test requires a huge tolerance because browsers - at least currently - vary
                // widely in the colorspace conversion results for this image.
                let tolerance = 120;
                return runImageBitmapTest(blob, 1.0, internalFormat, pixelFormat, pixelType, gl, tiu, wtu, false, tolerance);
            })
            .then(() => {
                finishTest();
            });
    }

    return init;
}
