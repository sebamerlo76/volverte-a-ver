// Anti-spam liviano de avistamientos, por dispositivo (localStorage).
// No es infalible (se puede borrar el storage), pero frena el abuso casual y el
// doble-tap. El backstop real es el trigger del servidor (schema-antispam.sql).
const CLAVE = 'chicho_avist_envios'
const VENTANA_MS = 60 * 60 * 1000 // 1 hora
const MAX_POR_HORA = 6
const COOLDOWN_MS = 15 * 1000 // 15 s entre envíos

function leer() {
  try {
    const arr = JSON.parse(localStorage.getItem(CLAVE) || '[]')
    return Array.isArray(arr) ? arr : []
  } catch (e) {
    return []
  }
}

// ¿Puede este dispositivo enviar un avistamiento ahora? Devuelve { ok, motivo }.
export function puedeEnviarAvist() {
  const ahora = Date.now()
  const envios = leer().filter((t) => ahora - t < VENTANA_MS)
  const ultimo = envios[envios.length - 1]
  if (ultimo && ahora - ultimo < COOLDOWN_MS) {
    return { ok: false, motivo: 'Esperá unos segundos antes de enviar otro avistamiento 🙏' }
  }
  if (envios.length >= MAX_POR_HORA) {
    return { ok: false, motivo: 'Enviaste varios avistamientos en la última hora. Probá más tarde. ¡Gracias por ayudar! 🐾' }
  }
  return { ok: true }
}

// Registra un envío exitoso (para el rate-limit).
export function registrarEnvioAvist() {
  const ahora = Date.now()
  const envios = leer().filter((t) => ahora - t < VENTANA_MS)
  envios.push(ahora)
  try {
    localStorage.setItem(CLAVE, JSON.stringify(envios))
  } catch (e) {
    /* storage lleno o bloqueado: no pasa nada */
  }
}
