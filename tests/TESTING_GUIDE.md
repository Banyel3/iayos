# iAyos Platform - Comprehensive Testing Documentation

## Overview
This document provides a comprehensive guide for testing the iAyos platform, covering all CLIENT and WORKER role endpoints and payment flows.

## Test Files Created

### 1. Django Unit/Integration Tests
- **Location**: `/apps/backend/src/tests/`
- **Files**:
  - `test_client_mobile_api.py` - 46 test cases for CLIENT role
  - `test_worker_mobile_api.py` - 51 test cases for WORKER role

### 2. HTTP API Tests (Manual/REST Client)
- **Location**: `/tests/`
- **Files**:
  - `comprehensive_client_api_tests.http` - 49 CLIENT endpoints
  - `comprehensive_worker_api_tests.http` - 57 WORKER endpoints
  - `comprehensive_payment_flows.http` - 53 payment flow scenarios

## Running the Tests

### Prerequisites
1. Backend server running at `http://localhost:8000`
2. Database properly migrated and seeded
3. Test user accounts (or create via registration endpoints)

### A. Running Django Tests

```bash
# Navigate to backend source directory
cd /home/runner/work/iayos/iayos/apps/backend/src

# Run all tests
python manage.py test tests

# Run CLIENT role tests only
python manage.py test tests.test_client_mobile_api

# Run WORKER role tests only
python manage.py test tests.test_worker_mobile_api

# Run specific test class
python manage.py test tests.test_client_mobile_api.ClientMobileAPITestCase

# Run with verbosity for detailed output
python manage.py test tests --verbosity=2
```

### B. Running HTTP Tests

**Option 1: Using VS Code REST Client Extension**
1. Install "REST Client" extension in VS Code
2. Open any `.http` file
3. Click "Send Request" above each test
4. Review responses inline

**Option 2: Using IntelliJ HTTP Client**
1. Open `.http` file in IntelliJ IDEA or PyCharm
2. Click the green play button next to each request
3. View results in HTTP Response panel

**Option 3: Using cURL (Convert from HTTP files)**
```bash
# Example: CLIENT login
curl -X POST http://localhost:8000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "client_test@iayos.com", "password": "TestClient@123"}'
```

## Test Coverage by Feature Area

### CLIENT Role Tests (96 Total Test Cases)

#### Authentication & Profile (12 tests)
- ✅ Registration
- ✅ Login/Logout
- ✅ Profile retrieval
- ✅ Profile updates
- ✅ Role assignment
- ✅ Profile metrics
- ✅ Password reset
- ✅ Email verification
- ✅ Token refresh

#### Job Management (17 tests)
- ✅ Create listing job
- ✅ Create invite job
- ✅ View my jobs
- ✅ View job details
- ✅ Delete job
- ✅ Search jobs
- ✅ View job categories
- ✅ Job budget validation

#### Application Management (6 tests)
- ✅ View applications for job
- ✅ Accept application
- ✅ Reject application
- ✅ Application notifications

#### Worker Discovery (8 tests)
- ✅ Browse workers
- ✅ View worker details
- ✅ View worker portfolio
- ✅ View worker skills
- ✅ Browse agencies
- ✅ View agency details
- ✅ Search workers

#### Wallet & Payments (15 tests)
- ✅ View balance
- ✅ Deposit funds (GCASH)
- ✅ Deposit funds (Card)
- ✅ View transactions
- ✅ Filter transactions
- ✅ Escrow payment
- ✅ Job payment release
- ✅ Payment methods CRUD
- ✅ Commission calculations

#### Reviews & Ratings (10 tests)
- ✅ Submit review for worker
- ✅ View worker reviews
- ✅ View my reviews
- ✅ Edit review
- ✅ Delete review
- ✅ Report review
- ✅ Pending reviews

#### Dashboard (6 tests)
- ✅ Dashboard statistics
- ✅ Recent jobs
- ✅ Available workers widget
- ✅ Job status summary

#### Dual Profile (4 tests)
- ✅ Check dual status
- ✅ Create worker profile
- ✅ Switch profile
- ✅ Dual profile permissions

#### Miscellaneous (18 tests)
- ✅ View cities
- ✅ View barangays
- ✅ Upload profile image
- ✅ Location services
- ✅ Notifications

### WORKER Role Tests (108 Total Test Cases)

#### Authentication & Profile (12 tests)
- ✅ Registration
- ✅ Login/Logout
- ✅ Profile retrieval
- ✅ Profile updates
- ✅ Role assignment
- ✅ Profile metrics
- ✅ Password reset
- ✅ Email verification

#### Skills Management (10 tests)
- ✅ View available skills
- ✅ View my skills
- ✅ Add skill
- ✅ Update skill proficiency
- ✅ Delete skill
- ✅ Skills validation
- ✅ Experience tracking

#### Job Discovery & Application (14 tests)
- ✅ Browse available jobs
- ✅ Search jobs with filters
- ✅ View job details
- ✅ Apply to job
- ✅ View my applications
- ✅ View application status
- ✅ View my active jobs
- ✅ View backjobs
- ✅ Job categories

#### Wallet & Payments (18 tests)
- ✅ View balance
- ✅ View pending earnings
- ✅ Withdraw funds (GCASH)
- ✅ Withdraw funds (Bank)
- ✅ View transactions
- ✅ Payment buffer tracking
- ✅ Earnings calculation
- ✅ Payment methods CRUD
- ✅ Commission deductions

#### Reviews & Ratings (10 tests)
- ✅ Submit review for client
- ✅ View my reviews
- ✅ View review stats
- ✅ View client reviews
- ✅ Edit review
- ✅ Report review
- ✅ Pending reviews

#### Dashboard (4 tests)
- ✅ Dashboard statistics
- ✅ Recent jobs
- ✅ Earnings summary
- ✅ Job completion rate

#### Profile Enhancement (8 tests)
- ✅ Upload profile image
- ✅ Portfolio management
- ✅ Certification upload
- ✅ Work history

#### Job Completion Flow (12 tests)
- ✅ Mark job started
- ✅ Update progress
- ✅ Mark complete
- ✅ Handle backjobs
- ✅ Completion workflow

#### Dual Profile (4 tests)
- ✅ Check dual status
- ✅ Create client profile
- ✅ Switch profile
- ✅ Dual profile permissions

#### Miscellaneous (16 tests)
- ✅ View clients
- ✅ View other workers
- ✅ View agencies
- ✅ Location services
- ✅ Notifications

### Payment Flow Tests (53 Test Cases)

#### Wallet Management (10 tests)
- ✅ Initial balance check
- ✅ Deposit validation
- ✅ Balance updates
- ✅ Transaction history
- ✅ Transaction filtering

#### Escrow System (12 tests)
- ✅ Job creation with escrow
- ✅ Escrow amount calculation
- ✅ Escrow hold
- ✅ Escrow release
- ✅ Commission calculation
- ✅ Platform fees

#### Payment Buffer (8 tests)
- ✅ 7-day buffer implementation
- ✅ Pending earnings tracking
- ✅ Buffer period validation
- ✅ Early release scenarios
- ✅ Backjob during buffer

#### Withdrawals (8 tests)
- ✅ Withdrawal methods
- ✅ Withdrawal validation
- ✅ Minimum amounts
- ✅ Processing status
- ✅ Insufficient funds

#### Edge Cases (15 tests)
- ✅ Negative amounts
- ✅ Zero amounts
- ✅ Insufficient funds
- ✅ Duplicate transactions
- ✅ Concurrent operations
- ✅ Payment method errors

## Test Execution Checklist

### Pre-Testing Setup
- [ ] Backend server running
- [ ] Database migrated
- [ ] Test data seeded (optional)
- [ ] Payment provider configured (for payment tests)

### CLIENT Role Testing
- [ ] Authentication flows
- [ ] Profile management
- [ ] Job posting (listing)
- [ ] Job posting (invite)
- [ ] Application management
- [ ] Worker discovery
- [ ] Wallet operations
- [ ] Payment methods
- [ ] Review submission
- [ ] Dashboard features

### WORKER Role Testing
- [ ] Authentication flows
- [ ] Profile management
- [ ] Skills management
- [ ] Job discovery
- [ ] Job applications
- [ ] Wallet operations
- [ ] Withdrawals
- [ ] Review submission
- [ ] Dashboard features
- [ ] Job completion

### Payment Flow Testing
- [ ] Wallet deposits
- [ ] Escrow creation
- [ ] Job payments
- [ ] Payment buffer
- [ ] Withdrawals
- [ ] Commission calculations
- [ ] Transaction history
- [ ] Edge cases

### Cross-Role Testing
- [ ] Dual profiles
- [ ] Profile switching
- [ ] Notifications
- [ ] Reviews (bidirectional)
- [ ] Job lifecycle (client → worker → completion)

## Expected Test Results

### Success Criteria
- All authentication endpoints return valid tokens
- Profile CRUD operations work correctly
- Job creation deducts correct escrow amount
- Applications can be accepted/rejected
- Payments follow escrow → buffer → release flow
- Reviews are submitted and visible
- Wallet balances update correctly
- Commission calculations are accurate

### Known Limitations
- Some payment integrations may require actual API keys
- Email verification may need SMTP configuration
- File uploads may need storage configuration
- Real-time features may need WebSocket setup

## Test Results Template

```markdown
## Test Execution Results - [Date]

### Environment
- Backend URL: http://localhost:8000
- Database: [PostgreSQL/MySQL/SQLite]
- Python Version: [version]
- Django Version: [version]

### Django Tests
- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X
- Errors: X

### HTTP Tests
- CLIENT Role: X/49 passed
- WORKER Role: X/57 passed
- Payment Flows: X/53 passed

### Issues Found
1. [Issue description]
2. [Issue description]

### Suggestions
1. [Improvement suggestion]
2. [Improvement suggestion]
```

## Troubleshooting

### Common Issues

**1. Authentication Failures**
- Check user exists in database
- Verify password is correct
- Ensure email is verified
- Check JWT token expiry

**2. Payment Test Failures**
- Verify wallet has sufficient balance
- Check payment provider configuration
- Ensure escrow calculations are correct
- Verify transaction history

**3. Job Application Failures**
- Check job is in ACTIVE status
- Verify worker has required skills
- Ensure no duplicate applications
- Check client permissions

**4. Database Connection Errors**
- Verify database is running
- Check connection settings
- Run migrations
- Seed test data

## Next Steps

After running these tests:
1. Document all failures and errors
2. Create issues for bugs found
3. Suggest improvements for edge cases
4. Update API documentation
5. Create regression test suite
6. Set up CI/CD pipeline for automated testing

## Contact

For questions or issues with testing:
- Create an issue in the repository
- Review existing test documentation
- Check API endpoint documentation
