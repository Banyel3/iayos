# Generated manually for KYC auto-approval threshold settings

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adminpanel', '0010_rename_certificati_certifi_idx_certificati_certifi_eead3c_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='platformsettings',
            name='kycAutoApproveMinConfidence',
            field=models.DecimalField(
                decimal_places=2,
                default=0.90,
                help_text='Minimum overall confidence score (0-1) for auto-approval',
                max_digits=3
            ),
        ),
        migrations.AddField(
            model_name='platformsettings',
            name='kycFaceMatchMinSimilarity',
            field=models.DecimalField(
                decimal_places=2,
                default=0.85,
                help_text='Minimum face match similarity (0-1) for auto-approval',
                max_digits=3
            ),
        ),
        migrations.AddField(
            model_name='platformsettings',
            name='kycRequireUserConfirmation',
            field=models.BooleanField(
                default=True,
                help_text='Require user to confirm extracted data before auto-approval'
            ),
        ),
        migrations.AlterField(
            model_name='platformsettings',
            name='autoApproveKYC',
            field=models.BooleanField(
                default=False,
                help_text='Automatically approve KYC submissions based on AI confidence'
            ),
        ),
    ]
