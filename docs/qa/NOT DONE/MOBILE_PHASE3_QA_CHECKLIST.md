# QA Testing Checklist - Mobile Phase 3

**Feature**: Job Browsing & Filtering System  
**Version**: 1.0  
**Date Created**: November 14, 2025  
**Status**: Ready for Testing

---

## 📋 Overview

This checklist covers all features implemented in Mobile Phase 3:

- Category Browsing System
- Advanced Search with Filters
- Saved Jobs Functionality
- Navigation Integration

**Testing Environments**:

- [ ] iOS Simulator
- [ ] Android Emulator
- [ ] Physical iOS Device
- [ ] Physical Android Device

---

## 🎯 Part 1: Category Browsing System

### Screen: `/jobs/categories`

#### Visual Layout ✅

- [ ] Category grid displays in 2 columns
- [ ] All categories load successfully
- [ ] Category icons display correctly (18 different icons)
- [ ] Category colors rotate through 8 colors properly
- [ ] Category names are clearly visible
- [ ] Job count badge shows on each category card
- [ ] Search bar appears at top of screen
- [ ] Header shows "Browse Categories" title
- [ ] Back button visible and accessible

#### Category Icons Verification 🎨

Verify each category shows the correct icon:

- [ ] Plumbing → water droplet icon
- [ ] Electrical → lightning bolt icon
- [ ] Carpentry → hammer icon
- [ ] Painting → color palette icon
- [ ] Cleaning → sparkles icon
- [ ] Gardening → leaf icon
- [ ] Appliance Repair → settings icon
- [ ] Masonry → cube icon
- [ ] Roofing → home icon
- [ ] Welding → flame icon
- [ ] Automotive → car icon
- [ ] HVAC → snow icon
- [ ] Tiling → grid icon
- [ ] Landscaping → flower icon
- [ ] Moving → car-sport icon
- [ ] Pest Control → bug icon
- [ ] Security Installation → shield icon
- [ ] Other categories → briefcase icon (fallback)

#### Color Rotation Check 🌈

- [ ] First 8 categories show different colors
- [ ] Colors repeat after 8th category
- [ ] Colors are: Blue, Green, Orange, Purple, Pink, Cyan, Red, Indigo

#### Search Functionality 🔍

- [ ] Search bar is functional
- [ ] Typing filters categories in real-time
- [ ] Case-insensitive search works
- [ ] Partial matches work (e.g., "plumb" finds "Plumbing")
- [ ] Clear search icon appears when typing
- [ ] Clear icon removes search filter
- [ ] "No categories found" shows for no matches
- [ ] Search works with special characters

#### Interactions 👆

- [ ] Tapping category card navigates to filtered jobs
- [ ] Category name and ID pass correctly to next screen
- [ ] Tapping outside search dismisses keyboard
- [ ] Pull-to-refresh works
- [ ] Loading spinner shows during refresh
- [ ] Smooth scrolling through categories

#### Edge Cases 🔬

- [ ] Empty categories list handled gracefully
- [ ] Network error shows error state
- [ ] Retry button works after error
- [ ] Loading state shows on initial load
- [ ] Job count updates after pull-to-refresh

---

## 📂 Part 2: Category-Filtered Jobs

### Screen: `/jobs/browse/[categoryId]`

#### Visual Layout ✅

- [ ] Header shows category name correctly
- [ ] Back button navigates to categories screen
- [ ] Job cards display in single column
- [ ] All job card elements are visible
- [ ] Urgency indicator (colored left border) displays
- [ ] Category badge shows on each card
- [ ] Budget is highlighted in green
- [ ] Client avatar placeholder shows
- [ ] Time ago displays correctly

#### Job Card Components 📝

Each job card should show:

- [ ] Job title (max 2 lines)
- [ ] Category badge (blue background)
- [ ] Budget amount (green background, right aligned)
- [ ] Description (2 lines, truncated with ...)
- [ ] Location icon + location text
- [ ] Time icon + expected duration
- [ ] Client avatar + client name
- [ ] Urgency badge (colored: red/yellow/green)
- [ ] Time posted ("5m ago", "3h ago", etc.)
- [ ] "Applied" badge if already applied

#### Urgency Indicators 🚦

- [ ] HIGH urgency: Red left border + red badge
- [ ] MEDIUM urgency: Yellow left border + yellow badge
- [ ] LOW urgency: Green left border + green badge
- [ ] Badge text matches urgency level

#### Pagination & Scrolling ♾️

- [ ] Jobs load 20 at a time
- [ ] Scrolling to bottom loads more jobs
- [ ] "Loading more..." indicator shows at bottom
- [ ] Pagination stops when all jobs loaded
- [ ] "No more jobs" message at end (optional)
- [ ] Smooth scroll performance with many jobs

#### Interactions 👆

- [ ] Tapping job card navigates to job detail
- [ ] Job ID passes correctly
- [ ] Pull-to-refresh reloads first page
- [ ] Refresh resets pagination
- [ ] Back button returns to categories

#### Edge Cases 🔬

- [ ] Empty category (no jobs) shows empty state
- [ ] Empty state message is clear
- [ ] Network error shows error state
- [ ] Retry after error works
- [ ] Loading state on initial load
- [ ] Category with 1-5 jobs (no pagination needed)
- [ ] Category with 100+ jobs (heavy pagination)

---

## 🔍 Part 3: Advanced Search Screen

### Screen: `/jobs/search`

#### Visual Layout ✅

- [ ] Header shows "Search Jobs" title
- [ ] Back button visible
- [ ] Filter toggle button (options icon) visible
- [ ] Search bar prominent and accessible
- [ ] Filter badge shows when filters active
- [ ] Recent searches show before searching
- [ ] Filter panel slides/collapses smoothly

#### Search Bar Functionality 🔍

- [ ] Search input accepts text
- [ ] Placeholder text is clear
- [ ] Clear icon (X) appears when typing
- [ ] Clear icon removes search text
- [ ] Search debounces after 500ms (not instant)
- [ ] Typing indicator shows briefly
- [ ] Keyboard dismisses on scroll

#### Recent Searches 📜

Before any search:

- [ ] "Recent Searches" section shows
- [ ] Last 5 searches display
- [ ] Each search is clickable
- [ ] Clicking search populates search bar
- [ ] "Clear" button visible
- [ ] "Clear" removes all recent searches
- [ ] Recent searches persist after app restart
- [ ] Empty state shows if no recent searches

#### Filter Panel 🎛️

- [ ] Filter icon toggles panel open/closed
- [ ] Panel slides smoothly
- [ ] All filter sections visible when open
- [ ] Scrollable if filters exceed screen height

**Budget Range Filter**:

- [ ] Min budget input accepts numbers only
- [ ] Max budget input accepts numbers only
- [ ] Placeholder values show (0 and 50000)
- [ ] ₱ peso sign visible
- [ ] "to" separator between inputs
- [ ] Invalid ranges handled (min > max)

**Location Filter**:

- [ ] Text input accepts any text
- [ ] Placeholder: "Enter city or barangay"
- [ ] Value updates immediately

**Category Filter (Multi-Select)**:

- [ ] 12+ category chips display
- [ ] Chips wrap to multiple rows
- [ ] Unselected: Gray background, dark text
- [ ] Selected: Blue background, white text
- [ ] Multiple categories can be selected
- [ ] Tapping toggles selection
- [ ] Selected categories highlighted

**Urgency Filter**:

- [ ] 3 chips: LOW, MEDIUM, HIGH
- [ ] Chips toggle on tap
- [ ] Multiple urgency levels can be selected
- [ ] Selected chips highlighted (blue)

**Sort Options**:

- [ ] 3 sort chips display
- [ ] "Latest First" (default)
- [ ] "Highest Budget"
- [ ] "Lowest Budget"
- [ ] Only one sort option active at a time
- [ ] Selected sort is highlighted

#### Clear Filters Button 🗑️

- [ ] Button only shows when filters are active
- [ ] Button shows red X icon
- [ ] Tapping clears ALL filters
- [ ] Filters reset to defaults
- [ ] Filter badge disappears

#### Search Results 📊

- [ ] Result count displays ("X jobs found")
- [ ] Job cards match filtered jobs screen design
- [ ] Results update when search changes
- [ ] Results update when filters change
- [ ] Empty state shows for no results
- [ ] "No jobs found" message clear
- [ ] Suggestion to adjust filters

#### Active Filter Badge 🔴

- [ ] Badge appears on filter icon when filters active
- [ ] Badge is small red dot
- [ ] Badge disappears when all filters cleared
- [ ] Badge visible from main search view

#### Interactions 👆

- [ ] Typing in search triggers debounced search
- [ ] Changing filters updates results immediately
- [ ] Tapping job card navigates to detail
- [ ] Back button returns to jobs tab
- [ ] Search saves to recent searches

#### Edge Cases 🔬

- [ ] Search with < 2 characters shows empty state
- [ ] Search with special characters works
- [ ] Very long search query handled
- [ ] Budget range validation (min > max)
- [ ] Location with special characters
- [ ] Selecting all categories
- [ ] Clearing search keeps filters active
- [ ] Network error during search
- [ ] No results for search + filters combo

---

## ❤️ Part 4: Saved Jobs Functionality

### Screen: `/jobs/saved`

#### Visual Layout ✅

- [ ] Header shows "Saved Jobs" title
- [ ] Count badge shows number of saved jobs
- [ ] Back button visible
- [ ] Job cards have same design as browse screen
- [ ] Additional "Saved X ago" badge displays
- [ ] Unsave button (heart-dislike icon) shows

#### Saved Jobs List 📋

- [ ] All saved jobs display
- [ ] Jobs sorted by saved date (newest first)
- [ ] Each card shows job details correctly
- [ ] "Saved 5m ago" timestamp displays
- [ ] Timestamps update appropriately
  - [ ] "Saved just now" (< 1 hour)
  - [ ] "Saved 3h ago" (< 24 hours)
  - [ ] "Saved yesterday" (1 day)
  - [ ] "Saved 5d ago" (> 1 day)

#### Count Badge 🔢

- [ ] Badge shows correct count
- [ ] Badge updates when job unsaved
- [ ] Badge disappears when count = 0
- [ ] Badge displays 1-99+ correctly

#### Unsave Functionality 🗑️

- [ ] Heart-dislike button visible on each card
- [ ] Tapping unsave button shows confirmation
- [ ] Confirmation dialog has job title
- [ ] "Cancel" button dismisses dialog
- [ ] "Remove" button unsaves job
- [ ] Job removed from list immediately
- [ ] Count badge updates
- [ ] Toast/alert confirms removal

#### Empty State 🌵

When no saved jobs:

- [ ] Heart outline icon displays
- [ ] "No saved jobs yet" message shows
- [ ] Descriptive subtext displays
- [ ] "Browse Jobs" button visible
- [ ] Button navigates to categories screen

#### Interactions 👆

- [ ] Tapping job card navigates to detail
- [ ] Job detail shows job is saved (filled heart)
- [ ] Pull-to-refresh reloads saved jobs
- [ ] Refresh updates saved timestamps
- [ ] Back button returns to previous screen

#### Edge Cases 🔬

- [ ] Loading state on initial load
- [ ] Network error shows error state
- [ ] Retry button works after error
- [ ] Unsaving last job shows empty state
- [ ] Rapid unsave actions handled
- [ ] Job already unsaved elsewhere (sync issue)

### SaveButton Component (Job Detail Screen)

#### Visual & Placement 📍

- [ ] SaveButton in job detail header
- [ ] Button positioned on right side
- [ ] Heart icon clearly visible
- [ ] Icon size appropriate (24px)

#### Save/Unsave Actions 💾

- [ ] Outline heart shows when not saved
- [ ] Filled heart shows when saved
- [ ] Tapping outline heart saves job
- [ ] Tapping filled heart unsaves job
- [ ] Loading spinner shows during action
- [ ] Icon updates immediately after action
- [ ] Red color used for heart icon

#### Feedback & Confirmation ✅

- [ ] Optimistic update (instant visual change)
- [ ] No confirmation dialog needed
- [ ] Toast notification optional
- [ ] Error alert if save/unsave fails
- [ ] Button disabled during loading
- [ ] Heart re-enables after completion

#### Integration with Saved Jobs Screen 🔗

- [ ] Saving job adds to saved jobs list
- [ ] Unsaving removes from saved jobs list
- [ ] Count badge updates in saved jobs screen
- [ ] Navigating to saved jobs shows correct state
- [ ] Timestamp shows when job was saved

---

## 🧭 Part 5: Navigation Integration

### Jobs Tab Header (`/jobs`)

#### New Icon Buttons ✅

- [ ] Search icon (🔍) visible in header
- [ ] Heart icon (❤️) visible in header
- [ ] Icons properly sized and aligned
- [ ] Icons have appropriate spacing
- [ ] Icons stand out from background

#### Search Icon 🔍

- [ ] Tapping navigates to `/jobs/search`
- [ ] Navigation is smooth
- [ ] Back from search returns to jobs tab
- [ ] Search state resets on navigation

#### Saved Jobs Icon ❤️

- [ ] Tapping navigates to `/jobs/saved`
- [ ] Navigation is smooth
- [ ] Back from saved returns to jobs tab
- [ ] Saved jobs reload on navigation

#### Existing Buttons Still Work 🔘

- [ ] "Categories" button still functions
- [ ] "Active" button still navigates
- [ ] "My Applications" button still works
- [ ] All buttons have proper styling

### Complete Navigation Flow 🗺️

Test the full navigation path:

**Path 1: Jobs → Search → Job Detail**

- [ ] Jobs tab → Search icon → Search screen
- [ ] Search screen → Job card → Job detail
- [ ] Job detail → Back → Search screen
- [ ] Search screen → Back → Jobs tab

**Path 2: Jobs → Saved → Job Detail**

- [ ] Jobs tab → Heart icon → Saved jobs
- [ ] Saved jobs → Job card → Job detail
- [ ] Job detail → Back → Saved jobs
- [ ] Saved jobs → Back → Jobs tab

**Path 3: Jobs → Categories → Filtered → Job Detail**

- [ ] Jobs tab → Categories → Category grid
- [ ] Category grid → Category → Filtered jobs
- [ ] Filtered jobs → Job card → Job detail
- [ ] Job detail → Back → Filtered jobs
- [ ] Filtered jobs → Back → Category grid
- [ ] Category grid → Back → Jobs tab

**Path 4: Cross-Navigation**

- [ ] Job detail → SaveButton → Job saved
- [ ] Job detail → Back → Previous screen
- [ ] Navigate to Saved jobs → See saved job
- [ ] Unsave from Saved → Job removed
- [ ] Navigate back to Job detail → Heart outline

---

## 🔄 Part 6: Data Synchronization

### Save/Unsave Sync 🔄

- [ ] Saving job updates all screens
- [ ] Unsaving job updates all screens
- [ ] Saved count updates across app
- [ ] Heart icon syncs everywhere
- [ ] Recent actions reflected immediately

### Query Invalidation ✅

After saving a job:

- [ ] Saved jobs list invalidates/refetches
- [ ] Job detail shows saved state
- [ ] Browse screens show saved state (if displayed)

After unsaving a job:

- [ ] Job removed from saved jobs list
- [ ] Job detail shows unsaved state
- [ ] Count badge updates

### Cache Behavior 💾

- [ ] Categories cache for 1 hour
- [ ] Jobs refetch on screen focus
- [ ] Saved jobs refetch on navigation
- [ ] Search results cache appropriately
- [ ] Stale data doesn't persist

---

## 🎨 Part 7: UI/UX Consistency

### Typography Consistency ✍️

- [ ] All headings use `Typography.heading.h3/h4`
- [ ] All body text uses `Typography.body.medium/small`
- [ ] Font weights consistent (400/600/700)
- [ ] Line heights appropriate

### Color Consistency 🎨

- [ ] Primary blue (#54B7EC) used correctly
- [ ] Success green (#10B981) for budgets
- [ ] Error red (#EF4444) for hearts/urgent
- [ ] Text colors match theme
- [ ] Background colors consistent

### Spacing & Borders 📏

- [ ] Padding consistent across screens
- [ ] Card spacing uniform (Spacing.md)
- [ ] Border radius consistent (BorderRadius.lg)
- [ ] Shadows appropriate (Shadows.medium)

### Icons & Badges 🏷️

- [ ] Ionicons used throughout
- [ ] Icon sizes consistent (20-24px)
- [ ] Badge styles uniform
- [ ] Badge colors match urgency/status

---

## ⚡ Part 8: Performance Testing

### Load Times ⏱️

- [ ] Categories load < 2 seconds
- [ ] Filtered jobs load < 2 seconds
- [ ] Search results appear < 1 second (after debounce)
- [ ] Saved jobs load < 1 second
- [ ] Job detail loads < 1 second

### Scroll Performance 📜

- [ ] Smooth 60fps scrolling
- [ ] No lag with 50+ items
- [ ] Infinite scroll smooth
- [ ] Pull-to-refresh smooth
- [ ] No frame drops

### Memory Usage 💾

- [ ] No memory leaks on navigation
- [ ] Images load efficiently
- [ ] Query cache doesn't grow excessively
- [ ] App doesn't crash with heavy use

### Network Efficiency 🌐

- [ ] Debouncing prevents API spam (500ms)
- [ ] Pagination reduces data load
- [ ] Caching reduces redundant requests
- [ ] Failed requests retry gracefully

---

## 🐛 Part 9: Error Handling

### Network Errors 📡

- [ ] Offline mode shows error state
- [ ] Error message is user-friendly
- [ ] Retry button available
- [ ] Retry button works
- [ ] Connection restored shows success

### API Errors 🚫

- [ ] 404 errors handled (job not found)
- [ ] 401 errors handled (unauthorized)
- [ ] 500 errors handled (server error)
- [ ] Timeout errors handled
- [ ] Error messages clear and actionable

### Input Validation ✅

- [ ] Empty search handled
- [ ] Invalid budget range handled
- [ ] Special characters in search work
- [ ] Max character limits enforced
- [ ] Number inputs only accept numbers

### Edge Case Errors 🔬

- [ ] Saving already saved job
- [ ] Unsaving already unsaved job
- [ ] Navigating to deleted job
- [ ] Concurrent save/unsave actions
- [ ] Filter with no results

---

## 📱 Part 10: Device-Specific Testing

### iOS Testing (iPhone) 📱

- [ ] Safe area respected (notch/island)
- [ ] Status bar styling correct
- [ ] Keyboard behavior correct
- [ ] Pull-to-refresh works
- [ ] Swipe gestures work
- [ ] Navigation animations smooth

### Android Testing 🤖

- [ ] Status bar styling correct
- [ ] Back button works everywhere
- [ ] Keyboard behavior correct
- [ ] Pull-to-refresh works
- [ ] Material design respected
- [ ] Navigation animations smooth

### Tablet Testing 📲

- [ ] Layout scales appropriately
- [ ] Larger screens utilize space
- [ ] Touch targets appropriate size
- [ ] Navigation works on tablets

### Different Screen Sizes 📐

- [ ] Small phones (iPhone SE)
- [ ] Large phones (iPhone Pro Max)
- [ ] Different aspect ratios
- [ ] Landscape orientation (optional)

---

## ♿ Part 11: Accessibility

### Touch Targets 👆

- [ ] All buttons > 44x44 points
- [ ] Icons touchable area adequate
- [ ] Cards have enough padding
- [ ] No overlapping touch areas

### Text Readability 👓

- [ ] Font sizes readable (minimum 12px)
- [ ] Contrast ratios meet standards
- [ ] Text not too light on backgrounds
- [ ] Long text truncates or wraps

### Screen Reader Support 🔊

- [ ] Icons have labels
- [ ] Buttons have labels
- [ ] Images have descriptions
- [ ] Form inputs have labels

---

## 🔒 Part 12: Security & Privacy

### Authentication 🔐

- [ ] Unauthenticated users redirected
- [ ] Session expires handled
- [ ] Credentials included in requests
- [ ] Token refresh works

### Data Privacy 🛡️

- [ ] Recent searches local only
- [ ] Saved jobs require authentication
- [ ] User data not leaked
- [ ] HTTPS used for all requests

---

## ✅ Final Checklist

### Code Quality 💻

- [ ] 0 TypeScript errors
- [ ] 0 console warnings
- [ ] No deprecated code
- [ ] Clean console logs (no debug logs)

### Documentation 📚

- [ ] All screens documented
- [ ] API endpoints documented
- [ ] Navigation flows documented
- [ ] Known issues documented

### Deployment Readiness 🚀

- [ ] All features working
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] User feedback incorporated

---

## 📝 Bug Tracking Template

When bugs are found, document them here:

### Bug #1

- **Screen**: [Screen name]
- **Description**: [What went wrong]
- **Steps to Reproduce**:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- **Expected**: [What should happen]
- **Actual**: [What actually happened]
- **Severity**: [Critical/High/Medium/Low]
- **Status**: [Open/In Progress/Fixed/Closed]

---

## 🎯 Testing Sign-Off

### Testers

- [ ] QA Tester 1: ********\_******** Date: ****\_****
- [ ] QA Tester 2: ********\_******** Date: ****\_****
- [ ] Developer: ********\_******** Date: ****\_****
- [ ] Product Owner: ********\_******** Date: ****\_****

### Approval

- [ ] All critical tests pass
- [ ] All high-priority tests pass
- [ ] Known issues documented
- [ ] Ready for production: YES / NO

**Notes**:

---

---

---

---

**QA Checklist Version**: 1.0  
**Last Updated**: November 14, 2025  
**Phase**: Mobile Phase 3  
**Total Test Cases**: 400+
