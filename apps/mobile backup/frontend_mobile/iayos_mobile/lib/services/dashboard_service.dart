import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

class DashboardService {
  static final DashboardService _instance = DashboardService._internal();
  factory DashboardService() => _instance;
  DashboardService._internal();

  final _storage = const FlutterSecureStorage();

  // Get authorization headers
  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Get dashboard statistics
  /// Returns different data for CLIENT vs WORKER
  Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.dashboardStats),
        headers: await _getHeaders(),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to fetch dashboard stats'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  /// Get recent jobs for dashboard
  /// - Workers: Recent available jobs to apply to
  /// - Clients: Their recent posted jobs
  Future<Map<String, dynamic>> getRecentJobs({int limit = 5}) async {
    try {
      final uri = Uri.parse(ApiConfig.dashboardRecentJobs).replace(
        queryParameters: {
          'limit': limit.toString(),
        },
      );

      final response = await http.get(uri, headers: await _getHeaders());
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to fetch recent jobs'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  /// Get available workers (for clients only)
  Future<Map<String, dynamic>> getAvailableWorkers({int limit = 10}) async {
    try {
      final uri = Uri.parse(ApiConfig.dashboardAvailableWorkers).replace(
        queryParameters: {
          'limit': limit.toString(),
        },
      );

      final response = await http.get(uri, headers: await _getHeaders());
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to fetch workers'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }
}
