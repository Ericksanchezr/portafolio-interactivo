/**
 * Generador pseudoaleatorio con semilla (mulberry32). Con la misma semilla
 * produce siempre la misma secuencia, así las estrellas y el polvo quedan
 * idénticos en cada visita.
 */
export function createRandom(seed = 1) {
  let state = seed >>> 0
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
