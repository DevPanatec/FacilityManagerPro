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
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      // Cachear recursos iniciales
      await cache.addAll(INITIAL_CACHED_RESOURCES)
      // Activar inmediatamente
      await self.skipWaiting()
    })()
  )
})

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
self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      try {
        // Intentar obtener recurso de la red
        const response = await fetch(event.request)
        
        // Cachear respuesta exitosa
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME)
          cache.put(event.request, response.clone())
        }
        
        return response
      } catch (error) {
        // Si falla la red, intentar obtener del cache
        const cached = await caches.match(event.request)
        if (cached) return cached

        // Si no está en cache, mostrar página offline
        if (event.request.mode === 'navigate') {
          const cache = await caches.open(CACHE_NAME)
          return cache.match(OFFLINE_URL)
        }

        throw error
      }
    })()
  )
})

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