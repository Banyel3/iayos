"""
Custom CORS middleware to handle React Native mobile app requests.

React Native apps don't send an Origin header, which causes Django's CORS
middleware to block requests in production. This middleware allows requests
with null/missing Origin headers while maintaining security through other checks.
"""

from django.http import HttpResponse


class MobileCORSMiddleware:
    """
    Middleware to handle CORS for mobile apps that don't send Origin header.
    
    This middleware runs AFTER django-cors-headers CorsMiddleware and handles
    requests that were not processed by it (typically mobile apps with no Origin).
    
    Security considerations:
    - Only adds CORS headers if not already present (doesn't override CorsMiddleware)
    - Allows requests without Origin (mobile apps)
    - Maintains authentication requirements (JWT/cookie)
    - Only applies to API endpoints
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if this is an API request
        is_api_request = request.path.startswith('/api/')
        
        # Check if CorsMiddleware already handled this (has CORS headers)
        response = self.get_response(request)
        has_cors_headers = 'Access-Control-Allow-Origin' in response
        
        # If it's an API request and CORS headers are missing (mobile app case)
        if is_api_request and not has_cors_headers:
            origin = request.headers.get('Origin')
            
            # Handle preflight OPTIONS request
            if request.method == 'OPTIONS':
                response = HttpResponse()
                response.status_code = 200
            
            # Add CORS headers for mobile apps (no Origin or null Origin)
            if not origin or origin == 'null':
                response['Access-Control-Allow-Origin'] = '*'
                response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
                response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, X-Requested-With'
                response['Access-Control-Allow-Credentials'] = 'true'
                response['Access-Control-Max-Age'] = '86400'  # 24 hours
        
        return response
