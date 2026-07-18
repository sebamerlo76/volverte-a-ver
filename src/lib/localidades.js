// Ciudades y sus barrios. Para sumar una ciudad nueva (ej. Santa Fe) basta
// agregar un objeto acá — no hay que tocar el resto del código.
//
// NOTA: las coordenadas de los barrios son un punto por barrio, no un polígono —
// no hay límites en ningún lado. Se usan para ubicar el pin cuando el aviso no
// trae ubicación exacta, y para proponer el barrio de un punto (barrioMasCercano).
// El matching de notificaciones es por NOMBRE, no por geometría.
//
// Las de las ciudades bajadas de OSM son buenas (un nodo real por barrio); las
// cargadas a mano son aproximadas. Se puede ver cuál es cuál por el tamaño de la
// lista: OSM da decenas o cientos, a mano dan 5 (Centro/Norte/Sur/Este/Oeste).
import { CORDOBA_BARRIOS, CORDOBA_CENTER } from './cordoba.js'
import { NEUQUEN_BARRIOS, NEUQUEN_CENTER } from './neuquen.js'
import { OLAVARRIA_BARRIOS, OLAVARRIA_CENTER } from './olavarria.js'
import { SANTAFE_BARRIOS, SANTAFE_CENTER } from './santafe.js'
import { RAFAELA_BARRIOS, RAFAELA_CENTER } from './rafaela.js'
import { SANJUAN_BARRIOS, SANJUAN_CENTER } from './sanjuan.js'
import { PARANA_BARRIOS } from './parana-barrios.js'

export const LOCALIDAD_DEFECTO = 'Paraná'

export const LOCALIDADES = {
  'Paraná': {
    // El center NO se toca: los avisos viejos que nunca movieron el pin están
    // justo acá, y ciudadMasCercana los devuelve a Paraná por este punto.
    center: [-31.7405, -60.523],
    barrios: PARANA_BARRIOS, // 177: los 24 de antes + 153 de OSM (ver parana-barrios.js)
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
  'Villa Urquiza': {
    center: [-31.65, -60.367],
    barrios: {
      'Centro': [-31.65, -60.367],
      'Norte': [-31.642, -60.367],
      'Sur': [-31.658, -60.367],
      'Este': [-31.65, -60.358],
      'Oeste': [-31.65, -60.376],
    },
  },
  'Sauce Montrull': {
    center: [-31.745, -60.355],
    barrios: {
      'Centro': [-31.745, -60.355],
      'Norte': [-31.737, -60.355],
      'Sur': [-31.753, -60.355],
      'Este': [-31.745, -60.346],
      'Oeste': [-31.745, -60.364],
    },
  },
  'La Picada': {
    center: [-31.735, -60.309],
    barrios: {
      'Centro': [-31.735, -60.309],
      'Norte': [-31.727, -60.309],
      'Sur': [-31.743, -60.309],
      'Este': [-31.735, -60.3],
      'Oeste': [-31.735, -60.318],
    },
  },
  'Neuquén': {
    // 49 barrios oficiales de Neuquén capital (coords reales de OSM donde matchearon).
    center: NEUQUEN_CENTER,
    barrios: NEUQUEN_BARRIOS,
  },
  'San Martín de los Andes': {
    center: [-40.1579, -71.3534],
    barrios: {
      'Centro': [-40.1579, -71.3534],
      'Norte': [-40.1499, -71.3534],
      'Sur': [-40.1659, -71.3534],
      'Este': [-40.1579, -71.3444],
      'Oeste': [-40.1579, -71.3624],
    },
  },
  'Olavarría': {
    // Barrios reales de Olavarría (OpenStreetMap).
    center: OLAVARRIA_CENTER,
    barrios: OLAVARRIA_BARRIOS,
  },
  'Cañuelas': {
    // Cañuelas tiene pocos barrios cargados en OSM; se usan esos + Centro.
    center: [-35.0533, -58.76],
    barrios: {
      'Centro': [-35.0533, -58.76],
      'Los Aromos': [-35.0404, -58.73926],
      'Libertad': [-35.04252, -58.76841],
      'Los Fresnos': [-35.05407, -58.73948],
      'Maestra María Angélica Guzzetti': [-35.06225, -58.77471],
    },
  },
  'Santa Fe': {
    // Barrios reales de Santa Fe capital (OpenStreetMap).
    center: SANTAFE_CENTER,
    barrios: SANTAFE_BARRIOS,
  },
  'San Juan': {
    // Barrios reconocibles de San Juan capital (curados de OSM, que tiene 500+).
    center: SANJUAN_CENTER,
    barrios: SANJUAN_BARRIOS,
  },
  'Rafaela': {
    // Barrios reales de Rafaela (OpenStreetMap).
    center: RAFAELA_CENTER,
    barrios: RAFAELA_BARRIOS,
  },
  'Ceres': {
    center: [-29.8814, -61.945],
    barrios: {
      'Centro': [-29.8814, -61.945],
      'Norte': [-29.8734, -61.945],
      'Sur': [-29.8894, -61.945],
      'Este': [-29.8814, -61.935],
      'Oeste': [-29.8814, -61.955],
    },
  },
  'Selva': {
    center: [-29.7628, -62.0503],
    barrios: {
      'Centro': [-29.7628, -62.0503],
      'Norte': [-29.7548, -62.0503],
      'Sur': [-29.7708, -62.0503],
      'Este': [-29.7628, -62.0413],
      'Oeste': [-29.7628, -62.0593],
    },
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
  'Villa Urquiza': 'Entre Ríos',
  'Sauce Montrull': 'Entre Ríos',
  'La Picada': 'Entre Ríos',
  'Córdoba': 'Córdoba',
  'Neuquén': 'Neuquén',
  'San Martín de los Andes': 'Neuquén',
  'Olavarría': 'Buenos Aires',
  'Cañuelas': 'Buenos Aires',
  'Santa Fe': 'Santa Fe',
  'Rafaela': 'Santa Fe',
  'Ceres': 'Santa Fe',
  'Selva': 'Santiago del Estero',
  'San Juan': 'San Juan',
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
// Texto de ubicación para mostrar: "Barrio · Ciudad, Provincia". No repite la
// provincia cuando la ciudad se llama igual (ej. Córdoba capital → "Barrio · Córdoba").
export function ubicacionTexto(localidad, zona) {
  const ciudad = localidad || LOCALIDAD_DEFECTO
  const prov = provinciaDe(ciudad)
  const lugar = ciudad === prov ? ciudad : ciudad + ', ' + prov
  const b = (zona || '').trim()
  return b ? b + ' · ' + lugar : lugar
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

// Provincia de la ciudad guardada (la "de casa"), para ordenar sin asumir Entre Ríos.
export function provinciaGuardada() {
  return provinciaDe(localidadGuardada())
}
// Provincias en orden: la "de casa" primero, el resto alfabético.
export function provinciasOrdenadas() {
  const home = provinciaGuardada()
  const provs = [...new Set(NOMBRES_LOCALIDADES.map(provinciaDe))]
  return provs.sort((a, b) => {
    if (a === home) return -1
    if (b === home) return 1
    return a.localeCompare(b, 'es')
  })
}
// Ciudades de una provincia, alfabético.
export function ciudadesDeProvincia(prov) {
  return NOMBRES_LOCALIDADES.filter((l) => provinciaDe(l) === prov).sort((a, b) => a.localeCompare(b, 'es'))
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

// Grupos de localidades que son UNA sola mancha urbana: un perro las cruza
// caminando, así que un aviso de una se muestra en el feed de las otras. Evita que
// la gente republique el mismo aviso en cada localidad vecina para tener alcance.
// Por ahora solo el conurbano de Paraná; sumar otros grupos a mano si hacen falta.
// (No se calcula por distancia: los centros mienten en un conurbano — ver el aviso
//  en ciudadMasCercana.)
const CONURBANOS = [['Paraná', 'Colonia Avellaneda', 'San Benito', 'Sauce Montrull']]

// Las vecinas de una localidad (las otras de su mismo grupo), o [] si no está en uno.
export function vecinasDe(loc) {
  const grupo = CONURBANOS.find((g) => g.includes(loc))
  return grupo ? grupo.filter((l) => l !== loc) : []
}

// ¿Un aviso en `rLoc` entra en el feed de `loc`? Sí si es la misma localidad o una
// vecina del conurbano. Con loc null (Todas / provincia) no aplica: filtra el caller.
export function enZonaDelFeed(rLoc, loc) {
  const r = rLoc || LOCALIDAD_DEFECTO
  return r === loc || vecinasDe(loc).includes(r)
}

// ¿Este nombre suelto es un barrio nuestro? Devuelve el nombre TAL COMO lo tenemos
// (no el que vino), o '' si no lo conocemos. Se usa para lo que dice OSM, que
// escribe distinto: "Barrio General Espejo" es nuestro "General Espejo". Gana
// siempre nuestra forma, así no se ensucian los strings que ya están en la base.
export function barrioDeLaLista(loc, suelto) {
  const norm = (s) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/^barrio\s+/, '')
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  const k = norm(suelto)
  if (!k) return ''
  return Object.keys(barriosDe(loc)).find((b) => norm(b) === k) || ''
}

// El barrio de una ciudad más cercano a un punto. La inversa de coordsDeBarrioEn:
// sirve para proponer el barrio cuando alguien marca una dirección en el mapa.
// Acá el centroide sí es razonable (a diferencia de ciudadMasCercana, ver abajo):
// los barrios de una misma ciudad son chicos y están pegados, así que el más
// cercano casi siempre es el que contiene el punto. Igual es una PROPUESTA: se la
// mostramos a la persona para que confirme, no la damos por cierta.
export function barrioMasCercano(loc, lat, lng) {
  if (lat == null || lng == null) return ''
  let mejor = ''
  let mejorKm = Infinity
  for (const [b, c] of Object.entries(barriosDe(loc))) {
    const km = distanciaKm(lat, lng, c[0], c[1])
    if (km < mejorKm) {
      mejorKm = km
      mejor = b
    }
  }
  return mejor
}

// Distancia en km entre dos puntos (haversine).
export function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// La ciudad cargada más cercana a un punto, o null si no hay ninguna cerca.
// El tope existe para no mentir: un punto en el medio del campo no "es" la ciudad
// que quedó a 200 km. 60 km cubre a los que viven en las afueras de una ciudad
// cargada, sin llegar a la de al lado.
//
// OJO, NO SIRVE PARA PARTIR UNA CIUDAD EN BARRIOS. Compara contra el `center`, que
// es un punto, no un límite. En un conurbano miente feo: el centro de Colonia
// Avellaneda está a 4,2 km del de Paraná, pero Paraná (250 mil hab.) es más ancha
// que eso — así que medio Paraná "cae" en Colonia Avellaneda. Comprobado: con esto
// el barrio llamado "Ciudad de Paraná" da Colonia Avellaneda. Vale para "¿en qué
// zona del país está este punto?", no para "¿de qué ciudad es este barrio?".
export function ciudadMasCercana(lat, lng, topeKm = 60) {
  if (lat == null || lng == null) return null
  let mejor = null
  let mejorKm = Infinity
  for (const l of NOMBRES_LOCALIDADES) {
    const c = centroDe(l)
    const km = distanciaKm(lat, lng, c[0], c[1])
    if (km < mejorKm) {
      mejorKm = km
      mejor = l
    }
  }
  return mejorKm <= topeKm ? mejor : null
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

// "Scope" del FEED: una ciudad, toda una provincia, o "Todas". Es una clave
// aparte para no pisar el default de publicar (que siempre es una ciudad real).
// Guardado: nombre de ciudad | '*' (Todas) | 'P:<provincia>' (toda la provincia).
const LS_FEED_LOC = 'chicho_feed_loc'
export function scopeFeedGuardado() {
  try {
    const v = localStorage.getItem(LS_FEED_LOC)
    if (v === '*') return { localidad: null, provincia: null }
    if (v && v.slice(0, 2) === 'P:') return { localidad: null, provincia: v.slice(2) }
    if (v && LOCALIDADES[v]) return { localidad: v, provincia: null }
  } catch (e) {
    /* ignore */
  }
  return { localidad: localidadGuardada(), provincia: null } // primera vez: tu ciudad
}
export function recordarScopeFeed(localidad, provincia) {
  try {
    localStorage.setItem(LS_FEED_LOC, provincia ? 'P:' + provincia : localidad && LOCALIDADES[localidad] ? localidad : '*')
  } catch (e) {
    /* ignore */
  }
}
