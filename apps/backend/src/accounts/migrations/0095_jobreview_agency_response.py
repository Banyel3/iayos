from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0094_merge_materials_and_employee_approval'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobreview',
            name='agency_response',
            field=models.TextField(
                null=True,
                blank=True,
                help_text='Response from the agency or reviewee to this review',
            ),
        ),
        migrations.AddField(
            model_name='jobreview',
            name='agency_response_at',
            field=models.DateTimeField(
                null=True,
                blank=True,
                help_text='Timestamp when the response was submitted',
            ),
        ),
    ]
