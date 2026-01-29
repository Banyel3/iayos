# Manual migration to enable auto-approve KYC by default

from django.db import migrations


def enable_auto_approve(apps, schema_editor):
    """Set autoApproveKYC to True for all PlatformSettings records."""
    PlatformSettings = apps.get_model('adminpanel', 'PlatformSettings')
    PlatformSettings.objects.all().update(autoApproveKYC=True)
    print("✅ Enabled autoApproveKYC for all PlatformSettings records")


def disable_auto_approve(apps, schema_editor):
    """Reverse migration - set autoApproveKYC back to False."""
    PlatformSettings = apps.get_model('adminpanel', 'PlatformSettings')
    PlatformSettings.objects.all().update(autoApproveKYC=False)
    print("⬅️ Disabled autoApproveKYC for all PlatformSettings records")


class Migration(migrations.Migration):

    dependencies = [
        ('adminpanel', '0011_kyc_auto_approval_thresholds'),
    ]

    operations = [
        migrations.RunPython(enable_auto_approve, reverse_code=disable_auto_approve),
    ]
