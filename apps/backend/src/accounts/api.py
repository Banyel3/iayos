from ninja import Router, Schema
from django.contrib.auth import authenticate, login, logout
from .schemas import createAccountSchema, logInSchema
from .services import create_account
from .models import Accounts, Profile
from django.utils.dateparse import parse_date


router = Router(tags=["authentication"])

@router.post("/register")
def register(request, payload: createAccountSchema):
    user = Accounts.objects.create_user(
        email=payload.email,
        password=payload.password,
        created_at=payload.createdAt
    )
    Profile.objects.create(
        user=user,
        first_name=payload.firstName,
        last_name=payload.lastName,
        contact_num=payload.contactNum,
        birth_date=parse_date(payload.birthDate)
    )
    return {"message": "User created successfully"}

# @router.post("/login")
# def login(request):
    