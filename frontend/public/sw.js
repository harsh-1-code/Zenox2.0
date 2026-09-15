// Service worker exists so the app is installable (and therefore a share target).
// Android Chrome only offers "Install app" if the page can be served offline, so we
// cache the app shell - and nothing else.
//
// What is NEVER cached: anything under /api/. That is the person's message and our
// assessment of it. Zero retention applies here as much as it does on the server.

const SHELL = 'digi-shell-v2'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.add('/'))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return // never cache user data

  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (e.request.mode === 'navigate' && r.ok) {
          const copy = r.clone()
          caches.open(SHELL).then((c) => c.put('/', copy))
        }
        return r
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('/'))),
  )
})
