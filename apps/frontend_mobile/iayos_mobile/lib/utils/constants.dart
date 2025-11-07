import 'package:flutter/material.dart';

// API Configuration
class ApiConstants {
  static const String baseUrl = 'http://10.0.2.2:8000/api';
  static const String wsBaseUrl = 'ws://10.0.2.2:8001';
}

// App Colors
class AppColors {
  static const Color primary = Color(0xFF54B7EC);
  static const Color primaryLight = Color(0xFFD0EAF8);
  static const Color primaryDark = Color(0xFF3A9FD5);

  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFFA726);
  static const Color error = Color(0xFFBD0000);

  static const Color background = Colors.white;
  static const Color surface = Color(0xFFF5F5F5);
  static const Color surfaceLight = Color(0xFFFAFAFA);

  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textHint = Color(0xFFBDBDBD);

  static const Color divider = Color(0xFFE0E0E0);
}

// App Text Styles
class AppTextStyles {
  static const String fontFamily = 'Inter';

  // Titles
  static const TextStyle title = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  );

  static const TextStyle subtitle = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  // Body
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    color: AppColors.textPrimary,
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    color: AppColors.textPrimary,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.normal,
    color: AppColors.textSecondary,
  );

  // Caption
  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    color: AppColors.textSecondary,
  );

  // Buttons
  static const TextStyle button = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  );
}

// App Spacing
class AppSpacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double xxl = 32.0;
}

// App Border Radius
class AppRadius {
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double pill = 100.0;
}

// App Elevation
class AppElevation {
  static const double none = 0.0;
  static const double sm = 2.0;
  static const double md = 4.0;
  static const double lg = 8.0;
  static const double xl = 16.0;
}

// User Roles
class UserRoles {
  static const String admin = 'ADMIN';
  static const String user = 'USER';
  static const String agency = 'AGENCY';
}

// Profile Types
class ProfileTypes {
  static const String client = 'CLIENT';
  static const String worker = 'WORKER';
}

// Job Status
class JobStatus {
  static const String open = 'OPEN';
  static const String inProgress = 'IN_PROGRESS';
  static const String completed = 'COMPLETED';
  static const String cancelled = 'CANCELLED';
}

// Application Status
class ApplicationStatus {
  static const String pending = 'PENDING';
  static const String accepted = 'ACCEPTED';
  static const String rejected = 'REJECTED';
}

// Payment Methods
class PaymentMethods {
  static const String wallet = 'WALLET';
  static const String gcash = 'GCASH';
  static const String cash = 'CASH';
}

// Budget Options
class BudgetOptions {
  static const String accept = 'ACCEPT';
  static const String negotiate = 'NEGOTIATE';
}

// Job Urgency Levels
class JobUrgency {
  static const String low = 'LOW';
  static const String medium = 'MEDIUM';
  static const String high = 'HIGH';
}

// KYC ID Types
class KycIdTypes {
  static const String driversLicense = 'DRIVERSLICENSE';
  static const String passport = 'PASSPORT';
  static const String nationalId = 'NATIONALID';
  static const String umid = 'UMID';
  static const String philHealth = 'PHILHEALTH';
}

// KYC Clearance Types
class KycClearanceTypes {
  static const String police = 'POLICE';
  static const String nbi = 'NBI';
}

// Storage Keys
class StorageKeys {
  static const String accessToken = 'access_token';
  static const String refreshToken = 'refresh_token';
  static const String userCache = 'user_cache';
  static const String onboardingComplete = 'onboarding_complete';
}

// Animation Durations
class AppDurations {
  static const Duration fast = Duration(milliseconds: 200);
  static const Duration normal = Duration(milliseconds: 300);
  static const Duration slow = Duration(milliseconds: 500);
  static const Duration extraSlow = Duration(milliseconds: 800);
}

// Image Constraints
class ImageConstraints {
  static const int maxFileSizeMB = 5;
  static const int maxFileSizeBytes = 5 * 1024 * 1024; // 5MB
  static const int maxImagesPerJob = 10;
  static const List<String> allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
}

// Notification Polling
class NotificationConfig {
  static const Duration pollingInterval = Duration(seconds: 30);
}

// Distance Units
class DistanceUnits {
  static String formatDistance(double? distanceKm) {
    if (distanceKm == null) return 'Distance N/A';
    if (distanceKm < 1.0) {
      return '${(distanceKm * 1000).toStringAsFixed(0)}m away';
    }
    return '${distanceKm.toStringAsFixed(1)}km away';
  }
}

// Currency Formatting
class CurrencyFormatter {
  static String format(double amount) {
    return '₱${amount.toStringAsFixed(2)}';
  }

  static String formatCompact(double amount) {
    if (amount >= 1000000) {
      return '₱${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '₱${(amount / 1000).toStringAsFixed(1)}K';
    }
    return '₱${amount.toStringAsFixed(0)}';
  }
}
