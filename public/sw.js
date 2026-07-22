const CACHE_NAME = "bnp-govt-v1";
const STATIC_ASSETS = ["/", "/index.html"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "🇧🇩 বাংলাদেশ সরকার";
  const options = {
    body: data.body || "নতুন আপডেট আছে",
    icon: "/logo192.png",
    badge: "/logo192.png",
    tag: data.tag || "govt-update",
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "দেখুন" },
      { action: "close", title: "বন্ধ করুন" }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  if (event.action === "open" || !event.action) {
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
  }
});