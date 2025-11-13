import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

class MyJobsService {
  static final MyJobsService _instance = MyJobsService._internal();
  factory MyJobsService() => _instance;
  MyJobsService._internal();

  final _storage = const FlutterSecureStorage();

  /// Get user's jobs (different for CLIENT vs WORKER)
  /// - CLIENT: Jobs they posted
  /// - WORKER: Jobs they applied to or are assigned to
  Future<Map<String, dynamic>> getMyJobs({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final token = await _storage.read(key: 'access_token');
      if (token == null) {
        return {
          'success': false,
          'error': 'No authentication token found',
        };
      }

      // Build query parameters
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }

      final uri = Uri.parse(ApiConfig.myJobsList).replace(
        queryParameters: queryParams,
      );

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'error': error['error'] ?? 'Failed to fetch jobs',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Get available jobs for workers to apply to
  Future<Map<String, dynamic>> getAvailableJobs({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final token = await _storage.read(key: 'access_token');
      if (token == null) {
        return {
          'success': false,
          'error': 'No authentication token found',
        };
      }

      // Build query parameters
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };

      final uri = Uri.parse(ApiConfig.availableJobs).replace(
        queryParameters: queryParams,
      );

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data,
        };
      } else {
        final error = json.decode(response.body);
        return {
          'success': false,
          'error': error['error'] ?? 'Failed to fetch available jobs',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }
}
