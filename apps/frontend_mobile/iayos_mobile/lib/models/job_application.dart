class JobApplication {
  final int id;
  final int jobId;
  final int workerId;
  final String proposalMessage;
  final double? proposedBudget;
  final String budgetOption; // 'ACCEPT' | 'NEGOTIATE'
  final String estimatedDuration;
  final String status; // 'PENDING' | 'ACCEPTED' | 'REJECTED'
  final WorkerProfile worker;
  final DateTime createdAt;
  final DateTime? updatedAt;

  JobApplication({
    required this.id,
    required this.jobId,
    required this.workerId,
    required this.proposalMessage,
    this.proposedBudget,
    required this.budgetOption,
    required this.estimatedDuration,
    required this.status,
    required this.worker,
    required this.createdAt,
    this.updatedAt,
  });

  factory JobApplication.fromJson(Map<String, dynamic> json) {
    return JobApplication(
      id: json['id'] ?? 0,
      jobId: json['job_id'] ?? json['jobId'] ?? 0,
      workerId: json['worker_id'] ?? json['workerId'] ?? 0,
      proposalMessage: json['proposal_message'] ?? json['proposalMessage'] ?? '',
      proposedBudget: json['proposed_budget']?.toDouble() ??
          json['proposedBudget']?.toDouble(),
      budgetOption: json['budget_option'] ?? json['budgetOption'] ?? 'ACCEPT',
      estimatedDuration: json['estimated_duration'] ??
          json['estimatedDuration'] ??
          '',
      status: json['status'] ?? 'PENDING',
      worker: WorkerProfile.fromJson(json['worker'] ?? {}),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'job_id': jobId,
      'worker_id': workerId,
      'proposal_message': proposalMessage,
      'proposed_budget': proposedBudget,
      'budget_option': budgetOption,
      'estimated_duration': estimatedDuration,
      'status': status,
      'worker': worker.toJson(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  // Helper methods
  bool get isPending => status == 'PENDING';
  bool get isAccepted => status == 'ACCEPTED';
  bool get isRejected => status == 'REJECTED';

  bool get isNegotiating => budgetOption == 'NEGOTIATE';
  bool get acceptsOriginalBudget => budgetOption == 'ACCEPT';

  String get formattedBudget {
    if (proposedBudget != null) {
      return '₱${proposedBudget!.toStringAsFixed(2)}';
    }
    return 'N/A';
  }
}

class WorkerProfile {
  final int id;
  final String name;
  final String? avatar;
  final double? rating;
  final String? city;
  final String? specialization;
  final int? completedJobs;
  final double? startingRate;
  final bool? isAvailable;

  WorkerProfile({
    required this.id,
    required this.name,
    this.avatar,
    this.rating,
    this.city,
    this.specialization,
    this.completedJobs,
    this.startingRate,
    this.isAvailable,
  });

  factory WorkerProfile.fromJson(Map<String, dynamic> json) {
    return WorkerProfile(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      avatar: json['avatar'],
      rating: json['rating']?.toDouble(),
      city: json['city'],
      specialization: json['specialization'],
      completedJobs: json['completed_jobs'] ?? json['completedJobs'],
      startingRate: json['starting_rate']?.toDouble() ??
          json['startingRate']?.toDouble(),
      isAvailable: json['is_available'] ?? json['isAvailable'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'avatar': avatar,
      'rating': rating,
      'city': city,
      'specialization': specialization,
      'completed_jobs': completedJobs,
      'starting_rate': startingRate,
      'is_available': isAvailable,
    };
  }

  String get displayRating {
    if (rating != null) {
      return '${rating!.toStringAsFixed(1)} ⭐';
    }
    return 'No ratings yet';
  }

  String get displayStartingRate {
    if (startingRate != null) {
      return '₱${startingRate!.toStringAsFixed(2)}/hr';
    }
    return 'Rate not set';
  }
}
