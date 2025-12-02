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
import copy

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
    def create_withdrawal_receipt(amount: float, user_email: str, user_name: str, transaction_id: int, payment_method_name: str, payment_method_number: str):
        """
        Create a Xendit invoice as a withdrawal receipt/order summary
        Similar to deposit flow - creates an invoice for display purposes only
        Funds are already deducted, this just shows a pretty receipt
        
        Args:
            amount: Withdrawal amount in PHP
            user_email: User's email
            user_name: User's name
            transaction_id: Internal transaction ID
            payment_method_name: GCash account holder name
            payment_method_number: GCash account number
            
        Returns:
            dict: Invoice details including receipt URL
        """
        try:
            # Generate unique external ID
            external_id = f"IAYOS-WD-{transaction_id}-{uuid.uuid4().hex[:8]}"
            
            # Create invoice as withdrawal receipt
            receipt_data = {
                "external_id": external_id,
                "amount": float(amount),
                "payer_email": user_email,
                "description": f"✅ WITHDRAWAL TO GCASH\n\nAmount: ₱{amount:,.2f}\nRecipient: {payment_method_name}\nGCash Number: {payment_method_number}\n\nFunds have been deducted from your wallet. In TEST MODE, this shows a receipt summary. In production, funds would be sent to your GCash account within 1-3 business days.",
                "invoice_duration": 86400,  # 24 hours
                "currency": "PHP",
                "payment_methods": ["GCASH"],
                "should_send_email": False,
                "success_redirect_url": f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/wallet?withdrawal=success",
                "failure_redirect_url": f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/wallet?withdrawal=failed",
                "customer": {
                    "given_names": user_name,
                    "email": user_email,
                },
                "items": [
                    {
                        "name": f"Wallet Withdrawal to {payment_method_number}",
                        "quantity": 1,
                        "price": float(amount),
                        "category": "withdrawal_receipt"
                    }
                ]
            }
            
            print(f"🔐 Xendit Withdrawal Receipt Request:")
            print(f"   URL: {XenditService.BASE_URL}/v2/invoices")
            print(f"   Amount: ₱{amount}")
            print(f"   External ID: {external_id}")
            print(f"   To: {payment_method_name} ({payment_method_number})")
            
            # Make API request to Xendit
            response = requests.post(
                f"{XenditService.BASE_URL}/v2/invoices",
                json=receipt_data,
                headers=XenditService._get_headers(),
                timeout=30
            )
            
            print(f"📡 Xendit Receipt Response: Status {response.status_code}")
            
            if response.status_code == 200:
                invoice = response.json()
                logger.info(f"✅ Xendit Withdrawal Receipt created: {invoice['id']} for transaction {transaction_id}")
                
                return {
                    "success": True,
                    "invoice_id": invoice['id'],
                    "invoice_url": invoice['invoice_url'],
                    "external_id": external_id,
                    "expiry_date": invoice['expiry_date'],
                    "amount": invoice['amount'],
                    "status": invoice['status'],
                    "test_mode": True
                }
            else:
                error_data = response.json() if response.text else {}
                error_message = error_data.get('message', f'HTTP {response.status_code}')
                logger.error(f"❌ Xendit Receipt Error: {error_message}")
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
            logger.error(f"❌ Xendit Receipt creation failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def create_disbursement(amount: float, recipient_name: str, account_number: str, transaction_id: int, notes: str = ""):
        """Create a GCash disbursement (payout) via Xendit APIs."""
        try:
            external_id = f"IAYOS-WITHDRAW-{transaction_id}-{uuid.uuid4().hex[:8]}"

            def normalize_gcash(number: str):
                raw = (number or "").strip()
                cleaned = raw.replace(" ", "").replace("-", "")
                if cleaned.startswith("09") and len(cleaned) == 11:
                    return cleaned, f"+63{cleaned[1:]}"
                if cleaned.startswith("639") and len(cleaned) == 12:
                    local = f"0{cleaned[2:]}"
                    return local, f"+{cleaned}"
                if cleaned.startswith("+639") and len(cleaned) == 13:
                    local = f"0{cleaned[3:]}"
                    return local, cleaned
                return None, None

            local_number, phone_number = normalize_gcash(account_number)
            if not local_number:
                return {"success": False, "error": "Invalid GCash number format. Use 09XXXXXXXXX"}

            # TEST MODE: Create a "receipt" invoice that shows withdrawal details
            # We use Xendit's invoice as a visual receipt since sandbox doesn't support real disbursements
            if getattr(settings, 'XENDIT_TEST_MODE', False):
                print(f"🧪 Xendit TEST MODE: Creating withdrawal receipt invoice")
                print(f"   Amount: ₱{amount}")
                print(f"   Recipient: {recipient_name} ({local_number})")
                print(f"   External ID: {external_id}")
                
                # Create a receipt-style invoice 
                receipt_data = {
                    "external_id": external_id,
                    "amount": float(amount),
                    "payer_email": "withdrawal@iayos.app",
                    "description": f"✅ WITHDRAWAL RECEIPT\n\nAmount: ₱{amount:,.2f}\nTo: {recipient_name}\nGCash: {local_number}\n\nThis is a TEST MODE receipt. In production, funds would be sent directly to your GCash account.",
                    "invoice_duration": 86400,
                    "currency": "PHP",
                    "should_send_email": False,
                    "success_redirect_url": f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/wallet?withdrawal=success",
                    "customer": {
                        "given_names": recipient_name,
                        "email": "withdrawal@iayos.app",
                    },
                    "items": [
                        {
                            "name": f"GCash Withdrawal to {local_number}",
                            "quantity": 1,
                            "price": float(amount),
                            "category": "withdrawal_receipt"
                        }
                    ]
                }
                
                response = requests.post(
                    f"{XenditService.BASE_URL}/v2/invoices",
                    json=receipt_data,
                    headers=XenditService._get_headers(),
                    timeout=30,
                )
                
                print(f"📡 Xendit Receipt Response: Status {response.status_code}")
                
                if response.status_code == 200:
                    invoice = response.json()
                    logger.info(
                        "✅ Xendit TEST Receipt created: %s for withdrawal %s",
                        invoice.get("id"),
                        transaction_id,
                    )
                    return {
                        "success": True,
                        "disbursement_id": invoice.get("id"),
                        "external_id": invoice.get("external_id"),
                        "amount": invoice.get("amount"),
                        "status": "COMPLETED",  # Mark as completed for UI
                        "test_mode": True,
                        "receipt_url": invoice.get("invoice_url"),  # This shows the Xendit page
                        "recipient_name": recipient_name,
                        "recipient_number": local_number,
                        "message": "Test mode: View your withdrawal receipt on Xendit."
                    }
                else:
                    error_data = response.json() if response.text else {}
                    error_message = error_data.get("message", f"HTTP {response.status_code}")
                    logger.error("❌ Xendit Receipt Error: %s", error_message)
                    # Fall back to simulated response if invoice creation fails
                    return {
                        "success": True,
                        "disbursement_id": f"TEST-{external_id}",
                        "external_id": external_id,
                        "amount": float(amount),
                        "status": "COMPLETED",
                        "test_mode": True,
                        "recipient_name": recipient_name,
                        "recipient_number": local_number,
                        "message": "Test mode: Withdrawal simulated as completed."
                    }

            # PRODUCTION MODE: Real disbursement logic
            test_number = getattr(settings, "XENDIT_TEST_ACCOUNT_NUMBER", None)
            test_name = getattr(settings, "XENDIT_TEST_ACCOUNT_NAME", recipient_name)
            override_local, override_phone = normalize_gcash(test_number or "")
            if override_local:
                print("🔐 Using configured test GCash account for production disbursement")
                local_number = override_local
                phone_number = override_phone
                recipient_name = test_name or recipient_name

            payout_payload = {
                "reference_id": external_id,
                "channel_code": "PH_GCASH",
                "channel_properties": {
                    "account_name": recipient_name,
                    "account_holder_name": recipient_name,
                    "account_number": local_number,
                },
                "description": notes or f"Wallet Withdrawal - ₱{amount}",
                "amount": int(amount),
                "currency": "PHP",
            }

            print("🔐 Xendit Disbursement Request (payout API):")
            print(f"   URL: {XenditService.BASE_URL}/payouts")
            print(f"   Amount: {amount} PHP")
            print(f"   Reference ID: {external_id}")
            print("   Channel: PH_GCASH")
            print(f"   Recipient: {recipient_name} ({phone_number})")

            response = requests.post(
                f"{XenditService.BASE_URL}/payouts",
                json=payout_payload,
                headers=XenditService._get_headers(),
                timeout=30,
            )

            print(f"📡 Xendit Payout Response: Status {response.status_code}")

            if response.status_code in (200, 201):
                disbursement = response.json()
                logger.info(
                    "✅ Xendit Payout created: %s for transaction %s",
                    disbursement.get("id"),
                    transaction_id,
                )
                return {
                    "success": True,
                    "disbursement_id": disbursement.get("id"),
                    "external_id": disbursement.get("reference_id", external_id),
                    "amount": disbursement.get("amount"),
                    "status": disbursement.get("status"),
                    "channel_code": disbursement.get("channel_code"),
                    "failure_code": disbursement.get("failure_code"),
                    "channel_properties": disbursement.get("channel_properties", {}),
                }

            should_fallback = response.status_code in (400, 403, 404)
            error_data = response.json() if response.text else {}

            if not should_fallback:
                error_message = error_data.get("message", f"HTTP {response.status_code}")
                logger.error("❌ Xendit Payout Error: %s", error_message)
                print(f"❌ Xendit Response: {response.status_code} - {response.text}")
                return {"success": False, "error": error_message, "error_details": error_data}

            fallback_reason = error_data.get("message", f"HTTP {response.status_code}")
            logger.warning(
                "⚠️ Payout API unavailable (status=%s, reason=%s). Falling back to legacy disbursements.",
                response.status_code,
                fallback_reason,
            )

            # Legacy disbursements use old flat structure, NOT new payout structure
            legacy_payload = {
                "external_id": external_id,
                "amount": int(amount),
                "bank_code": "GCASH",
                "account_holder_name": recipient_name,
                "account_number": local_number,
                "description": notes or f"Wallet Withdrawal - ₱{amount}",
                "email_to": [],
                "email_cc": [],
                "email_bcc": []
            }

            print(f"📤 Legacy Disbursement Payload: bank_code=GCASH, account={local_number}, holder={recipient_name}")

            legacy_response = requests.post(
                f"{XenditService.BASE_URL}/disbursements",
                json=legacy_payload,
                headers=XenditService._get_headers(),
                timeout=30,
            )

            print(f"📡 Legacy Disbursement Response: Status {legacy_response.status_code}")

            if legacy_response.status_code in (200, 201):
                disbursement = legacy_response.json()
                logger.info(
                    "✅ Legacy Disbursement created: %s for transaction %s",
                    disbursement.get("id"),
                    transaction_id,
                )
                return {
                    "success": True,
                    "disbursement_id": disbursement.get("id"),
                    "external_id": disbursement.get("external_id", external_id),
                    "amount": disbursement.get("amount"),
                    "status": disbursement.get("status"),
                    "bank_code": disbursement.get("bank_code"),
                    "account_number": disbursement.get("account_number"),
                    "fallback": True,
                }

            legacy_error = legacy_response.json() if legacy_response.text else {}
            legacy_message = legacy_error.get("message", f"HTTP {legacy_response.status_code}")
            logger.error("❌ Xendit Legacy Disbursement Error: %s", legacy_message)
            print(f"❌ Xendit Response: {legacy_response.status_code} - {legacy_response.text}")
            return {
                "success": False,
                "error": legacy_message,
                "error_details": legacy_error,
                "fallback_attempted": True,
            }

        except requests.exceptions.RequestException as e:
            logger.error("❌ Xendit Disbursement API request failed: %s", str(e))
            import traceback

            traceback.print_exc()
            return {"success": False, "error": f"Connection error: {str(e)}"}
        except Exception as e:
            logger.error("❌ Xendit Disbursement creation failed: %s", str(e))
            import traceback

            traceback.print_exc()
            return {"success": False, "error": str(e)}
    
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
