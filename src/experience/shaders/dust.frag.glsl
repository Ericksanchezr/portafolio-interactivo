varying vec3 vColor;
varying float vAlpha;

void main() {
  float distanceToCenter = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.05, distanceToCenter) * vAlpha;
  if (alpha < 0.005) discard;
  gl_FragColor = vec4(vColor, alpha);
  #include <colorspace_fragment>
}
