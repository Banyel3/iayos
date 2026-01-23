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
            profile_type = payload.get('profile_type')  # Extract profile_type from JWT

            if not user_id:
                print("[FAIL] No user_id in token payload")
                return None

            print(f"[AUTH] Token validated - User ID: {user_id}")
            print(f"[AUTH] Profile type from JWT: {profile_type}")

            # Get the user
            user = Accounts.objects.get(accountID=user_id)
            
            # Attach profile_type to user object so it's available in request.auth
            user.profile_type = profile_type
            
            print(f"[SUCCESS] Authentication SUCCESS - User: {user.email}, Profile Type: {profile_type}")
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
        refresh_token = request.COOKIES.get('refresh')
        print(f"[AUTH] Access token present: {bool(raw_token)}")

        if not raw_token and refresh_token:
            print("[AUTH] Access token missing, attempting refresh token fallback")
            try:
                refresh_payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = refresh_payload.get('user_id')
                if not user_id:
                    print("[FAIL] No user_id in refresh token payload")
                    return None

                user = Accounts.objects.get(accountID=user_id)
                print(f"[SUCCESS] Refresh token validated - User: {user.email}")

                # Generate a short-lived access token so downstream code can rely on request.auth
                new_access_payload = {
                    'user_id': user.accountID,
                    'email': user.email,
                    'exp': datetime.utcnow() + timedelta(hours=1),
                    'iat': datetime.utcnow(),
                }
                raw_token = jwt.encode(new_access_payload, settings.SECRET_KEY, algorithm='HS256')
                # Attach the regenerated token so views can optionally set the cookie on response
                setattr(request, 'refreshed_access_token', raw_token)
                print("[AUTH] Issued new access token from refresh fallback")
            except Accounts.DoesNotExist:
                print("[FAIL] User not found via refresh token")
                return None
            except jwt.ExpiredSignatureError:
                print("[FAIL] Refresh token has expired")
                return None
            except jwt.InvalidTokenError as e:
                print(f"[FAIL] Invalid refresh token: {str(e)}")
                return None
            except Exception as e:
                print(f"[ERROR] Refresh token fallback failed: {str(e)}")
                traceback.print_exc()
                return None

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


# ==============================================================================
# ROLE-BASED ACCESS CONTROL UTILITIES
# ==============================================================================

class ProfileType:
    """Profile type constants matching Profile.ProfileType choices"""
    WORKER = "WORKER"
    CLIENT = "CLIENT"


class AccountType:
    """Account type constants"""
    INDIVIDUAL = "individual"
    AGENCY = "agency"


class AdminRole:
    """Admin role constants matching AdminAccount.Role choices"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERATOR = "moderator"


def get_user_profile(user, profile_type: str = None):
    """
    Get user's profile with optional type filtering.
    
    Args:
        user: Authenticated Accounts object
        profile_type: Optional - filter by specific profile type (WORKER/CLIENT)
        
    Returns:
        Profile object or None if not found
    """
    from .models import Profile
    
    try:
        if profile_type:
            return Profile.objects.filter(
                accountFK=user, 
                profileType=profile_type
            ).first()
        
        # If no type specified, try to get from JWT profile_type or get any profile
        jwt_profile_type = getattr(user, 'profile_type', None)
        if jwt_profile_type:
            return Profile.objects.filter(
                accountFK=user,
                profileType=jwt_profile_type
            ).first()
        
        # Fallback: return any profile for this user
        return Profile.objects.filter(accountFK=user).first()
    except Exception:
        return None


def is_worker(user) -> bool:
    """Check if user has a WORKER profile"""
    profile = get_user_profile(user, ProfileType.WORKER)
    return profile is not None


def is_client(user) -> bool:
    """Check if user has a CLIENT profile"""
    profile = get_user_profile(user, ProfileType.CLIENT)
    return profile is not None


def is_agency(user) -> bool:
    """Check if user has an Agency account"""
    from .models import Agency
    try:
        Agency.objects.get(accountFK=user)
        return True
    except Agency.DoesNotExist:
        return False


def is_admin(user) -> bool:
    """Check if user has admin privileges (is_staff or AdminAccount)"""
    # Check Django staff flag
    if getattr(user, 'is_staff', False):
        return True
    
    # Check AdminAccount model
    from adminpanel.models import AdminAccount
    try:
        AdminAccount.objects.get(account=user)
        return True
    except AdminAccount.DoesNotExist:
        return False


def get_admin_account(user):
    """Get AdminAccount for user if exists"""
    from adminpanel.models import AdminAccount
    try:
        return AdminAccount.objects.get(account=user)
    except AdminAccount.DoesNotExist:
        return None


def get_user_account_type(user) -> str:
    """
    Determine user's account type.
    
    Returns:
        'admin' | 'agency' | 'worker' | 'client' | 'unknown'
    """
    if is_admin(user):
        return 'admin'
    if is_agency(user):
        return 'agency'
    
    profile = get_user_profile(user)
    if profile:
        if profile.profileType == ProfileType.WORKER:
            return 'worker'
        elif profile.profileType == ProfileType.CLIENT:
            return 'client'
    
    return 'unknown'


def require_profile_type(required_type: str):
    """
    Decorator factory for endpoints that require specific profile type.
    
    Usage:
        @router.get("/worker-only")
        @require_profile_type(ProfileType.WORKER)
        def worker_endpoint(request):
            ...
    """
    def decorator(func):
        from functools import wraps
        from ninja.errors import HttpError
        
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            user = request.auth
            if not user:
                raise HttpError(401, "Authentication required")
            
            profile = get_user_profile(user, required_type)
            if not profile:
                raise HttpError(403, f"This action requires a {required_type} profile")
            
            # Attach profile to request for convenience
            request.profile = profile
            return func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def require_agency():
    """
    Decorator for endpoints that require agency account.
    
    Usage:
        @router.get("/agency-only")
        @require_agency()
        def agency_endpoint(request):
            ...
    """
    def decorator(func):
        from functools import wraps
        from ninja.errors import HttpError
        from .models import Agency
        
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            user = request.auth
            if not user:
                raise HttpError(401, "Authentication required")
            
            try:
                agency = Agency.objects.get(accountFK=user)
                request.agency = agency
            except Agency.DoesNotExist:
                raise HttpError(403, "This action requires an agency account")
            
            return func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def require_admin():
    """
    Decorator for endpoints that require admin privileges.
    
    Usage:
        @router.get("/admin-only")
        @require_admin()
        def admin_endpoint(request):
            ...
    """
    def decorator(func):
        from functools import wraps
        from ninja.errors import HttpError
        
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            user = request.auth
            if not user:
                raise HttpError(401, "Authentication required")
            
            if not is_admin(user):
                raise HttpError(403, "This action requires admin privileges")
            
            admin_account = get_admin_account(user)
            if admin_account:
                request.admin_account = admin_account
            
            return func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def require_web_access():
    """
    Decorator for endpoints that should only be accessible via web (agency/admin only).
    Workers and clients should use mobile app.
    
    Usage:
        @router.get("/web-only")
        @require_web_access()
        def web_endpoint(request):
            ...
    """
    def decorator(func):
        from functools import wraps
        from ninja.errors import HttpError
        
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            user = request.auth
            if not user:
                raise HttpError(401, "Authentication required")
            
            # Check if admin or agency - these can use web
            if is_admin(user) or is_agency(user):
                return func(request, *args, **kwargs)
            
            # Workers and clients should use mobile app
            account_type = get_user_account_type(user)
            if account_type in ['worker', 'client']:
                raise HttpError(403, "This feature is only available on the mobile app")
            
            return func(request, *args, **kwargs)
        
        return wrapper
    return decorator


# Feature flags for staged rollout
import os

ENABLE_WORKER_WEB_UI = os.environ.get('ENABLE_WORKER_WEB_UI', 'false').lower() == 'true'
ENABLE_CLIENT_WEB_UI = os.environ.get('ENABLE_CLIENT_WEB_UI', 'false').lower() == 'true'


def can_access_web_dashboard(user) -> tuple[bool, str]:
    """
    Check if user can access web dashboard.
    
    Returns:
        (can_access: bool, reason: str)
    """
    if is_admin(user):
        return True, "admin"
    
    if is_agency(user):
        return True, "agency"
    
    account_type = get_user_account_type(user)
    
    if account_type == 'worker':
        if ENABLE_WORKER_WEB_UI:
            return True, "worker_with_flag"
        return False, "worker_mobile_only"
    
    if account_type == 'client':
        if ENABLE_CLIENT_WEB_UI:
            return True, "client_with_flag"
        return False, "client_mobile_only"
    
    return False, "unknown_account_type"