# KYC OCR Implementation - Deployment & Testing Guide

## Overview
This PR fixes three critical issues with the KYC OCR implementation:

1. ✅ **Personal KYC**: OCR data not auto-filling form fields
2. ✅ **Business KYC**: OCR not implemented for agency/business documents  
3. ✅ **State Issues**: Submission shows "failed" but status shows "Under Review"

## Changes Summary

### Backend Changes

#### 1. Personal KYC Auto-fill Format Fix
**File**: `apps/backend/src/accounts/models.py`
**Change**: Updated `KYCExtractedData.get_autofill_data()` method

**Before** (flat structure):
```python
{
    "full_name": "Juan Dela Cruz",
    "date_of_birth": "1990-01-15",
    "confidence_scores": {"full_name": 0.95}
}
```

**After** (structured format):
```python
{
    "full_name": {
        "value": "Juan Dela Cruz",
        "confidence": 0.95,
        "source": "ocr"
    },
    "date_of_birth": {
        "value": "1990-01-15",
        "confidence": 0.87,
        "source": "ocr"
    }
}
```

This matches the frontend `KYCExtractedField` interface exactly.

#### 2. Business Document OCR Implementation (NEW)
**Files**: 
- `apps/backend/src/agency/models.py` - New model
- `apps/backend/src/agency/kyc_extraction_parser.py` - Business document parser
- `apps/backend/src/agency/kyc_extraction_service.py` - Extraction orchestration
- `apps/backend/src/agency/services.py` - Trigger extraction
- `apps/backend/src/agency/api.py` - Updated autofill endpoint
- `apps/backend/src/agency/migrations/0006_add_agency_kyc_extracted_data.py` - Database migration

**New Model**: `AgencyKYCExtractedData`
Stores structured extraction results from:
- **Business Permit**: business name, type, address, permit number, DTI/SEC/TIN
- **Representative ID**: name, ID number, birth date, address

**Extraction Pipeline**:
1. Upload business documents → OCR runs (already exists)
2. **NEW**: `process_agency_kyc_extraction()` parses OCR text
3. **NEW**: Stores structured data in `AgencyKYCExtractedData`
4. **NEW**: `/agency/kyc/autofill` endpoint returns structured data

**Parser Features**:
- Extracts business name from capitalized lines
- Finds permit numbers via regex patterns
- Parses DTI/SEC registration numbers
- Extracts TIN (Tax ID)
- Reuses personal KYC parser for representative ID parsing
- Handles date parsing in multiple formats

### Frontend Changes

#### 3. Upload Error Handling & Cache Fix
**File**: `apps/frontend_mobile/iayos_mobile/app/kyc/upload.tsx`

**Changes**:
- Only invalidate cache AFTER confirming `response.ok` (not before)
- Added console logging for debugging
- Improved error messages to distinguish network vs backend errors
- Better error message: "Failed to upload. Please check your connection and try again."

**Why This Fixes Issue #3**:
Previously, cache was invalidated even if upload failed, causing:
1. User sees "Upload Failed" alert
2. But cache was already invalidated and refetched
3. Backend had already saved KYC as "PENDING"
4. User goes back → sees "Under Review" (confusing!)

Now:
1. Upload fails → no cache invalidation → user sees old state
2. Upload succeeds → cache invalidated → user sees "PENDING" status
3. Consistent state management

## Deployment Steps

### 1. Backend Deployment

```bash
# 1. Pull latest changes
git pull origin copilot/fix-ocr-scanning-issues

# 2. Run database migration (REQUIRED!)
cd apps/backend/src
python manage.py migrate agency

# This will create the 'agency_kyc_extracted_data' table

# 3. Restart backend server
# (depends on your deployment setup - Docker/systemd/etc)
```

### 2. Frontend Deployment

```bash
# 1. Pull latest changes (if separate repo)
git pull origin copilot/fix-ocr-scanning-issues

# 2. Install dependencies (if needed)
cd apps/frontend_mobile/iayos_mobile
npm install

# 3. Rebuild mobile app
npm run build
# or
expo build:android
expo build:ios
```

## Testing Checklist

### Personal KYC Testing

**Test Case 1**: Auto-fill with high confidence data
1. Upload valid Philippine National ID (front + back)
2. Upload NBI/Police clearance
3. Upload selfie
4. Click "Review Details" button
5. **Expected**: Form fields auto-populated with extracted data
6. **Check**: Confidence badges show green (90%+) for accurate fields

**Test Case 2**: Edit low confidence fields
1. Same as Test Case 1
2. Find fields with yellow/red confidence badges
3. Edit the field value
4. Click "Confirm Details"
5. **Expected**: Data saved, "edited" badge appears
6. Navigate to status page
7. **Expected**: Status shows "Under Review" (not "Confirmed" yet)

**Test Case 3**: Skip confirmation
1. Upload documents
2. Click "Skip" instead of "Review Details"
3. Navigate to status page
4. **Expected**: Status shows "Under Review"
5. Data can still be confirmed later

### Business KYC Testing

**Test Case 1**: Business permit extraction
1. As agency user, upload business permit
2. Upload representative ID (front + back)
3. Click submit
4. Navigate to agency KYC status
5. Click "Review Business Details" (if implemented)
6. **Expected**: 
   - Business name extracted
   - Permit number extracted
   - Business address extracted
   - DTI/SEC/TIN extracted (if present)

**Test Case 2**: Representative ID extraction
1. Same as Test Case 1
2. **Expected**:
   - Representative name extracted from ID
   - Rep ID number extracted
   - Rep birth date extracted
   - Rep address extracted from ID back

**Test Documents to Test With**:
- Philippine Mayor's Permit / Business Permit
- DTI Registration Certificate
- SEC Registration (for corporations)
- Representative's valid ID (National ID, Driver's License, Passport)

### State Management Testing

**Test Case 1**: Successful upload → correct status
1. Upload all KYC documents
2. Wait for upload to complete
3. **Expected**: "Documents Uploaded!" success message
4. Click "Skip" or "Review Details"
5. Navigate away and back
6. **Expected**: Status consistently shows "Under Review"

**Test Case 2**: Upload failure → no status change
1. Turn off internet / backend
2. Try to upload documents
3. **Expected**: "Upload Failed. Please check your connection..." error
4. Navigate to status page
5. **Expected**: Status still shows previous state (not changed)

**Test Case 3**: Extraction pending → retry works
1. Upload documents
2. Immediately click "Review Details"
3. **Expected**: "Processing Your Documents" screen
4. Click "Check Again" button after 30 seconds
5. **Expected**: Extracted data appears (if extraction completed)

## API Endpoints Reference

### Personal KYC
- `GET /api/accounts/kyc/autofill` - Get extracted personal data
- `POST /api/accounts/kyc/confirm` - Confirm/edit extracted data
- `GET /api/accounts/kyc-status` - Get KYC status
- `POST /api/accounts/upload-kyc` - Upload personal KYC documents

### Agency/Business KYC
- `GET /api/agency/kyc/autofill` - Get extracted business data (**NEW FORMAT**)
- `POST /api/agency/kyc/confirm` - Confirm/edit business data (existing)
- `GET /api/agency/kyc/status` - Get agency KYC status
- `POST /api/agency/upload` - Upload business KYC documents

## Expected Response Formats

### `/api/accounts/kyc/autofill` (Personal KYC)
```json
{
  "success": true,
  "has_extracted_data": true,
  "extraction_status": "EXTRACTED",
  "needs_confirmation": true,
  "extracted_at": "2025-01-26T10:30:00Z",
  "confirmed_at": null,
  "fields": {
    "full_name": {
      "value": "Juan Dela Cruz",
      "confidence": 0.95,
      "source": "ocr"
    },
    "date_of_birth": {
      "value": "1990-01-15",
      "confidence": 0.87,
      "source": "ocr"
    },
    "address": {
      "value": "123 Main St, Manila",
      "confidence": 0.82,
      "source": "ocr"
    },
    "id_number": {
      "value": "1234-5678-9012-3456",
      "confidence": 0.91,
      "source": "ocr"
    }
  },
  "user_edited_fields": []
}
```

### `/api/agency/kyc/autofill` (Business KYC)
```json
{
  "success": true,
  "has_extracted_data": true,
  "extraction_status": "EXTRACTED",
  "needs_confirmation": true,
  "extracted_at": "2025-01-26T10:30:00Z",
  "confirmed_at": null,
  "fields": {
    "business_name": {
      "value": "ABC Construction Services",
      "confidence": 0.88,
      "source": "ocr"
    },
    "business_address": {
      "value": "456 Business Ave, Quezon City",
      "confidence": 0.75,
      "source": "ocr"
    },
    "permit_number": {
      "value": "BP-2025-12345",
      "confidence": 0.92,
      "source": "ocr"
    },
    "tin": {
      "value": "123-456-789-000",
      "confidence": 0.85,
      "source": "ocr"
    },
    "rep_full_name": {
      "value": "Maria Santos",
      "confidence": 0.94,
      "source": "ocr"
    },
    "rep_id_number": {
      "value": "9876-5432-1098-7654",
      "confidence": 0.90,
      "source": "ocr"
    }
  },
  "user_edited_fields": []
}
```

## Troubleshooting

### Issue: "No extracted data available yet"
**Cause**: Extraction hasn't completed or failed
**Solution**:
1. Check backend logs for extraction errors
2. Verify OCR text exists in `kycFiles.ocr_text` or `AgencyKycFile.ocr_text`
3. Manually trigger: `process_kyc_extraction(kyc_record)` in Django shell
4. Check `extraction_status` field in database

### Issue: Form fields empty despite successful extraction
**Cause**: Backend format doesn't match frontend expectations
**Solution**:
1. Check API response in browser DevTools Network tab
2. Verify each field has `{value, confidence, source}` structure
3. Check `useKYCAutofill` hook is being called
4. Verify React Query cache with React DevTools

### Issue: "Upload failed" but status shows "Under Review"
**Cause**: Cache invalidation timing (should be fixed now)
**Solution**:
1. Pull latest changes (this PR)
2. Clear app cache/storage
3. Re-test upload flow
4. Check browser console for errors

### Issue: Migration fails
**Cause**: Database schema conflicts
**Solution**:
```bash
# Rollback and retry
python manage.py migrate agency 0005
python manage.py migrate agency 0006

# Or reset migrations (DEV ONLY!)
python manage.py migrate agency zero
python manage.py migrate agency
```

## Performance Notes

- **Extraction time**: ~2-5 seconds per document
- **Cache duration**: 5 minutes (personal KYC), 2 minutes (autofill)
- **Database impact**: New table with ~40 columns, one row per agency KYC
- **API response size**: ~2-5KB (structured JSON)

## Security Considerations

- All endpoints require authentication (`cookie_auth` or `dual_auth`)
- OCR text limited to 2000 characters per document (prevents DoS)
- No PII exposed in logs (only field names, not values)
- Extraction runs on backend only (not client-side)
- Confidence scores help identify potentially incorrect data

## Future Enhancements (Out of Scope)

- [ ] Create mobile UI for agency KYC confirmation screen
- [ ] Add more sophisticated NLP-based extraction (beyond regex)
- [ ] Support for more document types (BIR, SSS, etc.)
- [ ] Real-time extraction status updates via WebSocket
- [ ] Admin panel to review/override extraction results
- [ ] Batch extraction for multiple agencies

## Support

For issues or questions:
1. Check backend logs: `apps/backend/logs/`
2. Check frontend console: Mobile app React DevTools
3. Test API directly: Use Postman/curl with auth token
4. Django shell inspection:
```python
from agency.models import AgencyKYCExtractedData
data = AgencyKYCExtractedData.objects.get(agencyKyc_id=123)
print(data.get_autofill_data())
```
