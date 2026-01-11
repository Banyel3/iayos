#!/usr/bin/env python3
"""Test worker detail API endpoint to verify certifications and materials are returned"""

import os
import sys
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
sys.path.insert(0, '/app/apps/backend/src')
django.setup()

from accounts.models import WorkerProfile, Accounts
from accounts.mobile_services import get_worker_detail_mobile_v2

# Get worker with ID 3 (we added test data to this one)
try:
    worker = WorkerProfile.objects.get(id=3)
except WorkerProfile.DoesNotExist:
    print("❌ Worker ID 3 not found! Using first available worker instead.")
    worker = WorkerProfile.objects.first()
    if not worker:
        print("❌ No workers found!")
        sys.exit(1)

print(f"Testing worker detail API for worker ID {worker.id}: {worker.profileID.firstName} {worker.profileID.lastName}\n")

# Get a user account to simulate the request
user = Accounts.objects.filter(profile__profileType='CLIENT').first()
if not user:
    user = Accounts.objects.first()

print(f"Simulating request from user: {user.email}\n")

# Call the service function
result = get_worker_detail_mobile_v2(user, worker.id)

if result['success']:
    data = result['data']
    print("✅ API call successful!\n")
    
    # Check certifications
    certifications = data.get('certifications', [])
    print(f"📜 Certifications: {len(certifications)}")
    for cert in certifications:
        verified = "✅" if cert['isVerified'] else "⏳"
        print(f"   {verified} {cert['name']}")
        if cert.get('issuingOrganization'):
            print(f"      Organization: {cert['issuingOrganization']}")
        if cert.get('issueDate'):
            print(f"      Issued: {cert['issueDate']}")
    
    # Check materials
    materials = data.get('materials', [])
    print(f"\n📦 Materials: {len(materials)}")
    for mat in materials:
        stock = "✅" if mat['inStock'] else "❌"
        print(f"   {stock} {mat['name']} - ₱{mat['price']}/{mat['priceUnit']}")
        if mat.get('description'):
            print(f"      {mat['description']}")
    
    print(f"\n✅ Worker detail response includes {len(certifications)} certifications and {len(materials)} materials!")
    
    # Print full JSON for verification
    print("\n" + "="*80)
    print("FULL API RESPONSE:")
    print("="*80)
    print(json.dumps(data, indent=2, default=str))
else:
    print(f"❌ API call failed: {result.get('error')}")
    sys.exit(1)
