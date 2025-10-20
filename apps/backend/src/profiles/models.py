
from django.db import models
from accounts.models import Wallet, Transaction
from accounts.models import Profile


# Re-export models from accounts for backwards compatibility
# The actual models are defined in accounts.models to avoid migration issues
__all__ = ['Wallet', 'Transaction']


class WorkerProduct(models.Model):
	# Matches the existing migration (0001_initial.py)
	productID = models.BigAutoField(primary_key=True)
	productName = models.CharField(max_length=200)
	description = models.TextField(blank=True, null=True)
	price = models.DecimalField(max_digits=10, decimal_places=2)
	class PriceUnit(models.TextChoices):
		PIECE = ("PIECE", "Per Piece")
		SET = ("SET", "Per Set")
		LITER = ("LITER", "Per Liter")
		GALLON = ("GALLON", "Per Gallon")
		KG = ("KG", "Per Kilogram")
		METER = ("METER", "Per Meter")
		HOUR = ("HOUR", "Per Hour")
		SERVICE = ("SERVICE", "Per Service")

	priceUnit = models.CharField(max_length=20, choices=PriceUnit.choices, default=PriceUnit.PIECE)
	inStock = models.BooleanField(default=True)
	stockQuantity = models.IntegerField(blank=True, null=True)
	productImage = models.CharField(max_length=500, blank=True, null=True)
	isActive = models.BooleanField(default=True)
	createdAt = models.DateTimeField(auto_now_add=True)
	updatedAt = models.DateTimeField(auto_now=True)

	# Optional category relation (matches migration)
	from accounts.models import Specializations
	categoryID = models.ForeignKey(Specializations, blank=True, null=True, on_delete=models.SET_NULL, related_name='worker_products')

	# Worker relation - points to WorkerProfile (migration used 'workerID')
	from accounts.models import WorkerProfile
	workerID = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name='products')

	def __str__(self):
		# Provide a friendly string repr; try to include worker name when available
		try:
			profile = self.workerID.profileID
			return f"{self.productName} ({profile.firstName} {profile.lastName})"
		except Exception:
			return self.productName

	# Backwards-compatible properties so existing code that expects `.name` works
	@property
	def name(self):
		return self.productName

	@property
	def profile(self):
		# Return underlying Profile instance similar to the old Product.profile
		return getattr(self.workerID, 'profileID', None)

