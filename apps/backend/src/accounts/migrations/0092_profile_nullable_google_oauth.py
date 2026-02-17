"""
Migration: Make Profile.contactNum and Profile.birthDate nullable
Reason: Google OAuth users don't provide these fields during signup.
They will complete their profile after first login.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0091_jobemployeeassignment_project_workflow'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='contactNum',
            field=models.CharField(blank=True, max_length=11, null=True),
        ),
        migrations.AlterField(
            model_name='profile',
            name='birthDate',
            field=models.DateField(blank=True, null=True),
        ),
    ]
