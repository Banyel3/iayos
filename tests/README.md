# iAyos Platform - Testing Suite

## 📚 Overview

This directory contains comprehensive testing infrastructure for the iAyos platform, covering all CLIENT and WORKER role endpoints, payment flows, and user journeys. The test suite includes **257+ test cases** across multiple testing approaches.

## 🗂️ Test Files Structure

```
tests/
├── README.md                                    # This file
├── TESTING_GUIDE.md                            # Complete testing guide
├── QA_CHECKLIST.md                             # 257-point QA checklist
├── TEST_SUMMARY.md                             # Executive summary
├── comprehensive_client_api_tests.http         # 49 CLIENT HTTP tests
├── comprehensive_worker_api_tests.http         # 57 WORKER HTTP tests
├── comprehensive_payment_flows.http            # 53 Payment HTTP tests
└── (existing test files...)

apps/backend/src/tests/
├── test_client_mobile_api.py                   # 46 CLIENT Django tests
├── test_worker_mobile_api.py                   # 51 WORKER Django tests
└── (existing test files...)
```

## 🎯 Quick Start

### 1. Choose Your Testing Approach

**Option A: Automated Django Tests**
```bash
cd apps/backend/src
python manage.py test tests.test_client_mobile_api
python manage.py test tests.test_worker_mobile_api
```

**Option B: Manual HTTP Tests**
- Open `.http` files in VS Code with REST Client extension
- Click "Send Request" for each test
- Review responses inline

**Option C: QA Checklist**
- Open `QA_CHECKLIST.md`
- Follow systematic testing workflow
- Mark items as completed
- Document issues found

### 2. Prerequisites

- ✅ Backend server running at `http://localhost:8000`
- ✅ Database migrated and running
- ✅ Test accounts created (or use registration endpoints)
- ✅ (Optional) Payment provider configured for payment tests

## 📊 Test Coverage

### By Role

| Role | Django Tests | HTTP Tests | Total | Coverage |
|------|--------------|------------|-------|----------|
| CLIENT | 46 | 49 | 95 | Authentication, Jobs, Payments, Reviews, Dashboard |
| WORKER | 51 | 57 | 108 | Authentication, Skills, Jobs, Payments, Reviews, Completion |
| Payment Flows | - | 53 | 53 | Wallet, Escrow, Buffer, Withdrawals, Fees |
| **TOTAL** | **97** | **159** | **256** | **All major features** |

### By Feature Area

| Feature | Test Count | Files |
|---------|------------|-------|
| Authentication | 24 | Both Django + HTTP |
| Profile Management | 18 | Both Django + HTTP |
| Job Management | 31 | Both Django + HTTP |
| Skills Management | 10 | WORKER tests |
| Applications | 14 | CLIENT + WORKER |
| Payments & Wallet | 46 | All payment files |
| Reviews & Ratings | 20 | Both roles |
| Dashboard | 10 | Both roles |
| Dual Profile | 8 | Both roles |
| Edge Cases | 75+ | Across all files |

## 📖 Documentation Guide

### 1. **TESTING_GUIDE.md** - Your Main Reference
- **When to use**: Before starting any testing
- **Contains**:
  - How to run all types of tests
  - Test environment setup
  - Coverage breakdown by feature
  - Troubleshooting common issues
  - Expected results and success criteria

### 2. **QA_CHECKLIST.md** - Detailed Test Execution
- **When to use**: During systematic testing
- **Contains**:
  - 257 individual test points
  - Organized by role and feature
  - Space to document issues
  - Test result tracking
  - Sign-off section

### 3. **TEST_SUMMARY.md** - Executive Overview
- **When to use**: For quick understanding or reporting
- **Contains**:
  - High-level summary
  - Test artifacts overview
  - Coverage breakdown
  - Next steps
  - Key metrics

## 🚀 Common Testing Workflows

### Workflow 1: Complete Platform Testing
```bash
# 1. Start backend
cd apps/backend/src
python manage.py runserver

# 2. Run Django tests
python manage.py test tests --verbosity=2

# 3. Execute HTTP tests
# Open .http files in VS Code and run each test

# 4. Complete QA checklist
# Open QA_CHECKLIST.md and mark items as tested
```

### Workflow 2: Role-Specific Testing

**CLIENT Role Only:**
```bash
# Django tests
python manage.py test tests.test_client_mobile_api

# HTTP tests
# Open comprehensive_client_api_tests.http
```

**WORKER Role Only:**
```bash
# Django tests
python manage.py test tests.test_worker_mobile_api

# HTTP tests
# Open comprehensive_worker_api_tests.http
```

### Workflow 3: Payment Flow Testing
```bash
# HTTP tests only (no Django tests for payments yet)
# Open comprehensive_payment_flows.http
# Follow the sequence:
# 1. Setup accounts
# 2. Test deposits
# 3. Test job payments
# 4. Test escrow
# 5. Test withdrawals
```

## 🔍 Key Test Scenarios

### CLIENT User Journey
1. ✅ Register & Login
2. ✅ Assign CLIENT role
3. ✅ Deposit funds to wallet
4. ✅ Create job posting (escrow held)
5. ✅ Browse workers
6. ✅ View job applications
7. ✅ Accept worker
8. ✅ Approve completion (payment released)
9. ✅ Submit review

### WORKER User Journey
1. ✅ Register & Login
2. ✅ Assign WORKER role
3. ✅ Add skills & certifications
4. ✅ Browse available jobs
5. ✅ Apply to job
6. ✅ Complete job
7. ✅ View pending earnings (7-day buffer)
8. ✅ Withdraw funds
9. ✅ Submit client review

### Payment System Flow
1. ✅ CLIENT deposits funds
2. ✅ Job created (50% + 10% commission held in escrow)
3. ✅ WORKER completes job
4. ✅ CLIENT approves
5. ✅ Payment moves to 7-day buffer
6. ✅ Buffer period expires or backjob handled
7. ✅ Payment released to WORKER wallet
8. ✅ WORKER withdraws funds

## ⚙️ Test Configuration

### Environment Variables Needed
```bash
# Backend API
API_URL=http://localhost:8000

# Database
DATABASE_URL=postgresql://...

# Payment Providers (for payment tests)
XENDIT_API_KEY=xnd_development_...
# Note: Some payment tests may fail without actual API keys
```

### Test Accounts
The tests can either:
- **Create new accounts** via registration endpoints
- **Use existing accounts** (update emails in `.http` files)

Example test accounts used in HTTP files:
- CLIENT: `client_test@iayos.com` / `TestClient@123`
- WORKER: `worker_test@iayos.com` / `TestWorker@123`

## 📋 Test Execution Checklist

### Before Testing
- [ ] Backend server running
- [ ] Database migrated
- [ ] Environment variables set
- [ ] Test documentation reviewed

### During Testing
- [ ] Execute Django tests
- [ ] Run HTTP tests sequentially
- [ ] Complete QA checklist
- [ ] Document all issues
- [ ] Take screenshots of failures

### After Testing
- [ ] Generate test report
- [ ] Create GitHub issues for bugs
- [ ] Document improvement suggestions
- [ ] Update test documentation
- [ ] Share results with team

## 🐛 Reporting Issues

When you find an issue during testing:

1. **Document in QA_CHECKLIST.md** under "Issues Found" section
2. **Create GitHub Issue** with:
   - Test case ID (e.g., C-AUTH-001)
   - Steps to reproduce
   - Expected vs actual result
   - Screenshots/logs
3. **Severity Level**:
   - Critical: App crashes, data loss
   - High: Feature broken
   - Medium: Feature partially works
   - Low: Minor UI/UX issues

## 💡 Testing Tips

### For Django Tests
```bash
# Run specific test
python manage.py test tests.test_client_mobile_api.ClientMobileAPITestCase.test_client_login

# Run with keepdb (faster re-runs)
python manage.py test tests --keepdb

# Run with parallel workers
python manage.py test tests --parallel
```

### For HTTP Tests
- Test in sequence (some tests depend on previous ones)
- Use variables (e.g., `{{client_login.response.body.$.access_token}}`)
- Check response status codes
- Validate response data structure

### For QA Checklist
- Test one feature area at a time
- Mark items immediately after testing
- Document issues with details
- Take breaks between sections

## 📈 Success Metrics

A successful test run should have:
- ✅ **95%+ pass rate** for core features
- ✅ **All critical paths** working (login, job posting, payments)
- ✅ **Edge cases** properly handled
- ✅ **Error messages** clear and helpful
- ✅ **Performance** acceptable (< 2s for most endpoints)

## 🔄 Continuous Improvement

### Adding New Tests
When adding new features:
1. Add Django test cases to appropriate file
2. Add HTTP test scenarios
3. Update QA checklist
4. Update coverage documentation

### Maintaining Tests
- Run tests regularly (before each deployment)
- Update tests when APIs change
- Remove obsolete tests
- Add regression tests for bug fixes

## 📞 Support

### Questions?
- Check `TESTING_GUIDE.md` for detailed instructions
- Review `TEST_SUMMARY.md` for overview
- Create GitHub issue for test infrastructure problems

### Contributing
- Follow existing test patterns
- Add clear test descriptions
- Document edge cases
- Update documentation

## 📚 Additional Resources

- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)
- [REST Client Extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- [HTTP File Format](https://www.jetbrains.com/help/idea/http-client-in-product-code-editor.html)

---

**Last Updated**: December 2025  
**Test Coverage**: 257+ test cases  
**Status**: ✅ Ready for execution

## Quick Links

- 📖 [Complete Testing Guide](./TESTING_GUIDE.md)
- ✅ [QA Checklist (257 points)](./QA_CHECKLIST.md)
- 📊 [Test Summary](./TEST_SUMMARY.md)
- 🔵 [CLIENT HTTP Tests](./comprehensive_client_api_tests.http)
- 🔨 [WORKER HTTP Tests](./comprehensive_worker_api_tests.http)
- 💰 [Payment Flow Tests](./comprehensive_payment_flows.http)
