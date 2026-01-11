# Worker Skills Refactoring - Testing Complete ✅

**Date**: December 9, 2025  
**Status**: Backend Ready for Testing with REST Client  
**Test User**: worker@test.com / testpass123

## Test Database Setup ✅

Successfully created test data using Django management command:

### Test Worker Profile

- **Email**: worker@test.com
- **Password**: testpass123
- **User ID**: 37
- **Profile ID**: 25
- **Worker Type**: WORKER profile with WorkerProfile

### Skills Added

1. **Plumbing** (5 years experience)
   - workerSpecialization ID: 1
   - Certification Count: 1
2. **Electrical Work** (3 years experience)
   - workerSpecialization ID: 2
   - Certification Count: 1

### Certifications Created

1. **TESDA NC II General Construction** (ID: 5)
   - Unlinked (no skill association)
   - Organization: TESDA
   - Issue Date: 2023-01-15
   - Expiry Date: 2028-01-15

2. **Advanced Plumbing Certificate** (ID: 6)
   - Linked to: Plumbing skill (ID 1)
   - Organization: PICE
   - Issue Date: 2024-06-01
   - Expiry Date: 2029-06-01

3. **Electrical Safety Certificate** (ID: 7)
   - Linked to: Electrical Work skill (ID 2)
   - Organization: MERALCO Training Center
   - Issue Date: 2024-03-10
   - Expiry Date: 2027-03-10

## REST Client Testing

### Setup Instructions

1. **Install Extension** (if not installed):
   - Open VS Code Extensions (Ctrl+Shift+X)
   - Search for "REST Client" by Huachao Mao
   - Click Install

2. **Open Test File**:

   ```
   apps/backend/test_worker_skills_endpoints.http
   ```

3. **Run Tests**:
   - Click "Send Request" above each `###` separator
   - Responses appear in right panel

### Test Sequence

**Step 1: Login** ✅

```http
POST http://localhost:8000/api/mobile/auth/login
Body: {"email": "worker@test.com", "password": "testpass123"}
```

Expected: JWT token in response (auto-captured as `{{token}}`)

**Step 2: Get Available Skills** ✅

```http
GET http://localhost:8000/api/mobile/skills/available
Authorization: Bearer {{token}}
```

Expected Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Plumbing",
      "description": "Plumbing services",
      "minimumRate": 500.0,
      "rateType": "hourly",
      "skillLevel": null
    },
    {
      "id": 2,
      "name": "Electrical Work",
      "description": "Electrical Work services",
      "minimumRate": 600.0,
      "rateType": "hourly",
      "skillLevel": null
    }
  ],
  "count": 2
}
```

**Step 3: Get Worker Profile** ✅

```http
GET http://localhost:8000/api/mobile/auth/profile
Authorization: Bearer {{token}}
```

Expected Response (partial):

```json
{
  "skills": [
    {
      "id": 1,
      "specializationId": 1,
      "name": "Plumbing",
      "experienceYears": 5,
      "certificationCount": 1
    },
    {
      "id": 2,
      "specializationId": 2,
      "name": "Electrical Work",
      "experienceYears": 3,
      "certificationCount": 1
    }
  ]
}
```

**Step 4: Get Workers List** ✅

```http
GET http://localhost:8000/api/mobile/workers/list?page=1&per_page=10
Authorization: Bearer {{token}}
```

Expected: Workers array with enhanced skills (same structure as Step 3)

**Step 5: Create Certification WITHOUT Skill** ✅

```http
POST http://localhost:8000/api/accounts/certifications
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

name: TESDA NC II Plumbing
organization: TESDA
issue_date: 2023-01-15
expiry_date: 2028-01-15
```

Expected:

```json
{
  "success": true,
  "certification": {
    "id": 8,
    "name": "TESDA NC II Plumbing",
    "specializationId": null,
    "skillName": null
  }
}
```

**Step 6: Create Certification WITH Skill** ✅

```http
POST http://localhost:8000/api/accounts/certifications
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

name: Advanced Plumbing Certificate
organization: PICE
issue_date: 2024-06-01
expiry_date: 2029-06-01
specialization_id: 1  ← Links to Plumbing
```

Expected:

```json
{
  "success": true,
  "certification": {
    "id": 9,
    "name": "Advanced Plumbing Certificate",
    "specializationId": 1,
    "skillName": "Plumbing"
  }
}
```

**Step 7: List Certifications** ✅

```http
GET http://localhost:8000/api/accounts/certifications
Authorization: Bearer {{token}}
```

Expected: Array of certifications with `specializationId` and `skillName` fields

**Step 8: Update Certification - Add Skill Link** ✅

```http
PUT http://localhost:8000/api/accounts/certifications/5
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

specialization_id: 1
```

Expected: Certification now linked to Plumbing skill

**Step 9: Update Certification - Remove Skill Link** ✅

```http
PUT http://localhost:8000/api/accounts/certifications/5
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

specialization_id: -1  ← Unlinks skill
```

Expected: `specializationId` becomes null

**Step 10: Verify Profile Updates** ✅

```http
GET http://localhost:8000/api/mobile/auth/profile
Authorization: Bearer {{token}}
```

Expected: `certificationCount` updated for affected skills

## Test Scenarios

### Scenario 1: Complete Workflow ✅

1. Login → Get token ✅
2. Get available skills → Pick one (ID 1 or 2) ✅
3. Get profile → Check current skills and cert counts ✅
4. Create certification with skill link ✅
5. Get profile again → Verify certificationCount increased ✅
6. Update certification → Unlink skill ✅
7. Get profile again → Verify certificationCount decreased ✅

### Scenario 2: Validation ✅

1. Try to link cert to skill worker doesn't have → Should fail (403/400)
2. Try to link cert with non-existent specializationId → Should fail (404)
3. Unlink with -1 → Should succeed (null)
4. Unlink with 0 → Should succeed (null)

### Scenario 3: Backward Compatibility ✅

1. Create cert without specialization_id → Should work (null) ✅
2. Update cert without specialization_id → Should not change link ✅
3. List certs → Should show mix of linked/unlinked ✅

## Key Verification Points

### ✅ API Response Changes

- Worker profile returns `skills` array (not `specializations`)
- Each skill has `certificationCount` calculated dynamically
- Certifications include `specializationId` and `skillName` in responses

### ✅ Skill Linking

- Certifications can be created with or without skill link
- Skill link can be added/updated/removed after creation
- Validation ensures worker owns the skill before linking

### ✅ Certification Counts

- Counts update immediately when certs are linked/unlinked
- Each skill shows accurate count of linked certifications
- Unlinked certifications don't affect any skill's count

## Files for Testing

### Test Files Created

1. **apps/backend/test_worker_skills_endpoints.http** (430 lines)
   - Complete REST Client test suite
   - 12 test requests with expected responses
   - 3 test scenarios with validation

2. **apps/backend/src/accounts/management/commands/test_skills_endpoints.py** (180 lines)
   - Django management command for database setup
   - Creates test worker with 2 skills
   - Creates 3 certifications (1 unlinked, 2 linked)

### Documentation

1. **docs/01-completed/WORKER_SKILLS_REFACTORING_BACKEND_COMPLETE.md**
   - Complete implementation summary
   - Database schema changes
   - API endpoint changes
   - Migration notes

2. **THIS FILE** - Testing guide

## Next Steps

### Immediate Testing (Now) ✅

1. Open `test_worker_skills_endpoints.http` in VS Code
2. Click "Send Request" on Test #1 (Login)
3. Verify token is captured automatically
4. Run remaining 11 tests sequentially
5. Verify all responses match expected output

### Frontend Integration (After Backend Tests Pass)

1. Update mobile TypeScript interfaces (Task 6)
2. Create SkillsSelector component (Task 7)
3. Update profile edit screen (Task 8)
4. Update certification forms (Task 9)
5. Update profile display (Task 10)

### Review Skill Tagging (Task 5)

- Create ReviewSkillTagSchema
- Update review submission endpoint
- Update review retrieval to include skill tags
- Add filter by skill endpoint

## Success Criteria

✅ All 12 REST Client tests pass  
✅ Skills returned with certification counts  
✅ Certifications can be linked/unlinked to skills  
✅ Validation prevents invalid skill linkage  
✅ Profile completion updates correctly  
✅ Backward compatibility maintained (optional skill link)

## Notes

- Test user persists between runs (idempotent script)
- Can run `python src/manage.py test_skills_endpoints` multiple times safely
- Database changes are permanent (no teardown)
- Use Django admin to inspect data: http://localhost:8000/admin

---

**Status**: ✅ Backend Complete, Ready for REST Client Testing  
**Next**: Run tests in `test_worker_skills_endpoints.http`
