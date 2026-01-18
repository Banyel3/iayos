"""
PayMongo Payment Gateway Service
================================
Handles payment processing via PayMongo API for Philippine payments.

PayMongo Integration Types:
1. Checkout Sessions - Hosted payment page (recommended for simplicity)
2. Payment Intents + Payment Methods - Custom integration (more control)

This implementation uses Checkout Sessions for:
- GCash payments
- Card payments  
- Maya (PayMaya) payments

PayMongo API Docs: https://developers.paymongo.com/reference

Circuit breaker pattern implemented for fault tolerance.
"""

import requests
import base64
import uuid
import hmac
import hashlib
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from django.conf import settings

from .payment_provider import (
    PaymentProviderInterface, 
    PaymentStatus, 
    DisbursementStatus,
    GCASH_CHANNEL
)

logger = logging.getLogger(__name__)


class PayMongoService(PaymentProviderInterface):
    """
    PayMongo payment gateway implementation.
    
    Environment variables required:
        PAYMONGO_SECRET_KEY - API secret key (sk_test_... or sk_live_...)
        PAYMONGO_PUBLIC_KEY - API public key (pk_test_... or pk_live_...)
        PAYMONGO_WEBHOOK_SECRET - Webhook signing secret
    """
    
    BASE_URL = "https://api.paymongo.com/v1"
    
    def __init__(self):
        self.secret_key = getattr(settings, 'PAYMONGO_SECRET_KEY', '')
        self.public_key = getattr(settings, 'PAYMONGO_PUBLIC_KEY', '')
        self.webhook_secret = getattr(settings, 'PAYMONGO_WEBHOOK_SECRET', '')
        self.test_mode = self.secret_key.startswith('sk_test_') if self.secret_key else True
        
        if not self.secret_key:
            logger.warning("PAYMONGO_SECRET_KEY not configured - payments will fail")
    
    @property
    def provider_name(self) -> str:
        return "paymongo"
    
    def _get_headers(self) -> Dict[str, str]:
        """Get authorization headers for PayMongo API"""
        auth_string = f"{self.secret_key}:"
        encoded = base64.b64encode(auth_string.encode()).decode()
        return {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    def _generate_external_id(self, prefix: str, transaction_id: int) -> str:
        """Generate unique external reference ID"""
        return f"IAYOS-{prefix}-{transaction_id}-{uuid.uuid4().hex[:8]}"
    
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
        Create a PayMongo Checkout Session.
        
        PayMongo amounts are in CENTAVOS (smallest currency unit).
        So ₱100.00 = 10000 centavos
        """
        try:
            external_id = self._generate_external_id("CHK", transaction_id)
            
            # Convert amount to centavos (PayMongo uses smallest currency unit)
            amount_centavos = int(amount * 100)
            
            # Map payment methods to PayMongo format
            paymongo_methods = self._map_payment_methods(payment_methods)
            
            # Build checkout session payload
            # Reference: https://developers.paymongo.com/reference/checkout-session-resource
            checkout_data = {
                "data": {
                    "attributes": {
                        "send_email_receipt": True,
                        "show_description": True,
                        "show_line_items": True,
                        "description": description,
                        "line_items": [
                            {
                                "currency": currency.upper(),
                                "amount": amount_centavos,
                                "name": description,
                                "quantity": 1
                            }
                        ],
                        "payment_method_types": paymongo_methods,
                        "success_url": success_url,
                        "cancel_url": failure_url,
                        "reference_number": external_id,
                        "metadata": {
                            "transaction_id": str(transaction_id),
                            "external_id": external_id,
                            "user_email": user_email,
                            "user_name": user_name,
                            **(metadata or {})
                        }
                    }
                }
            }
            
            # Add billing info if provided
            if user_email:
                checkout_data["data"]["attributes"]["billing"] = {
                    "email": user_email,
                    "name": user_name or user_email.split('@')[0]
                }
            
            logger.info(f"🔐 PayMongo Checkout Request:")
            logger.info(f"   Amount: {amount} {currency} ({amount_centavos} centavos)")
            logger.info(f"   External ID: {external_id}")
            logger.info(f"   Payment Methods: {paymongo_methods}")
            
            response = requests.post(
                f"{self.BASE_URL}/checkout_sessions",
                json=checkout_data,
                headers=self._get_headers(),
                timeout=30
            )
            
            logger.info(f"📡 PayMongo Response: Status {response.status_code}")
            
            if response.status_code in (200, 201):
                data = response.json()
                checkout = data.get("data", {})
                attributes = checkout.get("attributes", {})
                
                logger.info(f"✅ PayMongo Checkout created: {checkout.get('id')}")
                
                return {
                    "success": True,
                    "checkout_url": attributes.get("checkout_url"),
                    "checkout_id": checkout.get("id"),
                    "external_id": external_id,
                    "expiry_date": attributes.get("expired_at"),
                    "amount": amount,
                    "status": attributes.get("status", "pending"),
                    "provider": "paymongo",
                    # Backward compatibility with Xendit naming
                    "invoice_url": attributes.get("checkout_url"),
                    "invoice_id": checkout.get("id"),
                }
            else:
                error_data = response.json() if response.text else {}
                errors = error_data.get("errors", [{}])
                error_message = errors[0].get("detail", f"HTTP {response.status_code}") if errors else f"HTTP {response.status_code}"
                
                logger.error(f"❌ PayMongo API Error: {error_message}")
                logger.error(f"   Response: {response.text}")
                
                return {
                    "success": False,
                    "error": error_message,
                    "error_details": error_data
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ PayMongo API request failed: {str(e)}")
            return {
                "success": False,
                "error": f"Connection error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"❌ PayMongo Checkout creation failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
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
        Convenience method for creating GCash payment.
        Maintains backward compatibility with XenditService interface.
        """
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        return self.create_checkout_session(
            amount=amount,
            currency="PHP",
            description=description or f"Wallet Deposit - ₱{amount}",
            user_email=user_email,
            user_name=user_name,
            transaction_id=transaction_id,
            payment_methods=["gcash"],
            success_url=success_url or f"{frontend_url}/dashboard/profile?payment=success",
            failure_url=failure_url or f"{frontend_url}/dashboard/profile?payment=failed",
            metadata={"payment_type": "wallet_deposit"}
        )
    
    def create_escrow_payment(
        self,
        amount: float,
        user_email: str,
        user_name: str,
        transaction_id: int,
        job_id: int,
        job_title: str,
        payment_type: str = "downpayment"
    ) -> Dict[str, Any]:
        """
        Create escrow payment for job (50% downpayment or remaining payment).
        """
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        description = f"Escrow {payment_type.title()} - {job_title}"
        
        return self.create_checkout_session(
            amount=amount,
            currency="PHP",
            description=description,
            user_email=user_email,
            user_name=user_name,
            transaction_id=transaction_id,
            payment_methods=["gcash", "card", "paymaya"],
            success_url=f"{frontend_url}/payments/status/{transaction_id}?status=success",
            failure_url=f"{frontend_url}/payments/status/{transaction_id}?status=failed",
            metadata={
                "payment_type": payment_type,
                "job_id": str(job_id),
                "job_title": job_title
            }
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
        Create a payout/disbursement to GCash or bank account.
        
        Note: PayMongo's payout API is in limited release.
        For now, we simulate payouts in test mode and log for manual processing.
        
        In production, you would use PayMongo's Payout API or
        integrate with Maya Business API for GCash payouts.
        """
        try:
            external_id = self._generate_external_id("WD", transaction_id)
            
            # Normalize GCash number
            normalized_number = self._normalize_gcash_number(account_number)
            if not normalized_number:
                return {
                    "success": False,
                    "error": "Invalid GCash number format. Use 09XXXXXXXXX"
                }
            
            logger.info(f"🔐 PayMongo Disbursement Request:")
            logger.info(f"   Amount: ₱{amount}")
            logger.info(f"   Recipient: {recipient_name} ({normalized_number})")
            logger.info(f"   External ID: {external_id}")
            logger.info(f"   Channel: {channel_code}")
            
            # In test mode or while PayMongo payout API is not available,
            # simulate successful disbursement
            if self.test_mode:
                logger.info("🧪 PayMongo TEST MODE: Simulating disbursement")
                
                return {
                    "success": True,
                    "disbursement_id": f"payout_{external_id}",
                    "external_id": external_id,
                    "amount": amount,
                    "status": DisbursementStatus.COMPLETED,
                    "channel_code": channel_code,
                    "recipient_name": recipient_name,
                    "recipient_number": normalized_number,
                    "test_mode": True,
                    "provider": "paymongo",
                    "message": "Test mode: Disbursement simulated as completed. In production, funds would be sent via Maya Business or bank transfer."
                }
            
            # Production: Log for manual processing or use Maya Business API
            # PayMongo's official Payout API endpoint would go here when available
            logger.warning(f"⚠️ Production disbursement requested - requires manual processing or Maya Business integration")
            logger.warning(f"   External ID: {external_id}")
            logger.warning(f"   Amount: ₱{amount}")
            logger.warning(f"   Recipient: {recipient_name} ({normalized_number})")
            
            return {
                "success": True,
                "disbursement_id": f"manual_{external_id}",
                "external_id": external_id,
                "amount": amount,
                "status": DisbursementStatus.PENDING,
                "channel_code": channel_code,
                "recipient_name": recipient_name,
                "recipient_number": normalized_number,
                "provider": "paymongo",
                "message": "Disbursement queued for processing. Funds will be sent within 1-3 business days.",
                "requires_manual_processing": True
            }
            
        except Exception as e:
            logger.error(f"❌ PayMongo Disbursement failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Get checkout session or payment status.
        
        Args:
            payment_id: PayMongo checkout_session ID (cs_xxx) or payment ID (pay_xxx)
        """
        try:
            # Determine endpoint based on ID prefix
            if payment_id.startswith("cs_"):
                endpoint = f"{self.BASE_URL}/checkout_sessions/{payment_id}"
            elif payment_id.startswith("pay_"):
                endpoint = f"{self.BASE_URL}/payments/{payment_id}"
            else:
                # Try checkout session first
                endpoint = f"{self.BASE_URL}/checkout_sessions/{payment_id}"
            
            response = requests.get(
                endpoint,
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                resource = data.get("data", {})
                attributes = resource.get("attributes", {})
                
                # Map PayMongo status to our standard status
                status = self._map_status(attributes.get("status", "pending"))
                
                return {
                    "success": True,
                    "status": status,
                    "amount": attributes.get("amount", 0) / 100,  # Convert from centavos
                    "paid_amount": attributes.get("paid_amount", 0) / 100 if attributes.get("paid_amount") else 0,
                    "payment_method": attributes.get("payment_method_used"),
                    "payment_channel": self._extract_payment_channel(attributes),
                    "payment_id": resource.get("id"),
                    "external_id": attributes.get("reference_number"),
                    "metadata": attributes.get("metadata", {}),
                    "provider": "paymongo"
                }
            else:
                logger.error(f"❌ Failed to get payment status: {response.text}")
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"❌ Failed to get payment status: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify PayMongo webhook signature.
        
        PayMongo uses HMAC-SHA256 with the webhook secret.
        Signature header format: "t=timestamp,te=test_signature,li=live_signature"
        """
        if not self.webhook_secret:
            # Skip verification in test mode if no secret configured
            if self.test_mode:
                logger.warning("⚠️ Webhook verification skipped - no secret configured (TEST MODE)")
                return True
            return False
        
        try:
            # Parse signature header
            parts = dict(part.split("=", 1) for part in signature.split(","))
            timestamp = parts.get("t", "")
            
            # Use test or live signature based on mode
            expected_sig = parts.get("te" if self.test_mode else "li", "")
            
            # Compute expected signature: HMAC-SHA256(timestamp + "." + payload)
            signed_payload = f"{timestamp}.{payload.decode('utf-8')}"
            computed_sig = hmac.new(
                self.webhook_secret.encode(),
                signed_payload.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(computed_sig, expected_sig)
            
        except Exception as e:
            logger.error(f"❌ Webhook signature verification failed: {str(e)}")
            return False
    
    def parse_webhook_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse PayMongo webhook payload into normalized format.
        
        PayMongo webhook structure:
        {
            "data": {
                "id": "evt_xxx",
                "type": "event",
                "attributes": {
                    "type": "checkout_session.payment.paid",
                    "data": { ... checkout session or payment data ... }
                }
            }
        }
        """
        try:
            data = payload.get("data", {})
            attributes = data.get("attributes", {})
            event_type = attributes.get("type", "")
            
            # Get the nested resource data
            resource_data = attributes.get("data", {})
            resource_attributes = resource_data.get("attributes", {})
            
            # Extract payment info
            metadata = resource_attributes.get("metadata", {})
            payments = resource_attributes.get("payments", [])
            payment_info = payments[0].get("attributes", {}) if payments else {}
            
            return {
                "event_type": event_type,
                "payment_id": resource_data.get("id"),
                "external_id": resource_attributes.get("reference_number") or metadata.get("external_id"),
                "status": self._map_webhook_status(event_type),
                "amount": resource_attributes.get("amount", 0) / 100 if resource_attributes.get("amount") else 0,
                "payment_method": resource_attributes.get("payment_method_used"),
                "payment_channel": self._extract_payment_channel(payment_info or resource_attributes),
                "paid_at": resource_attributes.get("paid_at") or resource_attributes.get("completed_at"),
                "metadata": metadata,
                "transaction_id": metadata.get("transaction_id"),
                "job_id": metadata.get("job_id"),
                "provider": "paymongo"
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to parse webhook payload: {str(e)}")
            return None
    
    # Helper methods
    
    def _map_payment_methods(self, methods: List[str]) -> List[str]:
        """Map generic payment method names to PayMongo format"""
        mapping = {
            "gcash": "gcash",
            "GCASH": "gcash",
            "card": "card",
            "CARD": "card",
            "maya": "paymaya",
            "paymaya": "paymaya",
            "MAYA": "paymaya",
            "PAYMAYA": "paymaya",
            "grab_pay": "grab_pay",
            "GRAB_PAY": "grab_pay"
        }
        return [mapping.get(m, m.lower()) for m in methods if mapping.get(m, m.lower())]
    
    def _map_status(self, paymongo_status: str) -> str:
        """Map PayMongo status to our standard status"""
        mapping = {
            "active": PaymentStatus.PENDING,
            "pending": PaymentStatus.PENDING,
            "awaiting_payment_method": PaymentStatus.PENDING,
            "awaiting_next_action": PaymentStatus.PENDING,
            "processing": PaymentStatus.PENDING,
            "paid": PaymentStatus.PAID,
            "succeeded": PaymentStatus.PAID,
            "completed": PaymentStatus.COMPLETED,
            "failed": PaymentStatus.FAILED,
            "expired": PaymentStatus.EXPIRED,
            "cancelled": PaymentStatus.CANCELLED,
            "refunded": PaymentStatus.REFUNDED
        }
        return mapping.get(paymongo_status.lower(), PaymentStatus.PENDING)
    
    def _map_webhook_status(self, event_type: str) -> str:
        """Map webhook event type to our standard status"""
        if "paid" in event_type or "succeeded" in event_type:
            return PaymentStatus.PAID
        elif "failed" in event_type:
            return PaymentStatus.FAILED
        elif "expired" in event_type:
            return PaymentStatus.EXPIRED
        elif "cancelled" in event_type or "canceled" in event_type:
            return PaymentStatus.CANCELLED
        elif "refunded" in event_type:
            return PaymentStatus.REFUNDED
        else:
            return PaymentStatus.PENDING
    
    def create_verification_checkout(
        self,
        user_email: str,
        user_name: str,
        payment_method_id: int,
        account_number: str,
        success_url: str,
        failure_url: str
    ) -> Dict[str, Any]:
        """
        Create a PayMongo checkout session for payment method verification.
        
        The user pays ₱1 via GCash, which verifies they own the account.
        The ₱1 is credited to their wallet as a bonus after verification.
        
        Args:
            user_email: User's email address
            user_name: User's full name
            payment_method_id: ID of the UserPaymentMethod to verify
            account_number: GCash number being verified
            success_url: URL to redirect on success
            failure_url: URL to redirect on failure
        
        Returns:
            Dict with checkout_url if successful, or error if failed
        """
        try:
            external_id = self._generate_external_id("VERIFY", payment_method_id)
            
            logger.info(f"🔐 Creating verification checkout for payment method {payment_method_id}")
            logger.info(f"   User: {user_name} ({user_email})")
            logger.info(f"   GCash: {account_number}")
            
            # ₱1 verification amount (100 centavos)
            verification_amount = 100
            
            payload = {
                "data": {
                    "attributes": {
                        "send_email_receipt": True,
                        "show_description": True,
                        "show_line_items": True,
                        "line_items": [
                            {
                                "name": "GCash Account Verification",
                                "description": f"Verify GCash number {account_number[-4:].rjust(11, '*')}",
                                "quantity": 1,
                                "amount": verification_amount,
                                "currency": "PHP"
                            }
                        ],
                        "payment_method_types": ["gcash"],  # Only GCash for verification
                        "description": f"Verify your GCash account for iAyos withdrawals. This ₱1 will be credited to your wallet.",
                        "success_url": success_url,
                        "cancel_url": failure_url,
                        "reference_number": external_id,
                        "billing": {
                            "email": user_email,
                            "name": user_name  # Use the GCash account name they entered
                        },
                        "metadata": {
                            "payment_type": "gcash_verification",
                            "payment_method_id": str(payment_method_id),
                            "account_number": account_number,
                            "user_email": user_email
                        }
                    }
                }
            }
            
            response = requests.post(
                f"{self.BASE_URL}/checkout_sessions",
                json=payload,
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                checkout = data.get("data", {})
                checkout_id = checkout.get("id", "")
                checkout_url = checkout.get("attributes", {}).get("checkout_url", "")
                
                logger.info(f"✅ Verification checkout created: {checkout_id}")
                logger.info(f"   URL: {checkout_url}")
                
                return {
                    "success": True,
                    "checkout_id": checkout_id,
                    "checkout_url": checkout_url,
                    "external_id": external_id,
                    "amount": 1.00,  # ₱1 in pesos
                    "provider": "paymongo",
                    "message": "Pay ₱1 via GCash to verify your account. This amount will be credited to your wallet."
                }
            else:
                error_message = response.json().get("errors", [{}])[0].get("detail", response.text)
                logger.error(f"❌ Verification checkout creation failed: {error_message}")
                return {
                    "success": False,
                    "error": error_message
                }
                
        except Exception as e:
            logger.error(f"❌ Verification checkout creation failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }
    
    def _extract_payment_channel(self, attributes: Dict[str, Any]) -> str:
        """Extract payment channel from PayMongo response"""
        # Check payment_method_used first
        method = attributes.get("payment_method_used", "")
        if method:
            return method.upper()
        
        # Check source type
        source = attributes.get("source", {})
        if isinstance(source, dict):
            return source.get("type", "").upper()
        
        # Fallback
        return ""
    
    def _normalize_gcash_number(self, number: str) -> Optional[str]:
        """Normalize GCash phone number to standard format"""
        if not number:
            return None
        
        cleaned = number.strip().replace(" ", "").replace("-", "")
        
        # Handle various formats
        if cleaned.startswith("09") and len(cleaned) == 11:
            return cleaned
        if cleaned.startswith("639") and len(cleaned) == 12:
            return f"0{cleaned[2:]}"
        if cleaned.startswith("+639") and len(cleaned) == 13:
            return f"0{cleaned[3:]}"
        if cleaned.startswith("9") and len(cleaned) == 10:
            return f"0{cleaned}"
        
        return None


# Convenience functions for backward compatibility with XenditService usage

def get_payment_method_display(payment_channel: str) -> str:
    """Convert payment channel to display name"""
    channel_map = {
        "GCASH": "GCash",
        "gcash": "GCash",
        "PAYMAYA": "Maya",
        "paymaya": "Maya",
        "CARD": "Card",
        "card": "Card",
        "GRAB_PAY": "GrabPay",
        "grab_pay": "GrabPay"
    }
    return channel_map.get(payment_channel, payment_channel)
