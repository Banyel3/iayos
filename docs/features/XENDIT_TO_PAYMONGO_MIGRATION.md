# Xendit to PayMongo Migration Guide

## Overview

This document details the migration from Xendit to PayMongo as the primary payment gateway for iAyos. The migration uses a provider abstraction layer that allows seamless switching between providers via environment configuration.

## Architecture

### Payment Provider Abstraction

```
┌─────────────────────────────────────────────────────────────┐
│                    API Endpoints                            │
│  (deposit_funds, create_escrow, webhook handlers)           │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              PaymentProviderInterface                       │
│  (payment_provider.py - abstract base class)                │
│                                                             │
│  Methods:                                                   │
│  - create_checkout_session()                                │
│  - create_gcash_payment()                                   │
│  - create_disbursement()                                    │
│  - get_payment_status()                                     │
│  - verify_webhook_signature()                               │
│  - parse_webhook_payload()                                  │
└─────────────────────────────┬───────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  PayMongoService │ │  XenditProvider  │ │  Future Provider │
│  (paymongo_      │ │  (xendit_        │ │  (e.g., Maya)    │
│   service.py)    │ │   provider.py)   │ │                  │
│                  │ │                  │ │                  │
│  PRIMARY         │ │  LEGACY/ROLLBACK │ │  EXTENSIBLE      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Provider Selection

Provider is selected via `PAYMENT_PROVIDER` environment variable:

```python
# settings.py
PAYMENT_PROVIDER = os.getenv("PAYMENT_PROVIDER", "paymongo")  # Default: paymongo

# In code:
from .payment_provider import get_payment_provider
provider = get_payment_provider()  # Returns PayMongoService or XenditProvider
```

## Files Created/Modified

### New Files

| File                           | Purpose                      | Lines |
| ------------------------------ | ---------------------------- | ----- |
| `accounts/payment_provider.py` | Abstract interface + factory | ~216  |
| `accounts/paymongo_service.py` | PayMongo API integration     | ~520  |
| `accounts/xendit_provider.py`  | Xendit adapter for interface | ~190  |

### Modified Files

| File                        | Changes                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `accounts/api.py`           | Added PayMongo webhook endpoint, updated deposit to use provider |
| `iayos_project/settings.py` | Added PayMongo config variables                                  |
| `.env.example`              | Added PayMongo keys and PAYMENT_PROVIDER                         |

## Configuration

### Environment Variables

```env
# Payment Provider Selection
PAYMENT_PROVIDER=paymongo  # Options: paymongo, xendit

# PayMongo Configuration (Primary)
PAYMONGO_SECRET_KEY=sk_test_xxx  # Server-side only
PAYMONGO_PUBLIC_KEY=pk_test_xxx  # Safe for frontend
PAYMONGO_WEBHOOK_SECRET=whsec_xxx  # From PayMongo dashboard

# Xendit Configuration (Legacy/Rollback)
XENDIT_API_KEY=xnd_development_xxx
XENDIT_WEBHOOK_TOKEN=xxx
```

### PayMongo Dashboard Setup

1. **Create Account**: https://dashboard.paymongo.com
2. **Get API Keys**: Developers → API Keys
3. **Configure Webhooks**:
   - URL: `https://your-domain.com/api/accounts/wallet/paymongo-webhook`
   - Events to subscribe:
     - `checkout_session.payment.paid`
     - `checkout_session.payment.failed`
     - `checkout_session.payment.expired`
   - Copy webhook signing secret

## API Mapping

### Xendit → PayMongo Equivalents

| Xendit                  | PayMongo                         | Notes                                     |
| ----------------------- | -------------------------------- | ----------------------------------------- |
| Invoice API             | Checkout Sessions                | Similar flow, hosted payment page         |
| `POST /v2/invoices`     | `POST /v1/checkout_sessions`     | Amount in centavos for PayMongo           |
| `GET /v2/invoices/{id}` | `GET /v1/checkout_sessions/{id}` | Status mapping differs                    |
| Disbursements           | Payouts (limited)                | PayMongo payouts in beta, manual fallback |
| GCash e-wallet          | gcash payment method             | Same underlying flow                      |

### Status Mapping

```python
# PayMongo → Normalized Status
"active" → "pending"
"pending" → "pending"
"paid" → "paid"
"succeeded" → "paid"
"expired" → "expired"
"failed" → "failed"

# Xendit → Normalized Status
"PENDING" → "pending"
"PAID" → "paid"
"SETTLED" → "paid"
"EXPIRED" → "expired"
"FAILED" → "failed"
```

## Webhook Handling

### PayMongo Webhook Structure

```json
{
  "data": {
    "id": "evt_xxx",
    "type": "event",
    "attributes": {
      "type": "checkout_session.payment.paid",
      "data": {
        "id": "cs_xxx",
        "type": "checkout_session",
        "attributes": {
          "checkout_url": "https://...",
          "reference_number": "IAYOS-CHK-123-abc12345",
          "amount": 10000,
          "status": "paid",
          "payments": [...],
          "metadata": {
            "transaction_id": "123",
            "external_id": "IAYOS-CHK-123-abc12345"
          }
        }
      }
    }
  }
}
```

### Webhook Endpoint

```
POST /api/accounts/wallet/paymongo-webhook
```

Verifies signature via `Paymongo-Signature` header.

## Business Logic Preserved

### Escrow Payments (50/50 Split)

```
Budget: ₱1,000
├── 50% Downpayment: ₱500
│   └── + 5% Platform Fee: ₱25
│   └── = Client Pays Now: ₱525
└── 50% Remaining: ₱500 (on completion)

Total Client Pays: ₱1,025
Worker Receives: ₱1,000
Platform Keeps: ₱25
```

Both providers create checkout sessions for escrow payments with correct amounts.

### Disbursements (Withdrawals)

PayMongo's payout API is in limited release. Current behavior:

- **Test Mode**: Simulates successful disbursement
- **Production**: Queues for manual processing or Maya Business integration

Fallback to manual bank transfers for worker withdrawals until PayMongo Payouts GA.

## Rollback Procedure

To rollback to Xendit:

```env
# Change environment variable
PAYMENT_PROVIDER=xendit
```

Restart application - no code changes needed.

## Testing Checklist

### PayMongo Test Mode

- [x] Create checkout session for GCash
- [x] Receive webhook for successful payment
- [x] Handle webhook for failed payment
- [ ] Verify signature validation works
- [ ] Test expired checkout handling

### Integration Tests

```bash
# Run in backend container
cd /app/apps/backend/src
python manage.py test accounts.tests.test_paymongo
```

### Manual Testing

1. **Wallet Deposit**:
   - Go to wallet deposit screen
   - Enter amount (e.g., ₱100)
   - Complete GCash payment
   - Verify wallet balance updated

2. **Escrow Payment**:
   - Create job as client
   - Select worker/get accepted
   - Complete downpayment via GCash
   - Verify job status updated

3. **Webhook Handling**:
   - Check logs for `📥 PayMongo Webhook received`
   - Verify transaction status updates

## PayMongo Test Credentials

For GCash test payments, use PayMongo's test numbers:

- Phone: Any valid PH format (e.g., 09171234567)
- OTP: 123456 (in test mode)

## Migration Timeline

| Phase | Task                      | Status                            |
| ----- | ------------------------- | --------------------------------- |
| 1     | Create abstraction layer  | ✅ Complete                       |
| 2     | Implement PayMongoService | ✅ Complete                       |
| 3     | Add webhook handler       | ✅ Complete                       |
| 4     | Update API endpoints      | ✅ Complete                       |
| 5     | Environment configuration | ✅ Complete                       |
| 6     | Frontend compatibility    | ✅ Compatible (no changes needed) |
| 7     | Testing                   | ⏳ Pending                        |
| 8     | Production deployment     | ⏳ After QA                       |

## Future Enhancements

1. **Add paymentProvider field to Transaction model**
   - Track which provider processed each transaction
   - Useful for analytics and debugging

2. **PayMongo Payouts (when GA)**
   - Enable automated worker withdrawals
   - Remove manual processing fallback

3. **Additional Payment Methods**
   - Maya (PayMaya) direct
   - Card payments
   - Bank transfers

## Support

### PayMongo Documentation

- API Reference: https://developers.paymongo.com/reference
- Checkout Sessions: https://developers.paymongo.com/docs/checkout
- Webhooks: https://developers.paymongo.com/docs/webhooks

### iAyos Contact

- Developer: Check AGENTS.md for contact info
- Repository: Internal GitLab/GitHub
