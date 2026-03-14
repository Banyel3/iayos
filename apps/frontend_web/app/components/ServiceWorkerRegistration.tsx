"use client";

import { useEffect } from "react";
import { registerServiceWorker, unregisterServiceWorker } from "@/lib/service-worker/register";

/**
 * Service Worker Registration Component
 *
 * Registers the service worker for offline caching and performance optimization.
 * Should be mounted once at the root layout level.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker in production to avoid development caching issues
    if (process.env.NODE_ENV === "production") {
      registerServiceWorker();
    } else {
      // In development, ensure any stale service worker is removed
      unregisterServiceWorker();
    }
  }, []);

  // This component doesn't render anything
  return null;
}
