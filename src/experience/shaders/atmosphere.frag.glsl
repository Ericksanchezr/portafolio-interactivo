// Halo del núcleo: se dibuja la cara interior de una esfera más grande y el
// brillo se desvanece hacia su silueta.

uniform vec3 uColor;
uniform float uIntensity;

varying vec3 vNormalView;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormalView);
  vec3 viewDir = normalize(vViewPosition);
  // En la cara trasera la normal apunta en contra de la cámara.
  float glow = pow(clamp(-dot(normal, viewDir), 0.0, 1.0), 3.0);
  gl_FragColor = vec4(uColor * glow * uIntensity, 1.0);
  #include <colorspace_fragment>
}
