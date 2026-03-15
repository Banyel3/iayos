## Summary
- Fixed DAILY chat worker-side "On The Way" state not reflecting reliably after tap.
- Added robust attendance identity mapping (worker profile ID + worker account ID fallback).
- Added optimistic conversation cache patch after worker on-the-way success to prevent duplicate tap confusion.
- Added backend websocket broadcast + client notification on DAILY worker on-the-way.
- Included worker account ID in conversation attendance payload.

## Root Cause
Worker-side attendance matching depended only on workerProfileId. In some sessions this did not resolve, so the button remained visible and second tap hit backend duplicate guard ("already marked on the way").

## Files
- apps/backend/src/accounts/mobile_api.py
- apps/backend/src/profiles/api.py
- apps/frontend_mobile/iayos_mobile/app/conversation/[conversationId].tsx
- apps/frontend_mobile/iayos_mobile/lib/hooks/useDailyPayment.ts
- apps/frontend_mobile/iayos_mobile/lib/hooks/useMessages.ts
