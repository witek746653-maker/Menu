// Sabor PWA service worker — offline precache for sections
const CACHE = 'sabor-pwa-v27';

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
  const sameOrigin = url.origin === location.origin;

  // Robust HTML detection for Safari/older browsers
  const accept = event.request.headers.get('accept') || '';
  const isHTML = event.request.mode === 'navigate'
    || event.request.destination === 'document'
    || (accept.includes('text/html') && !url.pathname.match(/\.(js|css|json|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$/i));

  if (sameOrigin && isHTML) {
    event.respondWith((async () => {
      try {
        const resp = await fetch(event.request);
        const cache = await caches.open(CACHE);
        cache.put(event.request, resp.clone()).catch(() => {});
        return resp;
      } catch (err) {
        // Try exact match first
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Offline fallback
        const offline = await caches.match('./offline.html');
        if (offline) return offline;
        // As last resort, try index.html
        const index = await caches.match('./index.html');
        if (index) return index;
        // Always return a valid Response (avoid "nothing happens")
        return new Response('<!DOCTYPE html><title>Offline</title><p>Вы офлайн.</p>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    })());
    return;
  }

  // Other assets: cache-first
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const resp = await fetch(event.request);
      const cache = await caches.open(CACHE);
      cache.put(event.request, resp.clone()).catch(() => {});
      return resp;
    } catch (err) {
      // Return a benign empty response for non-HTML assets
      return new Response('', { status: 200 });
    }
  })());
});

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
