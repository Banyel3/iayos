from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import hashlib
import uuid

from accounts.models import Accounts
from adminpanel.models import SystemRoles


def create_admin_account(email: str, password: str, role: str = "ADMIN"):
    """Create an account and assign a system role (ADMIN or CLIENT/STAFF).

    This helper is useful for tests or seeding an admin user.

    Returns a dict with accountID and role, or raises ValueError on invalid input.
    """

    # Basic validation
    if not email or "@" not in email:
        raise ValueError("A valid email is required")

    if not password or len(password) < 6:
        raise ValueError("Password must be at least 6 characters")

    # Normalize role
    normalized_role = role.upper().strip()

    # Retrieve allowed choices from the model field to avoid shadowing issues
    # The model defines an inner TextChoices class and a field with the same
    # name; accessing SystemRoles.systemRole directly returns a DeferredAttribute
    # (the model field). Use _meta.get_field(...) to get the choices tuples.
    try:
        raw_choices = SystemRoles._meta.get_field('systemRole').choices
        allowed = {c[0] for c in raw_choices}
    except Exception:
        # Fallback to a conservative set if reflection fails
        allowed = {"ADMIN", "CLIENT"}

    if normalized_role not in allowed:
        raise ValueError(f"Invalid role. Allowed roles: {allowed}")

    # Check if account already exists
    if Accounts.objects.filter(email__iexact=email).exists():
        raise ValueError("Email already registered")

    # Create user via model manager (uses create_user to hash password)
    user = Accounts.objects.create_user(email=email, password=password)

    # Optionally set verification token & expiry so account can be tested as verified
    user.isVerified = True
    user.verifyToken = None
    user.verifyTokenExpiry = None
    user.save()

    # Create SystemRoles entry
    system_role = SystemRoles.objects.create(accountID=user, systemRole=normalized_role)

    return {
        "accountID": user.accountID,
        "email": user.email,
        "role": system_role.systemRole,
    }


# Example usage (for Django shell or scripts):
# from adminpanel.service import create_admin_account
# create_admin_account('admin@example.com', 'strongpassword', role='ADMIN')
