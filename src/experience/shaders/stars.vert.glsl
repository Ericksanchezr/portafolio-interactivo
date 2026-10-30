uniform float uTime;
uniform float uPixelRatio;

attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;

varying vec3 vColor;
varying float vTwinkle;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aPhase * 1.7) + aPhase * 6.2831);
  vTwinkle = twinkle;
  vColor = aColor;
  // Las estrellas están tan lejos que se dibujan con tamaño fijo en pantalla.
  gl_PointSize = aSize * uPixelRatio * (0.75 + 0.25 * twinkle);
}
