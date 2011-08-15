attribute vec4 aPosition;
attribute vec2 aTexcoord;
varying vec2 vTexcoord;
varying vec4 vColor;
void main()
{
   gl_Position = aPosition;
   vTexcoord = aTexcoord;
   vColor = vec4(aTexcoord, 0, 1);
}


