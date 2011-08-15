attribute vec4 aPosition;
attribute vec2 aTexcoord;
varying vec2 vTexcoord;
varying vec4 vColor;

void main()
{
   gl_Position = aPosition;
   vTexcoord = aTexcoord;
   vColor = vec4(
     sign(aTexcoord.x * 2.0 - 1.0), 
     sign(aTexcoord.y * 2.0 - 1.0), 
     0,
     1);
}




