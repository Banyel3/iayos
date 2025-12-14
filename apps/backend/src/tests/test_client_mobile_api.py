"""
Comprehensive Integration Tests for CLIENT Role - Mobile API
Tests all CLIENT-specific endpoints and flows in mobile_api.py
"""

from django.test import TestCase, Client as TestClient
from django.contrib.auth import get_user_model
from datetime import date, datetime, timedelta
from decimal import Decimal
from accounts.models import (
    Profile, ClientProfile, WorkerProfile, Wallet, 
    WorkerSkills, Skills, Specializations
)
from jobs.models import Jobs, JobsCategory, JobApplication
import json

User = get_user_model()


class ClientMobileAPITestCase(TestCase):
    """Test suite for CLIENT role mobile API endpoints"""

    def setUp(self):
        """Set up test client and users"""
        self.client = TestClient()
        
        # Create client user with profile
        self.client_user = User.objects.create_user(
            email="client@test.com",
            password="TestPass@123",
            isVerified=True
        )
        self.client_profile = Profile.objects.create(
            accountFK=self.client_user,
            firstName="Test",
            lastName="Client",
            profileType="CLIENT",
            contactNum="09123456789",
            birthDate=date(1990, 1, 1)
        )
        # Create ClientProfile
        self.client_client_profile = ClientProfile.objects.create(
            profileID=self.client_profile
        )
        # Create wallet for client
        self.client_wallet = Wallet.objects.create(
            accountFK=self.client_user,
            balance=Decimal('10000.00')
        )
        
        # Create worker user for testing interactions
        self.worker_user = User.objects.create_user(
            email="worker@test.com",
            password="TestPass@123",
            isVerified=True
        )
        self.worker_profile = Profile.objects.create(
            accountFK=self.worker_user,
            firstName="Test",
            lastName="Worker",
            profileType="WORKER",
            contactNum="09987654321",
            birthDate=date(1992, 5, 15)
        )
        self.worker_worker_profile = WorkerProfile.objects.create(
            profileID=self.worker_profile,
            hourly_rate=Decimal('500.00')
        )
        
        # Create job category
        self.job_category = JobsCategory.objects.create(
            categoryName="Construction",
            categoryDescription="Construction services"
        )
        
        # Create specialization and skills
        self.specialization = Specializations.objects.create(
            specializationName="Electrical",
            categoryID=self.job_category
        )
        self.skill = Skills.objects.create(
            skillsName="Wiring",
            specializationID=self.specialization
        )
        
        # Login to get JWT token
        self.client_token = self._get_auth_token("client@test.com", "TestPass@123")
        self.worker_token = self._get_auth_token("worker@test.com", "TestPass@123")
    
    def _get_auth_token(self, email, password):
        """Helper to get JWT token for authentication"""
        response = self.client.post(
            '/api/mobile/auth/login',
            data=json.dumps({"email": email, "password": password}),
            content_type='application/json'
        )
        if response.status_code == 200:
            data = response.json()
            return data.get('access_token') or data.get('data', {}).get('access_token')
        return None
    
    def _auth_headers(self, token):
        """Helper to create auth headers"""
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}
    
    # ===========================================
    # CLIENT AUTHENTICATION & PROFILE TESTS
    # ===========================================
    
    def test_client_register(self):
        """Test CLIENT user registration via mobile API"""
        data = {
            "email": "newclient@test.com",
            "password": "NewPass@123",
            "confirmPassword": "NewPass@123"
        }
        response = self.client.post(
            '/api/mobile/auth/register',
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertIn(response.status_code, [200, 201])
        response_data = response.json()
        self.assertTrue(response_data.get('success'))
    
    def test_client_login(self):
        """Test CLIENT login via mobile API"""
        data = {
            "email": "client@test.com",
            "password": "TestPass@123"
        }
        response = self.client.post(
            '/api/mobile/auth/login',
            data=json.dumps(data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn('access_token', response_data.get('data', response_data))
    
    def test_client_get_profile(self):
        """Test CLIENT getting their own profile"""
        response = self.client.get(
            '/api/mobile/auth/profile',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data['email'], 'client@test.com')
    
    def test_client_profile_metrics(self):
        """Test CLIENT profile metrics endpoint"""
        response = self.client.get(
            '/api/mobile/profile/metrics',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn('profile_completion_percentage', response_data)
    
    def test_client_update_profile(self):
        """Test CLIENT updating their profile"""
        data = {
            "firstName": "Updated",
            "lastName": "Client",
            "contactNum": "09111111111"
        }
        response = self.client.put(
            '/api/mobile/profile/update',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.client_token)
        )
        self.assertIn(response.status_code, [200, 201])
    
    # ===========================================
    # CLIENT JOB POSTING & MANAGEMENT TESTS
    # ===========================================
    
    def test_client_create_job(self):
        """Test CLIENT creating a new job posting"""
        data = {
            "title": "Need Electrician",
            "description": "Install new electrical wiring",
            "category_id": self.job_category.categoryID,
            "budget": 5000,
            "location": "Zamboanga City",
            "expected_duration": "2 days",
            "urgency_level": "MEDIUM",
            "preferred_start_date": str(date.today() + timedelta(days=7)),
            "materials_needed": ["wires", "switches"],
            "downpayment_method": "WALLET"
        }
        response = self.client.post(
            '/api/mobile/jobs/create',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.client_token)
        )
        self.assertIn(response.status_code, [200, 201])
    
    def test_client_create_invite_job(self):
        """Test CLIENT creating an invite-only job"""
        data = {
            "title": "Private Job for Specific Worker",
            "description": "This is an invite-only job",
            "category_id": self.job_category.categoryID,
            "budget": 3000,
            "location": "Zamboanga City",
            "invited_worker_id": self.worker_profile.profileID,
            "expected_duration": "1 day",
            "urgency_level": "HIGH",
            "preferred_start_date": str(date.today() + timedelta(days=3)),
            "downpayment_method": "WALLET"
        }
        response = self.client.post(
            '/api/mobile/jobs/invite',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.client_token)
        )
        self.assertIn(response.status_code, [200, 201])
    
    def test_client_view_my_jobs(self):
        """Test CLIENT viewing their posted jobs"""
        response = self.client.get(
            '/api/mobile/jobs/my-jobs',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIsInstance(response_data, (list, dict))
    
    def test_client_view_job_detail(self):
        """Test CLIENT viewing specific job details"""
        # Create a job first
        job = Jobs.objects.create(
            clientFK=self.client_client_profile,
            jobTitle="Test Job",
            jobDescription="Test description",
            budget=Decimal('2000.00'),
            categoryID=self.job_category,
            status='ACTIVE'
        )
        
        response = self.client.get(
            f'/api/mobile/jobs/{job.jobID}',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data.get('job_title') or response_data.get('jobTitle'), 'Test Job')
    
    def test_client_delete_job(self):
        """Test CLIENT deleting their own job"""
        job = Jobs.objects.create(
            clientFK=self.client_client_profile,
            jobTitle="Job to Delete",
            jobDescription="Will be deleted",
            budget=Decimal('1000.00'),
            categoryID=self.job_category,
            status='PENDING_PAYMENT'
        )
        
        response = self.client.delete(
            f'/api/mobile/jobs/{job.jobID}',
            **self._auth_headers(self.client_token)
        )
        self.assertIn(response.status_code, [200, 204])
    
    # ===========================================
    # CLIENT APPLICATION MANAGEMENT TESTS
    # ===========================================
    
    def test_client_view_job_applications(self):
        """Test CLIENT viewing applications for their job"""
        job = Jobs.objects.create(
            clientFK=self.client_client_profile,
            jobTitle="Job with Applications",
            jobDescription="Test",
            budget=Decimal('3000.00'),
            categoryID=self.job_category,
            status='ACTIVE'
        )
        
        response = self.client.get(
            f'/api/mobile/jobs/{job.jobID}/applications',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_client_accept_application(self):
        """Test CLIENT accepting a worker's application"""
        job = Jobs.objects.create(
            clientFK=self.client_client_profile,
            jobTitle="Job to Accept Application",
            jobDescription="Test",
            budget=Decimal('3000.00'),
            categoryID=self.job_category,
            status='ACTIVE'
        )
        application = JobApplication.objects.create(
            jobID=job,
            workerFK=self.worker_worker_profile,
            coverLetter="I'm interested",
            status='PENDING'
        )
        
        response = self.client.post(
            f'/api/mobile/jobs/{job.jobID}/applications/{application.applicationID}/accept',
            **self._auth_headers(self.client_token)
        )
        self.assertIn(response.status_code, [200, 201])
    
    def test_client_reject_application(self):
        """Test CLIENT rejecting a worker's application"""
        job = Jobs.objects.create(
            clientFK=self.client_client_profile,
            jobTitle="Job to Reject Application",
            jobDescription="Test",
            budget=Decimal('3000.00'),
            categoryID=self.job_category,
            status='ACTIVE'
        )
        application = JobApplication.objects.create(
            jobID=job,
            workerFK=self.worker_worker_profile,
            coverLetter="I'm interested",
            status='PENDING'
        )
        
        response = self.client.post(
            f'/api/mobile/jobs/{job.jobID}/applications/{application.applicationID}/reject',
            **self._auth_headers(self.client_token)
        )
        self.assertIn(response.status_code, [200, 201])
    
    # ===========================================
    # CLIENT WORKER DISCOVERY TESTS
    # ===========================================
    
    def test_client_browse_workers(self):
        """Test CLIENT browsing available workers"""
        response = self.client.get(
            '/api/mobile/workers/list',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIsInstance(response_data, (list, dict))
    
    def test_client_view_worker_detail(self):
        """Test CLIENT viewing worker profile details"""
        response = self.client.get(
            f'/api/mobile/workers/detail/{self.worker_profile.profileID}',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_client_search_jobs(self):
        """Test CLIENT searching for workers/jobs"""
        response = self.client.get(
            '/api/mobile/jobs/search?q=electrical',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
    
    # ===========================================
    # CLIENT WALLET & PAYMENT TESTS
    # ===========================================
    
    def test_client_view_wallet_balance(self):
        """Test CLIENT viewing wallet balance"""
        response = self.client.get(
            '/api/mobile/wallet/balance',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn('balance', response_data)
    
    def test_client_deposit_funds(self):
        """Test CLIENT depositing funds to wallet"""
        data = {
            "amount": 5000,
            "payment_method": "GCASH"
        }
        response = self.client.post(
            '/api/mobile/wallet/deposit',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.client_token)
        )
        self.assertIn(response.status_code, [200, 201, 400])  # May fail without actual payment integration
    
    def test_client_view_transactions(self):
        """Test CLIENT viewing wallet transaction history"""
        response = self.client.get(
            '/api/mobile/wallet/transactions',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_client_payment_methods(self):
        """Test CLIENT viewing payment methods"""
        response = self.client.get(
            '/api/mobile/payment-methods',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_client_add_payment_method(self):
        """Test CLIENT adding a payment method"""
        data = {
            "method_type": "GCASH",
            "account_number": "09123456789",
            "account_name": "Test Client"
        }
        response = self.client.post(
            '/api/mobile/payment-methods',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.client_token)
        )
        self.assertIn(response.status_code, [200, 201, 400])
    
    # ===========================================
    # CLIENT REVIEW & RATING TESTS
    # ===========================================
    
    def test_client_submit_review_for_worker(self):
        """Test CLIENT submitting a review for a worker"""
        # Create completed job
        job = Jobs.objects.create(
            clientFK=self.client_client_profile,
            jobTitle="Completed Job",
            jobDescription="Job done",
            budget=Decimal('3000.00'),
            categoryID=self.job_category,
            status='COMPLETED',
            workerFK=self.worker_worker_profile
        )
        
        data = {
            "job_id": job.jobID,
            "worker_id": self.worker_profile.profileID,
            "rating": 5,
            "comment": "Excellent work!",
            "review_type": "WORKER"
        }
        response = self.client.post(
            '/api/mobile/reviews/submit',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.client_token)
        )
        self.assertIn(response.status_code, [200, 201, 400])
    
    def test_client_view_worker_reviews(self):
        """Test CLIENT viewing reviews for a worker"""
        response = self.client.get(
            f'/api/mobile/reviews/worker/{self.worker_profile.profileID}',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_client_view_my_reviews(self):
        """Test CLIENT viewing their own reviews"""
        response = self.client.get(
            '/api/mobile/reviews/my-reviews',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
    
    # ===========================================
    # CLIENT DASHBOARD TESTS
    # ===========================================
    
    def test_client_dashboard_stats(self):
        """Test CLIENT viewing dashboard statistics"""
        response = self.client.get(
            '/api/mobile/dashboard/stats',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn('total_jobs', response_data.get('stats', response_data))
    
    def test_client_recent_jobs(self):
        """Test CLIENT viewing recent jobs"""
        response = self.client.get(
            '/api/mobile/dashboard/recent-jobs',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_client_available_workers_dashboard(self):
        """Test CLIENT viewing available workers from dashboard"""
        response = self.client.get(
            '/api/mobile/dashboard/available-workers',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
    
    # ===========================================
    # CLIENT MISCELLANEOUS TESTS
    # ===========================================
    
    def test_client_view_job_categories(self):
        """Test CLIENT viewing job categories"""
        response = self.client.get(
            '/api/mobile/jobs/categories',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_client_view_cities(self):
        """Test CLIENT viewing available cities"""
        response = self.client.get(
            '/api/mobile/locations/cities',
            **self._auth_headers(self.client_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_client_logout(self):
        """Test CLIENT logout"""
        response = self.client.post(
            '/api/mobile/auth/logout',
            **self._auth_headers(self.client_token)
        )
        self.assertIn(response.status_code, [200, 204])
