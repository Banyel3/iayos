
from django.db import models
from accounts.models import Wallet, Transaction
from accounts.models import Profile


# Re-export models from accounts for backwards compatibility
# The actual models are defined in accounts.models to avoid migration issues
__all__ = ['Wallet', 'Transaction']


class Product(models.Model):
	productID = models.BigAutoField(primary_key=True)
	profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="products")
	name = models.CharField(max_length=100)
	description = models.TextField(blank=True)
	price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
	createdAt = models.DateTimeField(auto_now_add=True)
	updatedAt = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"{self.name} ({self.profile.firstName} {self.profile.lastName})"

