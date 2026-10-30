// Polvo galáctico: cada partícula gira alrededor del eje Y, más rápido cuanto
// más cerca del centro (como las órbitas de los planetas).

uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uOuterRadius;
uniform vec3 uColorInner;
uniform vec3 uColorOuter;

attribute float aSize;
attribute float aSeed;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float radius = length(position.xz);
  float angle = uTime * 0.24 / sqrt(max(radius, 0.5));
  float c = cos(angle);
  float s = sin(angle);
  vec3 rotated = vec3(c * position.x + s * position.z, position.y, -s * position.x + c * position.z);

  vec4 mvPosition = modelViewMatrix * vec4(rotated, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float t = clamp(radius / uOuterRadius, 0.0, 1.0);
  vColor = mix(uColorInner, uColorOuter, smoothstep(0.05, 0.85, t + (aSeed - 0.5) * 0.25));
  vAlpha = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.7, 1.0, t)) * (0.3 + 0.7 * aSeed);
  // Las partículas muy cercanas a la cámara se ven como bokeh; limitamos su tamaño.
  gl_PointSize = min(uSize * aSize / -mvPosition.z, 20.0) * uPixelRatio;
}
