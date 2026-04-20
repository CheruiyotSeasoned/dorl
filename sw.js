import { precacheAndRoute } from 'workbox-precaching';

// 🔴 REQUIRED for injectManifest
precacheAndRoute(self.__WB_MANIFEST);


// --- your existing code below ---

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try { payload = event.data.json() } catch { payload = { title: 'DORL', body: event.data.text() } }

  const title   = payload.title ?? 'DORL Delivery'
  const options = {
    body:    payload.body ?? '',
    icon:    '/logo.png',
    badge:   '/logo.png',
    tag:     payload.tag ?? 'dorl-notification',
    data:    payload.data ?? {},
    vibrate: [200, 100, 200],
    actions: payload.actions ?? [],
    requireInteraction: payload.requireInteraction ?? false,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()))