// Ciudades y sus barrios. Para sumar una ciudad nueva (ej. Santa Fe) basta
// agregar un objeto acá — no hay que tocar el resto del código.
//
// NOTA: las coordenadas de los barrios son APROXIMADAS (un punto central por
// barrio). Se usan como fallback para ubicar un pin cuando el aviso no tiene
// ubicación exacta, y como centro del radio. El matching de notificaciones por
// barrio es por NOMBRE, así que las coords no necesitan ser exactas. Se pueden
// refinar con el tiempo.
export const LOCALIDAD_DEFECTO = 'Paraná'

export const LOCALIDADES = {
  'Paraná': {
    center: [-31.7405, -60.523],
    barrios: {
      'Centro': [-31.7333, -60.5238],
      'Parque Urquiza': [-31.7285, -60.5305],
      'Puerto Viejo': [-31.726, -60.531],
      'Puerto Nuevo': [-31.72, -60.524],
      'San Agustín': [-31.755, -60.503],
      'Bajada Grande': [-31.756, -60.548],
      'Villa Sarmiento': [-31.744, -60.516],
      'Belgrano': [-31.742, -60.528],
      'La Floresta': [-31.76, -60.52],
      'San Martín': [-31.745, -60.51],
      'Villa Almendral': [-31.75, -60.522],
      'Mosconi': [-31.762, -60.51],
      'Toma Vieja': [-31.715, -60.505],
      'Thompson': [-31.735, -60.512],
      'El Sol': [-31.768, -60.508],
      'Los Berros': [-31.758, -60.5],
      'San Roque': [-31.748, -60.5],
      'Anacleto Medina': [-31.708, -60.498],
      '25 de Mayo': [-31.74, -60.519],
      'Humberto Primo': [-31.752, -60.515],
      'Paraná V': [-31.77, -60.525],
      'Villa Uranga': [-31.766, -60.5],
      'La Milagrosa': [-31.755, -60.49],
    },
  },
  'Crespo': {
    center: [-32.0294, -60.3097],
    barrios: {
      'Centro': [-32.0294, -60.3097],
      'Norte': [-32.0205, -60.3097],
      'Sur': [-32.0385, -60.3097],
      'Este': [-32.0294, -60.2985],
      'Oeste': [-32.0294, -60.321],
      'Parque Industrial': [-32.045, -60.30],
    },
  },
  'Colonia Avellaneda': {
    center: [-31.76, -60.485],
    barrios: {
      'Centro': [-31.76, -60.485],
      'Norte': [-31.752, -60.485],
      'Sur': [-31.768, -60.485],
      'Este': [-31.76, -60.476],
      'Oeste': [-31.76, -60.494],
    },
  },
  'San Benito': {
    center: [-31.7708, -60.4636],
    barrios: {
      'Centro': [-31.7708, -60.4636],
      'Norte': [-31.762, -60.4636],
      'Sur': [-31.78, -60.4636],
      'Este': [-31.7708, -60.454],
      'Oeste': [-31.7708, -60.473],
    },
  },
  // Para sumar otra: copiá un bloque, poné center [lat,lng] y sus barrios.
}

export const NOMBRES_LOCALIDADES = Object.keys(LOCALIDADES)

export function centroDe(loc) {
  return (LOCALIDADES[loc] || LOCALIDADES[LOCALIDAD_DEFECTO]).center
}
export function barriosDe(loc) {
  return (LOCALIDADES[loc] || LOCALIDADES[LOCALIDAD_DEFECTO]).barrios
}
export function nombresBarriosDe(loc) {
  return Object.keys(barriosDe(loc))
}
export function coordsDeBarrioEn(loc, barrio) {
  return barriosDe(loc)[barrio] || centroDe(loc)
}
