"""
Unit tests for Certification Service
Tests the certification_service.py functions
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from accounts.models import Profile, WorkerProfile, WorkerCertification
from accounts.certification_service import (
    add_certification,
    get_certifications,
    get_expiring_certifications,
    update_certification,
    delete_certification,
    verify_certification,
    validate_image_file,
)
from unittest.mock import Mock, patch

User = get_user_model()


class CertificationServiceTestCase(TestCase):
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
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            password="adminpass123",
            role="ADMIN"
        )

    def test_add_certification_success(self):
        """Test adding a certification successfully"""
        data = {
            "name": "Licensed Electrician",
            "issuing_organization": "PRC",
            "issue_date": timezone.now().date(),
            "certificate_url": "https://example.com/cert.pdf"
        }
        
        result = add_certification(self.user, data)
        
        self.assertEqual(result["name"], "Licensed Electrician")
        self.assertEqual(result["issuing_organization"], "PRC")
        self.assertFalse(result["is_verified"])

    def test_add_certification_with_expiry(self):
        """Test adding certification with expiry date"""
        expiry = timezone.now().date() + timedelta(days=365)
        data = {
            "name": "Safety Training",
            "issuing_organization": "DOLE",
            "issue_date": timezone.now().date(),
            "expiry_date": expiry,
            "certificate_url": "https://example.com/cert.pdf"
        }
        
        result = add_certification(self.user, data)
        
        self.assertIsNotNone(result["expiry_date"])
        self.assertEqual(str(result["expiry_date"]), str(expiry))

    def test_get_certifications_ordered_by_date(self):
        """Test that certifications are ordered by issue date"""
        # Create certifications with different dates
        date1 = timezone.now().date() - timedelta(days=365)
        date2 = timezone.now().date() - timedelta(days=180)
        date3 = timezone.now().date()
        
        WorkerCertification.objects.create(
            worker_profile=self.worker_profile,
            name="Cert 1",
            issuing_organization="Org 1",
            issue_date=date1,
            certificate_url="https://example.com/cert1.pdf"
        )
        WorkerCertification.objects.create(
            worker_profile=self.worker_profile,
            name="Cert 2",
            issuing_organization="Org 2",
            issue_date=date2,
            certificate_url="https://example.com/cert2.pdf"
        )
        WorkerCertification.objects.create(
            worker_profile=self.worker_profile,
            name="Cert 3",
            issuing_organization="Org 3",
            issue_date=date3,
            certificate_url="https://example.com/cert3.pdf"
        )
        
        certifications = get_certifications(self.user)
        
        self.assertEqual(len(certifications), 3)
        # Should be ordered by most recent first
        self.assertEqual(certifications[0]["name"], "Cert 3")
        self.assertEqual(certifications[1]["name"], "Cert 2")
        self.assertEqual(certifications[2]["name"], "Cert 1")

    def test_get_expiring_certifications_30_days(self):
        """Test getting certifications expiring within 30 days"""
        # Create certifications with different expiry dates
        expiry_soon = timezone.now().date() + timedelta(days=20)
        expiry_later = timezone.now().date() + timedelta(days=60)
        
        WorkerCertification.objects.create(
            worker_profile=self.worker_profile,
            name="Expiring Soon",
            issuing_organization="Org",
            issue_date=timezone.now().date() - timedelta(days=345),
            expiry_date=expiry_soon,
            certificate_url="https://example.com/cert1.pdf"
        )
        WorkerCertification.objects.create(
            worker_profile=self.worker_profile,
            name="Not Expiring Yet",
            issuing_organization="Org",
            issue_date=timezone.now().date() - timedelta(days=305),
            expiry_date=expiry_later,
            certificate_url="https://example.com/cert2.pdf"
        )
        
        expiring = get_expiring_certifications(self.user)
        
        self.assertEqual(len(expiring), 1)
        self.assertEqual(expiring[0]["name"], "Expiring Soon")

    def test_update_certification_success(self):
        """Test updating certification details"""
        cert = WorkerCertification.objects.create(
            worker_profile=self.worker_profile,
            name="Old Name",
            issuing_organization="Old Org",
            issue_date=timezone.now().date(),
            certificate_url="https://example.com/cert.pdf"
        )
        
        updated = update_certification(
            self.user,
            cert.certificationID,
            {"name": "New Name", "issuing_organization": "New Org"}
        )
        
        self.assertEqual(updated["name"], "New Name")
        self.assertEqual(updated["issuing_organization"], "New Org")

    def test_update_certification_not_owner(self):
        """Test that user cannot update another user's certification"""
        other_user = User.objects.create_user(
            email="other@test.com",
            password="testpass123"
        )
        other_profile = Profile.objects.create(
            user=other_user,
            firstName="Other",
            lastName="Worker",
            profileType="WORKER"
        )
        other_worker_profile = WorkerProfile.objects.create(profile=other_profile)
        
        cert = WorkerCertification.objects.create(
            worker_profile=other_worker_profile,
            name="Test Cert",
            issuing_organization="Test Org",
            issue_date=timezone.now().date(),
            certificate_url="https://example.com/cert.pdf"
        )
        
        with self.assertRaises(Exception):
            update_certification(self.user, cert.certificationID, {"name": "Hacked"})

    def test_delete_certification_success(self):
        """Test deleting certification"""
        cert = WorkerCertification.objects.create(
            worker_profile=self.worker_profile,
            name="To Delete",
            issuing_organization="Org",
            issue_date=timezone.now().date(),
            certificate_url="https://example.com/cert.pdf"
        )
        
        delete_certification(self.user, cert.certificationID)
        
        # Certification should be soft deleted
        cert.refresh_from_db()
        self.assertTrue(cert.deleted)

    def test_verify_certification_admin(self):
        """Test admin can verify certifications"""
        cert = WorkerCertification.objects.create(
            worker_profile=self.worker_profile,
            name="To Verify",
            issuing_organization="Org",
            issue_date=timezone.now().date(),
            certificate_url="https://example.com/cert.pdf"
        )
        
        result = verify_certification(self.admin_user, cert.certificationID)
        
        self.assertTrue(result["is_verified"])

    def test_verify_certification_non_admin(self):
        """Test non-admin cannot verify certifications"""
        cert = WorkerCertification.objects.create(
            worker_profile=self.worker_profile,
            name="To Verify",
            issuing_organization="Org",
            issue_date=timezone.now().date(),
            certificate_url="https://example.com/cert.pdf"
        )
        
        with self.assertRaises(PermissionError):
            verify_certification(self.user, cert.certificationID)

    def test_validate_image_file_size_exceeded(self):
        """Test file size validation"""
        mock_file = Mock()
        mock_file.size = 11 * 1024 * 1024  # 11MB (exceeds 10MB limit)
        mock_file.content_type = "application/pdf"
        
        with self.assertRaises(ValueError) as context:
            validate_image_file(mock_file)
        
        self.assertIn("File size must be less than 10MB", str(context.exception))

    def test_validate_image_file_invalid_type(self):
        """Test file type validation"""
        mock_file = Mock()
        mock_file.size = 1 * 1024 * 1024  # 1MB
        mock_file.content_type = "application/exe"  # Invalid type
        
        with self.assertRaises(ValueError) as context:
            validate_image_file(mock_file)
        
        self.assertIn("Invalid file type", str(context.exception))

    def test_validate_image_file_valid(self):
        """Test validation passes for valid file"""
        mock_file = Mock()
        mock_file.size = 5 * 1024 * 1024  # 5MB
        mock_file.content_type = "application/pdf"
        
        # Should not raise any exceptions
        validate_image_file(mock_file)
