class User {
  final int accountID;
  final String email;
  final String role; // 'ADMIN' | 'USER' | 'AGENCY'
  final String accountType; // 'agency' | 'individual'
  final bool kycVerified;
  final ProfileData profileData;
  final List<dynamic> skillCategories;

  User({
    required this.accountID,
    required this.email,
    required this.role,
    required this.accountType,
    required this.kycVerified,
    required this.profileData,
    required this.skillCategories,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      accountID: json['accountID'] ?? 0,
      email: json['email'] ?? '',
      role: json['role'] ?? 'USER',
      accountType: json['accountType'] ?? 'individual',
      kycVerified: json['kycVerified'] ?? false,
      profileData: ProfileData.fromJson(json['profile_data'] ?? {}),
      skillCategories: json['skill_categories'] ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accountID': accountID,
      'email': email,
      'role': role,
      'accountType': accountType,
      'kycVerified': kycVerified,
      'profile_data': profileData.toJson(),
      'skill_categories': skillCategories,
    };
  }

  // Helper methods
  bool get hasProfileType => profileData.profileType != null;
  bool get isClient => profileData.profileType == 'CLIENT';
  bool get isWorker => profileData.profileType == 'WORKER';
  String get fullName => '${profileData.firstName} ${profileData.lastName}';
}

class ProfileData {
  final String firstName;
  final String middleName;
  final String lastName;
  final String? profileImg;
  final String? profileType; // 'WORKER' | 'CLIENT' | null
  final String? contactNum;
  final String? birthDate;
  final String? streetAddress;
  final String? city;
  final String? province;
  final String? postalCode;
  final String? country;
  final double? walletBalance;
  final bool? isAvailable; // For workers
  final String? specialization; // For workers
  final double? startingRate; // For workers
  final double? rating; // Average rating

  ProfileData({
    required this.firstName,
    this.middleName = '',
    required this.lastName,
    this.profileImg,
    this.profileType,
    this.contactNum,
    this.birthDate,
    this.streetAddress,
    this.city,
    this.province,
    this.postalCode,
    this.country,
    this.walletBalance,
    this.isAvailable,
    this.specialization,
    this.startingRate,
    this.rating,
  });

  factory ProfileData.fromJson(Map<String, dynamic> json) {
    return ProfileData(
      firstName: json['firstName'] ?? '',
      middleName: json['middleName'] ?? '',
      lastName: json['lastName'] ?? '',
      profileImg: json['profileImg'],
      profileType: json['profileType'],
      contactNum: json['contactNum'],
      birthDate: json['birthDate'],
      streetAddress: json['streetAddress'],
      city: json['city'],
      province: json['province'],
      postalCode: json['postalCode'],
      country: json['country'],
      walletBalance: json['walletBalance']?.toDouble(),
      isAvailable: json['isAvailable'],
      specialization: json['specialization'],
      startingRate: json['startingRate']?.toDouble(),
      rating: json['rating']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'firstName': firstName,
      'middleName': middleName,
      'lastName': lastName,
      'profileImg': profileImg,
      'profileType': profileType,
      'contactNum': contactNum,
      'birthDate': birthDate,
      'streetAddress': streetAddress,
      'city': city,
      'province': province,
      'postalCode': postalCode,
      'country': country,
      'walletBalance': walletBalance,
      'isAvailable': isAvailable,
      'specialization': specialization,
      'startingRate': startingRate,
      'rating': rating,
    };
  }

  String get displayLocation {
    if (city != null && province != null) {
      return '$city, $province';
    } else if (city != null) {
      return city!;
    } else if (province != null) {
      return province!;
    }
    return 'Location not set';
  }
}
