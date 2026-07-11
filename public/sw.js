/* cadence service worker: conservative offline support.
   - hashed static assets: cache-first (they never change per url)
   - page navigations: network-first, fall back to cache when offline
   - api / auth / rsc / audio: left to the network (never cached)
*/
const VERSION = "cadence-v1";
const CACHE = `${VERSION}-static`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // leave cross-origin (audio) alone
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth")) return;
  if (url.searchParams.has("_rsc")) return; // client rsc payloads: network only

  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon.svg") {
    event.respondWith(cacheFirst(req));
    return;
  }
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = (await cache.match(req)) ?? (await cache.match("/"));
    return hit ?? Response.error();
  }
}
