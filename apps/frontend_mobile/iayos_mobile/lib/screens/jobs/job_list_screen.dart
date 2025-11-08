import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/user.dart';
import '../../utils/constants.dart';
import '../../services/job_service.dart';
import 'job_details_screen.dart';
import 'post_job_screen.dart';
import 'search_jobs_screen.dart';

class JobListScreen extends StatefulWidget {
  final User user;

  const JobListScreen({super.key, required this.user});

  @override
  State<JobListScreen> createState() => _JobListScreenState();
}

class _JobListScreenState extends State<JobListScreen> {
  final _jobService = JobService();
  List<dynamic> _jobs = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;

  // Filters
  int? _selectedCategoryId;
  List<dynamic> _categories = [];
  bool _isLoadingCategories = true;

  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadJobs();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoadingMore && _hasMore) {
        _loadMoreJobs();
      }
    }
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

  Future<void> _loadJobs({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _hasMore = true;
        _isLoading = true;
      });
    }

    final result = await _jobService.getJobs(
      categoryId: _selectedCategoryId,
      page: _currentPage,
      limit: 20,
    );

    if (result['success'] && mounted) {
      final jobs = result['data']['jobs'] ?? [];
      setState(() {
        if (refresh) {
          _jobs = jobs;
        } else {
          _jobs.addAll(jobs);
        }
        _isLoading = false;
        _isLoadingMore = false;
        _errorMessage = null;
        _hasMore = jobs.length >= 20;
      });
    } else if (mounted) {
      setState(() {
        _isLoading = false;
        _isLoadingMore = false;
        _errorMessage = result['error'];
      });
    }
  }

  Future<void> _loadMoreJobs() async {
    if (_isLoadingMore || !_hasMore) return;

    setState(() {
      _isLoadingMore = true;
      _currentPage++;
    });

    await _loadJobs();
  }

  Future<void> _refreshJobs() async {
    await _loadJobs(refresh: true);
  }

  void _onCategorySelected(int? categoryId) {
    setState(() {
      _selectedCategoryId = categoryId;
    });
    _loadJobs(refresh: true);
  }

  void _navigateToJobDetails(Map<String, dynamic> job) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => JobDetailsScreen(
          jobId: job['job_id'],
          user: widget.user,
        ),
      ),
    );
  }

  void _navigateToPostJob() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PostJobScreen(user: widget.user),
      ),
    ).then((result) {
      if (result == true) {
        _refreshJobs();
      }
    });
  }

  void _navigateToSearch() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SearchJobsScreen(user: widget.user),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          widget.user.isClient ? 'Available Workers' : 'Browse Jobs',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.black87),
            onPressed: _navigateToSearch,
          ),
          if (widget.user.isClient)
            IconButton(
              icon: const Icon(Icons.add, color: Colors.black87),
              onPressed: _navigateToPostJob,
            ),
        ],
      ),
      body: Column(
        children: [
          // Category Filter
          _buildCategoryFilter(),

          // Job List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage != null
                    ? _buildErrorState()
                    : _jobs.isEmpty
                        ? _buildEmptyState()
                        : _buildJobList(),
          ),
        ],
      ),
      floatingActionButton: widget.user.isClient
          ? FloatingActionButton.extended(
              onPressed: _navigateToPostJob,
              backgroundColor: AppColors.primary,
              icon: const Icon(Icons.add),
              label: Text(
                'Post Job',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold),
              ),
            )
          : null,
    );
  }

  Widget _buildCategoryFilter() {
    if (_isLoadingCategories) {
      return const SizedBox(
        height: 60,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _buildCategoryChip('All', null),
          const SizedBox(width: 8),
          ..._categories.map((category) {
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _buildCategoryChip(
                category['name'],
                category['id'],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String label, int? categoryId) {
    final isSelected = _selectedCategoryId == categoryId;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) => _onCategorySelected(selected ? categoryId : null),
      backgroundColor: Colors.grey.shade100,
      selectedColor: AppColors.primary.withOpacity(0.2),
      checkmarkColor: AppColors.primary,
      labelStyle: GoogleFonts.inter(
        color: isSelected ? AppColors.primary : Colors.black87,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
    );
  }

  Widget _buildJobList() {
    return RefreshIndicator(
      onRefresh: _refreshJobs,
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: _jobs.length + (_isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _jobs.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: CircularProgressIndicator(),
              ),
            );
          }
          return _buildJobCard(_jobs[index]);
        },
      ),
    );
  }

  Widget _buildJobCard(Map<String, dynamic> job) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => _navigateToJobDetails(job),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title and Budget
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      job['title'] ?? 'Untitled',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '₱${job['budget']?.toStringAsFixed(0) ?? '0'}',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Description
              Text(
                job['description'] ?? '',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: Colors.black54,
                ),
              ),
              const SizedBox(height: 12),

              // Location and Category
              Row(
                children: [
                  Icon(Icons.location_on, size: 16, color: Colors.grey.shade600),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      job['location'] ?? 'Location not specified',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      job['category_name'] ?? 'General',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Urgency and Posted By
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildUrgencyBadge(job['urgency_level']),
                  Text(
                    'by ${job['client_name'] ?? 'Unknown'}',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUrgencyBadge(String? urgency) {
    Color color;
    String label;

    switch (urgency?.toUpperCase()) {
      case 'HIGH':
        color = Colors.red;
        label = 'Urgent';
        break;
      case 'MEDIUM':
        color = Colors.orange;
        label = 'Medium';
        break;
      default:
        color = Colors.green;
        label = 'Low';
    }

    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: color,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.work_outline,
            size: 80,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            'No jobs available',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            widget.user.isClient
                ? 'Post a job to get started'
                : 'Check back later for new opportunities',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: Colors.black54,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 80,
            color: Colors.red.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            'Error loading jobs',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              _errorMessage ?? 'Something went wrong',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: Colors.black54,
              ),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _refreshJobs,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              'Retry',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
