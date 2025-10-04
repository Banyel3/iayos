from django.db import models
from datetime import datetime
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils.translation import gettext_lazy as _


class AccountsManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):

          # Remove fields that don't belong in Accounts
        extra_fields.pop("createdAt", None)
        extra_fields.pop("created_at", None)
        extra_fields.pop("updatedAt", None)
        extra_fields.pop("updated_at", None)

        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # properly hashes the password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("isVerified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class Accounts(AbstractBaseUser, PermissionsMixin):  # <-- include PermissionsMixin!
    accountID = models.BigAutoField(primary_key=True)
    email = models.EmailField(max_length=64, unique=True)
    password = models.CharField(max_length=128)
    isVerified = models.BooleanField(default=False)

    # Required for Django admin + PermissionsMixin
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    verifyToken = models.CharField(max_length=255, null=True, blank=True)  # Changed to CharField for hash
    verifyTokenExpiry = models.DateTimeField(null=True, blank=True)
    street_address = models.CharField(max_length=255, default="", blank=True)   # "123 Main St"
    city = models.CharField(max_length=100, default="", blank=True)             # "Zamboanga City"
    province = models.CharField(max_length=100, default="", blank=True)         # "Zamboanga del Sur"
    postal_code = models.CharField(max_length=20, default="", blank=True)       # "7000"
    country = models.CharField(max_length=100, default="Philippines", blank=True)

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # you can add fields here if you want during `createsuperuser`

    objects = AccountsManager()


class Profile(models.Model):
    profileID = models.BigAutoField(primary_key=True)
    profileImg = models.CharField(max_length=50)
    firstName = models.CharField(max_length=24)
    middleName = models.CharField(max_length=24, null=True, blank=True)
    lastName = models.CharField(max_length=24)
    contactNum = models.CharField(max_length=11)
    birthDate = models.DateField()

    class ProfileType(models.TextChoices):
        WORKER = "WORKER", "Worker"
        CLIENT = "CLIENT", "Client"

    profileType = models.CharField(
        max_length=10, choices=ProfileType.choices, null=True, blank=True
    )

    accountFK = models.ForeignKey(Accounts, on_delete=models.CASCADE)


class Agency(models.Model): 
    agencyId = models.BigAutoField(primary_key=True)
    accountFK = models.OneToOneField(Accounts, on_delete=models.CASCADE)
    businessName = models.CharField(max_length=50)
    street_address = models.CharField(max_length=255, default="", blank=True)   # "123 Main St"
    city = models.CharField(max_length=100, default="", blank=True)             # "Zamboanga City"
    province = models.CharField(max_length=100, default="", blank=True)         # "Zamboanga del Sur"
    postal_code = models.CharField(max_length=20, default="", blank=True)
    country = models.CharField(max_length=100, default="Philippines", blank=True)
    
    businessDesc = models.CharField(max_length=255, default="", blank=True)

    createdAt = models.DateTimeField(auto_now_add=True)




class WorkerProfile(models.Model):
    profileID = models.OneToOneField(Profile, on_delete=models.CASCADE)
    description = models.CharField(max_length=350)
    workerRating = models.IntegerField(default=0)
    totalEarningGross = models.DecimalField(max_digits=10, decimal_places=2)
    class availabilityStatus(models.TextChoices):
        AVAILABLE = "AVAILABLE", 'available'
        BUSY = "BUSY", 'busy'
        OFFLINE = "OFFLINE", "offline"

    availabilityStatus = models.CharField(
        max_length=10, choices=availabilityStatus.choices, default="OFFLINE", blank=True
    )

class ClientProfile(models.Model):
    profileID = models.OneToOneField(Profile, on_delete=models.CASCADE)
    description = models.CharField(max_length=350)
    totalJobsPosted = models.IntegerField()
    clientRating = models.IntegerField(default=0)
    activeJobsCount = models.IntegerField


class Specializations(models.Model):
    specializationID = models.BigAutoField(primary_key=True)
    specializationName = models.CharField(max_length=250)

class InterestedJobs(models.Model):
    clientID = models.ForeignKey(ClientProfile, on_delete=models.CASCADE)
    specializationID = models.ForeignKey(Specializations, on_delete=models.CASCADE)


class workerSpecialization(models.Model):
    workerID = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE )
    specializationID = models.ForeignKey(Specializations, on_delete=models.CASCADE)
    experienceYears = models.IntegerField()
    certification = models.CharField(max_length=120)