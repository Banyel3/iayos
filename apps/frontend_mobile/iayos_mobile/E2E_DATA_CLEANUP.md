# ⚠️ IMPORTANT: E2E Test Data Cleanup

## Issue

When running E2E tests against the **live backend** (`api.iayos.online`), test accounts and data are created but **NOT automatically deleted**. This will cause database bloat over time.

## Test Accounts Created

Each E2E test run creates:

- `client@test.com` - Test client account with profile
- `worker@test.com` - Test worker account with profile

During tests, these accounts may also create:

- Job postings
- Job applications
- Messages
- Notifications
- Other related data

## Solutions

### Option 1: Use Local Backend (Recommended for CI)

Set `use_live_backend: false` in the workflow. This:

- ✅ Creates fresh database for each test run
- ✅ Automatically destroyed after tests complete
- ✅ No cleanup needed
- ❌ Slower (takes ~5 minutes to set up backend)
- ❌ Doesn't test against real production environment

### Option 2: Manual Cleanup Command

Run this command after tests complete:

```bash
# On your production server
cd apps/backend/src
python manage.py cleanup_e2e_test_data --dry-run  # Preview what will be deleted
python manage.py cleanup_e2e_test_data            # Actually delete
```

The command will:

1. Find test accounts (client@test.com, worker@test.com)
2. Show all associated data (jobs, applications, etc.)
3. Ask for confirmation
4. Delete everything in a transaction

### Option 3: Automated Cleanup (TODO)

Add this step to the workflow (requires backend API):

```yaml
- name: 🧹 Cleanup test data
  if: always() && github.event.inputs.use_live_backend == 'true'
  run: |
    # Call cleanup API endpoint
    curl -X POST https://api.iayos.online/api/admin/cleanup-e2e \
      -H "Authorization: Bearer ${{ secrets.ADMIN_API_TOKEN }}"
```

**To implement this:**

1. Create an admin API endpoint:

   ```python
   # apps/backend/src/admin/views.py
   @api.post("/cleanup-e2e-tests")
   @require_admin_auth
   def cleanup_e2e_tests(request):
       from accounts.management.commands.cleanup_e2e_test_data import Command
       command = Command()
       command.handle(dry_run=False)
       return {"status": "success", "message": "E2E test data cleaned"}
   ```

2. Add `ADMIN_API_TOKEN` secret to GitHub
3. Update workflow to call the endpoint

### Option 4: Use Dedicated Test Users

Instead of creating/deleting, use pre-existing test accounts:

**Pros:**

- ✅ No cleanup needed
- ✅ Faster (no user creation)
- ✅ Consistent state

**Cons:**

- ❌ Tests must handle existing data
- ❌ Tests may interfere with each other
- ❌ Need to reset state between runs

## Current Workflow Behavior

### When `use_live_backend: true` (Default)

- ⚠️ **Test data persists** after workflow completes
- ⚠️ You must manually clean up or database will bloat
- ✅ Tests run against real production environment
- ✅ Fast (no backend setup)

### When `use_live_backend: false`

- ✅ Fresh database created for tests
- ✅ Automatically destroyed after tests
- ✅ No cleanup needed
- ❌ Takes ~5 minutes longer
- ❌ Doesn't test real backend

## Recommendations

### For Development/Testing

Use `use_live_backend: true` but remember to clean up:

```bash
# After each test run
python manage.py cleanup_e2e_test_data
```

### For Production CI/CD

Option A - Use local backend:

```yaml
use_live_backend: false # Clean slate each time
```

Option B - Implement automated cleanup API (best long-term solution)

## Files

- **Cleanup Command**: `apps/backend/src/accounts/management/commands/cleanup_e2e_test_data.py`
- **Workflow**: `.github/workflows/detox-tests.yml`

## Usage Examples

### Check what would be deleted

```bash
python manage.py cleanup_e2e_test_data --dry-run
```

### Delete all test data

```bash
python manage.py cleanup_e2e_test_data
# Type "DELETE" to confirm
```

### Delete specific test account

```bash
python manage.py cleanup_e2e_test_data --email client@test.com
```

## Monitoring

To check if cleanup is needed:

```sql
SELECT email, created_at, is_verified
FROM accounts_accounts
WHERE email IN ('client@test.com', 'worker@test.com');
```

If you see multiple entries or old entries, cleanup is needed.

## Future Improvements

1. **Automated cleanup API endpoint** - Call from GitHub Actions
2. **Time-based cleanup** - Auto-delete test accounts older than 1 hour
3. **Dedicated test environment** - Separate staging backend for E2E tests
4. **Database snapshots** - Restore from snapshot after each test run
