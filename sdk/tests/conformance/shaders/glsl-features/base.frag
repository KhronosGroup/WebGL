precision mediump float;
varying vec2 vTexcoord;
varying vec4 vColor;
void main()
{
   gl_FragColor = vec4(vTexcoord,vColor.yz);
}


