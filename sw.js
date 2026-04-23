// =========================================================
// Scanner Etiquetas — Service Worker v2.0.0
// Pipeline simplificado: barcode → OCR (spa) → fill form
// Captura desde cámara en vivo + import de foto
// Para forzar update: subir CACHE_VERSION
// =========================================================

const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `scan-etiquetas-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

const RUNTIME_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdn.jsdelivr.net',
  'https://cdnjs.cloudflare.com',
  'https://unpkg.com',
  'https://tessdata.projectnaptha.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(APP_SHELL.map((url) =>
        cache.add(url).catch((err) => console.warn('SW add failed:', url, err))
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('scan-etiquetas-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isRuntime = RUNTIME_ORIGINS.some(o => req.url.startsWith(o));
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin && !isRuntime) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Stale-while-revalidate
        fetch(req).then((fresh) => {
          if (fresh && fresh.ok) {
            caches.open(CACHE_NAME).then((c) => c.put(req, fresh.clone())).catch(() => {});
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(req).then((response) => {
        if (response && (response.ok || response.type === 'opaque')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone)).catch(() => {});
        }
        return response;
      }).catch(() => {
        if (req.destination === 'document') return caches.match('./index.html');
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
