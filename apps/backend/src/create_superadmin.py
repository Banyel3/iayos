#!/usr/bin/env python
"""
Simple script to create a superadmin user
Run with: python create_superadmin.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from adminpanel.service import create_admin_account

try:
    result = create_admin_account(
        email='superadmin@gmail.com',
        password='VanielCornelio_123',
        role='ADMIN'
    )
    print("✅ Superadmin created successfully!")
    print(f"   Email: {result['email']}")
    print(f"   Account ID: {result['accountID']}")
    print(f"   Role: {result['role']}")
    print(f"\n🔐 Login credentials:")
    print(f"   Email: superadmin@gmail.com")
    print(f"   Password: VanielCornelio_123")
except ValueError as e:
    print(f"❌ Error: {e}")
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    import traceback
    traceback.print_exc()
