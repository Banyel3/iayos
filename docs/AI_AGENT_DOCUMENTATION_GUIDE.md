# 🤖 AI Agent Documentation Guide

**Purpose**: Standardized documentation workflow for AI assistants working on iAyos  
**Last Updated**: November 14, 2025  
**Status**: Active Policy

---

## 📋 CRITICAL RULES - READ FIRST

### Rule 1: Upon Phase/Feature Completion

✅ **ALWAYS** place completion documentation in:

```
docs/01-completed/[platform]/[FEATURE_NAME]_COMPLETE.md
```

Where `[platform]` is one of:

- `mobile/` - React Native Expo mobile app features
- `worker/` - Worker-specific web dashboard features
- `agency/` - Agency-specific web dashboard features
- `web/` - General web frontend features
- `backend/` - Backend API/service features

### Rule 2: QA Checklist Requirement

✅ **ALWAYS** create a QA checklist in:

```
docs/qa/NOT DONE/[PLATFORM]_[FEATURE_NAME]_QA_CHECKLIST.md
```

**After QA completion**, move to:

```
docs/qa/DONE/[PLATFORM]_[FEATURE_NAME]_QA_REPORT.md
```

### Rule 3: Progress Tracking

🚧 While working, maintain progress tracking in:

```
docs/02-in-progress/[FEATURE_NAME]_PROGRESS.md
```

**Upon completion**, archive to:

```
docs/04-archive/duplicates/[FEATURE_NAME]_PROGRESS.md
```

---

## 🔄 Complete Documentation Workflow

### Phase 1: Starting New Work

**1. Check if feature is planned:**

```bash
# Look in planned features
Check: docs/03-planned/
```

**2. Create progress tracking document:**

```bash
Location: docs/02-in-progress/[FEATURE_NAME]_PROGRESS.md

Required Sections:
- [ ] Feature Overview
- [ ] Implementation Plan (breakdown by component/screen)
- [ ] Progress Checklist (with ✅/🚧/❌ status)
- [ ] Files Created/Modified
- [ ] API Endpoints (if applicable)
- [ ] Time Tracking
- [ ] Blockers/Issues
```

**3. Create QA checklist immediately:**

```bash
Location: docs/qa/NOT DONE/[PLATFORM]_[FEATURE_NAME]_QA_CHECKLIST.md

Required Sections:
- [ ] Test Environment Setup
- [ ] Functional Tests (detailed test cases)
- [ ] UI/UX Tests
- [ ] Error Handling Tests
- [ ] Integration Tests
- [ ] Performance Tests
- [ ] Security Tests (if applicable)
- [ ] Edge Cases
- [ ] Cross-platform Tests (mobile only)
- [ ] Regression Tests
```

---

### Phase 2: During Development

**Update progress tracking:**

- ✅ Mark completed tasks
- 🚧 Mark in-progress tasks
- ❌ Mark blocked tasks
- Add new files created
- Document API endpoints
- Track time spent
- Note any blockers

**Example Progress Update:**

```markdown
## Progress (Updated: Nov 14, 2025 - 2:30 PM)

### ✅ Completed Today

- [x] Payment method selection screen
- [x] GCash payment integration
- [x] Wallet balance API hook

### 🚧 In Progress

- [ ] Cash payment proof upload (70% done)
- [ ] Payment status tracking screen (40% done)

### ❌ Blocked

- [ ] Xendit webhook testing (waiting for staging environment)

### Files Created (6 files, ~1,200 lines)

1. app/payments/method.tsx (345 lines)
2. lib/hooks/usePayments.ts (300 lines)
   ...
```

---

### Phase 3: Upon Completion

**CRITICAL: Follow this sequence exactly**

**Step 1: Create Completion Documentation**

```bash
Location: docs/01-completed/[platform]/[FEATURE_NAME]_COMPLETE.md

Template: Use the structure below
```

**Step 2: Move Progress File to Archive**

```bash
From: docs/02-in-progress/[FEATURE_NAME]_PROGRESS.md
To: docs/04-archive/duplicates/[FEATURE_NAME]_PROGRESS.md
```

**Step 3: Keep QA Checklist in NOT DONE**

```bash
Location: docs/qa/NOT DONE/[PLATFORM]_[FEATURE_NAME]_QA_CHECKLIST.md
Status: Ready for QA team
```

**Step 4: Update Index Files**

```bash
Files to update:
- docs/QUICK_INDEX.md (add to completed section)
- docs/00-README.md (add to completed features list)
- Root: AGENTS.md (add to latest update section)
```

---

## 📝 Completion Document Template

**File**: `docs/01-completed/[platform]/[FEATURE_NAME]_COMPLETE.md`

```markdown
# [Platform] [Feature Name] - COMPLETE ✅

**Completion Date**: [Date]  
**Platform**: [Mobile/Web/Backend/Worker/Agency]  
**Type**: [Feature Type]  
**Time Spent**: [Actual hours] (vs [Estimated hours] estimated)  
**Status**: ✅ PRODUCTION-READY / ✅ READY FOR QA / 🚧 PENDING REVIEW

---

## 🎯 Feature Summary

[2-3 paragraph overview of what was built]

---

## ✅ Core Features Delivered

### Feature 1: [Name]

- Detailed point 1
- Detailed point 2
- Detailed point 3

### Feature 2: [Name]

- Detailed point 1
- Detailed point 2

[Continue for all major features...]

---

## 📊 Implementation Statistics

- **Production Code**: [X] lines ([Y] files)
- **Documentation**: [X] lines ([Y] files)
- **Total Lines**: [X]+
- **TypeScript/Python Errors**: [X] (all resolved)
- **API Endpoints**: [X] configured and operational
- **Components/Services**: [X] reusable components/services
- **Screens/Pages**: [X] UI screens/pages
- **Time Efficiency**: [X]% faster/slower than estimated

---

## 📁 Files Created/Modified

### Created ([X] new files):

1. `path/to/file.tsx` - Description ([X] lines)
2. `path/to/file.ts` - Description ([X] lines)
   [List all new files with line counts]

### Modified ([X] files):

1. `path/to/file.tsx` - Changes made ([X] lines added)
2. `path/to/config.ts` - Added [X] endpoints
   [List all modified files]

---

## 🔌 API Endpoints (if applicable)

### Backend Endpoints ([X] endpoints):

- `POST /api/path` - Description
- `GET /api/path` - Description
  [List all API endpoints with HTTP method and description]

### Frontend API Config:

- File: `path/to/api/config.ts`
- Endpoints added: [X]
- Integration: React Query / Fetch / Axios

---

## 🧪 Testing Coverage

- **Unit Tests**: [X] tests ([X] lines)
- **Integration Tests**: [X] tests ([X] lines)
- **E2E Tests**: [X] tests (if applicable)
- **Test Coverage**: [X]% (if measured)

**Test Files**:

1. `path/to/test_file.py` - [X] tests
2. `path/to/test_file.test.tsx` - [X] tests

---

## 🐛 Known Issues / Limitations

- [ ] Issue 1 - Description (Priority: HIGH/MEDIUM/LOW)
- [ ] Issue 2 - Description (Priority: HIGH/MEDIUM/LOW)
      [List any known issues or limitations]

---

## 📚 Related Documentation

- QA Checklist: `docs/qa/NOT DONE/[PLATFORM]_[FEATURE]_QA_CHECKLIST.md`
- Progress Log: `docs/04-archive/duplicates/[FEATURE]_PROGRESS.md` (archived)
- Implementation Plan: `docs/03-planned/[FEATURE]_PLAN.md` (if existed)
- Architecture: `docs/architecture/[RELEVANT_DOC].md` (if applicable)

---

## 🚀 Deployment Notes

### Prerequisites:

- [ ] Backend migrations run (if applicable)
- [ ] Environment variables configured
- [ ] API keys added (if applicable)
- [ ] Database seeds (if applicable)

### Deployment Steps:

1. Step 1
2. Step 2
   [Provide clear deployment instructions]

### Rollback Plan:

1. Step 1
2. Step 2
   [Provide rollback instructions]

---

## 📋 Next Steps / Future Enhancements

- [ ] Enhancement 1 - Description
- [ ] Enhancement 2 - Description
      [List potential improvements or next phases]

---

## 🔍 QA Status

**QA Checklist**: `docs/qa/NOT DONE/[PLATFORM]_[FEATURE]_QA_CHECKLIST.md`  
**Status**: ⏳ Pending QA  
**Assigned To**: [QA Team/Person]  
**Priority**: HIGH/MEDIUM/LOW

---

**Completed By**: [Your name/AI Assistant]  
**Reviewed By**: [Reviewer if applicable]  
**Status**: ✅ COMPLETE - Ready for QA Testing
```

---

## 📋 QA Checklist Template

**File**: `docs/qa/NOT DONE/[PLATFORM]_[FEATURE_NAME]_QA_CHECKLIST.md`

```markdown
# [Platform] [Feature Name] - QA Checklist

**Feature**: [Feature Name]  
**Platform**: [Mobile/Web/Backend]  
**Completion Date**: [Date]  
**QA Assigned**: [Name/Team]  
**Priority**: HIGH/MEDIUM/LOW  
**Status**: ⏳ NOT STARTED

---

## 📋 Test Environment

### Setup Requirements:

- [ ] Backend server running (dev/staging)
- [ ] Frontend app running (dev/staging)
- [ ] Database seeded with test data
- [ ] API keys configured
- [ ] Test user accounts created

### Test Devices/Browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest) - if web
- [ ] iOS Simulator (if mobile)
- [ ] Android Emulator (if mobile)
- [ ] Physical device testing (if mobile)

---

## ✅ Functional Tests

### [Feature 1]: [Name]

**Test Case 1.1**: [Description]

- [ ] Steps to reproduce:
  1. Step 1
  2. Step 2
  3. Step 3
- [ ] Expected Result: [Description]
- [ ] Actual Result: [Fill during testing]
- [ ] Status: ⏳ Not Tested / ✅ Pass / ❌ Fail
- [ ] Notes: [Any observations]

**Test Case 1.2**: [Description]
[Repeat structure above]

[Continue for all features and test cases...]

---

## 🎨 UI/UX Tests

### Visual Design

- [ ] Matches design mockups/specifications
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Typography consistent with brand
- [ ] Colors match theme
- [ ] Icons and images display correctly
- [ ] Loading states visible
- [ ] Animations smooth (if applicable)

### User Experience

- [ ] Navigation intuitive
- [ ] Forms validate properly
- [ ] Error messages clear and helpful
- [ ] Success messages appropriate
- [ ] Button states (hover/active/disabled)
- [ ] Accessibility (WCAG compliance)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

---

## 🚨 Error Handling Tests

### Network Errors

- [ ] Offline mode handling
- [ ] Timeout handling
- [ ] 400 Bad Request response
- [ ] 401 Unauthorized response
- [ ] 403 Forbidden response
- [ ] 404 Not Found response
- [ ] 500 Server Error response

### Validation Errors

- [ ] Required field validation
- [ ] Format validation (email, phone, etc.)
- [ ] Min/max length validation
- [ ] File size/type validation (if applicable)
- [ ] Duplicate entry handling

### Edge Cases

- [ ] Empty state handling
- [ ] Maximum data handling
- [ ] Special characters in inputs
- [ ] Concurrent actions
- [ ] Race conditions

---

## 🔗 Integration Tests

### API Integration

- [ ] All API endpoints respond correctly
- [ ] Request payloads correct
- [ ] Response parsing correct
- [ ] Authentication headers sent
- [ ] CORS handling (if applicable)

### Third-party Integrations

- [ ] Payment gateway (if applicable)
- [ ] File upload service (if applicable)
- [ ] Notification service (if applicable)
- [ ] Analytics tracking (if applicable)

---

## ⚡ Performance Tests

- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks
- [ ] Large list rendering (pagination/virtualization)
- [ ] Image optimization
- [ ] Bundle size reasonable
- [ ] No excessive re-renders

---

## 🔒 Security Tests (if applicable)

- [ ] Input sanitization
- [ ] XSS protection
- [ ] CSRF protection
- [ ] SQL injection protection
- [ ] Authentication required where needed
- [ ] Authorization checks (user roles)
- [ ] Sensitive data encrypted
- [ ] HTTPS enforced

---

## 📱 Cross-platform Tests (Mobile Only)

### iOS

- [ ] iPhone SE (small screen)
- [ ] iPhone 13 Pro (notch)
- [ ] iPhone 13 Pro Max (large screen)
- [ ] iPad (tablet)

### Android

- [ ] Small phone (5")
- [ ] Regular phone (6")
- [ ] Large phone (6.5"+)
- [ ] Tablet

### Platform-specific

- [ ] Safe area insets respected
- [ ] Keyboard handling
- [ ] Back button behavior (Android)
- [ ] Gesture navigation
- [ ] Dark mode support
- [ ] Permission requests

---

## 🔄 Regression Tests

### Related Features

- [ ] Feature A still works
- [ ] Feature B still works
- [ ] Feature C still works

### Core Functionality

- [ ] Login/logout works
- [ ] Navigation works
- [ ] Data persistence works

---

## 📊 Test Results Summary

**Total Test Cases**: [X]  
**Passed**: [X]  
**Failed**: [X]  
**Blocked**: [X]  
**Not Tested**: [X]

### Critical Issues Found:

1. [Issue description] - Priority: HIGH
2. [Issue description] - Priority: HIGH

### Minor Issues Found:

1. [Issue description] - Priority: LOW
2. [Issue description] - Priority: LOW

---

## ✅ QA Sign-off

- [ ] All critical issues resolved
- [ ] All functional tests passed
- [ ] All integration tests passed
- [ ] Performance acceptable
- [ ] Security checks passed (if applicable)
- [ ] Documentation reviewed
- [ ] Ready for production deployment

**QA Approved By**: [Name]  
**Approval Date**: [Date]  
**Status**: ✅ APPROVED / ❌ REJECTED / 🚧 NEEDS FIXES

---

**Next Steps After QA**:

1. Move this file to `docs/qa/DONE/` (rename to \*\_REPORT.md)
2. Update completion doc with QA results
3. Update QUICK_INDEX.md status
4. Deploy to staging/production
```

---

## 🗂️ Platform-Specific Guidelines

### Mobile (React Native Expo)

**Completion Doc Location**:

```
docs/01-completed/mobile/PHASE_[X]_[FEATURE_NAME]_COMPLETE.md
```

**QA Checklist Location**:

```
docs/qa/NOT DONE/MOBILE_PHASE[X]_[FEATURE_NAME]_QA_CHECKLIST.md
```

**Required Sections in Completion Doc**:

- Expo SDK version used
- Native dependencies added
- iOS/Android specific implementations
- Deep linking changes (if any)
- Push notification setup (if any)
- App permissions required

### Worker Features

**Completion Doc Location**:

```
docs/01-completed/worker/WORKER_PHASE_[X]_[FEATURE_NAME]_COMPLETE.md
```

**QA Checklist Location**:

```
docs/qa/NOT DONE/WORKER_[FEATURE_NAME]_QA_CHECKLIST.md
```

**Required Sections**:

- Dashboard page changes
- Worker-specific API endpoints
- Profile/certification changes
- Earnings/payments integration

### Agency Features

**Completion Doc Location**:

```
docs/01-completed/agency/AGENCY_PHASE_[X]_[FEATURE_NAME]_COMPLETE.md
```

**QA Checklist Location**:

```
docs/qa/NOT DONE/AGENCY_[FEATURE_NAME]_QA_CHECKLIST.md
```

**Required Sections**:

- Agency dashboard changes
- Employee management changes
- KYC verification changes
- Multi-user management features

### Backend Features

**Completion Doc Location**:

```
docs/01-completed/backend/[FEATURE_NAME]_COMPLETE.md
```

**QA Checklist Location**:

```
docs/qa/NOT DONE/BACKEND_[FEATURE_NAME]_QA_CHECKLIST.md
```

**Required Sections**:

- Database migrations
- API endpoints added
- Service layer changes
- Schema definitions
- Test coverage

---

## 📊 Examples

### Example 1: Mobile Phase Completion

**Files Created**:

1. `docs/01-completed/mobile/PHASE_3_ESCROW_PAYMENT_COMPLETE.md`
2. `docs/qa/NOT DONE/MOBILE_PHASE3_ESCROW_PAYMENT_QA_CHECKLIST.md`
3. Archived: `docs/04-archive/duplicates/MOBILE_PHASE3_PROGRESS.md`

**Updates Made**:

- `docs/QUICK_INDEX.md` - Added Phase 3 to completed list
- `docs/00-README.md` - Updated completed features count
- `AGENTS.md` - Added latest update section

### Example 2: Worker Feature Completion

**Files Created**:

1. `docs/01-completed/worker/WORKER_PHASE1_IMPLEMENTATION_COMPLETE.md`
2. `docs/qa/NOT DONE/WORKER_PHASE1_PROFILE_QA_CHECKLIST.md`
3. Archived: `docs/04-archive/duplicates/WORKER_PHASE1_PROGRESS.md`

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T:

- Create completion docs in root `docs/` directory
- Leave progress files in `02-in-progress/` after completion
- Skip QA checklist creation
- Create multiple completion documents for same feature
- Mix Flutter and React Native documentation
- Use malformed filenames with special characters

### ✅ DO:

- Follow exact directory structure
- Use consistent naming conventions
- Archive progress files after completion
- Create QA checklists immediately
- Update index files
- Include comprehensive statistics
- Document all files created/modified
- List all API endpoints

---

## 🔄 Workflow Quick Reference

```
START WORK
    ↓
Create: docs/02-in-progress/[FEATURE]_PROGRESS.md
Create: docs/qa/NOT DONE/[PLATFORM]_[FEATURE]_QA_CHECKLIST.md
    ↓
DURING WORK
    ↓
Update: docs/02-in-progress/[FEATURE]_PROGRESS.md (daily)
    ↓
COMPLETION
    ↓
Create: docs/01-completed/[platform]/[FEATURE]_COMPLETE.md
Move: Progress file → docs/04-archive/duplicates/
Keep: QA checklist in docs/qa/NOT DONE/
Update: QUICK_INDEX.md, 00-README.md, AGENTS.md
    ↓
QA TESTING
    ↓
QA team uses: docs/qa/NOT DONE/[PLATFORM]_[FEATURE]_QA_CHECKLIST.md
    ↓
QA COMPLETE
    ↓
Move: docs/qa/NOT DONE/[FILE].md → docs/qa/DONE/[FILE]_REPORT.md
Update: Completion doc with QA results
    ↓
PRODUCTION DEPLOYMENT
```

---

## 📞 Questions?

**Reference Documents**:

- Navigation: `docs/00-README.md`
- Quick Index: `docs/QUICK_INDEX.md`
- Migration History: `docs/MIGRATION_SUMMARY.md`
- Project Memory: `AGENTS.md` (root)

**Directory Structure**: See `docs/00-README.md` for complete overview

---

## 🎯 Checklist for AI Agents

Before considering any feature "complete", verify:

- [ ] Completion document created in `docs/01-completed/[platform]/`
- [ ] QA checklist created in `docs/qa/NOT DONE/`
- [ ] Progress file archived to `docs/04-archive/duplicates/`
- [ ] QUICK_INDEX.md updated with new completion
- [ ] 00-README.md updated (if major feature)
- [ ] AGENTS.md updated with latest update section
- [ ] All files created/modified documented
- [ ] API endpoints documented
- [ ] Statistics included (lines of code, time spent)
- [ ] Known issues documented
- [ ] Deployment notes included
- [ ] Related documentation linked

---

**Policy Status**: ✅ ACTIVE  
**Last Updated**: November 14, 2025  
**Effective Date**: November 14, 2025  
**Review Date**: Quarterly

🤖 **AI Agents**: This is your primary guide for documentation workflow. Follow it strictly.
