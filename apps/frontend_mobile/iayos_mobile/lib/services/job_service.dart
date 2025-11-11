import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

class JobService {
  static final JobService _instance = JobService._internal();
  factory JobService() => _instance;
  JobService._internal();

  final _storage = const FlutterSecureStorage();

  // Get authorization headers
  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // ===========================
  // WEEK 2: JOB BROWSING & POSTING
  // ===========================

  /// Fetch job listings with optional filters
  Future<Map<String, dynamic>> getJobs({
    int? categoryId,
    double? minBudget,
    double? maxBudget,
    String? location,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (categoryId != null) queryParams['category'] = categoryId.toString();
      if (minBudget != null) queryParams['min_budget'] = minBudget.toString();
      if (maxBudget != null) queryParams['max_budget'] = maxBudget.toString();
      if (location != null) queryParams['location'] = location;

      final uri = Uri.parse(ApiConfig.jobList).replace(
        queryParameters: queryParams,
      );

      final response = await http.get(uri, headers: await _getHeaders());
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to fetch jobs'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  /// Get detailed job information
  Future<Map<String, dynamic>> getJobDetails(int jobId) async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.jobDetail(jobId)),
        headers: await _getHeaders(),
      );
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else if (response.statusCode == 404) {
        return {'success': false, 'error': 'Job not found'};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to fetch job details'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  /// Create a new job posting
  Future<Map<String, dynamic>> createJob({
    required String title,
    required String description,
    required int? categoryId,
    required double budget,
    required String location,
    required String expectedDuration,
    required String urgencyLevel,
    required String downpaymentMethod,
    String? preferredStartDate,
    List<String>? materialsNeeded,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.createJob),
        headers: await _getHeaders(),
        body: jsonEncode({
          'title': title,
          'description': description,
          'category_id': categoryId,
          'budget': budget,
          'location': location,
          'expected_duration': expectedDuration,
          'urgency_level': urgencyLevel,
          'downpayment_method': downpaymentMethod,
          'preferred_start_date': preferredStartDate,
          'materials_needed': materialsNeeded,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Job creation failed'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  /// Search jobs by query string
  Future<Map<String, dynamic>> searchJobs({
    required String query,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      if (query.length < 2) {
        return {
          'success': false,
          'error': 'Search query must be at least 2 characters'
        };
      }

      final uri = Uri.parse(ApiConfig.searchJobs).replace(
        queryParameters: {
          'query': query,
          'page': page.toString(),
          'limit': limit.toString(),
        },
      );

      final response = await http.get(uri, headers: await _getHeaders());
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': data['error'] ?? 'Search failed'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  /// Get all job categories
  Future<Map<String, dynamic>> getCategories() async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.jobCategories),
        headers: await _getHeaders(),
      );
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to fetch categories'
        };
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  // ===========================
  // WEEK 3: JOB APPLICATIONS (Placeholder)
  // ===========================

  /// Apply to a job (Week 3)
  Future<Map<String, dynamic>> applyToJob({
    required int jobId,
    required String proposalMessage,
    required String budgetOption,
    double? proposedBudget,
    required String estimatedDuration,
  }) async {
    // TODO: Implement in Week 3
    return {'success': false, 'error': 'Not implemented yet'};
  }

  /// Get my applications as worker (Week 3)
  Future<Map<String, dynamic>> getMyApplications({
    String? status,
    int page = 1,
  }) async {
    // TODO: Implement in Week 3
    return {'success': false, 'error': 'Not implemented yet'};
  }

  /// Get applications for a job as client (Week 3)
  Future<Map<String, dynamic>> getJobApplications(int jobId) async {
    // TODO: Implement in Week 3
    return {'success': false, 'error': 'Not implemented yet'};
  }

  /// Accept or reject an application (Week 3)
  Future<Map<String, dynamic>> updateApplicationStatus({
    required int applicationId,
    required String status,
  }) async {
    // TODO: Implement in Week 3
    return {'success': false, 'error': 'Not implemented yet'};
  }

  /// Get my posted jobs as client (Week 3)
  Future<Map<String, dynamic>> getMyJobs({
    String? status,
    int page = 1,
  }) async {
    // TODO: Implement in Week 3
    return {'success': false, 'error': 'Not implemented yet'};
  }

  // ===========================
  // WEEK 4: JOB COMPLETION & PAYMENT (Placeholder)
  // ===========================

  /// Worker marks job as complete (Week 4)
  Future<Map<String, dynamic>> markJobComplete(int jobId) async {
    // TODO: Implement in Week 4
    return {'success': false, 'error': 'Not implemented yet'};
  }

  /// Client approves completion and pays remaining (Week 4)
  Future<Map<String, dynamic>> approveCompletion({
    required int jobId,
    required String finalPaymentMethod,
    String? notes,
  }) async {
    // TODO: Implement in Week 4
    return {'success': false, 'error': 'Not implemented yet'};
  }
}
