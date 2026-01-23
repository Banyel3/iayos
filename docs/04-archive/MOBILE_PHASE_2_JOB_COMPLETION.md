# [Mobile] Phase 2: Two-Phase Job Completion Workflow

**Labels:** `priority:critical`, `type:feature`, `area:mobile`, `area:jobs`
**Priority:** CRITICAL
**Estimated Time:** 60-80 hours

## Summary
Implement the two-phase job completion system where both worker and client must confirm job completion.

## Tasks

### Active Jobs Management
- [ ] Create ActiveJobsScreen showing in-progress jobs
- [ ] Display job progress indicators
- [ ] Show assigned client information
- [ ] Add job timeline view
- [ ] Implement job status tracking (IN_PROGRESS)

### Worker Completion Flow
- [ ] Create JobCompletionScreen for workers
- [ ] Add job completion photo upload (before/after)
- [ ] Implement completion notes/description input
- [ ] Create "Mark as Complete" functionality
- [ ] Show completion confirmation dialog
- [ ] Display pending client approval status
- [ ] Handle API call to `/api/jobs/{id}/mark-complete`

### Client Approval Flow
- [ ] Create JobReviewScreen for clients
- [ ] Display worker's completion photos
- [ ] Show worker's completion notes
- [ ] Add "Approve Completion" button
- [ ] Add "Request Revision" functionality (optional)
- [ ] Handle API call to `/api/jobs/{id}/accept-completion`

### Completion Status Tracking
- [ ] Show "Worker Completed" status badge
- [ ] Show "Client Approved" status badge
- [ ] Display completion timestamps
- [ ] Implement status notifications
- [ ] Add completion history log

### Job Photos
- [ ] Implement multi-photo upload (up to 10 images)
- [ ] Add image compression before upload
- [ ] Create photo gallery viewer
- [ ] Handle photo deletion
- [ ] Show upload progress
- [ ] Integrate with `/api/jobs/{id}/upload-photos`

## Files to Create
- `lib/screens/jobs/active_jobs_screen.dart` - Active jobs list
- `lib/screens/jobs/job_completion_screen.dart` - Completion form (worker)
- `lib/screens/jobs/job_review_screen.dart` - Review screen (client)
- `lib/components/job_photo_uploader.dart` - Photo upload component
- `lib/components/job_status_badge.dart` - Status indicator
- `lib/services/job_completion_service.dart` - Completion API service
- `lib/models/job_completion.dart` - Completion model
- `lib/providers/active_jobs_provider.dart` - Active jobs state

## API Endpoints to Integrate
- `POST /api/jobs/{id}/mark-complete` - Worker marks complete
- `POST /api/jobs/{id}/accept-completion` - Client approves
- `POST /api/jobs/{id}/upload-photos` - Upload job photos
- `DELETE /api/jobs/{id}/photos/{photo_id}` - Delete photo
- `GET /api/jobs/{id}` - Get job status

## Acceptance Criteria
- [ ] Workers can mark jobs as complete with photos and notes
- [ ] Clients receive notification when worker marks complete
- [ ] Clients can review and approve completion
- [ ] Both parties can see completion status clearly
- [ ] Photos are uploaded and displayed correctly
- [ ] Job status updates in real-time
- [ ] Completion triggers payment release (integration point for Phase 4)

## Dependencies
- **Requires:** Mobile Phase 1 - Job application flow

## Testing
- [ ] Test worker completion flow end-to-end
- [ ] Test client approval flow
- [ ] Test photo upload with 10 images
- [ ] Test image compression quality
- [ ] Verify status updates across both user types
- [ ] Test offline photo queue

---
Generated with Claude Code
