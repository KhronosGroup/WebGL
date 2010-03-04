/*
 * Copyright (c) 2009 The Chromium Authors. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *    * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *    * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

description("Tests the WebGLUniformLocation API");

var contextA = create3DDebugContext();
var contextB = create3DDebugContext();
var programA1 = loadStandardProgram(contextA);
var programA2 = loadStandardProgram(contextA);
var programB = loadStandardProgram(contextB);
var programS = loadProgram(contextA, "resources/structUniformShader.vert", "resources/fragmentShader.frag");
var programV = loadProgram(contextA, "resources/floatUniformShader.vert", "resources/noopUniformShader.frag");
var locationA = contextA.getUniformLocation(programA1, 'u_modelViewProjMatrix');
var locationB = contextB.getUniformLocation(programB, 'u_modelViewProjMatrix');
var locationSx = contextA.getUniformLocation(programS, "u_struct.x");
var locationArray0 = contextA.getUniformLocation(programS, "u_array[0]");
var locationVec4 = contextA.getUniformLocation(programV, "fval4");

var vec = [1, 2, 3, 4];
var mat = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

shouldBeUndefined("contextA.useProgram(programA2)");
shouldThrow("contextA.uniformMatrix4fv(locationA, false, mat)");
shouldBeUndefined("contextA.useProgram(programA1)");
shouldBeUndefined("contextA.uniformMatrix4fv(locationA, false, mat)");
shouldThrow("contextA.uniformMatrix4fv(0, false, mat)");

shouldBeUndefined("contextA.useProgram(programS)");
shouldBeUndefined("contextA.uniform1i(locationSx, 3)");
shouldBeUndefined("contextA.uniform1f(locationArray0, 4.0)");

shouldBe("contextA.getUniform(programS, locationSx)", "3");
shouldBe("contextA.getUniform(programS, locationArray0)", "4.0");

shouldBeUndefined("contextA.useProgram(programV)");
shouldBeUndefined("contextA.uniform4fv(locationVec4, vec)");
shouldBe("contextA.getUniform(programV, locationVec4)", "vec");

shouldBeNull("contextA.getUniformLocation(programV, \"IDontExist\")");

successfullyParsed = true;
