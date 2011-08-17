// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

attribute vec4 aPosition;

varying vec4 vColor;

float sign_emu(float value) {
  if (value == 0.0) return 0.0;
  return value > 0.0 ? 1.0 : -1.0;
}

void main()
{
   gl_Position = aPosition;
   vec2 texcoord = vec2(aPosition.xy * 0.5 + vec2(0.5, 0.5));
   vColor = vec4(
     sign_emu(texcoord.x * 2.0 - 1.0) * 0.5 + 0.5,
     sign_emu(texcoord.y * 2.0 - 1.0) * 0.5 + 0.5,
     0, 
     1);
}




