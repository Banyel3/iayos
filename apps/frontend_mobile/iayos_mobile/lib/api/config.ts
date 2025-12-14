// API Configuration for React Native Mobile App
// Backend URL for development (change for production)
// Note: For iOS Simulator, use your machine's local IP (found in Expo output)
// For Android Emulator, use 10.0.2.2
// For physical device, use your machine's network IP

// AUTOMATIC IP DETECTION: Environment variable takes precedence, then falls back to Expo auto-detect
// Run `.\scripts\update-mobile-ip.ps1` to auto-detect and update IP
const getDevIP = () => {
  // Priority 1: Environment variable (set by update-ip script)
  if (process.env.EXPO_PUBLIC_DEV_IP) {
    return process.env.EXPO_PUBLIC_DEV_IP;
  }

  // Priority 2: Try to use Expo's detected IP from Constants
  // This works when running via Expo Go and detects your machine's IP automatically
  try {
    const Constants = require("expo-constants").default;
    const expoIP = Constants.expoConfig?.hostUri?.split(":")[0];
    if (expoIP && expoIP !== "localhost" && expoIP !== "127.0.0.1") {
      return expoIP;
    }
  } catch (e) {
    // Expo Constants not available
  }

  // Priority 3: Fallback to localhost (will fail on physical devices)
  return "localhost";
};

const DEV_IP = getDevIP();
const API_URL = __DEV__ ? `http://${DEV_IP}:8000` : "https://api.iayos.com";

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

export const API_BASE_URL = `${API_URL}/api`;
export const WS_BASE_URL = __DEV__
  ? `ws://${DEV_IP}:8001`
  : "wss://ws.iayos.com";

/**
 * Convert relative media URLs to absolute URLs for React Native Image component.
 * Local storage returns relative paths like /media/... which need the host prepended.
 * Supabase returns full URLs (https://...) which are passed through unchanged.
 */
export const getAbsoluteMediaUrl = (
  url: string | null | undefined
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
  LOGIN: `${API_BASE_URL.replace("/api", "")}/api/mobile/auth/login`,
  LOGOUT: `${API_BASE_URL.replace("/api", "")}/api/mobile/auth/logout`,
  REGISTER: `${API_BASE_URL.replace("/api", "")}/api/mobile/auth/register`,
  ME: `${API_BASE_URL.replace("/api", "")}/api/mobile/auth/profile`,
  ASSIGN_ROLE: `${API_BASE_URL.replace("/api", "")}/api/mobile/auth/assign-role`,

  // Jobs - Use mobile endpoints with Bearer token auth
  AVAILABLE_JOBS: `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/available`,
  MY_JOBS: `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/my-jobs`,
  JOB_DETAILS: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/${id}`,
  DELETE_JOB: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/${id}`,
  JOB_APPLICATIONS: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/${id}/applications`,
  ACCEPT_APPLICATION: (jobId: number, applicationId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/${jobId}/applications/${applicationId}/accept`,
  REJECT_APPLICATION: (jobId: number, applicationId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/${jobId}/applications/${applicationId}/reject`,
  ACCEPT_INVITE: (jobId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/jobs/${jobId}/accept-invite`,
  REJECT_INVITE: (jobId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/jobs/${jobId}/reject-invite`,
  APPLY_JOB: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/${id}/apply`,
  MY_APPLICATIONS: `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/applications/my`,
  MARK_COMPLETE: (id: number) => `${API_BASE_URL}/jobs/${id}/mark-complete`,
  APPROVE_COMPLETION: (id: number) =>
    `${API_BASE_URL}/jobs/${id}/approve-completion`,
  CONFIRM_WORK_STARTED: (id: number) =>
    `${API_BASE_URL}/jobs/${id}/confirm-work-started`,
  ACTIVE_JOBS: `${API_BASE_URL}/jobs/my-active-jobs`,
  UPLOAD_JOB_PHOTOS: (id: number) => `${API_BASE_URL}/jobs/${id}/upload-photos`,

  // Phase 3: Job Browsing & Filtering
  JOB_CATEGORIES: `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/categories`,
  GET_CATEGORIES: `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/categories`,
  JOB_SEARCH: (query: string, page = 1, limit = 20) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
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
    return `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/list?${params.toString()}`;
  },
  SAVE_JOB: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/${id}/save`,
  UNSAVE_JOB: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/${id}/save`,
  SAVED_JOBS: `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/saved`,

  // Team Jobs (Multi-Skill Multi-Worker)
  CREATE_TEAM_JOB: `${API_BASE_URL}/jobs/team/create`,
  TEAM_JOB_DETAIL: (id: number) => `${API_BASE_URL}/jobs/${id}/team`,
  TEAM_APPLY_SKILL_SLOT: (jobId: number) =>
    `${API_BASE_URL}/jobs/${jobId}/team/apply`,
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

  // Phase 4: Worker Profile & Application Management
  WORKER_PROFILE: `${API_BASE_URL.replace("/api", "")}/api/mobile/auth/profile`,
  UPDATE_WORKER_PROFILE: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile`,
  UPDATE_PROFILE: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/update`, // Client profile update
  APPLICATION_DETAIL: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/applications/${id}`,
  WITHDRAW_APPLICATION: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/applications/${id}/withdraw`,

  // Phase 5: Photo Upload (Avatar & Portfolio)
  UPLOAD_AVATAR: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/upload-image`,
  DELETE_AVATAR: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/avatar`,
  UPLOAD_PORTFOLIO_IMAGE: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/portfolio`,
  PORTFOLIO_LIST: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/portfolio`,
  PORTFOLIO_UPDATE: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/portfolio/${id}`,
  PORTFOLIO_REORDER: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/portfolio/reorder`,
  PORTFOLIO_DELETE: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/portfolio/${id}`,
  PROFILE_METRICS: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/metrics`,

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
  // Worker skills (specializations the worker has)
  AVAILABLE_SKILLS: `${API_BASE_URL.replace("/api", "")}/api/mobile/skills/available`,
  MY_SKILLS: `${API_BASE_URL.replace("/api", "")}/api/mobile/skills/my-skills`,
  ADD_SKILL: `${API_BASE_URL.replace("/api", "")}/api/mobile/skills/add`,
  UPDATE_SKILL: (skillId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/skills/${skillId}`,
  REMOVE_SKILL: (skillId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/skills/${skillId}`,

  // Profile
  PROFILE: (id: number) => `${API_BASE_URL}/profiles/${id}`,
  UPDATE_PROFILE: (id: number) => `${API_BASE_URL}/profiles/${id}`,

  // Worker
  WORKER_AVAILABILITY: `${API_BASE_URL}/accounts/worker/availability`,
  NEARBY_WORKERS: `${API_BASE_URL.replace("/api", "")}/api/mobile/workers/list`,
  WORKER_DETAIL: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/workers/detail/${id}`,

  // Client
  CLIENT_DETAIL: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/clients/${id}`,

  // Locations
  GET_CITIES: `${API_BASE_URL.replace("/api", "")}/api/mobile/locations/cities`,
  GET_BARANGAYS: (cityId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/locations/cities/${cityId}/barangays`,

  // Location Tracking
  UPDATE_LOCATION: `${API_BASE_URL.replace("/api", "")}/api/accounts/location/update`,
  GET_MY_LOCATION: `${API_BASE_URL.replace("/api", "")}/api/accounts/location/me`,
  TOGGLE_LOCATION_SHARING: `${API_BASE_URL.replace("/api", "")}/api/accounts/location/toggle-sharing`,

  // Client
  BROWSE_AGENCIES: `${API_BASE_URL}/client/agencies/browse`,
  AGENCY_PROFILE: (id: number) => `${API_BASE_URL}/client/agencies/${id}`,
  AGENCY_DETAIL: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/agencies/detail/${id}`,
  AGENCIES_LIST: `${API_BASE_URL.replace("/api", "")}/api/mobile/agencies/list`,

  // Wallet - Use mobile endpoints with Bearer token auth
  WALLET_BALANCE: `${API_BASE_URL.replace("/api", "")}/api/mobile/wallet/balance`,
  WALLET_PENDING_EARNINGS: `${API_BASE_URL.replace("/api", "")}/api/mobile/wallet/pending-earnings`,
  TRANSACTIONS: `${API_BASE_URL.replace("/api", "")}/api/mobile/wallet/transactions`,
  DEPOSIT: `${API_BASE_URL.replace("/api", "")}/api/mobile/wallet/deposit`,

  // Phase 3: Escrow Payment System (10 endpoints)
  CREATE_ESCROW_PAYMENT: `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/escrow`,
  CREATE_XENDIT_INVOICE: `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/xendit/invoice`,
  UPLOAD_CASH_PROOF: `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/cash-proof`,
  PAYMENT_STATUS: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/status/${id}`,
  PAYMENT_HISTORY: `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/history`,
  WALLET_DEPOSIT: `${API_BASE_URL.replace("/api", "")}/api/mobile/wallet/deposit`,
  WALLET_WITHDRAW: `${API_BASE_URL.replace("/api", "")}/api/mobile/wallet/withdraw`,
  WALLET_TRANSACTIONS: `${API_BASE_URL.replace("/api", "")}/api/mobile/wallet/transactions`,
  CREATE_JOB_WITH_PAYMENT: `${API_BASE_URL.replace("/api", "")}/api/jobs/create-mobile`, // Direct worker/agency hiring
  CREATE_JOB: `${API_BASE_URL.replace("/api", "")}/api/jobs/create-mobile`, // Direct worker/agency hiring
  XENDIT_WEBHOOK: `${API_BASE_URL.replace("/api", "")}/api/payments/xendit/callback`,
  PAYMENT_RECEIPT: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/receipt/${id}`,

  // Phase 4: Final Payment System (8 endpoints)
  CREATE_FINAL_PAYMENT: `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/final`,
  JOB_PAYMENT_STATUS: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/jobs/${id}/payment-status`,
  JOB_EARNINGS: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/jobs/${id}/earnings`,
  PAYMENT_TIMELINE: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/jobs/${id}/payment-timeline`,
  EARNINGS_SUMMARY: `${API_BASE_URL.replace("/api", "")}/api/accounts/earnings/summary`,
  EARNINGS_HISTORY: `${API_BASE_URL.replace("/api", "")}/api/accounts/earnings/history`,
  CASH_PAYMENT_STATUS: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/cash-status/${id}`,
  CREATE_PAYMENT_NOTIFICATION: `${API_BASE_URL.replace("/api", "")}/api/notifications/payment`,

  // Phase 5: Real-Time Chat & Messaging (4 endpoints)
  CONVERSATIONS: `${API_BASE_URL.replace("/api", "")}/api/profiles/chat/conversations`,
  CONVERSATION_BY_JOB: (jobId: number, reopen: boolean = false) =>
    `${API_BASE_URL.replace("/api", "")}/api/profiles/chat/conversation-by-job/${jobId}${reopen ? "?reopen=true" : ""}`,
  CONVERSATION_MESSAGES: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/profiles/chat/conversations/${id}`,
  SEND_MESSAGE: `${API_BASE_URL.replace("/api", "")}/api/profiles/chat/messages`,
  UPLOAD_MESSAGE_IMAGE: (conversationId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/profiles/chat/${conversationId}/upload-image`,

  // Phase 9: Push Notifications & Notification Management (8 endpoints)
  NOTIFICATIONS: `${API_BASE_URL.replace("/api", "")}/api/accounts/notifications`,
  MARK_NOTIFICATION_READ: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/accounts/notifications/${id}/mark-read`,
  MARK_ALL_NOTIFICATIONS_READ: `${API_BASE_URL.replace("/api", "")}/api/accounts/notifications/mark-all-read`,
  UNREAD_NOTIFICATIONS_COUNT: `${API_BASE_URL.replace("/api", "")}/api/accounts/notifications/unread-count`,
  REGISTER_PUSH_TOKEN: `${API_BASE_URL.replace("/api", "")}/api/accounts/register-push-token`,
  UPDATE_NOTIFICATION_SETTINGS: `${API_BASE_URL.replace("/api", "")}/api/accounts/notification-settings`,
  GET_NOTIFICATION_SETTINGS: `${API_BASE_URL.replace("/api", "")}/api/accounts/notification-settings`,
  DELETE_NOTIFICATION: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/accounts/notifications/${id}/delete`,

  // Phase 7: KYC Document Upload & Verification (4 endpoints)
  KYC_STATUS: `${API_BASE_URL.replace("/api", "")}/api/accounts/kyc-status`,
  UPLOAD_KYC: `${API_BASE_URL.replace("/api", "")}/api/accounts/upload-kyc`,
  KYC_UPLOAD: `${API_BASE_URL.replace("/api", "")}/api/accounts/upload/kyc`, // Matches Next.js endpoint
  KYC_VALIDATE_DOCUMENT: `${API_BASE_URL.replace("/api", "")}/api/accounts/kyc/validate-document`, // Per-step validation
  KYC_APPLICATION_HISTORY: `${API_BASE_URL.replace("/api", "")}/api/accounts/kyc-application-history`,

  // Dual Profile Management (4 endpoints)
  DUAL_PROFILE_STATUS: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/dual-status`,
  CREATE_CLIENT_PROFILE: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/create-client`,
  CREATE_WORKER_PROFILE: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/create-worker`,
  SWITCH_PROFILE: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/switch-profile`,

  // Payment Methods
  PAYMENT_METHODS: `${API_BASE_URL.replace("/api", "")}/api/mobile/payment-methods`,
  ADD_PAYMENT_METHOD: `${API_BASE_URL.replace("/api", "")}/api/mobile/payment-methods`,
  DELETE_PAYMENT_METHOD: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/payment-methods/${id}`,
  SET_PRIMARY_PAYMENT_METHOD: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/payment-methods/${id}/set-primary`,

  // Phase 8: Reviews & Ratings (6 endpoints)
  // Use jobs API for review submission (supports agency employee reviews)
  SUBMIT_REVIEW: (jobId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/jobs/${jobId}/review`,
  WORKER_REVIEWS: (workerId: number, page = 1, limit = 20, sort = "latest") =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/reviews/worker/${workerId}?page=${page}&limit=${limit}`,
  CLIENT_REVIEWS: (clientId: number, page = 1, limit = 20) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/reviews/client/${clientId}?page=${page}&limit=${limit}`,
  REVIEW_STATS: (workerId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/reviews/stats/${workerId}`,
  MY_REVIEWS: `${API_BASE_URL.replace("/api", "")}/api/mobile/reviews/my-reviews`,
  EDIT_REVIEW: (reviewId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/reviews/${reviewId}`,
  REPORT_REVIEW: (reviewId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/reviews/${reviewId}/report`,

  // Backjobs / Disputes
  REQUEST_BACKJOB: (jobId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/jobs/${jobId}/request-backjob`,
  MY_BACKJOBS: `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/my-backjobs`,
  BACKJOB_STATUS: (jobId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/jobs/${jobId}/backjob-status`,
  COMPLETE_BACKJOB: (jobId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/jobs/${jobId}/complete-backjob`,
  // Backjob 3-Phase Workflow (mirrors regular job workflow)
  BACKJOB_CONFIRM_STARTED: (jobId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/jobs/${jobId}/backjob/confirm-started`,
  BACKJOB_MARK_COMPLETE: (jobId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/jobs/${jobId}/backjob/mark-complete`,
  BACKJOB_APPROVE_COMPLETION: (jobId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/jobs/${jobId}/backjob/approve-completion`,

  // ML/AI Prediction Endpoints
  // Price prediction for job creation - returns min/suggested/max price range
  PREDICT_PRICE: `${API_BASE_URL.replace("/api", "")}/api/ml/predict-price`,
  // Worker profile score for improvement suggestions (worker's own profile only)
  WORKER_PROFILE_SCORE: (workerId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/ml/worker-rating-for-profile/${workerId}`,
};

import AsyncStorage from "@react-native-async-storage/async-storage";

// HTTP Request helper with credentials
// API request helper with built-in timeout using AbortController
export const DEFAULT_REQUEST_TIMEOUT = 15000; // 15 seconds

export const apiRequest = async (
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> => {
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
    (key) => key.toLowerCase() === "content-type"
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

  const defaultOptions: RequestInit = {
    credentials: "include", // Attempt to send cookies when available
    headers: defaultHeaders,
    signal: controller.signal,
    ...rest,
  };

  try {
    const resp = await fetch(url, defaultOptions);
    return resp;
  } catch (err: any) {
    if (err.name === "AbortError") {
      // Provide clearer error for timeouts
      throw new Error(`Network request timed out after ${timeout}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Typed JSON fetch helper. Use this when you expect JSON and want a typed result.
export async function fetchJson<T = any>(
  url: string,
  options: RequestInit & { timeout?: number } = {}
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
        `Parse error: ${e}`
    );
  }

  if (!resp.ok) {
    const err = data as any;
    throw new Error(
      err?.message ||
        err?.error ||
        `Request to ${url} failed with status ${resp.status}`
    );
  }

  return data as T;
}
