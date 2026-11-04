// Popote : fonctionne hors connexion. Rien n'est envoyé ailleurs que ce site.
const VERSION = "popote-4";
const CORE = [
  "./", "index.html", "app.js", "recipes.json", "manifest.webmanifest",
  "fonts/fonts.css", "icons/favicon.svg", "icons/icon-192.png", "icons/apple-touch-icon.png"
];
const IMG = "popote-img";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== IMG).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;

  // Photos et polices : depuis le cache d'abord, elles ne changent pas.
  if (url.pathname.includes("/img/") || url.pathname.includes("/fonts/") || url.pathname.includes("/vendor/")) {
    const name = url.pathname.includes("/img/") ? IMG : VERSION;
    e.respondWith(caches.open(name).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) c.put(req, res.clone());
      return res;
    }))));
    return;
  }

  // Le reste : réponse immédiate depuis le cache, mise à jour en arrière-plan.
  e.respondWith(caches.open(VERSION).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(res => {
      if (res.ok) c.put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  })));
});
