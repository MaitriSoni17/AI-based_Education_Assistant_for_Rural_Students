// Gramin Shiksha AI - Offline-First Service Worker
const CACHE_NAME = 'gramin-shiksha-static-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx',
  '/favicon.ico',
];

// Installation event: cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activation event: clean older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first falling back to Cache for static, network-only for api with fallback
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Treat API requests differently (Network-only with local JSON fallback if offline)
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.warn('[Service Worker] API direct fetch failed, device offline. Falling back.', err);
        
        // Return a mock success response for specific endpoints to allow offline mock progress if needed
        if (requestUrl.pathname === '/api/gemini/chat') {
          return new Response(JSON.stringify({
            success: false,
            offlineCached: true,
            message: "You are currently offline. Your question has been automatically saved in your offline queue and will be asked to Swami once you return to signal area!"
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify({
          success: false,
          error: "No network coverage. Please try again once signal returns."
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Static assets: Cache-first falling back to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Cache dynamic non-GET/non-local files carefully
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Clone response to add to cache
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Do not cache Chrome extensions or external scripts maliciously
          if (event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, responseToCache);
          }
        });

        return networkResponse;
      }).catch(() => {
        // Return index.html as a fallback for navigation requests during offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
