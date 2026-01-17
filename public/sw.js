const CACHE_NAME = "imperio-sucata-v2.0.0"
const RUNTIME_CACHE = "imperio-sucata-runtime"

const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon_io/android-chrome-192x192.png",
  "/favicon_io/android-chrome-512x512.png",
  "/favicon_io/apple-touch-icon.png",
  "/favicon_io/favicon-32x32.png",
  "/favicon_io/favicon-16x16.png",
]

self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker v2.0.0")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching essential resources")
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log("[SW] Installation complete")
        return self.skipWaiting() // Activate immediately
      }),
  )
})

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker v2.0.0")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[SW] Activation complete")
        return self.clients.claim() // Take control immediately
      }),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Skip dev resources
  if (
    request.url.includes("@react-refresh") ||
    request.url.includes("@vite") ||
    request.url.includes("localhost:5173/@") ||
    request.url.includes("hot-update") ||
    request.url.includes("chrome-extension")
  ) {
    return
  }

  // Skip Firebase and external API calls - always fetch fresh
  if (
    request.url.includes("firestore.googleapis.com") ||
    request.url.includes("firebase") ||
    request.url.includes("/api/")
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: "Offline", offline: true }), {
          headers: { "Content-Type": "application/json" },
          status: 503,
        })
      }),
    )
    return
  }

  if (request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return (
              cached ||
              caches.match("/").then((fallback) => {
                return (
                  fallback ||
                  new Response("<h1>Offline</h1><p>Sem conexão com a internet.</p>", {
                    headers: { "Content-Type": "text/html" },
                  })
                )
              })
            )
          })
        }),
    )
    return
  }

  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached
        }

        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone()
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return response
          })
          .catch(() => {
            return new Response("Resource not available offline", { status: 503 })
          })
      }),
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || new Response("Offline", { status: 503 })
        })
      }),
  )
})

self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(syncOfflineData())
  }
})

async function syncOfflineData() {
  try {
    console.log("[SW] Starting offline data sync")

    // Get offline transactions from localStorage
    const clients = await self.clients.matchAll()
    if (clients.length > 0) {
      clients[0].postMessage({
        type: "SYNC_REQUESTED",
        message: "Starting background sync",
      })
    }

    console.log("[SW] Offline data sync completed")
  } catch (error) {
    console.error("[SW] Error during offline sync:", error)
  }
}

self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data)

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})
