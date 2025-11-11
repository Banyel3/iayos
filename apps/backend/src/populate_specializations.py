import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from accounts.models import Specializations

# Default job categories
categories = [
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Painting",
    "Cleaning",
    "Gardening",
    "Moving",
    "Appliance Repair",
]

print("Creating specializations...")

for category in categories:
    spec, created = Specializations.objects.get_or_create(
        specializationName=category
    )
    if created:
        print(f"✅ Created: {spec.specializationName} (ID: {spec.specializationID})")
    else:
        print(f"⏭️  Already exists: {spec.specializationName} (ID: {spec.specializationID})")

print("\n📋 All Specializations:")
all_specs = Specializations.objects.all()
for spec in all_specs:
    print(f"   ID: {spec.specializationID} - {spec.specializationName}")

print(f"\n✅ Done! Total: {all_specs.count()} specializations")
