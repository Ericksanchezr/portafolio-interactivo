import * as THREE from 'three'
import vertexShader from '../shaders/stars.vert.glsl?raw'
import fragmentShader from '../shaders/stars.frag.glsl?raw'
import { createRandom } from '../../utils/random.js'

const PALETTE = ['#ffffff', '#ffffff', '#ffffff', '#cfe0ff', '#9fc4ff', '#ffd9b0', '#d7c8ff']

/** Miles de estrellas que titilan, repartidas en un cascarón lejano. */
export class Starfield {
  constructor({ count }) {
    const random = createRandom(3)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
      // Dirección uniforme sobre la esfera.
      const y = random() * 2 - 1
      const angle = random() * Math.PI * 2
      const ring = Math.sqrt(1 - y * y)
      const distance = 180 + random() * 220

      positions[i * 3] = Math.cos(angle) * ring * distance
      positions[i * 3 + 1] = y * distance
      positions[i * 3 + 2] = Math.sin(angle) * ring * distance

      color.set(PALETTE[Math.floor(random() * PALETTE.length)])
      color.toArray(colors, i * 3)
      sizes[i] = random() < 0.04 ? 3 + random() * 2.5 : 0.8 + random() * 1.6
      phases[i] = random()
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
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

  update(time, dt) {
    this.material.uniforms.uTime.value = time
    this.points.rotation.y += dt * 0.004
  }
}
