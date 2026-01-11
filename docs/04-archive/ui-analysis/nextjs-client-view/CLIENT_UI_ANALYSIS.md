# Next.js Client "My Requests" UI Analysis

**Date:** November 16, 2025
**Analyzed By:** AI Agent
**Purpose:** Design specification for mobile app "My Requests" feature
**Screenshots Location:** `/docs/ui-analysis/nextjs-client-view/`

---

## Executive Summary

The Next.js web application provides a comprehensive client interface for managing job postings, viewing applications, and tracking job status. The interface uses a tabbed navigation pattern with four main sections:

1. **My Jobs** - Active job postings (ACTIVE status)
2. **In Progress** - Jobs currently being worked on (IN_PROGRESS status)
3. **Past Requests** - Completed jobs (COMPLETED status)
4. **Requests** - Worker applications across all jobs

**Navigation Label:** "My Jobs" (bottom navigation bar)
**URL Route:** `/dashboard/myRequests`

---

## UI/UX Design Patterns

### Layout Structure

**Desktop Layout:**
- Left sidebar navigation (persistent)
- Top header with notifications and profile
- Main content area with tabbed interface
- Modal overlays for details and forms

**Mobile Layout (Bottom Navigation):**
- Bottom tab bar: Home, My Jobs, Inbox, Profile
- Full-screen content area
- Modals slide up from bottom

### Color Scheme

**Status Badges:**
- **Active:** Blue background (#3B82F6 / blue-500), white text
- **In Progress:** Yellow/Amber background (#F59E0B / amber-500), dark text
- **Completed:** Green background (#10B981 / green-500), white text
- **Cancelled:** Red background (#EF4444 / red-500), white text

**Payment Status:**
- **Pending:** Gray/neutral color
- **Paid:** Green color
- **Overdue:** Red color

**Primary Actions:**
- **Create Job Post:** Blue button (#3B82F6)
- **Accept Application:** Green button
- **Reject Application:** Red button
- **Cancel Job:** Red outline button

### Typography

- **Page Headings:** 2xl font size, bold, dark text
- **Card Titles:** lg font size, semibold
- **Body Text:** sm-base font size, gray-600
- **Budget/Price:** lg font size, bold, primary blue color
- **Dates:** sm font size, gray-500

---

## Screen 1: Active Requests (My Jobs Tab)

**Screenshot:** `01-active-requests-list.png`

### Layout Components

**Header Section:**
- Page title: "Active Requests" (left-aligned)
- Action button: "+ Create a Job Post" (right-aligned, blue background)

**Job Card Design:**
- **Layout:** Horizontal card with left content, right price/arrow
- **Left Section:**
  - Job title (heading 3, semibold)
  - Posted date (gray text, small)
  - Location with pin icon (gray text, small)
- **Right Section:**
  - Budget/price (large, bold, blue)
  - Right arrow icon (chevron)

**Empty State:**
- Not shown in screenshot (2 jobs present)
- Expected: Centered icon, "No active jobs" message, "Create your first job post" prompt

**Interaction:**
- Tap on job card → Opens job detail modal
- Pull to refresh → Reload job list
- Create button → Opens job creation modal

---

## Screen 2: Job Detail Modal

**Screenshot:** `02-job-detail-modal.png`

### Modal Structure

**Header:**
- Title: "Job Details"
- Close button (X icon, top-right)

**Job Information Section:**
- Job title (large heading)
- Budget (extra-large, blue, bold)
- Status badge (colored pill, right-aligned)

**Details Grid (2 columns):**
- **Category:** Specialization name (e.g., "Masonry")
- **Location:** Barangay, City with pin icon
- **Posted Date:** ISO timestamp (needs formatting)

**Payment Information Panel:**
- Header with credit card icon
- Blue/light blue background
- Fields:
  - Status (Pending/Paid badge)
  - Total Amount
  - Downpayment (50%)
  - Final Payment (50%)

**Description Section:**
- Heading: "Description"
- Full job description text

**Photos Section:**
- Grid of uploaded job photos (if any)
- Empty state: "No photos uploaded for this job"

**Applications Section:**
- Heading: "Applications (X)" with count
- List of applicant cards (if any)
- Empty state: Icon, "No applications yet", "Workers will be able to apply for this job"

**Action Buttons (Bottom):**
- "Cancel Job" (red outline, left)
- "Close" (gray outline, right)

### Applicant Card Design (when applications exist)
- Worker profile image
- Worker name
- Skills/specializations
- Proposed budget
- Accept/Reject buttons

---

## Screen 3: In Progress Jobs

**Screenshot:** `03-in-progress-jobs.png`

### Layout Components

**Header:**
- Page title: "Jobs In Progress"
- No action button (can't create jobs in this section)

**Job Card Design (Enhanced):**
- **Layout:** Similar to active jobs but with additional info
- **Top Section:**
  - Job title with status badge inline
- **Description:** Brief job description shown
- **Bottom Section (2 columns):**
  - Left: Location with pin icon, Category with icon
  - Right: Budget (blue, bold)
  - Right arrow chevron

**Status Badge:**
- "In Progress" with yellow/amber background
- Displayed inline with title

**Empty State:**
- Not shown in screenshot (1 job present)

---

## Screen 4: Past Requests (Completed Jobs)

**Screenshot:** `04-past-requests.png`

### Layout Components

**Header:**
- Page title: "Past Requests"

**Job Card Design (Simplified):**
- **Layout:** Horizontal card, minimal info
- **Left Section:**
  - Job title (heading 3)
  - Completion date (gray, small)
  - Status badge (green "Completed")
- **Right Section:**
  - Final budget/payment (large, bold)
  - Right arrow chevron

**Status Badge:**
- "Completed" with green background
- Displayed below date

**Empty State:**
- Not shown (3 completed jobs present)
- Expected: "No completed jobs yet"

---

## Screen 5: Worker Applications (Requests Tab)

**Screenshot:** `05-worker-applications.png`

### Layout Components

**Header:**
- Page title: "Worker Applications"
- Subtitle: "View workers who have applied to your posted jobs"

**Empty State:**
- Icon: Group of people (users icon)
- Heading: "No applications yet"
- Description: "Worker applications to your jobs will appear here"

**Expected with Applications:**
- List of applications grouped by job
- Each application shows:
  - Worker profile image and name
  - Job title applied to
  - Proposed budget
  - Application date
  - Accept/Reject buttons
  - View profile button

---

## Screen 6: Create Job Post Form

**Screenshot:** `06-create-job-post-form.png`

### Modal Form Structure

**Header:**
- Title: "Post a Job"
- Close button (X icon)

**Form Fields:**

1. **Job Title*** (required)
   - Text input
   - Placeholder: "e.g., Fix Leaking Kitchen Sink"

2. **Category*** (required)
   - Dropdown select
   - Options: Appliance Repair, Carpentry, Cleaning, Electrical, Gardening, HVAC, Home Cleaning, Masonry, Moving, Painting, Plumbing, Welding
   - Each option has emoji icon

3. **Job Description*** (required)
   - Textarea (multi-line)
   - Placeholder: "Describe the job in detail..."
   - Helper text: "Include specific details, requirements, and expectations"

4. **Project Budget (₱)*** (required)
   - Number input
   - Shows available wallet balance below
   - Format: "Available balance: ₱3,675.01"

5. **Job Location*** (required)
   - Two-part selection:
     - City (disabled, pre-filled: "Zamboanga City")
     - Barangay (dropdown with all barangays)

6. **Expected Duration** (optional)
   - Number input + Unit selector
   - Units: Hours, Days, Weeks, Months

7. **Preferred Start Date** (optional)
   - Date picker input

8. **Materials Needed** (optional)
   - Tag input field
   - Placeholder: "Type material and press Enter..."
   - Helper: "Press Enter to add each material"

9. **Photos** (optional)
   - Drag-and-drop upload area
   - Click to upload
   - Accepts: PNG, JPG, WEBP up to 5MB each

**Action Buttons:**
- "Cancel" (gray, left)
- "Post Job" (blue, right)

---

## Navigation Structure

### Bottom Navigation Bar (Mobile)

**Tabs:**
1. **Home** - Dashboard/home page
2. **My Jobs** - Client's posted jobs (current feature)
3. **Inbox** - Messages/chat
4. **Profile** - User profile settings

**Active State:**
- Blue color for active tab
- Icon and label both highlighted

---

## Functional Requirements

### Job Listing Features

**Filtering:**
- By status: Active, In Progress, Completed
- Tabbed interface for quick switching

**Sorting:**
- Most recent first (by posted date)
- Can be enhanced with custom sorting

**Search:**
- Not visible in current implementation
- Recommended addition for mobile app

**Pagination/Infinite Scroll:**
- Not clear from screenshots
- Mobile app should use FlatList with pagination

### Job Detail Features

**Information Display:**
- Complete job details (title, description, budget, location, etc.)
- Payment status breakdown (escrow, final payment)
- Posted date and duration
- Uploaded photos gallery
- Applications count and list

**Actions:**
- View applications
- Accept/reject applications
- Cancel job (if ACTIVE)
- Edit job (if ACTIVE) - not shown but should be available
- Contact worker (if IN_PROGRESS)

### Application Management

**Review Applications:**
- View applicant profile
- See proposed budget
- Check worker skills/ratings
- Accept or reject application

**Notifications:**
- New application badge
- Application accepted confirmation
- Job started notification
- Job completion requests

---

## Mobile-Specific Enhancements

### Gestures & Interactions

**Swipe Actions:**
- Swipe right on applicant card → Accept
- Swipe left on applicant card → Reject
- Swipe to refresh on job lists

**Haptic Feedback:**
- On accept/reject actions
- On job status changes
- On successful job creation

**Pull to Refresh:**
- All job list screens
- Applications list

**Infinite Scroll:**
- Load more jobs as user scrolls
- Show loading skeleton at bottom

### Optimizations

**Image Loading:**
- Use expo-image for optimized loading
- Lazy load job photos
- Thumbnail images in list view

**Caching:**
- Cache job listings with TanStack Query
- Stale-while-revalidate strategy
- Cache invalidation on create/update/delete

**Loading States:**
- Skeleton loaders for job cards
- Shimmer effect during loading
- Pull-to-refresh indicator

**Error Handling:**
- Network error messages
- Retry button on failed requests
- Offline mode indicator

---

## API Endpoints Required

Based on analysis, the following endpoints are needed:

### Job Management
- `GET /api/jobs/listing` - Get client's posted jobs (with status filter)
- `GET /api/jobs/{id}` - Get single job details
- `POST /api/jobs/create` - Create new job posting
- `PUT /api/jobs/{id}` - Update job details
- `DELETE /api/jobs/{id}` - Cancel job

### Application Management
- `GET /api/jobs/{id}/applications` - Get applications for specific job
- `PUT /api/jobs/{id}/application/{app_id}` - Accept/reject application
- `GET /api/accounts/all-applications` - Get all applications across jobs (for "Requests" tab)

### Worker Information
- `GET /api/profiles/{worker_id}` - Get worker profile details

---

## Design Differences: Web vs Mobile

### Web Application
- Desktop-first layout with sidebar
- Modal overlays for details and forms
- Hover states and cursor interactions
- Larger form inputs and buttons
- More information density

### Mobile Application (Planned)
- Mobile-first with bottom navigation
- Full-screen views instead of modals
- Touch-optimized buttons (minimum 44pt tap targets)
- Native mobile UI components (React Native Paper)
- Simplified card designs for smaller screens
- Swipe gestures for common actions
- Native date/time pickers
- Camera integration for photo uploads
- Push notifications for real-time updates

---

## Recommendations for Mobile Implementation

### Priority Features (MVP)

1. **Job List Screens**
   - Active jobs with status badges
   - In Progress jobs
   - Completed jobs
   - Tab-based navigation between statuses

2. **Job Detail Screen**
   - Complete job information
   - Payment status display
   - Applications list
   - Accept/reject functionality

3. **Job Creation Flow**
   - Simplified form with native inputs
   - Photo upload from camera/gallery
   - Location pre-filled from profile
   - Budget validation against wallet balance

4. **Application Review**
   - Applicant profile cards
   - Quick accept/reject actions
   - View full worker profile

### Enhanced Features (Future)

1. **Search & Filters**
   - Search jobs by title/description
   - Filter by date range
   - Filter by budget range
   - Filter by category

2. **Job Editing**
   - Edit active jobs
   - Add/remove photos
   - Update budget/description

3. **Communication**
   - Direct message to applicants
   - Automated status notifications
   - In-app chat integration

4. **Analytics**
   - Total jobs posted
   - Average response time
   - Success rate
   - Budget trends

---

## Implementation Notes

### Component Reusability

Many components can be reused from existing mobile app:

**Existing Components to Reuse:**
- `PaymentStatusBadge` - For payment status display
- `PaymentSummaryCard` - For payment breakdown
- `SaveButton` - For generic actions
- `ThemedText`, `ThemedView` - For consistent styling

**New Components Needed:**
- `ClientJobCard` - Job card for client view
- `JobStatusBadge` - Status indicator (Active, In Progress, etc.)
- `ApplicantCard` - Worker application card
- `JobDetailView` - Comprehensive job details
- `ApplicationActionButtons` - Accept/reject controls

### Navigation Strategy

**Option 1: Conditional Rendering (Recommended)**
- Keep single "My Jobs" tab in bottom navigation
- Show different content based on user profile type (WORKER vs CLIENT)
- Workers see: Applied jobs, Active jobs, Saved jobs
- Clients see: Posted jobs with status filtering

**Option 2: Separate Tabs**
- Add "My Requests" tab for clients
- Hide worker-specific tabs for clients
- Show/hide tabs dynamically based on profile type

**Recommendation:** Use Option 1 for simpler navigation structure

---

## Conclusion

The Next.js client interface provides a solid foundation for the mobile "My Requests" feature. The mobile implementation should:

1. Maintain the core functionality and user flows
2. Adapt the UI for mobile-first interaction patterns
3. Add mobile-specific enhancements (gestures, haptics, native components)
4. Optimize for performance with proper caching and loading states
5. Provide a better user experience than the web version

The tabbed interface pattern works well for both web and mobile, and the status-based filtering (Active, In Progress, Past) is intuitive and should be preserved in the mobile app.
