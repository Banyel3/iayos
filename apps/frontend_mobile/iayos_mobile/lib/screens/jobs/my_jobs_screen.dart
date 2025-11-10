import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/user.dart';
import '../../services/my_jobs_service.dart';
import '../../utils/constants.dart';

class MyJobsScreen extends StatefulWidget {
  final User user;

  const MyJobsScreen({super.key, required this.user});

  @override
  State<MyJobsScreen> createState() => _MyJobsScreenState();
}

class _MyJobsScreenState extends State<MyJobsScreen>
    with SingleTickerProviderStateMixin {
  final _myJobsService = MyJobsService();
  late TabController _tabController;

  final List<String> _tabs = [
    'All',
    'Active',
    'In Progress',
    'Completed',
    'Pending',
  ];
  final Map<String, List<dynamic>> _jobsByStatus = {
    'All': [],
    'Active': [],
    'In Progress': [],
    'Completed': [],
    'Pending': [],
  };
  final Map<String, bool> _isLoadingByTab = {};
  final Map<String, bool> _isLoadingMoreByTab = {};
  final Map<String, int> _currentPageByTab = {};
  final Map<String, bool> _hasMoreDataByTab = {};

  final Map<String, ScrollController> _scrollControllers = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);

    // Initialize states for each tab
    for (var tab in _tabs) {
      _isLoadingByTab[tab] = false;
      _isLoadingMoreByTab[tab] = false;
      _currentPageByTab[tab] = 1;
      _hasMoreDataByTab[tab] = true;
      _scrollControllers[tab] = ScrollController();
      _scrollControllers[tab]!.addListener(() => _onScroll(tab));
    }

    // Load initial data for "All" tab
    _loadJobs('All');
  }

  @override
  void dispose() {
    _tabController.dispose();
    for (var controller in _scrollControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _onScroll(String tab) {
    final controller = _scrollControllers[tab];
    if (controller != null &&
        controller.position.pixels >=
            controller.position.maxScrollExtent * 0.8 &&
        !(_isLoadingMoreByTab[tab] ?? false) &&
        (_hasMoreDataByTab[tab] ?? false)) {
      _loadMoreJobs(tab);
    }
  }

  String? _getStatusFilter(String tab) {
    switch (tab) {
      case 'Active':
        return 'ACTIVE';
      case 'In Progress':
        return 'IN_PROGRESS';
      case 'Completed':
        return 'COMPLETED';
      case 'Pending':
        return 'PENDING';
      default:
        return null; // All
    }
  }

  Future<void> _loadJobs(String tab) async {
    setState(() {
      _isLoadingByTab[tab] = true;
      _currentPageByTab[tab] = 1;
    });

    final statusFilter = _getStatusFilter(tab);
    final result = await _myJobsService.getMyJobs(
      status: statusFilter,
      page: 1,
      limit: 20,
    );

    if (mounted) {
      if (result['success']) {
        final data = result['data'];
        setState(() {
          _jobsByStatus[tab] = List<dynamic>.from(data['jobs'] ?? []);
          _hasMoreDataByTab[tab] =
              (_jobsByStatus[tab]?.length ?? 0) < (data['total'] ?? 0);
          _isLoadingByTab[tab] = false;
        });
      } else {
        setState(() {
          _jobsByStatus[tab] = [];
          _isLoadingByTab[tab] = false;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                result['error'] ?? 'Failed to load jobs',
                style: GoogleFonts.inter(),
              ),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }
  }

  Future<void> _loadMoreJobs(String tab) async {
    if (_isLoadingMoreByTab[tab] ?? false) return;

    setState(() {
      _isLoadingMoreByTab[tab] = true;
    });

    final nextPage = (_currentPageByTab[tab] ?? 1) + 1;
    final statusFilter = _getStatusFilter(tab);
    final result = await _myJobsService.getMyJobs(
      status: statusFilter,
      page: nextPage,
      limit: 20,
    );

    if (mounted) {
      if (result['success']) {
        final data = result['data'];
        final newJobs = List<dynamic>.from(data['jobs'] ?? []);

        setState(() {
          _jobsByStatus[tab]!.addAll(newJobs);
          _currentPageByTab[tab] = nextPage;
          _hasMoreDataByTab[tab] =
              (_jobsByStatus[tab]?.length ?? 0) < (data['total'] ?? 0);
          _isLoadingMoreByTab[tab] = false;
        });
      } else {
        setState(() {
          _isLoadingMoreByTab[tab] = false;
        });
      }
    }
  }

  Future<void> _refreshJobs(String tab) async {
    await _loadJobs(tab);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _buildHeader(),

            // Tabs
            _buildTabBar(),

            // Tab Content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: _tabs.map((tab) => _buildTabContent(tab)).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, AppColors.primary.withOpacity(0.8)],
        ),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.arrow_back, color: Colors.white),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'My Jobs',
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  widget.user.isClient
                      ? 'Jobs you posted'
                      : 'Jobs you applied to',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        labelColor: AppColors.primary,
        unselectedLabelColor: AppColors.textSecondary,
        indicatorColor: AppColors.primary,
        indicatorWeight: 3,
        labelStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
        unselectedLabelStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        onTap: (index) {
          final tab = _tabs[index];
          if (_jobsByStatus[tab]?.isEmpty ?? true) {
            _loadJobs(tab);
          }
        },
        tabs: _tabs.map((tab) {
          final count = _jobsByStatus[tab]?.length ?? 0;
          return Tab(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(tab),
                if (count > 0) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      count.toString(),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTabContent(String tab) {
    final isLoading = _isLoadingByTab[tab] ?? false;
    final jobs = _jobsByStatus[tab] ?? [];

    if (isLoading && jobs.isEmpty) {
      return _buildLoadingState();
    }

    if (jobs.isEmpty) {
      return _buildEmptyState(tab);
    }

    return RefreshIndicator(
      onRefresh: () => _refreshJobs(tab),
      color: AppColors.primary,
      child: ListView.builder(
        controller: _scrollControllers[tab],
        padding: const EdgeInsets.all(20),
        itemCount: jobs.length + ((_isLoadingMoreByTab[tab] ?? false) ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == jobs.length) {
            return _buildLoadingMoreIndicator();
          }

          return _buildJobCard(jobs[index]);
        },
      ),
    );
  }

  Widget _buildJobCard(dynamic job) {
    final jobId = job['id'] ?? 0;
    final title = job['title'] ?? 'Untitled Job';
    final description = job['description'] ?? '';
    final budget = job['budget']?.toDouble() ?? 0.0;
    final status = job['status'] ?? 'ACTIVE';
    final location = job['location'] ?? 'Location not specified';
    final createdAt = job['createdAt'];

    // Client or Worker specific info
    String? otherPartyName;
    String? otherPartyImg;
    String? otherPartyRole;

    if (widget.user.isClient) {
      // For clients, show worker info (if assigned)
      if (job['worker_name'] != null && job['worker_name'].isNotEmpty) {
        otherPartyName = job['worker_name'];
        otherPartyImg = job['worker_img'];
        otherPartyRole = 'Worker';
      }
    } else {
      // For workers, show client info
      if (job['client_name'] != null && job['client_name'].isNotEmpty) {
        otherPartyName = job['client_name'];
        otherPartyImg = job['client_img'];
        otherPartyRole = 'Client';
      }
    }

    return GestureDetector(
      onTap: () {
        // TODO: Navigate to job details
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Job details: $title', style: GoogleFonts.inter()),
            backgroundColor: AppColors.primary,
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title and Status
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                _buildStatusBadge(status),
              ],
            ),
            const SizedBox(height: 8),

            // Description
            if (description.isNotEmpty)
              Text(
                description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
            const SizedBox(height: 12),

            // Budget
            Row(
              children: [
                Icon(Icons.attach_money, size: 18, color: AppColors.primary),
                const SizedBox(width: 4),
                Text(
                  CurrencyFormatter.format(budget),
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Location
            Row(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  size: 16,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    location,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ],
            ),

            // Other Party Info
            if (otherPartyName != null && otherPartyName.isNotEmpty) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  // Profile Image
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: otherPartyImg != null && otherPartyImg.isNotEmpty
                        ? ClipOval(
                            child: Image.network(
                              otherPartyImg,
                              fit: BoxFit.cover,
                              loadingBuilder:
                                  (context, child, loadingProgress) {
                                    if (loadingProgress == null) return child;
                                    return Center(
                                      child: SizedBox(
                                        width: 12,
                                        height: 12,
                                        child: CircularProgressIndicator(
                                          value:
                                              loadingProgress
                                                      .expectedTotalBytes !=
                                                  null
                                              ? loadingProgress
                                                        .cumulativeBytesLoaded /
                                                    loadingProgress
                                                        .expectedTotalBytes!
                                              : null,
                                          strokeWidth: 1.5,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    );
                                  },
                              errorBuilder: (context, error, stackTrace) {
                                return Center(
                                  child: Text(
                                    (otherPartyName != null &&
                                            otherPartyName.isNotEmpty)
                                        ? otherPartyName[0].toUpperCase()
                                        : '?',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                );
                              },
                            ),
                          )
                        : Center(
                            child: Text(
                              (otherPartyName.isNotEmpty)
                                  ? otherPartyName[0].toUpperCase()
                                  : '?',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                  ),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        otherPartyRole ?? '',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      Text(
                        otherPartyName,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],

            // Created Date
            if (createdAt != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.calendar_today_outlined,
                    size: 16,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Posted: ${_formatDate(createdAt)}',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color backgroundColor;
    Color textColor;
    String displayText;

    switch (status.toUpperCase()) {
      case 'ACTIVE':
        backgroundColor = AppColors.success.withOpacity(0.1);
        textColor = AppColors.success;
        displayText = 'Active';
        break;
      case 'IN_PROGRESS':
        backgroundColor = AppColors.primary.withOpacity(0.1);
        textColor = AppColors.primary;
        displayText = 'In Progress';
        break;
      case 'COMPLETED':
        backgroundColor = Colors.grey.withOpacity(0.2);
        textColor = Colors.grey.shade700;
        displayText = 'Completed';
        break;
      case 'PENDING':
        backgroundColor = AppColors.warning.withOpacity(0.1);
        textColor = AppColors.warning;
        displayText = 'Pending';
        break;
      case 'CANCELLED':
        backgroundColor = AppColors.error.withOpacity(0.1);
        textColor = AppColors.error;
        displayText = 'Cancelled';
        break;
      default:
        backgroundColor = AppColors.textHint.withOpacity(0.1);
        textColor = AppColors.textHint;
        displayText = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        displayText,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays == 0) {
        return 'Today';
      } else if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} days ago';
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return dateString;
    }
  }

  Widget _buildLoadingState() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: 5,
      itemBuilder: (context, index) => _buildShimmerCard(),
    );
  }

  Widget _buildShimmerCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 18,
            width: 200,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            height: 14,
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 14,
            width: 150,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String tab) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.work_outline_rounded,
              size: 80,
              color: AppColors.textHint,
            ),
            const SizedBox(height: 20),
            Text(
              'No Jobs Found',
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              tab == 'All'
                  ? 'You don\'t have any jobs yet.'
                  : 'No $tab jobs at the moment.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingMoreIndicator() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: CircularProgressIndicator(color: AppColors.primary),
      ),
    );
  }
}
