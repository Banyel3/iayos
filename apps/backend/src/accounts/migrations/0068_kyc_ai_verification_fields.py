# Generated manually for KYC Document Verification AI Fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0067_job_universal_fields'),
    ]

    operations = [
        # Add AI verification fields to kycFiles model
        migrations.AddField(
            model_name='kycfiles',
            name='ai_verification_status',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('PENDING', 'Pending Verification'),
                    ('PASSED', 'AI Verification Passed'),
                    ('FAILED', 'AI Verification Failed'),
                    ('WARNING', 'Needs Manual Review'),
                    ('SKIPPED', 'Verification Skipped'),
                ],
                default='PENDING',
                help_text='Result of automated AI verification'
            ),
        ),
        migrations.AddField(
            model_name='kycfiles',
            name='face_detected',
            field=models.BooleanField(
                null=True,
                blank=True,
                help_text='Whether a face was detected in the document (for IDs)'
            ),
        ),
        migrations.AddField(
            model_name='kycfiles',
            name='face_count',
            field=models.IntegerField(
                null=True,
                blank=True,
                help_text='Number of faces detected in the document'
            ),
        ),
        migrations.AddField(
            model_name='kycfiles',
            name='face_confidence',
            field=models.FloatField(
                null=True,
                blank=True,
                help_text='Confidence score of face detection (0.0-1.0)'
            ),
        ),
        migrations.AddField(
            model_name='kycfiles',
            name='ocr_text',
            field=models.TextField(
                null=True,
                blank=True,
                help_text='Extracted text from document via OCR (truncated)'
            ),
        ),
        migrations.AddField(
            model_name='kycfiles',
            name='ocr_confidence',
            field=models.FloatField(
                null=True,
                blank=True,
                help_text='OCR extraction confidence score (0.0-1.0)'
            ),
        ),
        migrations.AddField(
            model_name='kycfiles',
            name='quality_score',
            field=models.FloatField(
                null=True,
                blank=True,
                help_text='Image quality score (0.0-1.0)'
            ),
        ),
        migrations.AddField(
            model_name='kycfiles',
            name='ai_confidence_score',
            field=models.FloatField(
                null=True,
                blank=True,
                help_text='Overall AI verification confidence (0.0-1.0)'
            ),
        ),
        migrations.AddField(
            model_name='kycfiles',
            name='ai_rejection_reason',
            field=models.CharField(
                max_length=50,
                null=True,
                blank=True,
                choices=[
                    ('NO_FACE_DETECTED', 'No Face Detected'),
                    ('MULTIPLE_FACES', 'Multiple Faces'),
                    ('FACE_TOO_SMALL', 'Face Too Small'),
                    ('MISSING_REQUIRED_TEXT', 'Missing Required Text'),
                    ('IMAGE_TOO_BLURRY', 'Image Too Blurry'),
                    ('RESOLUTION_TOO_LOW', 'Resolution Too Low'),
                    ('INVALID_ORIENTATION', 'Invalid Orientation'),
                    ('UNREADABLE_DOCUMENT', 'Unreadable Document'),
                ],
                help_text='Reason for AI rejection (if applicable)'
            ),
        ),
        migrations.AddField(
            model_name='kycfiles',
            name='ai_rejection_message',
            field=models.CharField(
                max_length=500,
                null=True,
                blank=True,
                help_text='Human-readable rejection message for the user'
            ),
        ),
        migrations.AddField(
            model_name='kycfiles',
            name='ai_warnings',
            field=models.JSONField(
                null=True,
                blank=True,
                default=list,
                help_text='List of warnings from AI verification'
            ),
        ),
        migrations.AddField(
            model_name='kycfiles',
            name='ai_details',
            field=models.JSONField(
                null=True,
                blank=True,
                default=dict,
                help_text='Detailed AI verification results (JSON)'
            ),
        ),
        migrations.AddField(
            model_name='kycfiles',
            name='verified_at',
            field=models.DateTimeField(
                null=True,
                blank=True,
                help_text='When the AI verification was completed'
            ),
        ),
        # Add index for filtering by AI status
        migrations.AddIndex(
            model_name='kycfiles',
            index=models.Index(
                fields=['ai_verification_status'],
                name='kyc_ai_verification_status_idx'
            ),
        ),
    ]
