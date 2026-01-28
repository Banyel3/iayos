# Generated migration for Agency KYC AI verification fields
# Adds 15 AI fields to AgencyKycFile model to match kycFiles AI capabilities

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('agency', '0004_kyc_enhancements'),
    ]

    operations = [
        # Add AI Verification Status enum field
        migrations.AddField(
            model_name='agencykycfile',
            name='ai_verification_status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'Pending Verification'),
                    ('PASSED', 'AI Verification Passed'),
                    ('FAILED', 'AI Verification Failed'),
                    ('WARNING', 'Needs Manual Review'),
                    ('SKIPPED', 'Verification Skipped'),
                ],
                default='PENDING',
                help_text='Result of automated AI verification',
                max_length=20,
            ),
        ),
        # Face detection fields
        migrations.AddField(
            model_name='agencykycfile',
            name='face_detected',
            field=models.BooleanField(blank=True, help_text='Face detected in document', null=True),
        ),
        migrations.AddField(
            model_name='agencykycfile',
            name='face_count',
            field=models.IntegerField(blank=True, help_text='Number of faces detected', null=True),
        ),
        migrations.AddField(
            model_name='agencykycfile',
            name='face_confidence',
            field=models.FloatField(blank=True, help_text='Face detection confidence (0-1)', null=True),
        ),
        # OCR fields
        migrations.AddField(
            model_name='agencykycfile',
            name='ocr_text',
            field=models.TextField(blank=True, help_text='Extracted text via OCR', null=True),
        ),
        migrations.AddField(
            model_name='agencykycfile',
            name='ocr_confidence',
            field=models.FloatField(blank=True, help_text='OCR confidence (0-1)', null=True),
        ),
        # Quality score
        migrations.AddField(
            model_name='agencykycfile',
            name='quality_score',
            field=models.FloatField(blank=True, help_text='Image quality score (0-1)', null=True),
        ),
        # AI overall confidence
        migrations.AddField(
            model_name='agencykycfile',
            name='ai_confidence_score',
            field=models.FloatField(blank=True, help_text='Overall AI confidence (0-1)', null=True),
        ),
        # AI rejection fields
        migrations.AddField(
            model_name='agencykycfile',
            name='ai_rejection_reason',
            field=models.CharField(
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
                help_text='Reason for AI rejection',
                max_length=50,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='agencykycfile',
            name='ai_rejection_message',
            field=models.CharField(blank=True, help_text='User-facing rejection message', max_length=500, null=True),
        ),
        # AI warnings and details
        migrations.AddField(
            model_name='agencykycfile',
            name='ai_warnings',
            field=models.JSONField(blank=True, default=list, help_text='Warnings from AI', null=True),
        ),
        migrations.AddField(
            model_name='agencykycfile',
            name='ai_details',
            field=models.JSONField(blank=True, default=dict, help_text='Full AI verification details', null=True),
        ),
        # Verification timestamp
        migrations.AddField(
            model_name='agencykycfile',
            name='verified_at',
            field=models.DateTimeField(blank=True, help_text='When AI verification completed', null=True),
        ),
        # Add index for AI status queries
        migrations.AddIndex(
            model_name='agencykycfile',
            index=models.Index(fields=['ai_verification_status'], name='agency_kyc_ai_status_idx'),
        ),
    ]
