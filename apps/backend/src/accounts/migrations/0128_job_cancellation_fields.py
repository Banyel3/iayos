from decimal import Decimal

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0127_jobemployeeassignment_early_completion"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="cancelledAt",
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text="Timestamp when job was cancelled",
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="cancelledByRole",
            field=models.CharField(
                blank=True,
                max_length=20,
                null=True,
                help_text="Role of the actor who cancelled (CLIENT/WORKER/ADMIN)",
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="cancelledByAccountID",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="cancelled_jobs",
                to="accounts.accounts",
                help_text="Account that performed the cancellation",
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="cancellationStage",
            field=models.CharField(
                blank=True,
                max_length=50,
                null=True,
                help_text="Stage at which the job was cancelled (e.g. BEFORE_START, AFTER_WORKER_MARKED_DONE)",
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="clientRefundAmount",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                max_digits=10,
                null=True,
                help_text="Amount refunded to client on cancellation",
            ),
        ),
        migrations.AddField(
            model_name="job",
            name="workerCompensationAmount",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                max_digits=10,
                null=True,
                help_text="Amount paid to worker on cancellation",
            ),
        ),
    ]
