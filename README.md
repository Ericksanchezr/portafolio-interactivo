# Portafolio Interactivo 3D — Erick Sánchez

Portafolio personal construido con **Three.js** y **Vite**. Es un sistema orbital: el núcleo del centro te representa a ti y cada proyecto es un planeta en órbita. Al hacer click en un planeta, el sistema gira para presentarlo, la cámara viaja hasta él y se abre su ficha.

## Cómo correrlo

Requisitos: Node.js 18 o superior.

```bash
npm install
npm run dev       # servidor de desarrollo en http://localhost:5173
npm run build     # versión de producción en dist/
npm run preview   # sirve dist/ para revisarla antes de publicar
```

## Agregar un proyecto

Todo el contenido vive en `src/data/`. Para sumar un proyecto, agrega un objeto al arreglo de `src/data/projects.js`:

```js
{
  id: 'mi-proyecto',                  // aparece en la URL: #/proyecto/mi-proyecto
  title: 'Mi Proyecto',
  summary: 'Una línea que lo describa.',
  description: ['Primer párrafo...', 'Segundo párrafo...'],
  highlights: ['Algo de lo que estés orgulloso', 'Admite `código` entre comillas invertidas'],
  tags: ['React', 'Node.js'],
  category: 'Full Stack',
  year: 2026,
  status: 'En desarrollo',            // opcional: se muestra como etiqueta
  links: { demo: 'https://...', repo: 'https://github.com/...' },
  image: 'projects/mi-proyecto.jpg',  // opcional: captura dentro de public/
  color: '#ffb547',                   // opcional: color del planeta
  shape: 'torusKnot',                 // opcional: forma del planeta
  featured: true,                     // opcional: planeta más grande
},
```

Solo `title` es obligatorio. Con eso el sitio crea automáticamente el planeta, su órbita, su etiqueta, su tarjeta en la lista, su ficha y su enlace directo. Si no defines `color` o `shape`, se toman de una paleta.

- **Formas disponibles:** `icosahedron`, `octahedron`, `dodecahedron`, `tetrahedron`, `box`, `sphere`, `torus`, `torusKnot`.
- **Órbitas:** con hasta 4 proyectos cada uno tiene su propio anillo; a partir del quinto se reparten entre 4 anillos sin chocar.
- **Capturas:** guarda las imágenes en `public/projects/` y referéncialas como `projects/archivo.jpg` (sin `/` inicial, para que funcione en cualquier hosting).

## Personalizar tus datos

En `src/data/profile.js` están tu nombre, rol, frase principal, la sección "Sobre mí", tu stack y tus datos de contacto. `vite.config.js` inserta el nombre, el rol y la frase en el `<title>` y en las etiquetas para compartir enlaces, así que no hace falta editarlos en `index.html`.

**Pendiente:** completa `email` y `linkedin` en `contact`. Mientras estén vacíos, en modo desarrollo verás un aviso en la sección Contacto (ese aviso nunca aparece en producción).

## Navegación y controles

| Ruta | Qué muestra |
| --- | --- |
| `#/` | Inicio |
| `#/proyectos` | Lista de proyectos |
| `#/proyecto/<id>` | Ficha de un proyecto (enlace directo para compartir) |
| `#/sobre-mi` | Sobre mí |
| `#/contacto` | Contacto |

- **Arrastrar:** gira el sistema (en vertical cambia la inclinación). Con un proyecto abierto, hace girar su planeta.
- **Rueda o pellizco:** acerca y aleja la cámara.
- **Click en un planeta:** abre su ficha. **Click en el núcleo:** abre "Sobre mí".
- **Teclado:** `←` `→` cambian de proyecto y `Esc` cierra el panel.

## Estructura

```
src/
├── data/               ← tu contenido: perfil y proyectos
├── experience/         ← la escena 3D
│   ├── Experience.js       renderer, vistas de cámara e interacción
│   ├── CameraRig.js        movimiento suave de la cámara
│   ├── PointerInput.js     mouse, touch, rueda y pellizco
│   ├── environment.js      reflejos de neón de los planetas
│   ├── world/              núcleo, planetas, órbitas, estrellas, polvo y cielo
│   └── shaders/            shaders GLSL
├── ui/                 ← capa HTML: hero, fichas, "Sobre mí" y contacto
├── app/router.js       ← rutas con hash
└── styles/main.css
```

## Publicarlo

El build usa rutas relativas y navegación con hash, así que funciona en cualquier hosting estático sin configuración extra:

- **Vercel** (como tu simulador de inversiones): importa el repositorio; Vercel detecta Vite solo (build `npm run build`, salida `dist`).
- **Netlify** o **GitHub Pages:** publica la carpeta `dist/`.

## Rendimiento y accesibilidad

- three.js se descarga en un archivo aparte (~155 kB comprimido) mientras se muestra la pantalla de carga; la interfaz pesa ~13 kB.
- En móviles se reducen las partículas y la resolución, y se desactiva el antialiasing por MSAA.
- Respeta la preferencia de movimiento reducido del sistema.
- Sin WebGL el sitio sigue funcionando: todo el contenido está en los paneles.
