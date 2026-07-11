// Estado local del onboarding "Primeros pasos" (no toca la base de datos).
// Los pasos que se detectan de datos reales (ubicación, mascotas, push) NO se
// guardan acá; acá van solo los de acción (compartir, seguir redes), el contador
// de logins y el flag de "ya completó todo".

const LS_LOGINS = 'chicho_logins'
const LS_PASOS = 'chicho_pasos' // { compartir, redes }
const LS_OK = 'chicho_pasos_ok'

export const INSTAGRAM_URL = 'https://instagram.com/chicho.ar'

// Cuenta una sesión por carga de la app con usuario (se llama una vez por carga).
export function contarLogin() {
  try {
    const n = (parseInt(localStorage.getItem(LS_LOGINS) || '0', 10) || 0) + 1
    localStorage.setItem(LS_LOGINS, String(n))
    return n
  } catch (e) {
    return 1
  }
}
export function logins() {
  try {
    return parseInt(localStorage.getItem(LS_LOGINS) || '0', 10) || 0
  } catch (e) {
    return 0
  }
}

function leerPasos() {
  try {
    return JSON.parse(localStorage.getItem(LS_PASOS) || '{}') || {}
  } catch (e) {
    return {}
  }
}
export function pasoHecho(k) {
  return !!leerPasos()[k]
}
export function marcarPaso(k) {
  try {
    const p = leerPasos()
    p[k] = true
    localStorage.setItem(LS_PASOS, JSON.stringify(p))
  } catch (e) {
    /* ignore */
  }
}

export function pasosOk() {
  try {
    return localStorage.getItem(LS_OK) === '1'
  } catch (e) {
    return false
  }
}
export function marcarPasosOk() {
  try {
    localStorage.setItem(LS_OK, '1')
  } catch (e) {
    /* ignore */
  }
}
