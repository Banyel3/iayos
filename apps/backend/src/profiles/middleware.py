from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from django.conf import settings
import jwt

User = get_user_model()


@database_sync_to_async
def get_user_from_jwt(token):
    """Get user from JWT token and attach profile_type for dual-profile users"""
    try:
        # Decode the JWT token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')
        profile_type = payload.get('profile_type')  # Extract profile_type from JWT
        
        if user_id:
            user = User.objects.get(accountID=user_id)
            # Attach profile_type to user object for dual-profile support
            if profile_type:
                user.profile_type = profile_type
                print(f"[WebSocket Auth] Profile type from JWT: {profile_type}")
            return user
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
    Custom middleware that authenticates WebSocket connections using JWT tokens.
    Supports both:
    1. JWT token from cookies (access cookie)
    2. JWT token from query parameters (?token=xxx)
    """
    
    async def __call__(self, scope, receive, send):
        print(f"[WebSocket Auth] ========== NEW CONNECTION ==========")
        print(f"[WebSocket Auth] Scope type: {scope.get('type')}")
        print(f"[WebSocket Auth] Path: {scope.get('path')}")
        
        access_token = None
        
        # First try to get token from query string (higher priority for WebSocket)
        query_string = scope.get('query_string', b'').decode()
        print(f"[WebSocket Auth] Query string: {query_string[:50] if query_string else 'None'}...")
        
        if query_string:
            from urllib.parse import parse_qs
            params = parse_qs(query_string)
            if 'token' in params:
                access_token = params['token'][0]
                print(f"[WebSocket Auth] Token from query param: {access_token[:30]}...")
        
        # If no query token, try cookies
        if not access_token:
            headers = dict(scope.get('headers', []))
            cookie_header = headers.get(b'cookie', b'').decode()
            
            if cookie_header:
                cookies = {}
                for cookie in cookie_header.split('; '):
                    if '=' in cookie:
                        key, value = cookie.split('=', 1)
                        cookies[key] = value
                access_token = cookies.get('access')
                
                if access_token:
                    print(f"[WebSocket Auth] Token from cookie: {access_token[:30]}...")
                else:
                    print(f"[WebSocket Auth] Cookies found but no 'access': {', '.join(cookies.keys())}")
        
        # Get user from JWT token
        if access_token:
            scope['user'] = await get_user_from_jwt(access_token)
            print(f"[WebSocket Auth] Authenticated user: {scope['user']}")
        else:
            scope['user'] = AnonymousUser()
            print(f"[WebSocket Auth] No access token found")
        
        return await super().__call__(scope, receive, send)
