from django.test import TestCase
from accounts.models import Accounts, Profile, WorkerProfile
from .models import ProfileProduct
from .services import create_profile_product


class ProfileProductServiceTests(TestCase):
    def setUp(self):
        # Create a test account and profile
        self.user = Accounts.objects.create_user(email="worker@example.com", password="pass123")
        self.profile = Profile.objects.create(
            accountFK=self.user,
            profileImg="",
            firstName="Test",
            lastName="Worker",
            contactNum="09123456789",
            birthDate="1990-01-01",
            profileType=Profile.ProfileType.WORKER,
        )

        # Create WorkerProfile
        self.worker_profile = WorkerProfile.objects.create(
            profileID=self.profile,
            description="Test worker",
            workerRating=0,
            totalEarningGross=0,
        )

    def test_create_product(self):
        data = {"name": "Oil", "description": "Engine oil", "price": 150.00, "available": True}
        result = create_profile_product(self.user, data)

        # Ensure response contains productID
        self.assertIn("productID", result)

        # Ensure the product exists in DB
        prod = ProfileProduct.objects.get(productID=result["productID"])
        self.assertEqual(prod.name, "Oil")
        self.assertEqual(prod.description, "Engine oil")
        self.assertEqual(float(prod.price), 150.00)
        self.assertTrue(prod.available)
