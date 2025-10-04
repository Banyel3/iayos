from django.db import models
from accounts.models import Accounts

# Create your models here.


class SystemRoles(models.Model):
    systemRoleID = models.BigAutoField(primary_key=True)
    accountID = models.ForeignKey(Accounts, on_delete=models.CASCADE)
    class systemRole(models.TextChoices):
        ADMIN = "ADMIN", "admin"
        STAFF = "CLIENT", "client"

    systemRole = models.CharField(
        max_length=10, choices=systemRole.choices, null=False, blank=True
    )
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
