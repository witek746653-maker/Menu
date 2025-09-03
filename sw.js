// Sabor PWA service worker — offline precache for sections
const CACHE = 'sabor-pwa-v26';

// Core assets must exist
const CORE_ASSETS = [
  './offline.html',
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js',
  './photo.png',
  './icons/rrrrr-180.png',
  './icons/rrrrr-192.png',
  './icons/rrrrr-512.png'
];

// Section pages — precache if present on the server (safe: doesn't fail install if some missing)
const SECTION_PAGES = [
  './osnovnoe-menu_(3.09).html',
  './avtorskie-zavtraki_(3.09).html',
  './sezonnoe-menu_(3.09).html',
  './detskoe-menu_(3.09).html',
  './festivaly_(3.09).html',
  './vinnaya-karta_(3.09).html',
  './knopochka-na-budushchee_(3.09).html'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE_ASSETS);
    // Try to precache sections, but don't fail if some are missing
    await Promise.allSettled(SECTION_PAGES.map(u => cache.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === location.origin;
  const isHTML = event.request.mode === 'navigate' || url.pathname.endsWith('.html');

  // For HTML: network-first, fallback to cache, then to index.html
  if (isSameOrigin && isHTML) {
    event.respondWith((async () => {
      try {
        const resp = await fetch(event.request);
        const cache = await caches.open(CACHE);
        cache.put(event.request, resp.clone()).catch(() => {});
        return resp;
      } catch (err) {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const offline = await caches.match('./offline.html');
        if (offline) return offline;
        const index = await caches.match('./index.html');
        if (index) return index;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // For other assets: cache-first, fallback to network
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const resp = await fetch(event.request);
      const cache = await caches.open(CACHE);
      cache.put(event.request, resp.clone()).catch(() => {});
      return resp;
    } catch (err) {
      return new Response('', { status: 504, statusText: 'Gateway Timeout' });
    }
  })());
});
