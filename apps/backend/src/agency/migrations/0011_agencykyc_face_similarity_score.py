from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('agency', '0010_add_rep_selfie_filetype'),
    ]

    operations = [
        migrations.AddField(
            model_name='agencykyc',
            name='face_similarity_score',
            field=models.FloatField(
                null=True,
                blank=True,
                help_text='Face similarity score between rep selfie and ID front (0\u20131), computed at submission',
            ),
        ),
    ]
