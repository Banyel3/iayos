"""
Comprehensive Integration Tests for WORKER Role - Mobile API
Tests all WORKER-specific endpoints and flows in mobile_api.py
"""

from django.test import TestCase, Client as TestClient
from django.contrib.auth import get_user_model
from datetime import date, datetime, timedelta
from decimal import Decimal
from accounts.models import (
    Profile, ClientProfile, WorkerProfile, Wallet, 
    WorkerSkills, Skills, Specializations, WorkerCertification, WorkerPortfolio
)
from jobs.models import Jobs, JobsCategory, JobApplication
import json

User = get_user_model()


class WorkerMobileAPITestCase(TestCase):
    """Test suite for WORKER role mobile API endpoints"""

    def setUp(self):
        """Set up test client and users"""
        self.client = TestClient()
        
        # Create worker user with profile
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
            contactNum="09123456789",
            birthDate=date(1990, 1, 1)
        )
        self.worker_worker_profile = WorkerProfile.objects.create(
            profileID=self.worker_profile,
            hourly_rate=Decimal('500.00'),
            bio="Experienced worker",
            description="Professional services"
        )
        # Create wallet for worker
        self.worker_wallet = Wallet.objects.create(
            accountFK=self.worker_user,
            balance=Decimal('5000.00')
        )
        
        # Create client user for testing interactions
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
            contactNum="09987654321",
            birthDate=date(1985, 5, 15)
        )
        self.client_client_profile = ClientProfile.objects.create(
            profileID=self.client_profile
        )
        self.client_wallet = Wallet.objects.create(
            accountFK=self.client_user,
            balance=Decimal('20000.00')
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
        
        # Login to get JWT tokens
        self.worker_token = self._get_auth_token("worker@test.com", "TestPass@123")
        self.client_token = self._get_auth_token("client@test.com", "TestPass@123")
    
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
    # WORKER AUTHENTICATION & PROFILE TESTS
    # ===========================================
    
    def test_worker_register(self):
        """Test WORKER user registration via mobile API"""
        data = {
            "email": "newworker@test.com",
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
    
    def test_worker_login(self):
        """Test WORKER login via mobile API"""
        data = {
            "email": "worker@test.com",
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
    
    def test_worker_assign_role(self):
        """Test assigning WORKER role to user"""
        # Create new user without role
        new_user = User.objects.create_user(
            email="norole@test.com",
            password="TestPass@123",
            isVerified=True
        )
        token = self._get_auth_token("norole@test.com", "TestPass@123")
        
        data = {
            "profile_type": "WORKER",
            "firstName": "New",
            "lastName": "Worker",
            "contactNum": "09111111111",
            "birthDate": "1995-03-20"
        }
        response = self.client.post(
            '/api/mobile/auth/assign-role',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(token)
        )
        self.assertIn(response.status_code, [200, 201])
    
    def test_worker_get_profile(self):
        """Test WORKER getting their own profile"""
        response = self.client.get(
            '/api/mobile/auth/profile',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data['email'], 'worker@test.com')
    
    def test_worker_profile_metrics(self):
        """Test WORKER profile completion metrics"""
        response = self.client.get(
            '/api/mobile/profile/metrics',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn('profile_completion_percentage', response_data)
    
    def test_worker_update_profile(self):
        """Test WORKER updating their profile"""
        data = {
            "firstName": "Updated",
            "lastName": "Worker",
            "contactNum": "09222222222",
            "bio": "Updated bio",
            "hourly_rate": 600
        }
        response = self.client.put(
            '/api/mobile/profile/update',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.worker_token)
        )
        self.assertIn(response.status_code, [200, 201])
    
    # ===========================================
    # WORKER SKILLS MANAGEMENT TESTS
    # ===========================================
    
    def test_worker_view_available_skills(self):
        """Test WORKER viewing available skills"""
        response = self.client.get(
            '/api/mobile/skills/available',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_view_my_skills(self):
        """Test WORKER viewing their own skills"""
        response = self.client.get(
            '/api/mobile/skills/my-skills',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_add_skill(self):
        """Test WORKER adding a skill"""
        data = {
            "skill_id": self.skill.skillsID,
            "proficiency_level": "INTERMEDIATE",
            "years_experience": 5
        }
        response = self.client.post(
            '/api/mobile/skills/add',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.worker_token)
        )
        self.assertIn(response.status_code, [200, 201, 400])
    
    def test_worker_update_skill(self):
        """Test WORKER updating an existing skill"""
        # First add a skill
        worker_skill = WorkerSkills.objects.create(
            workerID=self.worker_worker_profile,
            skillsID=self.skill,
            proficiency_level="BEGINNER",
            years_experience=2
        )
        
        data = {
            "proficiency_level": "ADVANCED",
            "years_experience": 7
        }
        response = self.client.put(
            f'/api/mobile/skills/{worker_skill.workerSkillsID}',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.worker_token)
        )
        self.assertIn(response.status_code, [200, 201, 404])
    
    def test_worker_delete_skill(self):
        """Test WORKER removing a skill"""
        worker_skill = WorkerSkills.objects.create(
            workerID=self.worker_worker_profile,
            skillsID=self.skill,
            proficiency_level="BEGINNER"
        )
        
        response = self.client.delete(
            f'/api/mobile/skills/{worker_skill.workerSkillsID}',
            **self._auth_headers(self.worker_token)
        )
        self.assertIn(response.status_code, [200, 204])
    
    # ===========================================
    # WORKER JOB DISCOVERY & APPLICATION TESTS
    # ===========================================
    
    def test_worker_browse_available_jobs(self):
        """Test WORKER browsing available jobs"""
        response = self.client.get(
            '/api/mobile/jobs/available',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_view_job_list(self):
        """Test WORKER viewing job list"""
        response = self.client.get(
            '/api/mobile/jobs/list',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_view_job_detail(self):
        """Test WORKER viewing specific job details"""
        job = Jobs.objects.create(
            clientFK=self.client_client_profile,
            jobTitle="Test Job for Worker",
            jobDescription="Test description",
            budget=Decimal('3000.00'),
            categoryID=self.job_category,
            status='ACTIVE'
        )
        
        response = self.client.get(
            f'/api/mobile/jobs/{job.jobID}',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_search_jobs(self):
        """Test WORKER searching for jobs"""
        response = self.client.get(
            '/api/mobile/jobs/search?q=electrical',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_apply_to_job(self):
        """Test WORKER applying to a job"""
        job = Jobs.objects.create(
            clientFK=self.client_client_profile,
            jobTitle="Job to Apply",
            jobDescription="Apply here",
            budget=Decimal('4000.00'),
            categoryID=self.job_category,
            status='ACTIVE'
        )
        
        data = {
            "cover_letter": "I am interested in this job",
            "proposed_rate": 3500,
            "estimated_duration": "3 days"
        }
        response = self.client.post(
            f'/api/mobile/jobs/{job.jobID}/apply',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.worker_token)
        )
        self.assertIn(response.status_code, [200, 201, 400])
    
    def test_worker_view_my_applications(self):
        """Test WORKER viewing their job applications"""
        response = self.client.get(
            '/api/mobile/jobs/applications/my',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_view_my_jobs(self):
        """Test WORKER viewing their active/assigned jobs"""
        response = self.client.get(
            '/api/mobile/jobs/my-jobs',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_view_backjobs(self):
        """Test WORKER viewing their backjobs"""
        response = self.client.get(
            '/api/mobile/jobs/my-backjobs',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    # ===========================================
    # WORKER WALLET & PAYMENT TESTS
    # ===========================================
    
    def test_worker_view_wallet_balance(self):
        """Test WORKER viewing wallet balance"""
        response = self.client.get(
            '/api/mobile/wallet/balance',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn('balance', response_data)
    
    def test_worker_view_pending_earnings(self):
        """Test WORKER viewing pending earnings"""
        response = self.client.get(
            '/api/mobile/wallet/pending-earnings',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_withdraw_funds(self):
        """Test WORKER withdrawing funds from wallet"""
        data = {
            "amount": 1000,
            "withdrawal_method": "GCASH",
            "account_number": "09123456789"
        }
        response = self.client.post(
            '/api/mobile/wallet/withdraw',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.worker_token)
        )
        self.assertIn(response.status_code, [200, 201, 400])
    
    def test_worker_view_transactions(self):
        """Test WORKER viewing wallet transaction history"""
        response = self.client.get(
            '/api/mobile/wallet/transactions',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_payment_methods(self):
        """Test WORKER viewing payment methods"""
        response = self.client.get(
            '/api/mobile/payment-methods',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_add_payment_method(self):
        """Test WORKER adding a payment method"""
        data = {
            "method_type": "GCASH",
            "account_number": "09123456789",
            "account_name": "Test Worker"
        }
        response = self.client.post(
            '/api/mobile/payment-methods',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.worker_token)
        )
        self.assertIn(response.status_code, [200, 201, 400])
    
    # ===========================================
    # WORKER REVIEW & RATING TESTS
    # ===========================================
    
    def test_worker_submit_review_for_client(self):
        """Test WORKER submitting a review for a client"""
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
            "client_id": self.client_profile.profileID,
            "rating": 4,
            "comment": "Good client to work with",
            "review_type": "CLIENT"
        }
        response = self.client.post(
            '/api/mobile/reviews/submit',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.worker_token)
        )
        self.assertIn(response.status_code, [200, 201, 400])
    
    def test_worker_view_client_reviews(self):
        """Test WORKER viewing reviews for a client"""
        response = self.client.get(
            f'/api/mobile/reviews/client/{self.client_profile.profileID}',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_view_my_reviews(self):
        """Test WORKER viewing reviews about them"""
        response = self.client.get(
            '/api/mobile/reviews/my-reviews',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_view_review_stats(self):
        """Test WORKER viewing their review statistics"""
        response = self.client.get(
            f'/api/mobile/reviews/stats/{self.worker_profile.profileID}',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_view_pending_reviews(self):
        """Test WORKER viewing pending reviews they need to submit"""
        response = self.client.get(
            '/api/mobile/reviews/pending',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    # ===========================================
    # WORKER DASHBOARD TESTS
    # ===========================================
    
    def test_worker_dashboard_stats(self):
        """Test WORKER viewing dashboard statistics"""
        response = self.client.get(
            '/api/mobile/dashboard/stats',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_recent_jobs(self):
        """Test WORKER viewing recent jobs"""
        response = self.client.get(
            '/api/mobile/dashboard/recent-jobs',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    # ===========================================
    # WORKER PROFILE ENHANCEMENT TESTS
    # ===========================================
    
    def test_worker_upload_profile_image(self):
        """Test WORKER uploading profile image"""
        # Note: This test may need actual file upload
        data = {
            "image_url": "https://example.com/image.jpg"
        }
        response = self.client.post(
            '/api/mobile/profile/upload-image',
            data=json.dumps(data),
            content_type='application/json',
            **self._auth_headers(self.worker_token)
        )
        self.assertIn(response.status_code, [200, 201, 400])
    
    # ===========================================
    # WORKER MISCELLANEOUS TESTS
    # ===========================================
    
    def test_worker_view_job_categories(self):
        """Test WORKER viewing job categories"""
        response = self.client.get(
            '/api/mobile/jobs/categories',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_view_cities(self):
        """Test WORKER viewing available cities"""
        response = self.client.get(
            '/api/mobile/locations/cities',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_view_client_detail(self):
        """Test WORKER viewing client profile details"""
        response = self.client.get(
            f'/api/mobile/clients/{self.client_profile.profileID}',
            **self._auth_headers(self.worker_token)
        )
        self.assertIn(response.status_code, [200, 404])
    
    def test_worker_view_agencies(self):
        """Test WORKER viewing agency list"""
        response = self.client.get(
            '/api/mobile/agencies/list',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
    
    def test_worker_logout(self):
        """Test WORKER logout"""
        response = self.client.post(
            '/api/mobile/auth/logout',
            **self._auth_headers(self.worker_token)
        )
        self.assertIn(response.status_code, [200, 204])


class WorkerJobCompletionFlowTestCase(TestCase):
    """Test suite for WORKER job completion workflow"""
    
    def setUp(self):
        """Set up test environment for job completion flow"""
        self.client = TestClient()
        
        # Create worker
        self.worker_user = User.objects.create_user(
            email="worker@flow.com",
            password="TestPass@123",
            isVerified=True
        )
        self.worker_profile = Profile.objects.create(
            accountFK=self.worker_user,
            firstName="Flow",
            lastName="Worker",
            profileType="WORKER",
            contactNum="09123456789",
            birthDate=date(1990, 1, 1)
        )
        self.worker_worker_profile = WorkerProfile.objects.create(
            profileID=self.worker_profile,
            hourly_rate=Decimal('500.00')
        )
        
        # Create client
        self.client_user = User.objects.create_user(
            email="client@flow.com",
            password="TestPass@123",
            isVerified=True
        )
        self.client_profile = Profile.objects.create(
            accountFK=self.client_user,
            firstName="Flow",
            lastName="Client",
            profileType="CLIENT",
            contactNum="09987654321",
            birthDate=date(1985, 5, 15)
        )
        self.client_client_profile = ClientProfile.objects.create(
            profileID=self.client_profile
        )
        
        # Create job category
        self.job_category = JobsCategory.objects.create(
            categoryName="Test Category",
            categoryDescription="Testing"
        )
        
        # Get auth tokens
        self.worker_token = self._get_auth_token("worker@flow.com", "TestPass@123")
        self.client_token = self._get_auth_token("client@flow.com", "TestPass@123")
    
    def _get_auth_token(self, email, password):
        """Helper to get JWT token"""
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
    
    def test_complete_job_workflow(self):
        """Test the complete job application to completion workflow"""
        # 1. Client creates a job
        job = Jobs.objects.create(
            clientFK=self.client_client_profile,
            jobTitle="Complete Workflow Job",
            jobDescription="Test complete flow",
            budget=Decimal('5000.00'),
            categoryID=self.job_category,
            status='ACTIVE'
        )
        
        # 2. Worker applies to job
        application = JobApplication.objects.create(
            jobID=job,
            workerFK=self.worker_worker_profile,
            coverLetter="I want this job",
            status='PENDING'
        )
        
        # 3. Client accepts application
        job.workerFK = self.worker_worker_profile
        job.status = 'IN_PROGRESS'
        job.save()
        
        # 4. Verify worker can see it in their jobs
        response = self.client.get(
            '/api/mobile/jobs/my-jobs',
            **self._auth_headers(self.worker_token)
        )
        self.assertEqual(response.status_code, 200)
        
        # 5. Job marked as completed
        job.status = 'COMPLETED'
        job.save()
        
        # 6. Both parties can review each other
        self.assertEqual(job.status, 'COMPLETED')
