import simplexNoise from './simplexNoise.glsl?raw'

/** Sustituye `#include <simplex_noise>` por la función de ruido en un shader. */
export const withNoise = (source) => source.replace('#include <simplex_noise>', simplexNoise)
