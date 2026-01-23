# GCash Payment WebView Fix

**Date**: January 15, 2025  
**Status**: ✅ FIXED  
**Issue**: "Invalid Payment details" error preventing navigation to Xendit payment screen

---

## Problem Summary

When creating a job request with GCash payment method, the backend successfully:

- ✅ Created job posting (ID: 17, 18, 19)
- ✅ Generated Xendit invoice with URL
- ✅ Created escrow transaction
- ✅ Returned complete response with all payment data

However, the frontend showed:

- ❌ "Invalid Payment details" error
- ❌ Failed to navigate to payment WebView

---

## Root Cause Analysis

The `gcash.tsx` payment screen had **parameter name mismatches**:

### Expected Parameters (Old)

```typescript
// gcash.tsx expected:
- jobId: number (required)
- budget: number (required)  ❌
- title: string (optional)
```

### Passed Parameters (From create/index.tsx)

```typescript
// create/index.tsx passed:
- invoiceUrl: string        ✅
- jobId: number              ✅
- amount: number             ❌ (not 'budget')
```

### Validation Logic

```typescript
// gcash.tsx lines 22-23
const jobBudget = params.budget ? parseFloat(params.budget as string) : 0;

if (!jobId || !jobBudget) {
  // Shows "Invalid payment details" error
  return <ErrorScreen />;
}
```

Since `params.budget` was undefined, `jobBudget` became `0`, triggering the error screen.

---

## Additional Issue: Duplicate Invoice Creation

The `gcash.tsx` screen was designed to **create its own Xendit invoice** on mount:

```typescript
useEffect(() => {
  if (jobId && jobBudget) {
    createInvoice.mutate(
      { jobId, amount: total },
      {
        onSuccess: (data) => setXenditUrl(data.invoiceUrl),
      }
    );
  }
}, [jobId, jobBudget]);
```

But our **backend already creates the invoice** during job creation. This would have caused:

- ⚠️ Duplicate Xendit invoices
- ⚠️ Billing confusion (two invoices for one job)
- ⚠️ Unnecessary API call delay

---

## Solution Implemented

### 1. Accept Both Parameter Names (Backwards Compatible)

**File**: `apps/frontend_mobile/iayos_mobile/app/payments/gcash.tsx`

```typescript
// Accept both 'amount' (new) and 'budget' (old)
const jobBudget = params.amount
  ? parseFloat(params.amount as string)
  : params.budget
    ? parseFloat(params.budget as string)
    : 0;

// Accept pre-generated invoice URL from backend
const backendInvoiceUrl = params.invoiceUrl as string | undefined;
```

### 2. Use Backend Invoice (Skip Duplicate Creation)

```typescript
const [xenditUrl, setXenditUrl] = useState<string | null>(
  backendInvoiceUrl || null
);

useEffect(() => {
  if (backendInvoiceUrl) {
    // Backend already created invoice, use it
    setXenditUrl(backendInvoiceUrl);
    return;
  }

  // Fallback: create invoice if backend didn't provide one
  if (jobId && jobBudget) {
    createInvoice.mutate(
      { jobId, amount: total },
      {
        onSuccess: (data) => setXenditUrl(data.invoiceUrl),
      }
    );
  }
}, [jobId, jobBudget, backendInvoiceUrl]);
```

### 3. Update Loading Condition

```typescript
{(createInvoice.isPending || !xenditUrl) && !backendInvoiceUrl ? (
  <LoadingScreen />
) : (
  <WebView source={{ uri: xenditUrl! }} />
)}
```

### 4. Pass Job Title for Better UX

**File**: `apps/frontend_mobile/iayos_mobile/app/jobs/create/index.tsx`

```typescript
router.push({
  pathname: "/payments/gcash",
  params: {
    invoiceUrl: data.invoice_url,
    jobId: data.job_posting_id.toString(),
    amount: data.escrow_amount.toString(),
    title: title || "Job Request", // Better header display
  },
} as any);
```

---

## Benefits of This Approach

✅ **No Duplicate Invoices**: Uses backend's pre-generated invoice  
✅ **Faster UX**: WebView loads immediately (no wait for invoice creation)  
✅ **Backwards Compatible**: Still supports old `budget` parameter  
✅ **Consistent Data**: Single source of truth (backend)  
✅ **Better Error Handling**: Validates amount/budget with fallback

---

## Testing Checklist

- [ ] Create job request with GCash payment
- [ ] Verify navigation to `/payments/gcash` screen
- [ ] Confirm WebView loads Xendit checkout URL
- [ ] Test GCash payment flow (success/failure callbacks)
- [ ] Verify no duplicate Xendit invoices in backend logs
- [ ] Check payment status updates correctly
- [ ] Test with old flow (budget param) for backwards compatibility

---

## Backend Response Example

```json
{
  "success": true,
  "requires_payment": true,
  "payment_method": "GCASH",
  "job_posting_id": 19,
  "escrow_amount": 250.0,
  "remaining_payment": 250.0,
  "invoice_url": "https://checkout-staging.xendit.co/web/691db717c08d0a3d176cda9f",
  "invoice_id": "691db717c08d0a3d176cda9f",
  "transaction_id": 30,
  "new_wallet_balance": 2900.01,
  "message": "Job created successfully! Auto-assigned to worker: Vaniel Cornelio. Complete GCash payment to confirm the job."
}
```

---

## Files Modified

1. **`apps/frontend_mobile/iayos_mobile/app/payments/gcash.tsx`**
   - Accept `amount` and `invoiceUrl` parameters
   - Skip invoice creation if backend URL provided
   - Update loading condition for immediate WebView display

2. **`apps/frontend_mobile/iayos_mobile/app/jobs/create/index.tsx`**
   - Pass `title` parameter for better UX
   - Already passing correct `amount` and `invoiceUrl`

---

## Next Steps

1. **Test on device/emulator**: Verify WebView loads Xendit checkout
2. **Complete payment flow**: Test GCash payment → webhook → status update
3. **Monitor backend logs**: Ensure single invoice per job
4. **User acceptance**: Confirm UX improvement (faster navigation)

---

## Related Documentation

- Backend endpoint: `apps/backend/src/jobs/api.py` - `create_job_posting_mobile()`
- Payment hooks: `apps/frontend_mobile/iayos_mobile/lib/hooks/usePayments.ts`
- Xendit integration: Backend uses `xendit-python==7.0.0`

---

**Status**: ✅ Ready for testing on device  
**Expected Outcome**: Seamless navigation to WebView with Xendit checkout URL
