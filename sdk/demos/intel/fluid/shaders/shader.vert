#version 310 es
precision mediump float;
layout(location = 0) in vec2 a_particlePos;
layout(location = 1) in float a_particleDen;

uniform mat4 u_viewProjection;
uniform float u_fPointSize;

out vec4 color;

struct Particle {
  vec2 position;
  vec2 velocity;
};

vec4 Rainbow[5] = vec4[5](vec4(1, 0, 0, 1),
                          vec4(1, 1, 0, 1),
                          vec4(0, 1, 0, 1),
                          vec4(0, 1, 1, 1),
                          vec4(0, 0, 1, 1));

vec4 VisualizeNumber(float n) {
  return mix(Rainbow[uint(floor(n * 4.0f))], Rainbow[uint(ceil(n * 4.0f))],
             vec4(fract(n * 4.0f)));
}

vec4 VisualizeNumber(float n, float lower, float upper) {
  return VisualizeNumber(
      clamp((n - lower) / (upper - lower), float(0), float(1)));
}

void main() {
  color = VisualizeNumber(a_particleDen, 1000.0f, 2000.0f);
  gl_Position = (u_viewProjection * vec4(a_particlePos, 0.0, 1.0));
  gl_PointSize = u_fPointSize;
}

