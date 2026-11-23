/*
Copyright (c) 2020 The Khronos Group Inc.
Use of this source code is governed by an MIT-style license that can be
found in the LICENSE.txt file.
*/

let webgl_webcodecs_test_context_ = null;

function setTestMode(webgl_webcodecs_test_context) {
    webgl_webcodecs_test_context_ = webgl_webcodecs_test_context;
}

function requestWebGLVideoFrameHandler(canvas) {
    let gl = canvas.getContext('webgl');
    if (!gl) {
        console.log("<h1>Unable to initialize WebGL. Your browser or machine may not support it.</h1>");
        return null;
    }
    let ext = gl.getExtension('WEBGL_webcodecs_video_frame');
    if (!ext) {
        console.log("<h1>Unable to initialize WEBGL_webcodecs_video_frame. Your browser or machine may not support it.</h1>");
        return null;
    }

    // This helper function generates the required GLSL extension for the video frame.
    function emitRequiredExtension(videoFrameHandle) {
        if (videoFrameHandle.requiredExtension !== null) {
            let str = "";
            str += "#extension ";
            str += videoFrameHandle.requiredExtension;
            str += " : require\n";
            return str;
        }
        return "";
    }

    // This helper function generates GLSL uniform declarations for the video frame.
    // Mainly the logic varies according to the pixel format of video frame.
    //
    // ABGR
    // uniform sampler ${name}_0;
    //
    // NV12
    // uniform samplerExternalOES ${name}_0;
    // uniform samplerExternalOES ${name}_1;
    //
    //  I420
    // uniform samplerExternalOES ${name}_0;
    // uniform samplerExternalOES ${name}_1;
    // uniform samplerExternalOES ${name}_2;
    function emitSamplerDeclaration(videoFrameHandle, name) {
        const infoArray = videoFrameHandle.textureInfoArray;
        let str = "";
        for (let i = 0; i < infoArray.length; ++i) {
            str += "uniform " + infoArray[i].samplerType + " _" + name + "_"
                + i.toString() + "_;\n";
        }
        return str;
    }

    // This helper function generates GLSL samplers to access video frame.
    //
    // ABGR
    // ${out}.rgb = texture2D(${name}_0, ${texCoord}).rgb;
    //
    // NV12
    // ${out}.r = texture2D(${name}_0, ${texCoord}).r;
    // ${out}.gb = texture2D(${name}_1, ${texCoord}).rg;
    //
    // I420
    // ${out}.r = texture2D(${name}_0, ${texCoord}).r;
    // ${out}.g = texture2D(${name}_1, ${texCoord}).r;
    // ${out}.b = texture2D(${name}_2, ${texCoord}).r;
    function emitSamplerBody(videoFrameHandle, name, texCoord, out) {
        let components = [];
        components["ABGR"] = ["rgb"];
        components["XRGB"] = ["rgba"];
        components["NV12"] = ["r", "gb"];
        components["I420"] = ["r", "g", "b"];
        const format = videoFrameHandle.pixelFormat;
        const infoArray = videoFrameHandle.textureInfoArray;
        let str = "  vec4 " + out + ";\n";
        for (let i = 0; i < infoArray.length; ++i) {
            str += "  " + out + "." + components[format][i] + " = " + infoArray[i].samplerFunc
                + "(" + "_" + name + "_" + i.toString() + "_, "
                + texCoord + ")." + infoArray[i].components + ";\n";
        }
        return str;
    }

    function emitUnPremultiplyAlpha(videoFrameHandle, pixel) {
        let str = "";
        if (videoFrameHandle.premultipliedAlpha) {
            str += "  if (" + pixel + ".a > 0.0) " + pixel + ".rgb /= " + pixel + ".a;\n";
        }
        return str;
    }

    function emitPremultiplyAlpha(videoFrameHandle, pixel) {
        let str = "";
        if (videoFrameHandle.premultipliedAlpha) {
            str += "  " + pixel + ".rgb *= " + pixel + ".a;\n";
        } else {
            str += "  " + pixel + ".a = 1.0;\n";
        }
        return str;
    }

    function loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function initShaderProgram(gl, vsSource, fsSource) {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.log('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    }

    // Computes a signature for the video frame to determine whether we need to
    // re-compile GLSL shader to access it.
    function generateSignature(videoFrameHandle) {
        let signature = "";

        signature += "{requiredExtension: " + videoFrameHandle.requiredExtension + "}\n";
        signature += "{pixelFormat: " + videoFrameHandle.pixelFormat + "}\n";
        const cs = videoFrameHandle.colorSpace;
        signature += "{ColorSpace:\n  {";
        signature += "primary: " + cs.primaryID + ",";
        signature += "transfer: " + cs.transferID + ",";
        signature += "matrix: " + cs.matrixID + ",";
        signature += "range: " + cs.rangeID;
        signature += "}\n";
        signature += "}\n";

        signature += "{flipY: " + videoFrameHandle.flipY + "}\n";
        signature += "{preAlpha: " + videoFrameHandle.premultipliedAlpha + "}\n";

        signature += "{\n";
        const infoArray = videoFrameHandle.textureInfoArray;
        for (let i = 0; i < infoArray.length; ++i) {
            signature += "  { " + i.toString() + ": " + infoArray[i].samplerType
                + ", " + infoArray[i].samplerFunc + ", "
                + infoArray[i].components + "}\n";
        }
        signature += "}\n";
        return signature;
    }


    function bindVideoFrame(gl, program, videoFrameHandle, texUnit, name) {
        const infoArray = videoFrameHandle.textureInfoArray;
        for (let i = 0; i < infoArray.length; ++i) {
            gl.activeTexture(texUnit + i);
            gl.bindTexture(infoArray[i].target, infoArray[i].texture);
            gl.texParameteri(infoArray[i].target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            const uniformName = "_" + name + "_" + i.toString() + "_";
            gl.uniform1i(gl.getUniformLocation(program, uniformName), i);
        }
    }

    function unbindVideoFrame(gl, videoFrameHandle, texUnit) {
        const infoArray = videoFrameHandle.textureInfoArray;
        for (let i = 0; i < infoArray.length; ++i) {
            gl.activeTexture(texUnit + i);
            gl.bindTexture(infoArray[i].target, null);
        }
    }

    function initVertexBuffers(gl, program, videoFrame, posAttrib, coordAttrib) {
        const vertices = new Float32Array([
            -1.0, -1.0, 1.0, -1.0, 1.0, 1.0,
            -1.0, -1.0, 1.0, 1.0, -1.0, 1.0
        ]);
        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const pos = gl.getAttribLocation(program, posAttrib);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pos);

        const coords = new Float32Array([
            0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
            0.0, 0.0, 1.0, 1.0, 0.0, 1.0
        ]);

        const coordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, coordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, coords, gl.STATIC_DRAW);

        const coord = gl.getAttribLocation(program, coordAttrib);
        gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(coord);
    }

    function prepareProgram(gl, videoFrame, videoFrameHandle, samplerName) {
        const newSignature = generateSignature(videoFrameHandle);
        if (program !== null && newSignature === signature)
            return;
        signature = newSignature;

        const vSource = `
    attribute vec2 aVertexPosition;
    attribute vec2 aTexCoord;
    uniform vec4 uTexTransform;
    varying mediump vec2 vTexCoord;
    void main(void) {
      gl_Position = vec4(aVertexPosition, 0.0, 1.0);
      vTexCoord = aTexCoord * uTexTransform.zw + uTexTransform.xy;
    }
  `;


        const fSource =
            emitRequiredExtension(videoFrameHandle) +
            "precision mediump float;\n" +
            "varying mediump vec2 vTexCoord;\n" +
            emitSamplerDeclaration(videoFrameHandle, samplerName) +
            videoFrameHandle.colorConversionShaderFunc +
            "void main() {\n" +
            emitSamplerBody(videoFrameHandle, samplerName, "vTexCoord", "pixel") +
            emitUnPremultiplyAlpha(videoFrameHandle, "pixel") +
            "  pixel.rgb = DoColorConversion(pixel.xyz);\n" +
            emitPremultiplyAlpha(videoFrameHandle, "pixel") +
            "  gl_FragColor = pixel;\n" +
            "}\n";

        program = initShaderProgram(gl, vSource, fSource);
        initVertexBuffers(gl, program, videoFrame, "aVertexPosition", "aTexCoord");
        const locTexTransform = gl.getUniformLocation(program, "uTexTransform");
        let transform = new Float32Array([0, 0, 1, 1]);
        if (videoFrameHandle.flipY) {
            transform[1] = 1 - transform[1];
            transform[3] = -transform[3];
        }

        // TODO: adjust visible rect.

        if (videoFrameHandle.textureInfoArray[0].samplerType === "sampler2DRect") {
            transform[0] *= videoFrame.codedWidth;
            transform[2] *= videoFrame.codedWidth;
            transform[1] *= videoFrame.codedHeight;
            transform[3] *= videoFrame.codedHeight;
        }
        gl.useProgram(program);
        gl.uniform4fv(locTexTransform, transform);
    }

    let ready_frames = [];
    let underflow = true;
    let time_base = 0;
    let program = null;
    let signature = null;

    function delay(time_ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, time_ms);
        });
    }

    function calculateTimeTillNextFrame(timestamp) {
        if (time_base == 0)
            time_base = performance.now();
        const media_time = performance.now() - time_base;
        return Math.max(0, (timestamp / 1000) - media_time);
    }

    async function renderFrame() {
        if (ready_frames.length == 0) {
            underflow = true;
            return;
        }
        const frame = ready_frames.shift();
        underflow = false;

        let videoFrameHandle = null;
        try {
            videoFrameHandle = ext.importVideoFrame(frame);
            if (webgl_webcodecs_test_context_ != null) {
                webgl_webcodecs_test_context_.testPassed("Import frame successfully.");
            }
        }
        catch (error) {
            if (webgl_webcodecs_test_context_ != null) {
                webgl_webcodecs_test_context_.testFailed("Failed to import Videoframe.");
                webgl_webcodecs_test_context_.finishTest();
            }
            console.log(error.message);
            return;
        }
        const samplerName = "aSampler";
        prepareProgram(gl, frame, videoFrameHandle, samplerName);
        bindVideoFrame(gl, program, videoFrameHandle, gl.TEXTURE0, samplerName);
        // Based on the frame's timestamp calculate how much of real time waiting
        // is needed before showing the next frame.
        const time_till_next_frame = calculateTimeTillNextFrame(frame.timestamp);
        await delay(time_till_next_frame);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (webgl_webcodecs_test_context_ != null) {
            webgl_webcodecs_test_context_.displayed_frame++;
            webgl_webcodecs_test_context_.isFramePixelMatched(gl);
        }
        unbindVideoFrame(gl, videoFrameHandle, gl.TEXTURE0);

        // Immediately schedule rendering of the next frame
        setTimeout(renderFrame, 0);
        ext.releaseVideoFrame(videoFrameHandle);
        frame.close();
        if (webgl_webcodecs_test_context_ != null && webgl_webcodecs_test_context_.displayed_frame
            == webgl_webcodecs_test_context_.maxFrameTested) {
            webgl_webcodecs_test_context_.finishTest();
        }
    }

    function handleFrame(frame) {
        if (webgl_webcodecs_test_context_ != null) {
            webgl_webcodecs_test_context_.testPassed("Decode frame successfully.");
        }
        ready_frames.push(frame);
        if (underflow) {
            underflow = false;
            setTimeout(renderFrame, 0);
        }
    }

    return handleFrame;
}
