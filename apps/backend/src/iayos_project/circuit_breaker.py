"""
Circuit Breaker Pattern Implementation for External Service Calls

Provides fault tolerance for external API calls (Xendit, Supabase, etc.)
by preventing cascading failures when downstream services are unhealthy.

States:
- CLOSED: Normal operation, requests flow through
- OPEN: Failures exceeded threshold, requests fail-fast
- HALF_OPEN: Testing if service recovered, limited requests allowed

Usage:
    from iayos_project.circuit_breaker import circuit_breaker, CircuitBreakerOpen
    
    @circuit_breaker("xendit", failure_threshold=5, recovery_timeout=30)
    def call_xendit_api():
        response = requests.post(...)
        response.raise_for_status()
        return response.json()
"""

import time
import threading
import functools
import logging
from typing import Callable, Any, Optional
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing fast
    HALF_OPEN = "half_open"  # Testing recovery


class CircuitBreakerOpen(Exception):
    """Exception raised when circuit breaker is open"""
    def __init__(self, service_name: str, retry_after: float):
        self.service_name = service_name
        self.retry_after = retry_after
        super().__init__(
            f"Circuit breaker OPEN for {service_name}. "
            f"Retry after {retry_after:.1f} seconds."
        )


@dataclass
class CircuitBreakerState:
    """State container for a circuit breaker"""
    name: str
    state: CircuitState = CircuitState.CLOSED
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: Optional[float] = None
    last_success_time: Optional[float] = None
    half_open_calls: int = 0
    
    # Configuration
    failure_threshold: int = 5
    recovery_timeout: float = 30.0  # seconds
    half_open_max_calls: int = 3
    success_threshold: int = 2  # successes needed to close from half-open
    
    # Thread safety
    _lock: threading.Lock = field(default_factory=threading.Lock)
    
    def record_success(self):
        """Record a successful call"""
        with self._lock:
            self.success_count += 1
            self.last_success_time = time.time()
            
            if self.state == CircuitState.HALF_OPEN:
                self.half_open_calls += 1
                if self.success_count >= self.success_threshold:
                    self._transition_to_closed()
            elif self.state == CircuitState.CLOSED:
                # Reset failure count on success
                self.failure_count = 0
    
    def record_failure(self, error: Exception = None):
        """Record a failed call"""
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.state == CircuitState.HALF_OPEN:
                # Any failure in half-open immediately opens circuit
                self._transition_to_open()
            elif self.state == CircuitState.CLOSED:
                if self.failure_count >= self.failure_threshold:
                    self._transition_to_open()
            
            logger.warning(
                f"Circuit breaker '{self.name}' recorded failure "
                f"({self.failure_count}/{self.failure_threshold}): {error}"
            )
    
    def can_execute(self) -> bool:
        """Check if a request can be executed"""
        with self._lock:
            if self.state == CircuitState.CLOSED:
                return True
            
            if self.state == CircuitState.OPEN:
                # Check if recovery timeout has passed
                if self._should_attempt_recovery():
                    self._transition_to_half_open()
                    return True
                return False
            
            if self.state == CircuitState.HALF_OPEN:
                # Allow limited calls in half-open state
                return self.half_open_calls < self.half_open_max_calls
            
            return False
    
    def get_retry_after(self) -> float:
        """Get seconds until retry is allowed"""
        if self.state != CircuitState.OPEN:
            return 0.0
        if self.last_failure_time is None:
            return 0.0
        elapsed = time.time() - self.last_failure_time
        return max(0.0, self.recovery_timeout - elapsed)
    
    def _should_attempt_recovery(self) -> bool:
        """Check if enough time has passed to attempt recovery"""
        if self.last_failure_time is None:
            return True
        elapsed = time.time() - self.last_failure_time
        return elapsed >= self.recovery_timeout
    
    def _transition_to_open(self):
        """Transition to OPEN state"""
        self.state = CircuitState.OPEN
        logger.error(
            f"Circuit breaker '{self.name}' OPENED after "
            f"{self.failure_count} failures"
        )
    
    def _transition_to_half_open(self):
        """Transition to HALF_OPEN state"""
        self.state = CircuitState.HALF_OPEN
        self.half_open_calls = 0
        self.success_count = 0
        logger.info(f"Circuit breaker '{self.name}' entering HALF_OPEN state")
    
    def _transition_to_closed(self):
        """Transition to CLOSED state"""
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.half_open_calls = 0
        logger.info(f"Circuit breaker '{self.name}' CLOSED - service recovered")
    
    def get_status(self) -> dict:
        """Get current status for monitoring"""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure": datetime.fromtimestamp(self.last_failure_time).isoformat() 
                if self.last_failure_time else None,
            "last_success": datetime.fromtimestamp(self.last_success_time).isoformat()
                if self.last_success_time else None,
            "retry_after_seconds": self.get_retry_after(),
        }


# Global registry of circuit breakers
_circuit_breakers: dict[str, CircuitBreakerState] = {}
_registry_lock = threading.Lock()


def get_circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: float = 30.0,
    half_open_max_calls: int = 3,
    success_threshold: int = 2,
) -> CircuitBreakerState:
    """Get or create a circuit breaker by name"""
    with _registry_lock:
        if name not in _circuit_breakers:
            _circuit_breakers[name] = CircuitBreakerState(
                name=name,
                failure_threshold=failure_threshold,
                recovery_timeout=recovery_timeout,
                half_open_max_calls=half_open_max_calls,
                success_threshold=success_threshold,
            )
        return _circuit_breakers[name]


def circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: float = 30.0,
    fallback: Optional[Callable[..., Any]] = None,
    exceptions: tuple = (Exception,),
):
    """
    Decorator to wrap a function with circuit breaker protection
    
    Args:
        name: Unique identifier for this circuit breaker
        failure_threshold: Number of failures before opening circuit
        recovery_timeout: Seconds to wait before attempting recovery
        fallback: Optional function to call when circuit is open
        exceptions: Tuple of exception types that trigger failures
    
    Example:
        @circuit_breaker("xendit", failure_threshold=5, recovery_timeout=30)
        def call_xendit():
            return requests.post(...)
    """
    def decorator(func: Callable) -> Callable:
        cb = get_circuit_breaker(
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
        )
        
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if not cb.can_execute():
                if fallback:
                    logger.warning(
                        f"Circuit breaker '{name}' open, using fallback"
                    )
                    return fallback(*args, **kwargs)
                raise CircuitBreakerOpen(name, cb.get_retry_after())
            
            try:
                result = func(*args, **kwargs)
                cb.record_success()
                return result
            except exceptions as e:
                cb.record_failure(e)
                raise
        
        # Attach circuit breaker state for inspection
        wrapper.circuit_breaker = cb
        return wrapper
    
    return decorator


def get_all_circuit_breaker_status() -> list[dict]:
    """Get status of all circuit breakers for monitoring"""
    with _registry_lock:
        return [cb.get_status() for cb in _circuit_breakers.values()]


def reset_circuit_breaker(name: str) -> bool:
    """Manually reset a circuit breaker to CLOSED state"""
    with _registry_lock:
        if name in _circuit_breakers:
            cb = _circuit_breakers[name]
            cb._transition_to_closed()
            return True
        return False


# Pre-configured circuit breakers for common services
XENDIT_CB_CONFIG = {
    "name": "xendit",
    "failure_threshold": 5,
    "recovery_timeout": 60.0,  # 1 minute
}

SUPABASE_CB_CONFIG = {
    "name": "supabase",
    "failure_threshold": 3,
    "recovery_timeout": 30.0,  # 30 seconds
}

RESEND_CB_CONFIG = {
    "name": "resend_email",
    "failure_threshold": 3,
    "recovery_timeout": 60.0,  # 1 minute
}
