import * as THREE from 'three'
import { withNoise } from '../shaders/index.js'
import coreVertex from '../shaders/core.vert.glsl?raw'
import coreFragment from '../shaders/core.frag.glsl?raw'
import atmosphereVertex from '../shaders/atmosphere.vert.glsl?raw'
import atmosphereFragment from '../shaders/atmosphere.frag.glsl?raw'
import { damp } from '../../utils/math.js'

/** El núcleo del sistema: una esfera de energía que se deforma y reacciona al mouse. */
export class Core {
  constructor({ detail = 48 } = {}) {
    this.group = new THREE.Group()
    this.hover = 0
    this.hoverTarget = 0
    this.pointerDirection = new THREE.Vector3(0, 0, 1)

    this.uniforms = {
      uTime: { value: 0 },
      uAmplitude: { value: 0.17 },
      uFrequency: { value: 1.3 },
      uHover: { value: 0 },
      uPointerDir: { value: this.pointerDirection },
      uColorDeep: { value: new THREE.Color('#12063a') },
      uColorMid: { value: new THREE.Color('#5b3cff') },
      uColorHot: { value: new THREE.Color('#47e4ff') },
      uColorRim: { value: new THREE.Color('#ff5ccf') },
    }
    this.mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.15, detail),
      new THREE.ShaderMaterial({
        vertexShader: withNoise(coreVertex),
        fragmentShader: coreFragment,
        uniforms: this.uniforms,
      }),
    )

    this.atmosphereUniforms = {
      uColor: { value: new THREE.Color('#6d5cff') },
      uIntensity: { value: 1.2 },
    }
    this.atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 64, 32),
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: this.atmosphereUniforms,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )

    // Dos anillos finos tipo giroscopio.
    this.rings = new THREE.Group()
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#9d8dff').multiplyScalar(1.6),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    for (const [radius, tiltX, tiltZ] of [
      [1.95, 1.2, 0.3],
      [2.25, -0.5, 1.1],
    ]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.008, 6, 160), ringMaterial)
      ring.rotation.set(tiltX, 0, tiltZ)
      this.rings.add(ring)
    }

    // Luz que ilumina los planetas desde el centro.
    this.light = new THREE.PointLight('#a493ff', 11, 0, 1.4)

    // Esfera invisible y un poco más grande para detectar el mouse con holgura.
    this.hitMesh = new THREE.Mesh(new THREE.SphereGeometry(1.45, 24, 16), new THREE.MeshBasicMaterial({ visible: false }))

    this.group.add(this.mesh, this.atmosphere, this.rings, this.light, this.hitMesh)
  }

  setHovered(value) {
    this.hoverTarget = value ? 1 : 0
  }

  /** Recibe el punto (en coordenadas de mundo) donde el mouse toca el núcleo. */
  setPointer(worldPoint) {
    this.pointerDirection.copy(this.mesh.worldToLocal(worldPoint.clone())).normalize()
  }

  update(time, dt) {
    this.hover = damp(this.hover, this.hoverTarget, 4, dt)
    this.uniforms.uTime.value = time
    this.uniforms.uHover.value = this.hover
    this.atmosphereUniforms.uIntensity.value = 0.85 + this.hover * 0.6
    this.mesh.rotation.y = time * 0.05
    this.rings.rotation.y = time * 0.12
    this.rings.rotation.x = Math.sin(time * 0.1) * 0.2
  }
}
