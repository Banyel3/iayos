"""
Payment Provider Abstraction Layer
===================================
Provides a unified interface for payment gateway operations.

Primary Provider: PayMongo
Deprecated: Xendit (kept for legacy webhook handling only)

NOTE: As of February 2026, PayMongo is the only active payment provider.
Xendit support is deprecated and maintained only for processing historical
transaction webhooks. Do not use Xendit for new transactions.

This abstraction allows:
1. Consistent API across all payment flows
2. Clean separation of payment logic from business logic
3. Legacy webhook handling for historical Xendit transactions
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class PaymentProviderInterface(ABC):
    """
    Abstract interface for payment providers.
    All payment providers must implement these methods.
    """
    
    @abstractmethod
    def create_checkout_session(
        self,
        amount: float,
        currency: str,
        description: str,
        user_email: str,
        user_name: str,
        transaction_id: int,
        payment_methods: list[str],
        success_url: str,
        failure_url: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a checkout session for customer payment.
        
        Args:
            amount: Amount in currency units (e.g., PHP)
            currency: Currency code (e.g., "PHP")
            description: Payment description
            user_email: Customer email
            user_name: Customer name
            transaction_id: Internal transaction reference
            payment_methods: List of allowed payment methods (e.g., ["gcash", "card"])
            success_url: URL to redirect on success
            failure_url: URL to redirect on failure
            metadata: Additional metadata to store with payment
            
        Returns:
            Dict with keys:
                - success: bool
                - checkout_url: str (URL to redirect customer)
                - checkout_id: str (provider's session/invoice ID)
                - external_id: str (our reference ID)
                - expiry_date: str (ISO datetime)
                - error: str (if success=False)
        """
        pass
    
    @abstractmethod
    def create_disbursement(
        self,
        amount: float,
        currency: str,
        recipient_name: str,
        account_number: str,
        channel_code: str,
        transaction_id: int,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a disbursement/payout to a recipient.
        
        Args:
            amount: Amount to disburse
            currency: Currency code
            recipient_name: Account holder name
            account_number: Account/phone number
            channel_code: Payment channel (e.g., "GCASH", "BPI")
            transaction_id: Internal transaction reference
            description: Disbursement description
            metadata: Additional metadata
            
        Returns:
            Dict with keys:
                - success: bool
                - disbursement_id: str
                - external_id: str
                - status: str (PENDING, COMPLETED, FAILED)
                - error: str (if success=False)
        """
        pass
    
    @abstractmethod
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Get the current status of a payment.
        
        Args:
            payment_id: Provider's payment/checkout ID
            
        Returns:
            Dict with keys:
                - success: bool
                - status: str (pending, paid, failed, expired)
                - amount: float
                - paid_amount: float
                - payment_method: str
                - payment_channel: str
                - error: str (if success=False)
        """
        pass
    
    @abstractmethod
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify webhook signature from provider.
        
        Args:
            payload: Raw request body bytes
            signature: Signature header from webhook
            
        Returns:
            bool: True if signature is valid
        """
        pass
    
    @abstractmethod
    def parse_webhook_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse and normalize webhook payload.
        
        Args:
            payload: JSON payload from webhook
            
        Returns:
            Normalized dict with keys:
                - event_type: str (payment.paid, payment.failed, payout.paid, etc.)
                - payment_id: str
                - external_id: str
                - status: str
                - amount: float
                - payment_method: str
                - payment_channel: str
                - paid_at: str (ISO datetime)
                - metadata: dict
        """
        pass
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the provider name (e.g., 'paymongo', 'xendit')"""
        pass


def get_payment_provider() -> PaymentProviderInterface:
    """
    Factory function to get the payment provider.
    
    Returns PayMongo as the only active provider.
    Xendit is deprecated and only used for legacy webhook processing.
    """
    # Always use PayMongo for new transactions
    from .paymongo_service import PayMongoService
    return PayMongoService()


# Status mapping constants for consistent status handling
class PaymentStatus:
    """Normalized payment status values"""
    PENDING = "pending"
    PAID = "paid"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class DisbursementStatus:
    """Normalized disbursement/payout status values"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# Channel code mappings for consistency
GCASH_CHANNEL = "gcash"
MAYA_CHANNEL = "paymaya"
BANK_TRANSFER_CHANNEL = "bank"
CARD_CHANNEL = "card"
