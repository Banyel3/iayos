"""
Script to create a WorkerProfile for testing purposes.
Run this from the backend/src directory with: python create_worker_profile.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
django.setup()

from accounts.models import Profile, WorkerProfile

def create_worker_profile_for_profile_id_2():
    """Create a WorkerProfile for profileID 2"""
    try:
        # Get Profile with profileID = 2
        profile = Profile.objects.get(profileID=2)
        
        print(f"Found Profile: {profile.firstName} {profile.lastName}")
        print(f"  Profile ID: {profile.profileID}")
        print(f"  Profile Type: {profile.profileType}")
        print(f"  Account: {profile.accountFK.email}")
        
        # Check if WorkerProfile already exists
        existing = WorkerProfile.objects.filter(profileID=profile).first()
        if existing:
            print(f"\n⚠️  WorkerProfile already exists for this profile!")
            print(f"  Current availability: {existing.availabilityStatus}")
            print(f"  Worker rating: {existing.workerRating}")
            print(f"  Total earnings: {existing.totalEarningGross}")
            return
        
        # Create WorkerProfile
        worker_profile = WorkerProfile.objects.create(
            profileID=profile,
            description='Test worker profile created for testing availability toggle',
            workerRating=0,
            totalEarningGross=0.00,
            availabilityStatus=WorkerProfile.availabilityStatus.OFFLINE
        )
        
        print(f"\n✅ Successfully created WorkerProfile!")
        print(f"  Profile ID: {worker_profile.profileID.profileID}")
        print(f"  Description: {worker_profile.description}")
        print(f"  Availability: {worker_profile.availabilityStatus}")
        print(f"  Worker Rating: {worker_profile.workerRating}")
        print(f"  Total Earnings: ${worker_profile.totalEarningGross}")
        
    except Profile.DoesNotExist:
        print(f"❌ Error: Profile with profileID=2 does not exist!")
        print("\nAvailable profiles:")
        for p in Profile.objects.all()[:10]:
            print(f"  - Profile ID {p.profileID}: {p.firstName} {p.lastName} ({p.profileType})")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 60)
    print("Creating WorkerProfile for profileID=2")
    print("=" * 60)
    create_worker_profile_for_profile_id_2()
    print("=" * 60)
