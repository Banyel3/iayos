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
            print("🔐 JWTBearer CALLED!")
            print(f"🔐 Request path: {request.path}")
            print(f"🔐 Token present: {bool(token)}")

            if not token:
                print("❌ No token provided")
                return None

            # Decode the JWT token
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get('user_id')

            if not user_id:
                print("❌ No user_id in token payload")
                return None

            print(f"🔐 Token validated - User ID: {user_id}")

            # Get the user
            user = Accounts.objects.get(accountID=user_id)
            print(f"✅ Authentication SUCCESS - User: {user.email}")
            return user

        except jwt.ExpiredSignatureError:
            print("❌ Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"❌ Invalid token: {str(e)}")
            return None
        except Accounts.DoesNotExist:
            print(f"❌ User not found: {user_id}")
            return None
        except Exception as e:
            print(f"❌ Authentication FAILED: {str(e)}")
            print(f"❌ Full traceback:")
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
        print("🔐 CookieJWTAuth CALLED!")
        print(f"🔐 Request path: {request.path}")
        print(f"🔐 All cookies: {dict(request.COOKIES)}")

        raw_token = request.COOKIES.get('access')
        print(f"🔐 Access token present: {bool(raw_token)}")

        if not raw_token:
            print("❌ No access token in cookies")
            return None

        try:
            print(f"🔐 Token: {raw_token[:30]}...")
            # Decode the JWT token
            payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get('user_id')

            if not user_id:
                print("❌ No user_id in token payload")
                return None

            print(f"🔐 Token validated - User ID: {user_id}")

            user = Accounts.objects.get(accountID=user_id)
            print(f"✅ Authentication SUCCESS - User: {user.email}")
            return user

        except jwt.ExpiredSignatureError:
            print("❌ Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"❌ Invalid token: {str(e)}")
            return None
        except Accounts.DoesNotExist:
            print(f"❌ User not found: {user_id}")
            return None
        except Exception as e:
            print(f"❌ Authentication FAILED: {str(e)}")
            print(f"❌ Full traceback:")
            traceback.print_exc()
            return None

# Create instance
cookie_auth = CookieJWTAuth()