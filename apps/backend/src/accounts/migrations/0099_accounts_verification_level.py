"""
Add verification_level field to Accounts model for tiered KYC verification.

Levels:
  0 = Unverified (no KYC or rejected)
  1 = ID Verified (ID + selfie face match, no clearance)
  2 = Fully Verified (ID + selfie + NBI/Police clearance)

Data migration backfills existing verified users:
  - KYCVerified=True WITH clearance file → level 2
  - KYCVerified=True WITHOUT clearance file → level 1
  - KYCVerified=False → level 0 (default)
"""

from django.db import migrations, models


def backfill_verification_levels(apps, schema_editor):
    """Backfill verification_level for existing accounts based on KYCVerified and clearance files."""
    Accounts = apps.get_model('accounts', 'Accounts')
    kycModel = apps.get_model('accounts', 'kyc')
    kycFilesModel = apps.get_model('accounts', 'kycFiles')

    verified_accounts = Accounts.objects.filter(KYCVerified=True)
    updated_level_2 = 0
    updated_level_1 = 0

    for account in verified_accounts:
        # Check if this account has a clearance file uploaded
        kyc_record = kycModel.objects.filter(accountFK=account).first()
        has_clearance = False
        if kyc_record:
            has_clearance = kycFilesModel.objects.filter(
                kycID=kyc_record,
                idType__in=['NBI', 'POLICE']
            ).exists()

        if has_clearance:
            account.verification_level = 2
            updated_level_2 += 1
        else:
            account.verification_level = 1
            updated_level_1 += 1
        account.save(update_fields=['verification_level'])

    print(f"\n  Backfilled verification levels: {updated_level_2} → Level 2 (Fully Verified), {updated_level_1} → Level 1 (ID Verified)")


def reverse_backfill(apps, schema_editor):
    """Reverse: set all verification_level back to 0."""
    Accounts = apps.get_model('accounts', 'Accounts')
    Accounts.objects.all().update(verification_level=0)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0098_job_scheduled_end_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='accounts',
            name='verification_level',
            field=models.IntegerField(default=0, db_index=True),
        ),
        migrations.RunPython(backfill_verification_levels, reverse_backfill),
    ]
