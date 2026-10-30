// Estela detrás de cada planeta: un arco del anillo que se desvanece a lo
// largo (lejos del planeta) y a lo ancho (bordes suaves).

uniform vec3 uColor;
uniform float uOpacity;
uniform float uArc;
uniform float uRadius;
uniform float uWidth;

varying vec3 vLocal;

void main() {
  float angle = atan(vLocal.z, vLocal.x);
  float along = 1.0 - clamp(angle / uArc, 0.0, 1.0);
  float across = 1.0 - smoothstep(0.0, 1.0, abs(length(vLocal.xz) - uRadius) / (uWidth * 0.5));
  float alpha = along * along * across * uOpacity;
  gl_FragColor = vec4(uColor * alpha, 1.0);
  #include <colorspace_fragment>
}
