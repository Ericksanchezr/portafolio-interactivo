export const TAU = Math.PI * 2

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/** Interpolación exponencial independiente del framerate (suaviza hacia `target`). */
export const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt))

/** Diferencia angular más corta para ir de `from` a `to`, en el rango (-π, π]. */
export const angleDelta = (from, to) => {
  const delta = (to - from) % TAU
  if (delta > Math.PI) return delta - TAU
  if (delta <= -Math.PI) return delta + TAU
  return delta
}

/** Como `damp`, pero para ángulos: siempre gira por el camino más corto. */
export const dampAngle = (current, target, lambda, dt) =>
  current + angleDelta(current, target) * (1 - Math.exp(-lambda * dt))
