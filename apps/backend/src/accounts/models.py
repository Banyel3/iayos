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

    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # you can add fields here if you want during `createsuperuser`

    objects = AccountsManager()


class Profile(models.Model):
    profileID = models.BigAutoField(primary_key=True)
    profileImg = models.CharField(max_length=50)
    firstName = models.CharField(max_length=24)
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


class Agency(models.Model):  # <- missing models.Model before
    agencyId = models.BigAutoField(primary_key=True)
    accountFK = models.OneToOneField(Accounts, on_delete=models.CASCADE)
    businessName = models.CharField(max_length=50)
    
    businessDesc = models.CharField(max_length=255)

    createdAt = models.DateTimeField(auto_now_add=True)
