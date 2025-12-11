# Generated migration for adding accountType field
from django.db import migrations, models


def populate_account_types(apps, schema_editor):
    """
    Populate accountType for existing users based on their profiles/agency relationships
    """
    Accounts = apps.get_model('accounts', 'Accounts')
    Profile = apps.get_model('accounts', 'Profile')
    Agency = apps.get_model('accounts', 'Agency')
    WorkerProfile = apps.get_model('accounts', 'WorkerProfile')
    
    for account in Accounts.objects.all():
        # Check if account is admin/staff
        if account.is_staff or account.is_superuser:
            account.accountType = 'ADMIN'
        # Check if account has an agency
        elif Agency.objects.filter(accountFK=account).exists():
            account.accountType = 'AGENCY'
        # Check if account has a profile
        elif Profile.objects.filter(accountFK=account).exists():
            profile = Profile.objects.get(accountFK=account)
            # Check if profile has worker profile
            if WorkerProfile.objects.filter(profileID=profile).exists():
                account.accountType = 'WORKER'
            else:
                account.accountType = 'CLIENT'
        else:
            # Default to CLIENT for accounts without profiles
            account.accountType = 'CLIENT'
        
        account.save(update_fields=['accountType'])
    
    print(f"✅ Populated accountType for {Accounts.objects.count()} accounts")


def reverse_populate(apps, schema_editor):
    """
    Reverse migration - set all accountTypes to null
    """
    Accounts = apps.get_model('accounts', 'Accounts')
    Accounts.objects.all().update(accountType=None)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0030_merge_20251110_0447'),
    ]

    operations = [
        migrations.AddField(
            model_name='accounts',
            name='accountType',
            field=models.CharField(
                blank=True,
                choices=[
                    ('WORKER', 'Worker'),
                    ('CLIENT', 'Client'),
                    ('AGENCY', 'Agency'),
                    ('ADMIN', 'Admin')
                ],
                help_text='Type of account: WORKER, CLIENT, AGENCY, or ADMIN',
                max_length=10,
                null=True
            ),
        ),
        migrations.RunPython(populate_account_types, reverse_populate),
    ]
