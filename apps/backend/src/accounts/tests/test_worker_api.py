"""
Integration tests for Worker Phase 1 API Endpoints
Tests the API endpoints in accounts/api.py
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
from accounts.models import Profile, WorkerProfile, WorkerCertification, WorkerPortfolio
import json

User = get_user_model()


class WorkerAPIIntegrationTestCase(TestCase):
    def setUp(self):
        """Set up test client and users"""
        self.client = Client()
        
        # Create worker user with profile
        self.worker_user = User.objects.create_user(  # type: ignore[call-arg]
            email="worker@test.com",
            password="testpass123"
        )
        self.worker_profile = Profile.objects.create(
            accountFK=self.worker_user,
            firstName="Test",
            lastName="Worker",
            profileType="WORKER",
            contactNum="09123456789",
            birthDate=date(1990, 1, 1)
        )
        self.worker_worker_profile = WorkerProfile.objects.create(
            profileID=self.worker_profile
        )
        
        # Create client user
        self.client_user = User.objects.create_user(  # type: ignore[call-arg]
            email="client@test.com",
            password="testpass123"
        )
        self.client_profile = Profile.objects.create(
            accountFK=self.client_user,
            firstName="Test",
            lastName="Client",
            profileType="CLIENT",
            contactNum="09876543210",
            birthDate=date(1985, 5, 15)
        )
        
        # Login as worker via API to get JWT cookies
        self._login_user("worker@test.com", "testpass123")
    
    def _login_user(self, email, password):
        """Helper method to log in via API and get JWT cookies"""
        response = self.client.post(
            '/api/accounts/login/',
            data=json.dumps({"email": email, "password": password}),
            content_type='application/json'
        )
        # Cookies are automatically stored in self.client

    def test_update_worker_profile_authenticated(self):
        """Test updating worker profile when authenticated"""
        data = {
            "bio": "Experienced electrician with 10 years",
            "description": "Specialized in residential and commercial work",
            "hourly_rate": 500.00
        }
        
        response = self.client.post(
            "/api/accounts/worker/profile",
            data=json.dumps(data),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["bio"], data["bio"])
        self.assertEqual(float(response_data["hourly_rate"]), data["hourly_rate"])

    def test_update_worker_profile_unauthorized(self):
        """Test updating worker profile without authentication"""
        self.client.logout()
        
        data = {"bio": "Test bio"}
        
        response = self.client.post(
            "/api/accounts/worker/profile",
            data=json.dumps(data),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 401)

    def test_update_worker_profile_wrong_profile_type(self):
        """Test that CLIENT profile type cannot update worker profile"""
        self.client.force_login(self.client_user)
        
        data = {"bio": "Test bio"}
        
        response = self.client.post(
            "/api/accounts/worker/profile",
            data=json.dumps(data),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 403)

    def test_get_profile_completion_authenticated(self):
        """Test getting profile completion when authenticated"""
        response = self.client.get("/api/accounts/worker/profile-completion")
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("completion_percentage", response_data)
        self.assertIn("missing_fields", response_data)
        self.assertIn("completed_fields", response_data)
        self.assertIn("recommendations", response_data)

    def test_add_certification_with_file(self):
        """Test adding certification with file upload"""
        data = {
            "name": "Licensed Electrician",
            "issuing_organization": "PRC",
            "issue_date": str(timezone.now().date()),
            "certificate_url": "https://example.com/cert.pdf"
        }
        
        response = self.client.post(
            "/api/accounts/worker/certifications",
            data=json.dumps(data),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = response.json()
        self.assertEqual(response_data["name"], "Licensed Electrician")
        self.assertFalse(response_data["is_verified"])

    def test_add_certification_missing_required_field(self):
        """Test adding certification with missing required field"""
        data = {
            "name": "Test Cert",
            # Missing issuing_organization and issue_date
        }
        
        response = self.client.post(
            "/api/accounts/worker/certifications",
            data=json.dumps(data),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 400)

    def test_get_certifications_list(self):
        """Test listing certifications"""
        # Create some certifications
        WorkerCertification.objects.create(
            workerID=self.worker_worker_profile,
            name="Cert 1",
            issuing_organization="Org 1",
            issue_date=timezone.now().date(),
            certificate_url="https://example.com/cert1.pdf"
        )
        WorkerCertification.objects.create(
            workerID=self.worker_worker_profile,
            name="Cert 2",
            issuing_organization="Org 2",
            issue_date=timezone.now().date(),
            certificate_url="https://example.com/cert2.pdf"
        )
        
        response = self.client.get("/api/accounts/worker/certifications")
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(len(response_data), 2)

    def test_update_certification_success(self):
        """Test updating certification"""
        cert = WorkerCertification.objects.create(
            workerID=self.worker_worker_profile,
            name="Old Name",
            issuing_organization="Old Org",
            issue_date=timezone.now().date(),
            certificate_url="https://example.com/cert.pdf"
        )
        
        data = {
            "name": "New Name",
            "issuing_organization": "New Org"
        }
        
        response = self.client.put(
            f"/api/accounts/worker/certifications/{cert.certificationID}",
            data=json.dumps(data),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["name"], "New Name")

    def test_update_certification_not_owner(self):
        """Test that user cannot update another user's certification"""
        # Create another worker
        other_user = User.objects.create_user(  # type: ignore[call-arg]
            email="other@test.com",
            password="testpass123"
        )
        other_profile = Profile.objects.create(
            accountFK=other_user,
            firstName="Other",
            lastName="Worker",
            profileType="WORKER",
            contactNum="09999999999",
            birthDate=date(1992, 3, 10)
        )
        other_worker_profile = WorkerProfile.objects.create(profileID=other_profile)
        
        cert = WorkerCertification.objects.create(
            workerID=other_worker_profile,
            name="Other's Cert",
            issuing_organization="Org",
            issue_date=timezone.now().date(),
            certificate_url="https://example.com/cert.pdf"
        )
        
        data = {"name": "Hacked"}
        
        response = self.client.put(
            f"/api/accounts/worker/certifications/{cert.certificationID}",
            data=json.dumps(data),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 403)

    def test_delete_certification_success(self):
        """Test deleting certification"""
        cert = WorkerCertification.objects.create(
            workerID=self.worker_worker_profile,
            name="To Delete",
            issuing_organization="Org",
            issue_date=timezone.now().date(),
            certificate_url="https://example.com/cert.pdf"
        )
        
        response = self.client.delete(
            f"/api/accounts/worker/certifications/{cert.certificationID}"
        )
        
        self.assertEqual(response.status_code, 200)

    def test_upload_portfolio_success(self):
        """Test uploading portfolio image"""
        data = {
            "image_url": "https://example.com/image1.jpg",
            "caption": "Completed electrical installation"
        }
        
        response = self.client.post(
            "/api/accounts/worker/portfolio",
            data=json.dumps(data),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = response.json()
        self.assertEqual(response_data["caption"], "Completed electrical installation")

    def test_get_portfolio_list(self):
        """Test listing portfolio items"""
        # Create portfolio items
        WorkerPortfolio.objects.create(
            workerID=self.worker_worker_profile,
            image_url="https://example.com/image1.jpg",
            caption="Project 1",
            display_order=1
        )
        WorkerPortfolio.objects.create(
            workerID=self.worker_worker_profile,
            image_url="https://example.com/image2.jpg",
            caption="Project 2",
            display_order=2
        )
        
        response = self.client.get("/api/accounts/worker/portfolio")
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(len(response_data), 2)
        # Should be ordered
        self.assertEqual(response_data[0]["display_order"], 1)
        self.assertEqual(response_data[1]["display_order"], 2)

    def test_update_portfolio_caption(self):
        """Test updating portfolio caption"""
        item = WorkerPortfolio.objects.create(
            workerID=self.worker_worker_profile,
            image_url="https://example.com/image1.jpg",
            caption="Old caption",
            display_order=1
        )
        
        data = {"caption": "New updated caption"}
        
        response = self.client.put(
            f"/api/accounts/worker/portfolio/{item.portfolioID}",
            data=json.dumps(data),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["caption"], "New updated caption")

    def test_reorder_portfolio_success(self):
        """Test reordering portfolio items"""
        item1 = WorkerPortfolio.objects.create(
            workerID=self.worker_worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=1
        )
        item2 = WorkerPortfolio.objects.create(
            workerID=self.worker_worker_profile,
            image_url="https://example.com/image2.jpg",
            display_order=2
        )
        item3 = WorkerPortfolio.objects.create(
            workerID=self.worker_worker_profile,
            image_url="https://example.com/image3.jpg",
            display_order=3
        )
        
        # Reverse the order
        data = {
            "order": [item3.portfolioID, item2.portfolioID, item1.portfolioID]
        }
        
        response = self.client.put(
            "/api/accounts/worker/portfolio/reorder",
            data=json.dumps(data),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(len(response_data), 3)
        self.assertEqual(response_data[0]["portfolioID"], item3.portfolioID)

    def test_reorder_portfolio_invalid_order(self):
        """Test reordering with invalid IDs"""
        item1 = WorkerPortfolio.objects.create(
            workerID=self.worker_worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=1
        )
        
        data = {
            "order": [item1.portfolioID, 99999]  # Invalid ID
        }
        
        response = self.client.put(
            "/api/accounts/worker/portfolio/reorder",
            data=json.dumps(data),
            content_type="application/json"
        )
        
        self.assertEqual(response.status_code, 400)

    def test_delete_portfolio_image(self):
        """Test deleting portfolio image"""
        item = WorkerPortfolio.objects.create(
            workerID=self.worker_worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=1
        )
        
        response = self.client.delete(
            f"/api/accounts/worker/portfolio/{item.portfolioID}"
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Verify item is deleted
        with self.assertRaises(WorkerPortfolio.DoesNotExist):
            WorkerPortfolio.objects.get(portfolioID=item.portfolioID)

    def test_profile_completion_updates_on_changes(self):
        """Test that profile completion percentage updates after changes"""
        # Get initial completion
        response1 = self.client.get("/api/accounts/worker/profile-completion")
        initial_percentage = response1.json()["completion_percentage"]
        
        # Update profile
        self.client.post(
            "/api/accounts/worker/profile",
            data=json.dumps({
                "bio": "Test bio",
                "description": "Test description",
                "hourly_rate": 500.00
            }),
            content_type="application/json"
        )
        
        # Get updated completion
        response2 = self.client.get("/api/accounts/worker/profile-completion")
        updated_percentage = response2.json()["completion_percentage"]
        
        # Should have increased
        self.assertGreater(updated_percentage, initial_percentage)
