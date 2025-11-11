import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

/// Service for managing job applications (Week 3 - Phase 1)
///
/// This service handles all job application operations including:
/// - Submitting applications to jobs
/// - Fetching worker's applications
/// - Fetching applications for a job (client view)
/// - Accepting/rejecting applications (client action)
class ApplicationService {
  static final ApplicationService _instance = ApplicationService._internal();
  factory ApplicationService() => _instance;
  ApplicationService._internal();

  final _storage = const FlutterSecureStorage();

  /// Get authorization headers with JWT token
  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // ===========================
  // WEEK 3: JOB APPLICATION METHODS
  // ===========================

  /// Submit a job application as a worker
  ///
  /// Parameters:
  /// - [jobId]: The ID of the job to apply to
  /// - [proposedBudget]: The budget proposed by the worker (optional if accepting original)
  /// - [coverMessage]: Cover message/proposal text
  ///
  /// Returns: {'success': bool, 'data': {...}, 'error': string?}
  Future<Map<String, dynamic>> submitApplication({
    required int jobId,
    required double proposedBudget,
    required String coverMessage,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.applyToJob(jobId)),
        headers: await _getHeaders(),
        body: jsonEncode({
          'proposed_budget': proposedBudget,
          'cover_message': coverMessage,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'data': data['data'] ?? data,
        };
      } else if (response.statusCode == 400) {
        return {
          'success': false,
          'error': data['error'] ?? 'Invalid application data',
        };
      } else if (response.statusCode == 409) {
        return {
          'success': false,
          'error': data['error'] ?? 'You have already applied to this job',
        };
      } else if (response.statusCode == 404) {
        return {
          'success': false,
          'error': 'Job not found or no longer available',
        };
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to submit application',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Get worker's own applications
  ///
  /// Parameters:
  /// - [status]: Filter by status (PENDING, ACCEPTED, REJECTED) or null for all
  /// - [page]: Page number for pagination (default: 1)
  /// - [limit]: Number of items per page (default: 20)
  ///
  /// Returns: {'success': bool, 'data': [applications...], 'total': int, 'error': string?}
  Future<Map<String, dynamic>> getMyApplications({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };

      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }

      final uri = Uri.parse(ApiConfig.myApplications).replace(
        queryParameters: queryParams,
      );

      final response = await http.get(uri, headers: await _getHeaders());
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'] ?? data['applications'] ?? [],
          'total': data['total'] ?? 0,
          'page': data['page'] ?? page,
          'limit': data['limit'] ?? limit,
        };
      } else if (response.statusCode == 403) {
        return {
          'success': false,
          'error': 'Only workers can view their applications',
        };
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to fetch applications',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Get applications for a specific job (client only)
  ///
  /// Parameters:
  /// - [jobId]: The ID of the job
  ///
  /// Returns: {'success': bool, 'data': [applications...], 'error': string?}
  Future<Map<String, dynamic>> getJobApplications(int jobId) async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.jobApplications(jobId)),
        headers: await _getHeaders(),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'] ?? data['applications'] ?? [],
        };
      } else if (response.statusCode == 403) {
        return {
          'success': false,
          'error': 'Only job owners can view applications',
        };
      } else if (response.statusCode == 404) {
        return {
          'success': false,
          'error': 'Job not found',
        };
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to fetch job applications',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Update application status (accept or reject) - Client only
  ///
  /// Parameters:
  /// - [applicationId]: The ID of the application
  /// - [status]: New status ('ACCEPTED' or 'REJECTED')
  ///
  /// Returns: {'success': bool, 'data': {...}, 'error': string?}
  Future<Map<String, dynamic>> updateApplicationStatus({
    required int applicationId,
    required String status,
  }) async {
    try {
      if (status != 'ACCEPTED' && status != 'REJECTED') {
        return {
          'success': false,
          'error': 'Invalid status. Must be ACCEPTED or REJECTED',
        };
      }

      final response = await http.put(
        Uri.parse(ApiConfig.updateApplicationStatus(applicationId)),
        headers: await _getHeaders(),
        body: jsonEncode({
          'status': status,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'] ?? data,
        };
      } else if (response.statusCode == 403) {
        return {
          'success': false,
          'error': 'Only job owners can update application status',
        };
      } else if (response.statusCode == 404) {
        return {
          'success': false,
          'error': 'Application not found',
        };
      } else if (response.statusCode == 400) {
        return {
          'success': false,
          'error': data['error'] ?? 'Invalid request',
        };
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to update application status',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Get application by ID
  ///
  /// Parameters:
  /// - [applicationId]: The ID of the application
  ///
  /// Returns: {'success': bool, 'data': {...}, 'error': string?}
  Future<Map<String, dynamic>> getApplicationById(int applicationId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.mobileBaseUrl}/applications/$applicationId'),
        headers: await _getHeaders(),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'] ?? data,
        };
      } else if (response.statusCode == 404) {
        return {
          'success': false,
          'error': 'Application not found',
        };
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Failed to fetch application',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // ===========================
  // HELPER METHODS
  // ===========================

  /// Check if user has already applied to a job
  Future<bool> hasAppliedToJob(int jobId) async {
    try {
      final result = await getMyApplications();
      if (result['success']) {
        final applications = result['data'] as List;
        return applications.any((app) => app['job_id'] == jobId);
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Get application count for a specific status
  Future<int> getApplicationCount({String? status}) async {
    try {
      final result = await getMyApplications(status: status, page: 1, limit: 1);
      if (result['success']) {
        return result['total'] ?? 0;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
}
