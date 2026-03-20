from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0127_specializations_created_by_worker"),
        ("accounts", "0129_backfill_shift_and_start_date"),
    ]

    operations = []
