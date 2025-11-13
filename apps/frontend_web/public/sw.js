// Service Worker for caching API responses and static assets
const CACHE_NAME = "iayos-cache-v1";
const API_CACHE_NAME = "iayos-api-cache-v1";

// Assets to cache immediately
const STATIC_ASSETS = ["/", "/dashboard", "/offline"];

// Cache duration for different types
const CACHE_DURATION = {
  API: 5 * 60 * 1000, // 5 minutes
  STATIC: 24 * 60 * 60 * 1000, // 24 hours
  IMAGE: 7 * 24 * 60 * 60 * 1000, // 7 days
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // API requests - Network first, then cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();

          caches.open(API_CACHE_NAME).then((cache) => {
            // Add timestamp header for cache expiration
            const headers = new Headers(response.headers);
            headers.append("sw-cache-time", Date.now().toString());

            const modifiedResponse = new Response(responseToCache.body, {
              status: response.status,
              statusText: response.statusText,
              headers: headers,
            });

            cache.put(request, modifiedResponse);
          });

          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              // Check if cache is still valid
              const cacheTime = cachedResponse.headers.get("sw-cache-time");
              if (
                cacheTime &&
                Date.now() - parseInt(cacheTime) < CACHE_DURATION.API
              ) {
                return cachedResponse;
              }
            }

            // Return offline page if no cache available
            return caches.match("/offline");
          });
        })
    );
    return;
  }

  // Static assets - Cache first, then network
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(request).then((response) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          })
        );
      })
    );
    return;
  }

  // Images - Cache first with long expiration
  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          const cacheTime = cachedResponse.headers.get("sw-cache-time");
          if (
            cacheTime &&
            Date.now() - parseInt(cacheTime) < CACHE_DURATION.IMAGE
          ) {
            return cachedResponse;
          }
        }

        return fetch(request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            const headers = new Headers(response.headers);
            headers.append("sw-cache-time", Date.now().toString());

            const modifiedResponse = new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: headers,
            });

            cache.put(request, modifiedResponse);
            return response;
          });
        });
      })
    );
    return;
  }

  // Default - Network first
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then((cachedResponse) => {
        return cachedResponse || caches.match("/offline");
      });
    })
  );
});
