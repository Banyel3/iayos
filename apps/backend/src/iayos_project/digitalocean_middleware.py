"""
DigitalOcean Internal Network Middleware

Allows health checks and internal traffic from DigitalOcean's infrastructure.
DigitalOcean uses various internal IP ranges for load balancing and health checks.
"""

import re
from django.core.exceptions import DisallowedHost
from django.http import HttpResponse


class DigitalOceanInternalIPMiddleware:
    """
    Middleware to allow DigitalOcean internal network IPs to bypass ALLOWED_HOSTS.
    
    DigitalOcean App Platform uses internal IP ranges for:
    - Load balancer health checks
    - Internal service-to-service communication
    - Container orchestration
    
    Known internal IP ranges:
    - 10.244.x.x (container network)
    - 100.64.x.x - 100.127.x.x (carrier-grade NAT range per RFC 6598)
    
    These IPs should be allowed without adding them to ALLOWED_HOSTS.
    """
    
    # Match common private/internal IP ranges used by DigitalOcean
    INTERNAL_IP_PATTERNS = [
        re.compile(r'^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$'),        # 10.0.0.0/8
        re.compile(r'^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}$'),  # 100.64.0.0/10
        re.compile(r'^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$'),  # 172.16.0.0/12
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def is_internal_ip(self, ip):
        """Check if IP matches any internal network pattern."""
        return any(pattern.match(ip) for pattern in self.INTERNAL_IP_PATTERNS)
    
    def __call__(self, request):
        # For health check endpoint, bypass ALLOWED_HOSTS validation for internal IPs
        if request.path == '/health/status':
            raw_host = request.META.get('HTTP_HOST', '')
            host_ip = raw_host.split(':')[0] if ':' in raw_host else raw_host
            
            if self.is_internal_ip(host_ip):
                # Temporarily override get_host to bypass validation
                original_get_host = request.get_host
                request.get_host = lambda: host_ip
                try:
                    response = self.get_response(request)
                    return response
                finally:
                    request.get_host = original_get_host
        
        # Normal request processing
        response = self.get_response(request)
        return response
