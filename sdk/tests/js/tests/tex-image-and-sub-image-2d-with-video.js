/*
Copyright (c) 2019 The Khronos Group Inc.
Use of this source code is governed by an MIT-style license that can be
found in the LICENSE.txt file.
*/

// This block needs to be outside the onload handler in order for this
// test to run reliably in WebKit's test harness (at least the
// Chromium port). https://bugs.webkit.org/show_bug.cgi?id=87448
initTestingHarness();

var old = debug;
var debug = function(msg) {
  bufferedLogToConsole(msg);
  old(msg);
};

function generateTest(internalFormat, pixelFormat, pixelType, prologue, resourcePath, defaultContextVersion) {
    var wtu = WebGLTestUtils;
    var tiu = TexImageUtils;
    var gl = null;
    var successfullyParsed = false;

    // Test each format separately because many browsers implement each
    // differently. Some might be GPU accelerated, some might not. Etc...
    var videos = [
      { src: resourcePath + "red-green.mp4"           , type: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"', },
      { src: resourcePath + "red-green.webmvp8.webm"  , type: 'video/webm; codecs="vp8, vorbis"',           },
      { src: resourcePath + "red-green.bt601.vp9.webm", type: 'video/webm; codecs="vp9"',                   },
    ];

    function init()
    {
        description('Verify texImage2D and texSubImage2D code paths taking video elements (' + internalFormat + '/' + pixelFormat + '/' + pixelType + ')');

        // Set the default context version while still allowing the webglVersion URL query string to override it.
        wtu.setDefault3DContextVersion(defaultContextVersion);
        gl = wtu.create3DContext("example");

        if (!prologue(gl)) {
            finishTest();
            return;
        }

        gl.clearColor(0,0,0,1);
        gl.clearDepth(1);

        runTest();
    }

    function runOneIteration(videoElement, unpackColorSpace, useTexSubImage2D, flipY, topColorName, bottomColorName, sourceSubRectangle, program, bindingTarget)
    {
        sourceSubRectangleString = '';
        if (sourceSubRectangle) {
            sourceSubRectangleString = ' sourceSubRectangle=' + sourceSubRectangle;
        }
        unpackColorSpaceString = '';
        if (unpackColorSpace) {
            unpackColorSpaceString = ' unpackColorSpace=' + unpackColorSpace;
        }
        debug('Testing ' + (useTexSubImage2D ? 'texSubImage2D' : 'texImage2D') +
              ' with flipY=' + flipY + ' bindingTarget=' +
              (bindingTarget == gl.TEXTURE_2D ? 'TEXTURE_2D' : 'TEXTURE_CUBE_MAP') +
              sourceSubRectangleString + unpackColorSpaceString);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Disable any writes to the alpha channel
        gl.colorMask(1, 1, 1, 0);
        var texture = gl.createTexture();
        // Bind the texture to texture unit 0
        gl.bindTexture(bindingTarget, texture);
        // Set up texture parameters
        gl.texParameteri(bindingTarget, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(bindingTarget, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(bindingTarget, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(bindingTarget, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // Set up pixel store parameters
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        var targets = [gl.TEXTURE_2D];
        if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
            targets = [gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                       gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                       gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                       gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                       gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                       gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];
        }
        // Handle target color space.
        if (unpackColorSpace) {
          gl.unpackColorSpace = unpackColorSpace;
        }
        // Handle the source sub-rectangle if specified (WebGL 2.0 only)
        if (sourceSubRectangle) {
            gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, sourceSubRectangle[0]);
            gl.pixelStorei(gl.UNPACK_SKIP_ROWS, sourceSubRectangle[1]);
        }
        // Upload the videoElement into the texture
        for (var tt = 0; tt < targets.length; ++tt) {
            if (sourceSubRectangle) {
                // Initialize the texture to black first
                if (useTexSubImage2D) {
                    // Skip sub-rectangle tests for cube map textures for the moment.
                    if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
                        continue;
                    }
                    gl.texImage2D(targets[tt], 0, gl[internalFormat],
                                  sourceSubRectangle[2], sourceSubRectangle[3], 0,
                                  gl[pixelFormat], gl[pixelType], null);
                    gl.texSubImage2D(targets[tt], 0, 0, 0,
                                     sourceSubRectangle[2], sourceSubRectangle[3],
                                     gl[pixelFormat], gl[pixelType], videoElement);
                } else {
                    gl.texImage2D(targets[tt], 0, gl[internalFormat],
                                  sourceSubRectangle[2], sourceSubRectangle[3], 0,
                                  gl[pixelFormat], gl[pixelType], videoElement);
                }
            } else {
                // Initialize the texture to black first
                if (useTexSubImage2D) {
                    var width = videoElement.videoWidth;
                    var height = videoElement.videoHeight;
                    if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
                        // cube map texture must be square.
                        width = Math.max(width, height);
                        height = width;
                    }
                    gl.texImage2D(targets[tt], 0, gl[internalFormat],
                                  width, height, 0,
                                  gl[pixelFormat], gl[pixelType], null);
                    gl.texSubImage2D(targets[tt], 0, 0, 0, gl[pixelFormat], gl[pixelType], videoElement);
                } else {
                    gl.texImage2D(targets[tt], 0, gl[internalFormat], gl[pixelFormat], gl[pixelType], videoElement);
                }
            }
        }

        if (sourceSubRectangle) {
            gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0);
            gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
        }

        var c = document.createElement("canvas");
        c.width = 16;
        c.height = 16;
        c.style.border = "1px solid black";
        var ctx = c.getContext("2d");
        ctx.drawImage(videoElement, 0, 0, 16, 16);
        document.body.appendChild(c);

        var loc;
        if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
            loc = gl.getUniformLocation(program, "face");
        }

        // Compute the test colors. This test only tests RGB (not A).
        const topColor = wtu.colorAsSampledWithInternalFormat(
            wtu.namedColorInColorSpace(topColorName, unpackColorSpace),
            internalFormat).slice(0, 3);
        const bottomColor = wtu.colorAsSampledWithInternalFormat(
            wtu.namedColorInColorSpace(bottomColorName, unpackColorSpace),
            internalFormat).slice(0, 3);
        for (var tt = 0; tt < targets.length; ++tt) {
            if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
                gl.uniform1i(loc, targets[tt]);
            }
            // Draw the triangles
            wtu.clearAndDrawUnitQuad(gl, [0, 0, 0, 255]);
            // Check a few pixels near the top and bottom and make sure they have
            // the right color.
            const tolerance = Math.max(6, tiu.tolerance(internalFormat, pixelFormat, pixelType));
            debug("Checking lower left corner");
            wtu.checkCanvasRect(gl, 4, 4, 2, 2, bottomColor,
                                "shouldBe " + bottomColor, tolerance);
            debug("Checking upper left corner");
            wtu.checkCanvasRect(gl, 4, gl.canvas.height - 8, 2, 2, topColor,
                                "shouldBe " + topColor, tolerance);
        }
    }

    function runTest(videoElement)
    {
        var cases = [
            { sub: false, flipY: true, topColor: 'Red', bottomColor: 'Green' },
            { sub: false, flipY: false, topColor: 'Green', bottomColor: 'Red' },
            { sub: true, flipY: true, topColor: 'Red', bottomColor: 'Green' },
            { sub: true, flipY: false, topColor: 'Green', bottomColor: 'Red' },
        ];

        if (wtu.getDefault3DContextVersion() > 1) {
            cases = cases.concat([
                { sub: false, flipY: false, topColor: 'Red', bottomColor: 'Red',
                  sourceSubRectangle: [20, 16, 40, 32] },
                { sub: false, flipY: true, topColor: 'Green', bottomColor: 'Green',
                  sourceSubRectangle: [20, 16, 40, 32] },
                { sub: false, flipY: false, topColor: 'Green', bottomColor: 'Green',
                  sourceSubRectangle: [20, 80, 40, 32] },
                { sub: false, flipY: true, topColor: 'Red', bottomColor: 'Red',
                  sourceSubRectangle: [20, 80, 40, 32] },
                { sub: true, flipY: false, topColor: 'Red', bottomColor: 'Red',
                  sourceSubRectangle: [20, 16, 40, 32] },
                { sub: true, flipY: true, topColor: 'Green', bottomColor: 'Green',
                  sourceSubRectangle: [20, 16, 40, 32] },
                { sub: true, flipY: false, topColor: 'Green', bottomColor: 'Green',
                  sourceSubRectangle: [20, 80, 40, 32] },
                { sub: true, flipY: true, topColor: 'Red', bottomColor: 'Red',
                  sourceSubRectangle: [20, 80, 40, 32] },
            ]);
        }

        cases = tiu.crossProductTestCasesWithUnpackColorSpaces(
            cases, tiu.unpackColorSpacesToTest(gl));

        async function runTexImageTest(bindingTarget) {
            var program;
            if (bindingTarget == gl.TEXTURE_2D) {
                program = tiu.setupTexturedQuad(gl, internalFormat);
            } else {
                program = tiu.setupTexturedQuadWithCubeMap(gl, internalFormat);
            }

            for (const info of videos) {
                debug("");
                debug("testing: " + JSON.stringify({
                    type: info.type,
                    bindingTarget: wtu.glEnumToString(gl, bindingTarget),
                }));

                const video = await loadVideo(info);
                if (!video) continue;

                try {
                    document.body.appendChild(video);
                    video.type = info.type;
                    video.src = info.src;

                    await wtu.waitVideoUploadable(video);

                    await testVideo(video);
                } finally {
                    video.pause();
                }
            }

            async function loadVideo(info) {
                const video = document.createElement("video");
                video.muted = true;
                if (!video.canPlayType) {
                    testFailed("video.canPlayType required method missing");
                    return null;
                }

                if(!video.canPlayType(info.type).replace(/no/, '')) {
                    debug(info.type + " unsupported");
                    return null;
                }

                return video;
            }

            async function testVideo(video) {
                await wtu.dispatchPromise();
                for (var i in cases) {
                    if (bindingTarget == gl.TEXTURE_CUBE_MAP) {
                        // Cube map texture must be square but video is not square.
                        if (!cases[i].sub) {
                            break;
                        }
                        // Skip sub-rectangle tests for cube map textures for the moment.
                        if (cases[i].sourceSubRectangle) {
                            break;
                        }
                    }
                    runOneIteration(video, cases[i].unpackColorSpace, cases[i].sub, cases[i].flipY,
                                    cases[i].topColor,
                                    cases[i].bottomColor,
                                    cases[i].sourceSubRectangle,
                                    program, bindingTarget);
                }
            }
        }

        call(async () => {
            await runTexImageTest(gl.TEXTURE_2D);
            await runTexImageTest(gl.TEXTURE_CUBE_MAP);
            wtu.glErrorShouldBe(gl, gl.NO_ERROR, "should be no errors");
            finishTest();
        });
    }

    return init;
}
