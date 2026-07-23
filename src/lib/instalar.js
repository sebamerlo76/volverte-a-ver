// Instalación de la PWA. Captura el evento `beforeinstallprompt` lo antes posible
// (se dispara al cargar, ANTES de que React monte) y lo guarda, así podemos ofrecer
// un botón "Instalar" propio que dispara el cartel nativo de Android con un toque —
// en vez de mandar a la gente a buscar la opción en el menú del navegador.
//
// iOS no dispara este evento: allá se muestran las instrucciones de Safari.

let deferido = null
const subs = new Set()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // evitamos el mini-cartel del navegador; lo disparamos nosotros
    deferido = e
    subs.forEach((cb) => cb())
  })
  window.addEventListener('appinstalled', () => {
    deferido = null
    subs.forEach((cb) => cb())
  })
}

// ¿Hay un prompt de instalación disponible (Android/Chrome)?
export function hayPrompt() {
  return !!deferido
}

// Avisar cuando cambia la disponibilidad del prompt (llega o se consume).
export function suscribir(cb) {
  subs.add(cb)
  return () => subs.delete(cb)
}

// Dispara el cartel nativo. Devuelve 'accepted' | 'dismissed' | null.
export async function instalar() {
  if (!deferido) return null
  deferido.prompt()
  const r = await deferido.userChoice.catch(() => null)
  deferido = null
  subs.forEach((cb) => cb())
  return r && r.outcome
}

// ¿Ya está corriendo instalada (PWA o app de Play/TWA)? Entonces no ofrecemos instalar.
export function esStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  } catch (e) {
    return false
  }
}

export function esIOS() {
  try {
    return /iphone|ipad|ipod/i.test(navigator.userAgent || '')
  } catch (e) {
    return false
  }
}
