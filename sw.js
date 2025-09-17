// sw.js – Service Worker

const CACHE_NAME = 'redfetcher-v1';
const OFFLINE_FALLBACK = '/';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/sw.js',
        // add other static assets if needed
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Same‑origin assets: cache‑first
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(resp => resp || fetch(e.request))
    );
    return;
  }

  // Reddit JSON: network‑first, fallback to cache
  if (url.hostname === 'www.reddit.com' && url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request)
        .then(networkResp => {
          const copy = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
          return networkResp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Others: network, then fallback to offline page
  e.respondWith(
    fetch(e.request).catch(() => caches.match(OFFLINE_FALLBACK))
  );
});
