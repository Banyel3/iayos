from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0092_profile_nullable_google_oauth'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobemployeeassignment',
            name='paymentAmount',
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=12, null=True,
                help_text='Per-employee share of the remaining project payment',
            ),
        ),
        migrations.AddField(
            model_name='jobemployeeassignment',
            name='clientApproved',
            field=models.BooleanField(
                default=False,
                help_text="Client has approved this employee's work and paid their share",
            ),
        ),
        migrations.AddField(
            model_name='jobemployeeassignment',
            name='clientApprovedAt',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
