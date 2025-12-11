"""
Unit tests for Portfolio Service
Tests the portfolio_service.py functions
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from accounts.models import Profile, WorkerProfile, WorkerPortfolio
from accounts.portfolio_service import (
    upload_portfolio_image,
    get_portfolio,
    update_portfolio_caption,
    reorder_portfolio,
    delete_portfolio_image,
    validate_image_file,
)
from unittest.mock import Mock, patch

User = get_user_model()


class PortfolioServiceTestCase(TestCase):
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

    @patch('accounts.portfolio_service.upload_worker_portfolio')
    def test_upload_portfolio_image_success(self, mock_upload):
        """Test uploading a portfolio image"""
        mock_upload.return_value = "https://example.com/portfolio/test.jpg"
        
        mock_file = Mock()
        mock_file.size = 1 * 1024 * 1024  # 1MB
        mock_file.content_type = "image/jpeg"
        mock_file.name = "test.jpg"
        
        result = upload_portfolio_image(
            self.worker_profile,
            mock_file,
            caption="Completed electrical installation"
        )
        
        self.assertEqual(result["caption"], "Completed electrical installation")
        self.assertEqual(result["display_order"], 0)  # First image

    @patch('accounts.portfolio_service.upload_worker_portfolio')
    def test_upload_portfolio_image_auto_order(self, mock_upload):
        """Test that display_order is automatically incremented"""
        mock_upload.return_value = "https://example.com/portfolio/test2.jpg"
        # Upload first image
        WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=0
        )
        
        # Upload second image
        mock_file = Mock()
        mock_file.size = 1 * 1024 * 1024
        mock_file.content_type = "image/jpeg"
        mock_file.name = "test2.jpg"
        
        result = upload_portfolio_image(self.worker_profile, mock_file, "Second project")
        
        self.assertEqual(result["display_order"], 1)

    def test_get_portfolio_ordered(self):
        """Test that portfolio items are returned in display_order"""
        # Create items out of order
        WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image3.jpg",
            display_order=2
        )
        WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=0
        )
        WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image2.jpg",
            display_order=1
        )
        
        portfolio = get_portfolio(self.worker_profile)
        
        self.assertEqual(len(portfolio), 3)
        self.assertEqual(portfolio[0]["display_order"], 0)
        self.assertEqual(portfolio[1]["display_order"], 1)
        self.assertEqual(portfolio[2]["display_order"], 2)

    def test_update_portfolio_caption_success(self):
        """Test updating portfolio item caption"""
        item = WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            caption="Old caption",
            display_order=0
        )
        
        updated = update_portfolio_caption(
            self.worker_profile,
            item.portfolioID,
            "New updated caption"
        )
        
        self.assertEqual(updated["caption"], "New updated caption")

    def test_update_portfolio_caption_not_owner(self):
        """Test that user cannot update another user's portfolio"""
        other_user = User.objects.create_user(  # type: ignore[call-arg]
            email="other@test.com",
            password="testpass123"
        )
        other_profile = Profile.objects.create(
            accountFK=other_user,
            firstName="Other",
            lastName="Worker",
            profileType="WORKER",
            contactNum="09123456789",
            birthDate="1990-01-01"
        )
        other_worker_profile = WorkerProfile.objects.create(profileID=other_profile)
        
        item = WorkerPortfolio.objects.create(
            workerID=other_worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=0
        )
        
        with self.assertRaises(Exception):
            update_portfolio_caption(self.worker_profile, item.portfolioID, "Hacked")

    def test_reorder_portfolio_valid_order(self):
        """Test reordering portfolio items"""
        # Create 3 items
        item1 = WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=0
        )
        item2 = WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image2.jpg",
            display_order=1
        )
        item3 = WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image3.jpg",
            display_order=2
        )
        
        # Reorder: swap first and last
        new_order = [item3.portfolioID, item2.portfolioID, item1.portfolioID]
        
        result = reorder_portfolio(self.worker_profile, new_order)
        
        # Check result is a success dict
        self.assertTrue(result['success'])
        self.assertEqual(result['reordered_count'], 3)
        
        # Verify new order in database
        portfolio = get_portfolio(self.worker_profile)
        self.assertEqual(portfolio[0]["portfolioID"], item3.portfolioID)
        self.assertEqual(portfolio[1]["portfolioID"], item2.portfolioID)
        self.assertEqual(portfolio[2]["portfolioID"], item1.portfolioID)
        self.assertEqual(portfolio[0]["display_order"], 0)
        self.assertEqual(portfolio[1]["display_order"], 1)
        self.assertEqual(portfolio[2]["display_order"], 2)

    def test_reorder_portfolio_invalid_order(self):
        """Test reordering with invalid item IDs"""
        item1 = WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=0
        )
        
        # Try to reorder with non-existent ID
        invalid_order = [item1.portfolioID, 99999]
        
        with self.assertRaises(Exception):
            reorder_portfolio(self.worker_profile, invalid_order)

    def test_delete_portfolio_image_success(self):
        """Test deleting a portfolio image"""
        item = WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=0
        )
        
        delete_portfolio_image(self.worker_profile, item.portfolioID)
        
        # Item should be deleted
        with self.assertRaises(WorkerPortfolio.DoesNotExist):
            WorkerPortfolio.objects.get(portfolioID=item.portfolioID)

    def test_delete_portfolio_image_reorders_remaining(self):
        """Test that remaining items are reordered after deletion"""
        item1 = WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=0
        )
        item2 = WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image2.jpg",
            display_order=1
        )
        item3 = WorkerPortfolio.objects.create(
            workerID=self.worker_profile,
            image_url="https://example.com/image3.jpg",
            display_order=2
        )
        
        # Delete middle item
        delete_portfolio_image(self.worker_profile, item2.portfolioID)
        
        # Check remaining items are reordered
        remaining = get_portfolio(self.worker_profile)
        self.assertEqual(len(remaining), 2)
        self.assertEqual(remaining[0]["display_order"], 0)
        self.assertEqual(remaining[1]["display_order"], 1)

    def test_validate_image_file_size_exceeded(self):
        """Test image file size validation"""
        mock_file = Mock()
        mock_file.size = 6 * 1024 * 1024  # 6MB (exceeds 5MB limit)
        mock_file.content_type = "image/jpeg"
        
        result = validate_image_file(mock_file)
        
        self.assertFalse(result['valid'])
        self.assertIn("5MB", result['error'])

    def test_validate_image_file_invalid_type(self):
        """Test image file type validation"""
        mock_file = Mock()
        mock_file.size = 1 * 1024 * 1024  # 1MB
        mock_file.content_type = "application/pdf"  # Not an image
        
        result = validate_image_file(mock_file)
        
        self.assertFalse(result['valid'])
        self.assertIn("Invalid file type", result['error'])

    def test_validate_image_file_valid_jpeg(self):
        """Test validation passes for valid JPEG"""
        mock_file = Mock()
        mock_file.size = 3 * 1024 * 1024  # 3MB
        mock_file.content_type = "image/jpeg"
        mock_file.name = "test.jpg"
        
        result = validate_image_file(mock_file)
        self.assertTrue(result['valid'])
        self.assertIsNone(result['error'])

    def test_validate_image_file_valid_png(self):
        """Test validation passes for valid PNG"""
        mock_file = Mock()
        mock_file.size = 2 * 1024 * 1024  # 2MB
        mock_file.content_type = "image/png"
        mock_file.name = "test.png"
        
        result = validate_image_file(mock_file)
        self.assertTrue(result['valid'])
        self.assertIsNone(result['error'])

    def test_caption_max_length(self):
        """Test that caption has max length validation"""
        long_caption = "A" * 501  # Over 500 chars
        
        mock_file = Mock()
        mock_file.size = 1 * 1024 * 1024
        mock_file.content_type = "image/jpeg"
        mock_file.name = "test.jpg"
        
        # Should raise ValueError for caption over 500 chars
        with self.assertRaises(ValueError) as context:
            upload_portfolio_image(self.worker_profile, mock_file, long_caption)
        
        self.assertIn("500 characters", str(context.exception))
