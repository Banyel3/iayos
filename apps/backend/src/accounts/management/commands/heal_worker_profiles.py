"""
Django management command to auto-heal missing WorkerProfile records.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import Profile, WorkerProfile
from decimal import Decimal


class Command(BaseCommand):
    help = 'Auto-create missing WorkerProfile records for worker profiles'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*80)
        self.stdout.write("🔧 WORKER PROFILE AUTO-HEALING")
        self.stdout.write("="*80 + "\n")
        
        # Get all worker profiles
        worker_profiles = Profile.objects.filter(profileType='WORKER').select_related('accountFK')
        total_workers = worker_profiles.count()
        
        self.stdout.write(f"📊 Scanning {total_workers} worker profile(s)...\n")
        
        if total_workers == 0:
            self.stdout.write("ℹ️  No worker profiles found in the system.")
            return
        
        # Find missing WorkerProfile records
        missing_worker_profiles = []
        
        for profile in worker_profiles:
            try:
                WorkerProfile.objects.get(profileID=profile)
            except WorkerProfile.DoesNotExist:
                missing_worker_profiles.append(profile)
        
        if not missing_worker_profiles:
            self.stdout.write(self.style.SUCCESS("✅ No missing WorkerProfile records found!"))
            self.stdout.write(self.style.SUCCESS("   All worker profiles are already complete.\n"))
            return
        
        self.stdout.write(self.style.WARNING(
            f"❌ Found {len(missing_worker_profiles)} profile(s) missing WorkerProfile record\n"
        ))
        self.stdout.write("="*80)
        self.stdout.write("HEALING IN PROGRESS...")
        self.stdout.write("="*80 + "\n")
        
        # Create missing WorkerProfile records
        healed_profiles = []
        failed_profiles = []
        
        for idx, profile in enumerate(missing_worker_profiles, 1):
            account = profile.accountFK
            
            self.stdout.write(f"{idx}. Profile ID: {profile.profileID}")
            self.stdout.write(f"   Account: {account.email}")
            self.stdout.write(f"   Name: {profile.firstName} {profile.lastName}")
            
            try:
                with transaction.atomic():
                    # Create WorkerProfile with safe defaults
                    worker_profile = WorkerProfile.objects.create(
                        profileID=profile,
                        description='',
                        workerRating=0,
                        totalEarningGross=Decimal('0.00'),
                        availability_status='OFFLINE',
                        bio='',
                        hourly_rate=None,
                        soft_skills=''
                    )
                    
                    healed_profiles.append({
                        'profile_id': profile.profileID,
                        'worker_profile_id': worker_profile.id,
                        'email': account.email
                    })
                    
                    self.stdout.write(self.style.SUCCESS(
                        f"   ✅ Created WorkerProfile (ID: {worker_profile.id})"
                    ))
                    self.stdout.write("")
                    
            except Exception as e:
                failed_profiles.append({
                    'profile_id': profile.profileID,
                    'email': account.email,
                    'error': str(e)
                })
                self.stdout.write(self.style.ERROR(f"   ❌ Failed: {str(e)}"))
                self.stdout.write("")
        
        # Summary
        self.stdout.write("="*80)
        self.stdout.write("HEALING SUMMARY:")
        self.stdout.write("="*80)
        self.stdout.write(f"Total profiles scanned: {total_workers}")
        self.stdout.write(f"Profiles needing healing: {len(missing_worker_profiles)}")
        self.stdout.write(f"Successfully healed: {len(healed_profiles)}")
        self.stdout.write(f"Failed: {len(failed_profiles)}")
        self.stdout.write("="*80 + "\n")
        
        if healed_profiles:
            self.stdout.write(self.style.SUCCESS("✅ SUCCESSFULLY HEALED PROFILES:"))
            for item in healed_profiles:
                self.stdout.write(
                    f"   • Profile {item['profile_id']} → WorkerProfile {item['worker_profile_id']} ({item['email']})"
                )
            self.stdout.write("")
        
        if failed_profiles:
            self.stdout.write(self.style.ERROR("❌ FAILED PROFILES:"))
            for item in failed_profiles:
                self.stdout.write(f"   • Profile {item['profile_id']} ({item['email']}): {item['error']}")
            self.stdout.write("")
        
        if healed_profiles:
            self.stdout.write("="*80)
            self.stdout.write("NEXT STEPS:")
            self.stdout.write("="*80)
            self.stdout.write("1. Affected users should log out and log back in to refresh their JWT tokens")
            self.stdout.write("2. The workerProfileId should now appear in their profile_data")
            self.stdout.write("3. Job applications and public profile viewing should work correctly")
            self.stdout.write("="*80 + "\n")
            
            self.stdout.write(self.style.SUCCESS(
                f"🎉 Successfully healed {len(healed_profiles)} worker profile(s)!\n"
            ))
