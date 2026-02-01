# Generated migration for increasing MessageAttachment.fileURL length

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0008_remove_conversation_conv_type_status_idx_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='messageattachment',
            name='fileURL',
            field=models.CharField(max_length=1024),
        ),
    ]
