import * as THREE from 'three'
import { clamp } from '../utils/math.js'

/** Un click solo cuenta como "tap" si el puntero se movió poco y se soltó rápido. */
const TAP_DISTANCE = 6
const TAP_DURATION = 450

/**
 * Traduce mouse, touch y rueda en datos que la escena consume cada frame:
 * posición del puntero, arrastre acumulado, taps (eventos `tap`) y zoom
 * (eventos `zoom`, con la rueda o pellizcando con dos dedos).
 */
export class PointerInput extends EventTarget {
  constructor(element) {
    super()
    this.element = element
    this.hoverCapable = window.matchMedia('(hover: hover)').matches
    this.ndc = new THREE.Vector2()
    this.inside = false
    this.dragging = false
    this.drag = { x: 0, y: 0 }
    this.pointers = new Map()
    this.press = null
    this.pinchDistance = 0

    element.addEventListener('pointerdown', this.onPointerDown)
    element.addEventListener('wheel', this.onWheel, { passive: false })
    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointercancel', this.onPointerUp)
    document.documentElement.addEventListener('pointerleave', () => {
      this.inside = false
    })
  }

  /** Devuelve el arrastre acumulado desde la última llamada (en píxeles) y lo reinicia. */
  consumeDrag() {
    const { x, y } = this.drag
    this.drag.x = 0
    this.drag.y = 0
    return { x, y }
  }

  setNdc(event) {
    this.ndc.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1)
  }

  onPointerDown = (event) => {
    this.element.setPointerCapture(event.pointerId)
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    this.setNdc(event)
    this.inside = true

    if (this.pointers.size === 1) {
      this.press = { x: event.clientX, y: event.clientY, time: performance.now() }
    } else {
      // Segundo dedo: empieza un pellizco y se cancelan el tap y el arrastre.
      this.press = null
      this.dragging = false
      this.pinchDistance = this.getPinchDistance()
    }
  }

  onPointerMove = (event) => {
    this.setNdc(event)
    const pointer = this.pointers.get(event.pointerId)
    if (!pointer) {
      this.inside = event.target === this.element
      return
    }

    const dx = event.clientX - pointer.x
    const dy = event.clientY - pointer.y
    pointer.x = event.clientX
    pointer.y = event.clientY

    if (this.pointers.size >= 2) {
      const distance = this.getPinchDistance()
      if (this.pinchDistance > 0 && distance > 0) this.emit('zoom', { factor: this.pinchDistance / distance })
      this.pinchDistance = distance
      return
    }

    if (this.press && !this.dragging) {
      const moved = Math.hypot(event.clientX - this.press.x, event.clientY - this.press.y)
      if (moved > TAP_DISTANCE) this.dragging = true
    }
    if (this.dragging) {
      this.drag.x += dx
      this.drag.y += dy
    }
  }

  onPointerUp = (event) => {
    if (!this.pointers.delete(event.pointerId)) return

    const isTap =
      event.type === 'pointerup' && this.press && !this.dragging && performance.now() - this.press.time < TAP_DURATION
    if (isTap) {
      this.setNdc(event)
      this.emit('tap', { ndc: this.ndc.clone() })
    }

    if (this.pointers.size === 0) {
      this.dragging = false
      this.press = null
      this.pinchDistance = 0
      if (event.pointerType !== 'mouse') this.inside = false
    }
  }

  onWheel = (event) => {
    event.preventDefault()
    // deltaMode 1 = líneas (Firefox); lo pasamos a píxeles aproximados.
    const delta = event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY
    this.emit('zoom', { factor: Math.exp(clamp(delta, -120, 120) * 0.0012) })
  }

  getPinchDistance() {
    const [a, b] = this.pointers.values()
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }))
  }
}
