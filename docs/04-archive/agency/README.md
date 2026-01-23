# Agency Portal Implementation - Complete Module Index

**Status**: 📋 ALL MODULES PLANNED  
**Total Estimated Time**: 49-66 hours  
**Last Updated**: January 2025

---

## Overview

Complete implementation plan for agency web portal divided into 6 modular components. Each module is self-contained with detailed technical specifications, code examples, and testing checklists.

---

## Module Index

### Module 1: Employee Assignment System ⚠️ **CRITICAL BLOCKER**

**File**: `AGENCY_MODULE_1_EMPLOYEE_ASSIGNMENT.md`  
**Time**: 8-12 hours  
**Priority**: CRITICAL  
**Status**: Must complete before Module 4

**What it does**:

- Adds `assignedEmployeeID` field to Job model
- Creates employee assignment modal with workload display
- Backend validation preventing double assignments
- Unlocks job workflow (agencies can finally assign accepted jobs)

**Why critical**: Currently agencies can accept jobs but cannot assign them to employees, breaking the entire workflow.

---

### Module 2: Real-Time Chat & Messaging System

**File**: `AGENCY_MODULE_2_CHAT_MESSAGING.md`  
**Time**: 15-18 hours  
**Priority**: HIGH

**What it does**:

- Django Channels WebSocket integration
- Three-way communication (agency ↔ client ↔ worker)
- Real-time typing indicators
- Read receipts
- File attachments
- Message notifications

**Key features**:

- Agency joins existing client-worker conversations
- Real-time message updates (no polling)
- Push notifications for offline users

---

### Module 3: Performance Analytics Dashboard

**File**: `AGENCY_MODULE_3_ANALYTICS_DASHBOARD.md`  
**Time**: 6-8 hours  
**Priority**: MEDIUM

**What it does**:

- Revenue trends visualization (line chart)
- Job completion statistics (bar chart)
- Employee leaderboard with sorting
- KPI cards (revenue, jobs, rating, active)
- CSV export functionality

**Key features**:

- Uses existing Phase 2 Part 2 APIs
- Recharts library for visualizations
- Top 3 performers highlight cards

---

### Module 4: Job Lifecycle Management

**File**: `AGENCY_MODULE_4_JOB_LIFECYCLE.md`  
**Time**: 10-12 hours  
**Priority**: CRITICAL  
**Depends on**: Module 1 (Employee Assignment)

**What it does**:

- Active jobs listing with status badges
- Job detail page with 7-milestone timeline
- Two-phase completion workflow integration from mobile
- Photo gallery for completion proofs
- Real-time status updates

**Key workflow**:

```
ASSIGNED → IN_PROGRESS (work started) →
PENDING_APPROVAL (worker complete) →
COMPLETED (client approved)
```

**Mobile integration**:

- Matches existing mobile app two-phase completion
- Prerequisites enforced (work started before worker mark)
- Payment release on client approval

---

### Module 5: Admin Integration - Replace Mock Data

**File**: `AGENCY_MODULE_5_ADMIN_INTEGRATION.md`  
**Time**: 4-6 hours  
**Priority**: HIGH

**What it does**:

- Replace MOCK DATA in admin agency workers page
- Real API integration for employee list
- Performance modal with complete metrics
- Bulk activate/deactivate employees
- CSV export with real data

**Current state**: Admin page has UI but uses hardcoded mock workers array.

---

### Module 6: KYC Resubmission & Enhanced Verification

**File**: `AGENCY_MODULE_6_KYC_ENHANCEMENTS.md`  
**Time**: 6-8 hours  
**Priority**: MEDIUM

**What it does**:

- Display admin rejection reasons
- Single document replacement (not full resubmit)
- Resubmission counter (max 3 attempts)
- KYC submission history timeline
- Document preview modal
- Structured rejection categories

**Key features**:

- Agencies see WHY KYC rejected
- Can replace only rejected documents
- History audit trail
- Prevents unlimited resubmission abuse

---

## Implementation Strategy

### Critical Path (Must follow order)

1. **Start**: Module 1 (Employee Assignment) - 8-12 hours
   - Unlocks job workflow
   - Required for Module 4

2. **Then**: Module 4 (Job Lifecycle) - 10-12 hours
   - Integrates with Module 1 assignments
   - Shows active job monitoring

### Parallel Development (Can do simultaneously)

**Group A** (Backend-focused):

- Module 2 (Chat) - 15-18 hours
- Module 6 (KYC) - 6-8 hours

**Group B** (Frontend-focused):

- Module 3 (Analytics) - 6-8 hours
- Module 5 (Admin Integration) - 4-6 hours

### Total Timeline Estimates

**Sequential**: 49-66 hours (1-2 weeks full-time)  
**Parallel (2 devs)**: 25-35 hours (3-5 days full-time)  
**Parallel (3 devs)**: 18-24 hours (2-3 days full-time)

---

## Technical Stack Summary

### Backend

- Django 5.2.8 + Django Ninja API
- Django Channels 4.0.0 (WebSocket for chat)
- PostgreSQL with migrations
- Supabase (file storage for KYC)

### Frontend

- Next.js 15.5.3 + React 19
- TanStack Query (data fetching)
- Recharts (analytics charts)
- Tailwind CSS (styling)
- Lucide React (icons)

### Dependencies to Install

```bash
# Backend
pip install channels==4.0.0 channels-redis==4.1.0 daphne==4.0.0

# Frontend
cd apps/frontend_web
npm install recharts date-fns
```

---

## Module Completion Checklist

### Module 1: Employee Assignment ✅

- [ ] Migration `0038_job_assigned_employee_tracking.py` applied
- [ ] Backend service functions created (3 functions)
- [ ] API endpoints added (3 endpoints)
- [ ] AssignEmployeeModal component created
- [ ] Jobs page modified for assignment
- [ ] All 30+ tests passing

### Module 2: Chat Messaging ✅

- [ ] Migration `0039_conversation_agency_support.py` applied
- [ ] Django Channels configured
- [ ] ChatConsumer WebSocket consumer created
- [ ] Agency conversations API added (2 endpoints)
- [ ] useWebSocket hook created
- [ ] Agency messages page created
- [ ] Chat detail page created
- [ ] All 22+ tests passing

### Module 3: Analytics Dashboard ✅

- [ ] Recharts installed
- [ ] useAnalytics hook created
- [ ] Analytics page created with charts
- [ ] KPI cards displaying real data
- [ ] Employee leaderboard rendering
- [ ] CSV export working
- [ ] Navigation integration complete
- [ ] All 14+ tests passing

### Module 4: Job Lifecycle ✅

- [ ] Active jobs API endpoints added (2 endpoints)
- [ ] Active jobs page created
- [ ] Job detail page with timeline created
- [ ] Status badges working
- [ ] Photo gallery functional
- [ ] Mobile workflow integrated
- [ ] All 19+ tests passing

### Module 5: Admin Integration ✅

- [ ] Mock data removed from admin page
- [ ] useAdminAgency hook created
- [ ] Real API integration complete
- [ ] Performance modal created
- [ ] Bulk actions working
- [ ] CSV export functional
- [ ] All 17+ tests passing

### Module 6: KYC Enhancements ✅

- [ ] Migration `0004_enhanced_kyc_tracking.py` applied
- [ ] AgencyKYCHistory model created
- [ ] Resubmission API endpoints added (3 endpoints)
- [ ] Enhanced KYC page created
- [ ] Document preview working
- [ ] Rejection reasons displaying
- [ ] Resubmission limits enforced
- [ ] All 21+ tests passing

---

## Testing Strategy

### Unit Tests (Backend)

- Service functions with mocked data
- API endpoints with test client
- Validation logic with edge cases

### Integration Tests (Backend)

- Full request/response cycles
- Database operations
- File uploads (KYC, chat attachments)

### Component Tests (Frontend)

- React Testing Library
- Mock API responses
- User interaction flows

### E2E Tests (Full Stack)

- Critical path: Accept job → Assign → Complete workflow
- Chat message flow
- KYC resubmission flow

---

## Success Metrics

After all modules complete, agency portal should have:

1. ✅ **Complete job workflow** (accept → assign → monitor → complete)
2. ✅ **Real-time communication** (agency ↔ client ↔ worker chat)
3. ✅ **Performance insights** (revenue, jobs, employee metrics)
4. ✅ **Admin oversight** (real employee data, bulk actions)
5. ✅ **Smooth KYC process** (clear rejections, easy resubmission)
6. ✅ **Zero TypeScript errors**
7. ✅ **100% API integration** (no mock data)
8. ✅ **Comprehensive test coverage** (120+ test cases)

---

## Known Issues & Future Enhancements

### Known Issues (from existing code)

- Jobs page has 474 lines (could be refactored)
- No employee assignment blocking entire workflow
- Mock data in admin panel
- KYC rejection reasons not displayed

### Future Enhancements (Post-modules)

- Mobile app for agency employees
- Push notifications for chat
- Advanced analytics (category breakdown, trends)
- Employee scheduling/availability
- Automated job assignment (AI-based)
- Multi-language support

---

## Documentation Structure

```
docs/03-planned/agency/
├── README.md (this file)
├── AGENCY_MODULE_1_EMPLOYEE_ASSIGNMENT.md (500+ lines)
├── AGENCY_MODULE_2_CHAT_MESSAGING.md (800+ lines)
├── AGENCY_MODULE_3_ANALYTICS_DASHBOARD.md (600+ lines)
├── AGENCY_MODULE_4_JOB_LIFECYCLE.md (900+ lines)
├── AGENCY_MODULE_5_ADMIN_INTEGRATION.md (600+ lines)
└── AGENCY_MODULE_6_KYC_ENHANCEMENTS.md (800+ lines)
```

**Total Documentation**: 4,200+ lines across 7 files

---

## Quick Start Guide

### For Backend Developers

1. **Start with Module 1**:

   ```bash
   cd apps/backend/src
   # Create migration
   python manage.py makemigrations
   # Apply migration
   python manage.py migrate
   # Add service functions to agency/service.py
   # Add API endpoints to agency/api.py
   ```

2. **Then Module 2 (Chat)**:
   ```bash
   pip install channels channels-redis daphne
   # Configure Django Channels in settings.py
   # Create chat/consumers.py
   # Add WebSocket routing
   ```

### For Frontend Developers

1. **Start with Module 3 (Analytics)**:

   ```bash
   cd apps/frontend_web
   npm install recharts date-fns
   # Create lib/hooks/useAnalytics.ts
   # Create app/agency/analytics/page.tsx
   ```

2. **Then Module 5 (Admin Integration)**:
   ```bash
   # Open app/admin/users/agency/[id]/workers/page.tsx
   # Remove lines 18-50 (MOCK DATA)
   # Add useAgencyEmployees hook
   # Create EmployeePerformanceModal component
   ```

---

## Support & Contact

**Issues**: If implementation differs from docs, check AGENTS.md for latest status  
**Questions**: Refer to individual module files for detailed technical specs  
**Updates**: All changes tracked in AGENTS.md memory file

---

**Status**: ✅ ALL 6 MODULES FULLY DOCUMENTED AND READY FOR IMPLEMENTATION  
**Next Step**: Begin Module 1 (Employee Assignment) to unlock job workflow
