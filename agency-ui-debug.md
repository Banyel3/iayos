# Agency UI Bug Investigation Plan

> **Task Slug:** `agency-ui-debug`  
> **Project Type:** WEB (Next.js) + Cross-reference with Mobile (React Native)  
> **Primary Agent:** `@debugger` + `@frontend-specialist`  
> **Source of Truth:** React Native mobile app  
> **Environment:** Production (iayos.online)

---

## Overview

Comprehensive debugging and testing of the **Agency-side UI** (Next.js web app) to identify and fix all bugs. The React Native mobile app will be used as the source of truth for expected behavior.

### Recent Context
- **PayMongo Migration:** Recently migrated from Xendit to PayMongo
- **KYC Issues:** Fixed signed URL generation for private files
- **Lazy Loading Fix:** InsightFace now loads lazily (pending deployment)

---

## Success Criteria

- [ ] All console errors resolved
- [ ] All API endpoints return expected responses
- [ ] UI matches mobile app behavior (source of truth)
- [ ] Payment/Wallet flows work correctly with PayMongo
- [ ] No CORS or network errors in production
- [ ] All test data cleaned up after testing

---

## Areas to Test

### 1. KYC Flow (`/agency/kyc`)
| Test | Expected | Priority |
|------|----------|----------|
| Upload business permit | Validates, saves to Supabase | P0 |
| Upload rep ID (front/back) | Face detection, signed URL works | P0 |
| View submitted files | Signed URLs load correctly | P0 |
| Resubmit after rejection | Old files deleted, new upload works | P1 |
| OCR autofill | Extracts business data correctly | P1 |

### 2. Dashboard (`/agency/dashboard`)
| Test | Expected | Priority |
|------|----------|----------|
| Dashboard loads | No console errors | P0 |
| Statistics display | Shows correct job/employee counts | P1 |
| Quick actions work | Navigate to correct pages | P1 |

### 3. Jobs (`/agency/jobs`)
| Test | Expected | Priority |
|------|----------|----------|
| Job list loads | Shows agency's jobs | P0 |
| Accept job invite | Status updates, escrow handled | P0 |
| Reject job invite | Refund triggers (PayMongo) | P0 |
| Job details page | All info displays correctly | P1 |
| Job completion flow | Payment release works | P0 |

### 4. Employees (`/agency/employees`)
| Test | Expected | Priority |
|------|----------|----------|
| Employee list loads | Shows all employees | P1 |
| Add employee | Links worker to agency | P1 |
| Remove employee | Unlinks correctly | P1 |
| Employee rating | Update works | P2 |

### 5. Profile (`/agency/profile`)
| Test | Expected | Priority |
|------|----------|----------|
| Profile loads | Shows agency info | P1 |
| Edit profile | Updates saved correctly | P1 |
| Profile image upload | Supabase upload works | P1 |

### 6. Transactions (`/agency/transactions`) - **PAYMONGO FOCUS**
| Test | Expected | Priority |
|------|----------|----------|
| Transaction list | Shows payment history | P0 |
| Payment status | Reflects PayMongo status | P0 |
| Escrow payments | Show correctly | P0 |

### 7. Messages (`/agency/messages`)
| Test | Expected | Priority |
|------|----------|----------|
| Conversation list | Loads recent messages | P1 |
| Send message | WebSocket works | P1 |
| Real-time updates | New messages appear | P1 |

### 8. Reviews (`/agency/reviews`)
| Test | Expected | Priority |
|------|----------|----------|
| Review list | Shows received reviews | P2 |
| Rating average | Calculates correctly | P2 |

### 9. Analytics (`/agency/analytics`)
| Test | Expected | Priority |
|------|----------|----------|
| Page loads | No errors | P2 |
| Charts render | Data displays | P2 |

---

## Task Breakdown

### Phase 1: Environment Verification
- [ ] **T1.1** Wait for Render deployment (commit `87876ee`) - **BLOCKER**
- [ ] **T1.2** Verify production site loads without CORS errors
- [ ] **T1.3** Check browser console for baseline errors

### Phase 2: API & Network Testing
- [ ] **T2.1** Test `/api/agency/status` endpoint
- [ ] **T2.2** Test `/api/agency/kyc/validate-document` endpoint
- [ ] **T2.3** Test `/api/agency/kyc/autofill` endpoint
- [ ] **T2.4** Test `/api/accounts/notifications/unread-count` endpoint
- [ ] **T2.5** Verify CORS headers on all endpoints

### Phase 3: KYC Flow Testing
- [ ] **T3.1** Upload and validate business permit
- [ ] **T3.2** Upload and validate rep ID (front)
- [ ] **T3.3** Upload and validate rep ID (back)
- [ ] **T3.4** View submitted documents (signed URLs)
- [ ] **T3.5** Test OCR autofill data extraction

### Phase 4: Job Management Testing
- [ ] **T4.1** View job list
- [ ] **T4.2** Accept job invite
- [ ] **T4.3** Reject job invite (verify PayMongo refund)
- [ ] **T4.4** Complete job flow

### Phase 5: Payment/Wallet Testing (PayMongo Focus)
- [ ] **T5.1** Cross-reference mobile `wallet/index.tsx` with web transactions
- [ ] **T5.2** Test deposit flow (`payments/deposit.tsx`)
- [ ] **T5.3** Test withdrawal flow (`wallet/withdraw.tsx`)
- [ ] **T5.4** Verify pending earnings display

### Phase 6: General UI Testing
- [ ] **T6.1** Dashboard functionality
- [ ] **T6.2** Employee management
- [ ] **T6.3** Profile editing
- [ ] **T6.4** Messaging (WebSocket)
- [ ] **T6.5** Reviews display

### Phase 7: Cleanup
- [ ] **T7.1** Delete any test data created during testing
- [ ] **T7.2** Document all bugs found
- [ ] **T7.3** Create fix plan for each bug

---

## Agent Assignments

| Phase | Agent | Skills |
|-------|-------|--------|
| 1-2 | `@debugger` | systematic-debugging |
| 3-4 | `@debugger` + `@frontend-specialist` | systematic-debugging, nextjs-react-expert |
| 5 | `@debugger` + `@backend-specialist` | api-patterns, systematic-debugging |
| 6 | `@frontend-specialist` | nextjs-react-expert, web-design-guidelines |
| 7 | `@debugger` | systematic-debugging |

---

## Dependencies

```
T1.1 (Render deploy) → T1.2 → T1.3 → T2.* (API tests)
                                    ↓
                              T3.* (KYC tests)
                                    ↓
                              T4.* (Job tests)
                                    ↓
                              T5.* (Payment tests)
                                    ↓
                              T6.* (UI tests)
                                    ↓
                              T7.* (Cleanup)
```

---

## Mobile Source of Truth Reference

| Web Page | Mobile Equivalent |
|----------|-------------------|
| `/agency/transactions` | `app/payments/*.tsx` |
| `/agency/wallet` (if exists) | `app/wallet/index.tsx`, `withdraw.tsx` |
| `/agency/kyc` | `app/kyc/*.tsx` |
| `/agency/jobs` | `app/jobs/*.tsx` |
| `/agency/profile` | `app/profile/*.tsx` |

---

## Phase X: Verification Checklist

- [ ] No console errors in production
- [ ] All API calls return 200/expected status
- [ ] KYC file upload and view works
- [ ] Payment flows match mobile behavior
- [ ] Test data cleaned up
- [ ] Bug report generated

---

## Next Steps

1. **Wait for Render deployment** of commit `87876ee`
2. Once deployed, run `/debug` to start Phase 1-2
3. Continue with browser testing in production
