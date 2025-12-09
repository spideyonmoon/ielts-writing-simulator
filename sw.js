const CACHE_NAME = 'ielts-sim-v1';
const ASSETS = [
  './',
  './index.html',
  './icon.svg',
  './manifest.json'
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network first, then cache (for consistency), or Cache first (for speed/offline)
// Strategy: Stale-While-Revalidate for non-JSON, or simple Cache First for shell.
// Given this is a simple tool, we'll use a Cache First, falling back to network strategy for the shell,
// but for JSON data (prompts), we try network first so we get new prompts if available.

self.addEventListener('fetch', (event) => {
  // Navigation requests (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // Files (Images, Scripts, JSON)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise try network
      return fetch(event.request).then((networkResponse) => {
        // Optional: Cache successful network responses dynamically?
        // For now, we only stick to the pre-cached core shell to avoid bloating cache with random images.
        return networkResponse;
      });
    })
  );
});
