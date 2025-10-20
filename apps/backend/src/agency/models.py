from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings

# Lightweight agency-specific KYC models mirroring accounts.kyc & kycFiles


class AgencyKYC(models.Model):
	"""
	KYC records for agency accounts.
	"""
	agencyKycID = models.BigAutoField(primary_key=True)
	# accountFK references Accounts model from accounts app
	accountFK = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

	class AgencyKycStatus(models.TextChoices):
		PENDING = "PENDING", "pending"
		APPROVED = "APPROVED", "approved"
		REJECTED = "REJECTED", "rejected"

	status = models.CharField(max_length=10, choices=AgencyKycStatus.choices, default="PENDING", blank=True)
	reviewedAt = models.DateTimeField(null=True, blank=True)
	reviewedBy = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="reviewed_agency_kyc")
	notes = models.CharField(max_length=511, blank=True, default="")
	createdAt = models.DateTimeField(auto_now_add=True)
	updatedAt = models.DateTimeField(auto_now=True)


class AgencyKycFile(models.Model):
	"""Files uploaded for agency KYC submissions."""
	fileID = models.BigAutoField(primary_key=True)
	agencyKyc = models.ForeignKey(AgencyKYC, on_delete=models.CASCADE)

	class FileType(models.TextChoices):
		BUSINESS_PERMIT = "BUSINESS_PERMIT", "business_permit"
		REP_ID_FRONT = "REP_ID_FRONT", "rep_id_front"
		REP_ID_BACK = "REP_ID_BACK", "rep_id_back"
		ADDRESS_PROOF = "ADDRESS_PROOF", "address_proof"
		AUTH_LETTER = "AUTH_LETTER", "authorization_letter"

	fileType = models.CharField(max_length=30, choices=FileType.choices, null=True, blank=True)
	fileURL = models.CharField(max_length=1000)
	fileName = models.CharField(max_length=255, null=True, blank=True)
	fileSize = models.IntegerField(null=True, blank=True)
	uploadedAt = models.DateTimeField(auto_now_add=True)

	def clean(self):
		# Basic validation: ensure fileName exists for images
		if not self.fileURL:
			raise ValidationError({"fileURL": "fileURL is required"})

	def save(self, *args, **kwargs):
		self.full_clean()
		super().save(*args, **kwargs)
