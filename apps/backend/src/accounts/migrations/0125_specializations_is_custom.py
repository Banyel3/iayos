from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0124_alter_profile_contactnum_length'),
    ]

    operations = [
        migrations.AddField(
            model_name='specializations',
            name='is_custom',
            field=models.BooleanField(
                default=False,
                help_text='True when created by a worker or agency (not admin-seeded)',
            ),
        ),
    ]
