const CACHE_NAME = 'evita-cache-v2'
const ASSETS = [
  '/',
  '/index.html'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Network-first for API calls
  if (url.pathname.startsWith('/api') || url.origin !== location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Cache-first for static assets and SPA shell
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((response) => {
          try {
            const contentType = response.headers.get('content-type') || ''
            // Evitar cachear HTML para recursos JS/CSS que podrían estar 404 y devuelven index.html
            const isScriptOrStyle = request.destination === 'script' || request.destination === 'style'
            const isHtml = contentType.includes('text/html')
            if (isScriptOrStyle && isHtml) {
              return response
            }
          } catch (_) {}
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => {
          if (request.mode === 'navigate') return caches.match('/index.html')
        })
    })
  )
})


