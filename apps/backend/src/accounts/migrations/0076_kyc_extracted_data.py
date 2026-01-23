# Generated migration for KYC Extracted Data model
# This model stores structured fields extracted from KYC documents via AI/OCR

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0075_team_worker_arrival_tracking'),
    ]

    operations = [
        migrations.CreateModel(
            name='KYCExtractedData',
            fields=[
                ('extractedDataID', models.BigAutoField(primary_key=True, serialize=False)),
                
                # Extracted fields (from OCR/AI)
                ('extracted_full_name', models.CharField(blank=True, default='', help_text='Full name extracted from ID document', max_length=255)),
                ('extracted_first_name', models.CharField(blank=True, default='', help_text='First name parsed from full name', max_length=100)),
                ('extracted_middle_name', models.CharField(blank=True, default='', help_text='Middle name parsed from full name', max_length=100)),
                ('extracted_last_name', models.CharField(blank=True, default='', help_text='Last name parsed from full name', max_length=100)),
                ('extracted_birth_date', models.DateField(blank=True, help_text='Birth date extracted from ID', null=True)),
                ('extracted_address', models.TextField(blank=True, default='', help_text='Address extracted from ID')),
                ('extracted_id_number', models.CharField(blank=True, default='', help_text='ID/Document number extracted', max_length=100)),
                ('extracted_id_type', models.CharField(blank=True, default='', help_text='Type of ID detected (PASSPORT, NATIONALID, etc.)', max_length=50)),
                ('extracted_expiry_date', models.DateField(blank=True, help_text='Document expiry date if present', null=True)),
                ('extracted_nationality', models.CharField(blank=True, default='', help_text='Nationality/citizenship extracted', max_length=100)),
                ('extracted_sex', models.CharField(blank=True, default='', help_text='Sex/gender extracted from ID', max_length=20)),
                
                # Confidence scores
                ('confidence_full_name', models.FloatField(blank=True, help_text='Confidence score for full name extraction (0-1)', null=True)),
                ('confidence_birth_date', models.FloatField(blank=True, help_text='Confidence score for birth date extraction (0-1)', null=True)),
                ('confidence_address', models.FloatField(blank=True, help_text='Confidence score for address extraction (0-1)', null=True)),
                ('confidence_id_number', models.FloatField(blank=True, help_text='Confidence score for ID number extraction (0-1)', null=True)),
                ('overall_confidence', models.FloatField(blank=True, help_text='Overall extraction confidence (0-1)', null=True)),
                
                # User-confirmed fields
                ('confirmed_full_name', models.CharField(blank=True, default='', help_text='Full name confirmed/edited by user', max_length=255)),
                ('confirmed_first_name', models.CharField(blank=True, default='', help_text='First name confirmed by user', max_length=100)),
                ('confirmed_middle_name', models.CharField(blank=True, default='', help_text='Middle name confirmed by user', max_length=100)),
                ('confirmed_last_name', models.CharField(blank=True, default='', help_text='Last name confirmed by user', max_length=100)),
                ('confirmed_birth_date', models.DateField(blank=True, help_text='Birth date confirmed by user', null=True)),
                ('confirmed_address', models.TextField(blank=True, default='', help_text='Address confirmed by user')),
                ('confirmed_id_number', models.CharField(blank=True, default='', help_text='ID number confirmed by user', max_length=100)),
                
                # Status & metadata
                ('extraction_status', models.CharField(
                    choices=[
                        ('PENDING', 'Pending Extraction'),
                        ('EXTRACTED', 'Data Extracted (Awaiting Confirmation)'),
                        ('CONFIRMED', 'User Confirmed'),
                        ('FAILED', 'Extraction Failed')
                    ],
                    default='PENDING',
                    help_text='Current status of data extraction/confirmation',
                    max_length=20
                )),
                ('extraction_source', models.CharField(blank=True, default='', help_text="Source of extraction (e.g., 'Tesseract OCR v4.1')", max_length=100)),
                ('user_edited_fields', models.JSONField(blank=True, default=list, help_text='List of field names that user edited from extracted values')),
                ('confirmed_at', models.DateTimeField(blank=True, help_text='When user confirmed the extracted data', null=True)),
                ('extracted_at', models.DateTimeField(blank=True, help_text='When AI extraction was completed', null=True)),
                ('raw_extraction_data', models.JSONField(blank=True, default=dict, help_text='Full raw extraction output for debugging')),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                
                # Foreign key
                ('kycID', models.OneToOneField(
                    help_text='Parent KYC record',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='extracted_data',
                    to='accounts.kyc'
                )),
            ],
            options={
                'verbose_name': 'KYC Extracted Data',
                'verbose_name_plural': 'KYC Extracted Data',
                'db_table': 'kyc_extracted_data',
            },
        ),
        migrations.AddIndex(
            model_name='kycextracteddata',
            index=models.Index(fields=['extraction_status'], name='kyc_extract_extract_status_idx'),
        ),
        migrations.AddIndex(
            model_name='kycextracteddata',
            index=models.Index(fields=['kycID', 'extraction_status'], name='kyc_extract_kyc_status_idx'),
        ),
    ]
