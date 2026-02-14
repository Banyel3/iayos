# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("agency", "0006_add_agency_kyc_extracted_data"),
    ]

    operations = [
        migrations.AlterField(
            model_name="agencykycfile",
            name="fileType",
            field=models.CharField(
                blank=True,
                choices=[
                    ("BUSINESS_PERMIT", "business_permit"),
                    ("REP_ID_FRONT", "rep_id_front"),
                    ("REP_ID_BACK", "rep_id_back"),
                    ("REP_SELFIE", "rep_selfie"),
                    ("ADDRESS_PROOF", "address_proof"),
                    ("AUTH_LETTER", "authorization_letter"),
                ],
                max_length=30,
                null=True,
            ),
        ),
    ]
