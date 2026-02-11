# Generated migration for AgencyEmployee name breakdown and multi-specializations

from django.db import migrations, models
import json


def migrate_name_to_parts(apps, schema_editor):
    """Split existing 'name' field into firstName, middleName, lastName."""
    AgencyEmployee = apps.get_model('agency', 'AgencyEmployee')
    for emp in AgencyEmployee.objects.all():
        if emp.name:
            parts = emp.name.strip().split()
            if len(parts) == 1:
                emp.firstName = parts[0]
                emp.lastName = ""
            elif len(parts) == 2:
                emp.firstName = parts[0]
                emp.lastName = parts[1]
            else:
                # First is firstName, last is lastName, middle is everything in between
                emp.firstName = parts[0]
                emp.lastName = parts[-1]
                emp.middleName = " ".join(parts[1:-1])
            emp.save()


def migrate_role_to_specializations(apps, schema_editor):
    """Convert single role string to JSON array specializations."""
    AgencyEmployee = apps.get_model('agency', 'AgencyEmployee')
    for emp in AgencyEmployee.objects.all():
        if emp.role and emp.role.strip():
            # Store as JSON array with single role
            emp.specializations = json.dumps([emp.role.strip()])
        else:
            emp.specializations = json.dumps([])
        emp.save()


def reverse_name_parts(apps, schema_editor):
    """Combine name parts back to single 'name' field."""
    AgencyEmployee = apps.get_model('agency', 'AgencyEmployee')
    for emp in AgencyEmployee.objects.all():
        parts = [emp.firstName or ""]
        if emp.middleName:
            parts.append(emp.middleName)
        if emp.lastName:
            parts.append(emp.lastName)
        emp.name = " ".join(filter(None, parts))
        emp.save()


def reverse_specializations_to_role(apps, schema_editor):
    """Convert JSON array back to single role string."""
    AgencyEmployee = apps.get_model('agency', 'AgencyEmployee')
    for emp in AgencyEmployee.objects.all():
        try:
            specs = json.loads(emp.specializations or "[]")
            emp.role = specs[0] if specs else ""
        except (json.JSONDecodeError, IndexError):
            emp.role = ""
        emp.save()


class Migration(migrations.Migration):

    dependencies = [
        ('agency', '0006_add_agency_kyc_extracted_data'),
    ]

    operations = [
        # Add new name fields
        migrations.AddField(
            model_name='agencyemployee',
            name='firstName',
            field=models.CharField(max_length=100, default=""),
        ),
        migrations.AddField(
            model_name='agencyemployee',
            name='middleName',
            field=models.CharField(max_length=100, blank=True, default=""),
        ),
        migrations.AddField(
            model_name='agencyemployee',
            name='lastName',
            field=models.CharField(max_length=100, default=""),
        ),
        # Add specializations JSON field
        migrations.AddField(
            model_name='agencyemployee',
            name='specializations',
            field=models.TextField(default="[]", help_text="JSON array of specialization names"),
        ),
        # Migrate existing data
        migrations.RunPython(migrate_name_to_parts, reverse_name_parts),
        migrations.RunPython(migrate_role_to_specializations, reverse_specializations_to_role),
    ]
