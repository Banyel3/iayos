# services.py
from .models import Accounts, Profile
from django.utils.dateparse import parse_date
from ninja_extra.exceptions import APIException
from ninja_extra import status

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

    # 3️⃣ Create Accounts user
    user = Accounts.objects.create_user(
        email=data.email,
        password=data.password,
        created_at=data.createdAt
    )

    # 4️⃣ Create Profile
    Profile.objects.create(
        user=user,
        first_name=data.firstName,
        last_name=data.lastName,
        contact_num=data.contactNum,
        birth_date=birth_date
    )

    return user
