import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

class ProfileService {
  static final ProfileService _instance = ProfileService._internal();
  factory ProfileService() => _instance;
  ProfileService._internal();

  final _storage = const FlutterSecureStorage();

  /// Get current user profile
  Future<Map<String, dynamic>> getProfile() async {
    try {
      final token = await _storage.read(key: 'access_token');
      if (token == null) {
        return {
          'success': false,
          'error': 'No authentication token found',
        };
      }

      final response = await http.get(
        Uri.parse(ApiConfig.getProfile),
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
          'error': error['error'] ?? 'Failed to fetch profile',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Update user profile
  Future<Map<String, dynamic>> updateProfile({
    String? firstName,
    String? lastName,
    String? contactNum,
    String? birthDate,
  }) async {
    try {
      final token = await _storage.read(key: 'access_token');
      if (token == null) {
        return {
          'success': false,
          'error': 'No authentication token found',
        };
      }

      final payload = <String, dynamic>{};
      if (firstName != null) payload['firstName'] = firstName;
      if (lastName != null) payload['lastName'] = lastName;
      if (contactNum != null) payload['contactNum'] = contactNum;
      if (birthDate != null) payload['birthDate'] = birthDate;

      final response = await http.put(
        Uri.parse(ApiConfig.updateProfile),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(payload),
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
          'error': error['error'] ?? 'Failed to update profile',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Upload profile image
  Future<Map<String, dynamic>> uploadProfileImage(File imageFile) async {
    try {
      final token = await _storage.read(key: 'access_token');
      if (token == null) {
        return {
          'success': false,
          'error': 'No authentication token found',
        };
      }

      var request = http.MultipartRequest(
        'POST',
        Uri.parse(ApiConfig.uploadProfileImage),
      );

      request.headers.addAll({
        'Authorization': 'Bearer $token',
      });

      request.files.add(
        await http.MultipartFile.fromPath(
          'profile_image',
          imageFile.path,
        ),
      );

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

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
          'error': error['error'] ?? 'Failed to upload image',
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
