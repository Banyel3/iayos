/**
 * Centralized API Configuration for iAyos Frontend
 *
 * This file provides environment-aware API URLs that work in both
 * development (localhost) and production environments.
 *
 * Usage:
 *   import { API_URL, WS_URL } from '@/lib/api-config';
 *   fetch(`${API_URL}/api/jobs/${jobId}`);
 */

import { API_BASE } from "@/lib/api/config";

// Base API URL - uses centralized config from @/lib/api/config
export const API_URL = API_BASE;

// WebSocket URL - for real-time features
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

// Server-side API URL - for Next.js SSR/API routes (uses Docker service name)
export const SERVER_API_URL = process.env.SERVER_API_URL || API_URL;

/**
 * Helper to construct full API endpoint URLs
 * @param path - API path starting with /api/
 * @returns Full URL string
 */
export function apiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}

/**
 * Helper to construct WebSocket URLs
 * @param path - WebSocket path
 * @returns Full WebSocket URL string
 */
export function wsUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${WS_URL}${normalizedPath}`;
}

// Export default fetch options for API calls
export const defaultFetchOptions: RequestInit = {
  credentials: "include" as RequestCredentials,
  headers: {
    "Content-Type": "application/json",
  },
};
