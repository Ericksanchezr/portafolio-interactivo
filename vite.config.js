import { defineConfig } from 'vite'
import { profile } from './src/data/profile.js'
import { escapeHTML, initials } from './src/utils/text.js'

/**
 * Reemplaza {{name}}, {{role}}, {{tagline}} e {{initials}} en index.html con los
 * datos de src/data/profile.js. Así el título, la descripción y el hero existen
 * en el HTML desde el primer byte (útil para SEO y para las vistas previas al
 * compartir el enlace), sin duplicar tus datos en dos lugares.
 */
function profileHtml() {
  const values = {
    name: profile.name,
    role: profile.role,
    tagline: profile.tagline,
    initials: initials(profile.name),
  }

  return {
    name: 'profile-html',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in values ? escapeHTML(values[key]) : match)),
    },
  }
}

export default defineConfig({
  // Rutas relativas: el build funciona en la raíz de un dominio o en una subcarpeta (p. ej. GitHub Pages).
  base: './',
  plugins: [profileHtml()],
  build: {
    // three.js por sí solo pesa ~700 kB sin comprimir; evitamos el aviso de tamaño.
    chunkSizeWarningLimit: 1000,
  },
})
