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
