/* חשבוניה — עבודה בלי אינטרנט: קודם מהרשת (תמיד הגרסה העדכנית), ואם אין חיבור — מהמטמון */
const CACHE = 'heshboniya-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // רק קבצי האפליקציה עצמה. בקשות לשרת הנתונים (Supabase) עוברות כרגיל
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(req, { signal: ctrl.signal });
      clearTimeout(t);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') { const home = await cache.match('./'); if (home) return home; }
      throw err;
    }
  })());
});
