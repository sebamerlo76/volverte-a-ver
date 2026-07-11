// Etiquetas de estado de un aviso, TODAS en un solo lugar para poder ajustarlas
// fácil. Los datos siguen siendo tipo ('perdido'/'encontrado') + estado
// ('activo'/'resuelto') + enCustodia (la tiene quien la encontró) — acá solo
// mapeamos a los textos que ve la gente.

// Pestañas del feed.
export const TABS_ESTADO = [
  { k: 'todos', t: 'Todos' },
  { k: 'perdido', t: 'Perdidos' },
  { k: 'encontrado', t: 'Encontrados' },
  { k: 'finales', t: 'Ya en casa', icono: 'home' },
]

// Cartelito (badge) según el reporte. Distingue "Visto" de "En tránsito" con enCustodia.
// Devuelve el texto + la clase CSS de color + el ícono.
export function badgeEstado(r) {
  if (r.estado === 'resuelto') return { t: 'Ya en casa', clase: 'encasa', icono: 'celebration', fill: true }
  if (r.tipo === 'perdido') return { t: 'Perdido', clase: 'lost', icono: 'error_outline', fill: false }
  if (r.enCustodia) return { t: 'En tránsito', clase: 'transito', icono: 'volunteer_activism', fill: true }
  return { t: 'Visto', clase: 'found', icono: 'visibility', fill: true }
}

// Solo el texto del estado (para compartir, globitos, listas).
export function textoEstado(r) {
  return badgeEstado(r).t
}

// Texto a partir del tipo (+ custodia) cuando el aviso está activo. Para lugares
// que no manejan el estado resuelto.
export function textoTipo(tipo, enCustodia) {
  if (tipo === 'perdido') return 'Perdido'
  return enCustodia ? 'En tránsito' : 'Visto'
}

// Frase bajo el nombre. También distingue si alguien la tiene (en tránsito).
export function subLinea(r) {
  if (r.tipo === 'perdido') return 'Su familia lo busca'
  return r.enCustodia ? 'Alguien lo tiene' : 'Busca a su familia'
}
