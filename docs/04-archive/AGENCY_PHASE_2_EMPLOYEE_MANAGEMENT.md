# [Agency] Phase 2: Employee Management Enhancements

**Labels:** `priority:high`, `type:feature`, `area:agency`
**Priority:** HIGH
**Estimated Time:** 20-25 hours

## Summary
Enhance the employee management system with rating updates, performance tracking, and Employee of the Month recognition.

## Tasks

### Backend Implementation
- [ ] Create API endpoint: `PUT /api/agency/employees/{id}/rating` to update employee ratings
- [ ] Implement rating calculation logic (average of job reviews)
- [ ] Create `POST /api/agency/employees/{id}/employee-of-month` endpoint
- [ ] Add employeeOfTheMonth field to AgencyEmployee model
- [ ] Create notification system for Employee of the Month selection
- [ ] Add validation: only agency owner can update employee data

### Frontend Implementation
- [ ] Create Employee Management page (`/agency/employees`)
- [ ] Build employee rating update modal
- [ ] Implement Employee of the Month selection UI
- [ ] Add employee performance dashboard
- [ ] Create employee detail view with job history

## Files to Create/Modify
- `apps/backend/src/agency/models.py` - Add employeeOfTheMonth field
- `apps/backend/src/agency/api.py` - Add rating and EOTM endpoints
- `apps/backend/src/agency/migrations/0002_employee_enhancements.py` - New migration
- `apps/frontend_web/app/agency/employees/page.tsx` - NEW employee management page
- `apps/frontend_web/components/agency/EmployeeCard.tsx` - NEW employee card component
- `apps/frontend_web/components/agency/RatingUpdateModal.tsx` - NEW rating modal

## Acceptance Criteria
- [ ] Agency owners can update employee ratings
- [ ] Employee of the Month can be selected
- [ ] Employees receive notification when selected as EOTM
- [ ] Employee ratings reflect job review averages
- [ ] Employee management page displays all employees with filters
- [ ] Only agency owner has permission to manage employees

## Dependencies
- **Requires:** Agency Phase 1 - accountType field implementation

## Testing
- [ ] Test rating update with valid/invalid permissions
- [ ] Test Employee of the Month selection
- [ ] Verify notification delivery
- [ ] Test employee list filtering and sorting
- [ ] Verify rating calculation accuracy

---
Generated with Claude Code
