# QA Testing Checklist - iAyos Platform

## Test Execution Date: _______________
## Tester: _______________
## Environment: _______________

---

## 🧪 CLIENT ROLE - API Testing

### Authentication & Profile Management
- [ ] **C-AUTH-001**: User registration succeeds with valid data
- [ ] **C-AUTH-002**: Login returns valid JWT token
- [ ] **C-AUTH-003**: Profile data retrieved correctly
- [ ] **C-AUTH-004**: Profile update saves changes
- [ ] **C-AUTH-005**: CLIENT role can be assigned
- [ ] **C-AUTH-006**: Profile metrics show completion percentage
- [ ] **C-AUTH-007**: Password reset email sent
- [ ] **C-AUTH-008**: Password reset link works
- [ ] **C-AUTH-009**: Token refresh works correctly
- [ ] **C-AUTH-010**: Logout invalidates token
- [ ] **C-AUTH-011**: Duplicate email registration rejected
- [ ] **C-AUTH-012**: Weak password rejected

**Issues Found:**
```
[Document any issues here]
```

---

### Job Posting & Management
- [ ] **C-JOB-001**: Create listing job succeeds
- [ ] **C-JOB-002**: Escrow amount correctly calculated (50% + 10% commission)
- [ ] **C-JOB-003**: Wallet balance deducted after job creation
- [ ] **C-JOB-004**: Create invite job for specific worker succeeds
- [ ] **C-JOB-005**: View my posted jobs returns correct list
- [ ] **C-JOB-006**: Job details show all information
- [ ] **C-JOB-007**: Job search filters work correctly
- [ ] **C-JOB-008**: Delete job removes from listing
- [ ] **C-JOB-009**: Cannot delete job with accepted applications
- [ ] **C-JOB-010**: Job categories load correctly
- [ ] **C-JOB-011**: Insufficient funds prevents job creation
- [ ] **C-JOB-012**: Invalid budget rejected
- [ ] **C-JOB-013**: Past date for start_date rejected
- [ ] **C-JOB-014**: Job status updates correctly

**Issues Found:**
```
[Document any issues here]
```

---

### Application Management
- [ ] **C-APP-001**: View applications for my job
- [ ] **C-APP-002**: Accept worker application succeeds
- [ ] **C-APP-003**: Job status changes to IN_PROGRESS after acceptance
- [ ] **C-APP-004**: Reject application with reason
- [ ] **C-APP-005**: Cannot accept multiple applications for same job
- [ ] **C-APP-006**: Application notifications sent to worker
- [ ] **C-APP-007**: Only job owner can view applications
- [ ] **C-APP-008**: Application count accurate

**Issues Found:**
```
[Document any issues here]
```

---

### Worker Discovery
- [ ] **C-DISC-001**: Browse workers list loads
- [ ] **C-DISC-002**: Worker detail page shows complete profile
- [ ] **C-DISC-003**: Worker skills displayed correctly
- [ ] **C-DISC-004**: Worker portfolio visible
- [ ] **C-DISC-005**: Worker reviews visible
- [ ] **C-DISC-006**: Worker rating calculated correctly
- [ ] **C-DISC-007**: Search workers by skill
- [ ] **C-DISC-008**: Filter workers by location
- [ ] **C-DISC-009**: Browse agencies list
- [ ] **C-DISC-010**: Agency details complete

**Issues Found:**
```
[Document any issues here]
```

---

### Wallet & Payments
- [ ] **C-PAY-001**: View wallet balance
- [ ] **C-PAY-002**: Deposit via GCASH works
- [ ] **C-PAY-003**: Deposit via Card works
- [ ] **C-PAY-004**: Balance updates after deposit
- [ ] **C-PAY-005**: Transaction history accurate
- [ ] **C-PAY-006**: Filter transactions by type
- [ ] **C-PAY-007**: Escrow payment held correctly
- [ ] **C-PAY-008**: Remaining payment (50%) deducted on completion
- [ ] **C-PAY-009**: Commission (10%) calculated correctly
- [ ] **C-PAY-010**: Cannot create job with insufficient funds
- [ ] **C-PAY-011**: Negative deposit amount rejected
- [ ] **C-PAY-012**: Zero amount rejected
- [ ] **C-PAY-013**: Payment methods CRUD works
- [ ] **C-PAY-014**: Set primary payment method
- [ ] **C-PAY-015**: Delete payment method succeeds

**Issues Found:**
```
[Document any issues here]
```

---

### Reviews & Ratings
- [ ] **C-REV-001**: Submit review for worker after job completion
- [ ] **C-REV-002**: Rating must be 1-5
- [ ] **C-REV-003**: View worker reviews
- [ ] **C-REV-004**: View my submitted reviews
- [ ] **C-REV-005**: Edit my review
- [ ] **C-REV-006**: Cannot review incomplete job
- [ ] **C-REV-007**: Cannot submit duplicate review
- [ ] **C-REV-008**: Report inappropriate review
- [ ] **C-REV-009**: Review stats calculated correctly
- [ ] **C-REV-010**: Pending reviews shown

**Issues Found:**
```
[Document any issues here]
```

---

### Dashboard
- [ ] **C-DASH-001**: Dashboard loads without errors
- [ ] **C-DASH-002**: Total jobs count accurate
- [ ] **C-DASH-003**: Active jobs count accurate
- [ ] **C-DASH-004**: Completed jobs count accurate
- [ ] **C-DASH-005**: Recent jobs list correct
- [ ] **C-DASH-006**: Available workers widget loads

**Issues Found:**
```
[Document any issues here]
```

---

## 🔨 WORKER ROLE - API Testing

### Authentication & Profile Management
- [ ] **W-AUTH-001**: User registration succeeds
- [ ] **W-AUTH-002**: Login returns valid token
- [ ] **W-AUTH-003**: WORKER role can be assigned
- [ ] **W-AUTH-004**: Profile update with worker-specific fields
- [ ] **W-AUTH-005**: Bio and description save correctly
- [ ] **W-AUTH-006**: Hourly rate saved correctly
- [ ] **W-AUTH-007**: Profile metrics accurate
- [ ] **W-AUTH-008**: Password reset works
- [ ] **W-AUTH-009**: Logout works

**Issues Found:**
```
[Document any issues here]
```

---

### Skills Management
- [ ] **W-SKILL-001**: View available skills
- [ ] **W-SKILL-002**: View my skills
- [ ] **W-SKILL-003**: Add skill succeeds
- [ ] **W-SKILL-004**: Proficiency level saved (BEGINNER/INTERMEDIATE/ADVANCED/EXPERT)
- [ ] **W-SKILL-005**: Years of experience saved
- [ ] **W-SKILL-006**: Update skill proficiency
- [ ] **W-SKILL-007**: Delete skill removes it
- [ ] **W-SKILL-008**: Cannot add duplicate skill
- [ ] **W-SKILL-009**: Invalid proficiency level rejected
- [ ] **W-SKILL-010**: Negative years experience rejected

**Issues Found:**
```
[Document any issues here]
```

---

### Job Discovery & Applications
- [ ] **W-JOB-001**: Browse available jobs
- [ ] **W-JOB-002**: Search jobs with filters
- [ ] **W-JOB-003**: Filter by budget range
- [ ] **W-JOB-004**: Filter by location
- [ ] **W-JOB-005**: Filter by category
- [ ] **W-JOB-006**: View job details
- [ ] **W-JOB-007**: Apply to job with cover letter
- [ ] **W-JOB-008**: Proposed rate can differ from budget
- [ ] **W-JOB-009**: View my applications
- [ ] **W-JOB-010**: Application status tracked (PENDING/ACCEPTED/REJECTED)
- [ ] **W-JOB-011**: View my active jobs
- [ ] **W-JOB-012**: View backjob requests
- [ ] **W-JOB-013**: Cannot apply to same job twice
- [ ] **W-JOB-014**: Cannot apply to own invite job (if not invited)

**Issues Found:**
```
[Document any issues here]
```

---

### Wallet & Payments
- [ ] **W-PAY-001**: View wallet balance
- [ ] **W-PAY-002**: View pending earnings (7-day buffer)
- [ ] **W-PAY-003**: Pending earnings show correct release date
- [ ] **W-PAY-004**: Withdraw via GCASH works
- [ ] **W-PAY-005**: Withdraw via Bank works
- [ ] **W-PAY-006**: Balance updates after withdrawal
- [ ] **W-PAY-007**: Transaction history accurate
- [ ] **W-PAY-008**: Earnings from completed jobs tracked
- [ ] **W-PAY-009**: Platform commission deducted correctly
- [ ] **W-PAY-010**: Cannot withdraw more than available balance
- [ ] **W-PAY-011**: Cannot withdraw from pending earnings
- [ ] **W-PAY-012**: Payment methods CRUD works
- [ ] **W-PAY-013**: Minimum withdrawal amount enforced
- [ ] **W-PAY-014**: Withdrawal fees calculated if applicable

**Issues Found:**
```
[Document any issues here]
```

---

### Reviews & Ratings
- [ ] **W-REV-001**: Submit review for client
- [ ] **W-REV-002**: View reviews about me
- [ ] **W-REV-003**: Review stats accurate (avg rating, count)
- [ ] **W-REV-004**: View client reviews before accepting job
- [ ] **W-REV-005**: Edit my review
- [ ] **W-REV-006**: Report unfair review
- [ ] **W-REV-007**: Pending reviews list accurate
- [ ] **W-REV-008**: Cannot review before job completion

**Issues Found:**
```
[Document any issues here]
```

---

### Dashboard
- [ ] **W-DASH-001**: Dashboard loads correctly
- [ ] **W-DASH-002**: Total applications count
- [ ] **W-DASH-003**: Active jobs count
- [ ] **W-DASH-004**: Completed jobs count
- [ ] **W-DASH-005**: Total earnings displayed
- [ ] **W-DASH-006**: Recent jobs accurate

**Issues Found:**
```
[Document any issues here]
```

---

### Job Completion Flow
- [ ] **W-COMP-001**: Mark job as started
- [ ] **W-COMP-002**: Update job progress
- [ ] **W-COMP-003**: Mark job as complete
- [ ] **W-COMP-004**: Completion triggers payment to buffer
- [ ] **W-COMP-005**: Client can approve completion
- [ ] **W-COMP-006**: Client can request backjob
- [ ] **W-COMP-007**: Backjob request visible to worker
- [ ] **W-COMP-008**: Complete backjob flow
- [ ] **W-COMP-009**: Payment released after buffer period
- [ ] **W-COMP-010**: Payment released immediately if no backjob

**Issues Found:**
```
[Document any issues here]
```

---

## 💰 PAYMENT FLOWS - Integration Testing

### Escrow System
- [ ] **PAY-ESC-001**: Job creation holds 50% + 10% in escrow
- [ ] **PAY-ESC-002**: Escrow amount calculated correctly for various budgets
- [ ] **PAY-ESC-003**: Escrow held until job completion
- [ ] **PAY-ESC-004**: Remaining 50% deducted on completion approval
- [ ] **PAY-ESC-005**: Escrow refunded if job cancelled before start
- [ ] **PAY-ESC-006**: Escrow visible in transaction history

**Issues Found:**
```
[Document any issues here]
```

---

### 7-Day Payment Buffer
- [ ] **PAY-BUF-001**: Payment goes to buffer on job completion
- [ ] **PAY-BUF-002**: Buffer release date is 7 days from completion
- [ ] **PAY-BUF-003**: Worker can see pending earnings
- [ ] **PAY-BUF-004**: Client can request backjob during buffer
- [ ] **PAY-BUF-005**: Backjob extends buffer period
- [ ] **PAY-BUF-006**: Payment released to wallet after buffer
- [ ] **PAY-BUF-007**: Admin can override buffer if needed
- [ ] **PAY-BUF-008**: Buffer status tracked correctly

**Issues Found:**
```
[Document any issues here]
```

---

### Commission & Fees
- [ ] **PAY-FEE-001**: Platform commission is 10% of budget
- [ ] **PAY-FEE-002**: Commission deducted from client's payment
- [ ] **PAY-FEE-003**: Worker receives 90% of payment (after commission)
- [ ] **PAY-FEE-004**: Commission calculation accurate for various amounts
- [ ] **PAY-FEE-005**: Withdrawal fees calculated if applicable
- [ ] **PAY-FEE-006**: Fee breakdown shown in transaction details

**Issues Found:**
```
[Document any issues here]
```

---

### Edge Cases & Error Handling
- [ ] **PAY-ERR-001**: Negative amounts rejected
- [ ] **PAY-ERR-002**: Zero amounts rejected
- [ ] **PAY-ERR-003**: Insufficient funds prevented
- [ ] **PAY-ERR-004**: Concurrent transactions handled
- [ ] **PAY-ERR-005**: Payment provider failures handled gracefully
- [ ] **PAY-ERR-006**: Network timeouts handled
- [ ] **PAY-ERR-007**: Duplicate transactions prevented
- [ ] **PAY-ERR-008**: Invalid payment methods rejected

**Issues Found:**
```
[Document any issues here]
```

---

## 🔄 DUAL PROFILE TESTING

### Profile Switching
- [ ] **DUAL-001**: Check dual profile status
- [ ] **DUAL-002**: Client can create worker profile
- [ ] **DUAL-003**: Worker can create client profile
- [ ] **DUAL-004**: Switch from CLIENT to WORKER
- [ ] **DUAL-005**: Switch from WORKER to CLIENT
- [ ] **DUAL-006**: Profile switch updates context correctly
- [ ] **DUAL-007**: Separate wallets for each role (if applicable)
- [ ] **DUAL-008**: Cannot switch during active job

**Issues Found:**
```
[Document any issues here]
```

---

## 📊 TEST SUMMARY

### Overall Statistics
- **Total Tests Executed**: _____ / 257
- **Passed**: _____
- **Failed**: _____
- **Blocked**: _____
- **Not Tested**: _____

### Pass Rate
- CLIENT Role: _____% 
- WORKER Role: _____% 
- Payment Flows: _____% 
- Dual Profile: _____% 
- **Overall**: _____%

---

## 🐛 CRITICAL ISSUES FOUND

1. **[ISSUE-001]**: _____________________________
   - **Severity**: Critical / High / Medium / Low
   - **Steps to Reproduce**: 
   - **Expected**: 
   - **Actual**: 

2. **[ISSUE-002]**: _____________________________
   - **Severity**: Critical / High / Medium / Low
   - **Steps to Reproduce**: 
   - **Expected**: 
   - **Actual**: 

---

## 💡 SUGGESTIONS FOR IMPROVEMENT

1. _____________________________
2. _____________________________
3. _____________________________
4. _____________________________
5. _____________________________

---

## ✅ EDGE CASES IDENTIFIED

1. _____________________________
2. _____________________________
3. _____________________________
4. _____________________________
5. _____________________________

---

## 📝 NOTES & OBSERVATIONS

```
[Add any additional notes, observations, or recommendations here]
```

---

## 👤 SIGN-OFF

**QA Tester**: _______________  
**Date**: _______________  
**Signature**: _______________

**Product Owner Review**: _______________  
**Date**: _______________  
**Signature**: _______________

---

## 📎 ATTACHMENTS

- [ ] Test execution logs
- [ ] Screenshots of failures
- [ ] API response samples
- [ ] Database state snapshots
- [ ] Performance metrics
