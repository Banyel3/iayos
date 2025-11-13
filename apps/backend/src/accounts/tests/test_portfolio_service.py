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
from unittest.mock import Mock

User = get_user_model()


class PortfolioServiceTestCase(TestCase):
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

    def test_upload_portfolio_image_success(self):
        """Test uploading a portfolio image"""
        data = {
            "image_url": "https://example.com/image1.jpg",
            "caption": "Completed electrical installation"
        }
        
        result = upload_portfolio_image(self.user, data)
        
        self.assertEqual(result["caption"], "Completed electrical installation")
        self.assertEqual(result["display_order"], 1)  # First image

    def test_upload_portfolio_image_auto_order(self):
        """Test that display_order is automatically incremented"""
        # Upload first image
        WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=1
        )
        
        # Upload second image
        data = {
            "image_url": "https://example.com/image2.jpg",
            "caption": "Second project"
        }
        
        result = upload_portfolio_image(self.user, data)
        
        self.assertEqual(result["display_order"], 2)

    def test_get_portfolio_ordered(self):
        """Test that portfolio items are returned in display_order"""
        # Create items out of order
        WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image3.jpg",
            display_order=3
        )
        WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=1
        )
        WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image2.jpg",
            display_order=2
        )
        
        portfolio = get_portfolio(self.user)
        
        self.assertEqual(len(portfolio), 3)
        self.assertEqual(portfolio[0]["display_order"], 1)
        self.assertEqual(portfolio[1]["display_order"], 2)
        self.assertEqual(portfolio[2]["display_order"], 3)

    def test_update_portfolio_caption_success(self):
        """Test updating portfolio item caption"""
        item = WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            caption="Old caption",
            display_order=1
        )
        
        updated = update_portfolio_caption(
            self.user,
            item.portfolioID,
            "New updated caption"
        )
        
        self.assertEqual(updated["caption"], "New updated caption")

    def test_update_portfolio_caption_not_owner(self):
        """Test that user cannot update another user's portfolio"""
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
        
        item = WorkerPortfolio.objects.create(
            worker_profile=other_worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=1
        )
        
        with self.assertRaises(Exception):
            update_portfolio_caption(self.user, item.portfolioID, "Hacked")

    def test_reorder_portfolio_valid_order(self):
        """Test reordering portfolio items"""
        # Create 3 items
        item1 = WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=1
        )
        item2 = WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image2.jpg",
            display_order=2
        )
        item3 = WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image3.jpg",
            display_order=3
        )
        
        # Reorder: swap first and last
        new_order = [item3.portfolioID, item2.portfolioID, item1.portfolioID]
        
        result = reorder_portfolio(self.user, new_order)
        
        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]["portfolioID"], item3.portfolioID)
        self.assertEqual(result[0]["display_order"], 1)
        self.assertEqual(result[2]["portfolioID"], item1.portfolioID)
        self.assertEqual(result[2]["display_order"], 3)

    def test_reorder_portfolio_invalid_order(self):
        """Test reordering with invalid item IDs"""
        item1 = WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=1
        )
        
        # Try to reorder with non-existent ID
        invalid_order = [item1.portfolioID, 99999]
        
        with self.assertRaises(Exception):
            reorder_portfolio(self.user, invalid_order)

    def test_delete_portfolio_image_success(self):
        """Test deleting a portfolio image"""
        item = WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=1
        )
        
        delete_portfolio_image(self.user, item.portfolioID)
        
        # Item should be deleted
        with self.assertRaises(WorkerPortfolio.DoesNotExist):
            WorkerPortfolio.objects.get(portfolioID=item.portfolioID)

    def test_delete_portfolio_image_reorders_remaining(self):
        """Test that remaining items are reordered after deletion"""
        item1 = WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image1.jpg",
            display_order=1
        )
        item2 = WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image2.jpg",
            display_order=2
        )
        item3 = WorkerPortfolio.objects.create(
            worker_profile=self.worker_profile,
            image_url="https://example.com/image3.jpg",
            display_order=3
        )
        
        # Delete middle item
        delete_portfolio_image(self.user, item2.portfolioID)
        
        # Check remaining items are reordered
        remaining = get_portfolio(self.user)
        self.assertEqual(len(remaining), 2)
        self.assertEqual(remaining[0]["display_order"], 1)
        self.assertEqual(remaining[1]["display_order"], 2)

    def test_validate_image_file_size_exceeded(self):
        """Test image file size validation"""
        mock_file = Mock()
        mock_file.size = 6 * 1024 * 1024  # 6MB (exceeds 5MB limit)
        mock_file.content_type = "image/jpeg"
        
        with self.assertRaises(ValueError) as context:
            validate_image_file(mock_file)
        
        self.assertIn("Image size must be less than 5MB", str(context.exception))

    def test_validate_image_file_invalid_type(self):
        """Test image file type validation"""
        mock_file = Mock()
        mock_file.size = 1 * 1024 * 1024  # 1MB
        mock_file.content_type = "application/pdf"  # Not an image
        
        with self.assertRaises(ValueError) as context:
            validate_image_file(mock_file)
        
        self.assertIn("File must be an image", str(context.exception))

    def test_validate_image_file_valid_jpeg(self):
        """Test validation passes for valid JPEG"""
        mock_file = Mock()
        mock_file.size = 3 * 1024 * 1024  # 3MB
        mock_file.content_type = "image/jpeg"
        
        # Should not raise any exceptions
        validate_image_file(mock_file)

    def test_validate_image_file_valid_png(self):
        """Test validation passes for valid PNG"""
        mock_file = Mock()
        mock_file.size = 2 * 1024 * 1024  # 2MB
        mock_file.content_type = "image/png"
        
        # Should not raise any exceptions
        validate_image_file(mock_file)

    def test_caption_max_length(self):
        """Test that caption has max length validation"""
        long_caption = "A" * 201  # Over 200 chars
        
        data = {
            "image_url": "https://example.com/image1.jpg",
            "caption": long_caption
        }
        
        # Depending on implementation, this should either truncate or raise error
        result = upload_portfolio_image(self.user, data)
        
        # Caption should be truncated to 200 chars max
        self.assertLessEqual(len(result.get("caption", "")), 200)
