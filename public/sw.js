const CACHE_NAME = "badro-cache-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // ناوبری صفحات: تلاش شبکه، در صورت آفلاین بودن نمایش صفحه fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // فایل‌های استاتیک (آیکون‌ها، عکس‌های اسلایدر، و خروجی بیلد Next.js شامل
  // CSS/JS/فونت‌های self-host‌شده‌ی @fontsource که همه زیر _next/static/
  // با هش نسخه قرار می‌گیرند): cache-first برای لود سریع‌تر.
  //
  // ⚠️ عمداً هیچ مسیر دیگری اینجا cache نمی‌شود — یعنی صفحه‌ی نتایج مقایسه
  // قیمت (/results)، پیش‌نمایش قیمت تقریبی، و ثبت سفارش (که همه از طریق
  // ناوبری صفحه یا Server Action با روش POST انجام می‌شوند، نه GET به این
  // مسیرهای استاتیک) هرگز از کش سرو نمی‌شوند و همیشه مستقیم به شبکه/سرور
  // می‌روند — تا قیمت نمایش‌داده‌شده همیشه واقعی و به‌روز بماند.
  const url = new URL(request.url);
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/slides/") ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
  }
});
