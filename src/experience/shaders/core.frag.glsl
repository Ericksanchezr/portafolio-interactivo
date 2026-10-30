uniform float uTime;
uniform float uHover;
uniform vec3 uColorDeep;
uniform vec3 uColorMid;
uniform vec3 uColorHot;
uniform vec3 uColorRim;

varying vec3 vNormalView;
varying vec3 vViewPosition;
varying vec3 vDirection;
varying float vDisplacement;

void main() {
  vec3 normal = normalize(vNormalView);
  vec3 viewDir = normalize(vViewPosition);
  float facing = clamp(dot(normal, viewDir), 0.0, 1.0);
  float fresnel = pow(1.0 - facing, 2.4);

  // Los valles son oscuros y las crestas se calientan hacia el cian.
  vec3 color = mix(uColorDeep, uColorMid, smoothstep(-0.18, 0.22, vDisplacement));
  color = mix(color, uColorHot, smoothstep(0.12, 0.3, vDisplacement));

  vec3 lightDir = normalize(vec3(-0.35, 0.65, 0.68));
  float diffuse = max(dot(normal, lightDir), 0.0);
  color *= 0.45 + 0.85 * diffuse;

  // Borde iridiscente que se desplaza lentamente.
  float shimmer = 0.5 + 0.5 * sin(uTime * 0.7 + vDirection.y * 4.0 + vDirection.x * 2.0);
  color += mix(uColorRim, uColorHot, shimmer) * fresnel * (1.25 + uHover * 1.2);
  color *= 1.0 + uHover * 0.4;

  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
