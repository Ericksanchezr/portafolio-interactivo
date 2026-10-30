import { icons } from './icons.js'
import { escapeHTML, firstName, pad, prettyUrl, richText } from '../utils/text.js'

const DESKTOP_QUERY = '(min-width: 900px)'
/** Duración del fundido al cambiar el contenido del panel (coincide con el CSS). */
const SWAP_MS = 220

/**
 * Capa HTML del sitio: hero, navegación y panel con el contenido de cada ruta.
 * Emite eventos que main.js conecta con el router y con la escena 3D:
 * - `close`: cerrar el panel (botón × o tecla Escape).
 * - `step`: { direction } ir al proyecto anterior (-1) o siguiente (1) con las flechas.
 * - `highlight`: { id | null } el puntero o el foco está sobre la tarjeta de un proyecto.
 */
export class UI extends EventTarget {
  constructor({ profile, projects, reducedMotion = false }) {
    super()
    this.profile = profile
    this.projects = projects
    this.reducedMotion = reducedMotion
    this.route = { name: 'home' }
    this.panelKey = null
    this.swapTimer = 0
    this.desktop = window.matchMedia(DESKTOP_QUERY)

    const $ = (selector) => document.querySelector(selector)
    this.el = {
      header: $('[data-header]'),
      hero: $('[data-hero]'),
      heroTitle: $('[data-hero-title]'),
      panel: $('[data-panel]'),
      panelScroll: $('[data-panel-scroll]'),
      panelContent: $('[data-panel-content]'),
      panelClose: $('[data-panel-close]'),
      navLinks: [...document.querySelectorAll('[data-nav]')],
      hintText: $('[data-hint-text]'),
      count: $('[data-count]'),
      social: $('[data-social]'),
      year: $('[data-year]'),
    }

    this.renderStatic()
    this.bindEvents()
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }))
  }

  renderStatic() {
    const { name } = this.profile
    const words = name.trim().split(/\s+/)
    // El nombre se parte en dos líneas ("Erick A." / "Sanchez R.") que se animan por separado;
    // la segunda lleva el degradado. El nombre completo queda para lectores de pantalla.
    const split = Math.ceil(words.length / 2)
    const lines = words.length > 1 ? [words.slice(0, split), words.slice(split)] : [words]
    this.el.heroTitle.innerHTML =
      `<span class="sr-only">${escapeHTML(name)}</span>` +
      lines
        .map((line, index) => {
          const accent = lines.length > 1 && index === lines.length - 1 ? ' hero__word--accent' : ''
          return `<span class="hero__line" aria-hidden="true"><span class="hero__word${accent}" style="--i: ${index}">${escapeHTML(line.join(' '))}</span></span>`
        })
        .join('')

    this.el.year.textContent = String(new Date().getFullYear())

    const total = this.projects.length
    this.el.count.innerHTML = `<strong>${pad(total)}</strong> ${total === 1 ? 'proyecto' : 'proyectos'} en órbita`

    const touch = window.matchMedia('(hover: none)').matches
    this.el.hintText.textContent = touch
      ? 'Desliza para girar · Toca un planeta'
      : 'Arrastra para girar · Click en un planeta'

    this.el.social.innerHTML = this.contactItems()
      .map((item) => `<a href="${escapeHTML(item.href)}" aria-label="${item.label}"${externalAttrs(item)}>${item.icon}</a>`)
      .join('')
  }

  bindEvents() {
    this.el.panelClose.addEventListener('click', () => this.emit('close'))

    document.addEventListener('keydown', (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'Escape' && this.route.name !== 'home') this.emit('close')
      if (this.route.name === 'project' && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        this.emit('step', { direction: event.key === 'ArrowRight' ? 1 : -1 })
      }
    })

    // Pasar el puntero (o el foco del teclado) por una tarjeta resalta su planeta.
    const highlightFrom = (event) => {
      const card = event.target.closest?.('[data-project-id]')
      this.emit('highlight', { id: card?.dataset.projectId ?? null })
    }
    const clearHighlight = () => this.emit('highlight', { id: null })
    this.el.panelContent.addEventListener('pointerover', highlightFrom)
    this.el.panelContent.addEventListener('focusin', highlightFrom)
    this.el.panelContent.addEventListener('pointerleave', clearHighlight)
    this.el.panelContent.addEventListener('focusout', clearHighlight)
  }

  setRoute(route) {
    this.route = route
    document.body.dataset.route = route.name

    for (const link of this.el.navLinks) {
      const section = link.dataset.nav
      const active = section === route.name || (section === 'projects' && route.name === 'project')
      link.classList.toggle('is-active', active)
      if (active) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    }

    if (route.name === 'home') {
      this.closePanel()
      return
    }

    const key = route.id ? `${route.name}:${route.id}` : route.name
    if (key !== this.panelKey) this.openPanel(key, this.renderPanel(route))
  }

  /** Resalta la tarjeta del proyecto cuyo planeta tiene el mouse encima. */
  setHighlighted(id) {
    for (const card of this.el.panelContent.querySelectorAll('[data-project-id]')) {
      card.classList.toggle('is-hovered', card.dataset.projectId === id)
    }
  }

  /** Espacio (px) que ocupa la interfaz sobre la escena, para que la cámara encuadre el resto. */
  getInsets() {
    const width = window.innerWidth
    const height = window.innerHeight
    const top = this.el.header.offsetHeight
    const desktop = this.desktop.matches

    if (this.route.name === 'home') {
      return desktop
        ? { top, right: 0, bottom: 0, left: Math.min(this.el.hero.offsetWidth * 0.92, width * 0.48) }
        : { top, right: 0, bottom: Math.min(this.el.hero.offsetHeight * 0.85, height * 0.55), left: 0 }
    }

    const { panel } = this.el
    return desktop
      ? { top, right: panel.offsetWidth + 24, bottom: 0, left: 0 }
      : { top, right: 0, bottom: panel.offsetHeight + 8, left: 0 }
  }

  /** Quita la pantalla de carga y arranca las animaciones de entrada. */
  reveal() {
    document.body.classList.add('is-ready')
    window.setTimeout(() => document.querySelector('[data-loader]')?.remove(), 1200)
  }

  openPanel(key, { html, accent }) {
    const { panel, panelContent, panelScroll } = this.el
    const wasOpen = panel.classList.contains('is-open')
    this.panelKey = key
    window.clearTimeout(this.swapTimer)

    const show = () => {
      panelContent.innerHTML = html
      panelScroll.scrollTop = 0
      if (accent) panel.style.setProperty('--accent', accent)
      else panel.style.removeProperty('--accent')
      panel.classList.remove('is-swapping')
      panel.querySelector('[data-panel-heading]')?.focus({ preventScroll: true })
    }

    panel.inert = false
    panel.setAttribute('aria-hidden', 'false')
    if (wasOpen && !this.reducedMotion) {
      panel.classList.add('is-swapping')
      this.swapTimer = window.setTimeout(show, SWAP_MS)
    } else {
      show()
      panel.classList.add('is-open')
    }
  }

  closePanel() {
    window.clearTimeout(this.swapTimer)
    this.panelKey = null
    const { panel } = this.el
    panel.classList.remove('is-open', 'is-swapping')
    panel.inert = true
    panel.setAttribute('aria-hidden', 'true')
  }

  renderPanel(route) {
    if (route.name === 'project') {
      const project = this.projects.find((item) => item.id === route.id)
      return { html: this.renderProject(project), accent: project.color }
    }
    if (route.name === 'about') return { html: this.renderAbout() }
    if (route.name === 'contact') return { html: this.renderContact() }
    return { html: this.renderProjects() }
  }

  renderProjects() {
    const cards = this.projects
      .map(
        (project, index) => `
        <li>
          <a class="card" href="#/proyecto/${encodeURIComponent(project.id)}" data-project-id="${escapeHTML(project.id)}" style="--accent: ${escapeHTML(project.color)}">
            <span class="card__index">${pad(index + 1)}</span>
            <span class="card__body">
              <span class="card__title">${escapeHTML(project.title)}</span>
              <span class="card__meta">${escapeHTML([project.category, project.year].filter(Boolean).join(' · '))}</span>
              ${project.summary ? `<span class="card__summary">${escapeHTML(project.summary)}</span>` : ''}
            </span>
            <span class="card__arrow">${icons.arrowRight}</span>
          </a>
        </li>`,
      )
      .join('')

    return `
      <p class="eyebrow">Proyectos · ${pad(this.projects.length)}</p>
      <h2 class="panel-title" id="panel-heading" tabindex="-1" data-panel-heading>Lo que he construido</h2>
      <p class="panel-lead">Cada planeta del sistema es un proyecto. Elige uno de la lista o haz click directamente sobre él en la escena.</p>
      <ol class="cards">${cards}</ol>`
  }

  renderProject(project) {
    const index = this.projects.indexOf(project)
    const total = this.projects.length
    const previous = this.projects[(index - 1 + total) % total]
    const next = this.projects[(index + 1) % total]
    const meta = [project.category, project.year].filter(Boolean)
    const paragraphs = [].concat(project.description ?? project.summary ?? [])

    const links = [
      project.links.demo &&
        `<a class="btn btn--primary" href="${escapeHTML(project.links.demo)}" target="_blank" rel="noopener noreferrer">Ver demo ${icons.arrowUpRight}</a>`,
      project.links.repo &&
        `<a class="btn btn--ghost" href="${escapeHTML(project.links.repo)}" target="_blank" rel="noopener noreferrer">${icons.github} Código</a>`,
    ].filter(Boolean)

    return `
      <p class="eyebrow eyebrow--accent">
        <span>${pad(index + 1)} / ${pad(total)}</span>
        ${meta.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}
      </p>
      <h2 class="panel-title" id="panel-heading" tabindex="-1" data-panel-heading>${escapeHTML(project.title)}</h2>
      ${project.status ? `<p class="status"><span class="status__dot" aria-hidden="true"></span>${escapeHTML(project.status)}</p>` : ''}
      ${
        project.image
          ? `<figure class="media"><img src="${escapeHTML(project.image)}" alt="Captura de ${escapeHTML(project.title)}" loading="lazy" /></figure>`
          : ''
      }
      ${paragraphs.map((text) => `<p class="prose">${richText(text)}</p>`).join('')}
      ${
        project.highlights.length
          ? `<h3 class="section-label">Destacados</h3>
             <ul class="highlights">${project.highlights.map((item) => `<li>${richText(item)}</li>`).join('')}</ul>`
          : ''
      }
      ${
        project.tags.length
          ? `<h3 class="section-label">Tecnologías</h3>
             <ul class="tags">${project.tags.map((tag) => `<li class="tag">${escapeHTML(tag)}</li>`).join('')}</ul>`
          : ''
      }
      ${links.length ? `<div class="actions">${links.join('')}</div>` : ''}
      ${
        total > 1
          ? `<nav class="pager" aria-label="Otros proyectos">
              <a class="pager__link" href="#/proyecto/${encodeURIComponent(previous.id)}">
                <span class="pager__dir">${icons.chevronLeft} Anterior</span>
                <span class="pager__title">${escapeHTML(previous.title)}</span>
              </a>
              <a class="pager__link pager__link--next" href="#/proyecto/${encodeURIComponent(next.id)}">
                <span class="pager__dir">Siguiente ${icons.chevronRight}</span>
                <span class="pager__title">${escapeHTML(next.title)}</span>
              </a>
            </nav>`
          : ''
      }`
  }

  renderAbout() {
    const { about = [], skills = [], role, name } = this.profile
    const groups = skills
      .map(
        (group) => `
        <div class="skills__group">
          <h4 class="skills__title">${escapeHTML(group.group)}</h4>
          <ul class="tags">${group.items.map((item) => `<li class="tag">${escapeHTML(item)}</li>`).join('')}</ul>
        </div>`,
      )
      .join('')

    return `
      <p class="eyebrow">Sobre mí</p>
      <h2 class="panel-title" id="panel-heading" tabindex="-1" data-panel-heading>Hola, soy ${escapeHTML(firstName(name))}.</h2>
      <p class="panel-lead">${escapeHTML(role)}</p>
      ${about.map((text) => `<p class="prose">${richText(text)}</p>`).join('')}
      ${groups ? `<h3 class="section-label">Stack</h3><div class="skills">${groups}</div>` : ''}
      <div class="actions">
        <a class="btn btn--primary" href="#/proyectos">Ver proyectos ${icons.arrowRight}</a>
        <a class="btn btn--ghost" href="#/contacto">Contacto</a>
      </div>`
  }

  renderContact() {
    const items = this.contactItems()
    const missing = [!this.profile.contact?.email && 'tu correo', !this.profile.contact?.linkedin && 'tu LinkedIn'].filter(
      Boolean,
    )

    return `
      <p class="eyebrow">Contacto</p>
      <h2 class="panel-title" id="panel-heading" tabindex="-1" data-panel-heading>Hablemos</h2>
      <p class="panel-lead">${escapeHTML(this.profile.contactText)}</p>
      <ul class="contact-list">
        ${items
          .map(
            (item) => `
          <li>
            <a class="contact-link" href="${escapeHTML(item.href)}"${externalAttrs(item)}>
              <span class="contact-link__icon">${item.icon}</span>
              <span class="contact-link__text">
                <span class="contact-link__label">${item.label}</span>
                <span class="contact-link__value">${escapeHTML(item.value)}</span>
              </span>
              <span class="contact-link__arrow">${icons.arrowUpRight}</span>
            </a>
          </li>`,
          )
          .join('')}
      </ul>
      ${
        // Recordatorio que solo aparece mientras desarrollas (npm run dev), nunca en producción.
        import.meta.env.DEV && missing.length
          ? `<p class="dev-note">Solo visible en desarrollo: agrega ${missing.join(' y ')} en <code>src/data/profile.js</code>.</p>`
          : ''
      }`
  }

  contactItems() {
    const { email, linkedin, github } = this.profile.contact ?? {}
    return [
      email && { label: 'Correo', value: email, href: `mailto:${email}`, icon: icons.mail, external: false },
      linkedin && { label: 'LinkedIn', value: prettyUrl(linkedin), href: linkedin, icon: icons.linkedin, external: true },
      github && { label: 'GitHub', value: prettyUrl(github), href: github, icon: icons.github, external: true },
    ].filter(Boolean)
  }
}

const externalAttrs = (item) => (item.external ? ' target="_blank" rel="noopener noreferrer"' : '')
