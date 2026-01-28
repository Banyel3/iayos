// API Configuration
// In Docker: NEXT_PUBLIC_API_URL="http://backend:8000" (service name)
// Native dev: NEXT_PUBLIC_API_URL="http://localhost:8000" (host)
// Production (Vercel): Falls back to https://api.iayos.online

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
const developmentApiUrl = "http://localhost:8000";

const apiUrl =
  ensureProtocol(process.env.NEXT_PUBLIC_API_URL) ||
  ensureProtocol(process.env.NEXT_PUBLIC_API_BASE) ||
  (isProduction ? productionApiUrl : developmentApiUrl);
export const API_BASE = apiUrl; // Base URL without /api
export const API_BASE_URL = `${apiUrl}/api`; // Base URL with /api

const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8001";
export const WS_BASE_URL = wsUrl.replace(/^wss?:\/\//, ""); // Strip protocol for WebSocket
