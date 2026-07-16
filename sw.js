var CACHE_NAME = "move-verifica-categoria-v3";
var FILES = ["./index.html", "./manifest.json", "./logo.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(FILES);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var isHTML = req.mode === "navigate" ||
    (req.headers.get("accept") || "").indexOf("text/html") !== -1;

  if (isHTML) {
    /* Network-first para el HTML: los cambios de temporada se propagan solos */
    event.respondWith(
      fetch(req).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        return response;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match("./index.html");
        });
      })
    );
    return;
  }

  /* Cache-first para assets estaticos */
  event.respondWith(
    caches.match(req).then(function (response) {
      return response || fetch(req);
    })
  );
});
