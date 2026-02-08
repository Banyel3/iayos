"""
Django management command to check for missing WorkerProfile records.
"""
from django.core.management.base import BaseCommand
from accounts.models import Profile, WorkerProfile


class Command(BaseCommand):
    help = 'Check for worker profiles missing WorkerProfile records'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*80)
        self.stdout.write("🔍 WORKER PROFILE DIAGNOSTIC REPORT")
        self.stdout.write("="*80 + "\n")
        
        # Get all worker profiles
        worker_profiles = Profile.objects.filter(profileType='WORKER').select_related('accountFK')
        total_workers = worker_profiles.count()
        
        self.stdout.write(f"📊 Total WORKER profiles found: {total_workers}\n")
        
        if total_workers == 0:
            self.stdout.write(self.style.SUCCESS("✅ No worker profiles found in the system."))
            return
        
        # Check which ones are missing WorkerProfile
        missing_worker_profiles = []
        
        for profile in worker_profiles:
            try:
                WorkerProfile.objects.get(profileID=profile)
            except WorkerProfile.DoesNotExist:
                missing_worker_profiles.append(profile)
        
        # Report results
        if missing_worker_profiles:
            self.stdout.write(self.style.ERROR(
                f"❌ ISSUES FOUND: {len(missing_worker_profiles)} worker profile(s) missing WorkerProfile record\n"
            ))
            self.stdout.write("="*80)
            self.stdout.write("AFFECTED PROFILES:")
            self.stdout.write("="*80 + "\n")
            
            for idx, profile in enumerate(missing_worker_profiles, 1):
                account = profile.accountFK
                self.stdout.write(f"{idx}. Profile ID: {profile.profileID}")
                self.stdout.write(f"   Account ID: {account.accountID}")
                self.stdout.write(f"   Email: {account.email}")
                self.stdout.write(f"   Name: {profile.firstName} {profile.lastName}")
                self.stdout.write(self.style.ERROR(f"   Status: MISSING WorkerProfile record ❌"))
                self.stdout.write("")
            
            self.stdout.write("="*80)
            self.stdout.write("RECOMMENDATION:")
            self.stdout.write("="*80)
            self.stdout.write("Run the healing command to auto-create missing WorkerProfile records:")
            self.stdout.write("  python manage.py heal_worker_profiles")
            self.stdout.write("")
            
        else:
            self.stdout.write(self.style.SUCCESS("✅ All worker profiles have corresponding WorkerProfile records!"))
            self.stdout.write(self.style.SUCCESS("   No issues found.\n"))
        
        # Summary
        self.stdout.write("="*80)
        self.stdout.write("SUMMARY:")
        self.stdout.write("="*80)
        self.stdout.write(f"Total worker profiles: {total_workers}")
        self.stdout.write(f"With WorkerProfile: {total_workers - len(missing_worker_profiles)}")
        self.stdout.write(f"Missing WorkerProfile: {len(missing_worker_profiles)}")
        self.stdout.write("="*80 + "\n")
        
        if missing_worker_profiles:
            self.stdout.write("🔧 To fix these issues, run:")
            self.stdout.write("   python manage.py heal_worker_profiles\n")
        else:
            self.stdout.write(self.style.SUCCESS("🎉 Database is consistent! No action needed.\n"))
