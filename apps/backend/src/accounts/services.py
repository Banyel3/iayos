# services.py
from .models import Accounts, Profile
from django.utils.dateparse import parse_date
from ninja_extra.exceptions import APIException
from ninja_extra import status
from django.utils import timezone
from datetime import timedelta, date
from django.http import JsonResponse
import uuid
from ninja_jwt.tokens import RefreshToken 

def create_account(data):
    # 1️⃣ Check if email exists
    if Accounts.objects.filter(email__iexact=data.email).exists():
        exc = APIException("Email already registered")
        exc.status_code = status.HTTP_400_BAD_REQUEST
        raise exc

    # 2️⃣ Parse birth date
    birth_date = parse_date(data.birthDate)
    if not birth_date:
        exc = APIException("Invalid birth date format, use YYYY-MM-DD")
        exc.status_code = status.HTTP_400_BAD_REQUEST
        raise exc
    
     # ✅ Check if user is over 18
    today = date.today()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    if age < 18:
        exc = APIException("You must be at least 18 years old to register")
        exc.status_code = status.HTTP_400_BAD_REQUEST
        raise exc


    # 3️⃣ Create Accounts user
    user = Accounts.objects.create_user(
        email=data.email,
        password=data.password,
    )
    user.verifyToken = uuid.uuid4()
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

    verifyLink = f"http://localhost:3000/auth/verify-email?verifyToken={user.verifyToken}&id={user.accountID}"
    return {
        "accountID": user.accountID,
        "verifyLink": verifyLink,
        "verifyLinkExpire": user.verifyTokenExpiry.isoformat(),
        "email": user.email
    }

def login_account(data):
    # 1️⃣ Authenticate user (email + password)
    try:
        user = Accounts.objects.get(email__iexact=data.email)
    except Accounts.DoesNotExist:
        raise APIException("Invalid email or password", status.HTTP_401_UNAUTHORIZED)

    if not user.check_password(data.password):
        raise APIException("Invalid email or password", status.HTTP_401_UNAUTHORIZED)

    if not user.isVerified:
        raise APIException("Please verify your email before logging in", status.HTTP_403_FORBIDDEN)
    
    try:
        profile = Profile.objects.get(accountFK=user)
    except Profile.DoesNotExist:
        raise APIException("Profile not found", status.HTTP_404_NOT_FOUND)

    # 3️⃣ Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token

    return {
        "accountID": user.accountID,
        "email": user.email,
        "firstName": profile.firstName,
        "lastName": profile.lastName,
        "profileImg": profile.profileImg,
        "profileType": profile.profileType,
        "access": str(access),
        "refresh": str(refresh),
    }
