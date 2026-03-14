"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/service-worker/register";

/**
 * Service Worker Registration Component
 *
 * Registers the service worker for offline caching and performance optimization.
 * Should be mounted once at the root layout level.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Register service worker on component mount
    registerServiceWorker();
  }, []);

  // This component doesn't render anything
  return null;
}
