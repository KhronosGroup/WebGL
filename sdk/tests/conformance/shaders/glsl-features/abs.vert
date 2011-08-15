attribute vec4 aPosition;
attribute vec2 aTexcoord;
varying vec2 vTexcoord;
varying vec4 vColor;

void main()
{
   gl_Position = aPosition;
   vTexcoord = aTexcoord;
   vColor = vec4(
     abs(aTexcoord.x * 2.0 - 1.0), 
     abs(aTexcoord.y * 2.0 - 1.0), 
     0,
     1);
}




