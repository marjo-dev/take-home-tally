// Restaurant Income Tracker Service Worker
// Update CACHE_VERSION when you deploy new features to force cache refresh
const CACHE_VERSION = 'v2.2.1';
const CACHE_NAME = `income-tracker-${CACHE_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-96.png'
];

// Install: cache app shell and skip waiting for immediate activation
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        // Skip waiting so new service worker activates immediately
        return self.skipWaiting();
      })
  );
});

// Activate: clear old caches and claim clients
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Claim all clients so new service worker controls all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch: Network-first strategy for HTML, cache-first for assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const acceptHeader = request.headers.get('accept') || '';

  // Network-first for HTML files (to get updates quickly)
  if (request.method === 'GET' && acceptHeader.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request);
        })
    );
  } else {
    // Cache-first for static assets (CSS, JS, images)
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached version immediately
            // But also fetch in background to update cache
            fetch(request).then(response => {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseToCache);
              });
            }).catch(() => {
              // Ignore network errors for background updates
            });
            return cachedResponse;
          }
          // Not in cache, fetch from network
          return fetch(request).then(response => {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
            return response;
          });
        })
    );
  }
});