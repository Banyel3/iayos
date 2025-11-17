#!/usr/bin/env python3
"""Add test certifications and materials to workers"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
sys.path.insert(0, '/app/apps/backend/src')
django.setup()

from accounts.models import WorkerProfile, WorkerCertification
from profiles.models import WorkerProduct
from datetime import date

# List workers
print("Available workers:")
workers = WorkerProfile.objects.all()[:10]
for w in workers:
    print(f"  ID {w.id}: {w.profileID.firstName} {w.profileID.lastName}")

if len(workers) == 0:
    print("\nNo workers found in database!")
    sys.exit(1)

# Get first worker
worker = workers[0]
print(f"\nAdding test data to worker ID {worker.id}: {worker.profileID.firstName} {worker.profileID.lastName}")

# Add certifications
existing_certs = WorkerCertification.objects.filter(workerID=worker).count()
if existing_certs == 0:
    print("\nAdding certifications...")
    
    cert1 = WorkerCertification.objects.create(
        workerID=worker,
        name='TESDA Plumbing NC II',
        issuing_organization='Technical Education and Skills Development Authority',
        issue_date=date(2022, 3, 15),
        is_verified=True
    )
    print(f"  ✅ Created: {cert1.name} (Verified)")
    
    cert2 = WorkerCertification.objects.create(
        workerID=worker,
        name='Electrical Installation and Maintenance',
        issuing_organization='TESDA',
        issue_date=date(2021, 8, 20),
        expiry_date=date(2026, 8, 20),
        is_verified=True
    )
    print(f"  ✅ Created: {cert2.name} (Verified)")
    
    cert3 = WorkerCertification.objects.create(
        workerID=worker,
        name='Occupational Safety and Health Training',
        issuing_organization='Department of Labor and Employment',
        issue_date=date(2023, 1, 10),
        expiry_date=date(2025, 1, 10),
        is_verified=False
    )
    print(f"  ⏳ Created: {cert3.name} (Pending Verification)")
else:
    print(f"\n📜 Worker already has {existing_certs} certification(s)")

# Add materials
existing_materials = WorkerProduct.objects.filter(workerID=worker).count()
if existing_materials == 0:
    print("\nAdding materials/products...")
    
    mat1 = WorkerProduct.objects.create(
        workerID=worker,
        productName='PVC Pipes',
        description='High-quality PVC pipes for plumbing installations',
        price=250.00,
        priceUnit='METER',
        inStock=True,
        stockQuantity=50,
        isActive=True
    )
    print(f"  ✅ Created: {mat1.productName} - ₱{mat1.price}/{mat1.priceUnit}")
    
    mat2 = WorkerProduct.objects.create(
        workerID=worker,
        productName='Electrical Wires',
        description='Standard electrical wiring for residential installations',
        price=180.00,
        priceUnit='METER',
        inStock=True,
        stockQuantity=100,
        isActive=True
    )
    print(f"  ✅ Created: {mat2.productName} - ₱{mat2.price}/{mat2.priceUnit}")
    
    mat3 = WorkerProduct.objects.create(
        workerID=worker,
        productName='Paint (Interior)',
        description='Premium quality interior paint, various colors available',
        price=1200.00,
        priceUnit='GALLON',
        inStock=True,
        stockQuantity=15,
        isActive=True
    )
    print(f"  ✅ Created: {mat3.productName} - ₱{mat3.price}/{mat3.priceUnit}")
    
    mat4 = WorkerProduct.objects.create(
        workerID=worker,
        productName='Cement Mix',
        description='Professional grade cement for construction work',
        price=350.00,
        priceUnit='KG',
        inStock=False,
        stockQuantity=0,
        isActive=True
    )
    print(f"  ❌ Created: {mat4.productName} - ₱{mat4.price}/{mat4.priceUnit} (Out of Stock)")
else:
    print(f"\n📦 Worker already has {existing_materials} material(s)/product(s)")

print(f"\n✅ SUCCESS! Test data added to worker ID {worker.id}")
print(f"\n📱 To view in mobile app:")
print(f"   1. Navigate to worker profile (ID: {worker.id})")
print(f"   2. Scroll down to see 'Certifications & Licenses' section")
print(f"   3. Scroll further to see 'Materials & Products Available' section")
