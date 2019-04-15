/*
** Copyright (c) 2019 Intel Corporation
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

'use strict';

const VS = 0;
const FS = 1;
const CS_DEN_SIM = 2;
const CS_FOR_SIM = 3;
const CS_INT = 4;
const CS_DEN_SHA = 5;
const CS_FOR_SHA = 6;
const CS_BUILD_GRID = 7;
const CS_BITONIC_SORT = 8;
const CS_TRANSPOSE = 9;
const CS_CLEAR_GRID_IND = 10;
const CS_BUILD_GRID_IND = 11;
const CS_REARRANGE = 12;
const CS_DEN_GRID = 13;
const CS_FOR_GRID = 14;
const CS_INT_GRID = 15;

const BITONIC_BLOCK_SIZE = 512;
const TRANSPOSE_BLOCK_SIZE = 16;
const SIMULATION_BLOCK_SIZE = 256;
const NUM_GRID_INDICES = 65536;

let gNumParticles = 8 * 1024;
let gThreads = 256;
let gSimMode = 'simple';
let gDispatchNum = null;
let gCanvas = null;
let gl = null;
let gShaderStr = [];
let gPrograms = [];
let gParticleBuffers = [];
let gUpdateParams = null;
let gUpdateSortCB = [];

let gFInitialParticleSpacing = 0.0045;
let gMapHeight = 1.2;
let gMapWidth = (4.0 / 3.0) * gMapHeight;
let gSmoothlen = 0.012;
let gPressureStiffness = 200.0;
let gRestDensity = 1000.0;
let gParticleMass = 0.0002;
let gViscosity = 0.1;
let gWallStiffness = 3000.0;
let gGravityX = 0.0;
let gGravityY = -0.5;

let gViewProjection = new Matrix4x4();
let gPointSize = 0;

let gFPSCounter = null;
let gFpsElem = null;
let gScheduledRAF = false;

function loadShader(type, shaderSrc) {
  let shader = gl.createShader(type);
  // Load the shader source
  gl.shaderSource(shader, shaderSrc);
  // Compile the shader
  gl.compileShader(shader);
  // Check the compile status
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) &&
    !gl.isContextLost()) {
    let infoLog = gl.getShaderInfoLog(shader);
    alert('Error compiling shader:\n' + infoLog);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}


function getUrlString(name) {
  let reg = new RegExp('(^|&)'+ name +'=([^&]*)(&|$)');
  let r = window.location.search.substr(1).match(reg);
  if (r != null) {
    return unescape(r[2]);
  }
  return null;
}

function createElement(element, attribute, inner) {
  if (typeof(element) === 'undefined') {
    return false;
  }
  if (typeof(inner) === 'undefined') {
    inner = '';
  }
  let el = document.createElement(element);
  if (typeof(attribute) === 'object') {
    for (let key in attribute) {
      el.setAttribute(key, attribute[key]);
    }
  }
  if (!Array.isArray(inner)) {
    inner = [inner];
  }
  for (let k = 0; k < inner.length; k++) {
    if (inner[k].tagName) {
      el.appendChild(inner[k]);
    } else {
      el.appendChild(document.createTextNode(inner[k]));
    }
  }
  return el;
}

function initController() {
  let fpsContainer = createElement('div', {'class': 'fpsContainer'});
  document.body.appendChild(fpsContainer);
  let lableFps = createElement('label', {}, 'FPS: ');
  let sFps = createElement('span', {'id': 'fps'});
  fpsContainer.appendChild(lableFps);
  fpsContainer.appendChild(sFps);
  gFpsElem = document.getElementById('fps');

  let container = createElement('div', {'class': 'container'});
  document.body.appendChild(container);

  let tButton = createElement(
    'button',
    {
      'class': 'button',
      'onClick': 'resetParticles()',
    },
    'Reset Particles'
  );
  let dButton = createElement('div', {}, tButton);

  let option8k = createElement('option', {'value': '8', 'selected': 'selected'}, '8K Particles');
  let option16k = createElement('option', {'value': '16'}, '16K Particles');
  let option32k = createElement('option', {'value': '32'}, '32K Particles');
  let option64k = createElement('option', {'value': '64'}, '64K Particles');
  let tSelectP = createElement(
    'select',
    {'id': 'selP',
     'onchange': 'restart(this.value)'},
    [option8k, option16k, option32k, option64k]
  );
  let dSelectP = createElement('div', {}, tSelectP);

  let optionDown = createElement('option', {'value': 'down'}, 'Gravity Down');
  let optionUp = createElement('option', {'value': 'up'}, 'Gravity Up');
  let optionLeft = createElement('option', {'value': 'left'}, 'Gravity Left');
  let optionRight = createElement('option', {'value': 'right'}, 'Gravity Right');
  let tSelectG = createElement(
    'select',
    {'id': 'selG',
     'onchange': 'changeGravity(this.value)'},
    [optionDown, optionUp, optionLeft, optionRight]
  );
  let dSelectG = createElement('div', {}, tSelectG);

  let radioSimple = createElement('input',
    {'type': 'radio',
     'name': 'mode',
     'id': 'radio1',
     'value': 'simple',
     'onchange': 'changeMode(this.value)',
     'checked': 'checked'});
  let lableSimple = createElement('label', {}, 'Simple N^2');
  let dRadioSimple = createElement('div', {}, [radioSimple, lableSimple]);

  let radioShared = createElement('input',
    {'type': 'radio',
     'name': 'mode',
     'id': 'radio1',
     'onchange': 'changeMode(this.value)',
     'value': 'shared'});
  let lableShared = createElement('label', {}, 'Shared Memory N^2');
  let dRadioShared = createElement('div', {}, [radioShared, lableShared]);

  let radioGrid = createElement('input',
    {'type': 'radio',
     'name': 'mode',
     'id': 'radio1',
     'onchange': 'changeMode(this.value)',
     'value': 'grid'});
  let lableGrid = createElement('label', {}, 'Grid + Sort');
  let dRadioGrid = createElement('div', {}, [radioGrid, lableGrid]);

  container.appendChild(dButton);
  container.appendChild(dSelectP);
  container.appendChild(dSelectG);
  container.appendChild(dRadioSimple);
  container.appendChild(dRadioShared);
  container.appendChild(dRadioGrid);
}

function changeMode(o) {
  gSimMode = o;
  gFPSCounter.reset();
  gFpsElem.innerHTML = 'calculating frames per second...';
}

function changeGravity(g) {
  let data1 = new ArrayBuffer(8);
  let view1 = new Float32Array(data1);
  switch (g) {
    case 'up':
      gGravityX = view1[0] = 0.0;
      gGravityY = view1[1] = 0.5;
      break;
    case 'down':
      gGravityX = view1[0] = 0.0;
      gGravityY = view1[1] = -0.5;
      break;
    case 'left':
      gGravityX = view1[0] = -0.5;
      gGravityY = view1[1] = 0.0;
      break;
    case 'right':
      gGravityX = view1[0] = 0.5;
      gGravityY = view1[1] = 0.0;
      break;
  }

  gl.bindBuffer(gl.UNIFORM_BUFFER, gUpdateParams);
  gl.bufferSubData(gl.UNIFORM_BUFFER, 12*4, view1, 0);
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, gUpdateParams);
}

function resetParticles() {
  destroyBuffers();
  initBuffers();
  changeMode(gSimMode);
  initRender();
}

function restart(num) {
  gNumParticles = num * 1024;
  gDispatchNum = Math.ceil(gNumParticles / gThreads);
  resetParticles();
}

function gpuSort() {
  let NUM_ELEMENTS = gNumParticles;
  let MATRIX_WIDTH = BITONIC_BLOCK_SIZE;
  let MATRIX_HEIGHT = NUM_ELEMENTS / BITONIC_BLOCK_SIZE;

  // Sort the data
  // First sort the rows for the levels <= to the block size
  gl.bindBuffer(gl.UNIFORM_BUFFER, gUpdateSortCB[0]);
  for ( let level = 2; level <= BITONIC_BLOCK_SIZE; level <<= 1 ) {
    let sortCB = new Int32Array(4);
    sortCB[0] = level;
    sortCB[1] = level;
    sortCB[2] = MATRIX_HEIGHT;
    sortCB[3] = MATRIX_WIDTH;
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, sortCB, 0);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, gUpdateSortCB[0]);

    // Sort the row data
    computePass(CS_BITONIC_SORT, gNumParticles / BITONIC_BLOCK_SIZE, 1, 1);
  }

  // Then sort the rows and columns for the levels > than the block size
  // Transpose. Sort the Columns. Transpose. Sort the Rows.
  for ( let level = (BITONIC_BLOCK_SIZE << 1); level <= NUM_ELEMENTS; level <<= 1 ) {
    let sortCB1 = new Int32Array(4);
    sortCB1[0] = level / BITONIC_BLOCK_SIZE;
    sortCB1[1] = (level & ~NUM_ELEMENTS) / BITONIC_BLOCK_SIZE;
    sortCB1[2] = MATRIX_WIDTH;
    sortCB1[3] = MATRIX_HEIGHT;
    gl.bindBuffer(gl.UNIFORM_BUFFER, gUpdateSortCB[1]);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, sortCB1, 0);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, gUpdateSortCB[1]);

    // Transpose the data from buffer 1 into buffer 2
    computePass(CS_TRANSPOSE, MATRIX_WIDTH / TRANSPOSE_BLOCK_SIZE,
        MATRIX_HEIGHT / TRANSPOSE_BLOCK_SIZE, 1);

    // Sort the transposed column data
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, gParticleBuffers[4]);
    computePass(CS_BITONIC_SORT, gNumParticles / BITONIC_BLOCK_SIZE, 1, 1);

    let sortCB2 = new Int32Array(4);
    sortCB2[0] = BITONIC_BLOCK_SIZE;
    sortCB2[1] = level;
    sortCB2[2] = MATRIX_HEIGHT;
    sortCB2[3] = MATRIX_WIDTH;
    gl.bindBuffer(gl.UNIFORM_BUFFER, gUpdateSortCB[2]);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, sortCB2, 0);

    // Transpose the data from buffer 2 back into buffer 1
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, gUpdateSortCB[2]);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 4, gParticleBuffers[3]);
    computePass(CS_TRANSPOSE, MATRIX_HEIGHT / TRANSPOSE_BLOCK_SIZE,
        MATRIX_WIDTH / TRANSPOSE_BLOCK_SIZE, 1);

    // Sort the row data
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, gParticleBuffers[3]);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 4, gParticleBuffers[4]);
    computePass(CS_BITONIC_SORT, gNumParticles / BITONIC_BLOCK_SIZE, 1, 1);
  }
}

function initBuffers() {
  let iStartingWidth = Math.round(Math.sqrt(gNumParticles));
  let particles = new Float32Array(4 * gNumParticles);
  for ( let i = 0, n = 0; i < 4 * gNumParticles;) {
    let x = n % iStartingWidth;
    let y = Math.round(n / iStartingWidth);
    particles[i] = gFInitialParticleSpacing * x;
    particles[i+1] = gFInitialParticleSpacing * y;
    i += 4;
    n++;
  }
  gParticleBuffers[0] = gl.createBuffer();
  gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, gParticleBuffers[0]);
  gl.bufferData(gl.SHADER_STORAGE_BUFFER, particles, gl.DYNAMIC_DRAW);

  let particleDensities = new Float32Array(4 * gNumParticles);
  gParticleBuffers[1] = gl.createBuffer();
  gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, gParticleBuffers[1]);
  gl.bufferData(gl.SHADER_STORAGE_BUFFER, particleDensities, gl.DYNAMIC_DRAW);

  let particleForces = new Float32Array(4 * gNumParticles);
  gParticleBuffers[2] = gl.createBuffer();
  gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, gParticleBuffers[2]);
  gl.bufferData(gl.SHADER_STORAGE_BUFFER, particleForces, gl.DYNAMIC_DRAW);

  let grids = new Int32Array(4 * gNumParticles);
  gParticleBuffers[3] = gl.createBuffer();
  gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, gParticleBuffers[3]);
  gl.bufferData(gl.SHADER_STORAGE_BUFFER, grids, gl.DYNAMIC_DRAW);

  let gridsTemp = new Int32Array(4 * gNumParticles);
  gParticleBuffers[4] = gl.createBuffer();
  gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, gParticleBuffers[4]);
  gl.bufferData(gl.SHADER_STORAGE_BUFFER, gridsTemp, gl.DYNAMIC_DRAW);

  let gridIndices = new Int32Array(4 * NUM_GRID_INDICES);
  gParticleBuffers[5] = gl.createBuffer();
  gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, gParticleBuffers[5]);
  gl.bufferData(gl.SHADER_STORAGE_BUFFER, gridIndices, gl.DYNAMIC_DRAW);

  gParticleBuffers[6] = gl.createBuffer();
  gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, gParticleBuffers[6]);
  gl.bufferData(gl.SHADER_STORAGE_BUFFER, particles, gl.DYNAMIC_DRAW);

  let SimCons = {
    'iNumParticles': gNumParticles,
    'fTimeStep': 0.005,
    'fSmoothlen': gSmoothlen,
    'fPressureStiffness': gPressureStiffness,
    'fRestDensity': gRestDensity,
    'fDensityCoef': gParticleMass * 315.0 / (64.0 * Math.PI * Math.pow(gSmoothlen, 9)),
    'fGradPressureCoef': gParticleMass * -45.0 / (Math.PI * Math.pow(gSmoothlen, 6)),
    'fLapViscosityCoef': gParticleMass * gViscosity * 45.0 / (Math.PI * Math.pow(gSmoothlen, 6)),
    'fWallStiffness': gWallStiffness,
    'vGravity': [gGravityX, gGravityY, 0.0, 0.0],
    'vGridDim': [1.0 / gSmoothlen, 1.0 / gSmoothlen, 0.0, 0.0],
    'vPlanes': [
                 [1.0, 0.0, 0.0, 0.0],
                 [0.0, 1.0, 0.0, 0.0],
                 [-1.0, 0.0, gMapWidth, 0.0],
                 [0.0, -1.0, gMapHeight, 0.0],
               ],
  };
  let data = new ArrayBuffer(1 * 4 + 8 * 4 + 3 * 4 + 2 * 4 * 4 + 4 * 4 * 4);
  let view = new Int32Array(data, 0, 1);
  view[0] = SimCons.iNumParticles;
  view = new Float32Array(data, 4, 35);
  view[0] = SimCons.fTimeStep;
  view[1] = SimCons.fSmoothlen;
  view[2] = SimCons.fPressureStiffness;
  view[3] = SimCons.fRestDensity;
  view[4] = SimCons.fDensityCoef;
  view[5] = SimCons.fGradPressureCoef;
  view[6] = SimCons.fLapViscosityCoef;
  view[7] = SimCons.fWallStiffness;
  view[8] = 0.0;
  view[9] = 0.0;
  view[10] = 0.0;
  view[11] = SimCons.vGravity[0];
  view[12] = SimCons.vGravity[1];
  view[13] = SimCons.vGravity[2];
  view[14] = SimCons.vGravity[3];
  view[15] = SimCons.vGridDim[0];
  view[16] = SimCons.vGridDim[1];
  view[17] = SimCons.vGridDim[2];
  view[18] = SimCons.vGridDim[3];
  view[19] = SimCons.vPlanes[0][0];
  view[20] = SimCons.vPlanes[0][1];
  view[21] = SimCons.vPlanes[0][2];
  view[22] = SimCons.vPlanes[0][3];
  view[23] = SimCons.vPlanes[1][0];
  view[24] = SimCons.vPlanes[1][1];
  view[25] = SimCons.vPlanes[1][2];
  view[26] = SimCons.vPlanes[1][3];
  view[27] = SimCons.vPlanes[2][0];
  view[28] = SimCons.vPlanes[2][1];
  view[29] = SimCons.vPlanes[2][2];
  view[30] = SimCons.vPlanes[2][3];
  view[31] = SimCons.vPlanes[3][0];
  view[32] = SimCons.vPlanes[3][1];
  view[33] = SimCons.vPlanes[3][2];
  view[34] = SimCons.vPlanes[3][3];
  gUpdateParams = gl.createBuffer();
  gl.bindBuffer(gl.UNIFORM_BUFFER, gUpdateParams);
  gl.bufferData(gl.UNIFORM_BUFFER, new Uint8Array(data), gl.STATIC_DRAW);
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, gUpdateParams);

  let sortData = new ArrayBuffer(4 * 4);

  gUpdateSortCB[0] = gl.createBuffer();
  gl.bindBuffer(gl.UNIFORM_BUFFER, gUpdateSortCB[0]);
  gl.bufferData(gl.UNIFORM_BUFFER, sortData, gl.STATIC_DRAW);

  gUpdateSortCB[1] = gl.createBuffer();
  gl.bindBuffer(gl.UNIFORM_BUFFER, gUpdateSortCB[1]);
  gl.bufferData(gl.UNIFORM_BUFFER, sortData, gl.STATIC_DRAW);

  gUpdateSortCB[2] = gl.createBuffer();
  gl.bindBuffer(gl.UNIFORM_BUFFER, gUpdateSortCB[2]);
  gl.bufferData(gl.UNIFORM_BUFFER, sortData, gl.STATIC_DRAW);

  let orthographic =
      function(left, right, bottom, top, near, far) {
    let o = new Matrix4x4();
    o.elements =
    [
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, 1 / (near - far), 0,
      (left + right) / (left - right),
      (bottom + top) / (bottom - top),
      near / (near - far), 1,
    ];
    return o;
  };
  let mView = new Matrix4x4();
  mView.elements = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    -gMapWidth/2.0, -gMapHeight / 2.0, 0, 1,
  ];
  let mProjection = orthographic(-gMapWidth/2.0, gMapWidth/2.0, -gMapHeight / 2.0,
      gMapHeight / 2.0, 0, 1);
  gViewProjection.loadIdentity();
  gViewProjection.multiply(mView);
  gViewProjection.multiply(mProjection);

  gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, gParticleBuffers[0]);
  gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, gParticleBuffers[1]);
  gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, gParticleBuffers[2]);
  gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, gParticleBuffers[3]);
  gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 4, gParticleBuffers[4]);
  gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 5, gParticleBuffers[5]);
  gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 6, gParticleBuffers[6]);
}

function initRender() {
  gCanvas.width = window.innerWidth;
  gCanvas.height = window.innerHeight;
  gl.viewport(0, 0, gCanvas.width, gCanvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gPointSize = 4.0 * gCanvas.width * gCanvas.height / (1024 * 1024);

  let vertexShader = loadShader(gl.VERTEX_SHADER, gShaderStr[VS]);
  let fragmentShader = loadShader(gl.FRAGMENT_SHADER, gShaderStr[FS]);
  gPrograms[VS] = gl.createProgram();
  gl.attachShader(gPrograms[VS], vertexShader);
  gl.attachShader(gPrograms[VS], fragmentShader);

  // Bind a_particlePos to attribute 0
  // Bind a_particleVel to attribute 1
  gl.bindAttribLocation(gPrograms[VS], 0, 'a_particlePos');
  gl.bindAttribLocation(gPrograms[VS], 1, 'a_particleDen');

  // Load the vertex data
  gl.bindBuffer(gl.ARRAY_BUFFER, gParticleBuffers[0]);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, gl.FALSE, 16, 0);
  gl.vertexAttribDivisor(0, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, gParticleBuffers[1]);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, gl.FALSE, 16, 0);
  gl.vertexAttribDivisor(1, 1);

  // Link the program
  gl.linkProgram(gPrograms[VS]);
  gl.useProgram(gPrograms[VS]);

  // Set uniforms
  let mViewProjectionLoc = gl.getUniformLocation(gPrograms[VS], 'u_viewProjection');
  gl.uniformMatrix4fv(mViewProjectionLoc, false, gViewProjection.elements);
  let fPointSizeLoc = gl.getUniformLocation(gPrograms[VS], 'u_fPointSize');
  gl.uniform1f(fPointSizeLoc, gPointSize);
}

function initCS() {
  [CS_DEN_SIM, CS_DEN_SHA, CS_FOR_SIM, CS_FOR_SHA, CS_INT, CS_BUILD_GRID,
    CS_BITONIC_SORT, CS_TRANSPOSE, CS_CLEAR_GRID_IND, CS_BUILD_GRID_IND,
    CS_REARRANGE, CS_DEN_GRID, CS_FOR_GRID, CS_INT_GRID]
  .forEach((v) => {
    let cs = loadShader(gl.COMPUTE_SHADER, gShaderStr[v]);
    gPrograms[v] = gl.createProgram();
    gl.attachShader(gPrograms[v], cs);
    gl.linkProgram(gPrograms[v]);
  });
}

function destroyBuffers() {
  gl.deleteBuffer(gParticleBuffers[0]);
  gl.deleteBuffer(gParticleBuffers[1]);
  gl.deleteBuffer(gParticleBuffers[2]);
  gl.deleteBuffer(gParticleBuffers[3]);
  gl.deleteBuffer(gParticleBuffers[4]);
  gl.deleteBuffer(gParticleBuffers[5]);
  gl.deleteBuffer(gParticleBuffers[6]);
  gl.deleteBuffer(gUpdateParams);
  gl.deleteBuffer(gUpdateSortCB[0]);
  gl.deleteBuffer(gUpdateSortCB[1]);
  gl.deleteBuffer(gUpdateSortCB[2]);
}

function renderPass() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(gPrograms[VS]);
    gl.drawArraysInstanced(gl.POINTS, 0, 1, gNumParticles);
}

function init() {
  let threads = getUrlString('t');
  if (threads) {
    gThreads = threads;
  }
  gDispatchNum = Math.ceil(gNumParticles / gThreads);

  for (let i in gShaderStr) {
    gShaderStr[i] = gShaderStr[i].replace(/NUM_THREADS/g, gThreads);
  };

  initController();
  initBuffers();
  initCS();
  initRender();
  gFPSCounter = new FPSCounter(gFpsElem, 16);

  // make canvas auto fit window
  window.addEventListener('resize', function() {
    onResize();
    }, false);

  function onResize() {
    gCanvas.width = window.innerWidth * window.devicePixelRatio;
    gCanvas.height = window.innerHeight * window.devicePixelRatio;
    gl.viewport(0, 0, gCanvas.width, gCanvas.height);

    // Reset point size
    gPointSize = 4.0 * gCanvas.width * gCanvas.height / (1024 * 1024);
    let fPointSizeLoc = gl.getUniformLocation(gPrograms[VS], 'u_fPointSize');
    gl.uniform1f(fPointSizeLoc, gPointSize);
  }
}

function computePass(shader, x, y, z) {
  gl.useProgram(gPrograms[shader]);
  gl.dispatchCompute(x, y, z);
  gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT);
}

function simulateFluidSimple() {
  // Density
  computePass(CS_DEN_SIM, gDispatchNum, 1, 1);

  // Force
  computePass(CS_FOR_SIM, gDispatchNum, 1, 1);

  // Integrate
  computePass(CS_INT, gDispatchNum, 1, 1);
}

function simulateFluidShared() {
  // Density
  computePass(CS_DEN_SHA, gDispatchNum, 1, 1);

  // Force
  computePass(CS_FOR_SHA, gDispatchNum, 1, 1);

  // Integrate
  computePass(CS_INT, gDispatchNum, 1, 1);
}

function simulateFluidGrid() {
  // Build Grid
  computePass(CS_BUILD_GRID, gNumParticles / gThreads, 1, 1);

  // Sort Grid
  gpuSort();

  // Clear and build Grid Indices
  computePass(CS_CLEAR_GRID_IND, NUM_GRID_INDICES / gThreads, 1, 1);
  computePass(CS_BUILD_GRID_IND, gNumParticles / gThreads, 1, 1);

  // Rearrange
  computePass(CS_REARRANGE, gNumParticles / gThreads, 1, 1);

  // Density
  computePass(CS_DEN_GRID, gNumParticles / gThreads, 1, 1);

  // Force
  computePass(CS_FOR_GRID, gNumParticles / gThreads, 1, 1);

  // Integrate
  computePass(CS_INT_GRID, gNumParticles / gThreads, 1, 1);
}

function frame() {
  if (gScheduledRAF) {
    return;
  }
  gScheduledRAF = true;
  gFPSCounter.update();
  switch (gSimMode) {
    case 'simple':
      simulateFluidSimple();
      break;
    case 'shared':
      simulateFluidShared();
      break;
    case 'grid':
      simulateFluidGrid();
  }
  renderPass();
  requestAnimationFrame(() => {
    gScheduledRAF = false;
    frame();
  });
}

function start() {
  gCanvas = document.getElementById('example');
  gl = WebGLUtils.setupWebGL2Compute(gCanvas);
  if (!gl) {
    return;
  }
  init();
  requestAnimationFrame(frame);
}

function loadShaderFromFile(filename, index, onLoadShader) {
  let request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState === 4 && request.status === 200) {
      onLoadShader(index, request.responseText);
    }
  };
  request.open('GET', './shaders/' + filename, true);
  request.send();
}

(function () {
  let shaders = [
    'shader.vert',
    'shader.frag',
    'shaderDensitySimple.comp',
    'shaderForceSimple.comp',
    'shaderIntegrate.comp',
    'shaderDensityShared.comp',
    'shaderForceShared.comp',
    'shaderBuildGrid.comp',
    'shaderBitonicSort.comp',
    'shaderTranspose.comp',
    'shaderClearGridIndices.comp',
    'shaderBuildGridIndices.comp',
    'shaderRearrange.comp',
    'shaderDensityGrid.comp',
    'shaderForceGrid.comp',
    'shaderIntegrateGrid.comp',
  ];
  let counter = 0;
  for (let i = 0; i < shaders.length; i++) {
    loadShaderFromFile(shaders[i], i, (index, str) => {
      gShaderStr[index] = str;
      if (++counter === shaders.length) start();
    });
  }
})();
