/**
 * Service Worker for Nabd Agents (amiraq1/agent-hub)
 * Implements Stale-While-Revalidate for state and Cache-First for static assets.
 */

const CACHE_NAME = 'nabd-agents-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './assets/styles.min.css',
  './assets/app.js',
  './assets/manifest.webmanifest',
  './assets/modules/security.js',
  './assets/modules/tower.js',
  './assets/modules/format.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For state JSON: Network-first with cache fallback
  if (url.pathname.endsWith('agents-state.json')) {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkRes;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For other same-origin requests: Cache-first with network fallback
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedRes) => {
        if (cachedRes) return cachedRes;
        return fetch(event.request).then((networkRes) => {
          if (networkRes.ok && event.request.method === 'GET') {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkRes;
        });
      })
    );
  }
});
