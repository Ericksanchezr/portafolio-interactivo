import './styles/main.css'
import { profile, projects } from './data/index.js'
import { navigate, parseRoute } from './app/router.js'
import { UI } from './ui/UI.js'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const ui = new UI({ profile, projects, reducedMotion })

/** @type {import('./experience/Experience.js').Experience | null} */
let experience = null

const PAGE_TITLES = { projects: 'Proyectos', about: 'Sobre mí', contact: 'Contacto' }

function applyRoute() {
  const route = parseRoute(window.location.hash)
  const project = route.name === 'project' ? projects.find((item) => item.id === route.id) : null

  // Enlace a un proyecto que ya no existe: mandamos a la lista.
  if (route.name === 'project' && !project) {
    navigate('/proyectos', { replace: true })
    return
  }

  ui.setRoute(route)
  const section = project?.title ?? PAGE_TITLES[route.name]
  document.title = section ? `${section} — ${profile.name}` : `${profile.name} — ${profile.role}`

  experience?.setRoute(route)
  experience?.setInsets(ui.getInsets())
}

function stepProject(direction) {
  // Se lee el hash actual (no ui.route) para que dos pulsaciones rápidas avancen dos proyectos.
  const { id } = parseRoute(window.location.hash)
  const index = projects.findIndex((item) => item.id === id)
  const next = projects[(index + direction + projects.length) % projects.length]
  navigate(`/proyecto/${next.id}`)
}

ui.addEventListener('close', () => navigate(ui.route.name === 'project' ? '/proyectos' : '/'))
ui.addEventListener('step', (event) => stepProject(event.detail.direction))
ui.addEventListener('highlight', (event) => experience?.setHighlight(event.detail.id))

window.addEventListener('hashchange', applyRoute)

// El encuadre depende del tamaño real del hero y del panel, que cambia al
// redimensionar la ventana y también cuando termina de cargar la tipografía.
const updateInsets = () => experience?.setInsets(ui.getInsets())
window.addEventListener('resize', updateInsets)
const layoutObserver = new ResizeObserver(updateInsets)
for (const element of [ui.el.header, ui.el.hero, ui.el.panel]) layoutObserver.observe(element)

function supportsWebGL() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'))
  } catch {
    return false
  }
}

async function start() {
  if (supportsWebGL()) {
    try {
      // three.js se descarga en un archivo aparte, así la interfaz no lo espera.
      const { Experience } = await import('./experience/Experience.js')
      experience = new Experience({
        canvas: document.querySelector('[data-webgl]'),
        labelLayer: document.querySelector('[data-labels]'),
        projects,
        reducedMotion,
      })
      experience.addEventListener('select', (event) => navigate(`/proyecto/${event.detail.id}`))
      experience.addEventListener('select-core', () => navigate('/sobre-mi'))
      experience.addEventListener('hover', (event) => ui.setHighlighted(event.detail.id))
      applyRoute()
      await experience.start()
    } catch (error) {
      console.error('No se pudo iniciar la escena 3D:', error)
      experience?.stop()
      experience = null
    }
  }

  // Sin WebGL el sitio sigue funcionando: los paneles muestran todo el contenido.
  if (!experience) document.body.classList.add('no-webgl')
  applyRoute()
  ui.reveal()
}

start()
