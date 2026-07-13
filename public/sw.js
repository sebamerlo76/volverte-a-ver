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
    icon: data.icon || '/icon-192.png',
    badge: '/badge.png', // silueta monocroma (la barra de estado la pinta a un color)
    data: { url: data.url || '/' },
    tag: data.tag,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Toca la notificación → enfocamos la app (o la abrimos) en la url indicada.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate(url)
          return c.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
