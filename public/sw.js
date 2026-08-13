// Service worker mínimo — existe só para o browser considerar a app
// "instalável" como PWA. Não faz cache agressivo de propósito: os
// dados (presenças, mensagens, fotos) têm de estar sempre atualizados,
// nunca servidos de uma cópia antiga por engano.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Sem intercepção: tudo passa sempre pela rede.
});
