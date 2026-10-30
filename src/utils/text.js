const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escapa texto para insertarlo de forma segura en HTML. */
export const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ENTITIES[char])

/** Escapa el texto y convierte `código` (entre comillas invertidas) en <code>. */
export const richText = (value = '') => escapeHTML(value).replace(/`([^`]+)`/g, '<code>$1</code>')

/** 3 → "03" */
export const pad = (value) => String(value).padStart(2, '0')

/** "Erick A. Sanchez R." → "ES" (se saltan las iniciales sueltas como "A.") */
export const initials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const fullWords = words.filter((word) => !/^\p{L}\.?$/u.test(word))
  return (fullWords.length ? fullWords : words)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

/** "Erick Sánchez" → "Erick" */
export const firstName = (name = '') => name.trim().split(/\s+/)[0] ?? ''

/** "https://www.github.com/usuario/" → "github.com/usuario" */
export const prettyUrl = (url = '') => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

/** "Mi Proyecto Ñandú" → "mi-proyecto-nandu" */
export const slugify = (text = '') =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
