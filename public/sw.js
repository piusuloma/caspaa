/* ============================================================
   CASPAA Service Worker — offline-first (Phase 1: install + read cache)

   Strategy
   - Navigation (HTML "/"):  network-first, fall back to cached shell
                             so the app opens with no connection.
   - Static assets (JS/CSS/  cache-first IGNORING the query string,
     fonts/CDN):             because pages/index.js cache-busts the app
                             scripts with "?v=Date.now()". Ignoring the
                             query lets a previously-cached copy serve
                             offline, and we revalidate in the background.
   - App data lives in LocalStorage (caspaa_db_v5), which is already
     available offline — so a cached shell + assets = a browsable app.

   Bump CACHE_VERSION on any deploy that must invalidate the old cache.
   ============================================================ */

const CACHE_VERSION = 'caspaa-v2';
const SHELL_URL = '/';

// Best-effort precache of the app shell so the very first offline load works.
const SHELL_ASSETS = [
  '/',
  '/css/styles.css',
  '/manifest.webmanifest',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache Next.js HMR / dev websockets or API-ish calls.
  if (url.pathname.startsWith('/_next/webpack-hmr') || url.pathname.startsWith('/api/')) return;

  // 0) Next.js build assets (/_next/…) → NETWORK-FIRST.
  //    These filenames change every build (and every dev restart). Serving a
  //    stale, cache-first copy across builds boots the wrong bundle and leaves
  //    a blank page. Network-first keeps the current build correct online while
  //    still falling back to cache when genuinely offline.
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 1) Navigations → network-first, fall back to the cached shell.
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(SHELL_URL, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(SHELL_URL).then((r) => r || caches.match('/')))
    );
    return;
  }

  // 2) Everything else (JS, CSS, fonts, CDN, images) → cache-first,
  //    ignoring the query string so "?v=…" cache-busted assets still hit.
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          // Cache same-origin and opaque cross-origin (CDN) responses.
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      // Serve cache immediately when present; revalidate in the background.
      return cached || network;
    })
  );
});
