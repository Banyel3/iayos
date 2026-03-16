from django.db import migrations, models


def set_existing_workers_available(apps, schema_editor):
    WorkerProfile = apps.get_model("accounts", "WorkerProfile")
    WorkerProfile.objects.filter(availability_status="OFFLINE").update(availability_status="AVAILABLE")


def noop_reverse(apps, schema_editor):
    # Intentionally no-op: do not flip workers back to OFFLINE on rollback.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0112_userpaymentmethod_add_mastercard"),
    ]

    operations = [
        migrations.AlterField(
            model_name="workerprofile",
            name="availability_status",
            field=models.CharField(
                blank=True,
                choices=[("AVAILABLE", "available"), ("BUSY", "busy"), ("OFFLINE", "offline")],
                default="AVAILABLE",
                max_length=10,
            ),
        ),
        migrations.RunPython(set_existing_workers_available, noop_reverse),
    ]
