// Fondo: degradado vertical con nebulosas suaves moduladas por ruido.

uniform float uTime;
uniform vec3 uColorTop;
uniform vec3 uColorBottom;
uniform vec3 uNebulaA;
uniform vec3 uNebulaB;

varying vec3 vDirection;

#include <simplex_noise>

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * snoise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

float lobe(vec3 dir, vec3 center, float sharpness) {
  return pow(max(dot(dir, normalize(center)), 0.0), sharpness);
}

void main() {
  vec3 dir = normalize(vDirection);
  vec3 color = mix(uColorBottom, uColorTop, smoothstep(-0.7, 0.9, dir.y));

  float clouds = fbm(dir * 1.8 + vec3(0.0, uTime * 0.006, uTime * 0.004));
  color += uNebulaA * lobe(dir, vec3(-0.75, 0.3, -0.6), 2.5) * (0.6 + 0.6 * clouds);
  color += uNebulaB * lobe(dir, vec3(0.8, -0.2, -0.55), 3.5) * (0.55 + 0.6 * clouds);
  color += mix(uNebulaA, uNebulaB, 0.5) * lobe(dir, vec3(0.2, 0.55, 0.8), 4.0) * (0.4 + 0.5 * clouds) * 0.6;
  color += uNebulaA * smoothstep(0.15, 0.7, clouds) * 0.05;

  gl_FragColor = vec4(max(color, 0.0), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
