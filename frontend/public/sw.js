// Minimal service worker. Its only job is to make the app installable (and therefore a
// share target) - we deliberately do NOT cache assessments or inputs. Zero retention
// means zero retention, including here.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
