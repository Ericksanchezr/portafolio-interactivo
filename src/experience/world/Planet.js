import * as THREE from 'three'
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import trailVertex from '../shaders/trail.vert.glsl?raw'
import trailFragment from '../shaders/trail.frag.glsl?raw'
import { damp } from '../../utils/math.js'
import { escapeHTML, pad } from '../../utils/text.js'

/** Formas disponibles para los planetas (campo `shape` de cada proyecto). */
const SHAPES = {
  icosahedron: { create: (size) => new THREE.IcosahedronGeometry(size, 0), flat: true },
  octahedron: { create: (size) => new THREE.OctahedronGeometry(size * 1.1, 0), flat: true },
  dodecahedron: { create: (size) => new THREE.DodecahedronGeometry(size, 0), flat: true },
  tetrahedron: { create: (size) => new THREE.TetrahedronGeometry(size * 1.2, 0), flat: true },
  box: { create: (size) => new THREE.BoxGeometry(size * 1.25, size * 1.25, size * 1.25), flat: true },
  sphere: { create: (size) => new THREE.IcosahedronGeometry(size, 2), flat: true },
  torus: { create: (size) => new THREE.TorusGeometry(size * 0.72, size * 0.3, 20, 48), flat: false },
  torusKnot: { create: (size) => new THREE.TorusKnotGeometry(size * 0.62, size * 0.2, 120, 14), flat: false },
}

/** Longitud (en radianes) de la estela que deja cada planeta en su órbita. */
const TRAIL_ARC = 1.15

/**
 * Un proyecto representado como planeta. Jerarquía:
 *   pivot (gira alrededor del centro del anillo)
 *   ├── trail (estela sobre la órbita)
 *   └── anchor (posición del planeta en la órbita)
 *       ├── visual (cuerpo que gira y crece al pasar el mouse)
 *       ├── shell, halo, hitMesh
 *       └── label (etiqueta HTML)
 */
export class Planet {
  constructor({ project, index, ring, phase, scale, glowTexture }) {
    this.project = project
    this.index = index
    this.ring = ring
    this.phase = phase
    this.size = (project.featured ? 0.56 : 0.44) * scale
    this.color = new THREE.Color(project.color)

    this.hover = 0
    this.hoverTarget = 0
    this.dim = 0
    this.dimTarget = 0
    this.focus = 0
    this.selected = false
    this.spinVelocity = 0.35
    this.labelActive = false
    this.labelOpacity = 1
    this.labelShift = 0
    this.labelWidth = 0
    this.worldPosition = new THREE.Vector3()
    this.cameraDistance = 0

    this.pivot = new THREE.Group()
    this.pivot.rotation.y = phase
    this.anchor = new THREE.Group()
    this.anchor.position.x = ring.radius
    this.visual = new THREE.Group()
    this.visual.rotation.set(0.45, 0, 0.2)
    this.pivot.add(this.anchor)
    this.anchor.add(this.visual)

    this.createBody()
    this.createShell()
    this.createHalo(glowTexture)
    this.createTrail()
    this.createHitArea()
    this.createLabel()
  }

  createBody() {
    const shape = SHAPES[this.project.shape] ?? SHAPES.icosahedron
    // Bastante metálico: los reflejos se tiñen del color del proyecto en vez de quemarse a blanco.
    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: this.color.clone().multiplyScalar(0.75),
      emissive: this.color,
      emissiveIntensity: 0.2,
      roughness: 0.32,
      metalness: 0.55,
      clearcoat: 0.3,
      clearcoatRoughness: 0.3,
      flatShading: shape.flat,
    })
    this.body = new THREE.Mesh(shape.create(this.size), this.bodyMaterial)
    this.visual.add(this.body)
  }

  createShell() {
    this.shellMaterial = new THREE.LineBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.shell = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(this.size * 1.6, 1)),
      this.shellMaterial,
    )
    this.anchor.add(this.shell)
  }

  createHalo(texture) {
    this.haloMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: this.color,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.halo = new THREE.Sprite(this.haloMaterial)
    this.halo.scale.setScalar(this.size * 6)
    this.anchor.add(this.halo)
  }

  createTrail() {
    const radius = this.ring.radius
    const width = this.size * 0.24
    const geometry = new THREE.RingGeometry(radius - width / 2, radius + width / 2, 96, 1, 0, TRAIL_ARC)
    // RingGeometry vive en el plano XY; la acostamos sobre el plano de la órbita (XZ).
    geometry.rotateX(Math.PI / 2)

    this.trailUniforms = {
      uColor: { value: this.color },
      uOpacity: { value: 0.5 },
      uArc: { value: TRAIL_ARC },
      uRadius: { value: radius },
      uWidth: { value: width },
    }
    this.trail = new THREE.Mesh(
      geometry,
      new THREE.ShaderMaterial({
        vertexShader: trailVertex,
        fragmentShader: trailFragment,
        uniforms: this.trailUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    )
    this.pivot.add(this.trail)
  }

  createHitArea() {
    // Esfera invisible más grande que el planeta: hace fácil apuntarle, sobre todo en móvil.
    this.hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.size * 1.9, 16, 12),
      new THREE.MeshBasicMaterial({ visible: false }),
    )
    this.hitMesh.userData.planet = this
    this.anchor.add(this.hitMesh)
  }

  createLabel() {
    const element = document.createElement('div')
    element.className = 'planet-label'
    element.style.setProperty('--accent', this.project.color)
    element.innerHTML = `
      <button class="planet-label__button" type="button" tabindex="-1">
        <span class="planet-label__index">${pad(this.index + 1)}</span>
        <span class="planet-label__title">${escapeHTML(this.project.title)}</span>
      </button>`

    this.labelElement = element
    this.labelButton = element.querySelector('button')
    this.label = new CSS2DObject(element)
    this.label.center.set(0.5, 1)
    this.label.position.set(0, this.size * 1.5 + 0.2, 0)
    this.anchor.add(this.label)
  }

  setHovered(value) {
    this.hoverTarget = value ? 1 : 0
  }

  setSelected(value) {
    this.selected = value
    this.labelElement.classList.toggle('is-selected', value)
  }

  setDimmed(value) {
    this.dimTarget = value ? 1 : 0
    this.labelElement.classList.toggle('is-dimmed', value)
  }

  /** Arrastrar mientras el planeta está enfocado lo hace girar sobre sí mismo. */
  addSpin(pixels) {
    this.spinVelocity += pixels * 0.012
  }

  setLabelOpacity(value) {
    if (Math.abs(value - this.labelOpacity) < 0.01) return
    this.labelOpacity = value
    this.labelElement.style.opacity = value.toFixed(2)
  }

  /** Desplaza la etiqueta (px) en horizontal; la línea que la une al planeta se queda en su sitio. */
  setLabelShift(value) {
    const shift = Math.round(value)
    if (shift === this.labelShift) return
    this.labelShift = shift
    this.labelElement.style.setProperty('--shift', `${shift}px`)
  }

  /** Posición del planeta en el espacio del sistema (antes del giro que aplica el usuario). */
  getSystemPosition(target) {
    return target.copy(this.anchor.position).applyEuler(this.pivot.rotation).applyEuler(this.ring.group.rotation)
  }

  update(time, dt) {
    this.hover = damp(this.hover, this.selected ? 1 : this.hoverTarget, 6, dt)
    this.dim = damp(this.dim, this.dimTarget, 3, dt)
    this.focus = damp(this.focus, this.selected ? 1 : 0, 3, dt)
    const hover = this.hover
    const visibility = 1 - this.dim * 0.75

    this.spinVelocity = damp(this.spinVelocity, 0.35, 1.5, dt)
    this.visual.rotation.y += this.spinVelocity * dt
    this.visual.scale.setScalar(1 + hover * 0.22)

    this.shell.rotation.set(time * 0.08, -time * 0.15, 0)
    this.shell.scale.setScalar(1 + hover * 0.12)

    this.bodyMaterial.emissiveIntensity = 0.2 + hover * 0.28
    this.shellMaterial.opacity = (0.14 + hover * 0.36) * visibility
    // De cerca el halo taparía el planeta, así que se atenúa al enfocarlo.
    this.haloMaterial.opacity = (0.22 + hover * 0.3) * visibility * (1 - this.focus * 0.65)
    this.trailUniforms.uOpacity.value = (0.5 + hover * 0.4) * visibility

    const active = this.hoverTarget > 0
    if (active !== this.labelActive) {
      this.labelActive = active
      this.labelElement.classList.toggle('is-active', active)
    }
  }
}
