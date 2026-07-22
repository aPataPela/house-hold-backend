const CACHE_NAME = "casa-viva-v6";
const APP_SHELL = [
  "/",
  "/personalizacion/identidad-visual",
  "/manifest.webmanifest",
  "/icons/icon.svg",
];
const TRANSPARENT_IMAGE = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"/>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_URLS" || !Array.isArray(event.data.urls))
    return;

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        event.data.urls.map(async (candidate) => {
          const url = new URL(candidate, self.location.origin);
          if (url.origin !== self.location.origin) return;
          const response = await fetch(url.href);
          if (response.ok) await cache.put(url.href, response);
        }),
      ),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/"))
    return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetchAndCache(event.request).catch(
        async () => (await caches.match(event.request)) || caches.match("/"),
      ),
    );
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then(
        (cached) =>
          cached ||
          fetchAndCache(event.request).catch(() =>
            offlineAssetResponse(event.request),
          ),
      ),
  );
});

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

function offlineAssetResponse(request) {
  if (request.destination === "image") {
    return new Response(TRANSPARENT_IMAGE, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" },
    });
  }

  return new Response("Offline", {
    status: 503,
    statusText: "Offline",
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
  });
}
