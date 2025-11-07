class ApiConfig {
  // Change this to your backend URL
  // For local development on Android emulator: http://10.0.2.2:8000
  // For local development on iOS simulator: http://localhost:8000
  // For physical device: http://YOUR_COMPUTER_IP:8000
  static const String baseUrl =
      'http://10.0.2.2:8000'; // Android emulator uses 10.0.2.2 to reach host

  // API Endpoints
  static const String register = '/api/accounts/register';
  static const String registerAgency = '/api/accounts/register/agency';
  static const String login = '/api/accounts/login';
  static const String logout = '/api/accounts/logout';
  static const String refreshToken = '/api/accounts/refresh';
  static const String userProfile = '/api/accounts/auth/user-profile';
  static const String assignRole = '/api/accounts/assign-role';
  static const String verifyEmail = '/api/accounts/verify';
  static const String forgotPassword = '/api/accounts/forgot-password';
  static const String resetPassword = '/api/accounts/reset-password';

  // Helper method to get full URL
  static String getUrl(String endpoint) {
    return '$baseUrl$endpoint';
  }
}
