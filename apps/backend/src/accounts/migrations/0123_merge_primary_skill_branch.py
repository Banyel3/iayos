from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0122_remove_legacy_primary_skill_constraint"),
        ("accounts", "0115_workerspecialization_multi_primary_and_order"),
    ]

    operations = []
