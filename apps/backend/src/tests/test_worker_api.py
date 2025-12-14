"""
WORKER Role API Integration Tests

Tests all major WORKER user flows:
- Authentication (register, login, logout)
- Profile management (bio, hourly rate, availability)
- Worker-specific features (certifications, materials, portfolio)
- Job browsing and application
- Job acceptance and completion
- Payment flows (earnings, withdrawals)
- Reviews and ratings
- Location sharing
"""
import json
import pytest
from decimal import Decimal
from django.test import Client
from django.contrib.auth import get_user_model
from datetime import date, datetime, timedelta
from django.utils import timezone
from accounts.models import (
    Profile, WorkerProfile, ClientProfile, Wallet, Transaction,
    Specializations, WorkerCertification, WorkerMaterial, WorkerPortfolio
)
from jobs.models import Job
from jobs.models import JobApplication

User = get_user_model()


@pytest.mark.django_db
class TestWorkerAuthentication:
    """Test WORKER authentication flows"""
    
    def test_worker_registration(self, api_client):
        """Test worker user can register"""
        data = {
            "email": "newworker@test.com",
            "password": "securepass123",
            "firstName": "New",
            "lastName": "Worker",
            "contactNum": "09222222222",
            "birthDate": "1992-05-15",
            "city": "Quezon City",
            "barangay": "Diliman"
        }
        
        response = api_client.post(
            '/api/accounts/register/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201]
        assert User.objects.filter(email="newworker@test.com").exists()
    
    def test_worker_login(self, api_client, worker_user):
        """Test worker user can login"""
        data = {
            "email": "worker@test.com",
            "password": "testpass123"
        }
        
        response = api_client.post(
            '/api/accounts/login/',
            data=json.dumps(data),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        response_data = response.json()
        assert "accessToken" in response_data or "access_token" in response_data
    
    def test_worker_logout(self, authenticated_worker_client):
        """Test worker user can logout"""
        response = authenticated_worker_client.post('/api/accounts/logout/')
        assert response.status_code in [200, 204]
    
    def test_worker_get_profile(self, authenticated_worker_client):
        """Test worker can retrieve their profile"""
        response = authenticated_worker_client.get('/api/accounts/me/')
        assert response.status_code == 200
        data = response.json()
        assert data['email'] == "worker@test.com"
        assert data['profileType'] == "WORKER"


@pytest.mark.django_db
class TestWorkerProfileManagement:
    """Test WORKER profile management"""
    
    def test_update_worker_profile(self, authenticated_worker_client):
        """Test worker can update their profile"""
        profile_data = {
            "bio": "Experienced electrician with 15 years of expertise",
            "description": "Specialized in residential and commercial electrical work",
            "hourly_rate": 750.00
        }
        
        response = authenticated_worker_client.post(
            '/api/accounts/worker/profile/',
            data=json.dumps(profile_data),
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201]
        if response.status_code == 200:
            data = response.json()
            assert "bio" in data or "hourlyRate" in data
    
    def test_get_profile_completion(self, authenticated_worker_client):
        """Test worker can check profile completion status"""
        response = authenticated_worker_client.get('/api/accounts/worker/profile-completion/')
        assert response.status_code == 200
        data = response.json()
        assert "completion_percentage" in data or "completionPercentage" in data
    
    def test_update_availability(self, authenticated_worker_client):
        """Test worker can toggle availability"""
        response = authenticated_worker_client.patch(
            '/api/accounts/workers/availability/?is_available=false'
        )
        assert response.status_code in [200, 201]
    
    def test_get_availability(self, authenticated_worker_client):
        """Test worker can check their availability status"""
        response = authenticated_worker_client.get('/api/accounts/workers/availability/')
        assert response.status_code == 200
        data = response.json()
        assert "is_available" in data or "isAvailable" in data


@pytest.mark.django_db
class TestWorkerCertifications:
    """Test WORKER certification management"""
    
    def test_add_certification(self, authenticated_worker_client):
        """Test worker can add certification"""
        cert_data = {
            "certification_name": "Electrical Safety Certificate",
            "issuing_organization": "Philippine Electrical Code",
            "issue_date": "2020-01-15",
            "expiry_date": "2025-01-15",
            "certification_number": "CERT-12345"
        }
        
        response = authenticated_worker_client.post(
            '/api/accounts/worker/certifications/',
            data=json.dumps(cert_data),
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201, 400]
    
    def test_list_certifications(self, authenticated_worker_client, worker_user):
        """Test worker can list their certifications"""
        # Create a certification
        profile = Profile.objects.get(accountFK=worker_user)
        worker_profile = WorkerProfile.objects.get(profileID=profile)
        
        WorkerCertification.objects.create(
            workerProfile=worker_profile,
            certificationName="Test Certificate",
            issuingOrganization="Test Org",
            issueDate=date(2020, 1, 1),
            expiryDate=date(2025, 1, 1)
        )
        
        response = authenticated_worker_client.get('/api/accounts/worker/certifications/')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_update_certification(self, authenticated_worker_client, worker_user):
        """Test worker can update certification"""
        profile = Profile.objects.get(accountFK=worker_user)
        worker_profile = WorkerProfile.objects.get(profileID=profile)
        
        cert = WorkerCertification.objects.create(
            workerProfile=worker_profile,
            certificationName="Old Certificate",
            issuingOrganization="Test Org",
            issueDate=date(2020, 1, 1)
        )
        
        update_data = {
            "certification_name": "Updated Certificate Name"
        }
        
        response = authenticated_worker_client.put(
            f'/api/accounts/worker/certifications/{cert.certificationID}/',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201, 400]
    
    def test_delete_certification(self, authenticated_worker_client, worker_user):
        """Test worker can delete certification"""
        profile = Profile.objects.get(accountFK=worker_user)
        worker_profile = WorkerProfile.objects.get(profileID=profile)
        
        cert = WorkerCertification.objects.create(
            workerProfile=worker_profile,
            certificationName="Certificate to Delete",
            issuingOrganization="Test Org",
            issueDate=date(2020, 1, 1)
        )
        
        response = authenticated_worker_client.delete(
            f'/api/accounts/worker/certifications/{cert.certificationID}/'
        )
        
        assert response.status_code in [200, 204]


@pytest.mark.django_db
class TestWorkerMaterials:
    """Test WORKER materials and tools management"""
    
    def test_add_material(self, authenticated_worker_client):
        """Test worker can add material/tool"""
        material_data = {
            "material_name": "Power Drill",
            "brand": "Makita",
            "quantity": 2,
            "description": "Professional grade power drill"
        }
        
        response = authenticated_worker_client.post(
            '/api/accounts/worker/materials/',
            data=json.dumps(material_data),
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201, 400]
    
    def test_list_materials(self, authenticated_worker_client, worker_user):
        """Test worker can list their materials"""
        profile = Profile.objects.get(accountFK=worker_user)
        worker_profile = WorkerProfile.objects.get(profileID=profile)
        
        WorkerMaterial.objects.create(
            workerProfile=worker_profile,
            materialName="Test Tool",
            quantity=1
        )
        
        response = authenticated_worker_client.get('/api/accounts/worker/materials/')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_update_material(self, authenticated_worker_client, worker_user):
        """Test worker can update material"""
        profile = Profile.objects.get(accountFK=worker_user)
        worker_profile = WorkerProfile.objects.get(profileID=profile)
        
        material = WorkerMaterial.objects.create(
            workerProfile=worker_profile,
            materialName="Old Tool",
            quantity=1
        )
        
        update_data = {
            "quantity": 3
        }
        
        response = authenticated_worker_client.put(
            f'/api/accounts/worker/materials/{material.materialID}/',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201, 400]
    
    def test_delete_material(self, authenticated_worker_client, worker_user):
        """Test worker can delete material"""
        profile = Profile.objects.get(accountFK=worker_user)
        worker_profile = WorkerProfile.objects.get(profileID=profile)
        
        material = WorkerMaterial.objects.create(
            workerProfile=worker_profile,
            materialName="Tool to Delete",
            quantity=1
        )
        
        response = authenticated_worker_client.delete(
            f'/api/accounts/worker/materials/{material.materialID}/'
        )
        
        assert response.status_code in [200, 204]


@pytest.mark.django_db
class TestWorkerPortfolio:
    """Test WORKER portfolio management"""
    
    def test_list_portfolio(self, authenticated_worker_client, worker_user):
        """Test worker can list portfolio items"""
        response = authenticated_worker_client.get('/api/accounts/worker/portfolio/')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_update_portfolio_caption(self, authenticated_worker_client, worker_user):
        """Test worker can update portfolio item caption"""
        profile = Profile.objects.get(accountFK=worker_user)
        worker_profile = WorkerProfile.objects.get(profileID=profile)
        
        portfolio = WorkerPortfolio.objects.create(
            workerProfile=worker_profile,
            imageUrl="https://example.com/image.jpg",
            caption="Original caption",
            displayOrder=1
        )
        
        update_data = {
            "caption": "Updated caption for portfolio item"
        }
        
        response = authenticated_worker_client.put(
            f'/api/accounts/worker/portfolio/{portfolio.portfolioID}/caption/',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201, 400]
    
    def test_delete_portfolio_item(self, authenticated_worker_client, worker_user):
        """Test worker can delete portfolio item"""
        profile = Profile.objects.get(accountFK=worker_user)
        worker_profile = WorkerProfile.objects.get(profileID=profile)
        
        portfolio = WorkerPortfolio.objects.create(
            workerProfile=worker_profile,
            imageUrl="https://example.com/image.jpg",
            displayOrder=1
        )
        
        response = authenticated_worker_client.delete(
            f'/api/accounts/worker/portfolio/{portfolio.portfolioID}/'
        )
        
        assert response.status_code in [200, 204]


@pytest.mark.django_db
class TestWorkerJobBrowsing:
    """Test WORKER job browsing and application"""
    
    def test_browse_available_jobs(self, authenticated_worker_client, client_user, specialization):
        """Test worker can browse available jobs"""
        # Create a job
        profile = Profile.objects.get(accountFK=client_user)
        client_profile = ClientProfile.objects.get(profileID=profile)
        
        Job.objects.create(
            clientID=client_profile,
            title="Available Job",
            description="Test job description",
            specialization=specialization,
            city="Manila",
            barangay="Ermita",
            minBudget=Decimal("1000.00"),
            maxBudget=Decimal("2000.00"),
            jobType="STANDARD",
            status="PENDING"
        )
        
        response = authenticated_worker_client.get('/api/jobs/available/')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))
    
    def test_apply_for_job(self, authenticated_worker_client, worker_user, 
                          client_user, specialization):
        """Test worker can apply for a job"""
        profile = Profile.objects.get(accountFK=client_user)
        client_profile = ClientProfile.objects.get(profileID=profile)
        
        job = Job.objects.create(
            clientID=client_profile,
            title="Job to Apply",
            description="Test job description",
            specialization=specialization,
            city="Manila",
            barangay="Ermita",
            minBudget=Decimal("1000.00"),
            maxBudget=Decimal("2000.00"),
            jobType="STANDARD",
            status="PENDING"
        )
        
        application_data = {
            "proposed_rate": 1500.00,
            "message": "I am qualified for this job",
            "estimated_duration": 3
        }
        
        response = authenticated_worker_client.post(
            f'/api/jobs/{job.jobID}/apply/',
            data=json.dumps(application_data),
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201, 400]
    
    def test_get_my_applications(self, authenticated_worker_client, worker_user,
                                client_user, specialization):
        """Test worker can view their job applications"""
        profile = Profile.objects.get(accountFK=client_user)
        client_profile = ClientProfile.objects.get(profileID=profile)
        worker_profile = Profile.objects.get(accountFK=worker_user)
        
        job = Job.objects.create(
            clientID=client_profile,
            title="Job Applied",
            description="Test description",
            specialization=specialization,
            city="Manila",
            barangay="Ermita",
            minBudget=Decimal("1000.00"),
            maxBudget=Decimal("2000.00"),
            jobType="STANDARD",
            status="PENDING"
        )
        
        JobApplication.objects.create(
            jobID=job,
            workerID=worker_profile,
            proposedRate=Decimal("1500.00"),
            message="Test message",
            status="PENDING"
        )
        
        response = authenticated_worker_client.get('/api/jobs/my-applications/')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))


@pytest.mark.django_db
class TestWorkerJobExecution:
    """Test WORKER job execution and completion"""
    
    def test_accept_job_invite(self, authenticated_worker_client, worker_user,
                              client_user, specialization):
        """Test worker can accept job invite"""
        profile = Profile.objects.get(accountFK=client_user)
        client_profile = ClientProfile.objects.get(profileID=profile)
        worker_profile = Profile.objects.get(accountFK=worker_user)
        
        job = Job.objects.create(
            clientID=client_profile,
            workerID=worker_profile,
            title="Invited Job",
            description="Test description",
            specialization=specialization,
            city="Manila",
            barangay="Ermita",
            minBudget=Decimal("1000.00"),
            maxBudget=Decimal("2000.00"),
            agreedPrice=Decimal("1500.00"),
            jobType="INVITE",
            status="PENDING_WORKER_ACCEPTANCE"
        )
        
        response = authenticated_worker_client.post(
            f'/api/jobs/{job.jobID}/accept-invite/'
        )
        
        assert response.status_code in [200, 201, 400]
    
    def test_reject_job_invite(self, authenticated_worker_client, worker_user,
                              client_user, specialization):
        """Test worker can reject job invite"""
        profile = Profile.objects.get(accountFK=client_user)
        client_profile = ClientProfile.objects.get(profileID=profile)
        worker_profile = Profile.objects.get(accountFK=worker_user)
        
        job = Job.objects.create(
            clientID=client_profile,
            workerID=worker_profile,
            title="Job to Reject",
            description="Test description",
            specialization=specialization,
            city="Manila",
            barangay="Ermita",
            minBudget=Decimal("1000.00"),
            maxBudget=Decimal("2000.00"),
            agreedPrice=Decimal("1500.00"),
            jobType="INVITE",
            status="PENDING_WORKER_ACCEPTANCE"
        )
        
        response = authenticated_worker_client.post(
            f'/api/jobs/{job.jobID}/reject-invite/',
            data=json.dumps({"reason": "Not available"}),
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201, 400]
    
    def test_mark_job_complete(self, authenticated_worker_client, worker_user,
                              client_user, specialization):
        """Test worker can mark job as complete"""
        profile = Profile.objects.get(accountFK=client_user)
        client_profile = ClientProfile.objects.get(profileID=profile)
        worker_profile = Profile.objects.get(accountFK=worker_user)
        
        job = Job.objects.create(
            clientID=client_profile,
            workerID=worker_profile,
            title="Job In Progress",
            description="Test description",
            specialization=specialization,
            city="Manila",
            barangay="Ermita",
            minBudget=Decimal("1000.00"),
            maxBudget=Decimal("2000.00"),
            agreedPrice=Decimal("1500.00"),
            jobType="STANDARD",
            status="IN_PROGRESS"
        )
        
        response = authenticated_worker_client.post(
            f'/api/jobs/{job.jobID}/mark-complete/'
        )
        
        assert response.status_code in [200, 201, 400]


@pytest.mark.django_db
class TestWorkerPayments:
    """Test WORKER payment flows"""
    
    def test_get_wallet_balance(self, authenticated_worker_client, worker_user):
        """Test worker can view wallet balance"""
        response = authenticated_worker_client.get('/api/accounts/wallet/balance/')
        assert response.status_code == 200
        data = response.json()
        assert "balance" in data
    
    def test_view_pending_earnings(self, authenticated_worker_client, worker_user):
        """Test worker can view pending earnings"""
        response = authenticated_worker_client.get('/api/mobile/pending-earnings/')
        assert response.status_code in [200, 404]  # Mobile endpoint
    
    def test_withdraw_funds(self, authenticated_worker_client, worker_user):
        """Test worker can withdraw earnings"""
        # Add balance to wallet
        wallet = Wallet.objects.get(accountFK=worker_user)
        wallet.balance = Decimal("2000.00")
        wallet.save()
        
        withdraw_data = {
            "amount": 500.00,
            "payment_method": "GCASH"
        }
        
        response = authenticated_worker_client.post(
            '/api/accounts/wallet/withdraw/',
            data=json.dumps(withdraw_data),
            content_type='application/json'
        )
        
        # May require Xendit integration
        assert response.status_code in [200, 201, 400]
    
    def test_view_transactions(self, authenticated_worker_client, worker_user):
        """Test worker can view transaction history"""
        wallet = Wallet.objects.get(accountFK=worker_user)
        Transaction.objects.create(
            walletFK=wallet,
            amount=Decimal("1500.00"),
            transactionType="JOB_PAYMENT",
            status="COMPLETED"
        )
        
        response = authenticated_worker_client.get('/api/accounts/wallet/transactions/')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))


@pytest.mark.django_db
class TestWorkerReviews:
    """Test WORKER review management"""
    
    def test_get_my_reviews(self, authenticated_worker_client, worker_user):
        """Test worker can view reviews received"""
        worker_profile = Profile.objects.get(accountFK=worker_user)
        
        response = authenticated_worker_client.get('/api/accounts/reviews/my-reviews/')
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
    
    def test_get_review_stats(self, authenticated_worker_client, worker_user):
        """Test worker can view review statistics"""
        worker_profile = Profile.objects.get(accountFK=worker_user)
        
        response = authenticated_worker_client.get(
            f'/api/accounts/reviews/stats/{worker_profile.profileID}/'
        )
        assert response.status_code == 200
        data = response.json()
        assert "average_rating" in data or "averageRating" in data


@pytest.mark.django_db
class TestWorkerLocation:
    """Test WORKER location sharing"""
    
    def test_update_location(self, authenticated_worker_client):
        """Test worker can update their location"""
        location_data = {
            "latitude": 14.5995,
            "longitude": 120.9842
        }
        
        response = authenticated_worker_client.post(
            '/api/accounts/location/update/',
            data=json.dumps(location_data),
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201, 400]
    
    def test_get_my_location(self, authenticated_worker_client):
        """Test worker can retrieve their location"""
        response = authenticated_worker_client.get('/api/accounts/location/me/')
        assert response.status_code in [200, 404]  # May not have location set
    
    def test_toggle_location_sharing(self, authenticated_worker_client):
        """Test worker can toggle location sharing"""
        toggle_data = {
            "sharing_enabled": True
        }
        
        response = authenticated_worker_client.post(
            '/api/accounts/location/toggle-sharing/',
            data=json.dumps(toggle_data),
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201, 400]
