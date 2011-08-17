// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#if defined(GL_ES)
precision mediump float;
#endif

varying vec4 vColor;

float sign_emu1(float value) {
  if (value == 0.0) return 0.0;
  return value > 0.0 ? 1.0 : -1.0;
}

vec3 sign_emu(vec3 value) {
  return vec3(
	  sign_emu1(value.x),
	  sign_emu1(value.y),
	  sign_emu1(value.z));
}

void main()
{
   gl_FragColor = vec4(
      sign_emu(vColor.xyz * 2.0 - vec3(1, 1, 1)) * 0.5 + vec3(0.5, 0.5, 0.5),
      1);
}




