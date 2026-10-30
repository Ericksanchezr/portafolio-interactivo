import * as THREE from 'three'
import { withNoise } from '../shaders/index.js'
import vertexShader from '../shaders/sky.vert.glsl?raw'
import fragmentShader from '../shaders/sky.frag.glsl?raw'

/** Esfera gigante que envuelve la escena con un degradado y nebulosas. */
export class Sky {
  constructor() {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: withNoise(fragmentShader),
      uniforms: {
        uTime: { value: 0 },
        uColorTop: { value: new THREE.Color('#0a0b22') },
        uColorBottom: { value: new THREE.Color('#020309') },
        uNebulaA: { value: new THREE.Color('#3d23a8') },
        uNebulaB: { value: new THREE.Color('#0c5f80') },
      },
      side: THREE.BackSide,
      depthWrite: false,
    })

    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), this.material)
    this.mesh.renderOrder = -1
  }

  update(time) {
    this.material.uniforms.uTime.value = time
  }
}
