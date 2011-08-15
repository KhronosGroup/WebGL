precision mediump float;
varying vec2 vTexcoord;
varying vec4 vColor;

float abs_emu(float value) {
  return value < 0.0 ? -value : value;
}

void main()
{
   gl_FragColor = vec4(
     abs_emu(vTexcoord.x * 2.0 - 1.0),
     abs_emu(vTexcoord.y * 2.0 - 1.0),
     0,
     1);
}


