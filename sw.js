// sw.js — ทำให้ติดตั้งเป็นแอปได้ และเปิดครั้งต่อไปเร็วขึ้น
// ตัวละคร (lunaria.js 25 MB) กับไอคอน: เก็บไว้ในเครื่องครั้งเดียว ไม่โหลดใหม่ทุกครั้ง (เปลี่ยนโมเดลเมื่อไหร่ ให้เปลี่ยนเลข MODEL)
// หน้าเว็บ game.js style.css: ดึงของใหม่จากเน็ตก่อนเสมอ ไม่มีเน็ตค่อยใช้ของที่เก็บไว้ (อัปเดตเกมแล้วเห็นทันที)
// หมายเหตุ: ไมค์ใช้ระบบฟังเสียงของเบราว์เซอร์ ต้องมีเน็ตอยู่ดี
const MODEL = 'lamplight-model-1';
const PAGES = 'lamplight-pages-1';
const KEEP = [MODEL, PAGES];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('lamplight-') && !KEEP.includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const fonts = /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !fonts) return;
  const big = same && (/\/lunaria\.js$/.test(url.pathname) || /\/icons\//.test(url.pathname));
  if (big || fonts) e.respondWith(cacheFirst(req, big ? MODEL : PAGES));
  else e.respondWith(networkFirst(req));
});

async function cacheFirst(req, name) {
  const c = await caches.open(name);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) c.put(req, res.clone());   // ไม่เก็บแบบ opaque (Chrome นับพื้นที่เกินจริงหลาย MB)
  return res;
}
async function networkFirst(req) {
  const c = await caches.open(PAGES);
  try {
    const res = await fetch(req, { cache: 'no-cache' });
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}
