from django.db import migrations, models
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0043_workermaterial"),
    ]

    operations = [
        migrations.AddField(
            model_name="workermaterial",
            name="quantity",
            field=models.DecimalField(
                max_digits=10,
                decimal_places=2,
                default=Decimal("1.00"),
                help_text="Quantity or stock count associated with the price",
            ),
        ),
    ]
