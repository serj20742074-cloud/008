const CACHE_NAME = 'rzhd-proverki-v1.0.4';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-512.jpg'
];

// Install Event: cache precached assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching offline app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: intercept requests and serve from cache or network
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests and chrome extension requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Strategy 1: Network-First for HTML/Document requests
  // This ensures users get the latest updates when online, but can load offline
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the fresh document
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, serve from cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Fallback to index.html if specific navigate route not found
            return caches.match('./index.html') || caches.match('./');
          });
        })
    );
    return;
  }

  // Strategy 2: Cache-First for static assets (JS, CSS, images, fonts)
  // Dynamic caching of assets loaded after installation
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache, but update it in background if it's not a hashed asset or font
        const isImmutable = url.pathname.includes('/assets/') || 
                            url.hostname.includes('fonts.gstatic.com');
        
        if (!isImmutable) {
          fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {/* Ignore background sync failures */});
        }
        
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        // Fallback for failed asset requests (offline)
        console.warn('[Service Worker] Fetch failed for:', request.url, err);
        // You could return a placeholder image here if desired
      });
    })
  );
});
