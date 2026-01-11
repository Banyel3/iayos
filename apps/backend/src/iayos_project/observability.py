"""
Observability Configuration for iAyos Platform

Provides structured logging, error tracking (Sentry), and metrics collection.
Designed to integrate with cloud monitoring solutions.

Features:
- Structured JSON logging for log aggregation (ELK, CloudWatch)
- Sentry integration for error tracking and performance monitoring
- Request ID tracking for distributed tracing
- Performance timing decorators
"""

import time
import uuid
import logging
import functools
from typing import Optional, Any, Callable
from contextvars import ContextVar
from django.conf import settings

logger = logging.getLogger(__name__)

# Context variable for request ID (for distributed tracing)
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)


def get_request_id() -> str:
    """Get current request ID or generate a new one"""
    rid = request_id_var.get()
    if rid is None:
        rid = str(uuid.uuid4())[:8]
        request_id_var.set(rid)
    return rid


class StructuredLogger:
    """
    Structured logging wrapper for JSON-formatted logs.
    Designed for log aggregation systems (ELK, CloudWatch, Datadog).
    """
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def _format_extra(self, **kwargs) -> dict:
        """Format extra fields for structured logging"""
        return {
            "request_id": get_request_id(),
            "timestamp": time.time(),
            **kwargs
        }
    
    def info(self, message: str, **kwargs):
        self.logger.info(message, extra=self._format_extra(**kwargs))
    
    def warning(self, message: str, **kwargs):
        self.logger.warning(message, extra=self._format_extra(**kwargs))
    
    def error(self, message: str, exception: Optional[Exception] = None, **kwargs):
        extra = self._format_extra(**kwargs)
        if exception:
            extra["exception_type"] = type(exception).__name__
            extra["exception_message"] = str(exception)
        self.logger.error(message, extra=extra, exc_info=exception is not None)
    
    def debug(self, message: str, **kwargs):
        self.logger.debug(message, extra=self._format_extra(**kwargs))


# Global structured logger instance
structured_log = StructuredLogger("iayos")


def configure_sentry():
    """
    Configure Sentry for error tracking and performance monitoring.
    Call this in Django settings or app ready.
    """
    sentry_dsn = getattr(settings, 'SENTRY_DSN', None)
    
    if not sentry_dsn:
        logger.info("Sentry DSN not configured, error tracking disabled")
        return False
    
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.redis import RedisIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
        
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                DjangoIntegration(
                    transaction_style='url',
                    middleware_spans=True,
                ),
                RedisIntegration(),
                LoggingIntegration(
                    level=logging.INFO,
                    event_level=logging.ERROR,
                ),
            ],
            # Performance monitoring
            traces_sample_rate=float(getattr(settings, 'SENTRY_TRACES_SAMPLE_RATE', 0.1)),
            profiles_sample_rate=float(getattr(settings, 'SENTRY_PROFILES_SAMPLE_RATE', 0.1)),
            
            # Environment configuration
            environment=getattr(settings, 'ENVIRONMENT', 'development'),
            release=getattr(settings, 'APP_VERSION', 'unknown'),
            
            # Data scrubbing
            send_default_pii=False,
            
            # Before send hook for filtering
            before_send=_sentry_before_send,
        )
        
        logger.info("Sentry initialized successfully")
        return True
        
    except ImportError:
        logger.warning("sentry-sdk not installed, error tracking disabled")
        return False
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")
        return False


def _sentry_before_send(event, hint):
    """
    Filter events before sending to Sentry.
    Remove sensitive data and filter out noise.
    """
    # Remove sensitive headers
    if 'request' in event and 'headers' in event['request']:
        headers = event['request']['headers']
        sensitive_headers = ['Authorization', 'Cookie', 'X-API-Key']
        for header in sensitive_headers:
            if header in headers:
                headers[header] = '[FILTERED]'
    
    # Filter out common noise errors
    if 'exception' in event:
        for exc_info in event['exception'].get('values', []):
            exc_type = exc_info.get('type', '')
            # Filter out expected exceptions
            if exc_type in ('Http404', 'PermissionDenied', 'AuthenticationFailed'):
                return None
    
    return event


def capture_exception(exception: Exception, **context):
    """
    Capture exception to Sentry with additional context.
    Falls back to logging if Sentry is not configured.
    """
    try:
        import sentry_sdk
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_extra(key, value)
            scope.set_tag("request_id", get_request_id())
            sentry_sdk.capture_exception(exception)
    except ImportError:
        pass
    
    # Always log locally too
    structured_log.error(
        f"Exception captured: {type(exception).__name__}",
        exception=exception,
        **context
    )


def capture_message(message: str, level: str = "info", **context):
    """Capture a message to Sentry with context"""
    try:
        import sentry_sdk
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_extra(key, value)
            scope.set_tag("request_id", get_request_id())
            sentry_sdk.capture_message(message, level=level)
    except ImportError:
        pass


def timed(name: Optional[str] = None, log_args: bool = False):
    """
    Decorator to measure and log function execution time.
    
    Args:
        name: Optional name for the timer (defaults to function name)
        log_args: Whether to log function arguments
    
    Example:
        @timed("database_query")
        def get_jobs():
            ...
    """
    def decorator(func: Callable) -> Callable:
        timer_name = name or func.__name__
        
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            
            try:
                result = func(*args, **kwargs)
                elapsed = (time.perf_counter() - start_time) * 1000  # ms
                
                log_data = {
                    "operation": timer_name,
                    "duration_ms": round(elapsed, 2),
                    "status": "success",
                }
                
                if log_args and args:
                    log_data["args_count"] = len(args)
                
                # Log slow operations
                if elapsed > 1000:  # > 1 second
                    structured_log.warning(
                        f"Slow operation: {timer_name}",
                        **log_data
                    )
                else:
                    structured_log.debug(
                        f"Operation completed: {timer_name}",
                        **log_data
                    )
                
                return result
                
            except Exception as e:
                elapsed = (time.perf_counter() - start_time) * 1000
                structured_log.error(
                    f"Operation failed: {timer_name}",
                    exception=e,
                    operation=timer_name,
                    duration_ms=round(elapsed, 2),
                    status="error",
                )
                raise
        
        return wrapper
    return decorator


class RequestIDMiddleware:
    """
    Middleware to add request ID for distributed tracing.
    Adds X-Request-ID header to all responses.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Get or generate request ID
        request_id = request.META.get('HTTP_X_REQUEST_ID')
        if not request_id:
            request_id = str(uuid.uuid4())[:8]
        
        # Store in context var for logging
        request_id_var.set(request_id)
        
        # Store on request for access in views
        request.request_id = request_id
        
        # Process request
        response = self.get_response(request)
        
        # Add request ID to response
        response['X-Request-ID'] = request_id
        
        return response


def _json_logger_available() -> bool:
    """Check if python-json-logger is available"""
    try:
        import pythonjsonlogger
        return True
    except ImportError:
        return False


def get_logging_config() -> dict:
    """Get logging configuration for structured JSON output"""
    return {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'json': {
                'format': '%(message)s',
                'class': 'pythonjsonlogger.jsonlogger.JsonFormatter' if _json_logger_available() else 'logging.Formatter',
            },
            'standard': {
                'format': '[%(asctime)s] %(levelname)s %(name)s: %(message)s',
            },
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'standard',  # Will be overridden if JSON_LOGGING=true
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'loggers': {
            'django': {
                'handlers': ['console'],
                'level': 'INFO',
                'propagate': False,
            },
            'iayos': {
                'handlers': ['console'],
                'level': 'DEBUG',
                'propagate': False,
            },
        },
    }
