"""
Health Check Endpoints for Kubernetes/Docker readiness and liveness probes.

Provides:
- /health/live - Liveness probe (is the app running?)
- /health/ready - Readiness probe (is the app ready to serve traffic?)
- /health/status - Detailed status including circuit breakers
"""

import time
import logging
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache

logger = logging.getLogger(__name__)


def liveness_check(request):
    """
    Liveness probe - returns 200 if the application is running.
    Used by Kubernetes to determine if the container needs to be restarted.
    """
    return JsonResponse({
        "status": "alive",
        "timestamp": time.time(),
    })


def readiness_check(request):
    """
    Readiness probe - returns 200 if the application can serve traffic.
    Checks database connectivity and other critical dependencies.
    """
    checks = {
        "database": False,
        "cache": False,
    }
    
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            checks["database"] = True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
    
    # Check cache (Redis)
    try:
        cache.set("health_check", "ok", timeout=5)
        if cache.get("health_check") == "ok":
            checks["cache"] = True
    except Exception as e:
        logger.warning(f"Cache health check failed: {e}")
        # Cache failure is not critical for readiness
        checks["cache"] = None  # Unknown/not configured
    
    # Determine overall status
    is_ready = checks["database"]  # Database is required
    
    response_data = {
        "status": "ready" if is_ready else "not_ready",
        "checks": checks,
        "timestamp": time.time(),
    }
    
    status_code = 200 if is_ready else 503
    return JsonResponse(response_data, status=status_code)


def detailed_status(request):
    """
    Detailed health status including circuit breaker states.
    Protected - should only be exposed internally or with auth.
    """
    checks = {
        "database": False,
        "cache": False,
        "circuit_breakers": [],
    }
    
    # Check database with timing
    db_start = time.time()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            checks["database"] = True
            checks["database_latency_ms"] = round((time.time() - db_start) * 1000, 2)
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        checks["database_error"] = str(e)
    
    # Check cache with timing
    cache_start = time.time()
    try:
        cache.set("health_check", "ok", timeout=5)
        if cache.get("health_check") == "ok":
            checks["cache"] = True
            checks["cache_latency_ms"] = round((time.time() - cache_start) * 1000, 2)
    except Exception as e:
        logger.warning(f"Cache health check failed: {e}")
        checks["cache_error"] = str(e)
    
    # Get circuit breaker status
    try:
        from iayos_project.circuit_breaker import get_all_circuit_breaker_status
        checks["circuit_breakers"] = get_all_circuit_breaker_status()
    except ImportError:
        checks["circuit_breakers"] = None
    except Exception as e:
        checks["circuit_breaker_error"] = str(e)
    
    # Get cache statistics (if Redis)
    try:
        from iayos_project.query_cache import CacheStats
        checks["cache_stats"] = CacheStats.get_stats()
    except ImportError:
        checks["cache_stats"] = None
    except Exception as e:
        checks["cache_stats_error"] = str(e)
    
    # Determine overall status
    is_healthy = checks["database"]
    
    response_data = {
        "status": "healthy" if is_healthy else "unhealthy",
        "checks": checks,
        "timestamp": time.time(),
    }
    
    status_code = 200 if is_healthy else 503
    return JsonResponse(response_data, status=status_code)
