/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope

const CACHE_NAME = 'app-cache-v1'
const OFFLINE_URL = '/offline'

// Recursos a cachear inicialmente
const INITIAL_CACHED_RESOURCES = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Instalar Service Worker
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles/main.css',
        '/scripts/main.js',
        '/images/logo.png'
      ]);
    })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpiar caches antiguos
      const keys = await caches.keys()
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
      // Tomar control inmediatamente
      await self.clients.claim()
    })()
  )
})

// Interceptar peticiones
self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncReports())
  }
})

// Función para sincronizar reportes pendientes
async function syncReports() {
  const pendingReports = await getPendingReports()
  for (const report of pendingReports) {
    try {
      await sendReport(report)
      await markReportAsSynced(report.id)
    } catch (error) {
      console.error('Error syncing report:', error)
    }
  }
}

self.addEventListener('push', (event: any) => {
  const options = {
    body: event.data.text(),
    icon: '/images/icon.png',
    badge: '/images/badge.png'
  };

  event.waitUntil(
    self.registration.showNotification('Push Notification', options)
  );
}); 