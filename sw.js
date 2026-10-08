// مصروف البيت: يخلّي التطبيق يفتح من غير نت
const VERSION = 'masroof-v4';
const SHELL = ['./', './index.html', './manifest.json',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const FB_FILES = ['firebase-app.js', 'firebase-firestore.js'].map(f => FB + f);
const CACHE_HOSTS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(SHELL);
    // مكتبة المزامنة: لو النت مش موجود دلوقتي هتتحفظ أول ما تتحمّل
    await Promise.all(FB_FILES.map(u => c.add(u).catch(() => {})));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  if (!same && !CACHE_HOSTS.includes(url.hostname)) return; // طلبات Firebase نفسها تعدّي عادي

  // الملفات بتتفتح من الحفظ فوراً، وتتحدّث في الخلفية لو فيه نت
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const key = req.mode === 'navigate' ? './index.html' : req;
    const cached = await c.match(key, { ignoreSearch: req.mode === 'navigate' });
    const fresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) c.put(key, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { e.waitUntil(fresh); return cached; }
    return (await fresh) || new Response('', { status: 504 });
  })());
});
