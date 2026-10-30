import * as THREE from 'three'
import { clamp, damp, dampAngle } from '../utils/math.js'

/** Cuánto se inclina la cámara siguiendo al mouse (radianes). */
const PARALLAX_THETA = 0.05
const PARALLAX_PHI = 0.035

/**
 * Cámara con movimiento amortiguado. En lugar de animaciones con duración fija,
 * cada vista define una meta (posición + punto al que mirar) y la cámara se
 * acerca a ella en coordenadas esféricas alrededor del centro: los viajes
 * trazan un arco en vez de atravesar el núcleo, y cambiar de meta a mitad de
 * camino nunca produce saltos.
 *
 * El "offset" desplaza el encuadre (setViewOffset) para centrar la escena en el
 * espacio que dejan libre los paneles de la interfaz.
 */
export class CameraRig {
  constructor(camera, { reducedMotion = false } = {}) {
    this.camera = camera
    this.reducedMotion = reducedMotion
    this.stiffness = reducedMotion ? 9 : 2.6

    this.current = new THREE.Spherical(20, 1.2, 0)
    this.goal = new THREE.Spherical(20, 1.2, 0)
    this.target = new THREE.Vector3()
    this.goalTarget = new THREE.Vector3()
    this.offset = new THREE.Vector2()
    this.goalOffset = new THREE.Vector2()
    this.pointer = new THREE.Vector2()
    this.parallax = new THREE.Vector2()
    this.spherical = new THREE.Spherical()
    this.size = { width: 1, height: 1 }

    this.introDuration = 0
    this.introElapsed = 0
  }

  setSize(width, height) {
    this.size.width = width
    this.size.height = height
  }

  setOffset(x, y) {
    this.goalOffset.set(x, y)
  }

  setPointer(x, y) {
    this.pointer.set(x, y)
  }

  setGoal(position, target) {
    this.goal.setFromVector3(position)
    this.goalTarget.copy(target)
  }

  /** Coloca la cámara directamente en la meta, sin animar. */
  snap() {
    this.current.copy(this.goal)
    this.target.copy(this.goalTarget)
    this.offset.copy(this.goalOffset)
  }

  /** Arranca desde `position` y llega a la meta con una entrada lenta que va ganando ritmo. */
  intro(position, duration) {
    this.snap()
    this.current.setFromVector3(position)
    this.introDuration = duration
    this.introElapsed = 0
  }

  update(dt) {
    let stiffness = this.stiffness
    if (this.introElapsed < this.introDuration) {
      this.introElapsed += dt
      const progress = clamp(this.introElapsed / this.introDuration, 0, 1)
      stiffness *= 0.3 + 0.7 * progress * progress
    }

    const { current, goal } = this
    current.radius = damp(current.radius, goal.radius, stiffness, dt)
    current.phi = damp(current.phi, goal.phi, stiffness, dt)
    current.theta = dampAngle(current.theta, goal.theta, stiffness, dt)
    const blend = 1 - Math.exp(-stiffness * dt)
    this.target.lerp(this.goalTarget, blend)
    this.offset.lerp(this.goalOffset, blend)

    if (!this.reducedMotion) this.parallax.lerp(this.pointer, 1 - Math.exp(-2.5 * dt))
    this.spherical.set(
      current.radius,
      clamp(current.phi - this.parallax.y * PARALLAX_PHI, 0.02, Math.PI - 0.02),
      current.theta + this.parallax.x * PARALLAX_THETA,
    )
    this.camera.position.setFromSpherical(this.spherical)
    this.camera.lookAt(this.target)
    // Actualizamos ya las matrices para que raycasting y etiquetas usen la cámara de este frame.
    this.camera.updateMatrixWorld()

    const { width, height } = this.size
    this.camera.setViewOffset(width, height, this.offset.x, this.offset.y, width, height)
  }
}
