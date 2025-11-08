import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/user.dart';
import '../../utils/constants.dart';
import '../../services/job_service.dart';

class PostJobScreen extends StatefulWidget {
  final User user;

  const PostJobScreen({super.key, required this.user});

  @override
  State<PostJobScreen> createState() => _PostJobScreenState();
}

class _PostJobScreenState extends State<PostJobScreen> {
  final _formKey = GlobalKey<FormState>();
  final _jobService = JobService();

  // Form controllers
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _budgetController = TextEditingController();
  final _locationController = TextEditingController();
  final _expectedDurationController = TextEditingController();
  final _materialsController = TextEditingController();

  // Form data
  int? _selectedCategoryId;
  String _selectedUrgency = 'MEDIUM';
  String _selectedPaymentMethod = 'WALLET';
  List<dynamic> _categories = [];
  bool _isLoadingCategories = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _budgetController.dispose();
    _locationController.dispose();
    _expectedDurationController.dispose();
    _materialsController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    final result = await _jobService.getCategories();
    if (result['success'] && mounted) {
      setState(() {
        _categories = result['data']['categories'] ?? [];
        _isLoadingCategories = false;
      });
    } else if (mounted) {
      setState(() {
        _isLoadingCategories = false;
      });
    }
  }

  Future<void> _submitJob() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    // Parse materials (comma-separated)
    final materialsText = _materialsController.text.trim();
    final materials = materialsText.isNotEmpty
        ? materialsText.split(',').map((m) => m.trim()).where((m) => m.isNotEmpty).toList()
        : null;

    final result = await _jobService.createJob(
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      categoryId: _selectedCategoryId,
      budget: double.parse(_budgetController.text.trim()),
      location: _locationController.text.trim(),
      expectedDuration: _expectedDurationController.text.trim(),
      urgencyLevel: _selectedUrgency,
      downpaymentMethod: _selectedPaymentMethod,
      materialsNeeded: materials,
    );

    if (mounted) {
      setState(() {
        _isSubmitting = false;
      });

      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Job posted successfully!',
              style: GoogleFonts.inter(),
            ),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true); // Return true to refresh list
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['error'] ?? 'Failed to post job',
              style: GoogleFonts.inter(),
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Post a Job',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
      ),
      body: _isLoadingCategories
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Text(
                      'Tell us about the job',
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Provide details to help workers understand what you need',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Colors.black54,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Title
                    _buildTextField(
                      controller: _titleController,
                      label: 'Job Title',
                      hint: 'e.g., Fix leaking pipe in bathroom',
                      icon: Icons.title,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter a job title';
                        }
                        if (value.trim().length < 5) {
                          return 'Title must be at least 5 characters';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Description
                    _buildTextField(
                      controller: _descriptionController,
                      label: 'Description',
                      hint: 'Describe the work that needs to be done...',
                      icon: Icons.description,
                      maxLines: 5,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter a description';
                        }
                        if (value.trim().length < 20) {
                          return 'Description must be at least 20 characters';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Category
                    _buildCategoryDropdown(),
                    const SizedBox(height: 16),

                    // Budget
                    _buildTextField(
                      controller: _budgetController,
                      label: 'Budget (₱)',
                      hint: '0.00',
                      icon: Icons.attach_money,
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter your budget';
                        }
                        final budget = double.tryParse(value.trim());
                        if (budget == null || budget <= 0) {
                          return 'Please enter a valid budget';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Location
                    _buildTextField(
                      controller: _locationController,
                      label: 'Location',
                      hint: 'e.g., Zamboanga City, Philippines',
                      icon: Icons.location_on,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter the job location';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Expected Duration
                    _buildTextField(
                      controller: _expectedDurationController,
                      label: 'Expected Duration',
                      hint: 'e.g., 2-3 hours, 1 day, 1 week',
                      icon: Icons.access_time,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter expected duration';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // Urgency Level
                    _buildUrgencySelector(),
                    const SizedBox(height: 16),

                    // Materials Needed (Optional)
                    _buildTextField(
                      controller: _materialsController,
                      label: 'Materials Needed (Optional)',
                      hint: 'e.g., Pipes, Wrench, Sealant (comma-separated)',
                      icon: Icons.build,
                      maxLines: 3,
                    ),
                    const SizedBox(height: 16),

                    // Payment Method
                    _buildPaymentMethodSelector(),
                    const SizedBox(height: 24),

                    // Payment Info
                    _buildPaymentInfo(),
                    const SizedBox(height: 32),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submitJob,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                'Post Job',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(color: Colors.grey.shade400),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.primary, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.red),
            ),
            contentPadding: const EdgeInsets.all(16),
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.category, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              'Category',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<int>(
          value: _selectedCategoryId,
          decoration: InputDecoration(
            hintText: 'Select a category',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            contentPadding: const EdgeInsets.all(16),
          ),
          items: _categories.map((category) {
            return DropdownMenuItem<int>(
              value: category['id'],
              child: Text(category['name']),
            );
          }).toList(),
          onChanged: (value) {
            setState(() {
              _selectedCategoryId = value;
            });
          },
          validator: (value) {
            if (value == null) {
              return 'Please select a category';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildUrgencySelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.priority_high, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              'Urgency Level',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildUrgencyOption('LOW', 'Low', Colors.green),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildUrgencyOption('MEDIUM', 'Medium', Colors.orange),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildUrgencyOption('HIGH', 'High', Colors.red),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildUrgencyOption(String value, String label, Color color) {
    final isSelected = _selectedUrgency == value;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedUrgency = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.1) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? color : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? color : Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.payment, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              'Downpayment Method (50% upfront)',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildPaymentOption('WALLET', 'Wallet', Icons.account_balance_wallet),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildPaymentOption('GCASH', 'GCash', Icons.phone_android),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPaymentOption(String value, String label, IconData icon) {
    final isSelected = _selectedPaymentMethod == value;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedPaymentMethod = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.1) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primary : Colors.grey.shade600,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? AppColors.primary : Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, size: 20, color: Colors.blue.shade700),
              const SizedBox(width: 8),
              Text(
                'Payment Information',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '• 50% downpayment required to post the job\n'
            '• Remaining 50% paid after job completion\n'
            '• Workers can only see jobs with paid downpayment',
            style: GoogleFonts.inter(
              fontSize: 12,
              color: Colors.blue.shade700,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
