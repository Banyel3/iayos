# Generated migration for Agency KYC Extracted Data model
# Creates AgencyKYCExtractedData table for storing structured OCR extraction results

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('agency', '0005_agencykycfile_ai_verification_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='AgencyKYCExtractedData',
            fields=[
                ('extractedDataID', models.BigAutoField(primary_key=True, serialize=False)),
                
                # Business Information (from Business Permit)
                ('extracted_business_name', models.CharField(blank=True, default='', help_text='Business name extracted from permit', max_length=255)),
                ('extracted_business_type', models.CharField(blank=True, default='', help_text='Type of business (e.g., Sole Proprietorship, Corporation)', max_length=100)),
                ('extracted_business_address', models.TextField(blank=True, default='', help_text='Business address extracted from permit')),
                ('extracted_permit_number', models.CharField(blank=True, default='', help_text='Business permit number', max_length=100)),
                ('extracted_permit_issue_date', models.DateField(blank=True, help_text='Permit issue date', null=True)),
                ('extracted_permit_expiry_date', models.DateField(blank=True, help_text='Permit expiry date', null=True)),
                ('extracted_dti_number', models.CharField(blank=True, default='', help_text='DTI registration number if present', max_length=100)),
                ('extracted_sec_number', models.CharField(blank=True, default='', help_text='SEC registration number if corporation', max_length=100)),
                ('extracted_tin', models.CharField(blank=True, default='', help_text='Tax Identification Number (TIN)', max_length=50)),
                
                # Representative Information (from Rep ID)
                ('extracted_rep_full_name', models.CharField(blank=True, default='', help_text="Representative's full name from ID", max_length=255)),
                ('extracted_rep_id_number', models.CharField(blank=True, default='', help_text="Representative's ID number", max_length=100)),
                ('extracted_rep_id_type', models.CharField(blank=True, default='', help_text="Type of representative's ID", max_length=50)),
                ('extracted_rep_birth_date', models.DateField(blank=True, help_text="Representative's birth date", null=True)),
                ('extracted_rep_address', models.TextField(blank=True, default='', help_text="Representative's address from ID")),
                
                # Confirmed Fields (user-edited values)
                ('confirmed_business_name', models.CharField(blank=True, default='', help_text='User-confirmed business name', max_length=255)),
                ('confirmed_business_type', models.CharField(blank=True, default='', max_length=100)),
                ('confirmed_business_address', models.TextField(blank=True, default='')),
                ('confirmed_permit_number', models.CharField(blank=True, default='', max_length=100)),
                ('confirmed_permit_issue_date', models.DateField(blank=True, null=True)),
                ('confirmed_permit_expiry_date', models.DateField(blank=True, null=True)),
                ('confirmed_dti_number', models.CharField(blank=True, default='', max_length=100)),
                ('confirmed_sec_number', models.CharField(blank=True, default='', max_length=100)),
                ('confirmed_tin', models.CharField(blank=True, default='', max_length=50)),
                ('confirmed_rep_full_name', models.CharField(blank=True, default='', max_length=255)),
                ('confirmed_rep_id_number', models.CharField(blank=True, default='', max_length=100)),
                ('confirmed_rep_birth_date', models.DateField(blank=True, null=True)),
                ('confirmed_rep_address', models.TextField(blank=True, default='')),
                
                # Confidence Scores (0.0 to 1.0)
                ('confidence_business_name', models.FloatField(default=0.0, help_text='Confidence in extracted business name')),
                ('confidence_business_address', models.FloatField(default=0.0, help_text='Confidence in extracted business address')),
                ('confidence_permit_number', models.FloatField(default=0.0, help_text='Confidence in extracted permit number')),
                ('confidence_rep_name', models.FloatField(default=0.0, help_text='Confidence in extracted representative name')),
                ('overall_confidence', models.FloatField(default=0.0, help_text='Overall extraction confidence score')),
                
                # Metadata
                ('extraction_status', models.CharField(
                    choices=[
                        ('PENDING', 'Pending Extraction'),
                        ('EXTRACTED', 'Data Extracted'),
                        ('CONFIRMED', 'User Confirmed'),
                        ('FAILED', 'Extraction Failed'),
                    ],
                    default='PENDING',
                    help_text='Current status of extraction process',
                    max_length=20,
                )),
                ('extraction_source', models.CharField(default='Tesseract OCR', help_text='Source of extraction (OCR engine used)', max_length=100)),
                ('extracted_at', models.DateTimeField(blank=True, help_text='When extraction completed', null=True)),
                ('confirmed_at', models.DateTimeField(blank=True, help_text='When user confirmed the data', null=True)),
                ('user_edited_fields', models.JSONField(blank=True, default=list, help_text='List of field names that user edited')),
                ('raw_extraction_data', models.JSONField(blank=True, default=dict, help_text='Raw extraction output for debugging')),
                
                # Timestamps
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                
                # Foreign Key
                ('agencyKyc', models.OneToOneField(
                    help_text='Parent AgencyKYC record',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='extracted_data',
                    to='agency.agencykyc',
                )),
            ],
            options={
                'verbose_name': 'Agency KYC Extracted Data',
                'verbose_name_plural': 'Agency KYC Extracted Data',
                'db_table': 'agency_kyc_extracted_data',
            },
        ),
    ]
