// Búsqueda de avisos — UNA sola fuente de verdad, usada por el buscador (lupa) y
// por el filtro del feed, así el prefiltro y el resultado coinciden siempre.
import { nombreMostrado } from './formato.js'

// Saca acentos y pasa a minúsculas: así "marron" encuentra "Marrón".
function normaliza(s) {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// Palabras vacías que no aportan al filtrar. Ojo: dejamos "con"/"sin" a propósito,
// porque son parte del collar ("Con collar" / "Sin collar").
const VACIAS = new Set(['y', 'o', 'a', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'que', 'por', 'para'])

// Sinónimos de especie para que ande en singular/plural/género.
const ESPECIE_TXT = { perro: 'perro perra perros', gato: 'gato gata gatos', otro: 'otro' }

// Texto buscable de un aviso: junta todos los campos útiles, ya normalizado.
export function textoBuscable(r) {
  return normaliza(
    [
      nombreMostrado(r),
      ESPECIE_TXT[r.especie] || r.especie,
      r.tipo, // perdido / encontrado
      r.color,
      r.tamano,
      r.sexo,
      r.collar,
      r.zona,
      r.referencia,
      r.raza,
      r.edad,
      r.descripcion,
    ]
      .filter(Boolean)
      .join(' ')
  )
}

// ¿El aviso matchea la búsqueda? Cada palabra debe aparecer en algún campo (AND).
// "gato con collar" => gato + collar. Sin texto → matchea (el feed muestra todo).
export function coincideBusqueda(r, query) {
  const palabras = normaliza(query)
    .split(/\s+/)
    .filter((w) => w && !VACIAS.has(w))
  if (palabras.length === 0) return true
  const t = textoBuscable(r)
  return palabras.every((w) => t.includes(w))
}
