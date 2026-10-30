import * as THREE from 'three'
import vertexShader from '../shaders/dust.vert.glsl?raw'
import fragmentShader from '../shaders/dust.frag.glsl?raw'
import { createRandom } from '../../utils/random.js'

/**
 * Disco de polvo galáctico: partículas en dos brazos espirales que giran
 * alrededor del núcleo. La rotación se calcula en la GPU (vertex shader).
 */
export class Dust {
  constructor({ count, innerRadius, outerRadius }) {
    const random = createRandom(11)
    // Suma de tres uniformes: valores en [-1, 1] concentrados cerca de 0.
    const spread = () => (random() + random() + random() - 1.5) / 1.5

    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const seeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const t = Math.pow(random(), 1.6)
      const radius = innerRadius + t * (outerRadius - innerRadius)
      const inArm = random() < 0.7
      const angle = (i % 2) * Math.PI + radius * 0.45 + spread() * (inArm ? 0.6 : Math.PI)

      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = spread() * 0.28 * (1 - t * 0.5)
      positions[i * 3 + 2] = -Math.sin(angle) * radius
      sizes[i] = 0.5 + random() * random() * 2.8
      seeds[i] = random()
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uSize: { value: 26 },
        uOuterRadius: { value: outerRadius },
        uColorInner: { value: new THREE.Color('#7fe8ff') },
        uColorOuter: { value: new THREE.Color('#8a5cff') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.points = new THREE.Points(geometry, this.material)
  }

  setPixelRatio(value) {
    this.material.uniforms.uPixelRatio.value = value
  }

  /** Usa el tiempo orbital (no el real) para frenar junto con los planetas. */
  update(orbitTime) {
    this.material.uniforms.uTime.value = orbitTime
  }
}
