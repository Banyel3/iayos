# [Agency] Phase 3: Agency Job Workflow & Assignment System

**Labels:** `priority:high`, `type:feature`, `area:agency`
**Priority:** HIGH
**Estimated Time:** 25-30 hours

## Summary
Implement comprehensive job acceptance, employee assignment, and tracking workflow for agencies.

## Tasks

### Job Acceptance & Assignment
- [ ] Create agency job dashboard showing available jobs
- [ ] Implement job acceptance workflow (replaces application)
- [ ] Build employee assignment interface
- [ ] Create API endpoint: `POST /api/agency/jobs/{job_id}/assign-employee`
- [ ] Add job status tracking for agency-accepted jobs
- [ ] Implement employee availability checking before assignment

### Agency Dashboard
- [ ] Create comprehensive agency dashboard (`/agency/dashboard`)
- [ ] Display accepted jobs with assignment status
- [ ] Show employee workload distribution
- [ ] Add job filtering by status (accepted, in-progress, completed)
- [ ] Implement quick assignment interface

### Notifications
- [ ] Notify agency when job is available for acceptance
- [ ] Notify employee when assigned to job
- [ ] Notify client when agency accepts job
- [ ] Notify account manager when employee completes job

## Files to Create/Modify
- `apps/backend/src/agency/api.py` - Add job assignment endpoints
- `apps/backend/src/jobs/models.py` - Add agency assignment fields
- `apps/frontend_web/app/agency/jobs/page.tsx` - NEW agency jobs page
- `apps/frontend_web/app/agency/jobs/[id]/assign/page.tsx` - NEW assignment page
- `apps/frontend_web/components/agency/JobCard.tsx` - NEW job card component
- `apps/frontend_web/components/agency/EmployeeSelector.tsx` - NEW employee selector
- `apps/backend/src/accounts/models.py` - Add new notification types

## Acceptance Criteria
- [ ] Agencies can accept jobs through dedicated workflow
- [ ] Agency can assign accepted jobs to employees
- [ ] Dashboard shows real-time job and employee status
- [ ] All stakeholders receive appropriate notifications
- [ ] Employee availability prevents double-booking
- [ ] Job lifecycle properly tracked for agency assignments

## Dependencies
- **Requires:** Agency Phase 1 - Job acceptance API implementation
- **Requires:** Agency Phase 2 - Employee management system

## Testing
- [ ] Test job acceptance flow end-to-end
- [ ] Test employee assignment with availability checks
- [ ] Verify notification delivery to all parties
- [ ] Test dashboard data accuracy
- [ ] Verify employee workload calculation

---
Generated with Claude Code
