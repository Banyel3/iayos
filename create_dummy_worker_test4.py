import os
import sys
import django
from decimal import Decimal

# Set up Django environment
sys.path.append(os.path.join(os.getcwd(), 'apps/backend/src'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "iayos_project.settings")
django.setup()

from accounts.models import Accounts, Profile, Wallet, kyc
from django.contrib.auth.hashers import make_password

def create_dummy():
    email = "test.withdraw.worker@example.com"
    pwd = "Password123!"
    
    # Check if exists
    user, created = Accounts.objects.get_or_create(
        email=email,
        defaults={
            'password': make_password(pwd),
            'isVerified': True,
            'KYCVerified': True,
        }
    )
    
    if not created:
        user.password = make_password(pwd)
        user.isVerified = True
        user.KYCVerified = True
        user.save()
    
    # Ensure fully verified profile
    profile, p_created = Profile.objects.get_or_create(
        accountFK=user,
        defaults={
            'profileType': 'WORKER',
            'firstName': 'Test',
            'lastName': 'Worker',
            'contactNum': '09171234567',
        }
    )
    
    # KYC
    kyc_record, k_created = kyc.objects.get_or_create(
        accountFK=user,
        defaults={
            'kyc_status': 'APPROVED'
        }
    )

    # Wallet logic links to Accounts via accountFK, not profileID
    wallet, w_created = Wallet.objects.get_or_create(
        accountFK=user
    )
    
    wallet.balance = Decimal("-356.00")
    # Using both to be sure "funds on hold from jobs" implies one of them. For worker it should be pendingEarnings.
    wallet.pendingEarnings = Decimal("-5027.00")
    wallet.reservedBalance = Decimal("0.00")
    wallet.save()
    
    print(f"\n✅ Created/Updated Dummy Worker!")
    print(f"User Email: {email}")
    print(f"Password: {pwd}")
    print(f"Wallet Balance: {wallet.balance}")
    print(f"Funds on Hold (pendingEarnings): {wallet.pendingEarnings}")

if __name__ == "__main__":
    create_dummy()
