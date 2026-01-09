// Service Worker v1.0
const CACHE_NAME = 'scp-v3.0';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
