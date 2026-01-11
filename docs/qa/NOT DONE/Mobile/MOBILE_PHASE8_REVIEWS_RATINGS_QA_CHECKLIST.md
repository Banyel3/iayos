# Mobile Phase 8 - QA Testing Checklist

**Feature**: Reviews & Ratings System
**Date**: November 15, 2025
**Status**: Ready for QA Testing

## Test Environment Setup

- [ ] Backend API running on http://192.168.1.117:8000
- [ ] Mobile app running via Expo Go
- [ ] Test accounts created (2 workers, 2 clients)
- [ ] Test jobs created with COMPLETED status
- [ ] Backend `JobReview` model verified in database
- [ ] Review API endpoints accessible
- [ ] Supabase storage configured (for future photo attachments)

## Pre-Testing Setup

### Account 1 (Worker):

- [ ] Email: worker1@test.com
- [ ] Profile type: WORKER
- [ ] Has completed 2+ jobs
- [ ] Can receive reviews from clients
- [ ] Can give reviews to clients

### Account 2 (Client):

- [ ] Email: client1@test.com
- [ ] Profile type: CLIENT
- [ ] Has posted jobs that are COMPLETED
- [ ] Can receive reviews from workers
- [ ] Can give reviews to workers

### Account 3 (Worker 2):

- [ ] Email: worker2@test.com
- [ ] Profile type: WORKER
- [ ] Has completed jobs with different ratings (1-5 stars)
- [ ] For testing rating breakdown and statistics

### Account 4 (Client 2):

- [ ] Email: client2@test.com
- [ ] Profile type: CLIENT
- [ ] For testing multiple reviews and sorting

### Test Data Setup:

- [ ] Create 5+ completed jobs with different workers
- [ ] Ensure jobs have both CLIENT and WORKER participants
- [ ] Mix of jobs with/without existing reviews
- [ ] At least 1 job completed in last 24 hours (for edit testing)
- [ ] At least 1 job completed > 24 hours ago (for edit window testing)
- [ ] Create worker with 10+ reviews across different ratings (1-5 stars)

---

## 1. Star Rating Component (Interactive)

**File**: `components/Reviews/StarRating.tsx` (89 lines)

### Component Display

- [ ] Star rating component renders correctly
- [ ] Shows 5 stars in horizontal row
- [ ] Stars are evenly spaced
- [ ] Star icons render (star-outline vs star)
- [ ] Default state shows all empty stars (gray)
- [ ] Component scales to specified size prop
- [ ] Centered alignment works

### Interactive Mode

- [ ] Tapping star 1 highlights only star 1 (1/5 rating)
- [ ] Tapping star 2 highlights stars 1-2 (2/5 rating)
- [ ] Tapping star 3 highlights stars 1-3 (3/5 rating)
- [ ] Tapping star 4 highlights stars 1-4 (4/5 rating)
- [ ] Tapping star 5 highlights all 5 stars (5/5 rating)
- [ ] Tapping same star twice deselects it (rating 0)
- [ ] Tapping lower star reduces rating
- [ ] Selected stars turn gold/yellow color
- [ ] Unselected stars remain gray
- [ ] Visual feedback immediate (no delay)
- [ ] Haptic feedback on star tap (iOS/Android)
- [ ] Can change rating multiple times before submit

### Display Mode (Read-Only)

- [ ] Read-only mode shows rating without interaction
- [ ] Tapping stars does nothing in read-only mode
- [ ] Displays integer ratings (1, 2, 3, 4, 5) correctly
- [ ] Displays fractional ratings (4.5, 3.7) with half-stars
- [ ] Half-star icon renders correctly (star-half)
- [ ] Fractional ratings round appropriately (4.3 = 4 full + 1 half)
- [ ] 4.7 rating shows 5 full stars (rounds up)
- [ ] 4.2 rating shows 4 full stars (rounds down)
- [ ] Zero rating shows 5 empty stars

### Size Variations

- [ ] Small size (24px) renders legibly
- [ ] Medium size (32px) - default size
- [ ] Large size (48px) for prominent display
- [ ] Custom size prop works (e.g., 40px)

### Edge Cases

- [ ] Rating of 0.0 displays as empty
- [ ] Rating of 5.0 displays as 5 full stars
- [ ] Negative rating displays as empty (handles gracefully)
- [ ] Rating > 5.0 displays as 5 stars (capped)
- [ ] Null/undefined rating displays as empty

---

## 2. Review Submission Screen

**File**: `app/reviews/submit/[jobId].tsx` (330 lines)

### Screen Access & Navigation

- [ ] Navigate from review prompt modal
- [ ] Navigate from job completion screen
- [ ] Navigate from "pending reviews" list
- [ ] URL format: `/reviews/submit/[jobId]`
- [ ] Job ID extracted from route params
- [ ] Back button returns to previous screen
- [ ] Header shows "Write Review"

### Job Context Display

- [ ] Job info card displays at top
- [ ] Shows job title
- [ ] Shows job budget (₱X,XXX)
- [ ] Shows reviewee name (worker or client)
- [ ] Shows reviewee profile image (or placeholder)
- [ ] Shows user's role ("You're reviewing as CLIENT/WORKER")
- [ ] Card uses distinct background color

### Star Rating Section

- [ ] "Rating" label displayed
- [ ] Interactive star rating component shown
- [ ] Starts with no rating selected (0 stars)
- [ ] Tapping stars updates selection
- [ ] Selected rating visually clear
- [ ] Required field indicator (red asterisk)

### Review Comment Section

- [ ] "Your Review" label displayed
- [ ] Multiline text input field
- [ ] Placeholder: "Share your experience working with [Name]..."
- [ ] Input field expands as text grows
- [ ] Character counter displayed below input
- [ ] Counter format: "X / 500 characters"
- [ ] Counter updates in real-time as user types
- [ ] Counter turns red when approaching/exceeding limit (450+)
- [ ] Cannot type beyond 500 characters (hard limit)
- [ ] Minimum 10 characters required

### Review Guidelines Section

- [ ] "Review Guidelines" section displayed
- [ ] Guidelines in gray text box
- [ ] Guidelines include:
  - "Be specific about your experience"
  - "Be constructive and professional"
  - "Focus on facts, not emotions"
  - "Respect privacy - no personal info"
- [ ] Guidelines collapsible (optional)

### Validation

- [ ] Submit button disabled when rating empty
- [ ] Submit button disabled when comment < 10 chars
- [ ] Submit button enabled when rating selected AND comment >= 10 chars
- [ ] Tapping submit with empty rating shows error
- [ ] Error message: "Please select a rating"
- [ ] Tapping submit with short comment shows error
- [ ] Error message: "Comment must be at least 10 characters"
- [ ] Validation errors display in red
- [ ] Validation clears when requirements met

### Submit Review

- [ ] Submit button displays "Submit Review"
- [ ] Tapping submit triggers API call
- [ ] Loading spinner shows during submission
- [ ] Submit button disabled during loading
- [ ] Success shows toast: "Review submitted successfully!"
- [ ] Navigates back to previous screen on success
- [ ] Review appears in "My Reviews" immediately
- [ ] Review visible on worker's profile
- [ ] Backend creates JobReview record
- [ ] Worker's average rating updates

### Error Handling

- [ ] Network error shows error message
- [ ] Error message: "Failed to submit review. Please try again."
- [ ] Duplicate review error caught
- [ ] Error message: "You've already reviewed this job"
- [ ] Job not found error handled
- [ ] Cannot review self error handled
- [ ] Error message: "You cannot review yourself"
- [ ] Form state preserved after error (don't clear input)

### Loading States

- [ ] Loading spinner on initial job fetch
- [ ] Skeleton loader for job card (optional)
- [ ] Submit button loading indicator
- [ ] Disabled state during loading

### Edge Cases

- [ ] Job doesn't exist (404 error)
- [ ] Job not completed yet (validation error)
- [ ] User not part of job (403 error)
- [ ] Already reviewed this job (duplicate error)
- [ ] Reviewing yourself (validation error)
- [ ] Very long comment (500+ chars blocked)
- [ ] Special characters in comment (emoji, symbols)
- [ ] Empty spaces don't count toward minimum (trimmed)

---

## 3. Review Card Component

**File**: `components/Reviews/ReviewCard.tsx` (187 lines)

### Card Display

- [ ] Review card renders with correct styling
- [ ] Card has subtle border/shadow
- [ ] Card background white (or theme color)
- [ ] Padding/spacing consistent
- [ ] Cards separated when in list

### Reviewer Info Section

- [ ] Reviewer's profile image displays
- [ ] Profile image circular (50-60px)
- [ ] Placeholder avatar if no image
- [ ] Reviewer's name displays
- [ ] Name uses medium/bold font weight
- [ ] Reviewer type badge displays (CLIENT/WORKER)
- [ ] Badge color: blue for CLIENT, green for WORKER
- [ ] Badge text small and uppercase

### Rating Display

- [ ] Star rating displays at top right
- [ ] Shows filled stars based on rating
- [ ] Numeric rating shows (e.g., "4.5")
- [ ] Stars and number aligned horizontally
- [ ] Star size appropriate (24-28px)

### Review Comment

- [ ] Comment text displays below reviewer info
- [ ] Text readable (14-16px font size)
- [ ] Text wraps properly for long comments
- [ ] Multiline comments display correctly
- [ ] Line height comfortable for reading (1.5)
- [ ] Text color dark gray/black

### Timestamp

- [ ] Review timestamp displays
- [ ] Format: "2 hours ago", "3 days ago", "Nov 15, 2024"
- [ ] Timestamp uses relative format (< 7 days)
- [ ] Timestamp uses absolute format (>= 7 days)
- [ ] Timestamp in light gray color
- [ ] Timestamp small font (12px)

### Flagged Review Indicator

- [ ] Flagged reviews show "Reported" badge
- [ ] Badge color: red or orange
- [ ] Badge text: "Reported"
- [ ] Badge positioned at top right or bottom
- [ ] Badge icon: flag or alert icon

### Worker Response (Future Feature)

- [ ] Worker response section (if applicable)
- [ ] Response displayed below review
- [ ] Response indented or visually distinct
- [ ] Response shows "Response from [Worker Name]"
- [ ] Response has lighter background

### Action Buttons (Context Menu)

- [ ] Edit button visible if review is user's AND within 24h
- [ ] Report button visible if review is NOT user's
- [ ] Delete button visible if review is user's (admin only)
- [ ] Three-dot menu icon in top right
- [ ] Tapping menu shows action sheet (iOS) or dialog (Android)

### Edit Review Action

- [ ] Tapping "Edit" button shows alert (currently)
- [ ] Alert message: "Edit functionality coming soon"
- [ ] Future: Should navigate to edit screen
- [ ] Edit only allowed within 24 hours
- [ ] Edit button hidden after 24 hours

### Report Review Action

- [ ] Tapping "Report" button shows report dialog
- [ ] Dialog title: "Report Review"
- [ ] Report reasons displayed:
  - "Spam or misleading"
  - "Offensive content"
  - "Inaccurate information"
  - "Other"
- [ ] Can select one reason
- [ ] Submit report button enabled after selection
- [ ] Cancel button dismisses dialog
- [ ] Submitting report triggers API call
- [ ] Success toast: "Review reported. We'll review it shortly."
- [ ] Review flagged in backend (isFlagged = true)

### Edge Cases

- [ ] Review with no comment (blank)
- [ ] Review with only rating (no text)
- [ ] Very long reviewer name (truncate)
- [ ] Reviewer with no profile image
- [ ] Review from deleted user (handle gracefully)
- [ ] Rating of 0 (show empty stars)

---

## 4. Rating Breakdown Component

**File**: `components/Reviews/RatingBreakdown.tsx` (134 lines)

### Component Display

- [ ] Breakdown chart renders correctly
- [ ] Shows 5 rows (one per rating: 5, 4, 3, 2, 1)
- [ ] Rows ordered from 5 stars at top to 1 star at bottom
- [ ] Each row shows star count, progress bar, percentage
- [ ] Spacing between rows consistent

### Star Count Labels

- [ ] Each row shows star number (5⭐, 4⭐, 3⭐, 2⭐, 1⭐)
- [ ] Star icon displays next to number
- [ ] Label aligned to left
- [ ] Label font medium weight

### Progress Bars

- [ ] Progress bar displays for each rating
- [ ] Bar width represents percentage of total reviews
- [ ] Bar fills from left to right
- [ ] Bar has rounded corners
- [ ] Bar height consistent (8-12px)
- [ ] Background color: light gray
- [ ] Fill color varies by rating:
  - 5 stars: Green
  - 4 stars: Light green
  - 3 stars: Yellow/amber
  - 2 stars: Orange
  - 1 star: Red
- [ ] Empty bar shows gray background only

### Percentage Display

- [ ] Percentage displays on right of each bar
- [ ] Format: "45%", "20%", "0%"
- [ ] Percentage calculated correctly
- [ ] Percentage sums to 100% (or close due to rounding)
- [ ] Percentage aligned to right
- [ ] Font size small (12-14px)

### Review Count Display

- [ ] Review count shows next to percentage (optional)
- [ ] Format: "(15 reviews)", "(3 reviews)"
- [ ] Count matches backend data
- [ ] Singular "review" vs plural "reviews"

### Calculation Accuracy

- [ ] Breakdown percentages match actual review distribution
- [ ] Example: 10 reviews, 5 at 5-star, 3 at 4-star, 2 at 3-star
  - 5-star: 50%
  - 4-star: 30%
  - 3-star: 20%
  - 2-star: 0%
  - 1-star: 0%
- [ ] Handles zero reviews gracefully (all 0%)
- [ ] Handles all reviews at same rating (100% one bar)

### Edge Cases

- [ ] Zero total reviews (all bars empty)
- [ ] Only 1 review (100% in one bar)
- [ ] All reviews 5-star (100% green bar)
- [ ] Even distribution (20% each)
- [ ] Fractional percentages (33.3%)

---

## 5. Review Prompt Modal

**File**: `components/Reviews/ReviewPromptModal.tsx` (220 lines)

### Modal Display

- [ ] Modal displays after job completion
- [ ] Modal overlay dims background
- [ ] Modal centered on screen
- [ ] Modal has white background
- [ ] Modal has rounded corners
- [ ] Modal has close button (X) in top right

### Modal Content

- [ ] Title: "How was your experience?"
- [ ] Subtitle: "Your feedback helps the community"
- [ ] Reviewee name displays
- [ ] Reviewee profile image displays (or placeholder)
- [ ] Job title displays
- [ ] Benefits message: "Leave a review to:"
  - "Build trust in the community"
  - "Help others make informed decisions"
  - "Improve service quality"
- [ ] Benefits in bullet list

### Action Buttons

- [ ] "Write Review" button displayed
- [ ] Button uses primary color (blue)
- [ ] Button text white
- [ ] Button full width
- [ ] "Maybe Later" button displayed
- [ ] Button uses secondary/text style
- [ ] Buttons stacked vertically
- [ ] Buttons separated by margin

### Write Review Action

- [ ] Tapping "Write Review" navigates to review submission screen
- [ ] Passes jobId, revieweeId, revieweeName, reviewerType as params
- [ ] Modal dismisses after navigation
- [ ] Navigation smooth (no jank)

### Maybe Later Action

- [ ] Tapping "Maybe Later" dismisses modal
- [ ] Modal closes smoothly (fade out)
- [ ] Does NOT navigate anywhere
- [ ] User returns to previous screen
- [ ] Prompt can be shown again later (not permanently dismissed)

### Close Button

- [ ] X button in top right corner
- [ ] Tapping X dismisses modal
- [ ] Same behavior as "Maybe Later"

### Modal Trigger

- [ ] Modal triggered programmatically (parent component)
- [ ] Visible prop controls display
- [ ] onDismiss callback fires when closed
- [ ] Can be integrated into job completion flow

### Dismissal Behavior

- [ ] Tapping outside modal dismisses it (optional)
- [ ] Swiping down dismisses modal (iOS)
- [ ] Back button dismisses modal (Android)
- [ ] Modal state resets on dismiss

### Edge Cases

- [ ] Modal with very long reviewee name
- [ ] Modal with missing reviewee image
- [ ] Modal shown multiple times (can re-display)
- [ ] Modal on small screens (iPhone SE)
- [ ] Modal on large screens (iPad)

---

## 6. My Reviews Screen

**File**: `app/reviews/my-reviews.tsx` (250 lines)

### Screen Access & Navigation

- [ ] Navigate from profile menu
- [ ] Navigate from notification (if review received)
- [ ] Screen accessible via URL: `/reviews/my-reviews`
- [ ] Header shows "My Reviews"
- [ ] Back button returns to previous screen

### Tab Navigation

- [ ] Two tabs displayed: "Given" and "Received"
- [ ] "Given" tab selected by default
- [ ] Active tab highlighted (blue underline or background)
- [ ] Inactive tab gray text
- [ ] Tapping tab switches content
- [ ] Smooth transition between tabs

### Given Tab (Reviews User Wrote)

- [ ] Shows all reviews user has given
- [ ] Reviews sorted by date (latest first)
- [ ] Each review shows ReviewCard component
- [ ] Shows reviewee name and profile image
- [ ] Shows rating user gave
- [ ] Shows comment user wrote
- [ ] Shows timestamp
- [ ] Shows edit button if within 24 hours
- [ ] Edit button hidden after 24 hours

### Received Tab (Reviews User Received)

- [ ] Shows all reviews user has received
- [ ] Reviews sorted by date (latest first)
- [ ] Each review shows ReviewCard component
- [ ] Shows reviewer name and profile image
- [ ] Shows rating received
- [ ] Shows comment received
- [ ] Shows timestamp
- [ ] Shows report button (can report reviews about you)

### Review Statistics (Given Tab)

- [ ] Statistics card at top (optional)
- [ ] Shows total reviews given
- [ ] Shows average rating given
- [ ] Statistics update in real-time

### Review Statistics (Received Tab)

- [ ] Statistics card at top
- [ ] Shows total reviews received
- [ ] Shows average rating received
- [ ] Shows rating breakdown chart
- [ ] Rating breakdown displays RatingBreakdown component
- [ ] Statistics accurate

### Loading States

- [ ] Loading spinner on initial load
- [ ] Skeleton loaders for review cards (optional)
- [ ] Loading message: "Loading reviews..."
- [ ] Loading during tab switch (if needed)

### Empty States

- [ ] Empty state for no given reviews
- [ ] Shows icon (pen/document)
- [ ] Message: "You haven't left any reviews yet"
- [ ] Subtext: "Complete jobs to leave reviews"
- [ ] Empty state for no received reviews
- [ ] Shows icon (star outline)
- [ ] Message: "No reviews yet"
- [ ] Subtext: "Complete jobs to receive reviews"

### Pull-to-Refresh

- [ ] Pull down gesture triggers refresh
- [ ] Refresh indicator shows
- [ ] Reviews reload from backend
- [ ] New reviews appear after refresh
- [ ] Statistics update after refresh

### Pagination

- [ ] Initially loads 20 reviews
- [ ] Scroll to bottom loads more (infinite scroll)
- [ ] "Load More" button (alternative to infinite scroll)
- [ ] Loading indicator at bottom while loading more
- [ ] All reviews load eventually

### Edit Review

- [ ] Tapping edit button on given review shows alert (current)
- [ ] Alert message: "Edit functionality coming soon"
- [ ] Future: Should allow editing review text and rating
- [ ] Edit only available within 24 hours
- [ ] Edited reviews show "Edited" badge

### Report Review

- [ ] Tapping report on received review shows report dialog
- [ ] Report reasons displayed
- [ ] Can submit report
- [ ] Reported reviews flagged in backend
- [ ] Success toast after report

### Edge Cases

- [ ] User with 100+ reviews (test pagination)
- [ ] User with 0 reviews (empty state)
- [ ] Reviews with very long comments
- [ ] Reviews from users with deleted accounts
- [ ] Switching tabs rapidly (race conditions)

---

## 7. Worker Reviews Screen

**File**: `app/reviews/worker/[workerId].tsx` (270 lines)

### Screen Access & Navigation

- [ ] Navigate from worker profile page
- [ ] Navigate from search results
- [ ] URL format: `/reviews/worker/[workerId]`
- [ ] Worker ID extracted from route params
- [ ] Header shows "[Worker Name]'s Reviews"
- [ ] Back button returns to previous screen

### Worker Summary Card

- [ ] Card displays at top of screen
- [ ] Shows worker's profile image (large, 80-100px)
- [ ] Shows worker's name
- [ ] Shows worker's average rating (large font, e.g., "4.8")
- [ ] Shows total review count (e.g., "Based on 42 reviews")
- [ ] Shows star rating visual
- [ ] Card has distinct background color or shadow

### Rating Breakdown Section

- [ ] Rating breakdown chart displays
- [ ] Shows distribution of 5/4/3/2/1 star reviews
- [ ] Uses RatingBreakdown component
- [ ] Breakdown accurately represents reviews

### Sort Controls

- [ ] Sort dropdown/buttons displayed
- [ ] Sort options:
  - "Latest" (default)
  - "Highest Rating"
  - "Lowest Rating"
- [ ] Active sort option highlighted
- [ ] Tapping sort option re-orders reviews
- [ ] Reviews re-order immediately
- [ ] Sort state persists during session

### Reviews List

- [ ] All worker reviews displayed
- [ ] Reviews sorted according to selected sort
- [ ] Each review uses ReviewCard component
- [ ] Shows reviewer name, rating, comment, timestamp
- [ ] Shows reviewer type badge (CLIENT/WORKER)
- [ ] Pagination for large review counts

### Sort by Latest

- [ ] Reviews ordered by date descending (newest first)
- [ ] Most recent review at top
- [ ] Oldest review at bottom (or paginated)

### Sort by Highest Rating

- [ ] Reviews ordered by rating descending (5 stars first)
- [ ] 5-star reviews at top
- [ ] 1-star reviews at bottom
- [ ] Ties sorted by date (latest first)

### Sort by Lowest Rating

- [ ] Reviews ordered by rating ascending (1 star first)
- [ ] 1-star reviews at top
- [ ] 5-star reviews at bottom
- [ ] Ties sorted by date (latest first)

### Pagination

- [ ] Initially loads 20 reviews
- [ ] Scroll to bottom loads more
- [ ] Loading indicator while loading more
- [ ] All reviews eventually loadable

### Pull-to-Refresh

- [ ] Pull down gesture refreshes data
- [ ] Refresh indicator shows
- [ ] Reviews and statistics reload
- [ ] New reviews appear after refresh

### Loading States

- [ ] Loading spinner on initial load
- [ ] Loading message: "Loading reviews..."
- [ ] Skeleton loaders for cards (optional)

### Empty States

- [ ] Empty state if worker has no reviews
- [ ] Shows star icon
- [ ] Message: "No reviews yet"
- [ ] Subtext: "This worker hasn't received any reviews"

### Error States

- [ ] Error if worker ID invalid
- [ ] Error message: "Worker not found"
- [ ] Back button to return
- [ ] Network error handling

### Edge Cases

- [ ] Worker with 0 reviews
- [ ] Worker with 1 review
- [ ] Worker with 100+ reviews
- [ ] Worker with all 5-star reviews (100% breakdown)
- [ ] Worker with all 1-star reviews
- [ ] Worker with fractional average (4.7)
- [ ] Deleted worker (404 error)

---

## 8. Backend API Integration

**File**: `apps/backend/src/accounts/api.py` (+171 lines for review endpoints)

### POST /api/accounts/reviews/submit

#### Authentication

- [ ] Requires authentication (cookie_auth)
- [ ] Unauthenticated request returns 401
- [ ] Invalid token returns 401

#### Request Body

- [ ] Accepts JSON payload
- [ ] Required fields: job_id, reviewee_id, rating, comment, reviewer_type
- [ ] rating: float, 1.0 to 5.0
- [ ] comment: string, 10-500 characters
- [ ] reviewer_type: "CLIENT" or "WORKER"

#### Validation

- [ ] Rating < 1.0 rejected
- [ ] Rating > 5.0 rejected
- [ ] Comment < 10 chars rejected
- [ ] Comment > 500 chars rejected
- [ ] Blank comment rejected
- [ ] Job must exist (404 if not)
- [ ] Job must be COMPLETED status
- [ ] Reviewee must be part of job
- [ ] Reviewer must be part of job
- [ ] Cannot review yourself (403 error)
- [ ] Cannot review same job twice (409 error)

#### Success Response

- [ ] Returns 201 Created
- [ ] Response includes review_id
- [ ] Response includes success message
- [ ] JobReview record created in database
- [ ] Review linked to job and users correctly

#### Error Responses

- [ ] 400 Bad Request for validation errors
- [ ] 403 Forbidden for self-review
- [ ] 404 Not Found for invalid job
- [ ] 409 Conflict for duplicate review
- [ ] Error messages descriptive

### GET /api/accounts/reviews/worker/{worker_id}

#### Authentication

- [ ] Requires authentication
- [ ] Unauthenticated request returns 401

#### Query Parameters

- [ ] page: integer, default 1
- [ ] limit: integer, default 20
- [ ] sort: "latest", "highest", "lowest", default "latest"

#### Response

- [ ] Returns 200 OK
- [ ] Response includes reviews array
- [ ] Each review includes:
  - review_id, rating, comment
  - reviewer name, profile image
  - reviewer_type, timestamp
  - isFlagged, status
- [ ] Pagination metadata (total, pages, current_page)
- [ ] Reviews sorted according to sort param

#### Sorting

- [ ] sort=latest returns newest first
- [ ] sort=highest returns 5-star first
- [ ] sort=lowest returns 1-star first

#### Error Responses

- [ ] 404 if worker not found
- [ ] 400 for invalid sort param

### GET /api/accounts/reviews/stats/{worker_id}

#### Authentication

- [ ] Requires authentication

#### Response

- [ ] Returns 200 OK
- [ ] Response includes:
  - average_rating: float (e.g., 4.73)
  - total_reviews: integer
  - rating_breakdown: object
    - 5: count
    - 4: count
    - 3: count
    - 2: count
    - 1: count

#### Calculation Accuracy

- [ ] Average rating calculated correctly
- [ ] Total reviews matches database count
- [ ] Breakdown counts correct
- [ ] Handles 0 reviews (returns 0.0 average)

### GET /api/accounts/reviews/my-reviews

#### Authentication

- [ ] Requires authentication

#### Query Parameters

- [ ] type: "given" or "received", default "given"

#### Response

- [ ] Returns 200 OK
- [ ] type=given returns reviews user wrote
- [ ] type=received returns reviews user received
- [ ] Each review includes full details
- [ ] Reviews sorted by date (latest first)

### PUT /api/accounts/reviews/{review_id}

#### Authentication

- [ ] Requires authentication
- [ ] Only review author can edit
- [ ] Non-author returns 403

#### Request Body

- [ ] Accepts rating and/or comment
- [ ] Can update rating only
- [ ] Can update comment only
- [ ] Can update both

#### 24-Hour Window Validation

- [ ] Edit allowed if review < 24 hours old
- [ ] Edit rejected if review >= 24 hours old
- [ ] Error message: "Edit window expired (24 hours)"
- [ ] createdAt timestamp checked

#### Success Response

- [ ] Returns 200 OK
- [ ] Review updated in database
- [ ] updatedAt timestamp updated
- [ ] Response includes updated review

#### Error Responses

- [ ] 403 if not review author
- [ ] 400 if edit window expired
- [ ] 404 if review not found

### POST /api/accounts/reviews/{review_id}/report

#### Authentication

- [ ] Requires authentication
- [ ] Cannot report own review (403)

#### Request Body

- [ ] Accepts reason field
- [ ] reason: "spam", "offensive", "misleading", "other"

#### Success Response

- [ ] Returns 200 OK
- [ ] Review isFlagged set to true
- [ ] Report reason logged (if model supports)
- [ ] Success message returned

#### Error Responses

- [ ] 403 if reporting own review
- [ ] 404 if review not found
- [ ] 400 if invalid reason

### GET /api/accounts/reviews/pending

#### Authentication

- [ ] Requires authentication

#### Response

- [ ] Returns 200 OK
- [ ] Returns jobs that need reviews
- [ ] Filters for COMPLETED jobs
- [ ] Excludes jobs already reviewed
- [ ] Includes job details and reviewee info

---

## 9. Mobile Service Layer

**File**: `apps/backend/src/accounts/mobile_services.py` (+648 lines)

### submit_review_mobile()

- [ ] Validates job exists and is completed
- [ ] Validates reviewer is part of job
- [ ] Prevents duplicate reviews
- [ ] Prevents self-review
- [ ] Creates JobReview record
- [ ] Updates worker's average rating
- [ ] Returns review details

### get_worker_reviews_mobile()

- [ ] Fetches reviews for specified worker
- [ ] Supports pagination (page, limit)
- [ ] Supports sorting (latest, highest, lowest)
- [ ] Returns reviewer details (name, image)
- [ ] Returns pagination metadata
- [ ] Excludes flagged reviews (optional filter)

### get_job_reviews_mobile()

- [ ] Fetches reviews for specific job
- [ ] Returns both client and worker reviews
- [ ] Returns review details

### get_my_reviews_mobile()

- [ ] Fetches user's given reviews
- [ ] Fetches user's received reviews
- [ ] Filter by type param
- [ ] Returns full review details

### get_review_stats_mobile()

- [ ] Calculates average rating
- [ ] Counts total reviews
- [ ] Generates rating breakdown (5/4/3/2/1)
- [ ] Handles zero reviews gracefully
- [ ] Returns accurate statistics

### edit_review_mobile()

- [ ] Validates review ownership
- [ ] Checks 24-hour edit window
- [ ] Updates rating and/or comment
- [ ] Updates updatedAt timestamp
- [ ] Recalculates worker average rating

### report_review_mobile()

- [ ] Validates review exists
- [ ] Prevents reporting own review
- [ ] Sets isFlagged to true
- [ ] Logs report reason (if supported)
- [ ] Returns success

### get_pending_reviews_mobile()

- [ ] Fetches completed jobs without reviews
- [ ] Filters by user's jobs
- [ ] Returns job and reviewee details
- [ ] Supports pagination

---

## 10. Custom Hooks

**File**: `lib/hooks/useReviews.ts` (205 lines)

### useSubmitReview()

- [ ] Returns useMutation hook
- [ ] Accepts review submission data
- [ ] Calls /api/accounts/reviews/submit
- [ ] Invalidates reviews cache on success
- [ ] Returns error on failure
- [ ] Optimistic update (optional)

### useWorkerReviews()

- [ ] Returns useQuery hook
- [ ] Accepts workerId, page, limit, sort
- [ ] Calls /api/accounts/reviews/worker/{id}
- [ ] Caches reviews data
- [ ] Supports pagination
- [ ] Supports refetch

### useReviewStats()

- [ ] Returns useQuery hook
- [ ] Accepts workerId
- [ ] Calls /api/accounts/reviews/stats/{id}
- [ ] Returns average_rating, total_reviews, breakdown
- [ ] Caches statistics

### useMyReviews()

- [ ] Returns useQuery hook
- [ ] Accepts type param ("given" or "received")
- [ ] Calls /api/accounts/reviews/my-reviews
- [ ] Returns user's reviews
- [ ] Supports refetch

### useEditReview()

- [ ] Returns useMutation hook
- [ ] Accepts review_id and updated data
- [ ] Calls PUT /api/accounts/reviews/{id}
- [ ] Invalidates cache on success
- [ ] Returns error if edit window expired

### useReportReview()

- [ ] Returns useMutation hook
- [ ] Accepts review_id and reason
- [ ] Calls POST /api/accounts/reviews/{id}/report
- [ ] Invalidates cache on success
- [ ] Shows success toast

### usePendingReviews()

- [ ] Returns useQuery hook
- [ ] Calls /api/accounts/reviews/pending
- [ ] Returns jobs needing reviews
- [ ] Used for review prompts

---

## 11. Integration Testing

### End-to-End Review Submission Flow

- [ ] Client completes job with worker
- [ ] Review prompt modal appears
- [ ] Client taps "Write Review"
- [ ] Navigates to review submission screen
- [ ] Client selects 4-star rating
- [ ] Client writes 50-character comment
- [ ] Client taps submit
- [ ] Success toast appears
- [ ] Review appears in client's "Given" reviews
- [ ] Review appears in worker's "Received" reviews
- [ ] Worker's average rating updates
- [ ] Worker's profile shows new rating

### End-to-End Worker Reviews Display

- [ ] Navigate to worker profile
- [ ] Tap "View Reviews" button
- [ ] Worker reviews screen loads
- [ ] Summary card shows average 4.2 rating
- [ ] Rating breakdown chart displays
- [ ] Reviews list shows 10 reviews
- [ ] Reviews sorted by latest
- [ ] Change sort to "Highest Rating"
- [ ] 5-star reviews appear at top
- [ ] Pull to refresh reloads data

### Edit Review Flow (Within 24 Hours)

- [ ] User submits review
- [ ] Review appears in "My Reviews"
- [ ] Edit button visible
- [ ] Tap edit button (shows alert currently)
- [ ] Future: Edit form appears
- [ ] User changes rating from 4 to 5 stars
- [ ] User updates comment
- [ ] Submit edit
- [ ] Review updates in all views
- [ ] Worker's average rating recalculates

### Edit Review Flow (After 24 Hours)

- [ ] Create review with timestamp > 24h ago (backend)
- [ ] View review in "My Reviews"
- [ ] Edit button hidden
- [ ] Cannot edit review
- [ ] Attempting edit returns error (if API called)

### Report Review Flow

- [ ] Worker receives 1-star review from client
- [ ] Worker views review in "Received" tab
- [ ] Worker taps report button
- [ ] Report dialog appears
- [ ] Worker selects "Spam or misleading"
- [ ] Worker submits report
- [ ] Success toast appears
- [ ] Review flagged in backend
- [ ] Admin can see flagged reviews

### My Reviews Tab Switching

- [ ] Navigate to My Reviews screen
- [ ] "Given" tab selected by default
- [ ] Shows 3 reviews given by user
- [ ] Tap "Received" tab
- [ ] Tab switches smoothly
- [ ] Shows 5 reviews received by user
- [ ] Statistics update for received reviews
- [ ] Tap "Given" tab again
- [ ] Returns to given reviews

---

## 12. Performance Testing

### Load Performance

- [ ] Submit review completes in < 2 seconds
- [ ] Worker reviews screen loads in < 3 seconds
- [ ] My Reviews screen loads in < 2 seconds
- [ ] Rating breakdown calculates in < 500ms
- [ ] Star rating interaction has no lag
- [ ] Pagination loads next 20 reviews in < 1 second

### Memory Usage

- [ ] Worker reviews screen with 100 reviews uses < 100MB
- [ ] No memory leaks on navigation
- [ ] Images load efficiently (cached)

### API Performance

- [ ] Submit review API call < 500ms
- [ ] Get worker reviews API call < 800ms
- [ ] Get review stats API call < 300ms
- [ ] Get my reviews API call < 600ms

### Caching Efficiency

- [ ] Reviews cached after first load
- [ ] Cache invalidates after review submission
- [ ] Cache refreshes on pull-to-refresh
- [ ] Stale data not shown

---

## 13. Platform-Specific Testing

### iOS Testing

- [ ] Star rating tappable on iOS
- [ ] Action sheet for edit/report shows correctly
- [ ] Safe areas respected (notch, home indicator)
- [ ] Navigation animations smooth
- [ ] Haptic feedback on star tap
- [ ] Pull-to-refresh works on iOS

### Android Testing

- [ ] Star rating tappable on Android
- [ ] Alert dialogs for edit/report show correctly
- [ ] Status bar color matches theme
- [ ] Back button navigation works
- [ ] Material ripple effects on buttons
- [ ] Pull-to-refresh works on Android

---

## 14. Accessibility Testing

### Screen Readers

- [ ] Star rating has accessible label ("4 out of 5 stars")
- [ ] Review cards have accessible labels
- [ ] Submit button has label "Submit Review"
- [ ] Edit/report buttons have labels
- [ ] Sort buttons have labels

### Font Scaling

- [ ] Text readable at 200% font scale
- [ ] Layout doesn't break with large text
- [ ] Star rating scales appropriately

### Color Contrast

- [ ] Star colors have sufficient contrast
- [ ] Text readable against backgrounds
- [ ] Rating breakdown colors distinguishable
- [ ] Badge colors meet WCAG AA

---

## 15. Security Testing

### Authentication

- [ ] Unauthenticated users cannot submit reviews
- [ ] Cannot submit review for other users
- [ ] Cannot edit other users' reviews
- [ ] Cannot view reviews without authentication (if restricted)

### Authorization

- [ ] Cannot review jobs you're not part of
- [ ] Cannot review yourself
- [ ] Cannot report your own reviews
- [ ] Can only edit your own reviews

### Input Validation

- [ ] XSS protection (sanitized review text)
- [ ] SQL injection protection (parameterized queries)
- [ ] Cannot submit excessively long comments (500 char limit)
- [ ] Cannot submit invalid ratings (< 1 or > 5)

### Data Privacy

- [ ] Reviews linked to correct users
- [ ] Private job details not exposed
- [ ] Flagged reviews visible to admins only

---

## 16. Edge Cases & Error Scenarios

### Empty/Minimal Reviews

- [ ] Review with minimum 10 characters submits
- [ ] Review with exactly 500 characters submits
- [ ] Review with only spaces rejected (after trim)

### Rating Edge Cases

- [ ] Rating of 1.0 (minimum) submits
- [ ] Rating of 5.0 (maximum) submits
- [ ] Rating of 0.0 rejected
- [ ] Rating of 6.0 rejected
- [ ] Fractional ratings (4.5) handled correctly

### Review Counts

- [ ] Worker with 0 reviews shows 0.0 average
- [ ] Worker with 1 review shows that rating as average
- [ ] Worker with 100+ reviews pagination works
- [ ] Rating breakdown with 0 reviews shows all 0%

### Job States

- [ ] Cannot review job that's not COMPLETED
- [ ] Cannot review job that's CANCELLED
- [ ] Cannot review job that's IN_PROGRESS

### User States

- [ ] Deleted user's reviews still display (anonymized)
- [ ] Blocked user's reviews still display (filtered in admin)

### Network Scenarios

- [ ] Submit review offline queues for retry (if offline queue implemented)
- [ ] Network error during submit shows error message
- [ ] Retry button after network error works
- [ ] Stale data warning when offline (optional)

---

## 17. Known Limitations Testing

### Features NOT Implemented

- [ ] Photo attachments in reviews (spec mentioned, not implemented)
- [ ] Worker responses to reviews (model doesn't support)
- [ ] Multi-category ratings (quality, punctuality, etc.)
- [ ] Helpful vote functionality (field exists, no UI)
- [ ] Review editing UI (edit button shows alert, not form)

### Expected Behavior

- [ ] Tapping edit button shows alert (not edit form)
- [ ] No photo upload button in review form
- [ ] No worker response section in review cards
- [ ] No helpful/not helpful vote buttons

---

## 18. Regression Testing

### Previous Phases Still Work

- [ ] Job browsing (Phase 1) works
- [ ] Job application (Phase 1) works
- [ ] Job completion (Phase 2) works
- [ ] Escrow payments (Phase 3) work
- [ ] Final payments (Phase 4) work
- [ ] Real-time chat (Phase 5) works
- [ ] Profile management (Phase 6) works
- [ ] KYC upload (Phase 7) works
- [ ] Reviews don't break other features

---

## Test Completion Checklist

- [ ] All test cases executed
- [ ] All critical issues documented
- [ ] Screenshots captured for visual issues
- [ ] Performance metrics recorded
- [ ] Test report created
- [ ] Bugs logged in issue tracker
- [ ] QA sign-off obtained

---

**Total Test Cases**: 350+
**Estimated Testing Time**: 8-12 hours
**Priority**: High (User trust & community feature)
**Status**: ⏳ Awaiting QA Execution
