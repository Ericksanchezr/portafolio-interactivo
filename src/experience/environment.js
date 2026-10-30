import * as THREE from 'three'

/** Paneles de luz [color, intensidad, posición, ancho, alto] que se reflejan en los planetas. */
const PANELS = [
  ['#8b7bff', 3, [-6, 5, 4], 6, 3],
  ['#5fe1ff', 2.4, [6, 2, 5], 5, 2],
  ['#ff5ccf', 1.6, [0, -5, -6], 8, 2],
  ['#ffffff', 0.9, [0, 8, 0], 4, 4],
  ['#3d5bff', 1.4, [-5, -1, -5], 4, 4],
]

/**
 * Mapa de entorno para los reflejos: un cuarto oscuro con luces de neón en los
 * colores del sitio. Así las caras planas de los planetas reflejan violeta y
 * cian en lugar de quemarse a blanco, como pasaría con un entorno de estudio.
 */
export function createNeonEnvironment(renderer) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#05060f')

  for (const [color, intensity, position, width, height] of PANELS) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    )
    panel.position.set(...position)
    panel.lookAt(0, 0, 0)
    scene.add(panel)
  }

  const pmrem = new THREE.PMREMGenerator(renderer)
  const texture = pmrem.fromScene(scene, 0.04).texture
  pmrem.dispose()
  scene.traverse((object) => {
    object.geometry?.dispose()
    object.material?.dispose()
  })
  return texture
}
