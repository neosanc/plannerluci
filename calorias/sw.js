/* Guarda la app en el móvil para que funcione sin internet. */
const CACHE = "miscalorias-v1";
const ARCHIVOS = [
  "./", "./index.html", "./estilos.css", "./alimentos.js", "./app.js",
  "./manifest.webmanifest", "./icono-192.png", "./icono-512.png"
];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Responde con la copia guardada (rápido y sin internet) y, de paso,
   se baja la versión nueva para la próxima vez. */
self.addEventListener("fetch", ev => {
  const req = ev.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  ev.respondWith(
    caches.match(req).then(guardada => {
      const red = fetch(req).then(res => {
        if(res && res.status === 200){
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }
        return res;
      }).catch(() => guardada);
      return guardada || red;
    })
  );
});
