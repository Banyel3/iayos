# Generated manually for agency materials support

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0081_job_materials_workflow'),
    ]

    operations = [
        # 1. Make workerID nullable (materials can belong to agency instead)
        migrations.AlterField(
            model_name='workermaterial',
            name='workerID',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='materials',
                to='accounts.workerprofile',
            ),
        ),

        # 2. Add agencyID FK to WorkerMaterial
        migrations.AddField(
            model_name='workermaterial',
            name='agencyID',
            field=models.ForeignKey(
                blank=True,
                help_text='Agency that owns this material (alternative to workerID)',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='materials',
                to='accounts.agency',
            ),
        ),

        # 3. Add indexes for agency queries
        migrations.AddIndex(
            model_name='workermaterial',
            index=models.Index(
                fields=['agencyID', 'is_available'],
                name='accounts_wo_agencyI_idx_avail',
            ),
        ),
        migrations.AddIndex(
            model_name='workermaterial',
            index=models.Index(
                fields=['agencyID', 'categoryID'],
                name='accounts_wo_agencyI_idx_cat',
            ),
        ),
    ]
