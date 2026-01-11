"""
Script to delete all general certifications (those without a skill binding).
Since all certifications must now be bound to a skill, remove orphaned records.
"""

import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'backend', 'src'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import WorkerCertification

def delete_general_certifications():
    """Delete all certifications without a skill binding"""
    
    # Find certifications with null specializationID
    general_certs = WorkerCertification.objects.filter(specializationID__isnull=True)
    count = general_certs.count()
    
    if count == 0:
        print("✅ No general certifications found. All certifications are skill-bound.")
        return
    
    print(f"⚠️  Found {count} general certification(s) without skill binding:")
    for cert in general_certs:
        print(f"  - ID: {cert.certificationID}, Name: {cert.name}, Worker: {cert.workerProfile.profileID.accountFK.email}")
    
    # Confirm deletion
    confirm = input(f"\n🗑️  Delete all {count} general certification(s)? (yes/no): ")
    
    if confirm.lower() == 'yes':
        general_certs.delete()
        print(f"✅ Successfully deleted {count} general certification(s)")
    else:
        print("❌ Deletion cancelled")

if __name__ == "__main__":
    print("=" * 60)
    print("DELETE GENERAL CERTIFICATIONS")
    print("=" * 60)
    print("This script removes certifications without a skill binding.")
    print("All certifications must now be linked to a specific skill.")
    print("=" * 60)
    print()
    
    delete_general_certifications()
