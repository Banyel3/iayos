"""
Dangerous maintenance script:
- Deletes all Accounts except a fixed email whitelist.
- Also deletes all AgencyEmployee rows under gamerofgames76@gmail.com.

Run with:
  python manage.py shell < scripts/maintenance/purge_accounts_keep_whitelist.py

Safety:
- DRY_RUN = True by default (no destructive changes).
- Set DRY_RUN = False and CONFIRM_TEXT exactly to execute.
"""

from django.db import transaction
from django.db.models.functions import Lower

from accounts.models import Accounts
from agency.models import AgencyEmployee

# -------------------------
# Configuration
# -------------------------
DRY_RUN = False
CONFIRM_TEXT = "DELETE_ALL_EXCEPT_WHITELIST"
REQUIRED_CONFIRM_TEXT = "DELETE_ALL_EXCEPT_WHITELIST"

# If True, superusers are preserved even if not in whitelist.
# Keep False if you want strict "delete all except whitelist" behavior.
ALSO_KEEP_SUPERUSERS = False

USER_ACCOUNT_EMAILS = {
    "john@gmail.com",
    "pivoded769@3dkai.com",
    "cogic73867@3dkai.com",
    "yasopog471@faxzu.com",
    "gabrielmodillas.wk@gmail.com",
    "shawtymodz24@gmail.com",
    "sandarajanepasa@gmail.com",
    "angie_cornelio@yahoo.com.au",
    "vinczar.jailani@wmsu.edu.ph",
    "mike@gmail.com",
    "ravenesperat@gmail.com",
    "superadmin@gmail.com",
    "marjorie.rojas@wmsu.edu.ph",
    "boyabunda@gmail.com",
    "ahmadyahiya@gmail.com",
    "hz202300645@wmsu.edu.ph",
    "hz202301459@wmsu.edu.ph",
    "hz202301955@wmsu.edu.ph",
    "hz202303373@wmsu.edu.ph",
}

AGENCY_ACCOUNT_EMAILS = {
    "gamerofgames76@gmail.com",
    "acer.vulcanizing@gmail.com",
    "daraemoon21@gmail.com",
}

AGENCY_EMPLOYEE_PURGE_EMAIL = "gamerofgames76@gmail.com"

# -------------------------
# Script
# -------------------------

whitelist_lower = {e.strip().lower() for e in (USER_ACCOUNT_EMAILS | AGENCY_ACCOUNT_EMAILS)}

all_accounts = list(
    Accounts.objects.annotate(email_lower=Lower("email")).values(
        "accountID", "email", "email_lower", "is_superuser"
    )
)

keep_ids = {
    row["accountID"]
    for row in all_accounts
    if row["email_lower"] in whitelist_lower
    or (ALSO_KEEP_SUPERUSERS and row["is_superuser"])
}

db_emails_lower = {row["email_lower"] for row in all_accounts}
missing_whitelist = sorted(whitelist_lower - db_emails_lower)

delete_qs = Accounts.objects.exclude(accountID__in=keep_ids)

print("=" * 72)
print("ACCOUNT PURGE PREVIEW")
print("=" * 72)
print(f"Total accounts in DB: {len(all_accounts)}")
print(f"Whitelist entries:     {len(whitelist_lower)}")
print(f"Accounts to keep:      {len(keep_ids)}")
print(f"Accounts to delete:    {delete_qs.count()}")
print(f"Delete agency employees under: {AGENCY_EMPLOYEE_PURGE_EMAIL}")
print()

if missing_whitelist:
    print("[WARN] These whitelist emails were NOT found in DB:")
    for email in missing_whitelist:
        print(f"  - {email}")
    print()

print("Accounts that will be kept:")
for row in sorted(
    [r for r in all_accounts if r["accountID"] in keep_ids],
    key=lambda x: x["email_lower"],
):
    tag = " (superuser)" if row["is_superuser"] else ""
    print(f"  - {row['email']}{tag}")
print()

sample_delete_emails = list(
    delete_qs.annotate(email_lower=Lower("email")).order_by("email_lower").values_list("email", flat=True)[:30]
)
if sample_delete_emails:
    print("Sample accounts to delete (first 30):")
    for email in sample_delete_emails:
        print(f"  - {email}")
    if delete_qs.count() > 30:
        print(f"  ... and {delete_qs.count() - 30} more")
print()

employees_qs = AgencyEmployee.objects.filter(agency__email__iexact=AGENCY_EMPLOYEE_PURGE_EMAIL)
print(f"Agency employees to delete under {AGENCY_EMPLOYEE_PURGE_EMAIL}: {employees_qs.count()}")
print("=" * 72)

if DRY_RUN:
    print("DRY_RUN=True: no changes were applied.")
else:
    if CONFIRM_TEXT != REQUIRED_CONFIRM_TEXT:
        raise RuntimeError(
            "Refusing to execute destructive action. "
            f"Set CONFIRM_TEXT = '{REQUIRED_CONFIRM_TEXT}'"
        )
    if missing_whitelist:
        raise RuntimeError(
            "Refusing destructive action because some whitelist emails are missing in DB. "
            "Fix the whitelist or verify data before rerunning."
        )

    with transaction.atomic():
        emp_deleted, emp_breakdown = employees_qs.delete()
        acc_deleted, acc_breakdown = delete_qs.delete()

        print("Deletion completed.")
        print(f"Agency employee rows deleted: {emp_deleted}")
        print(f"Account-related rows deleted: {acc_deleted}")
        print("Employee delete breakdown:", emp_breakdown)
        print("Account delete breakdown:", acc_breakdown)

print()
remaining = list(Accounts.objects.order_by("email").values_list("email", flat=True))
print(f"Remaining accounts in DB: {len(remaining)}")
for email in remaining:
    print(f"  - {email}")
