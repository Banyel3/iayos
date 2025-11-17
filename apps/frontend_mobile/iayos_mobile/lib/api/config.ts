// API Configuration for React Native Mobile App
// Backend URL for development (change for production)
// Note: For iOS Simulator, use your machine's local IP (found in Expo output)
// For Android Emulator, use 10.0.2.2
// For physical device, use your machine's network IP
const API_URL = __DEV__ ? "http://192.168.1.117:8000" : "https://api.iayos.com";

export const API_BASE_URL = `${API_URL}/api`;
export const WS_BASE_URL = __DEV__
  ? "ws://192.168.1.117:8001"
  : "wss://ws.iayos.com";

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
  JOB_DETAILS: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/${id}`,
  APPLY_JOB: (id: number) => `${API_BASE_URL}/jobs/${id}/apply`,
  MY_APPLICATIONS: `${API_BASE_URL}/jobs/my-applications`,
  MARK_COMPLETE: (id: number) => `${API_BASE_URL}/jobs/${id}/mark-complete`,
  APPROVE_COMPLETION: (id: number) =>
    `${API_BASE_URL}/jobs/${id}/approve-completion`,
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
    params.append("page", filters.page?.toString() || "1");
    params.append("limit", filters.limit?.toString() || "20");
    return `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/list?${params.toString()}`;
  },
  SAVE_JOB: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/${id}/save`,
  UNSAVE_JOB: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/${id}/save`,
  SAVED_JOBS: `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/saved`,

  // Phase 4: Worker Profile & Application Management
  WORKER_PROFILE: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile`,
  UPDATE_WORKER_PROFILE: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile`,
  APPLICATION_DETAIL: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/applications/${id}`,
  WITHDRAW_APPLICATION: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/applications/${id}/withdraw`,

  // Phase 5: Photo Upload (Avatar & Portfolio)
  UPLOAD_AVATAR: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/avatar`,
  DELETE_AVATAR: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/avatar`,
  UPLOAD_PORTFOLIO_IMAGE: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/portfolio`,
  PORTFOLIO_LIST: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/portfolio`,
  PORTFOLIO_UPDATE: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/portfolio/${id}`,
  PORTFOLIO_REORDER: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/portfolio/reorder`,
  PORTFOLIO_DELETE: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/portfolio/${id}`,

  // Phase 6: Certifications & Materials
  CERTIFICATIONS: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/certifications`,
  CERTIFICATION_DETAIL: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/certifications/${id}`,
  MATERIALS: `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/materials`,
  MATERIAL_DETAIL: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/profile/materials/${id}`,

  // Profile
  PROFILE: (id: number) => `${API_BASE_URL}/profiles/${id}`,
  UPDATE_PROFILE: (id: number) => `${API_BASE_URL}/profiles/${id}`,

  // Worker
  WORKER_AVAILABILITY: `${API_BASE_URL}/accounts/worker/availability`,
  NEARBY_WORKERS: `${API_BASE_URL.replace("/api", "")}/api/mobile/workers/list`,
  WORKER_DETAIL: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/workers/detail/${id}`,

  // Client
  BROWSE_AGENCIES: `${API_BASE_URL}/client/agencies/browse`,
  AGENCY_PROFILE: (id: number) => `${API_BASE_URL}/client/agencies/${id}`,
  AGENCY_DETAIL: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/agencies/detail/${id}`,
  AGENCIES_LIST: `${API_BASE_URL.replace("/api", "")}/api/mobile/agencies/list`,

  // Wallet - Use mobile endpoints with Bearer token auth
  WALLET_BALANCE: `${API_BASE_URL.replace("/api", "")}/api/mobile/wallet/balance`,
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
  WALLET_TRANSACTIONS: `${API_BASE_URL.replace("/api", "")}/api/mobile/wallet/transactions`,
  CREATE_JOB_WITH_PAYMENT: `${API_BASE_URL.replace("/api", "")}/api/jobs/create`,
  CREATE_JOB: `${API_BASE_URL.replace("/api", "")}/api/jobs/create`,
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

  // Phase 7: KYC Document Upload & Verification (3 endpoints)
  KYC_STATUS: `${API_BASE_URL.replace("/api", "")}/api/accounts/kyc-status`,
  UPLOAD_KYC: `${API_BASE_URL.replace("/api", "")}/api/accounts/upload-kyc`,
  KYC_APPLICATION_HISTORY: `${API_BASE_URL.replace("/api", "")}/api/accounts/kyc-application-history`,

  // Phase 8: Reviews & Ratings (6 endpoints)
  SUBMIT_REVIEW: `${API_BASE_URL.replace("/api", "")}/api/accounts/reviews/submit`,
  WORKER_REVIEWS: (workerId: number, page = 1, limit = 20, sort = "latest") =>
    `${API_BASE_URL.replace("/api", "")}/api/accounts/reviews/worker/${workerId}?page=${page}&limit=${limit}&sort=${sort}`,
  REVIEW_STATS: (workerId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/accounts/reviews/stats/${workerId}`,
  MY_REVIEWS: `${API_BASE_URL.replace("/api", "")}/api/accounts/reviews/my-reviews`,
  EDIT_REVIEW: (reviewId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/accounts/reviews/${reviewId}`,
  REPORT_REVIEW: (reviewId: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/accounts/reviews/${reviewId}/report`,
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
    ...rest
  } = options as any;

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
    "Content-Type": "application/json",
    ...(rest.headers as Record<string, string> | undefined),
  };

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
  // Try to parse JSON safely; fallback to null on parse error
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    // If parsing fails, rethrow with context
    throw new Error(`Failed to parse JSON response from ${url}: ${e}`);
  }

  if (!resp.ok) {
    const err = data as any;
    throw new Error(err?.message || err?.error || `Request to ${url} failed`);
  }

  return data as T;
}
