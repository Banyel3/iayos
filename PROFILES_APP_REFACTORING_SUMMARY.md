# Profiles App Refactoring Summary

## Overview

Successfully refactored profile and wallet-related endpoints from the `accounts` app into a new dedicated `profiles` Django app. This improves code organization by separating user profile management, wallet operations, and transaction history into its own module.

## Changes Made

### Backend Changes

#### 1. Created New Django App: `profiles`

```bash
python manage.py startapp profiles
```

**Location:** `apps/backend/src/profiles/`

**Files Created/Modified:**

- `profiles/models.py` - Re-exports Wallet and Transaction from accounts.models
- `profiles/schemas.py` - Deposit funds schema
- `profiles/api.py` - All profile and wallet-related API endpoints

#### 2. Profiles API Endpoints (`profiles/api.py`)

**New Router:** `/api/profiles/`

**Profile Endpoints:**

1. `POST /api/profiles/upload/profile-image` - Upload profile image to Supabase

**Wallet Endpoints:** 2. `GET /api/profiles/wallet/balance` - Get user's wallet balance 3. `POST /api/profiles/wallet/deposit` - Deposit funds (Xendit integration) 4. `POST /api/profiles/wallet/withdraw` - Withdraw funds 5. `GET /api/profiles/wallet/transactions` - Get transaction history 6. `POST /api/profiles/wallet/webhook` - Xendit payment webhook handler 7. `POST /api/profiles/wallet/simulate-payment/{transaction_id}` - Dev: simulate payment completion 8. `GET /api/profiles/wallet/payment-status/{transaction_id}` - Check payment status

**Code Moved:** ~550 lines from `accounts/api.py`

#### 3. Updated Configuration Files

**`iayos_project/settings.py`:**

```python
INSTALLED_APPS = [
    # ...
    'accounts',
    'adminpanel',
    'jobs',
    'profiles',  # NEW
]
```

**`iayos_project/urls.py`:**

```python
from profiles.api import router as profiles_router

api.add_router("/profiles/", profiles_router)
```

#### 4. Cleaned Up Accounts App

**`accounts/api.py`:**

- Removed profile image upload endpoint (line 539-580)
- Removed all wallet endpoints (lines 582-1063):
  - wallet/balance
  - wallet/deposit
  - wallet/withdraw
  - wallet/transactions
  - wallet/webhook
  - wallet/simulate-payment
  - wallet/payment-status
- Removed import: `DepositFundsSchema`

**Note:** Wallet and Transaction models remain in `accounts/models.py` to avoid database migrations. The `profiles/models.py` re-exports them for API use.

### Frontend Changes

Updated API endpoint URLs in 2 files:

#### 1. `app/dashboard/profile/page.tsx`

**Changed (3 endpoints):**

```typescript
// Before
"http://localhost:8000/api/accounts/wallet/balance";
"http://localhost:8000/api/accounts/wallet/transactions";
"http://localhost:8000/api/accounts/wallet/deposit";

// After
"http://localhost:8000/api/profiles/wallet/balance";
"http://localhost:8000/api/profiles/wallet/transactions";
"http://localhost:8000/api/profiles/wallet/deposit";
```

#### 2. `app/dashboard/profile/edit/page.tsx`

**Changed:**

```typescript
// Before
"http://localhost:8000/api/accounts/upload/profile-image";

// After
"http://localhost:8000/api/profiles/upload/profile-image";
```

## API Endpoint Changes

### Old Routes (accounts app)

- `POST /api/accounts/upload/profile-image`
- `GET /api/accounts/wallet/balance`
- `POST /api/accounts/wallet/deposit`
- `POST /api/accounts/wallet/withdraw`
- `GET /api/accounts/wallet/transactions`
- `POST /api/accounts/wallet/webhook`
- `POST /api/accounts/wallet/simulate-payment/{transaction_id}`
- `GET /api/accounts/wallet/payment-status/{transaction_id}`

### New Routes (profiles app)

- `POST /api/profiles/upload/profile-image`
- `GET /api/profiles/wallet/balance`
- `POST /api/profiles/wallet/deposit`
- `POST /api/profiles/wallet/withdraw`
- `GET /api/profiles/wallet/transactions`
- `POST /api/profiles/wallet/webhook`
- `POST /api/profiles/wallet/simulate-payment/{transaction_id}`
- `GET /api/profiles/wallet/payment-status/{transaction_id}`

## Database Impact

**No database migrations required!**

The Wallet and Transaction models remain in the accounts app's database tables. The profiles app simply re-exports these models, avoiding the need for complex database migrations.

## Features Covered

### Profile Management

- ✅ Profile image upload to Supabase storage
- ✅ Image validation (type, size)
- ✅ Automatic file path generation

### Wallet Operations

- ✅ Get wallet balance
- ✅ Deposit funds via GCash (Xendit integration)
- ✅ Withdraw funds
- ✅ **TEST MODE**: Instant fund approval
- ✅ Xendit invoice generation

### Transaction Management

- ✅ Transaction history (last 50)
- ✅ Transaction status tracking
- ✅ Balance tracking after each transaction
- ✅ Payment method recording

### Payment Integration

- ✅ Xendit webhook handling
- ✅ Payment status polling
- ✅ Development payment simulation
- ✅ Invoice status checking

## Benefits

1. **Better Code Organization** - Profile/wallet code is now in its own dedicated app
2. **Cleaner API Structure** - `/api/profiles/` is more intuitive for profile-related operations
3. **Separation of Concerns** - Accounts app focuses on authentication, profiles app handles user data & wallet
4. **Easier Maintenance** - Profile and wallet features are isolated and easier to find/modify
5. **Django Best Practices** - Each app handles one domain of functionality
6. **Scalability** - Easy to add more profile-related features in the future

## Testing Checklist

✅ Django configuration check passed (`python manage.py check`)

- [ ] Test profile image upload
- [ ] Test wallet balance retrieval
- [ ] Test deposit funds (Xendit flow)
- [ ] Test transaction history display
- [ ] Test withdraw funds
- [ ] Test payment status polling
- [ ] Verify Xendit webhook handling (if possible)
- [ ] Verify TEST MODE instant approval

## Files Changed

### Backend (6 files)

1. `apps/backend/src/profiles/models.py` - Created (re-exports)
2. `apps/backend/src/profiles/schemas.py` - Created
3. `apps/backend/src/profiles/api.py` - Created (~550 lines)
4. `apps/backend/src/iayos_project/settings.py` - Modified (added 'profiles')
5. `apps/backend/src/iayos_project/urls.py` - Modified (added router)
6. `apps/backend/src/accounts/api.py` - Modified (removed ~530 lines)

### Frontend (2 files)

1. `apps/frontend_web/app/dashboard/profile/page.tsx` - Modified (3 URL changes)
2. `apps/frontend_web/app/dashboard/profile/edit/page.tsx` - Modified (1 URL change)

## Integration Dependencies

The profiles app depends on:

- **accounts.models** - Wallet, Transaction, Profile models
- **accounts.authentication** - cookie_auth decorator
- **accounts.services** - upload_profile_image_service
- **accounts.xendit_service** - XenditService for payment processing

## Environment Variables Required

For Xendit integration (already configured):

- `XENDIT_SECRET_KEY` - Xendit API secret key
- `XENDIT_WEBHOOK_TOKEN` - Webhook verification token
- `XENDIT_PUBLIC_KEY` - Xendit public key (if needed)

## Supabase Integration

Profile image upload uses:

- **Storage Bucket**: Configured in settings
- **Path Pattern**: `users/user_{userID}/profileImage/avatar.png`
- **Public Access**: URLs are public after upload
- **File Types**: JPEG, PNG, JPG, WEBP
- **Max Size**: 5MB

## Payment Flow (TEST MODE)

1. User requests deposit via `/api/profiles/wallet/deposit`
2. **Funds added immediately** to wallet (TEST MODE)
3. Transaction created with COMPLETED status
4. Xendit invoice created for user experience
5. Payment URL returned to frontend
6. User can view Xendit page (optional)
7. Webhook can still update status (if paid)

## Migration Notes

Since the models remain in the accounts app, existing data is preserved. Future new profile/wallet-related models can be added to the profiles app and will require migrations.

## Next Steps

1. Run backend server and test all endpoints
2. Test profile image upload functionality
3. Test wallet deposit flow (Xendit)
4. Test transaction history display
5. Verify payment webhook handling
6. Test withdrawal functionality

## Summary

✅ **Profiles app created**
✅ **8 endpoints migrated**
✅ **2 frontend files updated**
✅ **Django check passed**
✅ **No database migrations needed**
✅ **Xendit integration preserved**
✅ **Supabase integration preserved**
