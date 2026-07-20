// Píxel de Meta (Facebook/Instagram) para medir instalaciones PWA que vienen de
// campañas. Acotado a propósito: NO trackea a todos.
//
// Se apaga (return temprano) si:
//  1. No hay VITE_FB_PIXEL_ID → demo/local nunca dispara (igual que Supabase).
//  2. Corre como app de Play (TWA): referrer android-app://. La app instalada queda
//     sin tracking, así la declaración de Data Safety es simple y honesta.
//  3. La visita NO viene de un anuncio: sin fbclid en la URL y sin cookie _fbp/_fbc.
//     Los orgánicos/directos no son trackeados por Meta. Meta necesita el PageView
//     justo cuando llega el fbclid, que es cuando sí disparamos.
//
// El evento que importa es InstaloPWA (appinstalled). PageView lo necesita Meta para
// atribuir la campaña. Sólo mide Android/Chrome: Safari no dispara appinstalled.

function vieneDeAnuncio() {
  try {
    if (new URLSearchParams(window.location.search).has('fbclid')) return true
    // _fbc = el click del anuncio; _fbp = cookie del navegador que setea el píxel en
    // la 1ª visita con fbclid. Si ya existe, la persona ya pasó por un anuncio.
    return /(^|;\s*)_fb[cp]=/.test(document.cookie)
  } catch (e) {
    return false
  }
}

export function initPixel() {
  const ID = import.meta.env.VITE_FB_PIXEL_ID
  if (!ID) return // sin ID (demo o env sin setear): no cargamos nada
  if ((document.referrer || '').startsWith('android-app://')) return // app de Play (TWA)
  if (!vieneDeAnuncio()) return // visita orgánica/directa: no la trackeamos

  // Snippet base oficial de Meta: crea window.fbq con su cola y carga fbevents.js.
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = !0
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = !0
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */

  const fbq = window.fbq
  fbq('init', ID)
  fbq('track', 'PageView')

  // El evento clave: instaló la PWA (agregar a inicio). Android/Chrome.
  window.addEventListener('appinstalled', () => fbq('trackCustom', 'InstaloPWA'))

  // Ya la abre instalada (standalone): cuántos vuelven como app.
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) fbq('trackCustom', 'AbreComoApp')
  } catch (e) {
    /* matchMedia puede no estar */
  }

  // Embudo: mostró el cartel de instalar → aceptó/rechazó.
  window.addEventListener('beforeinstallprompt', (e) => {
    if (!e || !e.userChoice) return
    e.userChoice
      .then((r) => fbq('trackCustom', r && r.outcome === 'accepted' ? 'InstalarAceptado' : 'InstalarRechazado'))
      .catch(() => {})
  })
}
