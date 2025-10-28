const IMG_CACHE = 'img-v3';
const IMAGES_PREFIX = 'images/'; // без ведущего слэша
const ICONS_PREFIX  = 'icons/';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== IMG_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // корректные пути с учётом scope
  const imagesPath = new URL(IMAGES_PREFIX, self.registration.scope).pathname;
  const iconsPath  = new URL(ICONS_PREFIX,  self.registration.scope).pathname;

  const isImage =
    req.destination === 'image' ||
    (url.origin === location.origin &&
      (url.pathname.startsWith(imagesPath) || url.pathname.startsWith(iconsPath)));

  if (!isImage) return;

  e.respondWith((async () => {
    const cache = await caches.open(IMG_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;

    try {
      const net = await fetch(req, { cache: 'no-store' });
      if (net.ok || net.type === 'opaque') await cache.put(req, net.clone());
      return net;
    } catch {
      return cached || Response.error();
    }
  })());
});

