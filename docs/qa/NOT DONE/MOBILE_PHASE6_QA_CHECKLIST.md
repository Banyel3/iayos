# Mobile Phase 6 - QA Testing Checklist

**Phase**: 6 - Certifications & Materials Management  
**Date**: November 14, 2025  
**Status**: Ready for Testing  
**Tester**: **\_\_\_**  
**Build Version**: **\_\_\_**

---

## 📋 Testing Overview

This checklist covers comprehensive testing for Phase 6 features. Mark each test as:

- ✅ **PASS** - Feature works as expected
- ❌ **FAIL** - Feature has issues (note in Bug Tracking section)
- ⚠️ **PARTIAL** - Feature works with minor issues
- ⏭️ **SKIP** - Not applicable or deferred

---

## 🎯 Phase 6 Feature Summary

- **Week 1**: Certifications Management (CRUD, expiry tracking, document upload)
- **Week 2**: Materials Management (CRUD, pricing, availability toggle, optional images)
- **Integration**: Profile view/edit screens with both certifications and materials

---

## 1️⃣ Certifications Management

### 1.1 Certifications List Screen

| #      | Test Case                                      | Status | Notes |
| ------ | ---------------------------------------------- | ------ | ----- |
| 1.1.1  | Screen loads from profile navigation           | ⬜     |       |
| 1.1.2  | Header shows "Certifications" title            | ⬜     |       |
| 1.1.3  | Back button navigates to profile               | ⬜     |       |
| 1.1.4  | Add button (+) visible in header               | ⬜     |       |
| 1.1.5  | Certification count badge shows (if >0)        | ⬜     |       |
| 1.1.6  | Empty state shows when no certifications       | ⬜     |       |
| 1.1.7  | Empty state message says "No certifications"   | ⬜     |       |
| 1.1.8  | "Add Certification" CTA button visible (empty) | ⬜     |       |
| 1.1.9  | Loading spinner shows during fetch             | ⬜     |       |
| 1.1.10 | Error state shows on API failure               | ⬜     |       |
| 1.1.11 | Retry button works in error state              | ⬜     |       |
| 1.1.12 | Pull-to-refresh refreshes list                 | ⬜     |       |

### 1.2 Certification Card Display (Full Mode)

| #      | Test Case                                | Status | Notes |
| ------ | ---------------------------------------- | ------ | ----- |
| 1.2.1  | Certification name displays prominently  | ⬜     |       |
| 1.2.2  | Issuing organization shows below name    | ⬜     |       |
| 1.2.3  | Certificate file icon and name display   | ⬜     |       |
| 1.2.4  | Issue date shows formatted (MMM YYYY)    | ⬜     |       |
| 1.2.5  | Expiry date shows if present (MMM YYYY)  | ⬜     |       |
| 1.2.6  | "No expiry" shows if expiryDate null     | ⬜     |       |
| 1.2.7  | Verification status badge shows          | ⬜     |       |
| 1.2.8  | "Verified" badge is green with checkmark | ⬜     |       |
| 1.2.9  | "Pending" badge is yellow/warning color  | ⬜     |       |
| 1.2.10 | Expiry warning badge shows if <30 days   | ⬜     |       |
| 1.2.11 | Edit button (pencil icon) visible        | ⬜     |       |
| 1.2.12 | Delete button (trash icon) visible       | ⬜     |       |
| 1.2.13 | Card has shadow and proper spacing       | ⬜     |       |

### 1.3 Certification Card Display (Compact Mode)

| #     | Test Case                                | Status | Notes |
| ----- | ---------------------------------------- | ------ | ----- |
| 1.3.1 | Compact card shows in profile screens    | ⬜     |       |
| 1.3.2 | Certification name displays (truncated)  | ⬜     |       |
| 1.3.3 | Organization shows below name            | ⬜     |       |
| 1.3.4 | Certificate icon shows on left           | ⬜     |       |
| 1.3.5 | Verification status icon on right        | ⬜     |       |
| 1.3.6 | Expiry warning icon shows if near expiry | ⬜     |       |
| 1.3.7 | No action buttons in compact mode        | ⬜     |       |
| 1.3.8 | Card press navigates to full list        | ⬜     |       |

### 1.4 Add Certification Modal

| #      | Test Case                                             | Status | Notes |
| ------ | ----------------------------------------------------- | ------ | ----- |
| 1.4.1  | Modal opens from add button                           | ⬜     |       |
| 1.4.2  | Modal title shows "Add Certification"                 | ⬜     |       |
| 1.4.3  | All 5 fields visible (name, org, issue, expiry, file) | ⬜     |       |
| 1.4.4  | Certification Name input accepts text                 | ⬜     |       |
| 1.4.5  | Name validation: min 3 characters                     | ⬜     |       |
| 1.4.6  | Name validation: max 100 characters                   | ⬜     |       |
| 1.4.7  | Issuing Organization input accepts text               | ⬜     |       |
| 1.4.8  | Organization validation: min 2 characters             | ⬜     |       |
| 1.4.9  | Organization validation: max 100 characters           | ⬜     |       |
| 1.4.10 | Issue Date field shows date picker button             | ⬜     |       |
| 1.4.11 | Date picker opens on button press                     | ⬜     |       |
| 1.4.12 | Selected date formats as MMM DD, YYYY                 | ⬜     |       |
| 1.4.13 | Expiry Date field shows optional label                | ⬜     |       |
| 1.4.14 | Expiry date picker works independently                | ⬜     |       |
| 1.4.15 | Certificate file upload button shows                  | ⬜     |       |
| 1.4.16 | File picker opens on button press                     | ⬜     |       |
| 1.4.17 | Selected file name displays                           | ⬜     |       |
| 1.4.18 | File size shows (e.g., "2.5 MB")                      | ⬜     |       |
| 1.4.19 | Remove file button (X) appears after selection        | ⬜     |       |

### 1.5 Add Certification Validation

| #      | Test Case                                         | Status | Notes |
| ------ | ------------------------------------------------- | ------ | ----- |
| 1.5.1  | Name field required (error if empty)              | ⬜     |       |
| 1.5.2  | Name too short shows error (<3 chars)             | ⬜     |       |
| 1.5.3  | Name too long shows error (>100 chars)            | ⬜     |       |
| 1.5.4  | Organization field required (error if empty)      | ⬜     |       |
| 1.5.5  | Organization too short shows error (<2 chars)     | ⬜     |       |
| 1.5.6  | Organization too long shows error (>100 chars)    | ⬜     |       |
| 1.5.7  | Issue date required (error if not selected)       | ⬜     |       |
| 1.5.8  | Expiry date optional (no error if empty)          | ⬜     |       |
| 1.5.9  | Expiry date must be after issue date              | ⬜     |       |
| 1.5.10 | Certificate file required (error if not selected) | ⬜     |       |
| 1.5.11 | Errors show in real-time (on blur)                | ⬜     |       |
| 1.5.12 | Submit disabled if validation errors exist        | ⬜     |       |
| 1.5.13 | All fields valid enables submit button            | ⬜     |       |

### 1.6 Add Certification Upload

| #      | Test Case                                  | Status | Notes |
| ------ | ------------------------------------------ | ------ | ----- |
| 1.6.1  | Submit button triggers upload              | ⬜     |       |
| 1.6.2  | Loading spinner shows during upload        | ⬜     |       |
| 1.6.3  | Submit button disabled during upload       | ⬜     |       |
| 1.6.4  | Upload uses FormData multipart             | ⬜     |       |
| 1.6.5  | Success closes modal                       | ⬜     |       |
| 1.6.6  | Success toast shows "Certification added!" | ⬜     |       |
| 1.6.7  | New certification appears in list          | ⬜     |       |
| 1.6.8  | List refreshes automatically               | ⬜     |       |
| 1.6.9  | Error shows alert dialog with message      | ⬜     |       |
| 1.6.10 | Network error handled gracefully           | ⬜     |       |
| 1.6.11 | Upload can be retried after error          | ⬜     |       |

### 1.7 Edit Certification Modal

| #      | Test Case                                   | Status | Notes |
| ------ | ------------------------------------------- | ------ | ----- |
| 1.7.1  | Modal opens from edit button on card        | ⬜     |       |
| 1.7.2  | Modal title shows "Edit Certification"      | ⬜     |       |
| 1.7.3  | All fields pre-filled with existing data    | ⬜     |       |
| 1.7.4  | Name field shows current name               | ⬜     |       |
| 1.7.5  | Organization shows current organization     | ⬜     |       |
| 1.7.6  | Issue date shows current issue date         | ⬜     |       |
| 1.7.7  | Expiry date shows if exists, else empty     | ⬜     |       |
| 1.7.8  | Existing file name/size displays            | ⬜     |       |
| 1.7.9  | Can edit name field                         | ⬜     |       |
| 1.7.10 | Can edit organization field                 | ⬜     |       |
| 1.7.11 | Can change issue date                       | ⬜     |       |
| 1.7.12 | Can change/remove expiry date               | ⬜     |       |
| 1.7.13 | Cannot re-upload file (backend restriction) | ⬜     |       |
| 1.7.14 | File upload button hidden/disabled in edit  | ⬜     |       |

### 1.8 Edit Certification Update

| #     | Test Case                                    | Status | Notes |
| ----- | -------------------------------------------- | ------ | ----- |
| 1.8.1 | Update button triggers save                  | ⬜     |       |
| 1.8.2 | Loading spinner shows during update          | ⬜     |       |
| 1.8.3 | Update sends only changed fields (partial)   | ⬜     |       |
| 1.8.4 | Success closes modal                         | ⬜     |       |
| 1.8.5 | Success toast shows "Certification updated!" | ⬜     |       |
| 1.8.6 | Updated certification reflects changes       | ⬜     |       |
| 1.8.7 | List refreshes automatically                 | ⬜     |       |
| 1.8.8 | Error shows alert dialog                     | ⬜     |       |
| 1.8.9 | Validation errors prevent update             | ⬜     |       |

### 1.9 Delete Certification

| #      | Test Case                                   | Status | Notes |
| ------ | ------------------------------------------- | ------ | ----- |
| 1.9.1  | Delete button triggers confirmation dialog  | ⬜     |       |
| 1.9.2  | Dialog shows "Delete certification [name]?" | ⬜     |       |
| 1.9.3  | Dialog warns "This cannot be undone"        | ⬜     |       |
| 1.9.4  | Cancel button dismisses dialog              | ⬜     |       |
| 1.9.5  | Delete button confirms deletion             | ⬜     |       |
| 1.9.6  | Loading state during deletion               | ⬜     |       |
| 1.9.7  | Success removes certification from list     | ⬜     |       |
| 1.9.8  | Success toast shows "Certification deleted" | ⬜     |       |
| 1.9.9  | Error shows alert dialog with message       | ⬜     |       |
| 1.9.10 | Deletion can be retried after error         | ⬜     |       |

### 1.10 Unsaved Changes (Certification Modal)

| #      | Test Case                                     | Status | Notes |
| ------ | --------------------------------------------- | ------ | ----- |
| 1.10.1 | Closing modal with changes shows confirmation | ⬜     |       |
| 1.10.2 | Confirmation says "Discard changes?"          | ⬜     |       |
| 1.10.3 | "Stay" button keeps modal open                | ⬜     |       |
| 1.10.4 | "Discard" button closes modal                 | ⬜     |       |
| 1.10.5 | No confirmation if no changes made            | ⬜     |       |
| 1.10.6 | Android back button triggers confirmation     | ⬜     |       |

---

## 2️⃣ Materials Management

### 2.1 Materials List Screen

| #      | Test Case                                 | Status | Notes |
| ------ | ----------------------------------------- | ------ | ----- |
| 2.1.1  | Screen loads from profile navigation      | ⬜     |       |
| 2.1.2  | Header shows "Materials" title            | ⬜     |       |
| 2.1.3  | Back button navigates to profile          | ⬜     |       |
| 2.1.4  | Add button (+) visible in header          | ⬜     |       |
| 2.1.5  | Material count badge shows (if >0)        | ⬜     |       |
| 2.1.6  | Empty state shows when no materials       | ⬜     |       |
| 2.1.7  | Empty state message says "No materials"   | ⬜     |       |
| 2.1.8  | "Add Material" CTA button visible (empty) | ⬜     |       |
| 2.1.9  | Loading spinner shows during fetch        | ⬜     |       |
| 2.1.10 | Error state shows on API failure          | ⬜     |       |
| 2.1.11 | Retry button works in error state         | ⬜     |       |
| 2.1.12 | Pull-to-refresh refreshes list            | ⬜     |       |

### 2.2 Material Card Display (Full Mode)

| #      | Test Case                                   | Status | Notes |
| ------ | ------------------------------------------- | ------ | ----- |
| 2.2.1  | Material name displays prominently          | ⬜     |       |
| 2.2.2  | Description shows below name (2 lines max)  | ⬜     |       |
| 2.2.3  | Material image shows if present             | ⬜     |       |
| 2.2.4  | Cube icon fallback if no image              | ⬜     |       |
| 2.2.5  | Price displays with PHP ₱ symbol            | ⬜     |       |
| 2.2.6  | Unit displays after price (e.g., "/per kg") | ⬜     |       |
| 2.2.7  | Price formatted with commas (1,234.56)      | ⬜     |       |
| 2.2.8  | Availability badge shows                    | ⬜     |       |
| 2.2.9  | "Available" badge is green                  | ⬜     |       |
| 2.2.10 | "Unavailable" badge is red                  | ⬜     |       |
| 2.2.11 | Availability toggle button shows            | ⬜     |       |
| 2.2.12 | Edit button (pencil icon) visible           | ⬜     |       |
| 2.2.13 | Delete button (trash icon) visible          | ⬜     |       |
| 2.2.14 | Card has shadow and proper spacing          | ⬜     |       |

### 2.3 Material Card Display (Compact Mode)

| #     | Test Case                                 | Status | Notes |
| ----- | ----------------------------------------- | ------ | ----- |
| 2.3.1 | Compact card shows in profile screens     | ⬜     |       |
| 2.3.2 | Material name displays (truncated 1 line) | ⬜     |       |
| 2.3.3 | Price with unit shows below name          | ⬜     |       |
| 2.3.4 | Cube icon shows on left                   | ⬜     |       |
| 2.3.5 | Availability icon on right (checkmark/X)  | ⬜     |       |
| 2.3.6 | No description in compact mode            | ⬜     |       |
| 2.3.7 | No action buttons in compact mode         | ⬜     |       |
| 2.3.8 | Card press navigates to full list         | ⬜     |       |

### 2.4 Availability Toggle (Quick Action)

| #      | Test Case                                    | Status | Notes |
| ------ | -------------------------------------------- | ------ | ----- |
| 2.4.1  | Toggle button shows on material card         | ⬜     |       |
| 2.4.2  | Button shows "Mark Unavailable" if available | ⬜     |       |
| 2.4.3  | Button shows "Mark Available" if unavailable | ⬜     |       |
| 2.4.4  | Press triggers toggle action                 | ⬜     |       |
| 2.4.5  | Loading spinner shows during toggle          | ⬜     |       |
| 2.4.6  | Button disabled during toggle                | ⬜     |       |
| 2.4.7  | Optimistic UI update (immediate change)      | ⬜     |       |
| 2.4.8  | Badge updates after successful toggle        | ⬜     |       |
| 2.4.9  | Success toast shows "Status updated"         | ⬜     |       |
| 2.4.10 | Error reverts UI and shows alert             | ⬜     |       |
| 2.4.11 | Toggle can be retried after error            | ⬜     |       |

### 2.5 Add Material Modal

| #      | Test Case                                                    | Status | Notes |
| ------ | ------------------------------------------------------------ | ------ | ----- |
| 2.5.1  | Modal opens from add button                                  | ⬜     |       |
| 2.5.2  | Modal title shows "Add Material"                             | ⬜     |       |
| 2.5.3  | All 5 fields visible (name, desc, price, unit, availability) | ⬜     |       |
| 2.5.4  | Name input accepts text                                      | ⬜     |       |
| 2.5.5  | Name validation: min 3 characters                            | ⬜     |       |
| 2.5.6  | Name validation: max 100 characters                          | ⬜     |       |
| 2.5.7  | Description input accepts text                               | ⬜     |       |
| 2.5.8  | Description validation: min 10 characters                    | ⬜     |       |
| 2.5.9  | Description validation: max 500 characters                   | ⬜     |       |
| 2.5.10 | Description shows character counter (0/500)                  | ⬜     |       |
| 2.5.11 | Price input shows PHP ₱ symbol prefix                        | ⬜     |       |
| 2.5.12 | Price input accepts decimal numbers                          | ⬜     |       |
| 2.5.13 | Price validation: min ₱0.01                                  | ⬜     |       |
| 2.5.14 | Price validation: max ₱1,000,000                             | ⬜     |       |
| 2.5.15 | Unit input accepts text (e.g., "per kg")                     | ⬜     |       |
| 2.5.16 | Unit validation: min 2 characters                            | ⬜     |       |
| 2.5.17 | Unit validation: max 50 characters                           | ⬜     |       |
| 2.5.18 | Availability checkbox shows                                  | ⬜     |       |
| 2.5.19 | Availability defaults to checked (true)                      | ⬜     |       |
| 2.5.20 | Optional image upload button shows                           | ⬜     |       |

### 2.6 Add Material Image Upload (Optional)

| #      | Test Case                                 | Status | Notes |
| ------ | ----------------------------------------- | ------ | ----- |
| 2.6.1  | "Add Image" button shows                  | ⬜     |       |
| 2.6.2  | Image picker opens on button press        | ⬜     |       |
| 2.6.3  | Gallery permission requested              | ⬜     |       |
| 2.6.4  | Selected image shows preview              | ⬜     |       |
| 2.6.5  | Image size displays (e.g., "1.2 MB")      | ⬜     |       |
| 2.6.6  | Remove button (X) appears after selection | ⬜     |       |
| 2.6.7  | Remove button clears image preview        | ⬜     |       |
| 2.6.8  | Image compression triggers if ≥2MB        | ⬜     |       |
| 2.6.9  | Compressed image shows updated size       | ⬜     |       |
| 2.6.10 | Can proceed without image (optional)      | ⬜     |       |

### 2.7 Add Material Validation

| #      | Test Case                                     | Status | Notes |
| ------ | --------------------------------------------- | ------ | ----- |
| 2.7.1  | Name field required (error if empty)          | ⬜     |       |
| 2.7.2  | Name too short shows error (<3 chars)         | ⬜     |       |
| 2.7.3  | Name too long shows error (>100 chars)        | ⬜     |       |
| 2.7.4  | Description field required (error if empty)   | ⬜     |       |
| 2.7.5  | Description too short shows error (<10 chars) | ⬜     |       |
| 2.7.6  | Description too long shows error (>500 chars) | ⬜     |       |
| 2.7.7  | Price field required (error if empty)         | ⬜     |       |
| 2.7.8  | Price too low shows error (<₱0.01)            | ⬜     |       |
| 2.7.9  | Price too high shows error (>₱1M)             | ⬜     |       |
| 2.7.10 | Non-numeric price shows error                 | ⬜     |       |
| 2.7.11 | Unit field required (error if empty)          | ⬜     |       |
| 2.7.12 | Unit too short shows error (<2 chars)         | ⬜     |       |
| 2.7.13 | Unit too long shows error (>50 chars)         | ⬜     |       |
| 2.7.14 | Errors show in real-time (on blur)            | ⬜     |       |
| 2.7.15 | Submit disabled if validation errors exist    | ⬜     |       |
| 2.7.16 | All fields valid enables submit button        | ⬜     |       |

### 2.8 Add Material Upload

| #      | Test Case                                 | Status | Notes |
| ------ | ----------------------------------------- | ------ | ----- |
| 2.8.1  | Submit button triggers upload             | ⬜     |       |
| 2.8.2  | Loading spinner shows during upload       | ⬜     |       |
| 2.8.3  | Submit button disabled during upload      | ⬜     |       |
| 2.8.4  | Upload uses FormData multipart (if image) | ⬜     |       |
| 2.8.5  | Success closes modal                      | ⬜     |       |
| 2.8.6  | Success toast shows "Material added!"     | ⬜     |       |
| 2.8.7  | New material appears in list              | ⬜     |       |
| 2.8.8  | List refreshes automatically              | ⬜     |       |
| 2.8.9  | Error shows alert dialog with message     | ⬜     |       |
| 2.8.10 | Network error handled gracefully          | ⬜     |       |
| 2.8.11 | Upload can be retried after error         | ⬜     |       |

### 2.9 Edit Material Modal

| #      | Test Case                                     | Status | Notes |
| ------ | --------------------------------------------- | ------ | ----- |
| 2.9.1  | Modal opens from edit button on card          | ⬜     |       |
| 2.9.2  | Modal title shows "Edit Material"             | ⬜     |       |
| 2.9.3  | All fields pre-filled with existing data      | ⬜     |       |
| 2.9.4  | Name field shows current name                 | ⬜     |       |
| 2.9.5  | Description shows current description         | ⬜     |       |
| 2.9.6  | Price shows current price (formatted)         | ⬜     |       |
| 2.9.7  | Unit shows current unit                       | ⬜     |       |
| 2.9.8  | Availability checkbox reflects current status | ⬜     |       |
| 2.9.9  | Existing image shows if present               | ⬜     |       |
| 2.9.10 | Can edit name field                           | ⬜     |       |
| 2.9.11 | Can edit description field                    | ⬜     |       |
| 2.9.12 | Can edit price field                          | ⬜     |       |
| 2.9.13 | Can edit unit field                           | ⬜     |       |
| 2.9.14 | Can toggle availability checkbox              | ⬜     |       |
| 2.9.15 | Cannot re-upload image (backend restriction)  | ⬜     |       |
| 2.9.16 | Image upload button hidden/disabled in edit   | ⬜     |       |

### 2.10 Edit Material Update

| #      | Test Case                                  | Status | Notes |
| ------ | ------------------------------------------ | ------ | ----- |
| 2.10.1 | Update button triggers save                | ⬜     |       |
| 2.10.2 | Loading spinner shows during update        | ⬜     |       |
| 2.10.3 | Update sends only changed fields (partial) | ⬜     |       |
| 2.10.4 | Success closes modal                       | ⬜     |       |
| 2.10.5 | Success toast shows "Material updated!"    | ⬜     |       |
| 2.10.6 | Updated material reflects changes          | ⬜     |       |
| 2.10.7 | List refreshes automatically               | ⬜     |       |
| 2.10.8 | Error shows alert dialog                   | ⬜     |       |
| 2.10.9 | Validation errors prevent update           | ⬜     |       |

### 2.11 Delete Material

| #       | Test Case                                  | Status | Notes |
| ------- | ------------------------------------------ | ------ | ----- |
| 2.11.1  | Delete button triggers confirmation dialog | ⬜     |       |
| 2.11.2  | Dialog shows "Delete material [name]?"     | ⬜     |       |
| 2.11.3  | Dialog warns "This cannot be undone"       | ⬜     |       |
| 2.11.4  | Cancel button dismisses dialog             | ⬜     |       |
| 2.11.5  | Delete button confirms deletion            | ⬜     |       |
| 2.11.6  | Loading state during deletion              | ⬜     |       |
| 2.11.7  | Success removes material from list         | ⬜     |       |
| 2.11.8  | Success toast shows "Material deleted"     | ⬜     |       |
| 2.11.9  | Error shows alert dialog with message      | ⬜     |       |
| 2.11.10 | Deletion can be retried after error        | ⬜     |       |

### 2.12 Unsaved Changes (Material Modal)

| #      | Test Case                                     | Status | Notes |
| ------ | --------------------------------------------- | ------ | ----- |
| 2.12.1 | Closing modal with changes shows confirmation | ⬜     |       |
| 2.12.2 | Confirmation says "Discard changes?"          | ⬜     |       |
| 2.12.3 | "Stay" button keeps modal open                | ⬜     |       |
| 2.12.4 | "Discard" button closes modal                 | ⬜     |       |
| 2.12.5 | No confirmation if no changes made            | ⬜     |       |
| 2.12.6 | Android back button triggers confirmation     | ⬜     |       |

---

## 3️⃣ Profile Integration

### 3.1 Profile View Screen - Certifications Section

| #      | Test Case                                      | Status | Notes |
| ------ | ---------------------------------------------- | ------ | ----- |
| 3.1.1  | Certifications section appears in profile      | ⬜     |       |
| 3.1.2  | Section placed after Service Areas             | ⬜     |       |
| 3.1.3  | Section title shows "Certifications"           | ⬜     |       |
| 3.1.4  | "View All (X)" link shows if >0 certifications | ⬜     |       |
| 3.1.5  | Shows 3 most recent certifications max         | ⬜     |       |
| 3.1.6  | Certifications display in compact card mode    | ⬜     |       |
| 3.1.7  | "View All X Certifications" button if >3       | ⬜     |       |
| 3.1.8  | Empty state shows if no certifications         | ⬜     |       |
| 3.1.9  | Empty state says "Add certifications..."       | ⬜     |       |
| 3.1.10 | "Add Certifications" button in empty state     | ⬜     |       |
| 3.1.11 | Pressing card navigates to certifications list | ⬜     |       |
| 3.1.12 | Pressing "View All" navigates to list          | ⬜     |       |
| 3.1.13 | Pressing "Add" navigates to list               | ⬜     |       |

### 3.2 Profile View Screen - Materials Section

| #      | Test Case                                  | Status | Notes |
| ------ | ------------------------------------------ | ------ | ----- |
| 3.2.1  | Materials section appears in profile       | ⬜     |       |
| 3.2.2  | Section placed after Certifications        | ⬜     |       |
| 3.2.3  | Section title shows "Materials & Products" | ⬜     |       |
| 3.2.4  | "View All (X)" link shows if >0 materials  | ⬜     |       |
| 3.2.5  | Shows 3 most recent materials max          | ⬜     |       |
| 3.2.6  | Materials display in compact card mode     | ⬜     |       |
| 3.2.7  | "View All X Materials" button if >3        | ⬜     |       |
| 3.2.8  | Empty state shows if no materials          | ⬜     |       |
| 3.2.9  | Empty state says "List materials..."       | ⬜     |       |
| 3.2.10 | "Add Materials" button in empty state      | ⬜     |       |
| 3.2.11 | Pressing card navigates to materials list  | ⬜     |       |
| 3.2.12 | Pressing "View All" navigates to list      | ⬜     |       |
| 3.2.13 | Pressing "Add" navigates to list           | ⬜     |       |

### 3.3 Profile Edit Screen - Certifications Management

| #     | Test Case                                   | Status | Notes |
| ----- | ------------------------------------------- | ------ | ----- |
| 3.3.1 | "Certifications" management section shows   | ⬜     |       |
| 3.3.2 | Section placed after Skills field           | ⬜     |       |
| 3.3.3 | Section has ribbon icon                     | ⬜     |       |
| 3.3.4 | Section title says "Certifications"         | ⬜     |       |
| 3.3.5 | Hint says "Add professional certifications" | ⬜     |       |
| 3.3.6 | "Manage Certifications" button shows        | ⬜     |       |
| 3.3.7 | Button has settings icon                    | ⬜     |       |
| 3.3.8 | Button has chevron-forward icon             | ⬜     |       |
| 3.3.9 | Pressing button navigates to certifications | ⬜     |       |

### 3.4 Profile Edit Screen - Materials Management

| #     | Test Case                                       | Status | Notes |
| ----- | ----------------------------------------------- | ------ | ----- |
| 3.4.1 | "Materials & Products" management section shows | ⬜     |       |
| 3.4.2 | Section placed after Certifications             | ⬜     |       |
| 3.4.3 | Section has cube icon                           | ⬜     |       |
| 3.4.4 | Section title says "Materials & Products"       | ⬜     |       |
| 3.4.5 | Hint says "List materials or products..."       | ⬜     |       |
| 3.4.6 | "Manage Materials" button shows                 | ⬜     |       |
| 3.4.7 | Button has settings icon                        | ⬜     |       |
| 3.4.8 | Button has chevron-forward icon                 | ⬜     |       |
| 3.4.9 | Pressing button navigates to materials list     | ⬜     |       |

---

## 4️⃣ Data Persistence & API Integration

### 4.1 React Query Caching

| #     | Test Case                                 | Status | Notes |
| ----- | ----------------------------------------- | ------ | ----- |
| 4.1.1 | Certifications query caches for 5 minutes | ⬜     |       |
| 4.1.2 | Materials query caches for 5 minutes      | ⬜     |       |
| 4.1.3 | Profile query caches for 5 minutes        | ⬜     |       |
| 4.1.4 | Cached data loads instantly on re-visit   | ⬜     |       |
| 4.1.5 | Background refetch occurs after 5 minutes | ⬜     |       |

### 4.2 Query Invalidation (Certifications)

| #     | Test Case                                             | Status | Notes |
| ----- | ----------------------------------------------------- | ------ | ----- |
| 4.2.1 | Adding certification invalidates certifications query | ⬜     |       |
| 4.2.2 | Adding certification invalidates worker-profile query | ⬜     |       |
| 4.2.3 | Updating certification invalidates both queries       | ⬜     |       |
| 4.2.4 | Deleting certification invalidates both queries       | ⬜     |       |
| 4.2.5 | Lists auto-refresh after mutations                    | ⬜     |       |
| 4.2.6 | Profile section updates after mutations               | ⬜     |       |

### 4.3 Query Invalidation (Materials)

| #     | Test Case                                        | Status | Notes |
| ----- | ------------------------------------------------ | ------ | ----- |
| 4.3.1 | Adding material invalidates materials query      | ⬜     |       |
| 4.3.2 | Adding material invalidates worker-profile query | ⬜     |       |
| 4.3.3 | Updating material invalidates both queries       | ⬜     |       |
| 4.3.4 | Toggling availability invalidates both queries   | ⬜     |       |
| 4.3.5 | Deleting material invalidates both queries       | ⬜     |       |
| 4.3.6 | Lists auto-refresh after mutations               | ⬜     |       |
| 4.3.7 | Profile section updates after mutations          | ⬜     |       |

### 4.4 API Endpoints (Certifications)

| #     | Test Case                                            | Status | Notes |
| ----- | ---------------------------------------------------- | ------ | ----- |
| 4.4.1 | GET /api/mobile/profile/certifications works         | ⬜     |       |
| 4.4.2 | POST /api/mobile/profile/certifications works        | ⬜     |       |
| 4.4.3 | GET /api/mobile/profile/certifications/{id} works    | ⬜     |       |
| 4.4.4 | PUT /api/mobile/profile/certifications/{id} works    | ⬜     |       |
| 4.4.5 | DELETE /api/mobile/profile/certifications/{id} works | ⬜     |       |
| 4.4.6 | Authentication required for all endpoints            | ⬜     |       |
| 4.4.7 | 401 error if not authenticated                       | ⬜     |       |
| 4.4.8 | 403 error if not WORKER profile type                 | ⬜     |       |

### 4.5 API Endpoints (Materials)

| #     | Test Case                                                 | Status | Notes |
| ----- | --------------------------------------------------------- | ------ | ----- |
| 4.5.1 | GET /api/mobile/profile/materials works                   | ⬜     |       |
| 4.5.2 | POST /api/mobile/profile/materials works                  | ⬜     |       |
| 4.5.3 | GET /api/mobile/profile/materials/{id} works              | ⬜     |       |
| 4.5.4 | PUT /api/mobile/profile/materials/{id} works              | ⬜     |       |
| 4.5.5 | PUT /api/mobile/profile/materials/{id}/availability works | ⬜     |       |
| 4.5.6 | DELETE /api/mobile/profile/materials/{id} works           | ⬜     |       |
| 4.5.7 | Authentication required for all endpoints                 | ⬜     |       |
| 4.5.8 | 401 error if not authenticated                            | ⬜     |       |
| 4.5.9 | 403 error if not WORKER profile type                      | ⬜     |       |

### 4.6 Data Persistence

| #     | Test Case                                      | Status | Notes |
| ----- | ---------------------------------------------- | ------ | ----- |
| 4.6.1 | Added certifications persist after app close   | ⬜     |       |
| 4.6.2 | Added materials persist after app close        | ⬜     |       |
| 4.6.3 | Updated certifications persist after app close | ⬜     |       |
| 4.6.4 | Updated materials persist after app close      | ⬜     |       |
| 4.6.5 | Deleted items removed from backend database    | ⬜     |       |
| 4.6.6 | Data syncs across devices for same account     | ⬜     |       |

---

## 5️⃣ UI/UX & Visual Polish

### 5.1 Typography & Colors

| #     | Test Case                                   | Status | Notes |
| ----- | ------------------------------------------- | ------ | ----- |
| 5.1.1 | All text uses theme Typography definitions  | ⬜     |       |
| 5.1.2 | Section titles use Typography.h3            | ⬜     |       |
| 5.1.3 | Body text uses Typography.body.medium       | ⬜     |       |
| 5.1.4 | Labels use Typography.body.small            | ⬜     |       |
| 5.1.5 | Primary color used for buttons and links    | ⬜     |       |
| 5.1.6 | Success green for verified/available badges | ⬜     |       |
| 5.1.7 | Warning yellow for pending badges           | ⬜     |       |
| 5.1.8 | Error red for unavailable badges            | ⬜     |       |
| 5.1.9 | TextSecondary for hints and labels          | ⬜     |       |

### 5.2 Spacing & Layout

| #     | Test Case                                | Status | Notes |
| ----- | ---------------------------------------- | ------ | ----- |
| 5.2.1 | All spacing uses theme Spacing constants | ⬜     |       |
| 5.2.2 | Section padding uses Spacing.lg (16px)   | ⬜     |       |
| 5.2.3 | Card margins use Spacing.md (12px)       | ⬜     |       |
| 5.2.4 | Field spacing uses Spacing.md            | ⬜     |       |
| 5.2.5 | Button padding uses Spacing.md           | ⬜     |       |
| 5.2.6 | List item separators use 1px height      | ⬜     |       |

### 5.3 Shadows & Borders

| #     | Test Case                                | Status | Notes |
| ----- | ---------------------------------------- | ------ | ----- |
| 5.3.1 | Cards use Shadows.small elevation        | ⬜     |       |
| 5.3.2 | Modals use Shadows.large elevation       | ⬜     |       |
| 5.3.3 | Border radius uses BorderRadius.md (8px) | ⬜     |       |
| 5.3.4 | Input fields use BorderRadius.sm (4px)   | ⬜     |       |
| 5.3.5 | Buttons use BorderRadius.md              | ⬜     |       |

### 5.4 Icons & Visual Indicators

| #     | Test Case                                   | Status | Notes |
| ----- | ------------------------------------------- | ------ | ----- |
| 5.4.1 | Ionicons used consistently throughout       | ⬜     |       |
| 5.4.2 | Icons sized appropriately (16-24px)         | ⬜     |       |
| 5.4.3 | Icon colors match theme (primary/secondary) | ⬜     |       |
| 5.4.4 | Loading spinners use primary color          | ⬜     |       |
| 5.4.5 | Badge icons (checkmark, warning, X) clear   | ⬜     |       |

### 5.5 Empty States

| #     | Test Case                                    | Status | Notes |
| ----- | -------------------------------------------- | ------ | ----- |
| 5.5.1 | Empty states show helpful messages           | ⬜     |       |
| 5.5.2 | Empty states have clear CTAs                 | ⬜     |       |
| 5.5.3 | Empty state icons appropriately sized (48px) | ⬜     |       |
| 5.5.4 | Empty state text uses textSecondary color    | ⬜     |       |

### 5.6 Loading States

| #     | Test Case                            | Status | Notes |
| ----- | ------------------------------------ | ------ | ----- |
| 5.6.1 | List loading shows centered spinner  | ⬜     |       |
| 5.6.2 | Modal loading disables submit button | ⬜     |       |
| 5.6.3 | Upload shows progress indicator      | ⬜     |       |
| 5.6.4 | Skeleton screens used appropriately  | ⬜     |       |

### 5.7 Error States

| #     | Test Case                             | Status | Notes |
| ----- | ------------------------------------- | ------ | ----- |
| 5.7.1 | Error messages clear and actionable   | ⬜     |       |
| 5.7.2 | Error icons use error color (red)     | ⬜     |       |
| 5.7.3 | Retry buttons visible in error states | ⬜     |       |
| 5.7.4 | Field-level errors show below inputs  | ⬜     |       |

---

## 6️⃣ Platform-Specific Testing

### 6.1 iOS-Specific

| #     | Test Case                                      | Status | Notes |
| ----- | ---------------------------------------------- | ------ | ----- |
| 6.1.1 | KeyboardAvoidingView works correctly           | ⬜     |       |
| 6.1.2 | Safe area insets respected                     | ⬜     |       |
| 6.1.3 | Modal presentations smooth                     | ⬜     |       |
| 6.1.4 | Date picker uses iOS native picker             | ⬜     |       |
| 6.1.5 | Haptic feedback on button presses (if enabled) | ⬜     |       |
| 6.1.6 | Pull-to-refresh uses iOS style                 | ⬜     |       |

### 6.2 Android-Specific

| #     | Test Case                                      | Status | Notes |
| ----- | ---------------------------------------------- | ------ | ----- |
| 6.2.1 | Back button dismisses modals                   | ⬜     |       |
| 6.2.2 | Back button shows unsaved changes confirmation | ⬜     |       |
| 6.2.3 | Keyboard behavior matches Android patterns     | ⬜     |       |
| 6.2.4 | Date picker uses Android native picker         | ⬜     |       |
| 6.2.5 | Touch ripples on pressable elements            | ⬜     |       |
| 6.2.6 | Pull-to-refresh uses Android style             | ⬜     |       |

### 6.3 Responsive Design

| #     | Test Case                                     | Status | Notes |
| ----- | --------------------------------------------- | ------ | ----- |
| 6.3.1 | Layouts work on small phones (iPhone SE)      | ⬜     |       |
| 6.3.2 | Layouts work on large phones (iPhone Pro Max) | ⬜     |       |
| 6.3.3 | Layouts work on tablets                       | ⬜     |       |
| 6.3.4 | ScrollViews prevent content cutoff            | ⬜     |       |
| 6.3.5 | Modals fit within viewport                    | ⬜     |       |

---

## 7️⃣ Edge Cases & Error Handling

### 7.1 Network Conditions

| #     | Test Case                              | Status | Notes |
| ----- | -------------------------------------- | ------ | ----- |
| 7.1.1 | Slow network shows loading states      | ⬜     |       |
| 7.1.2 | Network timeout handled gracefully     | ⬜     |       |
| 7.1.3 | Offline mode shows appropriate errors  | ⬜     |       |
| 7.1.4 | Reconnecting retries failed operations | ⬜     |       |

### 7.2 Boundary Values (Certifications)

| #     | Test Case                              | Status | Notes |
| ----- | -------------------------------------- | ------ | ----- |
| 7.2.1 | 1-character name rejected (min 3)      | ⬜     |       |
| 7.2.2 | 101-character name rejected (max 100)  | ⬜     |       |
| 7.2.3 | Issue date in future allowed           | ⬜     |       |
| 7.2.4 | Expiry date before issue date rejected | ⬜     |       |
| 7.2.5 | Very large file upload handled         | ⬜     |       |

### 7.3 Boundary Values (Materials)

| #     | Test Case                                    | Status | Notes |
| ----- | -------------------------------------------- | ------ | ----- |
| 7.3.1 | Price ₱0.00 rejected (min ₱0.01)             | ⬜     |       |
| 7.3.2 | Price ₱1,000,001 rejected (max ₱1M)          | ⬜     |       |
| 7.3.3 | 1-character description rejected (min 10)    | ⬜     |       |
| 7.3.4 | 501-character description rejected (max 500) | ⬜     |       |
| 7.3.5 | Very large image upload handled              | ⬜     |       |

### 7.4 Concurrent Operations

| #     | Test Case                                        | Status | Notes |
| ----- | ------------------------------------------------ | ------ | ----- |
| 7.4.1 | Rapid add/delete operations don't crash          | ⬜     |       |
| 7.4.2 | Multiple availability toggles queued correctly   | ⬜     |       |
| 7.4.3 | Simultaneous edits from multiple devices handled | ⬜     |       |

### 7.5 Special Characters & Input

| #     | Test Case                                  | Status | Notes |
| ----- | ------------------------------------------ | ------ | ----- |
| 7.5.1 | Emoji in certification names handled       | ⬜     |       |
| 7.5.2 | Special characters in descriptions handled | ⬜     |       |
| 7.5.3 | HTML/SQL injection attempts sanitized      | ⬜     |       |
| 7.5.4 | Decimal prices formatted correctly         | ⬜     |       |

---

## 8️⃣ Performance Testing

### 8.1 List Performance

| #     | Test Case                                   | Status | Notes |
| ----- | ------------------------------------------- | ------ | ----- |
| 8.1.1 | 1 certification/material renders quickly    | ⬜     |       |
| 8.1.2 | 10 certifications/materials render smoothly | ⬜     |       |
| 8.1.3 | 50+ items scroll without lag                | ⬜     |       |
| 8.1.4 | FlatList virtualization working             | ⬜     |       |

### 8.2 Image Performance

| #     | Test Case                                        | Status | Notes |
| ----- | ------------------------------------------------ | ------ | ----- |
| 8.2.1 | Image compression doesn't freeze UI              | ⬜     |       |
| 8.2.2 | Multiple image uploads sequential (not parallel) | ⬜     |       |
| 8.2.3 | Large images (10MB) compress successfully        | ⬜     |       |

### 8.3 Memory & Battery

| #     | Test Case                                  | Status | Notes |
| ----- | ------------------------------------------ | ------ | ----- |
| 8.3.1 | No memory leaks after 10 open/close cycles | ⬜     |       |
| 8.3.2 | App doesn't drain battery excessively      | ⬜     |       |
| 8.3.3 | Background queries don't run unnecessarily | ⬜     |       |

---

## 9️⃣ Accessibility

### 9.1 Screen Reader Support

| #     | Test Case                            | Status | Notes |
| ----- | ------------------------------------ | ------ | ----- |
| 9.1.1 | All buttons have accessible labels   | ⬜     |       |
| 9.1.2 | Form fields have accessible labels   | ⬜     |       |
| 9.1.3 | Status badges announced correctly    | ⬜     |       |
| 9.1.4 | Error messages read by screen reader | ⬜     |       |

### 9.2 Keyboard Navigation

| #     | Test Case                  | Status | Notes |
| ----- | -------------------------- | ------ | ----- |
| 9.2.1 | Tab order logical in forms | ⬜     |       |
| 9.2.2 | Enter key submits forms    | ⬜     |       |
| 9.2.3 | Escape key closes modals   | ⬜     |       |

### 9.3 Visual Accessibility

| #     | Test Case                                        | Status | Notes |
| ----- | ------------------------------------------------ | ------ | ----- |
| 9.3.1 | Color contrast meets WCAG AA standards           | ⬜     |       |
| 9.3.2 | Text readable at smallest system font            | ⬜     |       |
| 9.3.3 | Focus indicators visible on interactive elements | ⬜     |       |

---

## 🐛 Bug Tracking

Use this section to log any bugs found during testing:

### Bug #1

- **Test Case**: [e.g., 1.4.5]
- **Description**: [Detailed description]
- **Steps to Reproduce**: [Step-by-step]
- **Expected Result**: [What should happen]
- **Actual Result**: [What actually happens]
- **Severity**: [Critical/High/Medium/Low]
- **Status**: [Open/In Progress/Fixed/Closed]

### Bug #2

...

---

## ✅ Sign-Off

### Tester Information

- **Name**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_
- **Date**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_
- **Test Duration**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_

### Summary

- **Total Test Cases**: 400+
- **Passed**: \_\_\_\_\_
- **Failed**: \_\_\_\_\_
- **Partial**: \_\_\_\_\_
- **Skipped**: \_\_\_\_\_

### Approval

- [ ] **All critical tests passed**
- [ ] **Known issues documented**
- [ ] **Approved for production deployment**

**Signature**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## 📄 Related Documentation

- `docs/mobile/MOBILE_PHASE6_PLAN.md` - Implementation plan
- `docs/mobile/MOBILE_PHASE6_PROGRESS.md` - Progress tracking
- `docs/mobile/MOBILE_PHASE6_COMPLETE.md` - Completion report (TBD)
- `lib/hooks/useCertifications.ts` - Certifications hook
- `lib/hooks/useMaterials.ts` - Materials hook
- `components/CertificationCard.tsx` - Certification display
- `components/MaterialCard.tsx` - Material display
- `app/profile/certifications/index.tsx` - Certifications screen
- `app/profile/materials/index.tsx` - Materials screen

---

**End of QA Checklist**
