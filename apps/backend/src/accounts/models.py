from django.db import models
from datetime import datetime
from django.utils.translation import gettext_lazy as _

# Create your models here.


class Accounts(models.Model):
    accountID = models.BigAutoField(primary_key=True)
    email = models.EmailField(max_length=64)
    password = models.CharField(max_length=128)
    isVerified = models.BooleanField()
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

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
    profileType = models.CharField(max_length=10, choices=ProfileType.choices, null=True, blank=True)

    accountFK = models.ForeignKey(Accounts, on_delete=models.CASCADE)

class Agency():
    agencyId = models.BigAutoField(primary_key=True)
    
    accountFK = models.OneToOneField(Accounts, on_delete=models.CASCADE)

    businessName = models.CharField(max_length=50)
    businessDesc = models.CharField(max_length=255)
    createdAt = models.DateTimeField(auto_now_add=True)
    