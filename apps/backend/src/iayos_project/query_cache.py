"""
Query Caching Utilities for iAyos Platform

Provides Redis-based query caching to reduce database load and improve response times.
Implements cache-aside pattern with automatic invalidation.

Features:
- Decorator-based caching for query functions
- Automatic cache key generation
- TTL-based expiration
- Manual invalidation support
- Cache warming utilities
"""

import hashlib
import json
import logging
import functools
from typing import Any, Callable, Optional, Union
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)

# Default cache TTLs (in seconds)
CACHE_TTL = {
    "short": 60,          # 1 minute - frequently changing data
    "medium": 300,        # 5 minutes - moderately stable data
    "long": 900,          # 15 minutes - stable data
    "very_long": 3600,    # 1 hour - very stable data (categories, etc.)
}

# Cache key prefixes for different data types
CACHE_PREFIXES = {
    "job_list": "cache:jobs:list",
    "job_detail": "cache:jobs:detail",
    "worker_list": "cache:workers:list",
    "worker_detail": "cache:workers:detail",
    "category": "cache:categories",
    "stats": "cache:stats",
    "user": "cache:user",
}


def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """
    Generate a deterministic cache key from arguments.
    
    Args:
        prefix: Cache key prefix (e.g., "jobs:list")
        *args: Positional arguments to include in key
        **kwargs: Keyword arguments to include in key
    
    Returns:
        str: MD5 hash-based cache key
    """
    # Create a string representation of all arguments
    key_parts = [prefix]
    
    # Add positional args
    for arg in args:
        if arg is not None:
            key_parts.append(str(arg))
    
    # Add sorted kwargs for consistency
    for key in sorted(kwargs.keys()):
        value = kwargs[key]
        if value is not None:
            key_parts.append(f"{key}={value}")
    
    # Join and hash
    key_string = ":".join(key_parts)
    key_hash = hashlib.md5(key_string.encode()).hexdigest()[:16]
    
    return f"{prefix}:{key_hash}"


def cached_query(
    prefix: str,
    ttl: Union[int, str] = "medium",
    version: int = 1,
    skip_cache_func: Optional[Callable] = None,
):
    """
    Decorator to cache query results in Redis.
    
    Args:
        prefix: Cache key prefix
        ttl: Time-to-live in seconds or named duration ("short", "medium", "long")
        version: Cache version (increment to invalidate all cached data)
        skip_cache_func: Optional function that returns True to skip caching
    
    Example:
        @cached_query("jobs:list", ttl="medium")
        def get_job_list(category_id=None, page=1):
            return list(Job.objects.filter(...))
        
        # With skip function
        @cached_query("jobs:detail", skip_cache_func=lambda job_id: job_id is None)
        def get_job_detail(job_id):
            return Job.objects.get(pk=job_id)
    """
    # Resolve TTL
    if isinstance(ttl, str):
        ttl_seconds = CACHE_TTL.get(ttl, CACHE_TTL["medium"])
    else:
        ttl_seconds = ttl
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Check if caching should be skipped
            if skip_cache_func and skip_cache_func(*args, **kwargs):
                return func(*args, **kwargs)
            
            # Check if cache is disabled
            if getattr(settings, 'QUERY_CACHE_DISABLED', False):
                return func(*args, **kwargs)
            
            # Generate cache key
            versioned_prefix = f"{prefix}:v{version}"
            cache_key = generate_cache_key(versioned_prefix, *args, **kwargs)
            
            # Try to get from cache
            try:
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    logger.debug(f"Cache HIT: {cache_key}")
                    return cached_result
            except Exception as e:
                logger.warning(f"Cache read error: {e}")
            
            # Cache miss - execute query
            logger.debug(f"Cache MISS: {cache_key}")
            result = func(*args, **kwargs)
            
            # Store in cache
            try:
                cache.set(cache_key, result, ttl_seconds)
            except Exception as e:
                logger.warning(f"Cache write error: {e}")
            
            return result
        
        # Attach cache key generator for manual invalidation
        wrapper.get_cache_key = lambda *a, **kw: generate_cache_key(
            f"{prefix}:v{version}", *a, **kw
        )
        wrapper.cache_prefix = f"{prefix}:v{version}"
        
        return wrapper
    
    return decorator


def invalidate_cache(prefix: str, *args, **kwargs):
    """
    Invalidate a specific cache entry.
    
    Args:
        prefix: Cache key prefix
        *args, **kwargs: Arguments used to generate the original key
    """
    cache_key = generate_cache_key(prefix, *args, **kwargs)
    try:
        cache.delete(cache_key)
        logger.debug(f"Cache invalidated: {cache_key}")
    except Exception as e:
        logger.warning(f"Cache invalidation error: {e}")


def invalidate_cache_pattern(pattern: str):
    """
    Invalidate all cache entries matching a pattern.
    Note: Requires Redis backend with SCAN support.
    
    Args:
        pattern: Cache key pattern (e.g., "cache:jobs:*")
    """
    try:
        from django_redis import get_redis_connection
        redis_conn = get_redis_connection("default")
        
        cursor = 0
        deleted = 0
        while True:
            cursor, keys = redis_conn.scan(cursor, match=pattern, count=100)
            if keys:
                redis_conn.delete(*keys)
                deleted += len(keys)
            if cursor == 0:
                break
        
        logger.info(f"Cache pattern invalidated: {pattern} ({deleted} keys)")
        return deleted
    except Exception as e:
        logger.warning(f"Cache pattern invalidation error: {e}")
        return 0


def cache_job_list_invalidate(job_id: Optional[int] = None):
    """Invalidate job list caches when a job is modified"""
    invalidate_cache_pattern("cache:jobs:list:*")
    if job_id:
        invalidate_cache_pattern(f"cache:jobs:detail:*{job_id}*")


def cache_worker_invalidate(worker_id: Optional[int] = None):
    """Invalidate worker caches when a worker profile is modified"""
    invalidate_cache_pattern("cache:workers:*")


# Pre-configured cached query decorators for common use cases
def cached_job_list(ttl: str = "short"):
    """Decorator for caching job list queries"""
    return cached_query(CACHE_PREFIXES["job_list"], ttl=ttl)


def cached_job_detail(ttl: str = "medium"):
    """Decorator for caching job detail queries"""
    return cached_query(CACHE_PREFIXES["job_detail"], ttl=ttl)


def cached_worker_list(ttl: str = "medium"):
    """Decorator for caching worker list queries"""
    return cached_query(CACHE_PREFIXES["worker_list"], ttl=ttl)


def cached_categories(ttl: str = "very_long"):
    """Decorator for caching category queries"""
    return cached_query(CACHE_PREFIXES["category"], ttl=ttl)


def cached_stats(ttl: str = "short"):
    """Decorator for caching statistics queries"""
    return cached_query(CACHE_PREFIXES["stats"], ttl=ttl)


class CacheStats:
    """Utility class for monitoring cache performance"""
    
    @staticmethod
    def get_stats() -> dict:
        """Get cache statistics (if Redis backend)"""
        try:
            from django_redis import get_redis_connection
            redis_conn = get_redis_connection("default")
            info = redis_conn.info()
            
            return {
                "connected": True,
                "used_memory": info.get("used_memory_human", "unknown"),
                "connected_clients": info.get("connected_clients", 0),
                "total_keys": redis_conn.dbsize(),
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
                "hit_rate": round(
                    info.get("keyspace_hits", 0) / 
                    max(info.get("keyspace_hits", 0) + info.get("keyspace_misses", 0), 1) * 100,
                    2
                ),
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
            }
