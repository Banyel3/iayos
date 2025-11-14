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
  // Authentication
  LOGIN: `${API_BASE_URL.replace("/api", "")}/api/accounts/login`,
  LOGOUT: `${API_BASE_URL.replace("/api", "")}/api/accounts/logout`,
  REGISTER: `${API_BASE_URL.replace("/api", "")}/api/accounts/register`,
  ME: `${API_BASE_URL.replace("/api", "")}/api/accounts/me`,
  ASSIGN_ROLE: `${API_BASE_URL.replace("/api", "")}/api/accounts/assign-role`,

  // Jobs
  AVAILABLE_JOBS: `${API_BASE_URL}/jobs/available`,
  JOB_DETAILS: (id: number) => `${API_BASE_URL}/jobs/${id}`,
  APPLY_JOB: (id: number) => `${API_BASE_URL}/jobs/${id}/apply`,
  MY_APPLICATIONS: `${API_BASE_URL}/jobs/my-applications`,
  MARK_COMPLETE: (id: number) => `${API_BASE_URL}/jobs/${id}/mark-complete`,
  APPROVE_COMPLETION: (id: number) =>
    `${API_BASE_URL}/jobs/${id}/approve-completion`,
  ACTIVE_JOBS: `${API_BASE_URL}/jobs/my-active-jobs`,
  UPLOAD_JOB_PHOTOS: (id: number) => `${API_BASE_URL}/jobs/${id}/upload-photos`,

  // Phase 3: Job Browsing & Filtering
  JOB_CATEGORIES: `${API_BASE_URL.replace("/api", "")}/api/mobile/jobs/categories`,
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
  NEARBY_WORKERS: `${API_BASE_URL}/accounts/nearby-workers`,

  // Client
  BROWSE_AGENCIES: `${API_BASE_URL}/client/agencies/browse`,
  AGENCY_PROFILE: (id: number) => `${API_BASE_URL}/client/agencies/${id}`,

  // Wallet
  WALLET_BALANCE: `${API_BASE_URL}/accounts/wallet/balance`,
  TRANSACTIONS: `${API_BASE_URL}/accounts/wallet/transactions`,
  DEPOSIT: `${API_BASE_URL}/accounts/wallet/deposit`,

  // Phase 3: Escrow Payment System (10 endpoints)
  CREATE_ESCROW_PAYMENT: `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/escrow`,
  CREATE_XENDIT_INVOICE: `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/xendit/invoice`,
  UPLOAD_CASH_PROOF: `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/cash-proof`,
  PAYMENT_STATUS: (id: number) =>
    `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/status/${id}`,
  PAYMENT_HISTORY: `${API_BASE_URL.replace("/api", "")}/api/mobile/payments/history`,
  WALLET_DEPOSIT: `${API_BASE_URL}/accounts/wallet/deposit`,
  WALLET_TRANSACTIONS: `${API_BASE_URL}/accounts/wallet/transactions`,
  CREATE_JOB_WITH_PAYMENT: `${API_BASE_URL}/jobs/create`,
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

  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/accounts/notifications`,
  MARK_READ: (id: number) =>
    `${API_BASE_URL}/accounts/notifications/${id}/read`,
  UNREAD_COUNT: `${API_BASE_URL}/accounts/unread-count`,
};

// HTTP Request helper with credentials
export const apiRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const defaultOptions: RequestInit = {
    credentials: "include", // Important: Send cookies with requests
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  return fetch(url, defaultOptions);
};
