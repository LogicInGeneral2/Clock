const cacheName = "v1";
const cacheAssets = [
  "/audio/pre-prayer.mp3",
  "/audio/prayer.mp3",
  "/audio/post-prayer.mp3",
  "/audio/hourly.mp3",
  // Add other static assets as needed
];

const installEvent = () => {
  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(cacheName).then((cache) => {
        console.log("Service worker: Caching assets");
        return cache.addAll(cacheAssets);
      })
    );
    self.skipWaiting();
    console.log("Service worker installed");
  });
};
installEvent();

const activateEvent = () => {
  self.addEventListener("activate", (event) => {
    console.log("Service worker activated");
    event.waitUntil(clients.claim());
  });
};
activateEvent();

const fetchEvent = () => {
  self.addEventListener("fetch", (e) => {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fetch from network and cache dynamically
        return fetch(e.request)
          .then((response) => {
            // Only cache valid responses
            if (!response || response.status !== 200 || response.type !== "basic") {
              return response;
            }
            const responseClone = response.clone();
            caches.open(cacheName).then((cache) => {
              cache.put(e.request, responseClone);
            });
            return response;
          })
          .catch(() => {
            // Fallback for offline scenarios (optional, can be empty for audio files)
            return caches.match(e.request);
          });
      })
    );
  });
};
fetchEvent();