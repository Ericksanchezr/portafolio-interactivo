// Núcleo: esfera deformada con ruido simplex. Las normales se recalculan
// desplazando dos puntos vecinos, para que la luz siga la superficie deformada.

uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uHover;
uniform vec3 uPointerDir;

varying vec3 vNormalView;
varying vec3 vViewPosition;
varying vec3 vDirection;
varying float vDisplacement;

#include <simplex_noise>

float displacement(vec3 dir) {
  float t = uTime * 0.22;
  float base = snoise(dir * uFrequency + vec3(t, t * 0.7, -t * 0.5));
  float detail = snoise(dir * uFrequency * 2.6 - vec3(t * 1.4)) * 0.35;
  // Abultamiento hacia donde apunta el mouse.
  float pull = smoothstep(0.72, 1.0, dot(dir, uPointerDir)) * uHover;
  return (base + detail) * uAmplitude * (1.0 + uHover * 0.5) + pull * 0.2;
}

vec3 orthogonal(vec3 v) {
  return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y));
}

vec3 displacedPoint(vec3 dir, float radius) {
  return dir * radius * (1.0 + displacement(dir));
}

void main() {
  float radius = length(position);
  vec3 dir = position / radius;
  vec3 tangent = orthogonal(dir);
  vec3 bitangent = normalize(cross(dir, tangent));

  float d = displacement(dir);
  vec3 displaced = dir * radius * (1.0 + d);
  vec3 neighbourA = displacedPoint(normalize(dir + tangent * 0.01), radius);
  vec3 neighbourB = displacedPoint(normalize(dir + bitangent * 0.01), radius);
  vec3 displacedNormal = normalize(cross(neighbourA - displaced, neighbourB - displaced));

  vDisplacement = d;
  vDirection = dir;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPosition = -mvPosition.xyz;
  vNormalView = normalize(normalMatrix * displacedNormal);
  gl_Position = projectionMatrix * mvPosition;
}
