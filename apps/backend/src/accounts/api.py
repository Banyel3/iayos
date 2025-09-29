from ninja import Router
from .schemas import createAccountSchema, logInSchema, createAgencySchema, forgotPasswordSchema, resetPasswordSchema
from .services import create_account_individ, create_account_agency, login_account, _verify_account, forgot_password_request, reset_password_verify, logout_account, refresh_token, fetch_currentUser
from ninja.responses import Response
from .authentication import cookie_auth
from django.http import JsonResponse


router = Router(tags=["Accounts"])
# In your api.py - add this temporary endpoint
@router.get("/debug-auth")
def debug_auth(request):
    print("🔍 Debug Auth - All cookies:", dict(request.COOKIES))
    
    raw_token = request.COOKIES.get('access')
    if raw_token:
        print(f"🔍 Access token found (first 50 chars): {raw_token[:50]}...")
        
        try:
            from ninja_jwt.tokens import AccessToken
            token = AccessToken(raw_token)
            print("🔍 Token payload:", token.payload)
            
            from django.contrib.auth import get_user_model
            Accounts = get_user_model()
            user_id = token['accountID']
            user = Accounts.objects.get(accountID=user_id)
            
            return {
                "status": "Token valid", 
                "user_id": user_id,
                "user_email": user.email
            }
        except Exception as e:
            print("🔍 Token validation error:", e)
            return {"status": "Token invalid", "error": str(e)}
    else:
        print("🔍 No access token in cookies")
        return {"status": "No token found"}
    


# Add this to api.py
@router.get("/check-users")
def check_users(request):
    from django.contrib.auth import get_user_model
    Accounts = get_user_model()
    
    users = Accounts.objects.all()
    user_list = [{"accountID": u.accountID, "email": u.email} for u in users]
    
    return {
        "total_users": len(user_list),
        "users": user_list
    }

@router.post("/register")
def register(request, payload: createAccountSchema):
    try:
        result = create_account_individ(payload)
        return result
    except ValueError as e:
        return Response(
            {"error": [{"message": str(e)}]}, 
            status=400
        )
    except Exception as e:
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

@router.post("/logout", auth=cookie_auth)
def logout(request):
   try:
       result = logout_account
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
    
# In your api.py
@router.post("/test-cookies")
def test_cookies(request):
    response = JsonResponse({"message": "Testing cookies"})
    response.set_cookie(
        key="test_cookie",
        value="hello_world",
        httponly=False,  # Set to false so we can see it in JS
        secure=False,
        samesite="Lax",
        max_age=3600,
        path="/",
    )
    return response

@router.get("/debug-auth")
def debug_auth(request):
    """Debug endpoint to check cookie reception and auth"""
    import jwt
    from django.conf import settings
    from django.contrib.auth import get_user_model

    cookies = dict(request.COOKIES)
    access_token = cookies.get('access')

    result = {
        "cookies_received": list(cookies.keys()),
        "access_token_present": bool(access_token),
        "access_token_length": len(access_token) if access_token else 0,
    }

    # Try to authenticate
    try:
        if access_token:
            # Decode the JWT token
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get('user_id')

            if user_id:
                Accounts = get_user_model()
                user = Accounts.objects.get(accountID=user_id)
                result["auth_success"] = True
                result["user_email"] = user.email
                result["user_id"] = user_id
            else:
                result["auth_success"] = False
                result["error"] = "No user_id in token"
        else:
            result["auth_success"] = False
            result["error"] = "No access token"
    except jwt.ExpiredSignatureError:
        result["auth_success"] = False
        result["error"] = "Token expired"
    except jwt.InvalidTokenError as e:
        result["auth_success"] = False
        result["error"] = f"Invalid token: {str(e)}"
    except Exception as e:
        result["auth_success"] = False
        result["error"] = str(e)

    return result

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
    """Reset password with verification token"""
    try:
        result = reset_password_verify(verifyToken, id, payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Password reset failed"}]}
