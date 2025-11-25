# Manual Job Invitation Creation for Devante Agency

## ✅ Agency Module 1 Complete - Ready to Test!

The employee assignment system is now fully implemented. To test it end-to-end, you need:

1. **An agency account** (Devante or any agency)
2. **A client account** to create job invitations
3. **A job invitation** sent to the agency

## Option 1: Create Test Data via Django Admin

1. Navigate to: http://localhost:8000/admin
2. Login with admin credentials
3. Create:
   - **Agency Profile** (if Devante doesn't exist)
   - **Agency Employees** (at least 2-3 employees)
   - **Job** with `jobType='INVITE'` and agency assigned

## Option 2: Use API via Postman/Insomnia

### Step 1: Login as Client

```http
POST http://localhost:8000/api/accounts/login
Content-Type: application/json

{
  "email": "client@example.com",
  "password": "your_password"
}
```

### Step 2: Create Agency Invite Job

```http
POST http://localhost:8000/api/mobile/jobs/invite
Authorization: Bearer {token_from_login}
Content-Type: application/json

{
  "title": "Test Construction Job",
  "description": "Need skilled workers for construction project",
  "category_id": 1,
  "budget": 5000.0,
  "location": "Zamboanga City",
  "urgency_level": "HIGH",
  "expected_duration": "1 week",
  "preferred_start_date": "2025-11-26",
  "materials_needed": ["Cement", "Sand", "Steel bars"],
  "agency_id": {AGENCY_ID},
  "downpayment_method": "WALLET"
}
```

### Step 3: Agency Accepts Invitation

```http
POST http://localhost:8000/api/agency/jobs/{job_id}/accept
Cookie: sessionid={agency_session}
```

### Step 4: TEST THE NEW FEATURE! Assign Employee

```http
POST http://localhost:8000/api/agency/jobs/{job_id}/assign-employee
Cookie: sessionid={agency_session}
Content-Type: multipart/form-data

employee_id: {EMPLOYEE_ID}
assignment_notes: "This employee is experienced in construction"
```

## Option 3: Direct Database Insert (Quick Test)

```sql
-- Connect to database
docker-compose -f docker-compose.dev.yml exec backend psql -U postgres -d iayos

-- Find or create agency profile
SELECT "profileId", "fullName", "accountFK_id"
FROM accounts_profile
WHERE "profileType" = 'AGENCY'
LIMIT 5;

-- Find client profile
SELECT "profileId", "fullName", "accountFK_id"
FROM accounts_profile
WHERE "profileType" = 'CLIENT'
LIMIT 5;

-- Create test job invitation
INSERT INTO accounts_job (
  "title",
  "description",
  "clientID_id",
  "categoryID_id",
  "budget",
  "location",
  "urgency",
  "status",
  "jobType",
  "inviteStatus",
  "expectedDuration",
  "preferredStartDate",
  "createdAt",
  "updatedAt"
) VALUES (
  'Test Agency Job - Manual Creation',
  'Testing agency assignment system',
  {CLIENT_PROFILE_ID},
  1,
  5000.00,
  'Zamboanga City',
  'HIGH',
  'ACTIVE',
  'INVITE',
  'PENDING',
  '1 week',
  '2025-11-26',
  NOW(),
  NOW()
);

-- Get the job ID
SELECT "jobID", "title", "inviteStatus" FROM accounts_job ORDER BY "jobID" DESC LIMIT 1;
```

## ✅ What to Test (Agency Module 1)

Once you have a job invitation:

1. **Login as Agency** → Navigate to `/agency/jobs`
2. **View "Pending Invites" tab** → See the invitation
3. **Accept Invitation** → Job moves to "Accepted Jobs" tab
4. **Click "Assign Employee"** → Modal opens
5. **View Employee Workload** → See availability badges (Available/Working/Busy)
6. **Select Employee** → Add optional notes
7. **Submit Assignment** → Job shows "✓ Assigned to: {name}"
8. **Verify Notifications** → Employee and client both notified
9. **Check Database** → JobLog entry created, job status = 'ASSIGNED'

## 🎯 Success Criteria

- ✅ Job appears in "Accepted Jobs" tab after acceptance
- ✅ "Assign Employee" button visible for unassigned jobs
- ✅ Modal opens with employee list
- ✅ Workload badges display correctly
- ✅ Assignment succeeds without errors
- ✅ Green badge shows assigned employee name
- ✅ Notifications sent to employee and client
- ✅ Job status changes to 'ASSIGNED' in database

## 📝 Notes

- **Backend**: All APIs operational at `http://localhost:8000/api/agency/*`
- **Frontend**: Running at `http://localhost:3000/agency/jobs`
- **Migration**: Applied successfully (0038 merged with 0047)
- **Database Fields**: `assignedEmployeeID`, `employeeAssignedAt`, `assignmentNotes`

## 🚀 Quick Start (If No Test Data)

The fastest way is to:

1. Use Django admin to create 1 agency + 2-3 employees
2. Use admin to create 1 INVITE-type job for that agency
3. Login as agency account at frontend
4. Test the assignment flow

---

**For detailed implementation docs**: See `docs/01-completed/agency/AGENCY_MODULE1_EMPLOYEE_ASSIGNMENT_COMPLETE.md`
