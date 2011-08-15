attribute vec4 aPosition;
attribute vec2 aTexcoord;
varying vec2 vTexcoord;
varying vec4 vColor;
void main()
{
   gl_Position = aPosition;
   vTexcoord = aTexcoord;
   vColor = vec4(1,1,1,1);
}


