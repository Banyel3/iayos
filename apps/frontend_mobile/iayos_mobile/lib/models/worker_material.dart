/// Material/Product model for workers
/// Matches Django WorkerProduct model from profiles/models.py
class WorkerMaterial {
  final int productID;
  final String name; // productName in backend
  final String? description;
  final double price;
  final String priceUnit; // PIECE, SET, LITER, GALLON, KG, METER, HOUR, SERVICE
  final bool inStock;
  final int? stockQuantity;
  final String? productImage;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? categoryID; // Specializations FK
  final int workerID; // WorkerProfile FK

  WorkerMaterial({
    required this.productID,
    required this.name,
    this.description,
    required this.price,
    this.priceUnit = 'PIECE',
    this.inStock = true,
    this.stockQuantity,
    this.productImage,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
    this.categoryID,
    required this.workerID,
  });

  factory WorkerMaterial.fromJson(Map<String, dynamic> json) {
    return WorkerMaterial(
      productID: json['productID'] ?? 0,
      name: json['name'] ?? json['productName'] ?? '',
      description: json['description'],
      price: (json['price'] is String)
          ? double.tryParse(json['price']) ?? 0.0
          : (json['price']?.toDouble() ?? 0.0),
      priceUnit: json['priceUnit'] ?? json['unit'] ?? 'PIECE',
      inStock: json['inStock'] ?? true,
      stockQuantity: json['stockQuantity'] ?? json['qty'],
      productImage: json['productImage'],
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
      categoryID: json['categoryID'],
      workerID: json['workerID'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productID': productID,
      'name': name,
      'description': description,
      'price': price,
      'priceUnit': priceUnit,
      'inStock': inStock,
      'stockQuantity': stockQuantity,
      'productImage': productImage,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'categoryID': categoryID,
      'workerID': workerID,
    };
  }

  /// Get display unit for UI
  String get displayUnit {
    switch (priceUnit) {
      case 'PIECE':
        return 'pc';
      case 'SET':
        return 'set';
      case 'LITER':
        return 'L';
      case 'GALLON':
        return 'gal';
      case 'KG':
        return 'kg';
      case 'METER':
        return 'm';
      case 'HOUR':
        return 'hr';
      case 'SERVICE':
        return 'service';
      default:
        return priceUnit.toLowerCase();
    }
  }

  /// Calculate subtotal (price * quantity)
  double getSubtotal() {
    return price * (stockQuantity ?? 1);
  }
}
