#!/usr/bin/env python3
"""
Script to add sample certifications and materials to a worker for testing.
Usage: python scripts/add_worker_certifications_materials.py <worker_id>
"""

import sys
import os
import django

# Setup Django environment
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'src.config.settings')
django.setup()

from accounts.models import WorkerProfile, WorkerCertification
from profiles.models import WorkerProduct
from datetime import date, timedelta


def add_sample_data(worker_id):
    """Add sample certifications and materials to a worker."""
    try:
        worker = WorkerProfile.objects.get(id=worker_id)
        print(f"✅ Found worker: {worker.profileID.firstName} {worker.profileID.lastName}")
        
        # Add certifications if none exist
        existing_certs = WorkerCertification.objects.filter(workerID=worker).count()
        if existing_certs == 0:
            print("\n📜 Adding sample certifications...")
            
            certifications = [
                {
                    'name': 'TESDA Plumbing NC II',
                    'issuing_organization': 'Technical Education and Skills Development Authority',
                    'issue_date': date(2022, 3, 15),
                    'expiry_date': None,
                    'is_verified': True,
                },
                {
                    'name': 'Electrical Installation and Maintenance',
                    'issuing_organization': 'TESDA',
                    'issue_date': date(2021, 8, 20),
                    'expiry_date': date(2026, 8, 20),
                    'is_verified': True,
                },
                {
                    'name': 'Occupational Safety and Health Training',
                    'issuing_organization': 'Department of Labor and Employment',
                    'issue_date': date(2023, 1, 10),
                    'expiry_date': date(2025, 1, 10),
                    'is_verified': False,
                }
            ]
            
            for cert_data in certifications:
                cert = WorkerCertification.objects.create(
                    workerID=worker,
                    **cert_data
                )
                verified = "✅ Verified" if cert.is_verified else "⏳ Pending"
                print(f"   • {cert.name} ({verified})")
        else:
            print(f"\n📜 Worker already has {existing_certs} certification(s)")
        
        # Add materials if none exist
        existing_materials = WorkerProduct.objects.filter(workerID=worker).count()
        if existing_materials == 0:
            print("\n📦 Adding sample materials/products...")
            
            materials = [
                {
                    'productName': 'PVC Pipes',
                    'description': 'High-quality PVC pipes for plumbing installations',
                    'price': 250.00,
                    'priceUnit': 'METER',
                    'inStock': True,
                    'stockQuantity': 50,
                    'isActive': True,
                },
                {
                    'productName': 'Electrical Wires',
                    'description': 'Standard electrical wiring for residential installations',
                    'price': 180.00,
                    'priceUnit': 'METER',
                    'inStock': True,
                    'stockQuantity': 100,
                    'isActive': True,
                },
                {
                    'productName': 'Paint (Interior)',
                    'description': 'Premium quality interior paint, various colors available',
                    'price': 1200.00,
                    'priceUnit': 'GALLON',
                    'inStock': True,
                    'stockQuantity': 15,
                    'isActive': True,
                },
                {
                    'productName': 'Cement Mix',
                    'description': 'Professional grade cement for construction work',
                    'price': 350.00,
                    'priceUnit': 'KG',
                    'inStock': False,
                    'stockQuantity': 0,
                    'isActive': True,
                }
            ]
            
            for material_data in materials:
                material = WorkerProduct.objects.create(
                    workerID=worker,
                    **material_data
                )
                stock = "✅ In Stock" if material.inStock else "❌ Out of Stock"
                print(f"   • {material.productName} - ₱{material.price}/{material.priceUnit} ({stock})")
        else:
            print(f"\n📦 Worker already has {existing_materials} material(s)/product(s)")
        
        print(f"\n✅ Successfully added sample data to worker {worker_id}")
        print(f"\n🔍 To view in mobile app:")
        print(f"   1. Navigate to worker profile (ID: {worker_id})")
        print(f"   2. Scroll down to see 'Certifications & Licenses' section")
        print(f"   3. Scroll further to see 'Materials & Products Available' section")
        
    except WorkerProfile.DoesNotExist:
        print(f"❌ Error: Worker with ID {worker_id} not found")
        print("\n💡 Available workers:")
        for worker in WorkerProfile.objects.all()[:5]:
            print(f"   • ID {worker.id}: {worker.profileID.firstName} {worker.profileID.lastName}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("❌ Usage: python scripts/add_worker_certifications_materials.py <worker_id>")
        print("\n💡 Available workers:")
        from accounts.models import WorkerProfile
        for worker in WorkerProfile.objects.all()[:10]:
            print(f"   • ID {worker.id}: {worker.profileID.firstName} {worker.profileID.lastName}")
        sys.exit(1)
    
    worker_id = int(sys.argv[1])
    add_sample_data(worker_id)
