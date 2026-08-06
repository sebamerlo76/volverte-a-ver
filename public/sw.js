/* Service worker de Chicho — Web Push (notificaciones). */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Llega un push del servidor → mostramos la notificación.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Chicho'
  const options = {
    body: data.body || '',
    // Cuando la notificación es de una mascota, la Edge Function manda su foto (ver
    // notificar/index.ts). Si no, el logo — pero en la versión RECORTADA EN CÍRCULO y
    // no icon-192.png: Android no siempre redondea el ícono, y el cuadrado crema con
    // esquinas se ve pegoteado en la lista de notificaciones. El del manifest sigue
    // siendo el .png cuadrado, que ahí es lo correcto (Android le pone su propia
    // máscara al ícono de la app).
    icon: data.icon || '/icon-notif-192.webp',
    badge: '/badge.png', // silueta monocroma (la barra de estado la pinta a un color)
    data: { url: data.url || '/' },
    tag: data.tag,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Toca la notificación → la app pasa al frente, en el aviso que corresponde.
//
// Con la app ABIERTA se le manda un mensaje para que navegue por dentro, y NO se usa
// client.navigate(). Ese era el bug: navigate() devuelve una promesa que acá se
// descartaba, y cuando fallaba —pasa seguido si la ventana no quedó controlada por el
// service worker, y dentro de la app de Play es lo habitual— el focus() traía la app al
// frente igual, mostrando donde estabas. Resultado: la notificación abría Chicho pero no
// el aviso. Las de novedades parecían andar sólo porque solían tocarse con la app cerrada,
// que es el otro camino (openWindow) y ese sí navega.
//
// De paso el mensaje es mejor que navegar: no recarga la app, así que abre al instante.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    (async () => {
      const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const cliente = list.find((c) => 'focus' in c)
      if (cliente) {
        cliente.postMessage({ chicho: 'abrir', url })
        return cliente.focus()
      }
      // App cerrada: se abre directo en la url (este camino siempre funcionó).
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })(),
  )
})
