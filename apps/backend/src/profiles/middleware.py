from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from django.conf import settings
import jwt

User = get_user_model()


@database_sync_to_async
def get_user_from_jwt(token):
    """Get user from JWT token"""
    try:
        # Decode the JWT token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')
        
        if user_id:
            return User.objects.get(accountID=user_id)
    except jwt.ExpiredSignatureError:
        print(f"[WebSocket Auth] Token has expired")
    except jwt.InvalidTokenError as e:
        print(f"[WebSocket Auth] Invalid token: {str(e)}")
    except User.DoesNotExist:
        print(f"[WebSocket Auth] User not found: {user_id}")
    except Exception as e:
        print(f"[WebSocket Auth] Error: {str(e)}")
    
    return AnonymousUser()


class SessionAuthMiddleware(BaseMiddleware):
    """
    Custom middleware that authenticates WebSocket connections using JWT tokens from cookies.
    Extracts the access token from cookies and validates it.
    """
    
    async def __call__(self, scope, receive, send):
        # Get cookies from headers
        headers = dict(scope.get('headers', []))
        cookie_header = headers.get(b'cookie', b'').decode()
        
        # Parse access token from cookies
        access_token = None
        if cookie_header:
            cookies = {}
            for cookie in cookie_header.split('; '):
                if '=' in cookie:
                    key, value = cookie.split('=', 1)
                    cookies[key] = value
            access_token = cookies.get('access')
            
            print(f"[WebSocket Auth] Cookies found: {', '.join(cookies.keys())}")
        
        # Get user from JWT token
        if access_token:
            print(f"[WebSocket Auth] Access token found: {access_token[:30]}...")
            scope['user'] = await get_user_from_jwt(access_token)
            print(f"[WebSocket Auth] Authenticated user: {scope['user']}")
        else:
            scope['user'] = AnonymousUser()
            print(f"[WebSocket Auth] No access token found in cookies")
        
        return await super().__call__(scope, receive, send)
