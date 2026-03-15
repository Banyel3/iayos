## Summary
- Removed remaining 2-hour minimum-work-duration guard from DAILY client checkout endpoint.
- Client can now mark checkout immediately after verified arrival (time_in exists), matching intended flow.

## Endpoint
- POST /api/jobs/{job_id}/daily/attendance/{attendance_id}/mark-checkout

## File
- apps/backend/src/jobs/api.py

## Why
Users still hit blocker: "Checkout is allowed only after 2 hours of work". This guard should no longer exist.
