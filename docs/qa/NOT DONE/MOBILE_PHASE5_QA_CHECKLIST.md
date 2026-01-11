# Mobile Phase 5 - QA Testing Checklist

**Phase**: 5 - Avatar & Portfolio Photo Upload System  
**Date**: November 14, 2025  
**Status**: Ready for Testing  
**Tester**: ****\_\_\_****  
**Build Version**: ****\_\_\_****

---

## 📋 Testing Overview

This checklist covers comprehensive testing for Phase 5 features. Mark each test as:

- ✅ **PASS** - Feature works as expected
- ❌ **FAIL** - Feature has issues (note in Bug Tracking section)
- ⚠️ **PARTIAL** - Feature works with minor issues
- ⏭️ **SKIP** - Not applicable or deferred

---

## 1️⃣ Avatar Upload System

### 1.1 Avatar Upload Screen

| #     | Test Case                                     | Status | Notes |
| ----- | --------------------------------------------- | ------ | ----- |
| 1.1.1 | Avatar screen loads from profile index        | ⬜     |       |
| 1.1.2 | Current avatar displays if exists             | ⬜     |       |
| 1.1.3 | Placeholder shows if no avatar                | ⬜     |       |
| 1.1.4 | "Choose Photo" button visible                 | ⬜     |       |
| 1.1.5 | "Delete Avatar" button shows if avatar exists | ⬜     |       |
| 1.1.6 | Back button navigates to profile              | ⬜     |       |

### 1.2 Avatar Photo Selection

| #     | Test Case                                    | Status | Notes |
| ----- | -------------------------------------------- | ------ | ----- |
| 1.2.1 | Dialog shows "Take Photo" and "Choose Photo" | ⬜     |       |
| 1.2.2 | Camera permission requested on "Take Photo"  | ⬜     |       |
| 1.2.3 | Gallery permission requested on "Choose"     | ⬜     |       |
| 1.2.4 | Camera opens with square aspect ratio        | ⬜     |       |
| 1.2.5 | Gallery opens with allowsEditing=true        | ⬜     |       |
| 1.2.6 | Canceling selection returns to screen        | ⬜     |       |
| 1.2.7 | Selected image shows preview                 | ⬜     |       |
| 1.2.8 | Permission denial shows alert                | ⬜     |       |

### 1.3 Avatar Image Compression

| #     | Test Case                        | Status | Notes |
| ----- | -------------------------------- | ------ | ----- |
| 1.3.1 | Images <2MB skip compression     | ⬜     |       |
| 1.3.2 | Images ≥2MB get compressed       | ⬜     |       |
| 1.3.3 | Compression resizes to 1200x1200 | ⬜     |       |
| 1.3.4 | Compression uses quality 0.8     | ⬜     |       |
| 1.3.5 | Compressed images are <2MB       | ⬜     |       |
| 1.3.6 | Compression error shows toast    | ⬜     |       |

### 1.4 Avatar Upload Process

| #     | Test Case                                 | Status | Notes |
| ----- | ----------------------------------------- | ------ | ----- |
| 1.4.1 | Upload starts immediately after selection | ⬜     |       |
| 1.4.2 | Progress bar shows 0-100%                 | ⬜     |       |
| 1.4.3 | Progress percentage displays numerically  | ⬜     |       |
| 1.4.4 | Upload completes successfully             | ⬜     |       |
| 1.4.5 | Success toast shows "Avatar uploaded!"    | ⬜     |       |
| 1.4.6 | Avatar updates in preview                 | ⬜     |       |
| 1.4.7 | Upload error shows error toast            | ⬜     |       |
| 1.4.8 | Network error handled gracefully          | ⬜     |       |
| 1.4.9 | Upload can be retried after error         | ⬜     |       |

### 1.5 Avatar Deletion

| #     | Test Case                                    | Status | Notes |
| ----- | -------------------------------------------- | ------ | ----- |
| 1.5.1 | "Delete Avatar" button triggers confirmation | ⬜     |       |
| 1.5.2 | Confirmation dialog shows "Delete Avatar?"   | ⬜     |       |
| 1.5.3 | Cancel button dismisses dialog               | ⬜     |       |
| 1.5.4 | Delete button removes avatar                 | ⬜     |       |
| 1.5.5 | Success toast shows "Avatar deleted"         | ⬜     |       |
| 1.5.6 | Avatar reverts to placeholder                | ⬜     |       |
| 1.5.7 | Delete error shows error toast               | ⬜     |       |
| 1.5.8 | Profile completion percentage updates        | ⬜     |       |

### 1.6 Avatar Integration

| #     | Test Case                               | Status | Notes |
| ----- | --------------------------------------- | ------ | ----- |
| 1.6.1 | Avatar press on profile index navigates | ⬜     |       |
| 1.6.2 | Avatar updates appear in profile index  | ⬜     |       |
| 1.6.3 | Avatar edit overlay visible on profile  | ⬜     |       |
| 1.6.4 | Profile completion updates after upload | ⬜     |       |
| 1.6.5 | Avatar persists after app restart       | ⬜     |       |
| 1.6.6 | Avatar displays correctly in app header | ⬜     |       |

---

## 2️⃣ Portfolio Management System

### 2.1 Portfolio Upload Screen (Edit Profile)

| #     | Test Case                                 | Status | Notes |
| ----- | ----------------------------------------- | ------ | ----- |
| 2.1.1 | Portfolio section visible in edit profile | ⬜     |       |
| 2.1.2 | "Add Portfolio Images" button shows       | ⬜     |       |
| 2.1.3 | Image counter shows "X / 10"              | ⬜     |       |
| 2.1.4 | Add button disabled when 10 images        | ⬜     |       |
| 2.1.5 | Existing portfolio images load            | ⬜     |       |
| 2.1.6 | Empty state shows when no images          | ⬜     |       |

### 2.2 Multi-Image Selection

| #     | Test Case                                  | Status | Notes |
| ----- | ------------------------------------------ | ------ | ----- |
| 2.2.1 | Gallery opens with allowsMultipleSelection | ⬜     |       |
| 2.2.2 | Can select 1 image                         | ⬜     |       |
| 2.2.3 | Can select up to 5 images at once          | ⬜     |       |
| 2.2.4 | Max selectable adjusts based on limit (10) | ⬜     |       |
| 2.2.5 | Alert shows if trying to exceed 10 limit   | ⬜     |       |
| 2.2.6 | Selected images show in upload queue       | ⬜     |       |
| 2.2.7 | Image order matches selection order        | ⬜     |       |

### 2.3 Upload Queue Display

| #     | Test Case                                 | Status | Notes |
| ----- | ----------------------------------------- | ------ | ----- |
| 2.3.1 | Queue shows 80x80 thumbnails              | ⬜     |       |
| 2.3.2 | File size displays under each image       | ⬜     |       |
| 2.3.3 | Caption input shows for each image        | ⬜     |       |
| 2.3.4 | Caption placeholder says "Add caption..." | ⬜     |       |
| 2.3.5 | Character counter shows "0/200"           | ⬜     |       |
| 2.3.6 | Remove button (X) visible on each item    | ⬜     |       |
| 2.3.7 | Status indicator shows per image          | ⬜     |       |
| 2.3.8 | Queue scrolls horizontally                | ⬜     |       |

### 2.4 Caption Input

| #     | Test Case                                | Status | Notes |
| ----- | ---------------------------------------- | ------ | ----- |
| 2.4.1 | Caption input accepts text               | ⬜     |       |
| 2.4.2 | Character counter updates on typing      | ⬜     |       |
| 2.4.3 | Max length enforced at 200 characters    | ⬜     |       |
| 2.4.4 | Counter turns red when approaching limit | ⬜     |       |
| 2.4.5 | Caption persists when switching items    | ⬜     |       |
| 2.4.6 | Empty caption allowed (optional)         | ⬜     |       |
| 2.4.7 | Caption saves with image upload          | ⬜     |       |

### 2.5 Image Compression (Portfolio)

| #     | Test Case                                | Status | Notes |
| ----- | ---------------------------------------- | ------ | ----- |
| 2.5.1 | Images <2MB skip compression             | ⬜     |       |
| 2.5.2 | Images ≥2MB get compressed before upload | ⬜     |       |
| 2.5.3 | Compression resizes to 1200x1200         | ⬜     |       |
| 2.5.4 | Compression quality set to 0.8           | ⬜     |       |
| 2.5.5 | File size recalculates after compression | ⬜     |       |
| 2.5.6 | Compression status shows in queue        | ⬜     |       |
| 2.5.7 | Compression error shows toast            | ⬜     |       |

### 2.6 Sequential Upload Process

| #      | Test Case                                    | Status | Notes |
| ------ | -------------------------------------------- | ------ | ----- |
| 2.6.1  | "Upload All" button visible                  | ⬜     |       |
| 2.6.2  | Upload starts sequentially (one at a time)   | ⬜     |       |
| 2.6.3  | Progress bar shows 0-100% per image          | ⬜     |       |
| 2.6.4  | Status changes: queued → uploading → success | ⬜     |       |
| 2.6.5  | Next image starts after previous completes   | ⬜     |       |
| 2.6.6  | Success items show checkmark                 | ⬜     |       |
| 2.6.7  | Upload continues after individual failure    | ⬜     |       |
| 2.6.8  | Failed items show error status               | ⬜     |       |
| 2.6.9  | Toast shows "All images uploaded!"           | ⬜     |       |
| 2.6.10 | Upload queue clears after all success        | ⬜     |       |

### 2.7 Portfolio Grid Display

| #     | Test Case                                     | Status | Notes |
| ----- | --------------------------------------------- | ------ | ----- |
| 2.7.1 | Grid displays in 2 columns                    | ⬜     |       |
| 2.7.2 | Images show with proper spacing               | ⬜     |       |
| 2.7.3 | Images maintain aspect ratio                  | ⬜     |       |
| 2.7.4 | Caption displays below each image             | ⬜     |       |
| 2.7.5 | Relative timestamp shows (e.g., "2 days ago") | ⬜     |       |
| 2.7.6 | Empty state shows when no images              | ⬜     |       |
| 2.7.7 | Grid scrolls vertically                       | ⬜     |       |
| 2.7.8 | Images load progressively                     | ⬜     |       |

### 2.8 Portfolio Image Selection

| #     | Test Case                             | Status | Notes |
| ----- | ------------------------------------- | ------ | ----- |
| 2.8.1 | Long-press activates selection mode   | ⬜     |       |
| 2.8.2 | Selected image shows blue overlay     | ⬜     |       |
| 2.8.3 | Checkmark shows on selected images    | ⬜     |       |
| 2.8.4 | Multiple images can be selected       | ⬜     |       |
| 2.8.5 | Selection count shows in header       | ⬜     |       |
| 2.8.6 | "Delete" button appears when selected | ⬜     |       |
| 2.8.7 | Tap outside exits selection mode      | ⬜     |       |
| 2.8.8 | Back button exits selection mode      | ⬜     |       |

### 2.9 Portfolio Image Reordering

| #     | Test Case                                   | Status | Notes |
| ----- | ------------------------------------------- | ------ | ----- |
| 2.9.1 | Reorder arrows visible on each image        | ⬜     |       |
| 2.9.2 | Up arrow swaps with previous image          | ⬜     |       |
| 2.9.3 | Down arrow swaps with next image            | ⬜     |       |
| 2.9.4 | Up arrow hidden on first image              | ⬜     |       |
| 2.9.5 | Down arrow hidden on last image             | ⬜     |       |
| 2.9.6 | Reorder updates grid immediately            | ⬜     |       |
| 2.9.7 | Reorder persists after save                 | ⬜     |       |
| 2.9.8 | Optimistic update shows before API response | ⬜     |       |
| 2.9.9 | Revert happens if API fails                 | ⬜     |       |

### 2.10 Portfolio Image Deletion

| #      | Test Case                                    | Status | Notes |
| ------ | -------------------------------------------- | ------ | ----- |
| 2.10.1 | Delete button triggers confirmation          | ⬜     |       |
| 2.10.2 | Confirmation shows count (e.g., "Delete 2?") | ⬜     |       |
| 2.10.3 | Cancel dismisses confirmation                | ⬜     |       |
| 2.10.4 | Delete removes selected images               | ⬜     |       |
| 2.10.5 | Success toast shows "X image(s) deleted"     | ⬜     |       |
| 2.10.6 | Grid updates after deletion                  | ⬜     |       |
| 2.10.7 | Selection mode exits after delete            | ⬜     |       |
| 2.10.8 | Delete error shows error toast               | ⬜     |       |
| 2.10.9 | Image counter updates after delete           | ⬜     |       |

---

## 3️⃣ Image Viewer (Lightbox)

### 3.1 Viewer Opening

| #     | Test Case                                 | Status | Notes |
| ----- | ----------------------------------------- | ------ | ----- |
| 3.1.1 | Tapping image on profile opens viewer     | ⬜     |       |
| 3.1.2 | Tapping image in edit screen opens viewer | ⬜     |       |
| 3.1.3 | Viewer opens with tapped image displayed  | ⬜     |       |
| 3.1.4 | Viewer opens full-screen                  | ⬜     |       |
| 3.1.5 | Viewer shows correct initial image        | ⬜     |       |
| 3.1.6 | Viewer blocks background interaction      | ⬜     |       |

### 3.2 Image Display

| #     | Test Case                             | Status | Notes |
| ----- | ------------------------------------- | ------ | ----- |
| 3.2.1 | Image fills screen width              | ⬜     |       |
| 3.2.2 | Image maintains aspect ratio          | ⬜     |       |
| 3.2.3 | Image centers vertically              | ⬜     |       |
| 3.2.4 | High-resolution image loads           | ⬜     |       |
| 3.2.5 | Loading indicator shows while loading | ⬜     |       |
| 3.2.6 | Image zooming works (pinch gestures)  | ⬜     |       |
| 3.2.7 | Black background displays             | ⬜     |       |

### 3.3 Navigation Controls

| #     | Test Case                              | Status | Notes |
| ----- | -------------------------------------- | ------ | ----- |
| 3.3.1 | Close button (X) visible in top-right  | ⬜     |       |
| 3.3.2 | Close button exits viewer              | ⬜     |       |
| 3.3.3 | Image counter shows "X of Y"           | ⬜     |       |
| 3.3.4 | Counter updates on navigation          | ⬜     |       |
| 3.3.5 | Header fades on inactivity (3 seconds) | ⬜     |       |
| 3.3.6 | Tap anywhere shows/hides controls      | ⬜     |       |

### 3.4 Swipe Navigation

| #     | Test Case                              | Status | Notes |
| ----- | -------------------------------------- | ------ | ----- |
| 3.4.1 | Swipe left goes to next image          | ⬜     |       |
| 3.4.2 | Swipe right goes to previous image     | ⬜     |       |
| 3.4.3 | Left arrow button shows when not first | ⬜     |       |
| 3.4.4 | Right arrow button shows when not last | ⬜     |       |
| 3.4.5 | Left arrow navigates to previous       | ⬜     |       |
| 3.4.6 | Right arrow navigates to next          | ⬜     |       |
| 3.4.7 | Can't swipe left on first image        | ⬜     |       |
| 3.4.8 | Can't swipe right on last image        | ⬜     |       |
| 3.4.9 | Smooth transition between images       | ⬜     |       |

### 3.5 Caption Display (Viewer)

| #     | Test Case                              | Status | Notes |
| ----- | -------------------------------------- | ------ | ----- |
| 3.5.1 | Caption shows in footer if present     | ⬜     |       |
| 3.5.2 | Footer hidden if no caption            | ⬜     |       |
| 3.5.3 | Caption text readable (white on dark)  | ⬜     |       |
| 3.5.4 | Long captions scroll or wrap           | ⬜     |       |
| 3.5.5 | Caption updates on image navigation    | ⬜     |       |
| 3.5.6 | Footer fades with header on inactivity | ⬜     |       |

### 3.6 Edit Mode (Viewer)

| #     | Test Case                                      | Status | Notes |
| ----- | ---------------------------------------------- | ------ | ----- |
| 3.6.1 | Edit icon visible in header (editable=true)    | ⬜     |       |
| 3.6.2 | Edit icon hidden in view mode (editable=false) | ⬜     |       |
| 3.6.3 | Edit button opens caption editor               | ⬜     |       |
| 3.6.4 | Caption input shows current caption            | ⬜     |       |
| 3.6.5 | Character counter shows in editor              | ⬜     |       |
| 3.6.6 | Save button updates caption                    | ⬜     |       |
| 3.6.7 | Cancel button dismisses editor                 | ⬜     |       |
| 3.6.8 | Success toast shows "Caption updated"          | ⬜     |       |
| 3.6.9 | Updated caption displays immediately           | ⬜     |       |

### 3.7 Viewer Integration

| #     | Test Case                              | Status | Notes |
| ----- | -------------------------------------- | ------ | ----- |
| 3.7.1 | Viewer works from profile index screen | ⬜     |       |
| 3.7.2 | Viewer works from profile edit screen  | ⬜     |       |
| 3.7.3 | Viewer respects editable prop          | ⬜     |       |
| 3.7.4 | Back button on device exits viewer     | ⬜     |       |
| 3.7.5 | Viewer handles single image correctly  | ⬜     |       |
| 3.7.6 | Viewer handles 10 images correctly     | ⬜     |       |

---

## 4️⃣ API Integration Testing

### 4.1 Avatar API Endpoints

| #     | Test Case                                 | Status | Notes |
| ----- | ----------------------------------------- | ------ | ----- |
| 4.1.1 | POST /api/mobile/profile/avatar uploads   | ⬜     |       |
| 4.1.2 | Upload returns 200 status on success      | ⬜     |       |
| 4.1.3 | Upload returns avatar URL in response     | ⬜     |       |
| 4.1.4 | DELETE /api/mobile/profile/avatar deletes | ⬜     |       |
| 4.1.5 | Delete returns 200 on success             | ⬜     |       |
| 4.1.6 | 401 returned if not authenticated         | ⬜     |       |
| 4.1.7 | 400 returned for invalid file type        | ⬜     |       |
| 4.1.8 | 413 returned for files >10MB              | ⬜     |       |

### 4.2 Portfolio API Endpoints

| #      | Test Case                                   | Status | Notes |
| ------ | ------------------------------------------- | ------ | ----- |
| 4.2.1  | POST /api/mobile/profile/portfolio uploads  | ⬜     |       |
| 4.2.2  | Upload with caption saves caption           | ⬜     |       |
| 4.2.3  | Upload without caption accepts null         | ⬜     |       |
| 4.2.4  | GET /api/mobile/profile/portfolio lists     | ⬜     |       |
| 4.2.5  | List returns images ordered by displayOrder | ⬜     |       |
| 4.2.6  | PUT /portfolio/{id} updates caption         | ⬜     |       |
| 4.2.7  | PUT /portfolio/reorder updates order        | ⬜     |       |
| 4.2.8  | DELETE /portfolio/{id} deletes image        | ⬜     |       |
| 4.2.9  | 404 returned for non-existent image ID      | ⬜     |       |
| 4.2.10 | 403 returned for other user's images        | ⬜     |       |

### 4.3 Error Handling

| #     | Test Case                              | Status | Notes |
| ----- | -------------------------------------- | ------ | ----- |
| 4.3.1 | Network timeout shows error message    | ⬜     |       |
| 4.3.2 | Server 500 error shows generic message | ⬜     |       |
| 4.3.3 | Invalid token redirects to login       | ⬜     |       |
| 4.3.4 | Upload retry works after network error | ⬜     |       |
| 4.3.5 | API error message displays in toast    | ⬜     |       |

---

## 5️⃣ Data Persistence & Caching

### 5.1 Query Caching

| #     | Test Case                               | Status | Notes |
| ----- | --------------------------------------- | ------ | ----- |
| 5.1.1 | Portfolio images cached for 5 minutes   | ⬜     |       |
| 5.1.2 | Profile completion cached for 5 minutes | ⬜     |       |
| 5.1.3 | Cache invalidates on upload             | ⬜     |       |
| 5.1.4 | Cache invalidates on delete             | ⬜     |       |
| 5.1.5 | Cache invalidates on reorder            | ⬜     |       |
| 5.1.6 | Stale data refetches in background      | ⬜     |       |

### 5.2 Optimistic Updates

| #     | Test Case                                  | Status | Notes |
| ----- | ------------------------------------------ | ------ | ----- |
| 5.2.1 | Avatar updates immediately on upload       | ⬜     |       |
| 5.2.2 | Portfolio adds to grid before API response | ⬜     |       |
| 5.2.3 | Reorder updates grid before API response   | ⬜     |       |
| 5.2.4 | Delete removes from grid immediately       | ⬜     |       |
| 5.2.5 | Optimistic update reverts on error         | ⬜     |       |

### 5.3 Data Sync

| #     | Test Case                                  | Status | Notes |
| ----- | ------------------------------------------ | ------ | ----- |
| 5.3.1 | Profile completion updates after avatar    | ⬜     |       |
| 5.3.2 | Profile completion updates after portfolio | ⬜     |       |
| 5.3.3 | Portfolio count badge updates in edit      | ⬜     |       |
| 5.3.4 | Avatar updates in all screens              | ⬜     |       |
| 5.3.5 | Changes persist after app restart          | ⬜     |       |

---

## 6️⃣ Performance Testing

### 6.1 Upload Performance

| #     | Test Case                                   | Status | Notes |
| ----- | ------------------------------------------- | ------ | ----- |
| 6.1.1 | Avatar <500KB uploads in <5 seconds         | ⬜     |       |
| 6.1.2 | Avatar 2-5MB compresses and uploads <10s    | ⬜     |       |
| 6.1.3 | Portfolio image uploads in <5 seconds each  | ⬜     |       |
| 6.1.4 | 5 images upload sequentially in <30 seconds | ⬜     |       |
| 6.1.5 | Progress bar updates smoothly (no jumps)    | ⬜     |       |
| 6.1.6 | Upload doesn't block UI (app responsive)    | ⬜     |       |

### 6.2 Image Loading Performance

| #     | Test Case                          | Status | Notes |
| ----- | ---------------------------------- | ------ | ----- |
| 6.2.1 | Portfolio grid loads in <2 seconds | ⬜     |       |
| 6.2.2 | Lightbox image loads in <2 seconds | ⬜     |       |
| 6.2.3 | Thumbnails render without lag      | ⬜     |       |
| 6.2.4 | Scrolling grid is smooth (60fps)   | ⬜     |       |
| 6.2.5 | Image viewer swipe is smooth       | ⬜     |       |

### 6.3 Memory & Battery

| #     | Test Case                                     | Status | Notes |
| ----- | --------------------------------------------- | ------ | ----- |
| 6.3.1 | No memory leaks during repeated uploads       | ⬜     |       |
| 6.3.2 | App memory usage stays <200MB                 | ⬜     |       |
| 6.3.3 | No excessive battery drain during upload      | ⬜     |       |
| 6.3.4 | Images released from memory after viewer exit | ⬜     |       |

---

## 7️⃣ UI/UX Testing

### 7.1 Layout & Responsiveness

| #     | Test Case                                  | Status | Notes |
| ----- | ------------------------------------------ | ------ | ----- |
| 7.1.1 | All screens adapt to portrait orientation  | ⬜     |       |
| 7.1.2 | All screens adapt to landscape orientation | ⬜     |       |
| 7.1.3 | Small screens (iPhone SE) render correctly | ⬜     |       |
| 7.1.4 | Large screens (iPad) render correctly      | ⬜     |       |
| 7.1.5 | Text scales with device font size          | ⬜     |       |
| 7.1.6 | Touch targets are at least 44x44           | ⬜     |       |

### 7.2 Visual Design

| #     | Test Case                            | Status | Notes |
| ----- | ------------------------------------ | ------ | ----- |
| 7.2.1 | Colors match theme constants         | ⬜     |       |
| 7.2.2 | Typography consistent across screens | ⬜     |       |
| 7.2.3 | Spacing consistent (8px grid)        | ⬜     |       |
| 7.2.4 | Border radius consistent             | ⬜     |       |
| 7.2.5 | Shadows render correctly             | ⬜     |       |
| 7.2.6 | Icons render at correct sizes        | ⬜     |       |
| 7.2.7 | Images don't appear distorted        | ⬜     |       |

### 7.3 Animations & Transitions

| #     | Test Case                        | Status | Notes |
| ----- | -------------------------------- | ------ | ----- |
| 7.3.1 | Screen transitions are smooth    | ⬜     |       |
| 7.3.2 | Modal animations work correctly  | ⬜     |       |
| 7.3.3 | Progress bar animates smoothly   | ⬜     |       |
| 7.3.4 | Image viewer fade in/out works   | ⬜     |       |
| 7.3.5 | Selection mode animations smooth | ⬜     |       |
| 7.3.6 | No animation stuttering or lag   | ⬜     |       |

### 7.4 Feedback & Indicators

| #     | Test Case                               | Status | Notes |
| ----- | --------------------------------------- | ------ | ----- |
| 7.4.1 | Loading spinners show during operations | ⬜     |       |
| 7.4.2 | Success toasts appear and auto-dismiss  | ⬜     |       |
| 7.4.3 | Error toasts appear and persist         | ⬜     |       |
| 7.4.4 | Progress bars show accurate percentage  | ⬜     |       |
| 7.4.5 | Buttons show pressed state              | ⬜     |       |
| 7.4.6 | Disabled buttons appear grayed out      | ⬜     |       |

---

## 8️⃣ Platform-Specific Testing

### 8.1 iOS Testing

| #     | Test Case                                 | Status | Notes |
| ----- | ----------------------------------------- | ------ | ----- |
| 8.1.1 | Camera permission prompt shows iOS style  | ⬜     |       |
| 8.1.2 | Gallery permission prompt shows iOS style | ⬜     |       |
| 8.1.3 | Native camera UI works correctly          | ⬜     |       |
| 8.1.4 | Native photo picker works correctly       | ⬜     |       |
| 8.1.5 | Keyboard avoids input fields              | ⬜     |       |
| 8.1.6 | Safe area insets respected                | ⬜     |       |
| 8.1.7 | Haptic feedback works on interactions     | ⬜     |       |
| 8.1.8 | Swipe-back gesture works                  | ⬜     |       |

### 8.2 Android Testing

| #     | Test Case                                     | Status | Notes |
| ----- | --------------------------------------------- | ------ | ----- |
| 8.2.1 | Camera permission prompt shows Android style  | ⬜     |       |
| 8.2.2 | Gallery permission prompt shows Android style | ⬜     |       |
| 8.2.3 | Native camera UI works correctly              | ⬜     |       |
| 8.2.4 | Native photo picker works correctly           | ⬜     |       |
| 8.2.5 | Keyboard avoids input fields                  | ⬜     |       |
| 8.2.6 | Back button works on all screens              | ⬜     |       |
| 8.2.7 | System navigation bar respected               | ⬜     |       |
| 8.2.8 | Upload notification shows progress (optional) | ⬜     |       |

---

## 9️⃣ Edge Cases & Stress Testing

### 9.1 Edge Cases

| #      | Test Case                                    | Status | Notes |
| ------ | -------------------------------------------- | ------ | ----- |
| 9.1.1  | Upload 10 images to hit limit                | ⬜     |       |
| 9.1.2  | Try uploading 11th image (should be blocked) | ⬜     |       |
| 9.1.3  | Delete all 10 images and re-upload           | ⬜     |       |
| 9.1.4  | Upload image with extremely long caption     | ⬜     |       |
| 9.1.5  | Upload very small image (<50KB)              | ⬜     |       |
| 9.1.6  | Upload very large image (>8MB)               | ⬜     |       |
| 9.1.7  | Upload image with special chars in filename  | ⬜     |       |
| 9.1.8  | Upload portrait vs landscape images          | ⬜     |       |
| 9.1.9  | Upload square images                         | ⬜     |       |
| 9.1.10 | Reorder when only 1 image exists             | ⬜     |       |

### 9.2 Network Conditions

| #     | Test Case                                | Status | Notes |
| ----- | ---------------------------------------- | ------ | ----- |
| 9.2.1 | Upload on WiFi works                     | ⬜     |       |
| 9.2.2 | Upload on 4G/LTE works                   | ⬜     |       |
| 9.2.3 | Upload on slow 3G completes              | ⬜     |       |
| 9.2.4 | Upload shows error on no connection      | ⬜     |       |
| 9.2.5 | Upload interrupted by connection loss    | ⬜     |       |
| 9.2.6 | Resume upload after regaining connection | ⬜     |       |
| 9.2.7 | Timeout error shows after 60 seconds     | ⬜     |       |

### 9.3 App State Changes

| #     | Test Case                                     | Status | Notes |
| ----- | --------------------------------------------- | ------ | ----- |
| 9.3.1 | Upload continues when app backgrounds         | ⬜     |       |
| 9.3.2 | Upload state restored when app foregrounds    | ⬜     |       |
| 9.3.3 | Viewer closes gracefully when app backgrounds | ⬜     |       |
| 9.3.4 | Data persists after app is force-closed       | ⬜     |       |
| 9.3.5 | Camera returns to app after photo taken       | ⬜     |       |
| 9.3.6 | Gallery returns to app after selection        | ⬜     |       |

### 9.4 Concurrent Operations

| #     | Test Case                                    | Status | Notes |
| ----- | -------------------------------------------- | ------ | ----- |
| 9.4.1 | Can't start 2nd upload while 1st uploading   | ⬜     |       |
| 9.4.2 | Delete during upload shows appropriate error | ⬜     |       |
| 9.4.3 | Reorder during upload is disabled            | ⬜     |       |
| 9.4.4 | Edit caption while viewing works             | ⬜     |       |
| 9.4.5 | Navigate away during upload preserves state  | ⬜     |       |

---

## 🐛 Bug Tracking

| Bug # | Screen/Feature | Description | Severity | Status | Notes |
| ----- | -------------- | ----------- | -------- | ------ | ----- |
| 1     |                |             |          | ⬜     |       |
| 2     |                |             |          | ⬜     |       |
| 3     |                |             |          | ⬜     |       |

**Severity Levels**:

- 🔴 **Critical** - Blocks core functionality
- 🟡 **Major** - Significant impact, workaround exists
- 🟢 **Minor** - Cosmetic or low-impact issue

---

## 📊 Test Summary

### Test Coverage

- **Total Test Cases**: 310
- **Passed**: \_\_\_
- **Failed**: \_\_\_
- **Partial**: \_\_\_
- **Skipped**: \_\_\_
- **Pass Rate**: **\_\_\_%**

### Test Execution Time

- **Start Date**: \_\_\_\_\_\_\_\_\_
- **End Date**: \_\_\_\_\_\_\_\_\_
- **Total Time**: \_\_\_\_ hours

### Devices Tested

- [ ] iOS Simulator (iPhone 15 Pro)
- [ ] iOS Device (iPhone \_\_\_\_)
- [ ] Android Emulator (Pixel \_\_\_\_)
- [ ] Android Device (\_\_\_\_\_\_\_\_)

### Critical Issues Found

1. \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
2. \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
3. \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

### Recommendations

- \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
- \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
- \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## ✅ Sign-Off

- **QA Tester**: \_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_\_
- **Product Owner**: \_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_\_
- **Tech Lead**: \_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_\_

---

**Phase 5 Status**: Ready for Production ✅ / Needs Revisions ❌
