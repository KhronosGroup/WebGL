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

description("Test of getActiveAttrib and getActiveUniform");

var context = create3DDebugContext();
var context2 = create3DDebugContext();
var program = loadStandardProgram(context);
var program2 = loadStandardProgram(context2);

shouldBe("context.getError()", "0");
shouldBe("context.getActiveUniform(program, 0).name", "'u_modelViewProjMatrix'");
shouldBe("context.getActiveUniform(program, 0).type", "context.FLOAT_MAT4");
shouldBe("context.getActiveUniform(program, 0).size", "1");
shouldThrow("context.getActiveUniform(program, 1)");
shouldBe("context.getError()", "0");
shouldThrow("context.getActiveUniform(program, -1)");
shouldBe("context.getError()", "0");
shouldThrow("context.getActiveUniform(null, 0)");
shouldBe("context.getError()", "0");

shouldBe("context.getActiveAttrib(program, 0).name", "'a_normal'");
shouldBe("context.getActiveAttrib(program, 0).type", "context.FLOAT_VEC3");
shouldBe("context.getActiveAttrib(program, 0).size", "1");
shouldBe("context.getActiveAttrib(program, 1).name", "'a_vertex'");
shouldBe("context.getActiveAttrib(program, 1).type", "context.FLOAT_VEC4");
shouldBe("context.getActiveAttrib(program, 1).size", "1");
shouldThrow("context.getActiveAttrib(program, 2)");
shouldBe("context.getError()", "0");
shouldThrow("context.getActiveAttrib(program, -1)");
shouldBe("context.getError()", "0");
shouldThrow("context.getActiveAttrib(null, 0)");
shouldBe("context.getError()", "0");

shouldBe("context2.getError()", "0");
shouldThrow("context2.getActiveAttrib(program, 0)");
shouldBe("context2.getError()", "0");
shouldThrow("context2.getActiveUniform(program, 0)");
shouldBe("context2.getError()", "0");

context.deleteProgram(program);
shouldThrow("context.getActiveUniform(program, 0)");
shouldBe("context.getError()", "0");
shouldThrow("context.getActiveAttrib(program, 0)");
shouldBe("context.getError()", "0");

successfullyParsed = true;
