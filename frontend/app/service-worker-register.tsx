"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") {
      let warmupTimeout: number | undefined;
      void navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then(async (registration) => {
          await registration.update();
          const readyRegistration = await navigator.serviceWorker.ready;
          warmCurrentPageCache(readyRegistration);
          warmupTimeout = window.setTimeout(
            () => warmCurrentPageCache(readyRegistration),
            1500,
          );
        });
      return () => window.clearTimeout(warmupTimeout);
    }

    void navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(
          registrations.map((registration) => registration.unregister()),
        ),
      );
    if ("caches" in window) {
      void caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("casa-viva-"))
              .map((key) => caches.delete(key)),
          ),
        );
    }
  }, []);

  return null;
}

function warmCurrentPageCache(registration: ServiceWorkerRegistration) {
  const urls = new Set<string>([window.location.href]);
  for (const entry of performance.getEntriesByType("resource")) {
    const url = new URL(entry.name, window.location.href);
    if (url.origin === window.location.origin) urls.add(url.href);
  }
  registration.active?.postMessage({ type: "CACHE_URLS", urls: [...urls] });
}
