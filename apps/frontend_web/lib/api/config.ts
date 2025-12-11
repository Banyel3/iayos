// API Configuration
// In Docker: NEXT_PUBLIC_API_URL="http://backend:8000" (service name)
// Native dev: NEXT_PUBLIC_API_URL="http://localhost:8000" (host)
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const API_BASE = apiUrl; // Base URL without /api
export const API_BASE_URL = `${apiUrl}/api`; // Base URL with /api

const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8001";
export const WS_BASE_URL = wsUrl.replace(/^wss?:\/\//, ""); // Strip protocol for WebSocket
