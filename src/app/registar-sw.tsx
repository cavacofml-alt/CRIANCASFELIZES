"use client";

import { useEffect } from "react";

// Regista o service worker mínimo que torna a app instalável como PWA
// (ecrã inicial do telemóvel, sem passar pela App Store/Play Store).
export function RegistarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Falhar aqui não deve impedir a app de funcionar normalmente.
      });
    }
  }, []);

  return null;
}
