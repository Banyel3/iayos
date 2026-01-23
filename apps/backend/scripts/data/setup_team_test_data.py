"""
Setup test data for team job testing via Django management command
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, 'apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_backend.settings')

# This will be run inside Docker
print("Setting up test data for team job testing...")

from django.contrib.auth import get_user_model
from accounts.models import Wallet, Profile
from decimal import Decimal

Account = get_user_model()

def ensure_account(email, password, first_name, last_name, profile_type):
    """Create account if not exists, reset password if exists"""
    account, created = Account.objects.get_or_create(
        email=email,
        defaults={'is_active': True, 'emailVerified': True}
    )
    
    if created:
        account.set_password(password)
        account.save()
        
        # Create profile
        profile = Profile.objects.create(
            accountFK=account,
            profileType=profile_type,
            firstName=first_name,
            lastName=last_name,
            isAvailable=True if profile_type == 'WORKER' else False
        )
        
        # Create wallet
        Wallet.objects.create(
            accountID=account,
            balance=Decimal('10000.00') if profile_type == 'CLIENT' else Decimal('0.00')
        )
        
        print(f"✅ Created: {email} ({profile_type})")
    else:
        # Reset password
        account.set_password(password)
        account.is_active = True
        account.emailVerified = True
        account.save()
        
        # Ensure profile exists
        profile, _ = Profile.objects.get_or_create(
            accountFK=account,
            profileType=profile_type,
            defaults={
                'firstName': first_name,
                'lastName': last_name,
                'isAvailable': True if profile_type == 'WORKER' else False
            }
        )
        
        # Ensure wallet exists with balance for client
        wallet, _ = Wallet.objects.get_or_create(
            accountID=account,
            defaults={'balance': Decimal('10000.00') if profile_type == 'CLIENT' else Decimal('0.00')}
        )
        
        # Add balance to client if low
        if profile_type == 'CLIENT' and wallet.balance < Decimal('10000.00'):
            wallet.balance = Decimal('20000.00')
            wallet.save()
            print(f"✅ Added balance to: {email} (₱20,000)")
        
        print(f"✅ Reset: {email} ({profile_type})")
    
    return account

# Create test accounts
print("\n=== Creating Test Accounts ===")

# Client
ensure_account('testclient_team@test.com', 'test123456', 'Test', 'Client', 'CLIENT')

# Workers
ensure_account('testworker1_team@test.com', 'test123456', 'Worker1', 'Team', 'WORKER')
ensure_account('testworker2_team@test.com', 'test123456', 'Worker2', 'Team', 'WORKER')
ensure_account('testworker3_team@test.com', 'test123456', 'Worker3', 'Team', 'WORKER')

print("\n✅ All test accounts ready!")
print("   Client: testclient_team@test.com / test123456")
print("   Workers: testworker1_team@test.com, testworker2_team@test.com, testworker3_team@test.com / test123456")
