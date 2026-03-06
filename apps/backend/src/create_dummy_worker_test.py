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
            'firstName': 'Test',
            'lastName': 'Worker',
            'phoneNumber': '09171234567',
            'isVerified': True,
        }
    )
    
    # Ensure fully verified profile
    profile, p_created = Profile.objects.get_or_create(
        accountFK=user,
        defaults={
            'profileType': 'WORKER',
            'isVerified': True,
        }
    )
    
    # KYC
    kyc_record, k_created = kyc.objects.get_or_create(
        accountFK=user,
        defaults={
            'kyc_status': 'APPROVED'
        }
    )

    # Wallet logic
    # Need to have -356 balance, -5027 funds on hold
    wallet, w_created = Wallet.objects.get_or_create(
        profileID=profile
    )
    
    wallet.balance = Decimal("-356.00")
    wallet.funds_on_hold = Decimal("-5027.00")
    wallet.save()
    
    print(f"User Email: {email}")
    print(f"Password: {pwd}")
    print(f"Wallet Balance: {wallet.balance}")
    print(f"Funds on Hold: {wallet.funds_on_hold}")
    print("Done!")

if __name__ == "__main__":
    create_dummy()
