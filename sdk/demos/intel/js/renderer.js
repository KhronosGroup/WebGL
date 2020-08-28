/*
** Copyright (c) 2020 The Khronos Group Inc.
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

window.Renderer = (function () {
  "use strict";
  var VS = [
    "attribute vec3 position;",
    "attribute vec2 texCoord;",
    "varying vec2 vTexCoord;",

    "void main() {",
    "  vTexCoord = texCoord;",
    "  gl_Position = vec4( position, 1.0 );",
    "}",
  ].join("\n");

  var FS = [
    "precision mediump float;",
    "uniform mediump sampler2D diffuse;",
    "varying vec2 vTexCoord;",

    "void main() {",
    "  gl_FragColor = texture2D(diffuse, vTexCoord);",
    "}",
  ].join("\n");

  var WEBGLVideoTextureFS = [
    "#extension GL_WEBGL_video_texture : require",
    "precision mediump float;",
    "uniform mediump samplerVideoWEBGL diffuse;",
    "varying vec2 vTexCoord;",

    "void main() {",
    "  gl_FragColor = textureVideoWEBGL(diffuse, vTexCoord);",
    "}",
  ].join("\n");

  var Renderer = function (gl, enable_WEBGL_video_texture) {
    this.gl = gl;

    this.texture = gl.createTexture();
    this.program = gl.createProgram();

    this.enable_WEBGL_video_texture = enable_WEBGL_video_texture;

    // Create a vertex shader object
    var verts = [
      -1.0,  1.0, 0.0, 0.0, 0.0,// Top-left
      -1.0, -1.0, 0.0, 0.0, 1.0,// Bottom-left
      1.0, -1.0, 0.0, 1.0, 1.0,// Bottom-right
      1.0,  1.0, 0.0, 1.0, 0.0,// Top-right
    ];

    this.indices = [3, 2, 1, 3, 1, 0]

    this.vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // Create program object
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, VS);
    gl.compileShader(vertShader);

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (this.enable_WEBGL_video_texture ) {
      this.ext = gl.getExtension('WEBGL_video_texture');
      if (!this.ext) {
        console.log("WEBGL_video_texture not supported");
        return;
      }
      gl.shaderSource(fragShader, WEBGLVideoTextureFS);
    } else {
      gl.shaderSource(fragShader, FS);
    }
    gl.compileShader(fragShader);

    gl.attachShader(this.program, vertShader);
    gl.attachShader(this.program, fragShader);
    gl.linkProgram(this.program);

    this.videoElement = null;
  };

  Renderer.prototype.setVideo = function (url) {
    var gl = this.gl;
    var self = this;
    var using_WEBGL_video_texture = this.enable_WEBGL_video_texture;
    var ext = this.ext;

    return new Promise(function(resolve, reject) {
      var video = document.createElement('video');

      video.addEventListener('canplay', function() {
        // Added "click to play" UI?
      });

      video.addEventListener('playing', function() {
        self.videoElement = video;
        self.imgElement = null;

        if (!using_WEBGL_video_texture) {
          gl.bindTexture(gl.TEXTURE_2D, self.texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, self.videoElement);

          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        } else {
          if (this.ext !== null) {
            gl.bindTexture(ext.TEXTURE_VIDEO_IMAGE, self.texture);
            ext.shareVideoImageWEBGL(ext.TEXTURE_VIDEO_IMAGE, video);
            gl.bindTexture(ext.TEXTURE_VIDEO_IMAGE, null);
          }
        }

        resolve(self.videoElement);
      });

      video.addEventListener('error', function(ev) {
        console.log(video.error);
        reject(video.error);
      }, false);

      video.loop = true;
      video.autoplay = true;
      video.muted = true;
      video.crossOrigin = 'anonymous';
      video.setAttribute('webkit-playsinline', '');
      video.src = url;
      var btn = document.createElement("BUTTON");
      var t = document.createTextNode("CLICK ME");
      btn.style.position = "absolute";
      btn.style.zIndex = "999";
      btn.style.left = "80";
      btn.onclick = function() {
        video.play();
      }
      btn.appendChild(t);
      document.body.appendChild(btn);
    });
  };

  Renderer.prototype.play = function() {
    if (this.videoElement)
      this.videoElement.play();
  };

  Renderer.prototype.pause = function() {
    if (this.videoElement)
      this.videoElement.pause();
  };

  Renderer.prototype.isPaused = function() {
    if (this.videoElement)
      return this.videoElement.paused;
    return false;
  };

  Renderer.prototype.render = function (width, height) {
    var gl = this.gl;
    var program = this.program;
    var using_WEBGL_video_texture = this.enable_WEBGL_video_texture;
    var ext = this.ext;

    if (!this.videoElement)
      return;

    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);

    var position = gl.getAttribLocation(this.program, "position");
    var texCoord = gl.getAttribLocation(this.program, "texCoord");

    gl.enableVertexAttribArray(position);
    gl.enableVertexAttribArray(texCoord);

    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, 20, 12);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    gl.activeTexture(gl.TEXTURE0);
    var diffuse = gl.getUniformLocation(this.program, "diffuse");
    gl.uniform1i(diffuse, 0);

    if (!using_WEBGL_video_texture) {
      gl.bindTexture(gl.TEXTURE_2D, this.texture);

      if (this.videoElement && !this.videoElement.paused) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.videoElement);
      }
    } else {
      gl.bindTexture(ext.TEXTURE_VIDEO_IMAGE, this.texture);

      if (this.videoElement && !this.videoElement.paused && this.ext !== null) {
        ext.shareVideoImageWEBGL(ext.TEXTURE_VIDEO_IMAGE, this.videoElement);
      }
    }

    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

    ext.releaseVideoImageWEBGL(ext.TEXTURE_VIDEO_IMAGE_WEBGL);
  };

  return Renderer;
})();
