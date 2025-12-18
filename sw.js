// sw.js (dinámico: sirve para local y GH Pages)
const CACHE_NAME = 'flags-game-v4';
// Last Modified: 2025-12-13 (Force update)

// scope = e.g. "http://127.0.0.1:5500/" o "https://...github.io/Juego-de-Banderas/"
const SCOPE = self.registration.scope;
const ORIGIN = self.location.origin;
// BASE = "" en local, "/Juego-de-Banderas" en GH Pages
const BASE = SCOPE.replace(ORIGIN, '').replace(/\/$/, '');

const path = (p) => (BASE ? `${BASE}${p}` : `.${p}`);

const PRECACHE = [
  path('/'),
  path('/index.html'),
  path('/css/normalize.css'),
  path('/css/homepage-dist.css'),
  path('/javascript/homepage.js'),
  path('/assets/favicon/android-icon-192x192.png'),
  path('/assets/favicon/icon-512.png')
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const url of PRECACHE) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`${url} → ${res.status}`);
        await cache.put(url, res.clone());
      } catch (e) {
        console.error('❌ Precache falló en:', url, e);
      }
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});

const isHTML = (req) =>
  req.mode === 'navigate' ||
  (req.destination === '' && (req.headers.get('accept') || '').includes('text/html'));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Ignorar esquemas no soportados (ej: chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // HTML: NetworkFirst con fallback
  if (isHTML(req)) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match(path('/index.html'))))
    );
    return;
  }

  const staticTypes = ['script', 'style', 'image', 'font'];
  if (staticTypes.includes(req.destination)) {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        if (!res || res.status !== 200) return res;
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
