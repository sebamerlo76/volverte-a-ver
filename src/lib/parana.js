// Barrios de Paraná (Entre Ríos) con sus coordenadas aproximadas.
// Se usan para el selector de zona y para ubicar los pines en el mapa.
export const BARRIOS = {
  'Parque Urquiza': [-31.7285, -60.5305],
  'Centro': [-31.7333, -60.5238],
  'San Agustín': [-31.755, -60.503],
  'Bajada Grande': [-31.756, -60.548],
  'Villa Sarmiento': [-31.744, -60.516],
  'Puerto Viejo': [-31.726, -60.531],
  'Belgrano': [-31.742, -60.528],
  'La Floresta': [-31.76, -60.52],
}

// Centro geográfico de la ciudad, para encuadrar el mapa general.
export const PARANA_CENTER = [-31.7405, -60.523]

export const NOMBRES_BARRIOS = Object.keys(BARRIOS)

export function coordsDeBarrio(barrio) {
  return BARRIOS[barrio] || PARANA_CENTER
}

// Punto de un aviso: su ubicación exacta si la tiene, si no el centro del barrio.
export function puntoDeReporte(r) {
  if (r && r.lat != null && r.lng != null) return [r.lat, r.lng]
  return coordsDeBarrio(r?.zona)
}

// Distancia en km entre dos puntos (haversine). Para el radio de notificaciones.
export function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
