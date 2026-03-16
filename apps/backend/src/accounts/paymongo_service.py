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
import re
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from django.conf import settings
from django.core.cache import cache

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
    TRANSFER_V2_BASE_URL = "https://api.paymongo.com/v2"
    PLACEHOLDER_KEY_PATTERN = re.compile(r"^\$\{[^}]+\}$")

    # BIC/SWIFT codes required by PayMongo Transfer V2 destination_account.bic.
    # Maps every code variant (short code, slug, fallback slug) → canonical BIC.
    _BIC_MAP: Dict[str, str] = {
        # Short codes (lowercase)
        "aub":          "AUBKPHMM",
        "bdo":          "BNORPHMM",
        "bpi":          "BOPIPHM1",
        "chinabank":    "CHBKPHMM",
        "dbp":          "DEVBPHM1",
        "eastwest":     "EWBKPHMM",
        "landbank":     "LBPIPHM1",
        "maybank":      "MBBEPHMM",
        "metrobank":    "MBTCPHMM",
        "pnb":          "PNBMPHMM",
        "rcbc":         "RCBCPHMM",
        "securitybank": "SBNKPHMM",
        "unionbank":    "UBPHPHMM",
        # Slug patterns (from fallback: prefix)
        "asia-united-bank-aub":                         "AUBKPHMM",
        "bdo-unibank-inc":                              "BNORPHMM",
        "bpi-bank-of-the-philippine-islands":           "BOPIPHM1",
        "china-banking-corporation-chinabank":          "CHBKPHMM",
        "development-bank-of-the-philippines-dbp":      "DEVBPHM1",
        "eastwest-bank":                                "EWBKPHMM",
        "land-bank-of-the-philippines":                 "LBPIPHM1",
        "maybank-philippines-inc":                      "MBBEPHMM",
        "metrobank-metropolitan-bank-trust-co":         "MBTCPHMM",
        "philippine-national-bank-pnb":                 "PNBMPHMM",
        "rcbc-rizal-commercial-banking-corporation":    "RCBCPHMM",
        "security-bank-corporation":                    "SBNKPHMM",
        "union-bank-of-the-philippines-unionbank":      "UBPHPHMM",
        # BIC codes → themselves (idempotent normalisation)
        "AUBKPHMM": "AUBKPHMM",
        "BNORPHMM": "BNORPHMM",
        "BOPIPHM1": "BOPIPHM1",
        "CHBKPHMM": "CHBKPHMM",
        "DEVBPHM1": "DEVBPHM1",
        "EWBKPHMM": "EWBKPHMM",
        "LBPIPHM1": "LBPIPHM1",
        "MBBEPHMM": "MBBEPHMM",
        "MBTCPHMM": "MBTCPHMM",
        "PNBMPHMM": "PNBMPHMM",
        "RCBCPHMM": "RCBCPHMM",
        "SBNKPHMM": "SBNKPHMM",
        "UBPHPHMM": "UBPHPHMM",
    }
    
    def __init__(self):
        self.secret_key = self._sanitize_key(getattr(settings, 'PAYMONGO_SECRET_KEY', ''))
        self.public_key = self._sanitize_key(getattr(settings, 'PAYMONGO_PUBLIC_KEY', ''))
        self.webhook_secret = self._sanitize_key(getattr(settings, 'PAYMONGO_WEBHOOK_SECRET', ''))
        self.test_mode = self.secret_key.startswith('sk_test_') if self.secret_key else True
        
        if not self.secret_key:
            logger.warning("PAYMONGO_SECRET_KEY not configured - payments will fail")
        elif not self.secret_key.startswith(('sk_test_', 'sk_live_')):
            logger.warning(
                "PAYMONGO_SECRET_KEY appears invalid format (expected sk_test_/sk_live_ prefix)."
            )

    def _sanitize_key(self, raw_value: Optional[str]) -> str:
        """Normalize env keys and guard against unresolved placeholders."""
        value = (raw_value or '').strip().strip('"').strip("'")
        if self.PLACEHOLDER_KEY_PATTERN.match(value):
            return ''
        return value
    
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
        Create QR PH payment for wallet deposits.
        Uses PayMongo's QR PH which allows any Philippine bank/e-wallet to pay.
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
            payment_methods=["qrph"],  # QR PH - universal for all PH banks/e-wallets
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
            
            # PRODUCTION-READY: All withdrawals require manual processing
            # PayMongo does not support GCash payouts directly
            # Options for actual payouts:
            # 1. Maya Business API (GCash/Maya wallets)
            # 2. DragonPay (multi-channel payouts)
            # 3. Bank transfers (PayMongo supports for verified accounts)
            # 4. Manual GCash send money
            
            disbursement_id = f"WD_{external_id}"
            
            # Log the withdrawal request for admin processing
            logger.info(f"📤 WITHDRAWAL REQUEST CREATED:")
            logger.info(f"   Disbursement ID: {disbursement_id}")
            logger.info(f"   Amount: ₱{amount}")
            logger.info(f"   Recipient: {recipient_name}")
            logger.info(f"   GCash Number: {normalized_number}")
            logger.info(f"   Transaction ID: {transaction_id}")
            logger.info(f"   Status: PENDING (requires admin approval)")
            
            if self.test_mode:
                logger.info("🧪 TEST MODE: Withdrawal will remain pending until manually approved")
            
            # Send admin notification email (async in production)
            self._send_withdrawal_admin_notification(
                disbursement_id=disbursement_id,
                amount=amount,
                recipient_name=recipient_name,
                gcash_number=normalized_number,
                user_email=metadata.get('user_email') if metadata else None,
                transaction_id=transaction_id
            )
            
            return {
                "success": True,
                "disbursement_id": disbursement_id,
                "external_id": external_id,
                "amount": amount,
                "status": DisbursementStatus.PENDING,  # Always PENDING until manually processed
                "channel_code": channel_code,
                "recipient_name": recipient_name,
                "recipient_number": normalized_number,
                "test_mode": self.test_mode,
                "provider": "paymongo",
                "message": "Withdrawal request submitted. Your funds will be sent to your GCash within 1-3 business days after verification.",
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
    
    def _send_withdrawal_admin_notification(
        self,
        disbursement_id: str,
        amount: float,
        recipient_name: str,
        gcash_number: str,
        user_email: Optional[str],
        transaction_id: int
    ):
        """
        Send email notification to admin about new withdrawal request.
        This allows manual processing of GCash payouts.
        """
        try:
            import requests
            from django.conf import settings
            from django.utils import timezone
            
            admin_email = getattr(settings, 'ADMIN_WITHDRAWAL_EMAIL', None)
            resend_api_key = getattr(settings, 'RESEND_API_KEY', None)
            
            if not admin_email or not resend_api_key:
                logger.warning("⚠️ Admin withdrawal email or Resend API key not configured - skipping notification")
                return
            
            # Build email content
            subject = f"🔔 New Withdrawal Request: ₱{amount:,.2f} - {disbursement_id}"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }}
                    .header {{ background: linear-gradient(135deg, #ff9800, #f57c00); color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; }}
                    .header h1 {{ margin: 0; font-size: 24px; }}
                    .details {{ background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                    .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }}
                    .detail-row:last-child {{ border-bottom: none; }}
                    .label {{ color: #666; font-weight: 500; }}
                    .value {{ color: #333; font-weight: 600; }}
                    .amount {{ font-size: 28px; color: #ff9800; font-weight: bold; text-align: center; padding: 20px 0; }}
                    .action-required {{ background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }}
                    .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 30px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💸 Withdrawal Request</h1>
                    </div>
                    
                    <div class="amount">₱{amount:,.2f}</div>
                    
                    <div class="details">
                        <div class="detail-row">
                            <span class="label">Disbursement ID</span>
                            <span class="value">{disbursement_id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Transaction ID</span>
                            <span class="value">{transaction_id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Recipient Name</span>
                            <span class="value">{recipient_name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">GCash Number</span>
                            <span class="value">{gcash_number}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">User Email</span>
                            <span class="value">{user_email or 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Request Time</span>
                            <span class="value">{timezone.now().strftime('%Y-%m-%d %H:%M:%S')} UTC</span>
                        </div>
                    </div>
                    
                    <div class="action-required">
                        <strong>⚠️ Action Required:</strong><br>
                        Please process this withdrawal manually via GCash Send Money and mark as completed in the admin panel.
                    </div>
                    
                    <div class="footer">
                        <p>iAyos Payment System</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Send via Resend
            response = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "iAyos <no-reply@iayos.com>",
                    "to": [admin_email],
                    "subject": subject,
                    "html": html_content
                },
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"✅ Admin withdrawal notification sent to {admin_email}")
            else:
                logger.warning(f"⚠️ Failed to send admin notification: {response.text}")
                
        except Exception as e:
            logger.error(f"❌ Error sending admin notification: {str(e)}")
    
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

    def get_supported_banks_cached(self, ttl_seconds: int = 86400) -> List[Dict[str, str]]:
        """
        Get PayMongo-supported bank directory for Transfer V2.
        Cached to reduce API roundtrips for repeated UI dropdown fetches.
        """
        cache_key = "paymongo_supported_banks_v2"
        cached = cache.get(cache_key)
        if cached:
            sanitized_cached = [
                bank
                for bank in cached
                if str(bank.get("code", "")).strip() and str(bank.get("name", "")).strip()
            ]
            if sanitized_cached:
                return sanitized_cached
            # Clear stale/invalid cache entries (e.g., legacy empty-code fallbacks)
            cache.delete(cache_key)

        banks = self._fetch_supported_banks()
        if not banks:
            # Provide a fallback directory with non-empty placeholder codes so UI
            # can still render/select banks when provider directory lookup fails.
            logger.warning("⚠️ PayMongo bank directory unavailable; using fallback bank directory")
            banks = self._fallback_supported_banks()

        cache.set(cache_key, banks, timeout=ttl_seconds)
        return banks

    def resolve_bank_code(self, bank_name: Optional[str], banks: Optional[List[Dict[str, str]]] = None) -> Optional[str]:
        """Resolve live provider bank code by bank name."""
        if not bank_name:
            return None

        normalized_target = self._normalize_bank_name(bank_name)
        if not normalized_target:
            return None

        candidate_banks = banks if banks is not None else self._fetch_supported_banks()
        if not candidate_banks:
            return None

        for bank in candidate_banks:
            if self._normalize_bank_name(bank.get("name", "")) == normalized_target:
                code = str(bank.get("code", "")).strip()
                if code:
                    return code

        for bank in candidate_banks:
            normalized_name = self._normalize_bank_name(bank.get("name", ""))
            if normalized_target in normalized_name or normalized_name in normalized_target:
                code = str(bank.get("code", "")).strip()
                if code:
                    return code

        return None

    def derive_fallback_bank_code(self, stored_code: str, bank_name: Optional[str]) -> Optional[str]:
        """
        Derive the BIC/SWIFT code for PayMongo Transfer V2 destination_account.bic
        when only a fallback code or bank name is available.

        Returns a BIC code (e.g. 'BNORPHMM' for BDO) required by POST /v2/batch_transfers.
        """
        raw_code = (stored_code or "").strip()
        slug = raw_code.replace("fallback:", "", 1).strip().lower()

        # 1. Direct lookup in BIC map (covers BIC→BIC, shortcode→BIC, slug→BIC)
        bic = self._BIC_MAP.get(slug) or self._BIC_MAP.get(raw_code)
        if bic:
            return bic

        # 2. Name-based lookup against static fallback list
        normalized_name = self._normalize_bank_name(bank_name or "")
        name_to_bic = {
            "union bank": "UBPHPHMM",
            "unionbank":  "UBPHPHMM",
            "security bank": "SBNKPHMM",
            "metro bank": "MBTCPHMM",
            "metrobank":  "MBTCPHMM",
            "land bank":  "LBPIPHM1",
            "landbank":   "LBPIPHM1",
            "eastwest":   "EWBKPHMM",
            "chinabank":  "CHBKPHMM",
            "china bank": "CHBKPHMM",
            "maybank":    "MBBEPHMM",
            "rcbc":       "RCBCPHMM",
            "philippine national": "PNBMPHMM",
            "bpi":        "BOPIPHM1",
            "bdo":        "BNORPHMM",
            "asia united": "AUBKPHMM",
            "development bank": "DEVBPHM1",
        }
        for keyword, bic_code in name_to_bic.items():
            if keyword in normalized_name:
                return bic_code

        return None

    def normalize_bank_code_to_bic(self, bank_code: str, bank_name: Optional[str] = None) -> Optional[str]:
        """
        Normalise any stored bank code format (BIC, short code, slug, fallback:slug)
        to the BIC/SWIFT code required by PayMongo Transfer V2 destination_account.bic.

        Returns the BIC if resolvable, or None if unknown.
        """
        raw = (bank_code or "").strip()
        if not raw:
            return None

        # Strip the 'fallback:' prefix before lookup
        normalized = raw.replace("fallback:", "", 1).strip()

        # Direct map lookup (covers BIC→BIC, short→BIC, slug→BIC, uppercase variants)
        bic = (
            self._BIC_MAP.get(normalized)
            or self._BIC_MAP.get(normalized.lower())
            or self._BIC_MAP.get(normalized.upper())
        )
        if bic:
            return bic

        # Try resolve by name against live institutions (may return BIC from live API)
        if bank_name:
            live_code = self.resolve_bank_code(bank_name)
            if live_code and live_code.upper() not in ("INS",) and not live_code.lower().startswith("ins_"):
                # Re-normalize the live-returned code (it might itself be a BIC already)
                bic_from_live = (
                    self._BIC_MAP.get(live_code)
                    or self._BIC_MAP.get(live_code.upper())
                    or (live_code if len(live_code) >= 8 else None)
                )
                if bic_from_live:
                    return bic_from_live

        # Name-based derivation as last resort
        return self.derive_fallback_bank_code(raw, bank_name)

    def create_bank_transfer_v2(
        self,
        amount: float,
        recipient_name: str,
        account_number: str,
        bank_code: str,
        transaction_id: int,
        description: str,
        metadata: Optional[Dict[str, Any]] = None,
        transfer_provider: str = "instapay",
        paymongo_recipient_id: Optional[str] = None,  # Kept for signature compat, unused
    ) -> Dict[str, Any]:
        """
        Create a PayMongo Transfer V2 payout for BANK withdrawals.

        Uses POST /v2/batch_transfers with inline destination_account.
        No separate recipient creation step — the old /v1/recipients endpoint
        does not exist in the PayMongo API.

        bank_code must be a BIC/SWIFT code (e.g. BNORPHMM for BDO, BOPIPHM1 for BPI).
        These are returned by GET /v1/wallets/receiving_institutions?provider=instapay.
        """
        try:
            normalized_account = self._normalize_bank_account_number(account_number)
            if not normalized_account:
                return {"success": False, "error": "Invalid bank account number"}

            clean_bank_code = (bank_code or "").strip()
            if not clean_bank_code:
                return {"success": False, "error": "Missing bank BIC code for BANK transfer"}

            external_id = self._generate_external_id("BANKWD", transaction_id)
            transfer_metadata = {
                "transaction_id": str(transaction_id),
                "external_id": external_id,
                **(metadata or {}),
            }

            amount_centavos = int(float(amount) * 100)
            payload = {
                "data": {
                    "attributes": {
                        "transfers": [
                            {
                                "destination_account": {
                                    "number": normalized_account,
                                    "name": recipient_name,
                                    "bic": clean_bank_code,
                                },
                                "amount": amount_centavos,
                                "currency": "PHP",
                                "provider": (transfer_provider or "instapay").lower(),
                                "reference_number": external_id,
                                "description": description,
                                "metadata": transfer_metadata,
                            }
                        ]
                    }
                }
            }

            response = requests.post(
                f"{self.TRANSFER_V2_BASE_URL}/batch_transfers",
                json=payload,
                headers=self._get_headers(),
                timeout=30,
            )

            if response.status_code in (200, 201):
                resp_data = response.json().get("data", {})
                resp_attrs = resp_data.get("attributes", resp_data)  # V2 uses data.attributes
                transfers = resp_attrs.get("transfers", [])
                first_transfer = transfers[0] if transfers else {}
                status = self._map_transfer_status(first_transfer.get("status", "pending"))
                return {
                    "success": True,
                    "transfer_id": first_transfer.get("id"),
                    "batch_transfer_id": resp_data.get("id"),
                    "external_id": external_id,
                    "status": status,
                    "provider": "paymongo",
                }

            error_data = response.json() if response.text else {}
            errors = error_data.get("errors", [{}])
            detail = errors[0].get("detail", f"HTTP {response.status_code}") if errors else f"HTTP {response.status_code}"
            logger.error(f"❌ PayMongo batch_transfer failed: {detail}")
            return {
                "success": False,
                "error": detail,
                "error_details": error_data,
            }
        except Exception as e:
            logger.error(f"❌ PayMongo batch_transfer exception: {str(e)}")
            return {"success": False, "error": str(e)}
    
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

            # Transfer webhook handling (Transfer V2)
            if "transfer" in event_type.lower():
                transfer_status = self._map_transfer_status(resource_attributes.get("status", "pending"))
                transfer_metadata = resource_attributes.get("metadata", {}) or {}
                return {
                    "event_type": event_type,
                    "transfer_id": resource_data.get("id"),
                    "external_id": transfer_metadata.get("external_id"),
                    "status": transfer_status,
                    "amount": resource_attributes.get("amount", 0) / 100 if resource_attributes.get("amount") else 0,
                    "metadata": transfer_metadata,
                    "transaction_id": transfer_metadata.get("transaction_id"),
                    "provider": "paymongo",
                }
            
            # Extract payment info
            metadata = resource_attributes.get("metadata", {})
            payments = resource_attributes.get("payments", [])
            payment_info = payments[0].get("attributes", {}) if payments else {}
            # The actual pay_xxx ID lives at payments[0]["id"] (distinct from the cs_xxx checkout session ID)
            actual_payment_id = payments[0].get("id") if payments else None
            
            return {
                "event_type": event_type,
                "payment_id": resource_data.get("id"),
                "actual_payment_id": actual_payment_id,
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

    def _fetch_supported_banks(self) -> List[Dict[str, str]]:
        """Fetch bank institutions from PayMongo; tolerant to endpoint shape changes."""
        # Correct endpoint per PayMongo Transfer V2 docs:
        # GET /v1/wallets/receiving_institutions?provider=instapay|pesonet
        endpoints = [
            f"{self.BASE_URL}/wallets/receiving_institutions?provider=instapay",
            f"{self.BASE_URL}/wallets/receiving_institutions?provider=pesonet",
        ]

        if not self.secret_key:
            logger.error("❌ Cannot fetch PayMongo institutions: missing PAYMONGO_SECRET_KEY")
            return []

        for endpoint in endpoints:
            try:
                response = requests.get(endpoint, headers=self._get_headers(), timeout=30)
                if response.status_code != 200:
                    logger.warning(
                        "⚠️ PayMongo institutions fetch failed (%s): HTTP %s - %s",
                        endpoint,
                        response.status_code,
                        (response.text or '')[:300],
                    )
                    continue

                payload = response.json()
                items = payload.get("data", []) if isinstance(payload, dict) else []
                banks: List[Dict[str, str]] = []
                for item in items:
                    attributes = item.get("attributes", {}) if isinstance(item, dict) else {}
                    # IMPORTANT: transfer recipient requires a real provider bank code,
                    # not the institutions resource id (e.g., ins_xxx).
                    code_candidates = [
                        attributes.get("bic"),            # Primary: BIC code for Transfer V2 destination_account
                        attributes.get("bank_code"),
                        attributes.get("institution_code"),
                        attributes.get("instapay_code"),
                        attributes.get("pesonet_code"),
                        attributes.get("code"),
                        attributes.get("short_code"),
                        attributes.get("swift_code"),
                        item.get("id"),
                    ]
                    code = ""
                    for candidate in code_candidates:
                        raw = str(candidate or "").strip()
                        if not raw:
                            continue
                        # Do not use institutions resource IDs as bank codes.
                        if raw.lower().startswith("ins_"):
                            continue
                        code = raw
                        break
                    name = (
                        attributes.get("name")
                        or attributes.get("display_name")
                        or attributes.get("short_name")
                        or ""
                    )
                    if code and name:
                        banks.append({"code": str(code), "name": str(name)})

                if banks:
                    banks.sort(key=lambda x: x["name"])
                    logger.info("✅ PayMongo institutions loaded: %d banks", len(banks))
                    return banks
                logger.warning(
                    "⚠️ PayMongo institutions endpoint returned 200 but no parsable bank entries: %s",
                    endpoint,
                )
            except Exception:
                logger.exception("❌ Exception while fetching PayMongo institutions from %s", endpoint)
                continue

        return []

    def _fallback_supported_banks(self) -> List[Dict[str, str]]:
        """
        Static bank list with the short codes PayMongo Transfer V2 /recipients accepts.
        Used when the live institutions endpoint is unavailable.
        Codes were derived from PayMongo's supported-banks list for Transfer/Disbursements.
        """
        # BIC codes (SWIFT) required by PayMongo Transfer V2 destination_account.bic.
        # The live /v1/wallets/receiving_institutions endpoint is the authoritative source;
        # this list is used only when that endpoint is unreachable.
        return [
            {"code": "AUBKPHMM",    "name": "Asia United Bank (AUB)"},
            {"code": "BNORPHMM",    "name": "BDO Unibank, Inc."},
            {"code": "BOPIPHM1",    "name": "BPI (Bank of the Philippine Islands)"},
            {"code": "CHBKPHMM",    "name": "China Banking Corporation (Chinabank)"},
            {"code": "DEVBPHM1",    "name": "Development Bank of the Philippines (DBP)"},
            {"code": "EWBKPHMM",    "name": "EastWest Bank"},
            {"code": "LBPIPHM1",    "name": "Land Bank of the Philippines"},
            {"code": "MBBEPHMM",    "name": "Maybank Philippines, Inc."},
            {"code": "MBTCPHMM",    "name": "Metrobank (Metropolitan Bank & Trust Co.)"},
            {"code": "PNBMPHMM",    "name": "Philippine National Bank (PNB)"},
            {"code": "RCBCPHMM",    "name": "RCBC (Rizal Commercial Banking Corporation)"},
            {"code": "SBNKPHMM",    "name": "Security Bank Corporation"},
            {"code": "UBPHPHMM",    "name": "Union Bank of the Philippines (UnionBank)"},
        ]

    def _normalize_bank_name(self, value: str) -> str:
        normalized = (value or "").lower()
        normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return normalized

    def _slugify_bank_name(self, value: str) -> str:
        return self._normalize_bank_name(value).replace(" ", "-")

    def _create_transfer_recipient_v2(
        self,
        recipient_name: str,
        account_number: str,
        bank_code: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        DEPRECATED — DO NOT CALL.

        The PayMongo /v1/recipients endpoint does not exist. Recipient details are
        passed inline via destination_account inside POST /v2/batch_transfers.
        create_bank_transfer_v2() no longer calls this method.
        """
        logger.error(
            "❌ _create_transfer_recipient_v2() called — /v1/recipients does not exist. "
            "Use create_bank_transfer_v2() which calls POST /v2/batch_transfers directly."
        )
        return {"success": False, "error": "Recipient endpoint does not exist — use batch_transfers"}
    
    def get_checkout_session_payments(self, cs_id: str):
        """
        Fetch the pay_xxx payment ID for a given checkout session (used for lazy backfill).
        Returns the pay_xxx string, or None if not found / request fails.
        """
        try:
            response = requests.get(
                f"{self.BASE_URL}/checkout_sessions/{cs_id}",
                headers=self._get_headers(),
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                payments = (
                    data.get("data", {})
                        .get("attributes", {})
                        .get("payments", [])
                )
                if payments:
                    return payments[0].get("id")  # pay_xxx
            return None
        except Exception as e:
            logger.error(f"❌ Failed to get checkout session payments for {cs_id}: {str(e)}")
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
            "GRAB_PAY": "grab_pay",
            "qrph": "qrph",
            "QRPH": "qrph",
            "qr_ph": "qrph",
            "QR_PH": "qrph"
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

    def _normalize_bank_account_number(self, number: str) -> Optional[str]:
        """Normalize bank account number to digits-only, 8-20 digits."""
        if not number:
            return None
        cleaned = "".join(ch for ch in str(number).strip() if ch.isdigit())
        if 8 <= len(cleaned) <= 20:
            return cleaned
        return None

    def _map_transfer_status(self, provider_status: str) -> str:
        """Map PayMongo transfer status to normalized disbursement status."""
        value = (provider_status or "").lower().strip()
        if value in {"paid", "completed", "succeeded", "success"}:
            return DisbursementStatus.COMPLETED
        if value in {"failed", "cancelled", "canceled", "reversed"}:
            return DisbursementStatus.FAILED
        return DisbursementStatus.PENDING


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
