const CACHE = "orbita-shell-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for the app shell only. Everything else (arXiv API calls, etc.)
// goes straight to the network so the feed is never stale on purpose.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  const isShell = SHELL.some((p) => url.pathname.endsWith(p.replace("./", "")));
  if (e.request.method !== "GET" || url.origin !== self.location.origin || !isShell) return;

  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
    )
  );
});
