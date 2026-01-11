"""
Xendit Payment Provider Adapter
===============================
Wraps existing XenditService to implement PaymentProviderInterface.
Allows seamless switching between PayMongo and Xendit via config.

This is a thin adapter that delegates to the existing XenditService.
"""

from typing import Dict, Any, Optional, List
import logging

from .payment_provider import (
    PaymentProviderInterface,
    PaymentStatus,
    DisbursementStatus,
)
from .xendit_service import XenditService

logger = logging.getLogger(__name__)


class XenditProvider(PaymentProviderInterface):
    """
    Xendit payment provider implementation.
    Adapts existing XenditService to PaymentProviderInterface.
    """
    
    def __init__(self):
        # XenditService is mostly static methods, no instance needed
        pass
    
    @property
    def provider_name(self) -> str:
        return "xendit"
    
    def create_checkout_session(
        self,
        amount: float,
        currency: str,
        description: str,
        user_email: str,
        user_name: str,
        transaction_id: int,
        payment_methods: List[str],
        success_url: str,
        failure_url: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a Xendit invoice as checkout session.
        Maps PaymentProviderInterface to XenditService.create_gcash_payment().
        """
        # Xendit's create_gcash_payment handles all the logic
        result = XenditService.create_gcash_payment(
            amount=amount,
            user_email=user_email,
            user_name=user_name,
            transaction_id=transaction_id,
            description=description
        )
        
        if result.get("success"):
            return {
                "success": True,
                "checkout_url": result.get("invoice_url"),
                "checkout_id": result.get("invoice_id"),
                "external_id": result.get("external_id"),
                "expiry_date": result.get("expiry_date"),
                "amount": amount,
                "status": "pending",
                "provider": "xendit",
                # Include original names for backward compatibility
                "invoice_url": result.get("invoice_url"),
                "invoice_id": result.get("invoice_id"),
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Unknown error")
            }
    
    def create_gcash_payment(
        self,
        amount: float,
        user_email: str,
        user_name: str,
        transaction_id: int,
        description: str = None,
        success_url: str = None,
        failure_url: str = None
    ) -> Dict[str, Any]:
        """
        Convenience method matching XenditService signature.
        """
        return self.create_checkout_session(
            amount=amount,
            currency="PHP",
            description=description or f"Wallet Deposit - ₱{amount}",
            user_email=user_email,
            user_name=user_name,
            transaction_id=transaction_id,
            payment_methods=["gcash"],
            success_url=success_url or "",
            failure_url=failure_url or ""
        )
    
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
        Create a Xendit disbursement/payout.
        Maps to XenditService.create_disbursement().
        """
        result = XenditService.create_disbursement(
            amount=amount,
            recipient_name=recipient_name,
            account_number=account_number,
            description=description,
            transaction_id=transaction_id
        )
        
        if result.get("success"):
            return {
                "success": True,
                "disbursement_id": result.get("disbursement_id") or result.get("payout_id"),
                "external_id": result.get("external_id"),
                "amount": amount,
                "status": result.get("status", DisbursementStatus.PENDING),
                "channel_code": channel_code,
                "recipient_name": recipient_name,
                "recipient_number": account_number,
                "provider": "xendit"
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Unknown error")
            }
    
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Get Xendit invoice status.
        Maps to XenditService.get_invoice_status().
        """
        result = XenditService.get_invoice_status(payment_id)
        
        if result.get("success"):
            # Map Xendit status to our standard status
            xendit_status = result.get("status", "").upper()
            status = self._map_xendit_status(xendit_status)
            
            return {
                "success": True,
                "status": status,
                "amount": result.get("amount", 0),
                "paid_amount": result.get("paid_amount", 0),
                "payment_method": result.get("payment_method"),
                "payment_channel": result.get("payment_channel"),
                "payment_id": payment_id,
                "external_id": result.get("external_id"),
                "provider": "xendit"
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Unknown error")
            }
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify Xendit webhook signature.
        Maps to XenditService.verify_webhook_signature().
        """
        return XenditService.verify_webhook_signature(signature)
    
    def parse_webhook_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse Xendit webhook payload.
        Maps to XenditService.parse_webhook_payload().
        """
        result = XenditService.parse_webhook_payload(payload)
        
        if result:
            return {
                "event_type": f"invoice.{result.get('status', 'unknown').lower()}",
                "payment_id": result.get("invoice_id"),
                "external_id": result.get("external_id"),
                "status": self._map_xendit_status(result.get("status", "")),
                "amount": result.get("amount", 0),
                "payment_method": result.get("payment_method"),
                "payment_channel": result.get("payment_channel"),
                "paid_at": result.get("paid_at"),
                "metadata": result.get("metadata", {}),
                "provider": "xendit"
            }
        return None
    
    def _map_xendit_status(self, xendit_status: str) -> str:
        """Map Xendit status to our standard status"""
        mapping = {
            "PENDING": PaymentStatus.PENDING,
            "SETTLED": PaymentStatus.PAID,
            "PAID": PaymentStatus.PAID,
            "COMPLETED": PaymentStatus.COMPLETED,
            "EXPIRED": PaymentStatus.EXPIRED,
            "FAILED": PaymentStatus.FAILED,
        }
        return mapping.get(xendit_status.upper(), PaymentStatus.PENDING)
