# Generated migration for KYC clearance fields
# Adds NBI/Police clearance tracking and place_of_birth to KYCExtractedData

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0077_withdrawal_admin_reference_number'),
    ]

    operations = [
        # ============================================================
        # EXTRACTED FIELDS
        # ============================================================
        migrations.AddField(
            model_name='kycextracteddata',
            name='extracted_place_of_birth',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Place of birth extracted from ID',
                max_length=255
            ),
        ),
        migrations.AddField(
            model_name='kycextracteddata',
            name='extracted_clearance_number',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Clearance number extracted from NBI/Police clearance',
                max_length=100
            ),
        ),
        migrations.AddField(
            model_name='kycextracteddata',
            name='extracted_clearance_type',
            field=models.CharField(
                choices=[('NBI', 'NBI Clearance'), ('POLICE', 'Police Clearance'), ('NONE', 'Not a Clearance Document')],
                default='NONE',
                help_text='Type of clearance document (NBI or Police)',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='kycextracteddata',
            name='extracted_clearance_issue_date',
            field=models.DateField(
                blank=True,
                help_text='Issue date extracted from clearance document',
                null=True
            ),
        ),
        migrations.AddField(
            model_name='kycextracteddata',
            name='extracted_clearance_validity_date',
            field=models.DateField(
                blank=True,
                help_text='Validity/expiry date extracted from clearance document',
                null=True
            ),
        ),
        
        # ============================================================
        # CONFIDENCE SCORES
        # ============================================================
        migrations.AddField(
            model_name='kycextracteddata',
            name='confidence_place_of_birth',
            field=models.FloatField(
                blank=True,
                help_text='Confidence score for place of birth extraction (0-1)',
                null=True
            ),
        ),
        migrations.AddField(
            model_name='kycextracteddata',
            name='confidence_clearance_number',
            field=models.FloatField(
                blank=True,
                help_text='Confidence score for clearance number extraction (0-1)',
                null=True
            ),
        ),
        
        # ============================================================
        # CONFIRMED FIELDS
        # ============================================================
        migrations.AddField(
            model_name='kycextracteddata',
            name='confirmed_nationality',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Nationality confirmed by user',
                max_length=100
            ),
        ),
        migrations.AddField(
            model_name='kycextracteddata',
            name='confirmed_sex',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Sex/gender confirmed by user',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='kycextracteddata',
            name='confirmed_place_of_birth',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Place of birth confirmed by user',
                max_length=255
            ),
        ),
        migrations.AddField(
            model_name='kycextracteddata',
            name='confirmed_clearance_number',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Clearance number confirmed by user',
                max_length=100
            ),
        ),
        migrations.AddField(
            model_name='kycextracteddata',
            name='confirmed_clearance_type',
            field=models.CharField(
                choices=[('NBI', 'NBI Clearance'), ('POLICE', 'Police Clearance'), ('NONE', 'Not a Clearance Document')],
                default='NONE',
                help_text='Type of clearance confirmed by user',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='kycextracteddata',
            name='confirmed_clearance_issue_date',
            field=models.DateField(
                blank=True,
                help_text='Clearance issue date confirmed by user',
                null=True
            ),
        ),
        migrations.AddField(
            model_name='kycextracteddata',
            name='confirmed_clearance_validity_date',
            field=models.DateField(
                blank=True,
                help_text='Clearance validity date confirmed by user',
                null=True
            ),
        ),
    ]
