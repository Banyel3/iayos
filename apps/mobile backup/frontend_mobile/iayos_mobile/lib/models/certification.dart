/// Certification model for workers
/// Based on workerSpecialization model and KYC files structure
class Certification {
  final int? certificationID;
  final String certificationName;
  final String? issuingOrganization;
  final String? certificateNumber;
  final DateTime? issueDate;
  final DateTime? expiryDate;
  final String? documentUrl; // URL to certificate file
  final String? fileName;
  final int? fileSize;
  final bool verified;
  final DateTime? verifiedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  Certification({
    this.certificationID,
    required this.certificationName,
    this.issuingOrganization,
    this.certificateNumber,
    this.issueDate,
    this.expiryDate,
    this.documentUrl,
    this.fileName,
    this.fileSize,
    this.verified = false,
    this.verifiedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) : createdAt = createdAt ?? DateTime.now(),
       updatedAt = updatedAt ?? DateTime.now();

  factory Certification.fromJson(Map<String, dynamic> json) {
    return Certification(
      certificationID: json['certificationID'] ?? json['id'],
      certificationName:
          json['certificationName'] ??
          json['certification'] ??
          json['name'] ??
          '',
      issuingOrganization: json['issuingOrganization'] ?? json['issuer'],
      certificateNumber: json['certificateNumber'] ?? json['number'],
      issueDate: json['issueDate'] != null
          ? DateTime.tryParse(json['issueDate'])
          : null,
      expiryDate: json['expiryDate'] != null
          ? DateTime.tryParse(json['expiryDate'])
          : null,
      documentUrl: json['documentUrl'] ?? json['fileURL'],
      fileName: json['fileName'],
      fileSize: json['fileSize'],
      verified: json['verified'] ?? false,
      verifiedAt: json['verifiedAt'] != null
          ? DateTime.tryParse(json['verifiedAt'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt']) ??
                (json['uploadedAt'] != null
                    ? DateTime.tryParse(json['uploadedAt'])
                    : null)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'certificationID': certificationID,
      'certificationName': certificationName,
      'issuingOrganization': issuingOrganization,
      'certificateNumber': certificateNumber,
      'issueDate': issueDate?.toIso8601String(),
      'expiryDate': expiryDate?.toIso8601String(),
      'documentUrl': documentUrl,
      'fileName': fileName,
      'fileSize': fileSize,
      'verified': verified,
      'verifiedAt': verifiedAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Check if certification is expired
  bool get isExpired {
    if (expiryDate == null) return false;
    return DateTime.now().isAfter(expiryDate!);
  }

  /// Check if certification is expiring soon (within 30 days)
  bool get isExpiringSoon {
    if (expiryDate == null) return false;
    final daysUntilExpiry = expiryDate!.difference(DateTime.now()).inDays;
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  }

  /// Get status text for UI
  String get statusText {
    if (!verified) return 'Pending Verification';
    if (isExpired) return 'Expired';
    if (isExpiringSoon) return 'Expiring Soon';
    return 'Verified';
  }
}
