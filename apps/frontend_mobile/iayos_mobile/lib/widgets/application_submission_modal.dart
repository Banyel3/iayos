import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/constants.dart';
import '../services/application_service.dart';

/// Modal for submitting job applications
///
/// Displays a bottom sheet where workers can submit an application to a job.
/// Includes:
/// - Proposed budget input field
/// - Cover message text area
/// - Submit button with loading state
/// - Input validation
class ApplicationSubmissionModal extends StatefulWidget {
  final int jobId;
  final String jobTitle;
  final double originalBudget;
  final VoidCallback onSuccess;

  const ApplicationSubmissionModal({
    super.key,
    required this.jobId,
    required this.jobTitle,
    required this.originalBudget,
    required this.onSuccess,
  });

  @override
  State<ApplicationSubmissionModal> createState() =>
      _ApplicationSubmissionModalState();
}

class _ApplicationSubmissionModalState
    extends State<ApplicationSubmissionModal> {
  final _formKey = GlobalKey<FormState>();
  final _budgetController = TextEditingController();
  final _messageController = TextEditingController();
  final _durationController = TextEditingController();
  final _applicationService = ApplicationService();

  bool _isSubmitting = false;
  String _budgetOption = 'ACCEPT'; // Default to accepting original budget

  @override
  void initState() {
    super.initState();
    // Pre-fill with original budget
    _budgetController.text = widget.originalBudget.toStringAsFixed(2);
  }

  @override
  void dispose() {
    _budgetController.dispose();
    _messageController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  Future<void> _submitApplication() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    final proposedBudget = double.tryParse(_budgetController.text) ?? 0.0;
    final proposalMessage = _messageController.text.trim();
    final estimatedDuration = _durationController.text.trim();

    final result = await _applicationService.submitApplication(
      jobId: widget.jobId,
      proposalMessage: proposalMessage,
      budgetOption: _budgetOption,
      proposedBudget: _budgetOption == 'NEGOTIATE'
          ? proposedBudget
          : widget.originalBudget,
      estimatedDuration: estimatedDuration,
    );

    if (mounted) {
      setState(() {
        _isSubmitting = false;
      });

      if (result['success']) {
        // Close modal
        Navigator.of(context).pop();

        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Application submitted successfully!',
              style: GoogleFonts.inter(),
            ),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );

        // Call success callback
        widget.onSuccess();
      } else {
        // Show error message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['error'] ?? 'Failed to submit application',
              style: GoogleFonts.inter(),
            ),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  _buildHeader(),
                  const SizedBox(height: 24),

                  // Job Info
                  _buildJobInfo(),
                  const SizedBox(height: 24),

                  // Budget Option Selection
                  _buildBudgetOptionSelection(),
                  const SizedBox(height: 20),

                  // Proposed Budget Input (only if NEGOTIATE)
                  if (_budgetOption == 'NEGOTIATE') ...[
                    _buildBudgetInput(),
                    const SizedBox(height: 20),
                  ],

                  // Estimated Duration Input
                  _buildDurationInput(),
                  const SizedBox(height: 20),

                  // Cover Message Input
                  _buildMessageInput(),
                  const SizedBox(height: 24),

                  // Submit Button
                  _buildSubmitButton(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Apply for Job',
                style: GoogleFonts.inter(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Submit your application',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.close),
          color: AppColors.textSecondary,
        ),
      ],
    );
  }

  Widget _buildJobInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.jobTitle,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(
                Icons.attach_money,
                size: 18,
                color: AppColors.primary,
              ),
              const SizedBox(width: 4),
              Text(
                'Budget: ${CurrencyFormatter.format(widget.originalBudget)}',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBudgetOptionSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Budget Option',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildBudgetOptionCard(
                label: 'Accept Original',
                subtitle: '₱${widget.originalBudget.toStringAsFixed(2)}',
                value: 'ACCEPT',
                icon: Icons.check_circle_outline,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildBudgetOptionCard(
                label: 'Negotiate',
                subtitle: 'Propose different',
                value: 'NEGOTIATE',
                icon: Icons.edit_outlined,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildBudgetOptionCard({
    required String label,
    required String subtitle,
    required String value,
    required IconData icon,
  }) {
    final isSelected = _budgetOption == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _budgetOption = value;
          if (value == 'ACCEPT') {
            _budgetController.text = widget.originalBudget.toStringAsFixed(2);
          }
        });
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withOpacity(0.1)
              : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.divider,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
              size: 28,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isSelected ? AppColors.primary : AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: GoogleFonts.inter(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDurationInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Estimated Duration',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _durationController,
          decoration: InputDecoration(
            hintText: 'e.g., 2 days, 1 week, 3-5 days',
            hintStyle: GoogleFonts.inter(color: AppColors.textHint),
            filled: true,
            fillColor: AppColors.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.divider),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.error),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
          ),
          style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return 'Please enter estimated duration';
            }
            return null;
          },
        ),
        const SizedBox(height: 8),
        Text(
          'How long will it take you to complete this job?',
          style: GoogleFonts.inter(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildBudgetInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Proposed Budget',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _budgetController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
          ],
          decoration: InputDecoration(
            prefixText: '₱ ',
            hintText: 'Enter your proposed budget',
            hintStyle: GoogleFonts.inter(color: AppColors.textHint),
            filled: true,
            fillColor: AppColors.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.divider),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.error),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),
          ),
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return 'Please enter a budget';
            }
            final budget = double.tryParse(value.trim());
            if (budget == null) {
              return 'Please enter a valid number';
            }
            if (budget <= 0) {
              return 'Budget must be greater than 0';
            }
            return null;
          },
        ),
        const SizedBox(height: 8),
        Text(
          'You can accept the original budget or propose a different amount.',
          style: GoogleFonts.inter(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildMessageInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Cover Message',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _messageController,
          maxLines: 5,
          maxLength: 500,
          decoration: InputDecoration(
            hintText:
                'Tell the client why you\'re the best fit for this job...',
            hintStyle: GoogleFonts.inter(color: AppColors.textHint),
            filled: true,
            fillColor: AppColors.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.divider),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.error),
            ),
            contentPadding: const EdgeInsets.all(16),
          ),
          style: GoogleFonts.inter(
            fontSize: 14,
            color: AppColors.textPrimary,
            height: 1.5,
          ),
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return 'Please write a cover message';
            }
            if (value.trim().length < 20) {
              return 'Cover message must be at least 20 characters';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isSubmitting ? null : _submitApplication,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
          disabledBackgroundColor: AppColors.primary.withOpacity(0.5),
        ),
        child: _isSubmitting
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Text(
                'Submit Application',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
      ),
    );
  }
}
