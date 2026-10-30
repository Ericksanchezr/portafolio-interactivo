import * as THREE from 'three'
import { Planet } from './Planet.js'
import { createGlowTexture } from '../textures.js'
import { TAU } from '../../utils/math.js'

const RING_BASE_RADIUS = 3.4
const RING_GAP = 1.6
const MAX_RINGS = 4
/** Inclinación (x, z) de cada anillo, para que las órbitas se crucen en 3D. */
const RING_TILTS = [
  [0.05, -0.09],
  [-0.1, 0.06],
  [0.12, 0.03],
  [-0.06, -0.1],
]

/**
 * Organiza los proyectos en anillos orbitales. Con pocos proyectos cada uno
 * tiene su propio anillo; a partir de 5 se reparten entre 4 anillos y los que
 * comparten anillo quedan equiespaciados, así nunca chocan.
 */
export class ProjectSystem {
  constructor({ projects, planetScale = 1 }) {
    this.group = new THREE.Group()
    this.orbitTime = 0

    const ringCount = Math.min(Math.max(projects.length, 1), MAX_RINGS)
    this.rings = Array.from({ length: ringCount }, (_, index) => this.createRing(index))
    this.outerRadius = this.rings.at(-1).radius + 0.8

    const glowTexture = createGlowTexture()
    const perRing = this.rings.map((_, k) => projects.filter((_, i) => i % ringCount === k).length)
    const filled = new Array(ringCount).fill(0)

    this.planets = projects.map((project, index) => {
      const k = index % ringCount
      const ring = this.rings[k]
      const slot = filled[k]++
      const phase = (slot / perRing[k]) * TAU + k * 2.2 + 0.6
      const planet = new Planet({ project, index, ring, phase, scale: planetScale, glowTexture })
      ring.group.add(planet.pivot)
      return planet
    })
  }

  createRing(index) {
    const radius = RING_BASE_RADIUS + index * RING_GAP
    const group = new THREE.Group()
    const [tiltX, tiltZ] = RING_TILTS[index % RING_TILTS.length]
    group.rotation.set(tiltX, 0, tiltZ)

    const points = []
    for (let i = 0; i < 200; i++) {
      const angle = (i / 200) * TAU
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
    }
    const line = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: '#9aa6ff', transparent: true, opacity: 0.13, depthWrite: false }),
    )
    group.add(line)
    this.group.add(group)

    // Los anillos interiores giran más rápido, como en un sistema solar.
    return { radius, group, speed: 0.24 / Math.sqrt(radius) }
  }

  getPlanet(id) {
    return this.planets.find((planet) => planet.project.id === id) ?? null
  }

  setFocus(selected) {
    for (const planet of this.planets) {
      planet.setSelected(planet === selected)
      planet.setDimmed(Boolean(selected) && planet !== selected)
    }
  }

  /** `orbitScale` frena (0) o reanuda (1) las órbitas con suavidad. */
  update(time, dt, orbitScale) {
    this.orbitTime += dt * orbitScale
    for (const planet of this.planets) {
      planet.pivot.rotation.y = planet.phase + this.orbitTime * planet.ring.speed
      planet.update(time, dt)
    }
  }
}
