"""
Data migration: backfill revieweeAgencyID for existing agency job reviews.

Problem: The mobile review submission (`mobile_services.py`) never set
`revieweeAgencyID` when creating reviews for agency-assigned jobs, leaving
the field NULL on all historical reviews. This caused the agency reviews
page to always return 0.

Fix: For every JobReview where revieweeAgencyID is NULL but the job has an
assignedAgencyFK, copy that agency FK to the review.
"""
from django.db import migrations


def backfill_agency_reviews(apps, schema_editor):
    JobReview = apps.get_model('accounts', 'JobReview')
    db_alias = schema_editor.connection.alias

    reviews_to_fix = (
        JobReview.objects.using(db_alias)
        .filter(revieweeAgencyID__isnull=True, jobID__assignedAgencyFK__isnull=False)
        .select_related('jobID')
    )

    count = 0
    for review in reviews_to_fix:
        review.revieweeAgencyID = review.jobID.assignedAgencyFK
        review.save(using=db_alias, update_fields=['revieweeAgencyID'])
        count += 1

    print(f"\n[0096_backfill_agency_reviews] Fixed {count} review(s) with NULL revieweeAgencyID.")


def reverse_backfill_agency_reviews(apps, schema_editor):
    # No safe way to reverse — we don't know which NULLs were intentional.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0095_jobreview_agency_response'),
    ]

    operations = [
        migrations.RunPython(
            backfill_agency_reviews,
            reverse_backfill_agency_reviews,
        ),
    ]
