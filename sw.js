const CACHE_NAME = 'pwa-menu-v1-7';
const PRECACHE_URLS = [
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-256.png",
  "icons/icon-384.png",
  "icons/icon-512.png",
  "index.html",
  "manifest.webmanifest"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(resp => {
        // Try to cache new GET requests
        if (req.method === 'GET' && resp.ok) {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
        }
        return resp;
      }).catch(() => cached));
    })
  );
});
