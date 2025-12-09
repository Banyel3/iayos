"""
Django management command to test worker skills endpoints
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Profile, WorkerProfile, workerSpecialization, Specializations, WorkerCertification
from decimal import Decimal
from datetime import date

User = get_user_model()


class Command(BaseCommand):
    help = 'Test worker skills refactoring endpoints'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n' + '='*80))
        self.stdout.write(self.style.SUCCESS('  WORKER SKILLS REFACTORING - DATABASE TEST'))
        self.stdout.write(self.style.SUCCESS('='*80 + '\n'))

        # Create test worker
        email = "worker@test.com"
        password = "testpass123"
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'isVerified': True}
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Created test user: {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'ℹ️  Test user exists: {email}'))

        # Create worker profile
        worker_profile, created = Profile.objects.get_or_create(
            accountFK=user,
            profileType=Profile.ProfileType.WORKER,
            defaults={
                'firstName': 'Test',
                'lastName': 'Worker',
                'contactNum': '09171234567',
                'birthDate': date(1990, 1, 1)
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Created WORKER profile'))

        # Create WorkerProfile
        worker_details, created = WorkerProfile.objects.get_or_create(
            profileID=worker_profile,
            defaults={
                'bio': 'Test worker for skills refactoring',
                'hourly_rate': Decimal('500.00')
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Created WorkerProfile'))

        # Create specializations if they don't exist
        specializations_data = [
            {"name": "Plumbing", "min_rate": 500.00, "skill_level": "intermediate"},
            {"name": "Electrical Work", "min_rate": 600.00, "skill_level": "advanced"},
        ]
        
        for spec_data in specializations_data:
            Specializations.objects.get_or_create(
                specializationName=spec_data["name"],
                defaults={
                    'minimumRate': Decimal(str(spec_data["min_rate"])),
                    'description': f"{spec_data['name']} services",
                    'rateType': 'hourly'
                }
            )
        
        self.stdout.write(self.style.SUCCESS('✅ Specializations ready'))

        # Get specializations
        plumbing = Specializations.objects.filter(specializationName="Plumbing").first()
        electrical = Specializations.objects.filter(specializationName="Electrical Work").first()

        if not plumbing or not electrical:
            self.stdout.write(self.style.ERROR('❌ Specializations not found!'))
            return

        # Add skills
        plumbing_skill, created = workerSpecialization.objects.get_or_create(
            workerID=worker_details,
            specializationID=plumbing,
            defaults={'experienceYears': 5}
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Added Plumbing skill (5 years)'))

        electrical_skill, created = workerSpecialization.objects.get_or_create(
            workerID=worker_details,
            specializationID=electrical,
            defaults={'experienceYears': 3}
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Added Electrical skill (3 years)'))

        # Test certification counts
        self.stdout.write(self.style.SUCCESS('\n--- Skill Certification Counts ---'))
        for ws in workerSpecialization.objects.filter(workerID=worker_details):
            cert_count = WorkerCertification.objects.filter(
                workerID=worker_details,
                specializationID=ws
            ).count()
            self.stdout.write(f'  {ws.specializationID.specializationName}: {cert_count} certifications')

        # Create test certifications
        self.stdout.write(self.style.SUCCESS('\n--- Creating Test Certifications ---'))
        
        # Cert without skill link
        cert1, created = WorkerCertification.objects.get_or_create(
            workerID=worker_details,
            name="TESDA NC II General Construction",
            defaults={
                'issuing_organization': 'TESDA',
                'issue_date': date(2023, 1, 15),
                'expiry_date': date(2028, 1, 15)
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Created unlinked cert: {cert1.name}'))

        # Cert with Plumbing skill link
        cert2, created = WorkerCertification.objects.get_or_create(
            workerID=worker_details,
            name="Advanced Plumbing Certificate",
            defaults={
                'issuing_organization': 'PICE',
                'issue_date': date(2024, 6, 1),
                'expiry_date': date(2029, 6, 1),
                'specializationID': plumbing_skill
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Created Plumbing cert: {cert2.name}'))

        # Cert with Electrical skill link
        cert3, created = WorkerCertification.objects.get_or_create(
            workerID=worker_details,
            name="Electrical Safety Certificate",
            defaults={
                'issuing_organization': 'MERALCO Training Center',
                'issue_date': date(2024, 3, 10),
                'expiry_date': date(2027, 3, 10),
                'specializationID': electrical_skill
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Created Electrical cert: {cert3.name}'))

        # Show final counts
        self.stdout.write(self.style.SUCCESS('\n--- Final Certification Counts ---'))
        for ws in workerSpecialization.objects.filter(workerID=worker_details):
            cert_count = WorkerCertification.objects.filter(
                workerID=worker_details,
                specializationID=ws
            ).count()
            self.stdout.write(f'  {ws.specializationID.specializationName}: {cert_count} certifications')

        # Print test info
        self.stdout.write(self.style.SUCCESS('\n--- REST Client Testing Info ---'))
        self.stdout.write(f'Email: {email}')
        self.stdout.write(f'Password: {password}')
        self.stdout.write(f'User ID: {user.accountID}')
        self.stdout.write(f'Profile ID: {worker_profile.profileID}')
        self.stdout.write(f'Plumbing Skill ID: {plumbing_skill.pk}')
        self.stdout.write(f'Electrical Skill ID: {electrical_skill.pk}')
        self.stdout.write(f'Cert 1 ID: {cert1.certificationID}')
        self.stdout.write(f'Cert 2 ID: {cert2.certificationID}')
        self.stdout.write(f'Cert 3 ID: {cert3.certificationID}')

        self.stdout.write(self.style.SUCCESS('\n✅ Database setup complete!'))
        self.stdout.write(self.style.SUCCESS('Now test with: apps/backend/test_worker_skills_endpoints.http'))
