from ninja import Router
# from .schemas import createAccountSchema, logInSchema, createAgencySchema, forgotPasswordSchema, resetPasswordSchema
# from .services import create_account_individ, create_account_agency, login_account, _verify_account, forgot_password_request, reset_password_verify, logout_account, refresh_token, fetch_currentUser, generateCookie
from ninja.responses import Response
from django.shortcuts import redirect
from django.urls import reverse

router = Router(tags=["adminpanel"])



