/// Review model for jobs
/// Matches Django JobReview model from accounts/models.py
class Review {
  final int reviewID;
  final int jobID;
  final int reviewerID;
  final int revieweeID;
  final String reviewerType; // CLIENT or WORKER
  final double rating; // 1.0 to 5.0
  final String comment;
  final String status; // ACTIVE, FLAGGED, HIDDEN, DELETED
  final bool isFlagged;
  final String? flagReason;
  final int? flaggedBy;
  final DateTime? flaggedAt;
  final int helpfulCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Additional fields for UI
  final String? reviewerName;
  final String? reviewerProfileImg;
  final String? jobTitle;

  Review({
    required this.reviewID,
    required this.jobID,
    required this.reviewerID,
    required this.revieweeID,
    required this.reviewerType,
    required this.rating,
    required this.comment,
    this.status = 'ACTIVE',
    this.isFlagged = false,
    this.flagReason,
    this.flaggedBy,
    this.flaggedAt,
    this.helpfulCount = 0,
    required this.createdAt,
    required this.updatedAt,
    this.reviewerName,
    this.reviewerProfileImg,
    this.jobTitle,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      reviewID: json['reviewID'] ?? json['id'] ?? 0,
      jobID: json['jobID'] ?? 0,
      reviewerID: json['reviewerID'] ?? 0,
      revieweeID: json['revieweeID'] ?? 0,
      reviewerType: json['reviewerType'] ?? 'CLIENT',
      rating: (json['rating'] is String)
          ? double.tryParse(json['rating']) ?? 0.0
          : (json['rating']?.toDouble() ?? 0.0),
      comment: json['comment'] ?? json['feedback'] ?? '',
      status: json['status'] ?? 'ACTIVE',
      isFlagged: json['isFlagged'] ?? false,
      flagReason: json['flagReason'],
      flaggedBy: json['flaggedBy'],
      flaggedAt: json['flaggedAt'] != null
          ? DateTime.tryParse(json['flaggedAt'])
          : null,
      helpfulCount: json['helpfulCount'] ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
      reviewerName: json['reviewerName'] ?? json['reviewer_name'],
      reviewerProfileImg: json['reviewerProfileImg'] ?? json['reviewer_profile_img'],
      jobTitle: json['jobTitle'] ?? json['job_title'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'reviewID': reviewID,
      'jobID': jobID,
      'reviewerID': reviewerID,
      'revieweeID': revieweeID,
      'reviewerType': reviewerType,
      'rating': rating,
      'comment': comment,
      'status': status,
      'isFlagged': isFlagged,
      'flagReason': flagReason,
      'flaggedBy': flaggedBy,
      'flaggedAt': flaggedAt?.toIso8601String(),
      'helpfulCount': helpfulCount,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'reviewerName': reviewerName,
      'reviewerProfileImg': reviewerProfileImg,
      'jobTitle': jobTitle,
    };
  }

  /// Get star icons array for UI
  List<bool> get starArray {
    return List.generate(5, (index) => index < rating.round());
  }

  /// Get relative time string (e.g., "2 days ago")
  String getRelativeTime() {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 365) {
      final years = (difference.inDays / 365).floor();
      return '$years year${years > 1 ? 's' : ''} ago';
    } else if (difference.inDays > 30) {
      final months = (difference.inDays / 30).floor();
      return '$months month${months > 1 ? 's' : ''} ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  }

  /// Check if review is from client
  bool get isFromClient => reviewerType == 'CLIENT';

  /// Check if review is from worker
  bool get isFromWorker => reviewerType == 'WORKER';
}
