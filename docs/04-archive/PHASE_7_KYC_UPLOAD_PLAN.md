# Mobile Phase 7: KYC Document Upload & Verification - Implementation Plan

**Phase**: 7 - KYC Upload  
**Priority**: HIGH  
**Estimated Time**: 60-80 hours  
**Status**: 📋 PENDING (After Phases 3, 4, 5, and Phase 6 completion)

---

## 🎯 Phase Overview

Implement KYC document upload, submission, and verification tracking for mobile users. This includes camera capture with guides, document management, and agency-specific KYC flows.

**GitHub Issue Spec**: `docs/github-issues/MOBILE_PHASE_7_KYC_UPLOAD.md`

### Key Requirements

1. **Document Types**: Government ID (front/back), Selfie with ID, Proof of Address, Business Permit (agencies)
2. **Camera Capture**: Guided camera with ID frame overlay and auto-capture (optional)
3. **Status Tracking**: PENDING/APPROVED/REJECTED with reasons
4. **Verification Prompts**: Trigger on first job application
5. **Agency KYC**: Business documents and registration

---

## 📊 Week-by-Week Implementation

### Week 1: Upload Flow & Camera (30-35 hours)

#### Day 1-2: KYC Upload Screen (15-18 hours)

**Files to Create**:

- `app/kyc/upload.tsx` (520 lines) - KYC upload main screen
- `components/DocumentTypeSelector.tsx` (280 lines) - Document type picker
- `components/DocumentUploadCard.tsx` (320 lines) - Upload card with preview
- `lib/hooks/useKYC.ts` (220 lines) - KYC React Query hooks

**Features**:

- Document type selection (Gov ID Front, Gov ID Back, Selfie, Address Proof)
- Multiple document upload support
- Document preview thumbnails
- Camera/gallery picker for each document
- Upload progress indicators
- "Submit for Verification" button (disabled until required docs uploaded)

**API Integration**:

- `POST /api/accounts/kyc/upload` - Upload KYC document
- `GET /api/accounts/kyc/status` - Get KYC status

**Success Criteria**:

- ✅ Users can select document types
- ✅ Users can upload from camera/gallery
- ✅ Preview thumbnails display correctly
- ✅ Submit button enables when required docs uploaded

---

#### Day 3-4: Camera Capture with Guides (15-18 hours)

**Files to Create**:

- `app/kyc/camera.tsx` (620 lines) - Camera capture screen
- `components/IDFrameOverlay.tsx` (240 lines) - ID card frame guide
- `lib/utils/image-validator.ts` (180 lines) - Image quality validation

**Features**:

- Camera screen with ID card frame overlay
- Alignment guides ("Place ID within frame")
- Flash control toggle
- Capture button
- Auto-capture when ID detected (optional - Phase 7.5)
- Image quality validation (resolution, brightness, blur)
- Retake functionality

**Technical**:

- Use Expo Camera API
- Overlay transparent frame with white border
- Detect edges (optional feature for Phase 7.5)
- Validate image quality before accepting

**Success Criteria**:

- ✅ Camera opens with frame overlay
- ✅ Flash control works
- ✅ Capture button takes photo
- ✅ Image quality validated
- ✅ Retake option available

---

#### Day 5: Image Processing (8-10 hours)

**Files to Create**:

- `lib/utils/image-processing.ts` (220 lines) - Image processing utilities

**Features**:

- Image cropping to ID frame
- Image rotation (90°, 180°, 270°)
- Image compression (<2MB)
- Brightness/contrast adjustment (optional)

**Success Criteria**:

- ✅ Images cropped to frame correctly
- ✅ Rotation works
- ✅ Compression reduces file size

---

### Week 2: Status Tracking & Agency KYC (25-30 hours)

#### Day 6-7: KYC Status Screen (15-18 hours)

**Files to Create**:

- `app/kyc/status.tsx` (480 lines) - KYC status tracking screen
- `components/KYCStatusBadge.tsx` (150 lines) - Status badge component
- `components/DocumentThumbnail.tsx` (200 lines) - Uploaded document thumbnail
- `components/RejectionReasonCard.tsx` (180 lines) - Rejection reason display

**Features**:

- KYC verification status display (PENDING/APPROVED/REJECTED)
- Uploaded documents thumbnails grid
- Submission timestamp
- Rejection reason display (if rejected)
- "Resubmit" button for rejected KYC
- Status change notifications

**API Integration**:

- `GET /api/accounts/kyc/status` - Get KYC status
- `GET /api/accounts/kyc/documents` - Get uploaded documents
- `DELETE /api/accounts/kyc/document/{id}` - Delete document (before submission)

**Success Criteria**:

- ✅ Status displays correctly (PENDING/APPROVED/REJECTED)
- ✅ Thumbnails load correctly
- ✅ Rejection reason shown if rejected
- ✅ Resubmit flow works

---

#### Day 8-9: Agency KYC (12-15 hours)

**Files to Create**:

- `app/kyc/agency.tsx` (420 lines) - Agency KYC screen
- `components/BusinessPermitUpload.tsx` (280 lines) - Business document upload

**Features**:

- Agency-specific KYC screen
- Business permit upload
- Business registration documents
- Additional agency fields (business name, registration number)
- Agency verification status tracking

**API Integration**:

- `POST /api/agency/kyc/submit` - Submit agency KYC
- `GET /api/agency/kyc/status` - Get agency KYC status

**Success Criteria**:

- ✅ Agency users see agency KYC screen
- ✅ Business documents upload correctly
- ✅ Agency status tracked separately

---

### Week 3: Prompts & Testing (15-20 hours)

#### Day 10-11: Verification Prompts (10-12 hours)

**Files to Create**:

- `components/KYCPromptModal.tsx` (320 lines) - Verification prompt modal
- `components/KYCBenefitsCard.tsx` (180 lines) - Benefits display
- `lib/utils/kyc-prompts.ts` (120 lines) - Prompt logic

**Features**:

- KYC prompt modal on first job application
- "Verification Required" modal
- KYC completion reminders (show every 3 days if not verified)
- Benefits of verification display (unlock features, trustworthy badge)
- "Verify Now" / "Later" buttons

**Trigger Points**:

- First job application (worker)
- First job posting (client)
- Profile completion (optional)

**Success Criteria**:

- ✅ Prompt shows on first job application
- ✅ Reminders show every 3 days
- ✅ "Verify Now" navigates to KYC upload
- ✅ "Later" dismisses modal

---

#### Day 12-14: Feature Blocking & Testing (8-12 hours)

**Features**:

- Block job application until KYC verified (optional - configurable)
- Block job posting until KYC verified (optional)
- Show verification badge on verified profiles
- Display verification status in profile

**Testing**:

- Test KYC upload flow end-to-end
- Test camera capture with frame overlay
- Test image processing (crop, rotate, compress)
- Test status tracking for all statuses
- Test agency KYC flow
- Test verification prompts
- Test feature blocking
- Verify TypeScript compilation (0 errors)

**QA Checklist**:

- 150+ test cases in `docs/qa/NOT DONE/MOBILE_PHASE7_QA_CHECKLIST.md`

**Documentation**:

- Update `docs/mobile/MOBILE_PHASE7_COMPLETE.md`
- Create completion summary

---

## 📁 Complete File List (20 files, ~4,200 lines)

### Hooks & Utils (3 files, ~620 lines)

1. `lib/hooks/useKYC.ts` (220 lines) - KYC React Query hooks
2. `lib/utils/image-validator.ts` (180 lines) - Image quality validation
3. `lib/utils/image-processing.ts` (220 lines) - Image processing utilities
4. `lib/utils/kyc-prompts.ts` (120 lines) - Prompt logic

### Screens (4 files, ~2,040 lines)

5. `app/kyc/upload.tsx` (520 lines) - KYC upload main screen
6. `app/kyc/camera.tsx` (620 lines) - Camera capture screen
7. `app/kyc/status.tsx` (480 lines) - KYC status tracking
8. `app/kyc/agency.tsx` (420 lines) - Agency KYC screen

### Components (10 files, ~2,330 lines)

9. `components/DocumentTypeSelector.tsx` (280 lines) - Document type picker
10. `components/DocumentUploadCard.tsx` (320 lines) - Upload card
11. `components/IDFrameOverlay.tsx` (240 lines) - Camera frame guide
12. `components/KYCStatusBadge.tsx` (150 lines) - Status badge
13. `components/DocumentThumbnail.tsx` (200 lines) - Document thumbnail
14. `components/RejectionReasonCard.tsx` (180 lines) - Rejection reason
15. `components/BusinessPermitUpload.tsx` (280 lines) - Business upload
16. `components/KYCPromptModal.tsx` (320 lines) - Verification prompt
17. `components/KYCBenefitsCard.tsx` (180 lines) - Benefits display
18. `components/VerificationBadge.tsx` (120 lines) - Verified badge

### Documentation (3 files, ~4,500 lines)

19. `docs/github-issues/plans/PHASE_7_PROGRESS.md` (1,500 lines) - Progress tracking
20. `docs/qa/NOT DONE/MOBILE_PHASE7_QA_CHECKLIST.md` (1,500 lines) - QA tests
21. `docs/mobile/MOBILE_PHASE7_COMPLETE.md` (1,500 lines) - Completion summary

### Modified Files (2 files)

22. `lib/api/config.ts` - Add 6 KYC endpoints
23. `app/profile/index.tsx` - Add verification badge display

---

## 🔌 API Endpoints (6 endpoints)

### New Endpoints (Backend already implemented)

1. `POST /api/accounts/kyc/upload` - Upload KYC document
2. `GET /api/accounts/kyc/status` - Get KYC verification status
3. `GET /api/accounts/kyc/documents` - Get uploaded documents
4. `DELETE /api/accounts/kyc/document/{id}` - Delete document
5. `POST /api/agency/kyc/submit` - Submit agency KYC
6. `GET /api/agency/kyc/status` - Get agency KYC status

---

## 🎨 UI Flow

### KYC Upload Flow

```
Profile / Job Application
    ↓
KYC Prompt Modal (KYCPromptModal.tsx)
    ↓
KYC Upload Screen (upload.tsx)
    ├── Document Type Selector
    ├── Document Upload Card (4x)
    │   ├── Camera Icon
    │   ├── Gallery Icon
    │   └── Preview Thumbnail
    └── Submit Button
```

### Camera Capture Flow

```
Document Upload Card Tap (Camera)
    ↓
Camera Screen (camera.tsx)
    ├── Camera Preview
    ├── ID Frame Overlay
    ├── Flash Control
    └── Capture Button
    ↓
Image Preview
    ├── Crop/Rotate Tools
    ├── Retake Button
    └── Use Photo Button
```

### Status Tracking Flow

```
Profile → KYC Status
    ↓
KYC Status Screen (status.tsx)
    ├── Status Badge (PENDING/APPROVED/REJECTED)
    ├── Documents Grid (thumbnails)
    ├── Submission Timestamp
    ├── Rejection Reason (if rejected)
    └── Resubmit Button (if rejected)
```

---

## ✅ Success Criteria

### Functional Requirements

- [ ] Users can upload 4 document types (ID front/back, selfie, address proof)
- [ ] Camera capture works with ID frame overlay
- [ ] Image quality validated before upload
- [ ] KYC status tracked (PENDING/APPROVED/REJECTED)
- [ ] Rejection reason displayed if rejected
- [ ] Resubmission flow works for rejected KYC
- [ ] Agency KYC flow works with business documents
- [ ] Verification prompts show at correct trigger points
- [ ] Verification badge displays on verified profiles

### Technical Requirements

- [ ] 0 TypeScript compilation errors
- [ ] All API endpoints integrated correctly
- [ ] React Query caching configured
- [ ] Error handling with toast notifications
- [ ] Loading states on all async operations
- [ ] Image compression works (<2MB)

### Testing Requirements

- [ ] 150+ test cases executed (QA checklist)
- [ ] Integration tests with backend passed
- [ ] Camera capture tested on iOS/Android
- [ ] Image processing tested (crop, rotate, compress)
- [ ] Status tracking verified for all statuses

---

## 📝 Dependencies

**Requires**:

- ✅ Backend: KYC APIs operational
- ✅ Backend: Supabase storage configured
- ⚠️ Phase 6: Enhanced Profiles (for verification badge display)
- ⚠️ Phases 3-5: Complete (KYC prompts trigger on job actions)

**Blocks**:

- None (Phase 7 is final phase)

---

## 🚀 Technical Considerations

### Camera Implementation

- **Library**: Expo Camera API (`expo-camera`)
- **Permissions**: Request camera permission on first use
- **Overlay**: Transparent view with white border rectangle
- **Quality**: High resolution (1920x1080 or higher)

### Image Validation

- **File Size**: Max 5MB per image
- **Resolution**: Min 800x600
- **Format**: JPEG, PNG
- **Quality**: Check brightness (not too dark), blur detection (optional)

### Document Requirements

**Required for Workers**:

1. Government ID (Front) ✅
2. Government ID (Back) ✅
3. Selfie with ID ✅

**Required for Clients**:

1. Government ID (Front) ✅
2. Proof of Address ✅

**Required for Agencies**:

1. Government ID (Front) ✅
2. Business Permit ✅
3. Business Registration ✅

### Feature Blocking (Optional)

- **Job Application**: Block if worker not verified (configurable)
- **Job Posting**: Block if client not verified (configurable)
- **Feature Access**: Some features require verification (e.g., higher budget jobs)

---

**Last Updated**: January 2025  
**Status**: 📋 PENDING (After Phases 3-6)  
**Next**: Awaiting Phases 3-6 completion
