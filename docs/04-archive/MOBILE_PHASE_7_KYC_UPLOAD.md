# [Mobile] Phase 7: KYC Document Upload & Verification

**Labels:** `priority:high`, `type:feature`, `area:mobile`, `area:kyc`
**Priority:** HIGH
**Estimated Time:** 60-80 hours

## Summary
Implement KYC document upload, submission, and verification tracking for mobile users.

## Tasks

### KYC Upload Flow
- [ ] Create KYCUploadScreen
- [ ] Implement document type selection
  - [ ] Government ID (Front/Back)
  - [ ] Selfie with ID
  - [ ] Proof of Address
  - [ ] Business Permit (for agencies)
- [ ] Add camera capture functionality
- [ ] Add gallery photo selection
- [ ] Implement document preview before upload
- [ ] Add image cropping/rotation
- [ ] Handle multi-document upload
- [ ] Integrate with `/api/accounts/upload-kyc`

### Document Capture
- [ ] Implement camera screen with guides
- [ ] Add ID card frame overlay for alignment
- [ ] Implement auto-capture when document detected (optional)
- [ ] Add flash control
- [ ] Implement image quality validation
- [ ] Add retake functionality

### KYC Status Tracking
- [ ] Create KYCStatusScreen
- [ ] Display verification status (PENDING/APPROVED/REJECTED)
- [ ] Show uploaded document thumbnails
- [ ] Display submission timestamp
- [ ] Show rejection reason if rejected
- [ ] Add resubmission flow for rejected KYC
- [ ] Implement status notifications

### Document Management
- [ ] Display uploaded documents list
- [ ] Allow document replacement before submission
- [ ] Implement document deletion
- [ ] Show document upload progress
- [ ] Add document validation (file size, format)

### Agency KYC
- [ ] Create AgencyKYCScreen
- [ ] Add business permit upload
- [ ] Add business registration documents
- [ ] Implement additional agency-specific fields
- [ ] Show agency verification status

### Verification Prompts
- [ ] Show KYC prompt on first job application
- [ ] Display verification required modal
- [ ] Add KYC completion reminders
- [ ] Show benefits of verification
- [ ] Block certain features until verified

## Files to Create
- `lib/screens/kyc/kyc_upload_screen.dart` - KYC upload interface
- `lib/screens/kyc/kyc_status_screen.dart` - Status tracking
- `lib/screens/kyc/kyc_camera_screen.dart` - Document capture
- `lib/screens/kyc/agency_kyc_screen.dart` - Agency KYC
- `lib/components/document_upload_card.dart` - Upload component
- `lib/components/kyc_status_badge.dart` - Status indicator
- `lib/components/kyc_prompt_modal.dart` - Verification prompt
- `lib/services/kyc_service.dart` - KYC API service
- `lib/models/kyc_document.dart` - KYC document model
- `lib/providers/kyc_provider.dart` - KYC state
- `lib/utils/image_validator.dart` - Image validation

## API Endpoints to Integrate
- `POST /api/accounts/upload-kyc` - Upload KYC documents
- `GET /api/accounts/kyc-status` - Check verification status
- `POST /api/agency/kyc/submit` - Submit agency KYC

## Acceptance Criteria
- [ ] Users can capture documents with camera
- [ ] Users can select documents from gallery
- [ ] Documents upload to Supabase correctly
- [ ] Image quality is validated before upload
- [ ] Users can track KYC verification status
- [ ] Rejection reasons are displayed clearly
- [ ] Users can resubmit after rejection
- [ ] Agencies can upload business documents
- [ ] KYC prompts appear at appropriate times
- [ ] Upload progress is shown for large files

## Dependencies
- **Requires:** Supabase storage integration
- **Blocks:** Certain job features until verified

## Testing
- [ ] Test camera capture on Android/iOS
- [ ] Test gallery selection
- [ ] Test image upload to Supabase
- [ ] Verify image compression quality
- [ ] Test document validation rules
- [ ] Test KYC status updates
- [ ] Test resubmission flow
- [ ] Verify agency KYC workflow

---
Generated with Claude Code
