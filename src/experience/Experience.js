import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'

import { CameraRig } from './CameraRig.js'
import { createNeonEnvironment } from './environment.js'
import { PointerInput } from './PointerInput.js'
import { Sky } from './world/Sky.js'
import { Starfield } from './world/Starfield.js'
import { Dust } from './world/Dust.js'
import { Core } from './world/Core.js'
import { ProjectSystem } from './world/ProjectSystem.js'
import { clamp, damp, dampAngle } from '../utils/math.js'

/**
 * Encuadre de cada vista que no enfoca un planeta.
 * - elevation: ángulo de la cámara sobre el plano de las órbitas (radianes).
 * - fit: multiplica la distancia que hace caber todo el sistema en pantalla.
 * - subject/fraction: en vez de encuadrar el sistema, encuadra una esfera de
 *   radio `subject` ocupando `fraction` del alto disponible.
 */
const VIEWS = {
  home: { elevation: 0.3, fit: 1.02 },
  projects: { elevation: 0.52, fit: 1.08 },
  about: { elevation: 0.38, subject: 1.5, fraction: 0.5 },
  contact: { elevation: 1.05, fit: 1.04 },
}

/** Al enfocar un proyecto, el sistema gira hasta dejar su planeta en este ángulo (frente a la cámara). */
const PRESENT_AZIMUTH = 0
/** Desplazamiento lateral de la cámara al enfocar un planeta, para ver el núcleo de fondo. */
const FOCUS_SIDE_ANGLE = 0.7
/** Fracción del alto disponible que ocupa el planeta enfocado. */
const FOCUS_FRACTION = 0.3
/** Margen mínimo (px) entre una etiqueta y el borde de la pantalla. */
const LABEL_MARGIN = 12

const ORIGIN = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

/**
 * La escena 3D completa. Recibe la ruta actual y el espacio que ocupa la
 * interfaz, y emite eventos cuando el usuario interactúa con la escena:
 * - `select`: { id } click en un planeta.
 * - `select-core`: click en el núcleo.
 * - `hover`: { id | null } el mouse entra o sale de un planeta.
 */
export class Experience extends EventTarget {
  constructor({ canvas, labelLayer, projects, reducedMotion = false }) {
    super()
    this.canvas = canvas
    this.labelLayer = labelLayer
    this.reducedMotion = reducedMotion
    this.quality = detectQuality()

    this.size = { width: window.innerWidth, height: window.innerHeight }
    this.insets = { top: 0, right: 0, bottom: 0, left: 0 }
    this.route = { name: 'home' }

    this.elapsed = 0
    this.lastTime = null
    this.orbitScale = 1
    this.orbitScaleTarget = 1
    this.rotation = 0
    this.rotationGoal = 0
    this.rotationVelocity = 0
    this.tilt = 0
    this.zoom = 1
    this.cursor = ''

    this.selected = null
    this.hovered = null
    this.labelHovered = null
    this.highlighted = null

    this.focusLocal = new THREE.Vector3()
    this.goalTarget = new THREE.Vector3()
    this.goalPosition = new THREE.Vector3()
    this.labelPoint = new THREE.Vector3()
    this.labelsDirty = true

    this.setupRenderer()
    this.setupScene(projects)
    this.setupPostprocessing()
    this.setupInput()

    this.rig = new CameraRig(this.camera, { reducedMotion })
    this.resize()
    window.addEventListener('resize', this.resize)
    // Cuando termina de cargar la tipografía cambia el ancho de las etiquetas.
    document.fonts?.ready.then(() => {
      this.labelsDirty = true
    })
  }

  setupRenderer() {
    // Sin antialias nativo: el composer usa MSAA en su propio render target.
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance' })
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.labelRenderer = new CSS2DRenderer({ element: this.labelLayer })
  }

  setupScene(projects) {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(40, this.size.width / this.size.height, 0.1, 1500)

    // Reflejos de neón para los planetas, generados al vuelo sin descargar ningún HDR.
    this.scene.environment = createNeonEnvironment(this.renderer)
    this.scene.environmentIntensity = 0.8

    this.sky = new Sky()
    this.stars = new Starfield({ count: this.quality.stars })
    this.scene.add(this.sky.mesh, this.stars.points)

    // Todo lo que gira cuando el usuario arrastra vive dentro de systemGroup.
    this.systemGroup = new THREE.Group()
    this.core = new Core({ detail: this.quality.coreDetail })
    this.projectSystem = new ProjectSystem({ projects, planetScale: this.quality.planetScale })
    this.dust = new Dust({
      count: this.quality.dust,
      innerRadius: 1.9,
      outerRadius: this.projectSystem.outerRadius + 2.6,
    })
    this.systemGroup.add(this.core.group, this.projectSystem.group, this.dust.points)
    this.scene.add(this.systemGroup)

    this.raycaster = new THREE.Raycaster()
    this.hitTargets = [this.core.hitMesh, ...this.projectSystem.planets.map((planet) => planet.hitMesh)]

    for (const planet of this.projectSystem.planets) {
      planet.labelButton.addEventListener('click', () => this.emit('select', { id: planet.project.id }))
      planet.labelButton.addEventListener('pointerenter', () => {
        this.labelHovered = planet
      })
      planet.labelButton.addEventListener('pointerleave', () => {
        if (this.labelHovered === planet) this.labelHovered = null
      })
    }
  }

  setupPostprocessing() {
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: this.quality.msaa ? 4 : 0,
    })
    this.composer = new EffectComposer(this.renderer, renderTarget)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), this.quality.low ? 0.7 : 0.8, 0.6, 0.28)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
  }

  setupInput() {
    this.input = new PointerInput(this.canvas)
    this.input.addEventListener('tap', (event) => this.onTap(event.detail.ndc))
    this.input.addEventListener('zoom', (event) => this.onZoom(event.detail.factor))
  }

  /** Compila los shaders, arranca el loop y resuelve cuando ya se pintó el primer frame. */
  async start() {
    this.update(0)
    if (this.reducedMotion) this.rig.snap()
    else this.rig.intro(new THREE.Vector3().setFromSphericalCoords(46, 0.62, -1.05), 3.2)

    try {
      await this.renderer.compileAsync(this.scene, this.camera)
    } catch (error) {
      console.warn('compileAsync no disponible; los shaders se compilarán en el primer frame.', error)
    }
    this.renderer.setAnimationLoop(this.tick)
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  }

  stop() {
    this.renderer.setAnimationLoop(null)
  }

  setRoute(route) {
    const changed = route.name !== this.route.name || route.id !== this.route.id
    this.route = route
    this.selected = route.name === 'project' ? this.projectSystem.getPlanet(route.id) : null
    this.projectSystem.setFocus(this.selected)
    this.orbitScaleTarget = this.selected ? 0 : route.name === 'about' ? 0.35 : 1
    if (changed) {
      this.tilt = 0
      this.zoom = 1
    }
    this.labelLayer.classList.toggle('is-hidden', route.name === 'about')
  }

  /** Píxeles que ocupa la interfaz en cada borde; la cámara centra la escena en el resto. */
  setInsets(insets) {
    this.insets = insets
    this.rig.setOffset((insets.right - insets.left) / 2, (insets.bottom - insets.top) / 2)
  }

  /** Resalta un planeta desde la interfaz (p. ej. al pasar el mouse por su tarjeta). */
  setHighlight(id) {
    this.highlighted = id ? this.projectSystem.getPlanet(id) : null
  }

  tick = (timestamp) => {
    const time = timestamp / 1000
    // Limitamos dt para que volver a una pestaña inactiva no provoque saltos.
    const dt = this.lastTime === null ? 0 : Math.min(time - this.lastTime, 1 / 20)
    this.lastTime = time

    this.update(dt)
    this.composer.render(dt)
    this.labelRenderer.render(this.scene, this.camera)
    // CSS2DRenderer agrega las etiquetas al DOM en su primer render; ahí ya se pueden medir.
    if (this.labelsDirty) this.measureLabels()
  }

  update(dt) {
    this.elapsed += dt
    const time = this.elapsed

    this.orbitScale = damp(this.orbitScale, this.orbitScaleTarget, 2.2, dt)
    this.projectSystem.update(time, dt, this.orbitScale)
    this.dust.update(this.projectSystem.orbitTime)
    this.core.update(time, dt)
    this.stars.update(time, dt)
    this.sky.update(time)

    this.updateRotation(dt)
    this.updateCameraGoal()
    if (this.input.hoverCapable) this.rig.setPointer(this.input.ndc.x, this.input.ndc.y)
    this.rig.update(dt)

    this.updateHover()
    this.updateLabels()
  }

  /** Giro del sistema: lo controla el usuario arrastrando, o se orienta solo hacia el planeta enfocado. */
  updateRotation(dt) {
    const drag = this.input.consumeDrag()

    if (this.selected) {
      this.selected.getSystemPosition(this.focusLocal)
      this.rotationGoal = PRESENT_AZIMUTH - Math.atan2(this.focusLocal.x, this.focusLocal.z)
      this.rotation = dampAngle(this.rotation, this.rotationGoal, 2.4, dt)
      this.rotationVelocity = 0
      if (drag.x) this.selected.addSpin(drag.x)
    } else if (this.input.dragging) {
      const delta = drag.x * 0.0055
      this.rotation += delta
      if (dt > 0) this.rotationVelocity = damp(this.rotationVelocity, delta / dt, 16, dt)
      this.tilt = clamp(this.tilt + drag.y * 0.0035, -0.25, 0.7)
    } else {
      // Inercia al soltar.
      this.rotation += this.rotationVelocity * dt
      this.rotationVelocity = damp(this.rotationVelocity, 0, 2.4, dt)
    }

    this.systemGroup.rotation.y = this.rotation
  }

  updateCameraGoal() {
    const { width, height } = this.size
    const { top, right, bottom, left } = this.insets
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    const availableWidth = Math.max(width - left - right, width * 0.3) / width
    const availableHeight = Math.max(height - top - bottom, height * 0.25) / height
    // Distancia a la que una esfera de radio `radius` ocupa `fraction` del espacio libre.
    const framing = (radius, fraction) =>
      radius / (fraction * tanHalf * Math.min(availableHeight, this.camera.aspect * availableWidth))

    if (this.selected) {
      // Meta: donde quedará el planeta cuando el sistema termine de girar.
      this.goalTarget.copy(this.focusLocal).applyAxisAngle(UP, this.rotationGoal)
      const distance = framing(this.selected.size * 1.25, FOCUS_FRACTION)
      const side = PRESENT_AZIMUTH + FOCUS_SIDE_ANGLE
      this.goalPosition
        .set(Math.sin(side), 0.3, Math.cos(side))
        .normalize()
        .multiplyScalar(distance)
        .add(this.goalTarget)
      this.rig.setGoal(this.goalPosition, this.goalTarget)
      return
    }

    const view = VIEWS[this.route.name] ?? VIEWS.home
    const elevation = clamp(view.elevation + this.tilt, 0.04, 1.35)
    let distance
    if (view.subject) {
      distance = framing(view.subject, view.fraction)
    } else {
      const radius = this.projectSystem.outerRadius
      const depth = radius * Math.sin(elevation) + 1.4 * Math.cos(elevation)
      distance =
        Math.max(radius / (tanHalf * this.camera.aspect * availableWidth), depth / (tanHalf * availableHeight)) *
        view.fit
    }

    this.goalPosition.setFromSphericalCoords(distance * this.zoom, Math.PI / 2 - elevation, 0)
    this.rig.setGoal(this.goalPosition, ORIGIN)
  }

  updateHover() {
    let hovered = this.labelHovered
    if (!hovered && this.input.inside && !this.input.dragging) {
      this.raycaster.setFromCamera(this.input.ndc, this.camera)
      const hit = this.raycaster.intersectObjects(this.hitTargets, false)[0]
      if (hit) {
        hovered = hit.object.userData.planet ?? this.core
        if (hovered === this.core) this.core.setPointer(hit.point)
      }
    }

    if (hovered !== this.hovered) {
      this.hovered = hovered
      const planet = hovered && hovered !== this.core ? hovered : null
      this.emit('hover', { id: planet ? planet.project.id : null })
    }

    for (const planet of this.projectSystem.planets) {
      planet.setHovered(planet === this.hovered || planet === this.highlighted)
    }
    this.core.setHovered(this.hovered === this.core)

    const cursor = this.input.dragging ? 'grabbing' : this.hovered ? 'pointer' : 'grab'
    if (cursor !== this.cursor) {
      this.cursor = cursor
      this.canvas.style.cursor = cursor
    }
  }

  /**
   * Las etiquetas de los planetas más lejanos se atenúan para dar profundidad,
   * y se desplazan lo necesario para no salirse por los bordes de la pantalla.
   */
  updateLabels() {
    const planets = this.projectSystem.planets
    const { width } = this.size
    let near = Infinity
    let far = 0

    for (const planet of planets) {
      planet.anchor.getWorldPosition(planet.worldPosition)
      planet.cameraDistance = planet.worldPosition.distanceTo(this.camera.position)
      near = Math.min(near, planet.cameraDistance)
      far = Math.max(far, planet.cameraDistance)

      // Solo se corrigen etiquetas de planetas visibles; las de planetas fuera de cuadro se dejan ir.
      const x = (planet.label.getWorldPosition(this.labelPoint).project(this.camera).x * 0.5 + 0.5) * width
      const half = planet.labelWidth / 2
      let shift = 0
      if (x >= 0 && x <= width) {
        if (x - half < LABEL_MARGIN) shift = LABEL_MARGIN - (x - half)
        else if (x + half > width - LABEL_MARGIN) shift = width - LABEL_MARGIN - (x + half)
      }
      planet.setLabelShift(shift)
    }

    const range = Math.max(far - near, 0.001)
    for (const planet of planets) {
      planet.setLabelOpacity(1 - ((planet.cameraDistance - near) / range) * 0.5)
    }
  }

  measureLabels() {
    this.labelsDirty = false
    for (const planet of this.projectSystem.planets) {
      const width = planet.labelButton.offsetWidth
      // Una etiqueta oculta (detrás de la cámara) mide 0: se reintenta en el siguiente frame.
      if (width) planet.labelWidth = width
      else this.labelsDirty = true
    }
  }

  onTap(ndc) {
    this.raycaster.setFromCamera(ndc, this.camera)
    const hit = this.raycaster.intersectObjects(this.hitTargets, false)[0]
    if (!hit) return
    const planet = hit.object.userData.planet
    if (planet) this.emit('select', { id: planet.project.id })
    else this.emit('select-core')
  }

  onZoom(factor) {
    if (this.selected || this.route.name === 'about') return
    this.zoom = clamp(this.zoom * factor, 0.55, 1.7)
  }

  resize = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    this.size = { width, height }
    const pixelRatio = Math.min(window.devicePixelRatio, this.quality.maxPixelRatio)

    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.setSize(width, height, false)
    this.composer.setPixelRatio(pixelRatio)
    this.composer.setSize(width, height)
    this.labelRenderer.setSize(width, height)

    this.camera.aspect = width / height
    // En pantallas verticales abrimos el campo de visión para que quepa el sistema.
    this.camera.fov = this.camera.aspect < 0.8 ? 52 : 40
    this.camera.updateProjectionMatrix()
    this.rig.setSize(width, height)

    this.stars.setPixelRatio(pixelRatio)
    this.dust.setPixelRatio(pixelRatio)
    this.labelsDirty = true
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }))
  }
}

/** Ajustes según el dispositivo: menos partículas y resolución en móviles. */
function detectQuality() {
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = Math.min(window.innerWidth, window.innerHeight) < 600
  const low = coarse || small
  return {
    low,
    maxPixelRatio: low ? 1.5 : 2,
    msaa: !low,
    stars: low ? 2600 : 6000,
    dust: low ? 5000 : 12000,
    coreDetail: low ? 28 : 52,
    planetScale: low ? 1.25 : 1,
  }
}
