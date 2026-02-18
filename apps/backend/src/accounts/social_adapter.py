"""
Custom allauth Social Account Adapter for iAyos.

Handles Google OAuth integration with the custom Accounts model:
1. Auto-connects social accounts to existing users with the same email
   (no email verification required - Google already verified the email)
2. Properly handles user creation for the custom Accounts model
   (no username, no first_name/last_name fields)
"""

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class IayosSocialAccountAdapter(DefaultSocialAccountAdapter):

    def pre_social_login(self, request, sociallogin):
        """
        Called after Google auth succeeds but BEFORE the account is created
        or connected. If a user with the same email already exists (registered
        via email/password), auto-connect the Google account to them.

        Without this, allauth tries to create a duplicate user → IntegrityError
        → "Third-Party Login Failure" page.
        """
        # If this social account is already connected to a user, nothing to do
        if sociallogin.is_existing:
            return

        # Extract email from the social login data
        email = None
        if sociallogin.account.extra_data:
            email = sociallogin.account.extra_data.get('email')

        if not email and sociallogin.email_addresses:
            email = sociallogin.email_addresses[0].email

        if not email:
            return

        # Check if a user with this email already exists
        from accounts.models import Accounts
        try:
            existing_user = Accounts.objects.get(email__iexact=email)
            # Connect the social account to the existing user
            sociallogin.connect(request, existing_user)
        except Accounts.DoesNotExist:
            pass  # New user — allauth will create the account normally

    def populate_user(self, request, sociallogin, data):
        """
        Override to safely handle the custom Accounts model which does NOT have
        first_name or last_name fields (those live on the Profile model).
        The parent method uses user_field() which is safe, but we call super()
        explicitly to be future-proof.
        """
        user = super().populate_user(request, sociallogin, data)
        return user
