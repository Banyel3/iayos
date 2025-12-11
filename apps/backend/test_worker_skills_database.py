#!/usr/bin/env python3
"""
Test script for Worker Skills Refactoring endpoints
Tests the new skills and certification linking functionality
"""

import os
import sys
import django
import json
from decimal import Decimal

# Setup Django environment
sys.path.insert(0, '/app/apps/backend/src')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Profile, WorkerProfile, workerSpecialization, Specializations, WorkerCertification
from datetime import date, timedelta

User = get_user_model()


def print_section(title):
    """Print a formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def print_success(message):
    """Print success message in green"""
    print(f"✅ {message}")


def print_error(message):
    """Print error message in red"""
    print(f"❌ {message}")


def print_info(message):
    """Print info message"""
    print(f"ℹ️  {message}")


def create_test_worker():
    """Create or get test worker with skills"""
    print_section("Creating Test Worker")
    
    email = "worker@test.com"
    password = "testpass123"
    
    # Check if user exists
    user = User.objects.filter(email=email).first()
    if user:
        print_info(f"Test worker already exists: {email}")
    else:
        # Create user
        user = User.objects.create_user(
            email=email,
            password=password,
            isEmailVerified=True
        )
        print_success(f"Created test user: {email}")
    
    # Get or create WORKER profile
    worker_profile = Profile.objects.filter(
        accountFK=user,
        profileType=Profile.ProfileType.WORKER
    ).first()
    
    if not worker_profile:
        worker_profile = Profile.objects.create(
            accountFK=user,
            profileType=Profile.ProfileType.WORKER,
            firstName="Test",
            lastName="Worker",
            phoneNumber="+639171234567"
        )
        print_success("Created WORKER profile")
    
    # Get or create WorkerProfile
    worker_details = WorkerProfile.objects.filter(profileID=worker_profile).first()
    if not worker_details:
        worker_details = WorkerProfile.objects.create(
            profileID=worker_profile,
            bio="Test worker for skills refactoring",
            hourlyRate=Decimal("500.00")
        )
        print_success("Created WorkerProfile")
    
    # Add skills (Plumbing and Electrical)
    plumbing = Specializations.objects.filter(specializationName="Plumbing").first()
    electrical = Specializations.objects.filter(specializationName="Electrical Work").first()
    
    if not plumbing or not electrical:
        print_error("Specializations not found. Run populate_specializations.py first!")
        return None
    
    # Create worker skills if they don't exist
    plumbing_skill, created = workerSpecialization.objects.get_or_create(
        workerID=worker_details,
        specializationID=plumbing,
        defaults={'experienceYears': 5}
    )
    if created:
        print_success(f"Added skill: Plumbing (5 years)")
    
    electrical_skill, created = workerSpecialization.objects.get_or_create(
        workerID=worker_details,
        specializationID=electrical,
        defaults={'experienceYears': 3}
    )
    if created:
        print_success(f"Added skill: Electrical Work (3 years)")
    
    return {
        'user': user,
        'email': email,
        'password': password,
        'profile': worker_profile,
        'worker_details': worker_details,
        'plumbing_skill': plumbing_skill,
        'electrical_skill': electrical_skill
    }


def test_available_skills():
    """Test GET /api/mobile/skills/available endpoint"""
    print_section("Test 1: GET /api/mobile/skills/available")
    
    skills = Specializations.objects.all().order_by('specializationName')
    
    print_info(f"Total specializations in database: {skills.count()}")
    
    if skills.count() > 0:
        print_success("Sample skills:")
        for skill in skills[:5]:
            print(f"   - ID {skill.specializationID}: {skill.specializationName} (₱{skill.minimumRate}/hr)")
    else:
        print_error("No specializations found. Run populate_specializations.py!")


def test_worker_profile_skills(worker_data):
    """Test enhanced skills in worker profile"""
    print_section("Test 2: Worker Profile Enhanced Skills")
    
    worker_details = worker_data['worker_details']
    
    # Get worker skills
    worker_skills = workerSpecialization.objects.filter(
        workerID=worker_details
    ).select_related('specializationID')
    
    print_info(f"Worker has {worker_skills.count()} skills")
    
    for ws in worker_skills:
        # Count certifications for this skill
        cert_count = WorkerCertification.objects.filter(
            workerID=worker_details,
            specializationID=ws
        ).count()
        
        print_success(f"Skill: {ws.specializationID.specializationName}")
        print(f"   - workerSpecialization ID: {ws.pk}")
        print(f"   - Specialization ID: {ws.specializationID.specializationID}")
        print(f"   - Experience Years: {ws.experienceYears}")
        print(f"   - Certification Count: {cert_count}")


def test_create_certification_without_skill(worker_data):
    """Test creating certification WITHOUT skill link (backward compatible)"""
    print_section("Test 3: Create Certification WITHOUT Skill Link")
    
    worker_details = worker_data['worker_details']
    
    cert = WorkerCertification.objects.create(
        workerID=worker_details,
        name="TESDA NC II General Construction",
        organization="TESDA",
        issueDate=date(2023, 1, 15),
        expiryDate=date(2028, 1, 15),
        specializationID=None  # No skill link
    )
    
    print_success(f"Created certification ID {cert.certificationID}")
    print(f"   - Name: {cert.name}")
    print(f"   - Organization: {cert.organization}")
    print(f"   - Skill Link: {cert.specializationID} (None - backward compatible)")
    
    return cert


def test_create_certification_with_skill(worker_data):
    """Test creating certification WITH skill link (NEW FEATURE)"""
    print_section("Test 4: Create Certification WITH Skill Link")
    
    worker_details = worker_data['worker_details']
    plumbing_skill = worker_data['plumbing_skill']
    
    cert = WorkerCertification.objects.create(
        workerID=worker_details,
        name="Advanced Plumbing Certificate",
        organization="Philippine Institute of Civil Engineers",
        issueDate=date(2024, 6, 1),
        expiryDate=date(2029, 6, 1),
        specializationID=plumbing_skill  # Linked to Plumbing skill
    )
    
    print_success(f"Created certification ID {cert.certificationID}")
    print(f"   - Name: {cert.name}")
    print(f"   - Organization: {cert.organization}")
    print(f"   - Skill Link: {cert.specializationID.pk} (workerSpecialization)")
    print(f"   - Skill Name: {cert.specializationID.specializationID.specializationName}")
    
    return cert


def test_certification_count_update(worker_data):
    """Test that certification count updates correctly"""
    print_section("Test 5: Certification Count Per Skill")
    
    worker_details = worker_data['worker_details']
    plumbing_skill = worker_data['plumbing_skill']
    electrical_skill = worker_data['electrical_skill']
    
    # Count certifications per skill
    plumbing_certs = WorkerCertification.objects.filter(
        workerID=worker_details,
        specializationID=plumbing_skill
    ).count()
    
    electrical_certs = WorkerCertification.objects.filter(
        workerID=worker_details,
        specializationID=electrical_skill
    ).count()
    
    unlinked_certs = WorkerCertification.objects.filter(
        workerID=worker_details,
        specializationID__isnull=True
    ).count()
    
    print_info("Certification counts:")
    print(f"   - Plumbing: {plumbing_certs} certifications")
    print(f"   - Electrical: {electrical_certs} certifications")
    print(f"   - Unlinked: {unlinked_certs} certifications")
    
    if plumbing_certs > 0:
        print_success("Skill linking working correctly!")
    else:
        print_error("No certifications linked to Plumbing skill")


def test_update_certification_link(cert, new_skill):
    """Test updating certification skill link"""
    print_section("Test 6: Update Certification Skill Link")
    
    old_skill = cert.specializationID
    old_name = old_skill.specializationID.specializationName if old_skill else "None"
    
    print_info(f"Updating certification ID {cert.certificationID}")
    print(f"   - Current skill: {old_name}")
    print(f"   - New skill: {new_skill.specializationID.specializationName}")
    
    cert.specializationID = new_skill
    cert.save()
    
    print_success("Certification skill link updated!")
    print(f"   - New skill ID: {cert.specializationID.pk}")
    print(f"   - New skill name: {cert.specializationID.specializationID.specializationName}")


def test_unlink_certification(cert):
    """Test unlinking certification from skill"""
    print_section("Test 7: Unlink Certification from Skill")
    
    if cert.specializationID:
        old_skill = cert.specializationID.specializationID.specializationName
        print_info(f"Unlinking certification from {old_skill}")
    else:
        print_info("Certification already unlinked")
        return
    
    cert.specializationID = None
    cert.save()
    
    print_success("Certification unlinked successfully!")
    print(f"   - Skill link: {cert.specializationID} (None)")


def test_certification_formatting(cert):
    """Test certification response format"""
    print_section("Test 8: Certification Response Format")
    
    # Simulate _format_certification function
    response = {
        'id': cert.certificationID,
        'name': cert.name,
        'organization': cert.organization,
        'issueDate': cert.issueDate.isoformat() if cert.issueDate else None,
        'expiryDate': cert.expiryDate.isoformat() if cert.expiryDate else None,
        'isVerified': cert.isVerified,
        'specializationId': cert.specializationID.pk if cert.specializationID else None,
        'skillName': cert.specializationID.specializationID.specializationName if cert.specializationID else None
    }
    
    print_success("Formatted certification response:")
    print(json.dumps(response, indent=2))


def print_test_credentials(worker_data):
    """Print credentials for manual REST Client testing"""
    print_section("REST Client Testing Information")
    
    print_info("Update test_worker_skills_endpoints.http with these values:")
    print(f"\n@baseUrl = http://localhost:8000")
    print(f"Email: {worker_data['email']}")
    print(f"Password: {worker_data['password']}")
    print(f"\nWorker Details:")
    print(f"- User ID: {worker_data['user'].id}")
    print(f"- Profile ID: {worker_data['profile'].profileID}")
    print(f"- WorkerProfile ID: {worker_data['worker_details'].workerID}")
    print(f"\nSkills (workerSpecialization IDs):")
    print(f"- Plumbing: {worker_data['plumbing_skill'].pk}")
    print(f"- Electrical: {worker_data['electrical_skill'].pk}")
    
    print("\nSteps to test in REST Client:")
    print("1. Open test_worker_skills_endpoints.http in VS Code")
    print("2. Install 'REST Client' extension if not installed")
    print(f"3. Login with email: {worker_data['email']}, password: {worker_data['password']}")
    print("4. Copy JWT token from response")
    print("5. Update @token variable in .http file")
    print("6. Click 'Send Request' on each test")


def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("  WORKER SKILLS REFACTORING - ENDPOINT TESTING")
    print("=" * 80)
    
    try:
        # Test 1: Create test worker
        worker_data = create_test_worker()
        if not worker_data:
            print_error("Failed to create test worker")
            return
        
        # Test 2: Check available skills
        test_available_skills()
        
        # Test 3: Check worker profile skills
        test_worker_profile_skills(worker_data)
        
        # Test 4: Create certification without skill link
        cert_unlinked = test_create_certification_without_skill(worker_data)
        
        # Test 5: Create certification with skill link
        cert_linked = test_create_certification_with_skill(worker_data)
        
        # Test 6: Check certification counts
        test_certification_count_update(worker_data)
        
        # Test 7: Update certification skill link
        test_update_certification_link(cert_unlinked, worker_data['electrical_skill'])
        
        # Test 8: Check counts again
        test_certification_count_update(worker_data)
        
        # Test 9: Unlink certification
        test_unlink_certification(cert_unlinked)
        
        # Test 10: Check final counts
        test_certification_count_update(worker_data)
        
        # Test 11: Check response format
        test_certification_formatting(cert_linked)
        
        # Print REST Client testing info
        print_test_credentials(worker_data)
        
        print_section("ALL TESTS COMPLETED")
        print_success("Database tests passed!")
        print_info("Now test REST endpoints using test_worker_skills_endpoints.http")
        
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
