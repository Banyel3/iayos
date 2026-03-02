// API Configuration
// Production (Vercel): NEXT_PUBLIC_API_URL unset → falls back to https://api.iayos.online
// Docker full-stack:   NEXT_PUBLIC_API_URL=http://backend:8000 (service name)
// Native dev:          NEXT_PUBLIC_API_URL=http://localhost:8000 (host)
// Live-backend proxy:  NEXT_PUBLIC_API_URL unset + BACKEND_PROXY_URL set → uses relative /api/* (no CORS)

// Helper to ensure URL has protocol
function ensureProtocol(
  url: string | undefined,
  defaultProtocol = "https://",
): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${defaultProtocol}${url}`;
}

// Determine if we're in production (Vercel sets NODE_ENV=production and VERCEL=1)
const isProduction =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
const productionApiUrl = "https://api.iayos.online";
// In dev with no NEXT_PUBLIC_API_URL, default to "" (relative) so the Next.js
// rewrite proxy can intercept calls — avoids CORS when testing against live backend.
const developmentApiUrl = "";

const apiUrl =
  ensureProtocol(process.env.NEXT_PUBLIC_API_URL) ||
  ensureProtocol(process.env.NEXT_PUBLIC_API_BASE) ||
  (isProduction ? productionApiUrl : developmentApiUrl);
export const API_BASE = apiUrl; // Base URL without /api
export const API_BASE_URL = `${apiUrl}/api`; // Base URL with /api


// WebSocket URL - production uses wss, dev uses ws
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || (isProduction ? "wss://api.iayos.online" : "ws://localhost:8000");
export const WS_BASE_URL = wsUrl.replace(/^wss?:\/\//, ""); // Strip protocol for WebSocket
