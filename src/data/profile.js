/**
 * Tus datos personales. Todo el texto del hero, de "Sobre mí" y de "Contacto"
 * sale de aquí, así que para personalizar el sitio basta con editar este archivo.
 */
export const profile = {
  name: 'Erick A. Sanchez R.',
  role: 'Desarrollador Full Stack',
  tagline:
    'Construyo aplicaciones web de punta a punta: interfaces en React, APIs en Node.js e integraciones con IA.',

  // Párrafos de la sección "Sobre mí". Admite `código` entre comillas invertidas.
  about: [
    'Soy desarrollador full stack. Disfruto construir productos completos: desde la interfaz en React y TypeScript hasta la API en Node.js que la sostiene, pasando por integraciones con servicios como Jira, Azure DevOps o la API de Claude.',
    'Este portafolio es un espacio vivo: cada planeta es un proyecto y el sistema crece a medida que construyo cosas nuevas.',
  ],

  skills: [
    { group: 'Frontend', items: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Vite', 'Three.js'] },
    { group: 'Backend', items: ['Node.js', 'Express', 'APIs REST', 'JWT y roles'] },
    { group: 'Integraciones e IA', items: ['Claude API', 'Jira', 'Azure DevOps', 'Confluence'] },
    { group: 'Herramientas', items: ['Git', 'GitHub', 'Vercel', 'Azure Pipelines', 'Postman'] },
  ],

  contactText: '¿Tienes un proyecto en mente o una vacante que encaje con mi perfil? Escríbeme y hablemos.',

  // Deja en '' lo que no quieras mostrar; solo aparecen los campos con valor.
  contact: {
    email: 'ericksanchezr09@gmail.com',
    linkedin: '',
    github: 'https://github.com/Ericksanchezr',
  },
}
