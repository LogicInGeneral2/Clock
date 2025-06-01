const cacheName = "v1";
const cacheAssets = [
  // ... main static files
  "/",
  "/index.html",
  "/manifest.json",
  // ... other audio files
  "/audio/silent.mp3",
  "/audio/prayer.mp3",
  "/audio/prayer_fajr.mp3",
  "/audio/1.mp3",
  "/audio/2.mp3",
  "/audio/3.mp3",
  "/audio/4.mp3",
  "/audio/5.mp3",
  "/audio/6.mp3",
  "/audio/7.mp3",
  "/audio/8.mp3",
  "/audio/fajr.mp3",
  "/audio/zuhr.mp3",
  "/audio/asr.mp3",
  "/audio/maghrib.mp3",
  "/audio/isha.mp3",
  "/audio/everyday.mp3",
  "/audio/friday.mp3",
  // ... next js files
  "/_next/static/chunks/main.js",
  "/_next/static/chunks/webpack.js",
  "/_next/static/chunks/framework.js",
  "/_next/static/chunks/commons.js",
  "/_next/static/chunks/pages/index.js",
  "/_next/static/css/main.css",
  "/offline-prayer-times.json",
];

let isOffline = false;

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
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== cacheName) {
              console.log(`Deleting old cache: ${name}`);
              return caches.delete(name);
            }
          })
        );
      }).then(() => self.clients.claim())
    );
  });
};
activateEvent();

// Enhanced fetch event with connection monitoring
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
            // Connection restored
            if (isOffline) {
              isOffline = false;
              console.log("Connection restored, notifying clients");
              notifyClientsOfConnection();
            }
            
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
          .catch((error) => {
            // Connection lost
            if (!isOffline) {
              isOffline = true;
              console.log("Connection lost");
            }
            
            // Fallback for offline scenarios
            return caches.match(e.request);
          });
      })
    );
  });
};
fetchEvent();

// Function to notify all clients about connection restoration
function notifyClientsOfConnection() {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CONNECTION_RESTORED',
        timestamp: Date.now()
      });
    });
  });
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_CONNECTION') {
    // Test network connectivity
    fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' })
      .then(() => {
        event.source.postMessage({
          type: 'CONNECTION_STATUS',
          online: true
        });
      })
      .catch(() => {
        event.source.postMessage({
          type: 'CONNECTION_STATUS',
          online: false
        });
      });
  }
});