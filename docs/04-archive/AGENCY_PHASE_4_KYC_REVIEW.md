# [Agency] Phase 4: KYC Review & Resubmission System

**Labels:** `priority:medium`, `type:feature`, `area:agency`, `area:kyc`
**Priority:** MEDIUM
**Estimated Time:** 15-20 hours

## Summary
Enhance agency KYC verification with admin review improvements and resubmission workflow.

## Tasks

### Admin Review Enhancements
- [ ] Add detailed rejection reasons field to AgencyKYC model
- [ ] Create structured rejection categories (Invalid Document, Expired, Unclear, etc.)
- [ ] Implement admin notes/comments system for KYC reviews
- [ ] Add document verification checklist for admins
- [ ] Create KYC review history tracking

### Resubmission Workflow
- [ ] Create API endpoint: `POST /api/agency/kyc/resubmit`
- [ ] Allow agencies to resubmit after rejection
- [ ] Display rejection reasons to agencies
- [ ] Implement document replacement (not full re-upload)
- [ ] Add resubmission notification to admins
- [ ] Track resubmission attempts

### Frontend Implementation
- [ ] Create agency KYC status page (`/agency/kyc/status`)
- [ ] Display rejection reasons clearly
- [ ] Build resubmission interface
- [ ] Enhance admin KYC review page with checklist
- [ ] Add admin comment section

## Files to Create/Modify
- `apps/backend/src/agency/models.py` - Add rejection fields and history
- `apps/backend/src/agency/api.py` - Add resubmission endpoints
- `apps/backend/src/agency/migrations/0003_kyc_enhancements.py` - New migration
- `apps/frontend_web/app/agency/kyc/status/page.tsx` - NEW KYC status page
- `apps/frontend_web/app/agency/kyc/resubmit/page.tsx` - NEW resubmission page
- `apps/frontend_web/app/admin/kyc/review/[id]/page.tsx` - Enhance review page
- `apps/backend/src/accounts/models.py` - Add KYC resubmission notification types

## Acceptance Criteria
- [ ] Admins can provide detailed rejection reasons
- [ ] Agencies see clear explanation of rejection
- [ ] Agencies can resubmit specific documents
- [ ] Resubmission attempts are tracked and limited (max 3)
- [ ] Admin review page includes verification checklist
- [ ] All KYC changes are logged with timestamps

## Dependencies
- **Requires:** Agency Phase 1 - accountType implementation for proper agency identification

## Testing
- [ ] Test admin rejection with various reason categories
- [ ] Test agency resubmission flow
- [ ] Verify document replacement (not duplication)
- [ ] Test resubmission limit enforcement
- [ ] Verify notification delivery for resubmissions

---
Generated with Claude Code
