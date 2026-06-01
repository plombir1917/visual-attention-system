// ФОКУС — service worker. Makes the landing installable and resilient offline.
// Strategy:
//   • navigations  → network-first (fresh HTML), fall back to cached shell offline
//   • static GET   → stale-while-revalidate (instant load, refresh in background)
//   • /admin & API → never handled by the SW (always hit the network)
const VERSION = 'focus-v1';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

const PRECACHE = [
  '/',
  '/style.css',
  '/js/app.js',
  '/logo.png',
  '/manifest.webmanifest',
  '/favicon-32x32.png',
  '/android-chrome-192x192.png',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL && k !== RUNTIME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Same-origin only; never intercept the admin panel or its API.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/admin')) return;

  // Navigations: network-first with offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((cache) => cache.put('/', copy));
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL);
          return (await cache.match('/')) || (await cache.match('/offline.html'));
        }),
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
