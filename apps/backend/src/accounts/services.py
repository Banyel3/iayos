# services.py
from .models import Accounts, Profile, Agency
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import timedelta, date
from django.http import JsonResponse
import uuid
from ninja_jwt.tokens import RefreshToken 
import hashlib


def create_account_individ(data):
    # 1️⃣ Check if email exists
    if Accounts.objects.filter(email__iexact=data.email).exists():
        raise ValueError("Email already registered")

    # 2️⃣ Parse birth date
    birth_date = parse_date(data.birthDate)
    if not birth_date:
        raise ValueError("Invalid birth date format, use YYYY-MM-DD")
    
     # ✅ Check if user is over 18
    today = date.today()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    if age < 18:
        raise ValueError("You must be at least 18 years old to register")


    # 3️⃣ Create Accounts user
    user = Accounts.objects.create_user(
        email=data.email,
        password=data.password,
    )
    verifyToken = uuid.uuid4()
    strVerifyToken = str(verifyToken)
    hashed_token = hashlib.sha256(strVerifyToken.encode("utf-8")).hexdigest()

    user.verifyToken = hashed_token

    user.verifyTokenExpiry = timezone.now() + timedelta(hours=24)  # valid for 24h
    user.save()

    # 4️⃣ Create Profile
    profile = Profile.objects.create(
        accountFK=user,
        firstName=data.firstName,
        lastName=data.lastName,
        contactNum=data.contactNum,
        birthDate=birth_date
    )

    verifyLink = f"http://localhost:3000/auth/verify-email?verifyToken={verifyToken}&id={user.accountID}"
    return {
        "accountID": user.accountID,
        "verifyLink": verifyLink,
        "verifyLinkExpire": user.verifyTokenExpiry.isoformat(),
        "email": user.email
    }
def create_account_agency(data):
    # 1️⃣ Check if email exists
    if Accounts.objects.filter(email__iexact=data.email).exists():
        raise ValueError("Email already registered")
    
    user = Accounts.objects.create_user(
        email=data.email,
        password=data.password,
    )
    
    verifyToken = uuid.uuid4()
    strVerifyToken = str(verifyToken)
    hashed_token = hashlib.sha256(strVerifyToken.encode("utf-8")).hexdigest()

    user.verifyToken = hashed_token

    user.verifyTokenExpiry = timezone.now() + timedelta(hours=24)  # valid for 24h
    user.save()

    # 4️⃣ Create Profile
    profile = Agency.objects.create(
        accountFK=user,
        businessName=data.businessName,
        businessDesc=""  # Provide empty string for required field
    )

    verifyLink = f"http://localhost:3000/auth/verify-email?verifyToken={verifyToken}&id={user.accountID}"
    
    result = {
        "accountID": user.accountID,
        "verifyLink": verifyLink,
        "verifyLinkExpire": user.verifyTokenExpiry.isoformat(),
        "email": user.email
    }
    return result

def login_account(data):
    try:
        user = Accounts.objects.get(email__iexact=data.email)
    except Accounts.DoesNotExist:
        raise ValueError("Invalid email or password")

    if not user.check_password(data.password):
        raise ValueError("Invalid email or password")

    if not user.isVerified:
        raise ValueError("Please verify your email before logging in")
    
    # 3️⃣ Get profile information (either Profile or Agency)
    profile_data = {}
    profile_type = "INDIVIDUAL"
    
    try:
        profile = Profile.objects.get(accountFK=user)
        profile_data = {
            "firstName": profile.firstName,
            "lastName": profile.lastName,
            "profileImg": profile.profileImg,
            "profileType": profile.profileType,
        }
    except Profile.DoesNotExist:
        try:
            agency = Agency.objects.get(accountFK=user)
            profile_data = {
                "firstName": agency.businessName,
                "lastName": "Agency",
                "profileImg": None,  # Agencies might not have profile images
                "profileType": "AGENCY",
            }
        except Agency.DoesNotExist:
            raise ValueError("Profile not found")

    # 4️⃣ Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token

    return {
        "accountID": user.accountID,
        "email": user.email,
        "access": str(access),
        "refresh": str(refresh),
        **profile_data
    }

def _verify_account(dbVerifyToken, userID):
    verifyToken = hashlib.sha256(dbVerifyToken.encode('utf-8')).hexdigest()
    try:
        account = Accounts.objects.filter(accountID=userID, verifyToken=verifyToken).first()
    except Accounts.DoesNotExist:
        raise ValueError("Invalid or expired token")
    
    if not account:
        raise ValueError("Invalid or expired token")

    if account.verifyTokenExpiry < timezone.now():
        raise ValueError("Token has expired")

    account.isVerified = True
    account.verifyToken = None
    account.verifyTokenExpiry = None
    account.save()

    # Determine account type for response
    account_type = "individual"
    try:
        Profile.objects.get(accountFK=account)
        account_type = "individual"
    except Profile.DoesNotExist:
        try:
            Agency.objects.get(accountFK=account)
            account_type = "agency"
        except Agency.DoesNotExist:
            pass

    return {
        "message": "Account verified successfully",
        "accountType": account_type,
        "accountID": account.accountID,
        "email": account.email
    }

def forgot_password_request(data):
    """Send password reset email to user"""
    
    # 1️⃣ Check if user exists
    try:
        user = Accounts.objects.get(email__iexact=data.email)
    except Accounts.DoesNotExist:
        # Don't reveal if email exists or not for security
        return {
            "message": "If an account with that email exists, we've sent password reset instructions.",
            "email": data.email
        }
    
    # 2️⃣ Generate reset token
    resetToken = uuid.uuid4()
    strResetToken = str(resetToken)
    hashed_token = hashlib.sha256(strResetToken.encode("utf-8")).hexdigest()
    
    # 3️⃣ Update user with reset token
    user.verifyToken = hashed_token  # Reuse verifyToken field for password reset
    user.verifyTokenExpiry = timezone.now() + timedelta(hours=1)  # 1 hour expiry for password reset
    user.save()
    
    # 4️⃣ Generate reset link
    resetLink = f"http://localhost:3000/auth/forgot-password/verified?verifyToken={resetToken}&id={user.accountID}"
    
    return {
        "message": "If an account with that email exists, we've sent password reset instructions.",
        "email": data.email,
        "resetLink": resetLink,  # This will be used by email service
        "resetLinkExpire": user.verifyTokenExpiry.isoformat()
    }

def reset_password_verify(verifyToken, userID, data):
    """Reset user password with verification token"""
    
    # 1️⃣ Validate passwords match
    if data.newPassword != data.confirmPassword:
        raise ValueError("Passwords don't match")
    
    # 2️⃣ Hash the verification token to match stored format
    hashed_token = hashlib.sha256(verifyToken.encode("utf-8")).hexdigest()
    
    # 3️⃣ Find user with matching token
    try:
        user = Accounts.objects.get(accountID=userID, verifyToken=hashed_token)
    except Accounts.DoesNotExist:
        raise ValueError("Invalid or expired reset token")
    
    # 4️⃣ Check if token has expired
    if user.verifyTokenExpiry < timezone.now():
        raise ValueError("Reset token has expired")
    
    # 5️⃣ Update password and clear reset token
    user.set_password(data.newPassword)  # This properly hashes the password
    user.verifyToken = None
    user.verifyTokenExpiry = None
    user.save()
    
    return {"message": "Password updated successfully"}

