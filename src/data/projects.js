/**
 * Proyectos del portafolio. Cada objeto de esta lista se convierte en un planeta
 * con su órbita, su etiqueta y su ficha. El orden de la lista es el orden en que
 * se numeran (01, 02, 03...).
 *
 * Para agregar un proyecto, copia uno de los objetos y cambia sus datos.
 * Solo `title` es obligatorio; todo lo demás es opcional.
 *
 * @typedef {Object} Project
 * @property {string} title                   Nombre del proyecto.
 * @property {string} [id]                    Identificador para la URL (#/proyecto/<id>). Si falta, se genera desde el título.
 * @property {string} [summary]               Resumen de una línea para la lista de proyectos.
 * @property {string|string[]} [description]  Descripción; usa un arreglo para varios párrafos.
 * @property {string[]} [highlights]          Puntos destacados. Admite `código` entre comillas invertidas.
 * @property {string[]} [tags]                Tecnologías usadas.
 * @property {string} [category]              Ej. 'Full Stack', 'Web 3D'.
 * @property {number|string} [year]
 * @property {string} [status]                Ej. 'En desarrollo'. Se muestra como etiqueta en la ficha.
 * @property {{ demo?: string, repo?: string }} [links]
 * @property {string} [image]                 Captura dentro de /public, sin "/" inicial. Ej. 'projects/mi-app.jpg'.
 * @property {string} [color]                 Color del planeta (hex). Si falta, se toma uno de la paleta.
 * @property {'icosahedron'|'octahedron'|'dodecahedron'|'tetrahedron'|'box'|'sphere'|'torus'|'torusKnot'} [shape]
 * @property {boolean} [featured]             Planeta un poco más grande.
 */

/** @type {Project[]} */
export const projects = [
  {
    id: 'panel-de-tareas',
    title: 'Panel de Tareas',
    summary: 'Tablero Kanban que unifica Jira y Azure DevOps, con un asistente de IA basado en Claude.',
    description: [
      'Dashboard que centraliza el trabajo repartido entre Jira (issues de producto) y Azure DevOps (work items de ingeniería), enlaza la documentación de Confluence y suma un asistente con Claude que resume tareas y sugiere cómo dividirlas en subtareas.',
      'Un backend intermedio (BFF) en Express + TypeScript guarda las credenciales en el servidor y normaliza ambas fuentes a un modelo de tarea único, para que el tablero las trate igual sin importar de dónde vienen.',
    ],
    highlights: [
      'Backend BFF: los tokens de Jira, Azure DevOps y Confluence nunca llegan al navegador.',
      'Modelo `Task` unificado: consultas JQL y WIQL normalizadas a las 4 columnas del Kanban.',
      'Asistente con la API de Claude que muestra el modelo usado y los tokens de entrada y salida de cada llamada.',
      'Modo demo con datos de ejemplo cuando no hay credenciales configuradas.',
      'Pipeline de CI en Azure Pipelines que compila frontend y backend en cada PR.',
    ],
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express', 'Claude API', 'Jira API', 'Azure DevOps', 'Confluence API'],
    category: 'Full Stack · IA',
    year: 2026,
    color: '#36d6ff',
    shape: 'octahedron',
    featured: true,
  },
  {
    id: 'simulador-inversiones',
    title: 'Simulador de Inversiones',
    summary: 'SPA para simular un portafolio de inversiones y API REST con autenticación JWT y roles.',
    description: [
      'Prueba técnica full stack resuelta en dos partes. El frontend es una SPA en React + Vite + Tailwind que muestra las inversiones de un cliente (activo, tipo, monto, rentabilidad y fecha), con tarjetas de resumen y un formulario para agregar nuevas.',
      'El backend es una mini API RESTful en Node.js + Express para registrar y consultar inversiones, con autenticación JWT y control de acceso por roles.',
    ],
    highlights: [
      'Frontend desplegado en Vercel con deploy automático en cada push a `main`.',
      'Autenticación con JWT y contraseñas hasheadas con bcrypt.',
      'Middlewares de autorización por rol: `admin` y `analyst`.',
      'Arquitectura en capas: rutas → controladores → servicios.',
      'Colección de Postman para probar todos los endpoints.',
    ],
    tags: ['React', 'Vite', 'Tailwind CSS', 'Node.js', 'Express', 'JWT', 'bcrypt', 'Vercel'],
    category: 'Full Stack · Fintech',
    year: 2026,
    links: {
      demo: 'https://frontend-two-lyart-pm1lgeulzd.vercel.app',
      repo: 'https://github.com/Ericksanchezr/simulador-formulario-inversion',
    },
    color: '#34e8a4',
    shape: 'dodecahedron',
  },
  {
    id: 'portafolio-3d',
    title: 'Portafolio Interactivo 3D',
    summary: 'Este sitio: un sistema orbital en Three.js donde cada planeta es un proyecto.',
    description: [
      'Portafolio construido desde cero con Three.js y shaders GLSL propios. El núcleo es una esfera que se deforma con ruido simplex en tiempo real, cada proyecto orbita como un planeta y la cámara viaja entre ellos.',
      'Todo el contenido sale de un archivo de datos: agregar un proyecto nuevo es agregar un objeto a una lista, y el sistema crea su planeta, su órbita y su ficha automáticamente.',
    ],
    highlights: [
      'Shaders propios: núcleo con ruido simplex, cielo nebular, estrellas y polvo galáctico animados en la GPU.',
      'Cámara cinemática con transiciones suaves y enlaces directos a cada proyecto (`#/proyecto/...`).',
      'Post-procesado con bloom y etiquetas HTML ancladas a objetos 3D.',
      'Responsive, navegable con teclado y con soporte para movimiento reducido.',
    ],
    tags: ['Three.js', 'JavaScript', 'GLSL', 'Vite'],
    category: 'Web 3D · Creative coding',
    year: 2026,
    status: 'En desarrollo',
    links: {
      repo: 'https://github.com/Ericksanchezr/portafolio-interactivo',
    },
    color: '#8b7bff',
    shape: 'icosahedron',
  },
]
