// Compat de Paraná: se apoya en localidades.js (fuente única de ciudades/barrios).
// Los componentes que ya usaban BARRIOS/NOMBRES_BARRIOS/coordsDeBarrio siguen andando.
import { LOCALIDADES, LOCALIDAD_DEFECTO, centroDe, coordsDeBarrioEn, nombresBarriosDe } from './localidades.js'

export const PARANA_CENTER = centroDe('Paraná')
export const BARRIOS = LOCALIDADES['Paraná'].barrios
export const NOMBRES_BARRIOS = nombresBarriosDe('Paraná')

export function coordsDeBarrio(barrio) {
  return coordsDeBarrioEn('Paraná', barrio)
}

// Punto de un aviso: su ubicación exacta si la tiene, si no el centro del barrio (según su localidad).
export function puntoDeReporte(r) {
  if (r && r.lat != null && r.lng != null) return [r.lat, r.lng]
  return coordsDeBarrioEn(r?.localidad || LOCALIDAD_DEFECTO, r?.zona)
}
