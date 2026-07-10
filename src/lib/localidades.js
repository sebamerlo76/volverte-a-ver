// Ciudades y sus barrios. Para sumar una ciudad nueva (ej. Santa Fe) basta
// agregar un objeto acá — no hay que tocar el resto del código.
//
// NOTA: las coordenadas de los barrios son APROXIMADAS (un punto central por
// barrio). Se usan como fallback para ubicar un pin cuando el aviso no tiene
// ubicación exacta, y como centro del radio. El matching de notificaciones por
// barrio es por NOMBRE, así que las coords no necesitan ser exactas. Se pueden
// refinar con el tiempo.
import { CORDOBA_BARRIOS, CORDOBA_CENTER } from './cordoba.js'

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
      'Paracao': [-31.703, -60.476],
    },
  },
  'Crespo': {
    // Barrios del plano oficial 2022 (Municipalidad de Crespo). Coords aproximadas.
    center: [-32.0294, -60.3097],
    barrios: {
      'Centro': [-32.0294, -60.3097],
      'Norte': [-32.018, -60.309],
      'Jardín del Lago': [-32.017, -60.316],
      'San Lorenzo': [-32.022, -60.318],
      'San Miguel': [-32.026, -60.32],
      'Salto': [-32.02, -60.301],
      'Pancho Ramírez': [-32.024, -60.298],
      'Azul': [-32.033, -60.3],
      'San José': [-32.032, -60.296],
      'La Paz': [-32.03, -60.322],
      'San Isidro': [-32.035, -60.323],
      'San Francisco de Asís': [-32.036, -60.318],
      'San Cayetano': [-32.038, -60.312],
      'Guadalupe': [-32.041, -60.304],
      'Del Rosario': [-32.043, -60.315],
      'Área Industrial': [-32.046, -60.3],
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
    // Barrios del plano oficial de San Benito. Coords aproximadas.
    center: [-31.7708, -60.4636],
    barrios: {
      'Centro': [-31.7708, -60.4636],
      'Las Tunas': [-31.7648, -60.4636],
      'Loteo Aguer Cavallo': [-31.7622, -60.4604],
      'San Pedro': [-31.7611, -60.4555],
      'La Loma': [-31.7673, -60.458],
      'San Miguel': [-31.768, -60.4538],
      'Loteo Dobantón': [-31.7708, -60.4498],
      'San Sebastián': [-31.7727, -60.457],
      'La Virgencita II': [-31.7761, -60.4552],
      'Loteo Bizai': [-31.7805, -60.4555],
      'San Martín': [-31.7765, -60.4615],
      'Portal del Sol': [-31.7798, -60.4636],
      'Senger': [-31.7822, -60.4679],
      'Puesta del Sol': [-31.7757, -60.4677],
      'Loteo Furios': [-31.7761, -60.472],
      'Jardines': [-31.7745, -60.4767],
      'Sur': [-31.7708, -60.4705],
      'Loteo Cumini': [-31.768, -60.4734],
      'Altos del Este': [-31.7637, -60.4748],
      'Solvencia': [-31.7659, -60.4677],
      '250 Viviendas': [-31.7622, -60.4668],
    },
  },
  'General Ramírez': {
    // Barrios del plano oficial (Municipalidad de Gral. Ramírez). Coords aproximadas.
    center: [-32.171, -60.208],
    barrios: {
      'Centro': [-32.171, -60.208],
      'Dr. René Favaloro': [-32.165, -60.208],
      'Evita': [-32.1641, -60.2034],
      'San Carlos': [-32.166, -60.198],
      'Pancho Ramírez': [-32.171, -60.2011],
      'Dr. César Paso': [-32.175, -60.2],
      'Madre Teresa': [-32.1797, -60.2022],
      'Las Latas': [-32.177, -60.208],
      'Tanque': [-32.1779, -60.2126],
      'Sagrado Corazón': [-32.176, -60.218],
      'Sur': [-32.171, -60.2149],
      'Malvinas Argentinas': [-32.167, -60.216],
      'Martín Fierro': [-32.1623, -60.2137],
    },
  },
  'Córdoba': {
    // Barrios oficiales de Córdoba capital (KMZ oficial de la Municipalidad).
    center: CORDOBA_CENTER,
    barrios: CORDOBA_BARRIOS,
  },
  // Para sumar otra: copiá un bloque, poné center [lat,lng] y sus barrios.
}

export const NOMBRES_LOCALIDADES = Object.keys(LOCALIDADES)

// Provincia de cada ciudad, para agrupar/ordenar el selector. La provincia "de
// casa" va primero. Al sumar una ciudad nueva, agregala también acá.
const PROVINCIA_POR_CIUDAD = {
  'Paraná': 'Entre Ríos',
  'Crespo': 'Entre Ríos',
  'Colonia Avellaneda': 'Entre Ríos',
  'San Benito': 'Entre Ríos',
  'General Ramírez': 'Entre Ríos',
  'Córdoba': 'Córdoba',
}
export const PROVINCIA_DEFECTO = 'Entre Ríos'
export function provinciaDe(loc) {
  return PROVINCIA_POR_CIUDAD[loc] || 'Otras'
}
// Ciudades ordenadas: la provincia "de casa" primero y el resto alfabético; dentro
// de cada provincia, alfabético.
export function localidadesOrdenadas() {
  const rank = (l) => (provinciaDe(l) === PROVINCIA_DEFECTO ? '0' : '1' + provinciaDe(l)) + '|' + l
  return NOMBRES_LOCALIDADES.slice().sort((a, b) => rank(a).localeCompare(rank(b), 'es'))
}
// Igual pero agrupado: [{ provincia, ciudades: [...] }, ...] en orden.
export function localidadesPorProvincia() {
  const out = []
  for (const l of localidadesOrdenadas()) {
    const p = provinciaDe(l)
    let g = out.find((x) => x.provincia === p)
    if (!g) out.push((g = { provincia: p, ciudades: [] }))
    g.ciudades.push(l)
  }
  return out
}

export function centroDe(loc) {
  return (LOCALIDADES[loc] || LOCALIDADES[LOCALIDAD_DEFECTO]).center
}
export function barriosDe(loc) {
  return (LOCALIDADES[loc] || LOCALIDADES[LOCALIDAD_DEFECTO]).barrios
}
export function nombresBarriosDe(loc) {
  // Alfabético para encontrarlo rápido, pero "Centro" primero (es el más usado).
  return Object.keys(barriosDe(loc)).sort((a, b) => {
    if (a === 'Centro') return -1
    if (b === 'Centro') return 1
    return a.localeCompare(b, 'es')
  })
}
export function coordsDeBarrioEn(loc, barrio) {
  return barriosDe(loc)[barrio] || centroDe(loc)
}

// --- Ciudad recordada (la última que usó el usuario en este dispositivo) ---
// Así un vecino de Crespo no tiene que cambiar el selector cada vez que publica.
const LS_LOCALIDAD = 'chicho_localidad'
export function localidadGuardada() {
  try {
    const v = localStorage.getItem(LS_LOCALIDAD)
    if (v && LOCALIDADES[v]) return v
  } catch (e) {
    /* ignore */
  }
  return LOCALIDAD_DEFECTO
}
export function recordarLocalidad(loc) {
  try {
    if (loc && LOCALIDADES[loc]) localStorage.setItem(LS_LOCALIDAD, loc)
  } catch (e) {
    /* ignore */
  }
}

// Preferencia de ciudad del FEED. A diferencia de la de arriba, acá SÍ se puede
// elegir "Todas" (null). Es una clave aparte para no pisar el default de publicar
// (que siempre tiene que ser una ciudad real).
const LS_FEED_LOC = 'chicho_feed_loc'
export function localidadFeedGuardada() {
  try {
    const v = localStorage.getItem(LS_FEED_LOC)
    if (v === '*') return null // el usuario eligió "Todas"
    if (v && LOCALIDADES[v]) return v
  } catch (e) {
    /* ignore */
  }
  return localidadGuardada() // primera vez: arranca en tu ciudad
}
export function recordarLocalidadFeed(loc) {
  try {
    localStorage.setItem(LS_FEED_LOC, loc && LOCALIDADES[loc] ? loc : '*')
  } catch (e) {
    /* ignore */
  }
}
