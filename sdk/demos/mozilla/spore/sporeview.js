/* -*- Mode: js2; js2-basic-offset: 2; indent-tabs-mode: nil; tab-width: 40; -*- */

/*
 Copyright (c) 2009  Mozilla Corporation

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/

var shaders = { };
var vertexBuffers = { };

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript)
        return null;

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3)
            str += k.textContent;
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderi(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function flipImage(img) {
  var tmpcanvas = document.createElement("canvas");
  tmpcanvas.width = img.width;
  tmpcanvas.height = img.height;
  var cx = tmpcanvas.getContext("2d");
  cx.globalCompositeMode = "copy";
  cx.translate(0, img.height);
  cx.scale(1, -1);
  cx.drawImage(img, 0, 0);
  return tmpcanvas;
}

var sf = null;

function renderStart() {
  var canvas = document.getElementById("canvas");
  var gl = null;
  try { 
    if (!gl)
      gl = canvas.getContext("moz-webgl");
  } catch (e) { }
  try { 
    if (!gl)
      gl = canvas.getContext("webkit-3d");
  } catch (e) { }

  if (!gl) {
    alert("Can't find a WebGL context; is it enabled?");
    return;
  }

  if (!WebGLFloatArray) {
    alert("Please update to a newer Firefox nightly to pick up some WebGL API changes!");
    throw "Need newer nightly.";
  }

  if (!("sp" in shaders)) {
    shaders.fs = getShader(gl, "shader-fs");
    shaders.vs = getShader(gl, "shader-vs");

    shaders.sp = gl.createProgram();
    gl.attachShader(shaders.sp, shaders.vs);
    gl.attachShader(shaders.sp, shaders.fs);
    gl.linkProgram(shaders.sp);

    if (!gl.getProgrami(shaders.sp, gl.LINK_STATUS)) {
      alert(gl.getProgramInfoLog(shader));
    }

    gl.useProgram(shaders.sp);
  }

  var sp = shaders.sp;

  var va = gl.getAttribLocation(sp, "aVertex");
  var na = gl.getAttribLocation(sp, "aNormal");
  var ta = gl.getAttribLocation(sp, "aTexCoord0");

  var mvUniform = gl.getUniformLocation(sp, "uMVMatrix");
  var pmUniform = gl.getUniformLocation(sp, "uPMatrix");
  var tex0Uniform = gl.getUniformLocation(sp, "uTexture0");

  var viewPositionUniform = gl.getUniformLocation(sp, "uViewPosition");
  var colorUniform = gl.getUniformLocation(sp, "uColor");

  gl.uniform4fv(colorUniform, new WebGLFloatArray([0.1, 0.2, 0.4, 1.0]));

  var pmMatrix = makePerspective(60, 1, 0.1, 100);
  //var pmMatrix = makePerspective(90, 1, 0.01, 10000);
  //var pmMatrix = makeOrtho(-20,20,-20,20, 0.01, 10000);

  var vpos = [0, 0, 0];

  var mvMatrixStack = [];
  var mvMatrix = Matrix.I(4);

  function pushMatrix(m) {
    if (m) {
      mvMatrixStack.push(m.dup());
      mvMatrix = m.dup();
    } else {
      mvMatrixStack.push(mvMatrix.dup());
    }
  }

  function popMatrix() {
    if (mvMatrixStack.length == 0)
      throw "Invalid popMatrix!";
    mvMatrix = mvMatrixStack.pop();
    return mvMatrix;
  }

  function multMatrix(m) {
    //console.log("mult", m.flatten());
    mvMatrix = mvMatrix.x(m);
  }

  function setMatrixUniforms() {
    gl.uniformMatrix4fv(mvUniform, false, new WebGLFloatArray(mvMatrix.flatten()));
    gl.uniformMatrix4fv(pmUniform, false, new WebGLFloatArray(pmMatrix.flatten()));
    gl.uniform3fv(viewPositionUniform, new WebGLFloatArray(vpos));
/*
    console.log("mv", mvMatrix.flatten());
    console.log("pm", pmMatrix.flatten());
    console.log("nm", N.flatten());
*/
  }

  function mvTranslate(v) {
    var m = Matrix.Translation($V([v[0],v[1],v[2]])).ensure4x4();
    multMatrix(m);
  }

  function mvRotate(ang, v) {
    var arad = ang * Math.PI / 180.0;
    var m = Matrix.Rotation(arad, $V([v[0], v[1], v[2]])).ensure4x4();
    multMatrix(m);
  }

  function mvScale(v) {
    var m = Matrix.Diagonal([v[0], v[1], v[2], 1]);
    multMatrix(m);
  }

  function mvInvert() {
    mvMatrix = mvMatrix.inv();
  }

  // set up the vbos
  var buffers = { };
  buffers.position = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, new WebGLFloatArray(sf.mesh.position), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(va, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(va);

  if (na != -1) {
    buffers.normal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.bufferData(gl.ARRAY_BUFFER, new WebGLFloatArray(sf.mesh.normal), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(na, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(na);
  }

  if (ta != -1) {
    buffers.texcoord = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texcoord);
    gl.bufferData(gl.ARRAY_BUFFER, new WebGLFloatArray(sf.mesh.texcoord), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texcoord);
    gl.vertexAttribPointer(ta, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(ta);
  }

  var numVertexPoints = sf.mesh.position.length / 3;

  // done with the raw js arrays, nuke them to free up some memory
  delete sf.mesh.position;
  delete sf.mesh.normal;
  delete sf.mesh.texcoord;

  var texturesBound = false;

  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  if (gl.clearDepthf) {
    alert("Please update to a newer Firefox nightly, to pick up some WebGL API changes");
    gl.clearDepthf(1.0);
  } else {
    gl.clearDepth(1.0);
  }
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  /*
  multMatrix(makeLookAt(vpos[0], vpos[1], vpos[2], 0, 0, 0, 0, 1, 0));
  mvTranslate([16.9485,11.1548,18.486]);
  mvRotate(45.2, [0, 1, 0]);
  mvRotate(-28.2, [1, 0, 0]);
  mvInvert();

  vpos = [-16.9485,-11.1548,-18.486];
*/

  var bbox = sf.mesh.bbox;

  var midx = (bbox.min.x + bbox.max.x) / 2;
  var midy = (bbox.min.y + bbox.max.y) / 2;
  var midz = (bbox.min.z + bbox.max.z) / 2;

  var maxdim = bbox.max.x - bbox.min.x;
  maxdim = Math.max(maxdim, bbox.max.y - bbox.min.y);
  maxdim = Math.max(maxdim, bbox.max.z - bbox.min.z);

  var m = makeLookAt(midx,midz,midy-(maxdim*1.5),
                     midx,midz,midy,
                     0,1,0);

  //m = makeLookAt(15, 75, -75, 0,0,0, 0,1,0);
  multMatrix(m);
  mvRotate(90,[1,0,0]);
  mvScale([1,1,-1]);

  var currentRotation = 0;

  function draw() {
    pushMatrix();
    mvRotate(currentRotation,[0,0,1]);

    setMatrixUniforms();

    // the texture might still be loading
    if (!texturesBound) {
      if (sf.textures.diffuse) {
          if (sf.textures.diffuse.complete) {
            if (sf.textures.diffuse.width > 0 && sf.textures.diffuse.height > 0) {
              // the texture is ready for binding
              var texid = gl.createTexture();
              gl.activeTexture(gl.TEXTURE0);
              gl.bindTexture(gl.TEXTURE_2D, texid);
              // XXX we should be able to just pass TRUE to flipY for texImage2D here,
              // but we don't support that yet
              gl.texImage2D(gl.TEXTURE_2D, 0, flipImage(sf.textures.diffuse));
              gl.generateMipmap(gl.TEXTURE_2D);

              gl.uniform1i(tex0Uniform, 0);

              gl.enable(gl.TEXTURING);
              gl.enable(gl.TEXTURE_2D);
            }

            texturesBound = true;
          }
      } else {
        texturesBound = true;
      }
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, numVertexPoints);

    popMatrix();
  }

  draw();

  if (!sf.textures.diffuse.complete) {
    sf.textures.diffuse.onload = draw;
  }

  var mouseDown = false;
  var lastX = 0;

  canvas.addEventListener("mousedown", function(ev) {
                            mouseDown = true;
                            lastX = ev.screenX;
                            return true;
                          }, false);

  canvas.addEventListener("mousemove", function(ev) {
                            if (!mouseDown)
                              return false;
                            var mdelta = ev.screenX - lastX;
                            lastX = ev.screenX;
                            currentRotation -= mdelta;
                            while (currentRotation < 0)
                              currentRotation += 360;
                            if (currentRotation >= 360)
                              currentRotation = currentRotation % 360;

                            draw();
                            return true;
                          }, false);

  canvas.addEventListener("mouseup", function(ev) {
                            mouseDown = false;
                          }, false);
}

function handleLoad() {
  sf = new SporeFile();
  sf._loadHandler = renderStart;
  sf.load("creatures/Amahani.dae");
}

window.addEventListener("load", handleLoad, false);
