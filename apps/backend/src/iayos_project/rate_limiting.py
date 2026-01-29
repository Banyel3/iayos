"""
Rate Limiting Middleware for iAyos API

Provides protection against brute force attacks and API abuse.
Uses Redis for distributed rate limiting across multiple backend instances.

Rate limits are configurable per endpoint category:
- Authentication: 5 requests/minute (strict)
- API Write: 30 requests/minute (moderate)
- API Read: 100 requests/minute (lenient)
"""

import time
import logging
import hashlib
from functools import wraps
from typing import Optional, Callable
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


class RateLimitExceeded(Exception):
    """Exception raised when rate limit is exceeded"""
    def __init__(self, limit: int, window: int, retry_after: int):
        self.limit = limit
        self.window = window
        self.retry_after = retry_after
        super().__init__(f"Rate limit exceeded: {limit} requests per {window}s")


# Rate limit configurations (per IP address)
# Simplified limits - 20 requests per minute for all categories
RATE_LIMITS = {
    # Authentication endpoints
    "auth": {
        "limit": 20,
        "window": 60,  # 20 per minute per IP
        "key_prefix": "rl:auth",
    },
    # Password reset - strict to prevent abuse
    "password_reset": {
        "limit": 5,
        "window": 300,  # 5 per 5 minutes per IP
        "key_prefix": "rl:pwd",
    },
    # API write operations
    "api_write": {
        "limit": 20,
        "window": 60,  # 20 per minute per IP
        "key_prefix": "rl:write",
    },
    # API read operations
    "api_read": {
        "limit": 20,
        "window": 60,  # 20 per minute per IP
        "key_prefix": "rl:read",
    },
    # File uploads
    "upload": {
        "limit": 20,
        "window": 60,  # 20 per minute per IP
        "key_prefix": "rl:upload",
    },
    # Payment operations
    "payment": {
        "limit": 20,
        "window": 60,  # 20 per minute per IP
        "key_prefix": "rl:payment",
    },
}


def get_client_ip(request) -> str:
    """Extract client IP from request, handling proxies"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Take the first IP (client) from the chain
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', 'unknown')
    return ip


def get_rate_limit_key(category: str, identifier: str) -> str:
    """Generate a rate limit key for caching"""
    config = RATE_LIMITS.get(category, RATE_LIMITS["api_read"])
    # Hash the identifier to prevent key injection
    id_hash = hashlib.md5(identifier.encode()).hexdigest()[:12]
    return f"{config['key_prefix']}:{id_hash}"


def check_rate_limit(category: str, identifier: str) -> tuple[bool, int, int]:
    """
    Check if rate limit is exceeded.
    
    Returns:
        tuple: (is_allowed, current_count, retry_after_seconds)
    """
    config = RATE_LIMITS.get(category, RATE_LIMITS["api_read"])
    key = get_rate_limit_key(category, identifier)
    window = config["window"]
    limit = config["limit"]
    
    try:
        # Get current count
        current = cache.get(key, 0)
        
        if current >= limit:
            # Get TTL for retry-after header
            ttl = cache.ttl(key) if hasattr(cache, 'ttl') else window
            return False, current, ttl if ttl > 0 else window
        
        # Increment counter
        new_count = cache.get_or_set(key, 0, window)
        if new_count == 0:
            cache.set(key, 1, window)
            new_count = 1
        else:
            try:
                new_count = cache.incr(key)
            except ValueError:
                # Key expired between get and incr
                cache.set(key, 1, window)
                new_count = 1
        
        return True, new_count, 0
        
    except Exception as e:
        logger.warning(f"Rate limiting error (allowing request): {e}")
        # Fail open - if Redis is down, allow requests
        return True, 0, 0


def rate_limit(category: str = "api_read", key_func: Optional[Callable] = None):
    """
    Decorator to apply rate limiting to a view function.
    
    Args:
        category: Rate limit category (auth, api_write, api_read, etc.)
        key_func: Optional function to extract the rate limit key from request.
                  Defaults to using client IP.
    
    Example:
        @rate_limit("auth")
        def login(request):
            ...
        
        @rate_limit("api_write", key_func=lambda r: str(r.user.id))
        def create_job(request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Skip rate limiting in debug mode if configured
            if getattr(settings, 'RATE_LIMIT_DISABLED', False):
                return func(request, *args, **kwargs)
            
            # Get identifier for rate limiting
            if key_func:
                try:
                    identifier = key_func(request)
                except Exception:
                    identifier = get_client_ip(request)
            else:
                identifier = get_client_ip(request)
            
            # Check rate limit
            is_allowed, count, retry_after = check_rate_limit(category, identifier)
            
            if not is_allowed:
                config = RATE_LIMITS.get(category, RATE_LIMITS["api_read"])
                logger.warning(
                    f"Rate limit exceeded: {category} for {identifier} "
                    f"({count}/{config['limit']})"
                )
                response = JsonResponse({
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Please try again in {retry_after} seconds.",
                    "retry_after": retry_after,
                }, status=429)
                response["Retry-After"] = str(retry_after)
                response["X-RateLimit-Limit"] = str(config["limit"])
                response["X-RateLimit-Remaining"] = "0"
                response["X-RateLimit-Reset"] = str(int(time.time()) + retry_after)
                return response
            
            # Add rate limit headers to successful responses
            response = func(request, *args, **kwargs)
            
            if hasattr(response, '__setitem__'):
                config = RATE_LIMITS.get(category, RATE_LIMITS["api_read"])
                response["X-RateLimit-Limit"] = str(config["limit"])
                response["X-RateLimit-Remaining"] = str(max(0, config["limit"] - count))
            
            return response
        
        return wrapper
    return decorator


class RateLimitMiddleware:
    """
    Django middleware for global rate limiting.
    
    Applies automatic rate limiting based on request method and path:
    - POST/PUT/DELETE to /api/accounts/login|register → auth limits
    - POST/PUT/DELETE to /api/ → api_write limits
    - GET to /api/ → api_read limits
    """
    
    # Paths that should use auth rate limits
    AUTH_PATHS = [
        '/api/accounts/login',
        '/api/accounts/register',
        '/api/mobile/auth/login',
        '/api/mobile/auth/register',
        '/api/accounts/password-reset',
        '/api/accounts/forgot-password',
    ]
    
    # Paths that should use payment rate limits
    PAYMENT_PATHS = [
        '/api/mobile/wallet/deposit',
        '/api/mobile/wallet/withdraw',
        '/api/mobile/payments/',
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip rate limiting for health checks
        if request.path.startswith('/health/'):
            return self.get_response(request)
        
        # Skip if disabled
        if getattr(settings, 'RATE_LIMIT_DISABLED', False):
            return self.get_response(request)
        
        # Only rate limit API endpoints
        if not request.path.startswith('/api/'):
            return self.get_response(request)
        
        # Determine category based on path and method
        category = self._get_category(request)
        
        # Get client identifier
        identifier = get_client_ip(request)
        
        # Check rate limit
        is_allowed, count, retry_after = check_rate_limit(category, identifier)
        
        if not is_allowed:
            config = RATE_LIMITS.get(category, RATE_LIMITS["api_read"])
            logger.warning(
                f"Rate limit exceeded: {category} for {identifier} "
                f"({count}/{config['limit']}) on {request.path}"
            )
            response = JsonResponse({
                "error": "Rate limit exceeded",
                "message": f"Too many requests. Please try again in {retry_after} seconds.",
                "retry_after": retry_after,
            }, status=429)
            response["Retry-After"] = str(retry_after)
            return response
        
        return self.get_response(request)
    
    def _get_category(self, request) -> str:
        """Determine rate limit category based on request"""
        path = request.path.lower()
        method = request.method
        
        # Check auth paths
        for auth_path in self.AUTH_PATHS:
            if path.startswith(auth_path):
                return "auth"
        
        # Check payment paths
        for payment_path in self.PAYMENT_PATHS:
            if path.startswith(payment_path):
                return "payment"
        
        # Check for upload paths
        if 'upload' in path or 'avatar' in path or 'portfolio' in path:
            return "upload"
        
        # Default based on method
        if method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            return "api_write"
        
        return "api_read"
