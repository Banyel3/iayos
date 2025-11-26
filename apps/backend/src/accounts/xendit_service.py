"""
Xendit Payment Gateway Service
Handles payment processing via Xendit API using direct HTTP requests
"""

import requests
from django.conf import settings
from datetime import datetime, timedelta
import uuid
import logging
import base64

logger = logging.getLogger(__name__)


class XenditService:
    """Service for handling Xendit payment operations"""
    
    BASE_URL = "https://api.xendit.co"
    
    @staticmethod
    def _get_headers():
        """Get authorization headers for Xendit API"""
        auth_string = f"{settings.XENDIT_API_KEY}:"
        encoded = base64.b64encode(auth_string.encode()).decode()
        return {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/json"
        }
    
    @staticmethod
    def create_gcash_payment(amount: float, user_email: str, user_name: str, transaction_id: int):
        """
        Create a GCash payment via Xendit Invoice API
        
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
                "should_send_email": False,
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
            
            print(f"🔐 Xendit API Request:")
            print(f"   URL: {XenditService.BASE_URL}/v2/invoices")
            print(f"   Amount: {amount} PHP")
            print(f"   External ID: {external_id}")
            
            # Make API request to Xendit
            response = requests.post(
                f"{XenditService.BASE_URL}/v2/invoices",
                json=invoice_data,
                headers=XenditService._get_headers(),
                timeout=30
            )
            
            print(f"📡 Xendit Response: Status {response.status_code}")
            
            if response.status_code == 200:
                invoice = response.json()
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
            else:
                error_data = response.json() if response.text else {}
                error_message = error_data.get('message', f'HTTP {response.status_code}')
                logger.error(f"❌ Xendit API Error: {error_message}")
                print(f"❌ Xendit Response: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": error_message
                }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Xendit API request failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": f"Connection error: {str(e)}"
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
    def create_disbursement(amount: float, recipient_name: str, account_number: str, transaction_id: int, notes: str = ""):
        """
        Create a GCash disbursement (payout) via Xendit Disbursement API
        
        Args:
            amount: Amount in PHP to disburse
            recipient_name: Recipient's name
            account_number: GCash mobile number (09XXXXXXXXX)
            transaction_id: Internal transaction ID for reference
            notes: Optional description
            
        Returns:
            dict: Disbursement details including status
        """
        try:
            # Generate unique external ID
            external_id = f"IAYOS-WITHDRAW-{transaction_id}-{uuid.uuid4().hex[:8]}"
            
            # Clean phone number (remove spaces, dashes)
            clean_number = account_number.replace(' ', '').replace('-', '')
            
            # Ensure it starts with +63
            if clean_number.startswith('09'):
                phone_number = f"+63{clean_number[1:]}"
            elif clean_number.startswith('639'):
                phone_number = f"+{clean_number}"
            elif clean_number.startswith('+639'):
                phone_number = clean_number
            else:
                return {
                    "success": False,
                    "error": "Invalid GCash number format. Must start with 09."
                }
            
            # Xendit Disbursement API payload
            disbursement_data = {
                "external_id": external_id,
                "amount": float(amount),
                "bank_code": "GCASH",
                "account_holder_name": recipient_name,
                "account_number": phone_number,
                "description": notes or f"Wallet Withdrawal - ₱{amount}",
                "email_to": [],  # No email notifications
                "email_cc": [],
                "email_bcc": []
            }
            
            print(f"🔐 Xendit Disbursement Request:")
            print(f"   URL: {XenditService.BASE_URL}/disbursements")
            print(f"   Amount: {amount} PHP")
            print(f"   External ID: {external_id}")
            print(f"   Recipient: {recipient_name} ({phone_number})")
            
            # Make API request to Xendit
            response = requests.post(
                f"{XenditService.BASE_URL}/disbursements",
                json=disbursement_data,
                headers=XenditService._get_headers(),
                timeout=30
            )
            
            print(f"📡 Xendit Disbursement Response: Status {response.status_code}")
            
            if response.status_code == 200:
                disbursement = response.json()
                logger.info(f"✅ Xendit Disbursement created: {disbursement['id']} for transaction {transaction_id}")
                
                return {
                    "success": True,
                    "disbursement_id": disbursement['id'],
                    "external_id": external_id,
                    "amount": disbursement['amount'],
                    "status": disbursement['status'],
                    "bank_code": disbursement.get('bank_code'),
                    "account_number": disbursement.get('account_number')
                }
            else:
                error_data = response.json() if response.text else {}
                error_message = error_data.get('message', f'HTTP {response.status_code}')
                logger.error(f"❌ Xendit Disbursement Error: {error_message}")
                print(f"❌ Xendit Response: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": error_message
                }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Xendit Disbursement API request failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": f"Connection error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"❌ Xendit Disbursement creation failed: {str(e)}")
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
            response = requests.get(
                f"{XenditService.BASE_URL}/v2/invoices/{invoice_id}",
                headers=XenditService._get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                invoice = response.json()
                return {
                    "success": True,
                    "status": invoice['status'],
                    "paid_amount": invoice.get('paid_amount', 0),
                    "payment_method": invoice.get('payment_method'),
                    "payment_channel": invoice.get('payment_channel'),
                    "payment_id": invoice.get('payment_id'),
                }
            else:
                logger.error(f"❌ Failed to get invoice status: {response.text}")
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}"
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
