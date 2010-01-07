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

description("Tests calling WebGL APIs without providing the necessary objects");

var context = create3DDebugContext();
var program = loadStandardProgram(context);
var shader = loadStandardVertexShader(context);

shouldThrow("context.compileShader()");
shouldThrow("context.linkProgram()");
shouldThrow("context.attachShader()");
shouldThrow("context.attachShader(program, undefined)");
shouldThrow("context.attachShader(undefined, shader)");
shouldThrow("context.detachShader(program, undefined)");
shouldThrow("context.detachShader(undefined, shader)");
shouldThrow("context.shaderSource()");
shouldThrow("context.shaderSource(undefined, 'foo')");
shouldThrow("context.bindAttribLocation(undefined, 0, 'foo')");
shouldBeUndefined("context.bindBuffer(context.ARRAY_BUFFER, 0)");
shouldBeUndefined("context.bindFramebuffer(context.FRAMEBUFFER, 0)");
shouldBeUndefined("context.bindRenderbuffer(context.RENDERBUFFER, 0)");
shouldBeUndefined("context.bindTexture(context.TEXTURE_2D, 0)");
// The following two throw exceptions because conceptually no
// framebuffer is bound at this point. In reality the WebGL
// implementation's internal framebuffer is bound, but we can't allow
// user code to manipulate it.
shouldThrow("context.framebufferRenderbuffer(context.FRAMEBUFFER, context.DEPTH_ATTACHMENT, context.RENDERBUFFER, 0)");
shouldThrow("context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, 0, 0)");
shouldThrow("context.getProgramParameter(undefined, 0)");
shouldThrow("context.getProgramInfoLog(undefined, 0)");
shouldThrow("context.getShaderParameter(undefined, 0)");
shouldThrow("context.getShaderInfoLog(undefined, 0)");
shouldThrow("context.getShaderSource(undefined)");
shouldThrow("context.getUniform(undefined, 0)");
shouldThrow("context.getUniformLocation(undefined, 'foo')");

successfullyParsed = true;
