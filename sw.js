/* English Lab – service worker: mở NGAY từ bản đã lưu trong máy, tải bản mới ở nền (lần mở sau sẽ dùng bản mới) */
const CACHE = 'englab-v7.4g';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png', './gate-config.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const tagOf = r => r && (r.headers.get('etag') || r.headers.get('last-modified') || r.headers.get('content-length') || '');
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (/\.xlsx$/i.test(new URL(r.url).pathname)) return;   // file Excel: app tự kiểm tra & cập nhật, không qua bộ nhớ SW
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
    const net = fetch(r, { cache: 'no-cache' }).then(res => {
      if (res.ok) {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(r, cp));
        if (hit && r.mode === 'navigate' && tagOf(hit) !== tagOf(res)) self.clients.matchAll().then(cs => cs.forEach(c => c.postMessage({ type: 'update' })));
      }
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return net.then(res => res || (r.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
  }));
});
