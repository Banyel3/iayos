class Job {
  final int id;
  final String title;
  final String description;
  final double budget;
  final String location;
  final String status; // 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  final String? categoryName;
  final int? categoryId;
  final String? expectedDuration;
  final String? preferredStartDate;
  final List<String>? materialsNeeded;

  // Transaction flags (CRITICAL for payment flow)
  final bool workerMarkedComplete;
  final bool clientMarkedComplete;
  final bool workerReviewed;
  final bool clientReviewed;
  final bool remainingPaymentPaid;

  // Payment methods
  final String? downpaymentMethod; // 'WALLET' | 'GCASH'
  final String? finalPaymentMethod; // 'WALLET' | 'GCASH' | 'CASH'

  // Related data
  final List<JobPhoto> photos;
  final JobClient? postedBy;
  final JobWorker? assignedWorker;
  final double? distance; // In kilometers
  final String? urgency; // 'LOW' | 'MEDIUM' | 'HIGH'
  final int? applicationsCount; // Number of applications for this job
  final bool? hasApplied; // Whether current user has applied

  // Timestamps
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? completedAt;

  Job({
    required this.id,
    required this.title,
    required this.description,
    required this.budget,
    required this.location,
    required this.status,
    this.categoryName,
    this.categoryId,
    this.expectedDuration,
    this.preferredStartDate,
    this.materialsNeeded,
    this.workerMarkedComplete = false,
    this.clientMarkedComplete = false,
    this.workerReviewed = false,
    this.clientReviewed = false,
    this.remainingPaymentPaid = false,
    this.downpaymentMethod,
    this.finalPaymentMethod,
    this.photos = const [],
    this.postedBy,
    this.assignedWorker,
    this.distance,
    this.urgency,
    this.applicationsCount,
    this.hasApplied,
    required this.createdAt,
    this.updatedAt,
    this.completedAt,
  });

  factory Job.fromJson(Map<String, dynamic> json) {
    return Job(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      budget: (json['budget'] ?? 0).toDouble(),
      location: json['location'] ?? '',
      status: json['status'] ?? 'OPEN',
      categoryName: json['category_name'] ?? json['category'],
      categoryId: json['category_id'],
      expectedDuration: json['expected_duration'],
      preferredStartDate: json['preferred_start_date'],
      materialsNeeded: json['materials_needed'] != null
          ? List<String>.from(json['materials_needed'])
          : null,
      workerMarkedComplete: json['workerMarkedComplete'] ?? false,
      clientMarkedComplete: json['clientMarkedComplete'] ?? false,
      workerReviewed: json['workerReviewed'] ?? false,
      clientReviewed: json['clientReviewed'] ?? false,
      remainingPaymentPaid: json['remainingPaymentPaid'] ?? false,
      downpaymentMethod: json['downpaymentMethod'],
      finalPaymentMethod: json['finalPaymentMethod'],
      photos: json['photos'] != null
          ? (json['photos'] as List).map((p) => JobPhoto.fromJson(p)).toList()
          : [],
      postedBy: json['postedBy'] != null
          ? JobClient.fromJson(json['postedBy'])
          : null,
      assignedWorker: json['assignedWorker'] != null
          ? JobWorker.fromJson(json['assignedWorker'])
          : null,
      distance: json['distance']?.toDouble(),
      urgency: json['urgency'],
      applicationsCount: json['applications_count'] ?? json['applicationsCount'],
      hasApplied: json['has_applied'] ?? json['hasApplied'] ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'budget': budget,
      'location': location,
      'status': status,
      'category_name': categoryName,
      'category_id': categoryId,
      'expected_duration': expectedDuration,
      'preferred_start_date': preferredStartDate,
      'materials_needed': materialsNeeded,
      'workerMarkedComplete': workerMarkedComplete,
      'clientMarkedComplete': clientMarkedComplete,
      'workerReviewed': workerReviewed,
      'clientReviewed': clientReviewed,
      'remainingPaymentPaid': remainingPaymentPaid,
      'downpaymentMethod': downpaymentMethod,
      'finalPaymentMethod': finalPaymentMethod,
      'photos': photos.map((p) => p.toJson()).toList(),
      'postedBy': postedBy?.toJson(),
      'assignedWorker': assignedWorker?.toJson(),
      'distance': distance,
      'urgency': urgency,
      'applications_count': applicationsCount,
      'has_applied': hasApplied,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'completed_at': completedAt?.toIso8601String(),
    };
  }

  // Helper methods
  double get downpaymentAmount => budget * 0.5;
  double get remainingAmount => budget * 0.5;

  bool get isOpen => status == 'OPEN';
  bool get isInProgress => status == 'IN_PROGRESS';
  bool get isCompleted => status == 'COMPLETED';
  bool get isCancelled => status == 'CANCELLED';

  bool get canWorkerMarkComplete => isInProgress && !workerMarkedComplete;
  bool get canClientApprove =>
      isInProgress && workerMarkedComplete && !clientMarkedComplete;
  bool get canSubmitReview =>
      workerMarkedComplete &&
      clientMarkedComplete &&
      remainingPaymentPaid &&
      !isCompleted;

  bool get needsPaymentConfirmation =>
      clientMarkedComplete &&
      finalPaymentMethod == 'GCASH' &&
      !remainingPaymentPaid;

  String get formattedBudget => '₱${budget.toStringAsFixed(2)}';
  String get formattedDownpayment => '₱${downpaymentAmount.toStringAsFixed(2)}';
  String get formattedRemaining => '₱${remainingAmount.toStringAsFixed(2)}';
}

class JobPhoto {
  final int id;
  final String url;
  final String fileName;

  JobPhoto({
    required this.id,
    required this.url,
    required this.fileName,
  });

  factory JobPhoto.fromJson(Map<String, dynamic> json) {
    return JobPhoto(
      id: json['id'] ?? 0,
      url: json['url'] ?? '',
      fileName: json['file_name'] ?? json['fileName'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'url': url,
      'file_name': fileName,
    };
  }
}

class JobClient {
  final int id;
  final String name;
  final String? avatar;
  final double? rating;
  final String? location;

  JobClient({
    required this.id,
    required this.name,
    this.avatar,
    this.rating,
    this.location,
  });

  factory JobClient.fromJson(Map<String, dynamic> json) {
    return JobClient(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      avatar: json['avatar'],
      rating: json['rating']?.toDouble(),
      location: json['location'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'avatar': avatar,
      'rating': rating,
      'location': location,
    };
  }
}

class JobWorker {
  final int id;
  final String name;
  final String? avatar;
  final double? rating;
  final String? specialization;
  final String? location;

  JobWorker({
    required this.id,
    required this.name,
    this.avatar,
    this.rating,
    this.specialization,
    this.location,
  });

  factory JobWorker.fromJson(Map<String, dynamic> json) {
    return JobWorker(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      avatar: json['avatar'],
      rating: json['rating']?.toDouble(),
      specialization: json['specialization'],
      location: json['location'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'avatar': avatar,
      'rating': rating,
      'specialization': specialization,
      'location': location,
    };
  }
}
