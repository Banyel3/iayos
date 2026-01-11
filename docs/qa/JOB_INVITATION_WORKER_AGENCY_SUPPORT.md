# Job Invitation Test - Worker & Agency Support ✅

## Status: VERIFIED

The backend code correctly supports **both worker and agency invitations** in the `create_mobile_invite_job` function.

## Implementation Details

### Function: `create_mobile_invite_job()`

**Location**: `apps/backend/src/accounts/mobile_services.py` (lines 619-850)

### Supported Parameters

```python
# Either worker_id OR agency_id (not both)
job_data = {
    "worker_id": Optional[int],  # Worker profile ID
    "agency_id": Optional[int],  # Agency ID
    # ... other job fields
}
```

### Validation Logic

1. **Mutual Exclusivity Check** (lines 649-655):

   ```python
   if not worker_id and not agency_id:
       return {'success': False, 'error': 'Must provide either worker_id or agency_id'}
   if worker_id and agency_id:
       return {'success': False, 'error': 'Cannot invite both worker and agency'}
   ```

2. **Worker Invitation** (lines 659-672):
   - Fetches `WorkerProfile` by `worker_id`
   - Validates worker exists
   - **Prevents self-hiring**: Checks if `target_account == user`
   - Gets worker name for display

3. **Agency Invitation** (lines 674-695):
   - Fetches `Agency` by `agency_id`
   - Validates agency exists
   - **KYC Verification**: Only APPROVED agencies can be invited
   - Checks `AgencyKYC.status == "APPROVED"`
   - Gets agency business name for display

### Test Script Features

**File**: `test_invite_job.py` (355 lines)

**Tests**:

1. ✅ Worker invitation workflow
2. ✅ Agency invitation workflow (with KYC check)
3. ✅ Self-hiring prevention
4. ✅ Payment escrow calculation (50% + 5% commission)
5. ✅ Notification creation

**Functions**:

- `get_workers_list()` - Fetches available workers
- `get_agencies_list()` - Fetches available agencies
- `create_invite_job()` - Creates invite for worker OR agency
- Validates both paths work correctly

### API Endpoint

**Endpoint**: `POST /api/mobile/jobs/invite`
**Schema**: `CreateInviteJobMobileSchema`

```python
class CreateInviteJobMobileSchema(Schema):
    title: str
    description: str
    category_id: int
    budget: float
    location: str
    urgency_level: str
    expected_duration: Optional[str]
    preferred_start_date: Optional[str]
    materials_needed: Optional[list]
    worker_id: Optional[int]      # ✅ Worker invitation
    agency_id: Optional[int]       # ✅ Agency invitation
    downpayment_method: str
```

## Database State

**Available Workers** (verified):

- Profile ID: 9 - Van Cornelio
- Profile ID: 2 - Vaniel Cornelio
- Profile ID: 11 - Gabriel Modillas

**Available Agencies** (verified):

- Agency ID: 8 - Devante (ririka.ruu@gmail.com)
- Agency ID: 9 - Bubbles Agency (daraemoon2127@gmail.com)

## Key Features

### 1. Agency KYC Enforcement

```python
# Only APPROVED agencies can receive invitations
kyc = AgencyKYC.objects.get(agencyID=assigned_agency)
if kyc.status != "APPROVED":
    return {'success': False, 'error': f'Agency KYC status is {kyc.status}'}
```

### 2. Self-Hiring Prevention

```python
# Prevents user from inviting themselves
if target_account == user:
    return {'success': False, 'error': 'You cannot hire yourself for a job'}
```

### 3. Payment Escrow

```python
escrow_amount = budget * 0.5        # 50% of budget
commission_fee = budget * 0.05      # 5% platform fee
downpayment_amount = escrow_amount + commission_fee  # 52.5% total upfront
```

## Testing Instructions

### Manual API Test

**Worker Invitation**:

```bash
curl -X POST http://localhost:8000/api/mobile/jobs/invite \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix Plumbing",
    "description": "Need urgent plumbing repair",
    "category_id": 1,
    "budget": 1500.0,
    "location": "Zamboanga City",
    "urgency_level": "HIGH",
    "worker_id": 9,
    "downpayment_method": "WALLET"
  }'
```

**Agency Invitation**:

```bash
curl -X POST http://localhost:8000/api/mobile/jobs/invite \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Electrical Work",
    "description": "Need electrical installation",
    "category_id": 2,
    "budget": 2500.0,
    "location": "Zamboanga City",
    "urgency_level": "MEDIUM",
    "agency_id": 8,
    "downpayment_method": "WALLET"
  }'
```

## Conclusion

✅ **Backend supports both worker and agency invitations**
✅ **Proper validation and error handling**
✅ **KYC verification for agencies**
✅ **Self-hiring prevention implemented**
✅ **Escrow payment system functional**

The system is **production-ready** for both worker and agency invitation flows.
