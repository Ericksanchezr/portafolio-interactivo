import { profile } from './profile.js'
import { projects as rawProjects } from './projects.js'
import { slugify } from '../utils/text.js'

/** Colores y formas que se asignan a los proyectos que no definen los suyos. */
const PALETTE = ['#8b7bff', '#36d6ff', '#34e8a4', '#ffb547', '#ff5fa8', '#ff7a59', '#5d8bff']
const SHAPES = ['icosahedron', 'octahedron', 'dodecahedron', 'torusKnot', 'box', 'torus', 'tetrahedron']

export { profile }

/** Proyectos con todos los campos opcionales resueltos. */
export const projects = rawProjects.map((project, index) => ({
  ...project,
  id: project.id || slugify(project.title),
  color: project.color || PALETTE[index % PALETTE.length],
  shape: project.shape || SHAPES[index % SHAPES.length],
  tags: project.tags ?? [],
  highlights: project.highlights ?? [],
  links: project.links ?? {},
}))

if (import.meta.env.DEV) {
  const seen = new Set()
  for (const { id, title } of projects) {
    if (seen.has(id)) console.warn(`[proyectos] El id "${id}" (${title}) está repetido: cada proyecto necesita un id único.`)
    seen.add(id)
  }
}
