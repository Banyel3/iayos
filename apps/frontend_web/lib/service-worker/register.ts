/**
 * Service Worker Registration
 * Enables offline caching and faster page loads
 */

export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registered:", registration);

          // Check for updates every hour
          setInterval(
            () => {
              registration.update();
            },
            60 * 60 * 1000
          );
        })
        .catch((error) => {
          console.warn("Service Worker registration failed:", error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error("Service Worker unregistration failed:", error);
      });
  }
}
