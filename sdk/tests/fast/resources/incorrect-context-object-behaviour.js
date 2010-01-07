/*
Copyright (C) 2009 Apple Computer, Inc.  All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:
1. Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright
   notice, this list of conditions and the following disclaimer in the
   documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY APPLE COMPUTER, INC. ``AS IS'' AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

description("Tests calling WebGL APIs with objects from other contexts");

var contextA = create3DDebugContext();
var contextB = create3DDebugContext();
var programA = loadStandardProgram(contextA);
var programB = loadStandardProgram(contextB);
var shaderA = loadStandardVertexShader(contextA);
var shaderB = loadStandardVertexShader(contextB);
var textureA = contextA.createTexture();
var textureB = contextB.createTexture();
var frameBufferA = contextA.createFramebuffer();
var frameBufferB = contextB.createFramebuffer();
var renderBufferA = contextA.createRenderbuffer();
var renderBufferB = contextB.createRenderbuffer();
var locationA = contextA.getUniformLocation(programA, 'u_modelViewProjMatrix');
var locationB = contextB.getUniformLocation(programB, 'u_modelViewProjMatrix');


shouldThrow("contextA.compileShader(shaderB)");
shouldThrow("contextA.linkProgram(programB)");
shouldThrow("contextA.attachShader(programA, shaderB)");
shouldThrow("contextA.attachShader(programB, shaderA)");
shouldThrow("contextA.attachShader(programB, shaderB)");
shouldThrow("contextA.detachShader(programA, shaderB)");
shouldThrow("contextA.detachShader(programB, shaderA)");
shouldThrow("contextA.detachShader(programB, shaderB)");
shouldThrow("contextA.shaderSource(shaderB, 'foo')");
shouldThrow("contextA.bindAttribLocation(programB, 0, 'foo')");
shouldThrow("contextA.bindFramebuffer(contextA.FRAMEBUFFER, frameBufferB)");
shouldThrow("contextA.bindRenderbuffer(contextA.RENDERBUFFER, renderBufferB)");
shouldThrow("contextA.bindTexture(contextA.TEXTURE_2D, textureB)");
shouldThrow("contextA.framebufferRenderbuffer(contextA.FRAMEBUFFER, contextA.DEPTH_ATTACHMENT, contextA.RENDERBUFFER, renderBufferB)");
shouldThrow("contextA.framebufferTexture2D(contextA.FRAMEBUFFER, contextA.COLOR_ATTACHMENT0, contextA.TEXTURE_2D, textureB, 0)");
shouldThrow("contextA.getProgramParameter(programB, 0)");
shouldThrow("contextA.getProgramInfoLog(programB, 0)");
shouldThrow("contextA.getShaderParameter(shaderB, 0)");
shouldThrow("contextA.getShaderInfoLog(shaderB, 0)");
shouldThrow("contextA.getShaderSource(shaderB)");
shouldThrow("contextA.getUniform(programB, locationA)");
shouldThrow("contextA.getUniformLocation(programB, 'u_modelViewProjMatrix')");

successfullyParsed = true;
