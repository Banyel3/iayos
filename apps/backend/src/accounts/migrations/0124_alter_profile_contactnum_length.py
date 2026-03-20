from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0123_merge_primary_skill_branch"),
    ]

    operations = [
        migrations.AlterField(
            model_name="profile",
            name="contactNum",
            field=models.CharField(blank=True, max_length=15, null=True),
        ),
    ]
