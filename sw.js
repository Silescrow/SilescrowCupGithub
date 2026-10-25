// SILESCROW CUP – Service Worker: macht das Spiel als App installierbar.
// Immer zuerst aus dem Netz laden (damit Updates sofort kommen); ohne Internet die zuletzt geladene Version.
const CACHE = 'silescrow-v1';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok && r.mode === 'navigate'){ const k = res.clone(); caches.open(CACHE).then(c => c.put(r, k)); } return res; })
    .catch(() => caches.match(r).then(m => m || caches.match('./'))));
});
