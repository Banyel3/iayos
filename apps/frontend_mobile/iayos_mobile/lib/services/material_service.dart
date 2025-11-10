import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/worker_material.dart';
import 'api_config.dart';

/// Service for managing worker materials/products
/// Corresponds to Django profiles/api.py endpoints
class MaterialService {
  /// Get all materials for the authenticated worker
  /// GET /api/profiles/profile/products/
  Future<Map<String, dynamic>> getMaterials() async {
    try {
      final response = await http.get(
        Uri.parse('${APIConfig.baseURL}/profiles/profile/products/'),
        headers: APIConfig.headers,
      );

      print('Get Materials Response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final materials = data
            .map((item) => WorkerMaterial.fromJson(item))
            .toList();

        return {
          'success': true,
          'data': materials,
        };
      } else {
        print('Failed to get materials: ${response.body}');
        return {
          'success': false,
          'error': 'Failed to load materials',
        };
      }
    } catch (e) {
      print('Error getting materials: $e');
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Add a new material
  /// POST /api/profiles/profile/products/add
  Future<Map<String, dynamic>> addMaterial({
    required String name,
    String? description,
    required double price,
    String priceUnit = 'PIECE',
    int? stockQuantity,
    bool inStock = true,
  }) async {
    try {
      final body = json.encode({
        'name': name,
        'description': description,
        'price': price,
        'priceUnit': priceUnit,
        'stockQuantity': stockQuantity,
        'inStock': inStock,
        'isActive': true,
      });

      print('Add Material Request: $body');

      final response = await http.post(
        Uri.parse('${APIConfig.baseURL}/profiles/profile/products/add'),
        headers: APIConfig.headers,
        body: body,
      );

      print('Add Material Response: ${response.statusCode} - ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        final material = WorkerMaterial.fromJson(data);

        return {
          'success': true,
          'data': material,
          'message': 'Material added successfully',
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['error'] ?? 'Failed to add material',
        };
      }
    } catch (e) {
      print('Error adding material: $e');
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Delete a material by ID
  /// DELETE /api/profiles/profile/products/{productID}
  Future<Map<String, dynamic>> deleteMaterial(int productID) async {
    try {
      final response = await http.delete(
        Uri.parse('${APIConfig.baseURL}/profiles/profile/products/$productID'),
        headers: APIConfig.headers,
      );

      print('Delete Material Response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 204) {
        return {
          'success': true,
          'message': 'Material deleted successfully',
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['error'] ?? 'Failed to delete material',
        };
      }
    } catch (e) {
      print('Error deleting material: $e');
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Update an existing material
  /// PUT /api/profiles/profile/products/{productID}
  /// Note: This endpoint might need to be added to the backend if not exists
  Future<Map<String, dynamic>> updateMaterial({
    required int productID,
    String? name,
    String? description,
    double? price,
    String? priceUnit,
    int? stockQuantity,
    bool? inStock,
    bool? isActive,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (description != null) body['description'] = description;
      if (price != null) body['price'] = price;
      if (priceUnit != null) body['priceUnit'] = priceUnit;
      if (stockQuantity != null) body['stockQuantity'] = stockQuantity;
      if (inStock != null) body['inStock'] = inStock;
      if (isActive != null) body['isActive'] = isActive;

      print('Update Material Request: ${json.encode(body)}');

      final response = await http.put(
        Uri.parse('${APIConfig.baseURL}/profiles/profile/products/$productID'),
        headers: APIConfig.headers,
        body: json.encode(body),
      );

      print('Update Material Response: ${response.statusCode} - ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final material = WorkerMaterial.fromJson(data);

        return {
          'success': true,
          'data': material,
          'message': 'Material updated successfully',
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['error'] ?? 'Failed to update material',
        };
      }
    } catch (e) {
      print('Error updating material: $e');
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  /// Get public materials for a specific worker (for viewing other worker profiles)
  /// GET /api/profiles/worker/{workerID}/products
  /// Note: This endpoint might need to be added to the backend
  Future<Map<String, dynamic>> getWorkerMaterials(int workerID) async {
    try {
      final response = await http.get(
        Uri.parse('${APIConfig.baseURL}/profiles/worker/$workerID/products'),
        headers: APIConfig.headers,
      );

      print('Get Worker Materials Response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final materials = data
            .map((item) => WorkerMaterial.fromJson(item))
            .toList();

        return {
          'success': true,
          'data': materials,
        };
      } else {
        print('Failed to get worker materials: ${response.body}');
        return {
          'success': false,
          'error': 'Failed to load materials',
        };
      }
    } catch (e) {
      print('Error getting worker materials: $e');
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }
}
