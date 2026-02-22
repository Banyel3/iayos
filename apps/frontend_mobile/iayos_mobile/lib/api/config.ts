// API Configuration for React Native Mobile App
// Backend URL for development (change for production)
// Note: For iOS Simulator, use your machine's local IP (found in Expo output)
// For Android Emulator, use 10.0.2.2
// For physical device, use your machine's network IP

import { Platform, Alert } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import Constants from "expo-constants";

// PRODUCTION URL - hardcoded as the authoritative production endpoint
const PRODUCTION_API_URL = "https://api.iayos.online";

const normalizeApiUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return PRODUCTION_API_URL;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  // Strip trailing /api if provided to avoid double /api/api paths
  return withProtocol.replace(/\/api\/?$/i, "");
};

// AUTOMATIC IP DETECTION: Expo auto-detects your network IP automatically
// When you switch networks, Expo will automatically use the new IP
const getDevIP = (): string => {
  // Priority 1: Try to use Expo's detected IP from Constants
  // This works when running via Expo Go and detects your machine's IP automatically
  try {
    const expoIP = Constants.expoConfig?.hostUri?.split(":")[0];
    if (expoIP && expoIP !== "localhost" && expoIP !== "127.0.0.1") {
      console.log("[API Config] Using Expo detected IP:", expoIP);
      return expoIP;
    }
  } catch (e) {
    // Expo Constants not available
  }

  // Priority 2: Environment variable (manual override if needed)
  if (process.env.EXPO_PUBLIC_DEV_IP) {
    console.log(
      "[API Config] Using EXPO_PUBLIC_DEV_IP:",
      process.env.EXPO_PUBLIC_DEV_IP,
    );
    return process.env.EXPO_PUBLIC_DEV_IP;
  }

  // Priority 3: Fallback to production URL (safe for all environments)
  console.warn("[API Config] No dev IP found, using production URL");
  return PRODUCTION_API_URL.replace("https://", "").replace("http://", "");
};

const DEV_IP = getDevIP();

// Allow environment variable override for CI/CD (e.g., staging backend in Detox tests)
// In production builds (__DEV__ = false), ALWAYS use production URL
const API_URL = normalizeApiUrl(
  process.env.EXPO_PUBLIC_API_URL ||
    (__DEV__ ? `http://${DEV_IP}:8000` : PRODUCTION_API_URL),
);

const DEBUG_NETWORK = process.env.EXPO_PUBLIC_DEBUG_NETWORK === "true";

// Log the API URL being used (helps debug network issues)
console.log(`[API Config] API_URL = ${API_URL}`);
console.log(`[API Config] __DEV__ = ${__DEV__}, Platform = ${Platform.OS}`);
console.log(
  `[API Config] EXPO_PUBLIC_API_URL = ${process.env.EXPO_PUBLIC_API_URL || "(not set)"}`,
);

// DEBUG: Show alert in production builds to verify API URL configuration
// Remove this after confirming the network issue is resolved
if (!__DEV__ && DEBUG_NETWORK) {
  // Delay alert to ensure app is fully loaded
  setTimeout(() => {
    Alert.alert(
      "API Debug Info",
      `URL: ${API_URL}\nPlatform: ${Platform.OS}\nENV: ${process.env.EXPO_PUBLIC_API_URL || "not set"}`,
      [{ text: "OK" }],
    );
  }, 2000);
}

/**
 * Check network connectivity before making requests.
 * Returns detailed network state for debugging.
 */
export const checkNetworkConnectivity = async (): Promise<{
  isConnected: boolean;
  type: string;
  details: string;
}> => {
  try {
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected ?? false;
    const type = state.type || "unknown";
    const details = JSON.stringify({
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: state.details,
    });

    console.log(
      `[Network] Connectivity check: connected=${isConnected}, type=${type}`,
    );
    return { isConnected, type, details };
  } catch (error) {
    console.error("[Network] Failed to check connectivity:", error);
    return { isConnected: false, type: "error", details: String(error) };
  }
};

// One-time debug check to verify DNS/TLS/connectivity on device.
export const debugNetworkDiagnostics = async (
  label: string = "startup",
): Promise<void> => {
  if (!DEBUG_NETWORK) return;

  const startedAt = Date.now();
  console.log(`[Network][DEBUG] (${label}) Starting diagnostics...`);

  try {
    const netState = await checkNetworkConnectivity();
    console.log(`[Network][DEBUG] (${label}) NetInfo:`, netState);

    const healthUrl = `${API_URL}/health/live`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const resp = await fetch(healthUrl, {
      method: "GET",
      signal: controller.signal as any,
    });

    clearTimeout(timeoutId);
    const elapsedMs = Date.now() - startedAt;

    console.log(
      `[Network][DEBUG] (${label}) Health check ${resp.status} ${resp.statusText} in ${elapsedMs}ms (${healthUrl})`,
    );
  } catch (error: any) {
    const elapsedMs = Date.now() - startedAt;
    console.error(
      `[Network][DEBUG] (${label}) Health check failed after ${elapsedMs}ms`,
    );
    console.error(`[Network][DEBUG] (${label}) Error name: ${error?.name}`);
    console.error(
      `[Network][DEBUG] (${label}) Error message: ${error?.message}`,
    );
  }
};

export const preflightBackendReachability = async (
  label: string = "preflight",
  timeoutMs: number = 30000,
  failOpen: boolean = true,
): Promise<void> => {
  const startedAt = Date.now();
  const healthUrl = `${API_URL}/health/live`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(healthUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal as any,
    });

    const elapsedMs = Date.now() - startedAt;

    if (!resp.ok) {
      throw new Error(
        `Health check failed: ${resp.status} ${resp.statusText} (${elapsedMs}ms)`,
      );
    }

    if (DEBUG_NETWORK) {
      console.log(
        `[Network][DEBUG] (${label}) Health check OK in ${elapsedMs}ms (${healthUrl})`,
      );
    }
  } catch (error: any) {
    const elapsedMs = Date.now() - startedAt;
    if (DEBUG_NETWORK) {
      console.error(
        `[Network][DEBUG] (${label}) Health check failed after ${elapsedMs}ms`,
      );
      console.error(`[Network][DEBUG] (${label}) Error name: ${error?.name}`);
      console.error(
        `[Network][DEBUG] (${label}) Error message: ${error?.message}`,
      );
    }
    if (!failOpen) {
      throw new Error(
        `Unable to reach backend from this device (health check failed after ${elapsedMs}ms). ` +
          `Please verify your network, DNS, or VPN settings and try again.`,
      );
    }
  } finally {
    clearTimeout(timeoutId);
  }
};

const deriveDevWebUrl = () => {
  try {
    const parsed = new URL(API_URL);
    const protocol = parsed.protocol || "http:";
    const hostname = parsed.hostname || "localhost";
    // Use port 3400 for frontend (3000-3369 are in Windows excluded port range)
    const defaultPort = "3400";
    return `${protocol}//${hostname}:${defaultPort}`;
  } catch {
    return "http://localhost:3400";
  }
};

const WEB_APP_URL =
  process.env.EXPO_PUBLIC_WEB_APP_URL ||
  (__DEV__ ? deriveDevWebUrl() : "https://app.iayos.com");

// Use backend endpoint for mobile email verification (avoids cross-server timeout issues)
export const EMAIL_VERIFICATION_ENDPOINT = `${API_URL}/api/mobile/auth/send-verification-email`;

// OTP-based email verification endpoints
export const OTP_EMAIL_ENDPOINT = `${API_URL}/api/mobile/auth/send-otp-email`;
export const VERIFY_OTP_ENDPOINT = `${API_URL}/api/accounts/verify-otp`;
export const RESEND_OTP_ENDPOINT = `${API_URL}/api/accounts/resend-otp`;

export const API_BASE_URL = `${API_URL}/api`;

// WebSocket URL - Use production WebSocket if API is pointing to production
// This allows testing production chat in Expo Go while still in __DEV__ mode
const isUsingProductionAPI =
  API_URL.includes("iayos.online") || API_URL.includes("iayos.com");
export const WS_BASE_URL =
  process.env.EXPO_PUBLIC_WS_URL ||
  (isUsingProductionAPI
    ? "wss://api.iayos.online"
    : __DEV__
      ? `ws://${DEV_IP}:8000`
      : "wss://api.iayos.online");

console.log(`[API Config] WS_BASE_URL = ${WS_BASE_URL}`);

/**
 * Convert relative media URLs to absolute URLs for React Native Image component.
 * Local storage returns relative paths like /media/... which need the host prepended.
 * Supabase returns full URLs (https://...) which are passed through unchanged.
 */
export const getAbsoluteMediaUrl = (
  url: string | null | undefined,
): string | null => {
  if (!url) return null;

  // Already absolute URL (Supabase or other external)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Relative URL from local storage - prepend API host
  if (url.startsWith("/media/") || url.startsWith("media/")) {
    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  // Other relative paths
  if (url.startsWith("/")) {
    return `${API_URL}${url}`;
  }

  return url;
};

// API Endpoints
export const ENDPOINTS = {
  // Authentication - Use mobile endpoints with Bearer token auth
  LOGIN: `${API_URL}/api/mobile/auth/login`,
  LOGOUT: `${API_URL}/api/mobile/auth/logout`,
  REGISTER: `${API_URL}/api/mobile/auth/register`,
  ME: `${API_URL}/api/mobile/auth/profile`,
  ASSIGN_ROLE: `${API_URL}/api/mobile/auth/assign-role`,
  UPDATE_PROFILE: `${API_URL}/api/mobile/profile/update`, // For client profile updates
  GOOGLE_SIGNIN: `${API_URL}/api/mobile/auth/google`,

  // OTP Verification
  VERIFY_OTP_ENDPOINT: `${API_URL}/api/accounts/verify-otp`,
  RESEND_OTP_ENDPOINT: `${API_URL}/api/accounts/resend-otp`,
  OTP_EMAIL_ENDPOINT: `${API_URL}/api/mobile/auth/send-otp-email`,

  // Forgot Password
  FORGOT_PASSWORD_SEND: `${API_URL}/api/accounts/forgot-password/send-verify`,
  FORGOT_PASSWORD_VERIFY: `${API_URL}/api/accounts/forgot-password/verify`,
  FORGOT_PASSWORD_VERIFY_OTP: `${API_URL}/api/accounts/forgot-password/verify-otp`,

  // Jobs - Use mobile endpoints with Bearer token auth
  AVAILABLE_JOBS: `${API_URL}/api/mobile/jobs/available`,
  MY_JOBS: `${API_URL}/api/mobile/jobs/my-jobs`,
  JOB_DETAILS: (id: number) => `${API_URL}/api/mobile/jobs/${id}`,
  DELETE_JOB: (id: number) => `${API_URL}/api/mobile/jobs/${id}`,
  UPDATE_JOB: (id: number) => `${API_URL}/api/mobile/jobs/${id}`,
  JOB_APPLICATIONS: (id: number) =>
    `${API_URL}/api/mobile/jobs/${id}/applications`,
  ACCEPT_APPLICATION: (jobId: number, applicationId: number) =>
    `${API_URL}/api/mobile/jobs/${jobId}/applications/${applicationId}/accept`,
  REJECT_APPLICATION: (jobId: number, applicationId: number) =>
    `${API_URL}/api/mobile/jobs/${jobId}/applications/${applicationId}/reject`,
  ACCEPT_INVITE: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/accept-invite`,
  REJECT_INVITE: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/reject-invite`,
  INVITE_WORKER: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/invite-worker`,
  INVITED_WORKERS: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/invited-workers`,
  APPLY_JOB: (id: number) => `${API_URL}/api/mobile/jobs/${id}/apply`,
  MY_APPLICATIONS: `${API_URL}/api/mobile/jobs/applications/my`,
  APPLICATION_DETAIL: (applicationId: number) =>
    `${API_URL}/api/mobile/applications/${applicationId}`,
  WITHDRAW_APPLICATION: (applicationId: number) =>
    `${API_URL}/api/mobile/applications/${applicationId}/withdraw`,
  MARK_COMPLETE: (id: number) => `${API_BASE_URL}/jobs/${id}/mark-complete`,
  APPROVE_COMPLETION: (id: number) =>
    `${API_BASE_URL}/jobs/${id}/approve-completion`,
  CONFIRM_WORK_STARTED: (id: number) =>
    `${API_BASE_URL}/jobs/${id}/confirm-work-started`,
  ACTIVE_JOBS: `${API_BASE_URL}/jobs/my-active-jobs`,
  UPLOAD_JOB_PHOTOS: (id: number) => `${API_BASE_URL}/jobs/${id}/upload-photos`,

  // Phase 3: Job Browsing & Filtering
  JOB_CATEGORIES: `${API_URL}/api/mobile/jobs/categories`,
  GET_CATEGORIES: `${API_URL}/api/mobile/jobs/categories`,
  JOB_SEARCH: (query: string, page = 1, limit = 20) =>
    `${API_URL}/api/mobile/jobs/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
  JOB_LIST_FILTERED: (filters: {
    category?: number;
    minBudget?: number;
    maxBudget?: number;
    location?: string;
    maxDistance?: number; // NEW: Distance filter in km
    sortBy?: string; // NEW: Sort option
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters.category)
      params.append("category", filters.category.toString());
    if (filters.minBudget)
      params.append("min_budget", filters.minBudget.toString());
    if (filters.maxBudget)
      params.append("max_budget", filters.maxBudget.toString());
    if (filters.location) params.append("location", filters.location);
    if (filters.maxDistance)
      params.append("max_distance", filters.maxDistance.toString());
    if (filters.sortBy) params.append("sort_by", filters.sortBy);
    params.append("page", filters.page?.toString() || "1");
    params.append("limit", filters.limit?.toString() || "20");
    return `${API_URL}/api/mobile/jobs/list?${params.toString()}`;
  },
  SAVE_JOB: (id: number) => `${API_URL}/api/mobile/jobs/${id}/save`,
  UNSAVE_JOB: (id: number) => `${API_URL}/api/mobile/jobs/${id}/save`,
  SAVED_JOBS: `${API_URL}/api/mobile/jobs/saved`,

  // Team Jobs (Multi-Skill Multi-Worker)
  CREATE_TEAM_JOB: `${API_BASE_URL}/jobs/team/create`,
  TEAM_JOB_DETAIL: (id: number) => `${API_BASE_URL}/jobs/team/${id}`,
  TEAM_JOB_APPLICATIONS: (jobId: number) =>
    `${API_BASE_URL}/jobs/team/${jobId}/applications`,
  TEAM_ACCEPT_APPLICATION: (jobId: number, applicationId: number) =>
    `${API_BASE_URL}/jobs/team/${jobId}/applications/${applicationId}/accept`,
  TEAM_REJECT_APPLICATION: (jobId: number, applicationId: number) =>
    `${API_BASE_URL}/jobs/team/${jobId}/applications/${applicationId}/reject`,
  TEAM_APPLY_SKILL_SLOT: (jobId: number) =>
    `${API_BASE_URL}/jobs/team/${jobId}/apply`,
  TEAM_START_JOB: (jobId: number) => `${API_BASE_URL}/jobs/team/${jobId}/start`,
  // These two use /{job_id}/team pattern (backend inconsistency)
  TEAM_APPROVE_COMPLETION: (jobId: number) =>
    `${API_BASE_URL}/jobs/${jobId}/team/approve-completion`,
  TEAM_WORKER_COMPLETE: (jobId: number, assignmentId: number) =>
    `${API_BASE_URL}/jobs/${jobId}/team/worker-complete/${assignmentId}`,
  TEAM_ASSIGN_WORKER: (jobId: number) =>
    `${API_BASE_URL}/jobs/${jobId}/team/assign`,
  TEAM_REMOVE_WORKER: (jobId: number, workerId: number) =>
    `${API_BASE_URL}/jobs/${jobId}/team/workers/${workerId}`,
  TEAM_START_AVAILABLE: (jobId: number) =>
    `${API_BASE_URL}/jobs/${jobId}/team/start-available`,

  // Agency PROJECT Job Workflow (mirrors DAILY job workflow)
  // Flow: Agency dispatches → Client confirms arrival → Agency marks complete → Client approves & pays
  AGENCY_DISPATCH_PROJECT_EMPLOYEE: (jobId: number, employeeId: number) =>
    `${API_URL}/api/agency/jobs/${jobId}/employees/${employeeId}/dispatch-project`,
  AGENCY_CONFIRM_PROJECT_ARRIVAL: (jobId: number, employeeId: number) =>
    `${API_BASE_URL}/jobs/${jobId}/employees/${employeeId}/confirm-arrival-project`,
  AGENCY_MARK_PROJECT_COMPLETE: (jobId: number, employeeId: number) =>
    `${API_URL}/api/agency/jobs/${jobId}/employees/${employeeId}/mark-complete-project`,
  AGENCY_APPROVE_PROJECT_JOB: (jobId: number) =>
    `${API_BASE_URL}/jobs/${jobId}/approve-agency-project`,
  AGENCY_APPROVE_PROJECT_EMPLOYEE: (jobId: number, employeeId: number) =>
    `${API_BASE_URL}/jobs/${jobId}/employees/${employeeId}/approve-agency-project-employee`,

  // Phase 4: Worker Profile & Application Management
  WORKER_PROFILE: `${API_URL}/api/mobile/auth/profile`,
  UPDATE_PROFILE_MOBILE: `${API_URL}/api/mobile/profile/update`,
  UPDATE_WORKER_PROFILE: `${API_BASE_URL}/accounts/worker/profile`,

  // Phase 5: Photo Upload (Avatar & Portfolio)
  UPLOAD_AVATAR: `${API_URL}/api/mobile/profile/upload-image`,
  DELETE_AVATAR: `${API_URL}/api/mobile/profile/avatar`,
  UPLOAD_PORTFOLIO_IMAGE: `${API_URL}/api/mobile/profile/portfolio`,
  PORTFOLIO_LIST: `${API_URL}/api/mobile/profile/portfolio`,
  PORTFOLIO_UPDATE: (id: number) =>
    `${API_URL}/api/mobile/profile/portfolio/${id}`,
  PORTFOLIO_REORDER: `${API_URL}/api/mobile/profile/portfolio/reorder`,
  PORTFOLIO_DELETE: (id: number) =>
    `${API_URL}/api/mobile/profile/portfolio/${id}`,
  PROFILE_METRICS: `${API_URL}/api/mobile/profile/metrics`,

  // Phase 6: Certifications & Materials
  // Note: Using /api/accounts/worker/ endpoints (web endpoints work for mobile with dual_auth)
  CERTIFICATIONS: `${API_BASE_URL}/accounts/worker/certifications`,
  CERTIFICATION_DETAIL: (id: number) =>
    `${API_BASE_URL}/accounts/worker/certifications/${id}`,
  MATERIALS: `${API_BASE_URL}/accounts/worker/materials`,
  MATERIAL_DETAIL: (id: number) =>
    `${API_BASE_URL}/accounts/worker/materials/${id}`,
  // Worker public materials (for clients to view filtered by category)
  WORKER_MATERIALS_PUBLIC: (workerId: number) =>
    `${API_BASE_URL}/accounts/workers/${workerId}/materials`,
  // Agency public materials (for clients to view filtered by category)
  AGENCY_MATERIALS_PUBLIC: (agencyId: number) =>
    `${API_BASE_URL}/accounts/agencies/${agencyId}/materials`,

  // Job Materials Purchasing Workflow
  JOB_MATERIALS: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/materials`,
  JOB_MATERIAL_PURCHASE_PROOF: (jobId: number, materialId: number) =>
    `${API_URL}/api/jobs/${jobId}/materials/${materialId}/purchase-proof`,
  JOB_MATERIAL_APPROVE: (jobId: number, materialId: number) =>
    `${API_URL}/api/jobs/${jobId}/materials/${materialId}/approve`,
  JOB_MATERIAL_REJECT: (jobId: number, materialId: number) =>
    `${API_URL}/api/jobs/${jobId}/materials/${materialId}/reject`,
  JOB_MATERIALS_MARK_BUYING: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/materials/mark-buying`,
  JOB_MATERIALS_SKIP: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/materials/skip`,

  // Worker skills (specializations the worker has)
  AVAILABLE_SKILLS: `${API_URL}/api/mobile/skills/available`,
  MY_SKILLS: `${API_URL}/api/mobile/skills/my-skills`,
  ADD_SKILL: `${API_URL}/api/mobile/skills/add`,
  UPDATE_SKILL: (skillId: number) => `${API_URL}/api/mobile/skills/${skillId}`,
  REMOVE_SKILL: (skillId: number) => `${API_URL}/api/mobile/skills/${skillId}`,

  // Support Tickets (Mobile)
  CREATE_SUPPORT_TICKET: `${API_URL}/api/mobile/support/ticket`,
  MY_SUPPORT_TICKETS: `${API_URL}/api/mobile/support/tickets`,
  SUPPORT_TICKET_DETAIL: (id: number) =>
    `${API_URL}/api/mobile/support/tickets/${id}`,
  REPLY_TO_TICKET: (id: number) =>
    `${API_URL}/api/mobile/support/tickets/${id}/reply`,

  // Worker
  WORKER_AVAILABILITY: `${API_BASE_URL}/accounts/worker/availability`,
  NEARBY_WORKERS: `${API_URL}/api/mobile/workers/list`,
  WORKER_DETAIL: (id: number) => `${API_URL}/api/mobile/workers/detail/${id}`,

  // Client
  CLIENT_DETAIL: (id: number) => `${API_URL}/api/mobile/clients/${id}`,

  // Locations
  GET_CITIES: `${API_URL}/api/mobile/locations/cities`,
  GET_BARANGAYS: (cityId: number) =>
    `${API_URL}/api/mobile/locations/cities/${cityId}/barangays`,

  // Location Tracking
  UPDATE_LOCATION: `${API_URL}/api/accounts/location/update`,
  GET_MY_LOCATION: `${API_URL}/api/accounts/location/me`,
  TOGGLE_LOCATION_SHARING: `${API_URL}/api/accounts/location/toggle-sharing`,

  // Client
  BROWSE_AGENCIES: `${API_BASE_URL}/client/agencies/browse`,
  AGENCY_PROFILE: (id: number) => `${API_BASE_URL}/client/agencies/${id}`,
  AGENCY_DETAIL: (id: number) => `${API_URL}/api/mobile/agencies/detail/${id}`,
  AGENCIES_LIST: `${API_URL}/api/mobile/agencies/list`,

  // Wallet - Use mobile endpoints with Bearer token auth
  WALLET_BALANCE: `${API_URL}/api/mobile/wallet/balance`,
  WALLET_PENDING_EARNINGS: `${API_URL}/api/mobile/wallet/pending-earnings`,
  TRANSACTIONS: `${API_URL}/api/mobile/wallet/transactions`,
  DEPOSIT: `${API_URL}/api/mobile/wallet/deposit`,
  // Mobile config endpoint (no auth required)
  MOBILE_CONFIG: `${API_URL}/api/mobile/config`,

  // Phase 3: Escrow Payment System (10 endpoints)
  CREATE_ESCROW_PAYMENT: `${API_URL}/api/mobile/payments/escrow`,
  // Create payment invoice via wallet deposit flow (PayMongo)
  CREATE_PAYMENT_INVOICE: `${API_URL}/api/mobile/wallet/deposit`,
  UPLOAD_CASH_PROOF: `${API_URL}/api/mobile/payments/cash-proof`,
  PAYMENT_STATUS: (id: number) => `${API_URL}/api/mobile/payments/status/${id}`,
  PAYMENT_HISTORY: `${API_URL}/api/mobile/payments/history`,
  WALLET_DEPOSIT: `${API_URL}/api/mobile/wallet/deposit`,
  WALLET_WITHDRAW: `${API_URL}/api/mobile/wallet/withdraw`,
  WALLET_TRANSACTIONS: `${API_URL}/api/mobile/wallet/transactions`,
  CREATE_JOB_WITH_PAYMENT: `${API_URL}/api/jobs/create-mobile`, // Direct worker/agency hiring
  CREATE_JOB: `${API_URL}/api/jobs/create-mobile`, // Direct worker/agency hiring
  // Payment webhooks (server-side only, not called from frontend)
  PAYMENT_WEBHOOK: `${API_URL}/api/accounts/wallet/paymongo-webhook`,
  PAYMENT_RECEIPT: (id: number) =>
    `${API_URL}/api/mobile/payments/receipt/${id}`,

  // Job Receipt/Invoice
  JOB_RECEIPT: (jobId: number) => `${API_URL}/api/jobs/${jobId}/receipt`,

  // Daily Attendance (for DAILY payment model jobs)
  WORKER_CHECK_IN: (jobId: number) =>
    `${API_URL}/api/mobile/daily-attendance/${jobId}/worker-check-in`,
  WORKER_CHECK_OUT: (jobId: number) =>
    `${API_URL}/api/mobile/daily-attendance/${jobId}/worker-check-out`,
  CLIENT_CONFIRM_ATTENDANCE: (attendanceId: number) =>
    `${API_URL}/api/mobile/daily-attendance/${attendanceId}/client-confirm`,
  // New flow: Client verifies arrival and marks checkout
  CLIENT_VERIFY_ARRIVAL: (jobId: number, attendanceId: number) =>
    `${API_URL}/api/jobs/${jobId}/daily/attendance/${attendanceId}/verify-arrival`,
  CLIENT_MARK_CHECKOUT: (jobId: number, attendanceId: number) =>
    `${API_URL}/api/jobs/${jobId}/daily/attendance/${attendanceId}/mark-checkout`,

  // Phase 4: Final Payment System (8 endpoints)
  CREATE_FINAL_PAYMENT: `${API_URL}/api/mobile/payments/final`,
  JOB_PAYMENT_STATUS: (id: number) =>
    `${API_URL}/api/jobs/${id}/payment-status`,
  JOB_EARNINGS: (id: number) => `${API_URL}/api/jobs/${id}/earnings`,
  PAYMENT_TIMELINE: (id: number) =>
    `${API_URL}/api/jobs/${id}/payment-timeline`,
  EARNINGS_SUMMARY: `${API_URL}/api/accounts/earnings/summary`,
  EARNINGS_HISTORY: `${API_URL}/api/accounts/earnings/history`,
  CASH_PAYMENT_STATUS: (id: number) =>
    `${API_URL}/api/mobile/payments/cash-status/${id}`,
  CREATE_PAYMENT_NOTIFICATION: `${API_URL}/api/notifications/payment`,

  // Phase 5: Real-Time Chat & Messaging (4 endpoints)
  CONVERSATIONS: `${API_URL}/api/profiles/chat/conversations`,
  CONVERSATION_BY_JOB: (jobId: number, reopen: boolean = false) =>
    `${API_URL}/api/profiles/chat/conversation-by-job/${jobId}${reopen ? "?reopen=true" : ""}`,
  CONVERSATION_MESSAGES: (id: number) =>
    `${API_URL}/api/profiles/chat/conversations/${id}`,
  SEND_MESSAGE: `${API_URL}/api/profiles/chat/messages`,
  UPLOAD_MESSAGE_IMAGE: (conversationId: number) =>
    `${API_URL}/api/profiles/chat/${conversationId}/upload-image`,

  // Voice Calling (Agora)
  CALL_TOKEN: (conversationId: number) =>
    `${API_URL}/api/profiles/call/token?conversation_id=${conversationId}`,

  // Phase 9: Push Notifications & Notification Management (8 endpoints)
  NOTIFICATIONS: `${API_URL}/api/accounts/notifications`,
  MARK_NOTIFICATION_READ: (id: number) =>
    `${API_URL}/api/accounts/notifications/${id}/mark-read`,
  MARK_ALL_NOTIFICATIONS_READ: `${API_URL}/api/accounts/notifications/mark-all-read`,
  UNREAD_NOTIFICATIONS_COUNT: `${API_URL}/api/accounts/notifications/unread-count`,
  REGISTER_PUSH_TOKEN: `${API_URL}/api/accounts/register-push-token`,
  UPDATE_NOTIFICATION_SETTINGS: `${API_URL}/api/accounts/notification-settings`,
  GET_NOTIFICATION_SETTINGS: `${API_URL}/api/accounts/notification-settings`,
  DELETE_NOTIFICATION: (id: number) =>
    `${API_URL}/api/accounts/notifications/${id}/delete`,

  // Phase 7: KYC Document Upload & Verification (9 endpoints)
  KYC_STATUS: `${API_URL}/api/accounts/kyc-status`,
  UPLOAD_KYC: `${API_URL}/api/accounts/upload-kyc`,
  KYC_UPLOAD: `${API_URL}/api/accounts/upload/kyc`, // Matches Next.js endpoint
  KYC_STAGE_FILE: `${API_URL}/api/accounts/kyc/stage-file`, // Per-file pre-upload before final submission
  KYC_VALIDATE_DOCUMENT: `${API_URL}/api/accounts/kyc/validate-document`, // Per-step validation
  KYC_EXTRACT_ID: `${API_URL}/api/accounts/kyc/extract-id`, // Per-step OCR extraction for ID
  KYC_EXTRACT_CLEARANCE: `${API_URL}/api/accounts/kyc/extract-clearance`, // Per-step OCR extraction for clearance
  KYC_APPLICATION_HISTORY: `${API_URL}/api/accounts/kyc-application-history`,
  KYC_AUTOFILL: `${API_URL}/api/accounts/kyc/autofill`, // Get AI-extracted data for auto-fill
  KYC_CONFIRM: `${API_URL}/api/accounts/kyc/confirm`, // Confirm/edit extracted data

  // Dual Profile Management (4 endpoints)
  DUAL_PROFILE_STATUS: `${API_URL}/api/mobile/profile/dual-status`,
  CREATE_CLIENT_PROFILE: `${API_URL}/api/mobile/profile/create-client`,
  CREATE_WORKER_PROFILE: `${API_URL}/api/mobile/profile/create-worker`,
  SWITCH_PROFILE: `${API_URL}/api/mobile/profile/switch-profile`,

  // Payment Methods
  PAYMENT_METHODS: `${API_URL}/api/mobile/payment-methods`,
  ADD_PAYMENT_METHOD: `${API_URL}/api/mobile/payment-methods`,
  DELETE_PAYMENT_METHOD: (id: number) =>
    `${API_URL}/api/mobile/payment-methods/${id}`,
  SET_PRIMARY_PAYMENT_METHOD: (id: number) =>
    `${API_URL}/api/mobile/payment-methods/${id}/set-primary`,

  // Phase 8: Reviews & Ratings (6 endpoints)
  // Use jobs API for review submission (supports agency employee reviews)
  SUBMIT_REVIEW: (jobId: number) => `${API_URL}/api/jobs/${jobId}/review`,
  WORKER_REVIEWS: (workerId: number, page = 1, limit = 20, sort = "latest") =>
    `${API_URL}/api/mobile/reviews/worker/${workerId}?page=${page}&limit=${limit}`,
  CLIENT_REVIEWS: (clientId: number, page = 1, limit = 20) =>
    `${API_URL}/api/mobile/reviews/client/${clientId}?page=${page}&limit=${limit}`,
  REVIEW_STATS: (workerId: number) =>
    `${API_URL}/api/mobile/reviews/stats/${workerId}`,
  MY_REVIEWS: `${API_URL}/api/mobile/reviews/my-reviews`,
  EDIT_REVIEW: (reviewId: number) =>
    `${API_URL}/api/mobile/reviews/${reviewId}`,
  REPORT_REVIEW: (reviewId: number) =>
    `${API_URL}/api/mobile/reviews/${reviewId}/report`,
  PENDING_REVIEWS: `${API_URL}/api/mobile/reviews/pending`,

  // Backjobs / Disputes
  REQUEST_BACKJOB: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/request-backjob`,
  MY_BACKJOBS: `${API_URL}/api/mobile/jobs/my-backjobs`,
  BACKJOB_STATUS: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/backjob-status`,
  COMPLETE_BACKJOB: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/complete-backjob`,
  // Backjob 3-Phase Workflow (mirrors regular job workflow)
  BACKJOB_CONFIRM_STARTED: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/backjob/confirm-started`,
  BACKJOB_MARK_COMPLETE: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/backjob/mark-complete`,
  BACKJOB_APPROVE_COMPLETION: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/backjob/approve-completion`,

  // ML/AI Prediction Endpoints
  // Price prediction for job creation - returns min/suggested/max price range
  PREDICT_PRICE: `${API_URL}/api/ml/predict-price`,
  // Job field suggestions mined from completed jobs database
  JOB_SUGGESTIONS: `${API_URL}/api/ml/job-suggestions`,
  // Worker profile score for improvement suggestions (worker's own profile only)
  WORKER_PROFILE_SCORE: (workerId: number) =>
    `${API_URL}/api/ml/worker-rating-for-profile/${workerId}`,

  // Daily Rate Payment System (12 endpoints)
  // Attendance tracking
  DAILY_ATTENDANCE: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/daily/attendance`,
  DAILY_ATTENDANCE_CONFIRM_WORKER: (jobId: number, attendanceId: number) =>
    `${API_URL}/api/jobs/${jobId}/daily/attendance/${attendanceId}/confirm-worker`,
  DAILY_ATTENDANCE_CONFIRM_CLIENT: (jobId: number, attendanceId: number) =>
    `${API_URL}/api/jobs/${jobId}/daily/attendance/${attendanceId}/confirm-client`,
  // Summary and estimates
  DAILY_SUMMARY: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/daily/summary`,
  DAILY_ESCROW_ESTIMATE: `${API_URL}/api/jobs/daily/escrow-estimate`,
  // Extensions
  DAILY_EXTENSIONS: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/daily/extensions`,
  DAILY_EXTENSION_REQUEST: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/daily/extension`,
  DAILY_EXTENSION_APPROVE: (jobId: number, extensionId: number) =>
    `${API_URL}/api/jobs/${jobId}/daily/extension/${extensionId}/approve`,
  // Rate changes
  DAILY_RATE_CHANGES: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/daily/rate-changes`,
  DAILY_RATE_CHANGE_REQUEST: (jobId: number) =>
    `${API_URL}/api/jobs/${jobId}/daily/rate-change`,
  DAILY_RATE_CHANGE_APPROVE: (jobId: number, changeId: number) =>
    `${API_URL}/api/jobs/${jobId}/daily/rate-change/${changeId}/approve`,
  // Cancellation
  DAILY_CANCEL: (jobId: number) => `${API_URL}/api/jobs/${jobId}/daily/cancel`,
};

import AsyncStorage from "@react-native-async-storage/async-storage";

// HTTP Request helper with credentials
// API request helper with built-in timeout using AbortController
export const DEFAULT_REQUEST_TIMEOUT = 120000; // 2 minutes (increased for slow networks)
export const VALIDATION_TIMEOUT = 180000; // 3 minutes for document validation (images can be 1-2MB; ~40-60s upload on slow 3G)
export const OCR_TIMEOUT = 300000; // 5 minutes for OCR extraction operations (Tesseract can take 2-4 min)
export const KYC_UPLOAD_TIMEOUT = 600000; // 10 minutes for final KYC upload (4 compressed images ~1.8MB total; can exceed 5 min on poor 2G/3G connections)
export const KYC_STAGE_FILE_TIMEOUT = 120000; // 2 minutes per individual file staging

export const apiRequest = async (
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<Response> => {
  const startedAt = Date.now();
  const {
    timeout = DEFAULT_REQUEST_TIMEOUT,
    signal: userSignal,
    headers: userHeaders,
    ...rest
  } = options as any;

  const requestBody = (rest as any)?.body;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // If consumer passed a signal, forward aborts
  if (userSignal) {
    if (userSignal.aborted) {
      controller.abort();
    } else {
      const onAbort = () => controller.abort();
      userSignal.addEventListener("abort", onAbort);
      // cleanup listener after request finishes
      const cleanup = () => userSignal.removeEventListener("abort", onAbort);
      // attach cleanup to controller.signal's abort
      controller.signal.addEventListener("abort", cleanup);
    }
  }

  // Try to attach bearer token from AsyncStorage if present
  const token = await AsyncStorage.getItem("access_token");

  const defaultHeaders: Record<string, string> = {
    ...(userHeaders as Record<string, string> | undefined),
  };

  const hasContentTypeHeader = Object.keys(defaultHeaders).some(
    (key) => key.toLowerCase() === "content-type",
  );

  const isFormDataBody =
    typeof FormData !== "undefined" && requestBody instanceof FormData;

  if (isFormDataBody) {
    // Let fetch/React Native set correct multipart boundaries
    Object.keys(defaultHeaders).forEach((key) => {
      if (key.toLowerCase() === "content-type") {
        delete defaultHeaders[key];
      }
    });
  } else if (!hasContentTypeHeader) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (DEBUG_NETWORK) {
    const safeHeaders = { ...defaultHeaders } as Record<string, string>;
    if (safeHeaders.Authorization) {
      safeHeaders.Authorization = "Bearer [REDACTED]";
    }

    console.log(
      `[API][DEBUG] Request: ${(rest as any)?.method || "GET"} ${url} timeout=${timeout}ms`,
      safeHeaders,
    );
  }

  const defaultOptions: RequestInit = {
    credentials: "include", // Attempt to send cookies when available
    headers: defaultHeaders,
    signal: controller.signal,
    ...rest,
  };

  try {
    console.log(`[API] Request: ${(rest as any)?.method || "GET"} ${url}`);
    const resp = await fetch(url, defaultOptions);
    console.log(
      `[API] Response: ${resp.status} ${resp.statusText} from ${url}`,
    );

    if (DEBUG_NETWORK) {
      const elapsedMs = Date.now() - startedAt;
      console.log(
        `[API][DEBUG] Response: ${resp.status} ${resp.statusText} from ${url} (${elapsedMs}ms)`,
      );
    }

    // Intercept KYC_REQUIRED 403 responses and emit global event
    if (resp.status === 403) {
      try {
        const cloned = resp.clone();
        const body = (await cloned.json()) as any;
        if (body?.error_code === "KYC_REQUIRED") {
          console.warn(`[API] KYC_REQUIRED from ${url}`);
          const { DeviceEventEmitter } = require("react-native");
          DeviceEventEmitter.emit("KYC_REQUIRED");
        }
      } catch (_) {
        // Ignore parse errors – not a KYC response
      }
    }

    return resp;
  } catch (err: any) {
    const elapsedMs = Date.now() - startedAt;
    // Enhanced error logging for debugging network issues
    console.error(`[API] ❌ Request failed: ${url}`);
    console.error(`[API] Error name: ${err.name}`);
    console.error(`[API] Error message: ${err.message}`);

    if (DEBUG_NETWORK) {
      console.error(
        `[API][DEBUG] Failure after ${elapsedMs}ms ${(rest as any)?.method || "GET"} ${url}`,
      );
    }

    if (err.name === "AbortError") {
      // Provide clearer error for timeouts
      throw new Error(
        `Network request timed out after ${timeout}ms. Please check your internet connection.`,
      );
    }

    // Check if it's a network error (no internet)
    if (err.message === "Network request failed") {
      // Get detailed network state
      const netState = await checkNetworkConnectivity();
      console.error(`[API] Network state: ${netState.details}`);

      if (!netState.isConnected) {
        throw new Error(
          "No internet connection. Please check your network settings and try again.",
        );
      }

      // Internet connected but request still failed - likely server issue
      throw new Error(
        `Unable to reach server at ${url}. ` +
          `Network: ${netState.type}. ` +
          `Please verify the server is running and try again.`,
      );
    }

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Export the API_URL for debugging purposes
export const getApiUrl = () => API_URL;

// Typed JSON fetch helper. Use this when you expect JSON and want a typed result.
export async function fetchJson<T = any>(
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<T> {
  const resp = await apiRequest(url, options);
  const text = await resp.text();

  // Log response details for debugging
  console.log(`[API] Response from ${url}:`, {
    status: resp.status,
    statusText: resp.statusText,
    headers: Object.fromEntries(resp.headers.entries()),
    bodyPreview: text.substring(0, 200),
  });

  // Try to parse JSON safely; fallback to null on parse error
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    // If parsing fails, include response details in error
    throw new Error(
      `Failed to parse JSON response from ${url} (${resp.status} ${resp.statusText}):\n` +
        `Response body: ${text.substring(0, 500)}\n` +
        `Parse error: ${e}`,
    );
  }

  if (!resp.ok) {
    const err = data as any;
    throw new Error(
      err?.message ||
        err?.error ||
        `Request to ${url} failed with status ${resp.status}`,
    );
  }

  return data as T;
}
