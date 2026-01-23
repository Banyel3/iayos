# [Mobile] Phase 1: Job Application Flow

**Labels:** `priority:critical`, `type:feature`, `area:mobile`, `area:jobs`
**Priority:** CRITICAL
**Estimated Time:** 80-100 hours

## Summary
Implement the complete job application flow in Flutter mobile app with feature parity to Next.js web app.

## Tasks

### Job Listing & Search
- [ ] Create JobListScreen with search and filters
- [ ] Implement job category filtering
- [ ] Add urgency level filtering (LOW/MEDIUM/HIGH)
- [ ] Implement budget range filtering
- [ ] Add location-based job search (GPS radius)
- [ ] Create job card component with essential details

### Job Details
- [ ] Create JobDetailScreen showing full job information
- [ ] Display job photos in gallery view
- [ ] Show client profile information
- [ ] Display specializations required
- [ ] Show materials needed list
- [ ] Add expected duration display

### Application Submission
- [ ] Create JobApplicationScreen
- [ ] Implement proposed budget input with validation
- [ ] Add cover letter/message input
- [ ] Show worker's matching skills
- [ ] Display application preview before submission
- [ ] Handle application submission via API
- [ ] Show success/error notifications

### Application Management
- [ ] Create MyApplicationsScreen
- [ ] Display application status (PENDING/ACCEPTED/REJECTED)
- [ ] Implement application filtering by status
- [ ] Show application history with timestamps
- [ ] Add ability to withdraw pending applications

## Files to Create
- `lib/screens/jobs/job_list_screen.dart` - Job listing page
- `lib/screens/jobs/job_detail_screen.dart` - Job details page
- `lib/screens/jobs/job_application_screen.dart` - Application form
- `lib/screens/jobs/my_applications_screen.dart` - Application management
- `lib/components/job_card.dart` - Job list item component
- `lib/components/job_filter_sheet.dart` - Filter bottom sheet
- `lib/services/job_service.dart` - Job API service
- `lib/models/job.dart` - Job model
- `lib/models/job_application.dart` - Application model
- `lib/providers/job_provider.dart` - Job state management

## API Endpoints to Integrate
- `GET /api/jobs/listing` - Fetch job listings
- `GET /api/jobs/{id}` - Get job details
- `POST /api/jobs/{id}/apply` - Submit application
- `GET /api/jobs/{id}/applications` - View applications
- `PUT /api/jobs/{id}/application/{app_id}` - Withdraw application

## Acceptance Criteria
- [ ] Workers can browse all available jobs
- [ ] Jobs can be filtered by category, urgency, budget, location
- [ ] Job details display all information from backend
- [ ] Workers can submit applications with proposed budget
- [ ] Application status updates reflect in real-time
- [ ] Application history is accessible
- [ ] All forms have proper validation
- [ ] Error handling for network failures

## Dependencies
None - Foundational feature

## Testing
- [ ] Test job listing with 100+ jobs
- [ ] Test filtering with various combinations
- [ ] Test application submission with valid/invalid data
- [ ] Test GPS-based job search
- [ ] Verify image loading performance
- [ ] Test offline behavior

---
Generated with Claude Code
