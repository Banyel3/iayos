from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        (
            "adminpanel",
            "0015_rename_support_ticket_platform_idx_adminpanel__platfor_2e4fb5_idx_and_more",
        ),
    ]

    operations = [
        migrations.CreateModel(
            name="ContentModerationTerm",
            fields=[
                ("termID", models.BigAutoField(primary_key=True, serialize=False)),
                ("term", models.CharField(max_length=120)),
                ("normalizedTerm", models.CharField(max_length=120, unique=True)),
                ("isActive", models.BooleanField(default=True)),
                ("createdAt", models.DateTimeField(auto_now_add=True)),
                ("updatedAt", models.DateTimeField(auto_now=True)),
                (
                    "createdBy",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_content_moderation_terms",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "updatedBy",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_content_moderation_terms",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-updatedAt"],
            },
        ),
        migrations.AddIndex(
            model_name="contentmoderationterm",
            index=models.Index(
                fields=["isActive"], name="adminpanel_c_isActi_7ae2c8_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="contentmoderationterm",
            index=models.Index(
                fields=["normalizedTerm"], name="adminpanel_c_normali_7c9f43_idx"
            ),
        ),
    ]
