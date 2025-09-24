from django.db import models
from django.contrib.postgres.fields import JSONField
from decimal import Decimal

class Accounts(models.Model):
    accountID = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255, null=True, blank=True)  # hashed
    isVerified = models.BooleanField(default=False)
    verifyToken = models.CharField(max_length=255, blank=True, default="")
    verifyTokenExpire = models.DateTimeField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=50)

    defaultProfile = models.ForeignKey(
        'Profile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='default_for_accounts'
    )

    def __str__(self):
        return self.email


class Profile(models.Model):
    profileID = models.AutoField(primary_key=True)
    account = models.ForeignKey(Accounts, on_delete=models.CASCADE, related_name='profile')
    profileImg = models.CharField(max_length=255, null=True, blank=True)
    firstName = models.CharField(max_length=100)
    lastName = models.CharField(max_length=100, null=True, blank=True)
    contactNum = models.CharField(max_length=50, null=True, blank=True)
    birthDate = models.DateField()
    profileType = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        unique_together = ('account', 'profileType')

    def __str__(self):
        return f"{self.firstName} {self.lastName or ''}"


class Worker_Profile(models.Model):
    AVAILABLE = "AVAILABLE"
    BUSY = "BUSY"
    OFFLINE = "OFFLINE"
    AVAILABILITY_CHOICES = [
        (AVAILABLE, "Available"),
        (BUSY, "Busy"),
        (OFFLINE, "Offline"),
    ]

    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, primary_key=True)
    hourlyRate = models.DecimalField(max_digits=10, decimal_places=2)
    verifiedSkills = JSONField()
    bio = models.TextField()
    totalEarningGross = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    availabilityStatus = models.CharField(
        max_length=10, choices=AVAILABILITY_CHOICES, default=OFFLINE
    )

    def __str__(self):
        return f"Worker Profile: {self.profile.firstName}"


class Specialization(models.Model):
    specializationID = models.AutoField(primary_key=True)
    specializationName = models.CharField(max_length=255)

    def __str__(self):
        return self.specializationName


class Freelancer_Specialization(models.Model):
    worker_profile = models.ForeignKey(Worker_Profile, on_delete=models.CASCADE)
    specialization = models.ForeignKey(Specialization, on_delete=models.CASCADE)
    experienceYears = models.IntegerField()
    certification = models.CharField(max_length=255)

    class Meta:
        unique_together = ('worker_profile', 'specialization')

    def __str__(self):
        return f"{self.worker_profile} - {self.specialization}"


class Agency(models.Model):
    agencyID = models.AutoField(primary_key=True)
    account = models.ForeignKey(Accounts, on_delete=models.CASCADE, related_name='agency')
    businessName = models.CharField(max_length=255)
    businessDesc = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.businessName
