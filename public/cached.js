const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/index.js",
    "/db.js",
    "/manifest.webmanifest",
    "/cached.js",
    "/styles.css",
];

const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

// install
self.addEventListener("install", function(evt) {
    evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        console.log("Your files were pre-cached successfully!");
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  
    self.skipWaiting();
  });

  self.addEventListener("activate", function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });

  self.addEventListener("fetch", (evt) => {
    // cache successful "get" requests to the API
    if (evt.request.url.includes("/api") && evt.request.method === "GET") {
      evt.respondWith(
        caches
          .open(DATA_CACHE_NAME)
          .then((cache) => {
            return fetch(evt.request)
              .then((response) => {
                // if the response is good, clone it and store it in the cache.
                if (response.status === 200) {
                  cache.put(evt.request, response.clone());
                }
                return response;
              })
              .catch(() => {
                // if online request fails, try to get it from the cache.
                return cache.match(evt.request);
              });
          })
          .catch((err) => console.log(err))
      );
      return;
    }
    // if the request is not for the API, serve static assets using "offline-first" approach.
    evt.respondWith(
      caches.match(evt.request).then((response) => {
        return response || fetch(evt.request);
      })
    );
  });