# Generated manually for WorkerMaterial category field

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0070_kyc_notes_to_textfield'),
    ]

    operations = [
        # Add categoryID foreign key to WorkerMaterial
        migrations.AddField(
            model_name='workermaterial',
            name='categoryID',
            field=models.ForeignKey(
                blank=True,
                help_text='The category/specialization this material is for (e.g., Plumbing, Electrical). Optional.',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='materials',
                to='accounts.specializations',
            ),
        ),
        # Add index for efficient category filtering
        migrations.AddIndex(
            model_name='workermaterial',
            index=models.Index(fields=['workerID', 'categoryID'], name='worker_mate_workerI_category_idx'),
        ),
    ]
