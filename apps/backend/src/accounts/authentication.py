# accounts/authentication.py
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from ninja.security import HttpBearer
import traceback

Accounts = get_user_model()

class JWTBearer(HttpBearer):
    def authenticate(self, request, token):
        try:
            print("=" * 60)
            print("[AUTH] JWTBearer CALLED!")
            print(f"[AUTH] Request path: {request.path}")
            print(f"[AUTH] Token present: {bool(token)}")

            if not token:
                print("[FAIL] No token provided")
                return None

            # Decode the JWT token
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get('user_id')

            if not user_id:
                print("[FAIL] No user_id in token payload")
                return None

            print(f"[AUTH] Token validated - User ID: {user_id}")

            # Get the user
            user = Accounts.objects.get(accountID=user_id)
            print(f"[SUCCESS] Authentication SUCCESS - User: {user.email}")
            return user

        except jwt.ExpiredSignatureError:
            print("[FAIL] Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"[FAIL] Invalid token: {str(e)}")
            return None
        except Accounts.DoesNotExist:
            print(f"[FAIL] User not found: {user_id}")
            return None
        except Exception as e:
            print(f"[ERROR] Authentication FAILED: {str(e)}")
            print(f"[ERROR] Full traceback:")
            traceback.print_exc()
            return None

# Create instance
jwt_auth = JWTBearer()

class CookieJWTAuth:
    def __init__(self):
        # This empty init is required by Django Ninja
        pass

    def __call__(self, request):
        print("=" * 60)
        print("[AUTH] CookieJWTAuth CALLED!")
        print(f"[AUTH] Request path: {request.path}")
        print(f"[AUTH] All cookies: {dict(request.COOKIES)}")

        raw_token = request.COOKIES.get('access')
        print(f"[AUTH] Access token present: {bool(raw_token)}")

        if not raw_token:
            print("[FAIL] No access token in cookies")
            return None

        try:
            print(f"[AUTH] Token: {raw_token[:30]}...")
            # Decode the JWT token
            payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get('user_id')

            if not user_id:
                print("[FAIL] No user_id in token payload")
                return None

            print(f"[AUTH] Token validated - User ID: {user_id}")

            user = Accounts.objects.get(accountID=user_id)
            print(f"[SUCCESS] Authentication SUCCESS - User: {user.email}")
            return user

        except jwt.ExpiredSignatureError:
            print("[FAIL] Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"[FAIL] Invalid token: {str(e)}")
            return None
        except Accounts.DoesNotExist:
            print(f"[FAIL] User not found: {user_id}")
            return None
        except Exception as e:
            print(f"[ERROR] Authentication FAILED: {str(e)}")
            print(f"[ERROR] Full traceback:")
            traceback.print_exc()
            return None

# Create instance
cookie_auth = CookieJWTAuth()

class DualJWTAuth:
    """
    Dual authentication: tries Bearer token first (mobile), falls back to cookies (web)
    Use this for endpoints that need to support both mobile and web clients
    """
    def __init__(self):
        self.jwt_bearer = JWTBearer()
        self.cookie_auth = CookieJWTAuth()

    def __call__(self, request):
        print("=" * 60)
        print("[AUTH] DualJWTAuth CALLED!")
        print(f"[AUTH] Request path: {request.path}")
        
        # Try Bearer token first (mobile apps)
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
            print("[AUTH] Attempting Bearer token authentication...")
            user = self.jwt_bearer.authenticate(request, token)
            if user:
                return user
        
        # Fall back to cookie authentication (web apps)
        print("[AUTH] Bearer token not found, trying cookie authentication...")
        return self.cookie_auth(request)

# Create instance
dual_auth = DualJWTAuth()