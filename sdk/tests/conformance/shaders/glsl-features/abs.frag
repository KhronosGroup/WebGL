precision mediump float;
varying vec2 vTexcoord;
varying vec4 vColor;
void main()
{
   gl_FragColor = vec4(
     abs(vTexcoord.x * 2.0 - 1.0),
     abs(vTexcoord.y * 2.0 - 1.0),
     0,
     1);
}


