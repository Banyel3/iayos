# Wallet Deposit Fix - Schema Issue

## Problem

When clicking "Add Funds" and confirming the amount, the API returned:

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["query", "amount"],
      "msg": "Field required"
    }
  ]
}
```

## Root Cause

Django Ninja was treating function parameters as **query parameters** instead of **request body** parameters.

### Before (Wrong):

```python
@router.post("/wallet/deposit", auth=cookie_auth)
def deposit_funds(request, amount: float, payment_method: str = "GCASH"):
    # Django Ninja expects: /wallet/deposit?amount=500&payment_method=GCASH
    # But frontend sends: {"amount": 500, "payment_method": "GCASH"} in body
```

### After (Fixed):

```python
@router.post("/wallet/deposit", auth=cookie_auth)
def deposit_funds(request, data: DepositFundsSchema):
    # Django Ninja now expects JSON body with schema
    amount = data.amount
    payment_method = data.payment_method
```

## Fix Applied

### 1. Created Schema in `accounts/schemas.py`:

```python
class DepositFundsSchema(Schema):
    """Schema for wallet deposit request"""
    amount: float
    payment_method: Optional[str] = "GCASH"
```

### 2. Updated API Endpoint in `accounts/api.py`:

- Imported `DepositFundsSchema`
- Changed function signature to accept `data: DepositFundsSchema`
- Extract `amount` and `payment_method` from schema
- Added debug logging

### 3. Frontend Already Correct:

```typescript
body: JSON.stringify({
  amount: Number(fundAmount),
  payment_method: "GCASH",
});
```

## How It Works Now

1. **Frontend** sends POST request with JSON body:

   ```json
   {
     "amount": 500,
     "payment_method": "GCASH"
   }
   ```

2. **Django Ninja** validates against `DepositFundsSchema`

3. **Backend** processes:
   - Creates pending transaction
   - Calls Xendit API to create invoice
   - Returns payment URL

4. **Frontend** redirects to Xendit payment page

## Testing

Start Django server:

```bash
cd C:\code\iayos\apps\backend\src
..\venv\Scripts\python.exe manage.py runserver
```

Try adding funds:

1. Go to profile page
2. Click "Add Funds"
3. Enter amount (e.g., 500)
4. Click confirm
5. Should redirect to Xendit payment page (no more errors!)

## Debug Output

Console will show:

```
📥 Deposit request received: amount=500.0, payment_method=GCASH
✅ Payment invoice created for transaction 123
```

## Status

✅ Fixed - Ready to test!
