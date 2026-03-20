"""
Data migration 0129: Backfill shift_type on all jobs where it is null or blank.

Rules:
- PROJECT jobs: set shift_type = "ANY" (non-breaking default).
- DAILY jobs with null/blank shift_type: set shift_type = "ANY" (worker will pick at apply time).
- Does NOT touch existing non-null shift_type values.
- Does NOT overwrite existing preferredStartDate values.
"""

from django.db import migrations


def backfill_shift_type(apps, schema_editor):
    Job = apps.get_model("accounts", "Job")

    # All jobs where shift_type is null or empty string
    qs = Job.objects.filter(shift_type__in=[None, ""])
    count = qs.update(shift_type="ANY")
    print(f"[0129] Backfilled shift_type='ANY' on {count} job(s).")


def reverse_backfill(apps, schema_editor):
    # Non-reversible — we cannot know which rows were null vs "ANY" before
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0128_job_cancellation_fields"),
    ]

    operations = [
        migrations.RunPython(backfill_shift_type, reverse_backfill),
    ]
