/**
 * Rutas del sitio. Se usan hashes (#/...) para que el portafolio funcione en
 * cualquier hosting estático sin configurar redirecciones, y para que cada
 * proyecto tenga un enlace directo que puedas compartir.
 *
 * @typedef {{ name: 'home' | 'projects' | 'project' | 'about' | 'contact', id?: string }} Route
 */
const ROUTES = [
  { name: 'projects', pattern: /^\/proyectos\/?$/ },
  { name: 'project', pattern: /^\/proyecto\/([^/]+)\/?$/ },
  { name: 'about', pattern: /^\/sobre-mi\/?$/ },
  { name: 'contact', pattern: /^\/contacto\/?$/ },
]

/** @returns {Route} */
export function parseRoute(hash) {
  const path = hash.replace(/^#/, '') || '/'
  for (const { name, pattern } of ROUTES) {
    const match = path.match(pattern)
    if (match) return { name, id: match[1] ? safeDecode(match[1]) : undefined }
  }
  return { name: 'home' }
}

export function navigate(path, { replace = false } = {}) {
  const hash = `#${path}`
  if (replace) {
    window.history.replaceState(null, '', hash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else if (window.location.hash !== hash) {
    window.location.hash = hash
  }
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
