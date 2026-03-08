## Summary
- add resource-efficient backend selfie eyewear detection (heuristic, no heavy new model)
- enforce strict reject/manual-review thresholds via feature flags
- align mobile KYC selfie flow to require clear face + no glasses (remove hold-ID-in-selfie requirement)
- update mobile changelog

## Backend
- `accounts/document_verification_service.py`
  - added SELFIE eyewear heuristic check in `validate_document_quick`
  - added helper methods for eye/bridge ROI metrics
  - returns reject on high-confidence eyewear; manual-review on uncertain/unavailable checks
- `iayos_project/settings.py`
  - `KYC_SELFIE_GLASSES_BLOCK`
  - `KYC_SELFIE_GLASSES_STRICT_CONFIDENCE`
  - `KYC_SELFIE_GLASSES_REVIEW_CONFIDENCE`

## Mobile
- `app/kyc/camera.tsx`
  - removed ID-in-selfie checklist and capture gating
  - updated selfie guidance/tips text
- `app/kyc/upload.tsx`
  - removed "hold ID next to face" instruction
- `lib/types/kyc.ts`
  - updated SELFIE metadata text
- `CHANGELOG.md`
  - added unreleased fix entry

## Validation
- `python -m py_compile apps/backend/src/accounts/document_verification_service.py`
- `python -m py_compile apps/backend/src/iayos_project/settings.py`
- editor diagnostics: no errors in touched files

## Notes
- PR intentionally excludes unrelated working tree changes.
