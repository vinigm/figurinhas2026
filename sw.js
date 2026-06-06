// Service worker — cache do "app shell" (funciona offline depois da 1ª visita).
// Caminhos relativos pra funcionar no subdiretório do GitHub Pages.

const CACHE = 'figurinhas-v13';
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/auth.js',
  './js/album-data.js',
  './js/state.js',
  './js/storage.js',
  './js/render.js',
  './js/interactions.js',
  './js/tabs.js',
  './js/views.js',
  './js/export.js',
  './js/admin.js',
  './js/config.js',
  './js/trades.js',
  './js/import-utils.js',
  './js/firebase-config.js',
  './manifest.webmanifest',
  './icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Deixa o Firebase (auth/firestore/gstatic) sempre pela rede.
  if (url.origin !== self.location.origin) return;

  // Navegação (HTML): network-first com fallback pro cache.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Demais assets locais: stale-while-revalidate.
  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
