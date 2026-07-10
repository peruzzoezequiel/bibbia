// Service worker: leitura offline + instalável.
// - Navegações: rede primeiro, cai para o app shell em cache (SPA).
// - Assets e dados (/assets/, /data/): cache primeiro (revalida em segundo plano).
const VERSION = 'biblia-v1'
const SHELL = `${VERSION}-shell`
const RUNTIME = `${VERSION}-runtime`
const SHELL_URLS = ['/', '/favicon.svg', '/site.webmanifest']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // SPA navigations: network first, fall back to cached shell
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => { caches.open(SHELL).then((c) => c.put('/', res.clone())); return res })
        .catch(() => caches.match(request).then((m) => m || caches.match('/')))
    )
    return
  }

  // static assets + bible data: cache first, revalidate in the background
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/data/') ||
      url.pathname.startsWith('/audio/') || url.pathname === '/favicon.svg') {
    e.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone() // clone synchronously, before the body is read
            caches.open(RUNTIME).then((c) => c.put(request, copy))
          }
          return res
        }).catch(() => cached)
        return cached || network
      })
    )
  }
})
