## Summary
Implemented a complete end-of-duration path for single DAILY jobs so they no longer get stuck when configured days are reached.

### Backend
- Added `POST /api/jobs/{job_id}/daily/extend-one-day`
  - Client-only action
  - Immediately charges wallet for 1 extra day (daily rate * workers + platform fee)
  - Adds escrow and increments `duration_days`
- Added `POST /api/jobs/{job_id}/daily/finish`
  - Client-only action
  - Marks DAILY job as finished (`status=COMPLETED`) and unlocks review/backjob flow
- Added `total_days_worked` in conversation job payload

### Mobile (Conversation)
- Added end-of-duration card when DAILY duration is reached (or QA offset reached max):
  - `Extend +1 Day` (escrow top-up)
  - `Job Finished` (enter normal review/backjob lifecycle)
- QA Skip Next Day button now hides at configured max and shows guidance instead of hard-failing loop.

## Why
QA skip currently hard-stops at configured duration (`cannot advance QA day beyond configured duration_days`) and leaves job without completion/extension actions, causing stuck DAILY jobs.

## Files
- apps/backend/src/jobs/api.py
- apps/backend/src/profiles/api.py
- apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx
- apps/frontend_mobile/iayos_mobile/lib/api/config.ts
- apps/frontend_mobile/iayos_mobile/lib/hooks/useDailyPayment.ts
- apps/frontend_mobile/iayos_mobile/lib/hooks/useMessages.ts
