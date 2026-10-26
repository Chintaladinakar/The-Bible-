// Scriptura Service Worker - offline app shell, fonts included
const CACHE_NAME = 'scriptura-pwa-v16';
// Downloaded Bible books live apart from the app shell so app updates never delete them
const BIBLE_CACHE = 'scriptura-bibles-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/fonts.css',
  './css/themes.css',
  './css/style.css',
  './css/mobile.css',
  './js/app.js',
  './js/bible-data.js',
  './js/bible-source.js',
  './js/cross-refs.js',
  './js/storage.js',
  './js/pwa.js',
  './js/share-card.js',
  './js/util.js',
  './fonts/literata-normal.woff2',
  './fonts/literata-italic.woff2',
  './fonts/fraunces-normal.woff2',
  './fonts/fraunces-italic.woff2',
  './fonts/geist-normal.woff2',
  './fonts/noto-serif-telugu.woff2',
  './bibles/tel/books.json',
  './icons/favicon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME && name !== BIBLE_CACHE).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// Same-origin files: answer from cache, refresh in the background.
// Bible text from bible-api.com is stored by the app itself and passes straight through.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Bible book files never change once published: serve from cache without re-downloading
  if (url.pathname.includes('/bibles/') && !url.pathname.endsWith('books.json')) {
    event.respondWith(
      caches.open(BIBLE_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      const response = await network;
      if (response) return response;
      if (request.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    })
  );
});
