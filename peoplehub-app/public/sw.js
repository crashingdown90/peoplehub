// @ai:cx - Minimal service worker for PWA shell
// Note: Add fetch handler with caching strategy when needed for offline support

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
