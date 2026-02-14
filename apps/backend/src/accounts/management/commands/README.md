# E2E Test Data Cleanup Command

Removes test accounts created during E2E testing.

## Usage

```bash
# Preview what will be deleted
python manage.py cleanup_e2e_test_data --dry-run

# Actually delete test data
python manage.py cleanup_e2e_test_data

# Delete specific test account
python manage.py cleanup_e2e_test_data --email client@test.com
```

## What it deletes

- Test accounts: `client@test.com`, `worker@test.com`
- All associated data: profiles, jobs, applications, notifications

## When to run

- After E2E tests complete (if using live backend)
- Periodically to prevent database bloat
- Before creating fresh test data
