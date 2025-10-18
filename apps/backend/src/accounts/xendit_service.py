"""
Xendit Payment Gateway Service
Handles payment processing via Xendit API
"""

import xendit
from xendit import Invoice, EWallet
from django.conf import settings
from datetime import datetime, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)

# Configure Xendit with API key
xendit.api_key = settings.XENDIT_API_KEY


class XenditService:
    """Service for handling Xendit payment operations"""
    
    @staticmethod
    def create_gcash_payment(amount: float, user_email: str, user_name: str, transaction_id: int):
        """
        Create a GCash payment via Xendit Invoice
        
        Args:
            amount: Amount in PHP
            user_email: User's email for invoice
            user_name: User's name
            transaction_id: Internal transaction ID for reference
            
        Returns:
            dict: Invoice details including payment URL
        """
        try:
            # Generate unique external ID
            external_id = f"IAYOS-DEP-{transaction_id}-{uuid.uuid4().hex[:8]}"
            
            # Calculate expiry (24 hours from now)
            expiry_time = datetime.now() + timedelta(hours=24)
            
            # Create invoice with GCash as payment method
            invoice_data = {
                "external_id": external_id,
                "amount": float(amount),
                "payer_email": user_email,
                "description": f"Wallet Deposit - ₱{amount}",
                "invoice_duration": 86400,  # 24 hours in seconds
                "success_redirect_url": f"{settings.FRONTEND_URL}/dashboard/profile?payment=success",
                "failure_redirect_url": f"{settings.FRONTEND_URL}/dashboard/profile?payment=failed",
                "currency": "PHP",
                "payment_methods": ["GCASH"],  # Only GCash
                "should_send_email": True,
                "customer": {
                    "given_names": user_name,
                    "email": user_email,
                },
                "items": [
                    {
                        "name": "Wallet Deposit",
                        "quantity": 1,
                        "price": float(amount),
                        "category": "wallet_topup"
                    }
                ]
            }
            
            # Create invoice via Xendit API
            invoice = Invoice.create(**invoice_data)
            
            logger.info(f"✅ Xendit Invoice created: {invoice['id']} for transaction {transaction_id}")
            
            return {
                "success": True,
                "invoice_id": invoice['id'],
                "invoice_url": invoice['invoice_url'],
                "external_id": external_id,
                "expiry_date": invoice['expiry_date'],
                "amount": invoice['amount'],
                "status": invoice['status']
            }
            
        except Exception as e:
            logger.error(f"❌ Xendit Invoice creation failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def get_invoice_status(invoice_id: str):
        """
        Get current status of a Xendit invoice
        
        Args:
            invoice_id: Xendit invoice ID
            
        Returns:
            dict: Invoice status details
        """
        try:
            invoice = Invoice.get(invoice_id=invoice_id)
            
            return {
                "success": True,
                "status": invoice['status'],
                "paid_amount": invoice.get('paid_amount', 0),
                "payment_method": invoice.get('payment_method'),
                "payment_channel": invoice.get('payment_channel'),
                "payment_id": invoice.get('payment_id'),
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get invoice status: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def verify_webhook_signature(webhook_token: str):
        """
        Verify Xendit webhook callback signature
        
        Args:
            webhook_token: Token from webhook header
            
        Returns:
            bool: True if valid, False otherwise
        """
        if not settings.XENDIT_WEBHOOK_TOKEN:
            # If no webhook token is configured, skip verification in TEST mode
            if settings.XENDIT_TEST_MODE:
                logger.warning("⚠️ Webhook verification skipped - TEST MODE")
                return True
            return False
        
        return webhook_token == settings.XENDIT_WEBHOOK_TOKEN
    
    @staticmethod
    def parse_webhook_payload(payload: dict):
        """
        Parse Xendit webhook payload
        
        Args:
            payload: Webhook JSON payload
            
        Returns:
            dict: Parsed payment details
        """
        try:
            return {
                "invoice_id": payload.get('id'),
                "external_id": payload.get('external_id'),
                "status": payload.get('status'),
                "amount": payload.get('amount'),
                "paid_amount": payload.get('paid_amount'),
                "payment_method": payload.get('payment_method'),
                "payment_channel": payload.get('payment_channel'),
                "payment_id": payload.get('payment_id'),
                "paid_at": payload.get('paid_at'),
            }
        except Exception as e:
            logger.error(f"❌ Failed to parse webhook payload: {str(e)}")
            return None


# Helper function to format payment method for display
def get_payment_method_display(payment_channel: str):
    """Convert Xendit payment channel to display name"""
    channel_map = {
        "GCASH": "GCash",
        "PAYMAYA": "Maya",
        "OVO": "OVO",
        "DANA": "DANA",
        "LINKAJA": "LinkAja",
        "SHOPEEPAY": "ShopeePay",
    }
    return channel_map.get(payment_channel, payment_channel)
