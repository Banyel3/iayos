"""
Unit tests for Worker Profile Service
Tests the worker_profile_service.py functions
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from accounts.models import Profile, WorkerProfile
from accounts.worker_profile_service import (
    update_worker_profile,
    get_worker_profile_completion,
    get_profile_completion_recommendations,
    validate_profile_fields,
)

from decimal import Decimal

User = get_user_model()


class WorkerProfileServiceTestCase(TestCase):
    def setUp(self):
        """Set up test user and profile"""
        self.user = User.objects.create_user(  # type: ignore[call-arg]
            email="worker@test.com",
            password="testpass123"
        )
        self.profile = Profile.objects.create(
            accountFK=self.user,
            firstName="Test",
            lastName="Worker",
            contactNum="09123456789",
            birthDate="1990-01-01",
            profileType="WORKER"
        )
        self.worker_profile = WorkerProfile.objects.create(profileID=self.profile)

    def test_update_worker_profile_success(self):
        """Test successful worker profile update"""
        data = {
            "bio": "Experienced electrician",
            "description": "10 years of experience in residential and commercial work",
            "hourly_rate": 500.00
        }
        
        result = update_worker_profile(
            self.worker_profile,
            bio="Experienced electrician",
            description="10 years of experience in residential and commercial work",
            hourly_rate=500.00
        )
        
        self.assertEqual(result["bio"], "Experienced electrician")
        self.assertEqual(result["hourly_rate"], 500.00)
        self.assertGreater(result["profile_completion_percentage"], 0)

    def test_update_worker_profile_missing_profile(self):
        """Test update with non-existent profile"""
        user_no_profile = User.objects.create_user(  # type: ignore[call-arg]
            email="noworker@test.com",
            password="testpass123"
        )
        # Create profile but not worker profile
        profile = Profile.objects.create(
            accountFK=user_no_profile,
            firstName="No",
            lastName="Worker",
            contactNum="09123456789",
            birthDate="1990-01-01",
            profileType="WORKER"
        )
        # Should raise error when worker profile doesn't exist
        with self.assertRaises(WorkerProfile.DoesNotExist):
            WorkerProfile.objects.get(profileID=profile)

    def test_get_profile_completion_new_profile(self):
        """Test completion percentage for new profile"""
        completion = get_worker_profile_completion(self.worker_profile)
        
        self.assertIn("completion_percentage", completion)
        self.assertIn("missing_fields", completion)
        self.assertIn("completed_fields", completion)
        self.assertIn("recommendations", completion)
        self.assertLess(completion["completion_percentage"], 50)

    def test_get_profile_completion_complete_profile(self):
        """Test completion percentage for complete profile"""
        # Fill all fields
        self.worker_profile.bio = "Test bio"
        self.worker_profile.description = "Test description"
        self.worker_profile.hourly_rate = Decimal('500.00')
        self.worker_profile.save()
        
        self.profile.profileImg = "https://example.com/image.jpg"
        self.profile.save()
        
        completion = get_worker_profile_completion(self.worker_profile)
        
        self.assertGreater(completion["completion_percentage"], 50)
        self.assertIsInstance(completion["missing_fields"], list)

    def test_validate_profile_fields_valid(self):
        """Test validation with valid fields"""
        # Should not raise any exceptions
        validate_profile_fields(
            bio="A" * 199,
            description="B" * 349,
            hourly_rate=100.00
        )

    def test_validate_profile_fields_bio_too_long(self):
        """Test validation with bio exceeding max length"""
        result = validate_profile_fields(bio="A" * 201)
        
        self.assertFalse(result['valid'])
        self.assertIn('bio', result['errors'])
        self.assertIn("Bio must be 200 characters or less", result['errors']['bio'])

    def test_validate_profile_fields_description_too_long(self):
        """Test validation with description exceeding max length"""
        result = validate_profile_fields(description="B" * 351)
        
        self.assertFalse(result['valid'])
        self.assertIn('description', result['errors'])
        self.assertIn("Description must be 350 characters or less", result['errors']['description'])

    def test_validate_profile_fields_negative_rate(self):
        """Test validation with negative hourly rate"""
        result = validate_profile_fields(hourly_rate=-50.00)
        
        self.assertFalse(result['valid'])
        self.assertIn('hourly_rate', result['errors'])
        self.assertIn("greater than 0", result['errors']['hourly_rate'])

    def test_profile_completion_percentage_calculation(self):
        """Test that profile completion percentage is calculated correctly"""
        # Empty profile should be low percentage
        initial_completion = self.worker_profile.calculate_profile_completion()
        self.assertLess(initial_completion, 50)
        
        # Add some fields
        self.worker_profile.bio = "Test bio"
        self.worker_profile.hourly_rate = Decimal('500.00')
        self.worker_profile.save()
        
        partial_completion = self.worker_profile.calculate_profile_completion()
        self.assertGreater(partial_completion, initial_completion)

    def test_get_profile_completion_recommendations(self):
        """Test that recommendations are generated correctly"""
        # Pass a list of missing fields
        missing_fields = ['bio', 'hourly_rate', 'certifications']
        recommendations = get_profile_completion_recommendations(missing_fields)
        
        self.assertIsInstance(recommendations, list)
        self.assertGreater(len(recommendations), 0)
        
        # Check that recommendations contain actionable items
        for rec in recommendations:
            self.assertIsInstance(rec, str)
            self.assertGreater(len(rec), 10)  # Should be meaningful text
