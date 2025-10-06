from ninja import Router, Form, File
from ninja.files import UploadedFile
from .schemas import createAccountSchema, logInSchema, createAgencySchema, forgotPasswordSchema, resetPasswordSchema, assignRoleSchema, KYCUploadSchema, KYCStatusResponse, KYCUploadResponse
from .services import create_account_individ, create_account_agency, login_account, _verify_account, forgot_password_request, reset_password_verify, logout_account, refresh_token, fetch_currentUser, generateCookie, assign_role, upload_kyc_document, get_kyc_status, get_pending_kyc_submissions
from ninja.responses import Response
from .authentication import cookie_auth
from django.shortcuts import redirect
from django.urls import reverse

router = Router(tags=["Accounts"])

#region USER-SIDE ACCOUNTS
@router.get("/auth/google/login")
def google_login(request):
 
    return redirect(reverse("google_login"))
    
@router.get("/auth/google/callback")
def google_callback(request):
    if not request.user.is_authenticated:
        return {"error": "Authentication failed"}
    
    return generateCookie(request.user)
@router.post("/register")
def register(request, payload: createAccountSchema):
    try:
        result = create_account_individ(payload)
        return result
    except ValueError as e:
        print(f"❌ ValueError in registration: {str(e)}")  # Add logging
        return Response(
            {"error": [{"message": str(e)}]}, 
            status=400
        )
    except Exception as e:
        print(f"❌ Exception in registration: {str(e)}")  # Add logging
        import traceback
        traceback.print_exc()  # Print full stack trace
        return Response(
            {"error": [{"message": "Registration failed"}]}, 
            status=500
        )
@router.post("/register/agency")
def register_agency(request, payload: createAgencySchema):
    try:
        result = create_account_agency(payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Registration failed"}]}

@router.post("/login")
def login(request, payload: logInSchema):
    try:
        result = login_account(payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Login failed"}]}

@router.post('/assign-role')
def assignRole(request, payload: assignRoleSchema):
    try:
        result = assign_role(payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Role Assigning Failed"}]}
@router.post("/logout", auth=cookie_auth)
def logout(request):
   try:
       result = logout_account()  # 🔥 FIX: Call the function with ()
       return result
   except ValueError as e:
        return {"error": [{"message": str(e)}]}

@router.post("/refresh", auth=cookie_auth)
def refresh(request):
    try:
        result = refresh_token(request.COOKIES.get("refresh"))
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}

@router.get("/me", auth=cookie_auth)
def get_user_profile(request):
    try:
        user = request.auth  # This comes from our cookie_auth
        print(f"✅ /me - Authenticated user: {user.email}")
        result = fetch_currentUser(user.accountID)
        return result
    except Exception as e:
        print(f"❌ /me error: {str(e)}")
        return {"error": [{"message": "Failed to fetch user profile"}]}

# Send Email Verification
@router.get("/verify")
def verify(request, verifyToken: str, accountID: int):
    try:
        result = _verify_account(verifyToken, accountID)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Verification failed"}]}

@router.post("/forgot-password/send-verify")
def forgot_password_send_verify(request, payload: forgotPasswordSchema):
    """Send password reset verification email"""
    try:
        result = forgot_password_request(payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Password reset request failed"}]}

@router.post("/forgot-password/verify")
def forgot_password_verify(request, payload: resetPasswordSchema, verifyToken: str, id: int):
    try:
        result = reset_password_verify(verifyToken, id, payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Password reset failed"}]}
    
@router.post("/upload/kyc")
def upload_kyc(request):
    try:
        accountID = int(request.POST.get("accountID"))
        IDType = request.POST.get("IDType")
        clearanceType = request.POST.get("clearanceType")
        frontID = request.FILES.get("frontID")
        backID = request.FILES.get("backID")
        clearance = request.FILES.get("clearance")
        selfie = request.FILES.get("selfie")

        payload = KYCUploadSchema(
            accountID=accountID,
            IDType=IDType,
            clearanceType=clearanceType
        )
        result = upload_kyc_document(payload, frontID, backID, clearance, selfie)
        return result
    except ValueError as e:
        print(f"❌ ValueError in KYC upload: {str(e)}")
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        print(f"❌ Exception in KYC upload: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": [{"message": "Upload Failed"}]}
