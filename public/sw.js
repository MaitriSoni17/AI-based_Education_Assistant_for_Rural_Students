// GyaanBot - Offline-First Service Worker
const CACHE_NAME = 'gyaanbot-static-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

// Installation event: cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activation event: immediately delete all older caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first for everything, falling back to cache when offline
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Completely bypass caching for Vite development internals and hot modules
  if (
    requestUrl.pathname.startsWith('/@') ||
    requestUrl.pathname.startsWith('/src/') ||
    requestUrl.pathname.startsWith('/node_modules/') ||
    requestUrl.pathname.endsWith('.tsx') ||
    requestUrl.pathname.endsWith('.ts') ||
    requestUrl.search.includes('v=')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Completely bypass service worker for all API endpoints (let browser handle natively)
  if (requestUrl.pathname.startsWith('/api/')) {
    return;
  }

  // 3. Static assets & navigation: Network-first falling back to Cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, responseToCache);
          }
        });

        return networkResponse;
      })
      .catch(() => {
        // Offline: attempt cache match
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
