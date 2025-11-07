import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final _storage = const FlutterSecureStorage();
  final String _accessTokenKey = 'access_token';
  final String _refreshTokenKey = 'refresh_token';

  // Register individual account
  Future<Map<String, dynamic>> register({
    required String firstName,
    required String middleName,
    required String lastName,
    required String contactNum,
    required String birthDate,
    required String email,
    required String password,
    required String streetAddress,
    required String city,
    required String province,
    required String postalCode,
    String country = 'Philippines',
  }) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.getUrl(ApiConfig.register)),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'firstName': firstName,
          'middleName': middleName,
          'lastName': lastName,
          'contactNum': contactNum,
          'birthDate': birthDate,
          'email': email,
          'password': password,
          'street_address': streetAddress,
          'city': city,
          'province': province,
          'postal_code': postalCode,
          'country': country,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        // Store tokens if they're returned
        if (data['access'] != null) {
          await _storage.write(key: _accessTokenKey, value: data['access']);
        }
        if (data['refresh'] != null) {
          await _storage.write(key: _refreshTokenKey, value: data['refresh']);
        }
        return {'success': true, 'data': data};
      } else {
        // Handle error response
        String errorMessage = 'Registration failed';
        if (data['error'] != null && data['error'] is List && data['error'].isNotEmpty) {
          errorMessage = data['error'][0]['message'] ?? errorMessage;
        }
        return {'success': false, 'error': errorMessage};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  // Login
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.getUrl(ApiConfig.login)),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['access'] != null) {
        // Store tokens
        await _storage.write(key: _accessTokenKey, value: data['access']);
        if (data['refresh'] != null) {
          await _storage.write(key: _refreshTokenKey, value: data['refresh']);
        }
        return {'success': true, 'data': data};
      } else {
        // Handle error response
        String errorMessage = 'Login failed';
        if (data['error'] != null && data['error'] is List && data['error'].isNotEmpty) {
          errorMessage = data['error'][0]['message'] ?? errorMessage;
        } else if (data['message'] != null) {
          errorMessage = data['message'];
        }
        return {'success': false, 'error': errorMessage};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      final accessToken = await _storage.read(key: _accessTokenKey);
      if (accessToken != null) {
        await http.post(
          Uri.parse(ApiConfig.getUrl(ApiConfig.logout)),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $accessToken',
          },
        );
      }
    } catch (e) {
      print('Logout error: $e');
    } finally {
      // Clear local storage
      await _storage.delete(key: _accessTokenKey);
      await _storage.delete(key: _refreshTokenKey);
    }
  }

  // Forgot Password
  Future<Map<String, dynamic>> forgotPassword({required String email}) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.getUrl(ApiConfig.forgotPassword)),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        String errorMessage = 'Failed to send reset email';
        if (data['error'] != null && data['error'] is List && data['error'].isNotEmpty) {
          errorMessage = data['error'][0]['message'] ?? errorMessage;
        }
        return {'success': false, 'error': errorMessage};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  // Get stored access token
  Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  // Get stored refresh token
  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null;
  }

  // Refresh access token
  Future<bool> refreshAccessToken() async {
    try {
      final refreshToken = await getRefreshToken();
      if (refreshToken == null) return false;

      final response = await http.post(
        Uri.parse(ApiConfig.getUrl(ApiConfig.refreshToken)),
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'refresh=$refreshToken',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['access'] != null) {
          await _storage.write(key: _accessTokenKey, value: data['access']);
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // Get current user profile
  Future<Map<String, dynamic>> getCurrentUser() async {
    try {
      final accessToken = await getAccessToken();
      if (accessToken == null) {
        return {'success': false, 'error': 'Not authenticated'};
      }

      final response = await http.get(
        Uri.parse(ApiConfig.getUrl(ApiConfig.userProfile)),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data};
      } else if (response.statusCode == 401) {
        // Try to refresh token
        final refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry the request
          return await getCurrentUser();
        }
        return {'success': false, 'error': 'Session expired'};
      } else {
        return {'success': false, 'error': 'Failed to fetch user'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  // Assign role (Client or Worker)
  Future<Map<String, dynamic>> assignRole({
    required String profileType,
  }) async {
    try {
      final accessToken = await getAccessToken();
      if (accessToken == null) {
        return {'success': false, 'error': 'Not authenticated'};
      }

      final response = await http.post(
        Uri.parse(ApiConfig.getUrl(ApiConfig.assignRole)),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode({
          'profile_type': profileType,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else if (response.statusCode == 401) {
        // Try to refresh token
        final refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry the request
          return await assignRole(profileType: profileType);
        }
        return {'success': false, 'error': 'Session expired'};
      } else {
        String errorMessage = 'Failed to assign role';
        if (data['error'] != null) {
          errorMessage = data['error'].toString();
        }
        return {'success': false, 'error': errorMessage};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }
}
