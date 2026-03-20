import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0118_jobskillslot_agency_invite_fields"),
    ]

    operations = [
        # 1. Add negotiation_count to JobApplication
        migrations.AddField(
            model_name="jobapplication",
            name="negotiation_count",
            field=models.PositiveSmallIntegerField(
                default=0,
                help_text="Number of price proposals the worker has submitted (max 3)",
            ),
        ),
        # 2. Create PriceNegotiation model
        migrations.CreateModel(
            name="PriceNegotiation",
            fields=[
                (
                    "negotiationID",
                    models.BigAutoField(primary_key=True, serialize=False),
                ),
                (
                    "application",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="price_negotiations",
                        to="accounts.jobapplication",
                    ),
                ),
                (
                    "actor",
                    models.CharField(
                        choices=[("WORKER", "Worker"), ("CLIENT", "Client")],
                        max_length=10,
                    ),
                ),
                (
                    "round_number",
                    models.PositiveSmallIntegerField(
                        default=0,
                        help_text="Worker proposal round (1-3). 0 for client counter-offers.",
                    ),
                ),
                (
                    "proposed_budget",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=10,
                        help_text="Total proposed budget (PROJECT) or daily_rate × days (DAILY)",
                    ),
                ),
                (
                    "proposed_daily_rate",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Proposed daily rate (DAILY jobs only)",
                        max_digits=10,
                        null=True,
                    ),
                ),
                (
                    "proposed_days",
                    models.PositiveIntegerField(
                        blank=True,
                        help_text="Proposed number of working days (DAILY jobs only)",
                        null=True,
                    ),
                ),
                (
                    "message",
                    models.TextField(
                        blank=True,
                        default="",
                        help_text="Message accompanying the proposal/counter",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending response"),
                            ("ACCEPTED", "Accepted"),
                            (
                                "REJECTED",
                                "Rejected (price only — worker can re-propose)",
                            ),
                            ("COUNTERED", "Client issued a counter-offer"),
                            ("SUPERSEDED", "Superseded by a newer proposal"),
                        ],
                        default="PENDING",
                        max_length=15,
                    ),
                ),
                ("createdAt", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "price_negotiations",
                "ordering": ["createdAt"],
            },
        ),
        migrations.AddIndex(
            model_name="pricenegotiation",
            index=models.Index(
                fields=["application", "createdAt"],
                name="price_negot_applica_idx",
            ),
        ),
    ]
