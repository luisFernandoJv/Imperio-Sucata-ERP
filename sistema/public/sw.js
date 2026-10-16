// Development-only retirement of the old cache-first worker.
// In production, vite-plugin-pwa replaces this file with its generated worker.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) =>
              name.startsWith("imperio-sucata-") ||
              (name.startsWith("workbox-precache-v2-") &&
                name.endsWith(`${self.location.origin}/`)),
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
      await self.registration.unregister();
    })(),
  );
});
