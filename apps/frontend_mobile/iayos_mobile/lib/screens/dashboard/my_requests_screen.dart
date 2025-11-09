import 'package:flutter/material.dart';
import '../../models/user.dart';
import '../jobs/my_jobs_screen.dart';

class MyRequestsScreen extends StatelessWidget {
  final User user;

  const MyRequestsScreen({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    // Simply redirect to MyJobsScreen
    return MyJobsScreen(user: user);
  }
}
