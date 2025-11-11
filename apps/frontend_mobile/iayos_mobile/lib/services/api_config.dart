class ApiConfig {
  // Change this to your backend URL
  // For local development on Android emulator: http://10.0.2.2:8000
  // For local development on iOS simulator: http://localhost:8000
  // For physical device: http://YOUR_COMPUTER_IP:8000
  static const String baseUrl = 'http://10.0.2.2:8000';

  // Mobile API Base
  static const String mobileBaseUrl = '$baseUrl/api/mobile';

  // ========================================
  // MOBILE AUTH ENDPOINTS
  // ========================================
  static const String register = '$mobileBaseUrl/auth/register';
  static const String login = '$mobileBaseUrl/auth/login';
  static const String logout = '$mobileBaseUrl/auth/logout';
  static const String refreshToken = '$mobileBaseUrl/auth/refresh';
  static const String userProfile = '$mobileBaseUrl/auth/profile';
  static const String assignRole = '$mobileBaseUrl/auth/assign-role';
  static const String verifyEmail = '$mobileBaseUrl/auth/verify';
  static const String forgotPassword = '$mobileBaseUrl/auth/forgot-password';
  static const String resetPassword = '$mobileBaseUrl/auth/reset-password';

  // ========================================
  // MOBILE JOB ENDPOINTS
  // ========================================
  static const String jobList = '$mobileBaseUrl/jobs/list';
  static String jobDetail(int jobId) => '$mobileBaseUrl/jobs/$jobId';
  static const String createJob = '$mobileBaseUrl/jobs/create';
  static const String searchJobs = '$mobileBaseUrl/jobs/search';
  static const String jobCategories = '$mobileBaseUrl/jobs/categories';

  // ========================================
  // MOBILE APPLICATION ENDPOINTS (Week 3)
  // ========================================
  static String applyToJob(int jobId) => '$mobileBaseUrl/jobs/$jobId/apply';
  static const String myApplications = '$mobileBaseUrl/applications/my-applications';
  static String jobApplications(int jobId) => '$mobileBaseUrl/jobs/$jobId/applications';
  static String updateApplicationStatus(int appId) => '$mobileBaseUrl/applications/$appId/status';
  static const String myJobs = '$mobileBaseUrl/jobs/my-jobs';

  // ========================================
  // MOBILE PAYMENT ENDPOINTS (Week 4)
  // ========================================
  static String markJobComplete(int jobId) => '$mobileBaseUrl/jobs/$jobId/mark-complete';
  static String approveCompletion(int jobId) => '$mobileBaseUrl/jobs/$jobId/approve-completion';
  static String uploadJobPhotos(int jobId) => '$mobileBaseUrl/jobs/$jobId/upload-photos';
  static String uploadPaymentProof(int jobId) => '$mobileBaseUrl/jobs/$jobId/upload-payment-proof';

  // ========================================
  // MOBILE WALLET ENDPOINTS (Week 4)
  // ========================================
  static const String walletBalance = '$mobileBaseUrl/wallet/balance';
  static const String addFunds = '$mobileBaseUrl/wallet/add-funds';
  static const String walletTransactions = '$mobileBaseUrl/wallet/transactions';

  // ========================================
  // MOBILE REVIEW ENDPOINTS (Week 5)
  // ========================================
  static String submitReview(int jobId) => '$mobileBaseUrl/jobs/$jobId/submit-review';
  static String getUserReviews(int userId) => '$mobileBaseUrl/users/$userId/reviews';

  // ========================================
  // MOBILE KYC ENDPOINTS (Week 5)
  // ========================================
  static const String uploadKYC = '$mobileBaseUrl/kyc/upload';
  static const String kycStatus = '$mobileBaseUrl/kyc/status';

  // ========================================
  // MOBILE CHAT ENDPOINTS (Week 6)
  // ========================================
  static const String conversations = '$mobileBaseUrl/chat/conversations';
  static String chatMessages(int conversationId) => '$mobileBaseUrl/chat/$conversationId/messages';
  static String sendMessage(int conversationId) => '$mobileBaseUrl/chat/$conversationId/send';

  // ========================================
  // MOBILE DASHBOARD ENDPOINTS
  // ========================================
  static const String dashboardStats = '$mobileBaseUrl/dashboard/stats';
  static const String dashboardRecentJobs = '$mobileBaseUrl/dashboard/recent-jobs';
  static const String dashboardAvailableWorkers = '$mobileBaseUrl/dashboard/available-workers';

  // ========================================
  // MOBILE PROFILE ENDPOINTS
  // ========================================
  static const String getProfile = '$mobileBaseUrl/profile/me';
  static const String updateProfile = '$mobileBaseUrl/profile/update';
  static const String uploadProfileImage = '$mobileBaseUrl/profile/upload-image';

  // ========================================
  // MOBILE WORKER & JOB LISTING ENDPOINTS
  // ========================================
  static const String workersList = '$mobileBaseUrl/workers/list';
  static String workerDetail(int workerId) => '$mobileBaseUrl/workers/$workerId';
  static const String myJobsList = '$mobileBaseUrl/jobs/my-jobs';
  static const String availableJobs = '$mobileBaseUrl/jobs/available';

  // Helper method to get full URL
  static String getUrl(String endpoint) {
    return endpoint; // Endpoint is already full URL
  }
}
