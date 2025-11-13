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

User = get_user_model()


class WorkerProfileServiceTestCase(TestCase):
    def setUp(self):
        """Set up test user and profile"""
        self.user = User.objects.create_user(
            email="worker@test.com",
            password="testpass123"
        )
        self.profile = Profile.objects.create(
            user=self.user,
            firstName="Test",
            lastName="Worker",
            profileType="WORKER"
        )
        self.worker_profile = WorkerProfile.objects.create(profile=self.profile)

    def test_update_worker_profile_success(self):
        """Test successful worker profile update"""
        data = {
            "bio": "Experienced electrician",
            "description": "10 years of experience in residential and commercial work",
            "hourly_rate": 500.00
        }
        
        result = update_worker_profile(self.user, data)
        
        self.assertEqual(result["bio"], "Experienced electrician")
        self.assertEqual(result["hourly_rate"], 500.00)
        self.assertGreater(result["profile_completion_percentage"], 0)

    def test_update_worker_profile_missing_profile(self):
        """Test update with non-existent profile"""
        user_no_profile = User.objects.create_user(
            email="noworker@test.com",
            password="testpass123"
        )
        
        with self.assertRaises(Exception):
            update_worker_profile(user_no_profile, {"bio": "Test"})

    def test_get_profile_completion_new_profile(self):
        """Test completion percentage for new profile"""
        completion = get_worker_profile_completion(self.user)
        
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
        self.worker_profile.hourly_rate = 500.00
        self.worker_profile.save()
        
        self.profile.contactNum = "09123456789"
        self.profile.location = "Manila, Philippines"
        self.profile.save()
        
        completion = get_worker_profile_completion(self.user)
        
        self.assertGreater(completion["completion_percentage"], 50)
        self.assertIsInstance(completion["missing_fields"], list)

    def test_validate_profile_fields_valid(self):
        """Test validation with valid fields"""
        data = {
            "bio": "A" * 199,  # Just under 200 char limit
            "description": "B" * 349,  # Just under 350 char limit
            "hourly_rate": 100.00
        }
        
        # Should not raise any exceptions
        validate_profile_fields(data)

    def test_validate_profile_fields_bio_too_long(self):
        """Test validation with bio exceeding max length"""
        data = {
            "bio": "A" * 201,  # Over 200 char limit
        }
        
        with self.assertRaises(ValueError) as context:
            validate_profile_fields(data)
        
        self.assertIn("Bio must be 200 characters or less", str(context.exception))

    def test_validate_profile_fields_description_too_long(self):
        """Test validation with description exceeding max length"""
        data = {
            "description": "B" * 351,  # Over 350 char limit
        }
        
        with self.assertRaises(ValueError) as context:
            validate_profile_fields(data)
        
        self.assertIn("Description must be 350 characters or less", str(context.exception))

    def test_validate_profile_fields_negative_rate(self):
        """Test validation with negative hourly rate"""
        data = {
            "hourly_rate": -50.00
        }
        
        with self.assertRaises(ValueError) as context:
            validate_profile_fields(data)
        
        self.assertIn("Hourly rate must be a positive number", str(context.exception))

    def test_profile_completion_percentage_calculation(self):
        """Test that profile completion percentage is calculated correctly"""
        # Empty profile should be low percentage
        initial_completion = self.worker_profile.calculate_profile_completion()
        self.assertLess(initial_completion, 50)
        
        # Add some fields
        self.worker_profile.bio = "Test bio"
        self.worker_profile.hourly_rate = 500.00
        self.worker_profile.save()
        
        partial_completion = self.worker_profile.calculate_profile_completion()
        self.assertGreater(partial_completion, initial_completion)

    def test_get_profile_completion_recommendations(self):
        """Test that recommendations are generated correctly"""
        recommendations = get_profile_completion_recommendations(self.user)
        
        self.assertIsInstance(recommendations, list)
        self.assertGreater(len(recommendations), 0)
        
        # Check that recommendations contain actionable items
        for rec in recommendations:
            self.assertIsInstance(rec, str)
            self.assertGreater(len(rec), 10)  # Should be meaningful text
