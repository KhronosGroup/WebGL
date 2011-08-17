// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

attribute vec4 aPosition;

varying vec4 vColor;

float sign_emu1(float value) {
  if (value == 0.0) return 0.0;
  return value > 0.0 ? 1.0 : -1.0;
}

vec4 sign_emu(vec4 value) {
  return vec4(
	  sign_emu1(value.x),
	  sign_emu1(value.y),
	  sign_emu1(value.z),
	  sign_emu1(value.w));
}

void main()
{
   gl_Position = aPosition;
   vec2 texcoord = vec2(aPosition.xy * 0.5 + vec2(0.5, 0.5));
   vColor = sign_emu(vec4(
      texcoord.yx * -2.0 + vec2(1, 1),
      texcoord * 2.0 - vec2(1, 1))) * 0.5 + vec4(0.5, 0.5, 0.5, 0.5);
}




