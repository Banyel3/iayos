"""
Shared test fixtures and configuration for all tests
"""
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date
from decimal import Decimal
from accounts.models import (
    Profile, WorkerProfile, ClientProfile, Wallet, 
    Specializations, WorkerCertification, WorkerPortfolio
)
from jobs.models import Job

User = get_user_model()


@pytest.fixture
def api_client():
    """Provide Django test client for API requests"""
    from django.test import Client
    return Client()


@pytest.fixture
def worker_user(db):
    """Create a worker user with complete profile"""
    user = User.objects.create_user(
        email="worker@test.com",
        password="testpass123",
        emailConfirmed=True
    )
    profile = Profile.objects.create(
        accountFK=user,
        firstName="Test",
        lastName="Worker",
        profileType="WORKER",
        contactNum="09123456789",
        birthDate=date(1990, 1, 1),
        city="Manila",
        barangay="Ermita"
    )
    worker_profile = WorkerProfile.objects.create(
        profileID=profile,
        bio="Experienced worker",
        hourlyRate=Decimal("500.00"),
        isAvailable=True
    )
    # Create wallet
    Wallet.objects.create(
        accountFK=user,
        balance=Decimal("0.00")
    )
    return user


@pytest.fixture
def client_user(db):
    """Create a client user with complete profile"""
    user = User.objects.create_user(
        email="client@test.com",
        password="testpass123",
        emailConfirmed=True
    )
    profile = Profile.objects.create(
        accountFK=user,
        firstName="Test",
        lastName="Client",
        profileType="CLIENT",
        contactNum="09876543210",
        birthDate=date(1985, 5, 15),
        city="Quezon City",
        barangay="Diliman"
    )
    ClientProfile.objects.create(
        profileID=profile
    )
    # Create wallet with initial balance
    Wallet.objects.create(
        accountFK=user,
        balance=Decimal("5000.00")
    )
    return user


@pytest.fixture
def specialization(db):
    """Create a test specialization"""
    return Specializations.objects.create(
        title="Electrical Work",
        description="Electrical installation and repair"
    )


@pytest.fixture
def authenticated_worker_client(api_client, worker_user):
    """Provide authenticated API client as worker"""
    api_client.force_login(worker_user)
    return api_client


@pytest.fixture
def authenticated_client_client(api_client, client_user):
    """Provide authenticated API client as client"""
    api_client.force_login(client_user)
    return api_client
