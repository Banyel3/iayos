"""
Health Check Middleware - Bypasses ALLOWED_HOSTS for health probe paths.

PaaS platforms (DigitalOcean App Platform, Kubernetes, etc.) send health check
probes using dynamic internal IPs (e.g. 100.127.x.x) that aren't in
ALLOWED_HOSTS.  This middleware intercepts requests to /health/* paths and
lets them through before CommonMiddleware validates the Host header.

Must be placed BEFORE 'django.middleware.common.CommonMiddleware' in MIDDLEWARE.
"""

import time
import logging
from django.http import JsonResponse

logger = logging.getLogger(__name__)


class HealthCheckMiddleware:
    """Return 200 for /health/* paths without host validation."""

    HEALTH_PATHS = ("/health/live", "/health/ready", "/health/status")

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path in self.HEALTH_PATHS:
            # Minimal liveness response — avoids touching DB/cache so it
            # works even during startup before Django is fully initialised.
            return JsonResponse({
                "status": "ok",
                "timestamp": time.time(),
            })
        return self.get_response(request)
