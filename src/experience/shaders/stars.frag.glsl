varying vec3 vColor;
varying float vTwinkle;

void main() {
  float distanceToCenter = length(gl_PointCoord - 0.5);
  float alpha = pow(smoothstep(0.5, 0.0, distanceToCenter), 2.4) * vTwinkle;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor * 1.6, alpha);
  #include <colorspace_fragment>
}
