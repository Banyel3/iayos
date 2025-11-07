import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/welcome_screen.dart';
import 'screens/onboarding/create_account_screen.dart';
import 'screens/onboarding/set_location_screen.dart';
import 'screens/onboarding/verify_email_screen.dart';
import 'screens/onboarding/role_selection_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations (portrait only)
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(const iAyosApp());
}

class iAyosApp extends StatelessWidget {
  const iAyosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'iAyos',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF54B7EC),
          primary: const Color(0xFF54B7EC),
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.white,
      ),
      home: const WelcomeScreen(),
      routes: {
        '/welcome': (context) => const WelcomeScreen(),
        '/login': (context) => const LoginScreen(),
        '/forgot-password': (context) => const ForgotPasswordScreen(),
        '/create-account': (context) => const CreateAccountScreen(),
        '/set-location': (context) => const SetLocationScreen(),
        '/verify-email': (context) => const VerifyEmailScreen(),
        '/role-selection': (context) => const RoleSelectionScreen(),
        '/dashboard': (context) => const DashboardScreen(),
      },
    );
  }
}
