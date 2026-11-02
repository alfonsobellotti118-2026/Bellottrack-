/* Service worker di Bellottrack food fit: tiene l'app disponibile anche senza connessione. */
const VERSION = 'bellottrack-food-fit-v1';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png'
];
// Risorse esterne da conservare dopo il primo uso (scanner e font).
const RUNTIME_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Il database dei prodotti va sempre in rete: lo gestisce l'app.
  if (url.hostname.endsWith('openfoodfacts.org')) return;

  // Pagine e file dell'app: prima la copia salvata, poi aggiornamento in sottofondo.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        }).catch(() => cached || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
        return cached || network;
      })
    );
    return;
  }

  // Scanner e font: copia salvata dopo il primo caricamento.
  if (RUNTIME_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
