from ninja import Router, File
from ninja.files import UploadedFile
from ninja.responses import Response
from accounts.authentication import cookie_auth
from accounts.models import Wallet, Transaction, Profile
from .schemas import DepositFundsSchema
from decimal import Decimal
from django.utils import timezone


from .schemas import ProductCreateSchema, ProductSchema
from .services import add_product_to_profile, list_products_for_profile, delete_product_for_profile


router = Router()

__all__ = ["router"]

#region PRODUCT ENDPOINTS

# List all products/materials for the authenticated worker
@router.get("/profile/products/", response=list[ProductSchema], auth=cookie_auth)
def list_products(request):
    """
    List all products/materials for the authenticated worker's profile.
    If profile not found, return an empty list to keep frontend UX simple.
    """
    try:
        profile = Profile.objects.filter(accountFK=request.auth).first()
        if not profile:
            # No profile associated yet for this account - return empty list
            return []
        return list_products_for_profile(profile)
    except Exception as e:
        # Log full traceback for debugging
        print(f"❌ Error listing products: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Failed to list products"}, status=500)

# Delete a product/material by ID for the authenticated worker
@router.delete("/profile/products/{product_id}", auth=cookie_auth)
def delete_product(request, product_id: int):
    """
    Delete a product/material by ID for the authenticated worker's profile.
    """
    try:
        profile = Profile.objects.get(accountFK=request.auth)
        return delete_product_for_profile(profile, product_id)
    except Profile.DoesNotExist:
        return Response({"error": "Profile not found"}, status=404)
    except Exception as e:
        print(f"❌ Error deleting product: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Failed to delete product"}, status=500)

@router.post("/profile/products/add", response=ProductSchema, auth=cookie_auth)
def add_product(request, data: ProductCreateSchema):
    """
    Add a product to the authenticated worker's profile.
    """
    try:
        profile = Profile.objects.get(accountFK=request.auth)
        product = add_product_to_profile(profile, data)
        return ProductSchema(
            productID=product.productID,
            name=product.name,
            description=product.description,
            price=float(product.price) if product.price is not None else None,
            createdAt=product.createdAt.isoformat(),
            updatedAt=product.updatedAt.isoformat()
        )
    except Profile.DoesNotExist:
        return Response({"error": "Profile not found"}, status=404)
    except Exception as e:
        print(f"❌ Error adding product: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Failed to add product"}, status=500)

#endregion


#region PROFILE IMAGE UPLOAD

@router.post("/upload/profile-image", auth=cookie_auth)
def upload_profile_image_endpoint(request, profile_image: UploadedFile = File(...)):
    """
    Upload user profile image to Supabase storage.
    
    Path structure: users/user_{userID}/profileImage/avatar.png
    
    Args:
        profile_image: Image file (JPEG, PNG, JPG, WEBP, max 5MB)
    
    Returns:
        success: boolean
        message: string
        image_url: string (public URL)
        accountID: int
    """
    try:
        from accounts.services import upload_profile_image_service
        
        user = request.auth
        result = upload_profile_image_service(user, profile_image)
        
        return result
        
    except ValueError as e:
        print(f"❌ ValueError in profile image upload: {str(e)}")
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Exception in profile image upload: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to upload profile image"},
            status=500
        )

#endregion


#region WALLET ENDPOINTS

@router.get("/wallet/balance", auth=cookie_auth)
def get_wallet_balance(request):
    """Get current user's wallet balance"""
    try:
        # Get or create wallet for the user
        wallet, created = Wallet.objects.get_or_create(
            accountFK=request.auth,
            defaults={'balance': 0.00}
        )
        
        return {
            "success": True,
            "balance": float(wallet.balance),
            "created": created
        }
        
    except Exception as e:
        print(f"❌ Error fetching wallet balance: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch wallet balance"},
            status=500
        )


@router.post("/wallet/deposit", auth=cookie_auth)
def deposit_funds(request, data: DepositFundsSchema):
    """
    Create a Xendit payment invoice for wallet deposit
    TEST MODE: Transaction auto-approved, funds added immediately
    Returns payment URL for user to see Xendit page
    """
    try:
        from accounts.xendit_service import XenditService
        
        amount = data.amount
        payment_method = data.payment_method
        
        print(f"📥 Deposit request received: amount={amount}, payment_method={payment_method}")
        
        if amount <= 0:
            return Response(
                {"error": "Amount must be greater than 0"},
                status=400
            )
        
        # Get or create wallet
        wallet, _ = Wallet.objects.get_or_create(
            accountFK=request.auth,
            defaults={'balance': 0.00}
        )
        
        # Get user's profile for name
        try:
            profile = Profile.objects.get(accountFK=request.auth)
            user_name = f"{profile.firstName} {profile.lastName}"
        except Profile.DoesNotExist:
            user_name = request.auth.email.split('@')[0]  # Fallback to email username
        
        print(f"💰 Processing deposit for {user_name}")
        print(f"   Current balance: ₱{wallet.balance}")
        
        # TEST MODE: Add funds immediately and mark as completed
        wallet.balance += Decimal(str(amount))
        wallet.save()
        
        # Create completed transaction (auto-approved in TEST MODE)
        transaction = Transaction.objects.create(
            walletID=wallet,
            transactionType=Transaction.TransactionType.DEPOSIT,
            amount=Decimal(str(amount)),
            balanceAfter=wallet.balance,
            status=Transaction.TransactionStatus.COMPLETED,
            description=f"TOP UP via GCASH - ₱{amount}",
            paymentMethod=Transaction.PaymentMethod.GCASH,
            completedAt=timezone.now()
        )
        
        print(f"   New balance: ₱{wallet.balance}")
        print(f"✅ Funds added immediately! Transaction {transaction.transactionID}")
        
        # Create Xendit invoice for user experience
        print(f"🔄 Creating Xendit invoice...")
        xendit_result = XenditService.create_gcash_payment(
            amount=amount,
            user_email=request.auth.email,
            user_name=user_name,
            transaction_id=transaction.transactionID
        )
        
        if not xendit_result.get("success"):
            # If Xendit fails, funds are still added but return error
            return Response(
                {"error": "Failed to create payment invoice", "details": xendit_result.get("error")},
                status=500
            )
        
        # Update transaction with Xendit details
        transaction.xenditInvoiceID = xendit_result['invoice_id']
        transaction.xenditExternalID = xendit_result['external_id']
        transaction.invoiceURL = xendit_result['invoice_url']
        transaction.xenditPaymentChannel = "GCASH"
        transaction.xenditPaymentMethod = "EWALLET"
        transaction.save()
        
        print(f"📄 Xendit invoice created: {xendit_result['invoice_id']}")
        
        return {
            "success": True,
            "transaction_id": transaction.transactionID,
            "payment_url": xendit_result['invoice_url'],
            "invoice_id": xendit_result['invoice_id'],
            "amount": amount,
            "new_balance": float(wallet.balance),
            "expiry_date": xendit_result['expiry_date'],
            "message": "Funds added and payment invoice created"
        }
        
    except Exception as e:
        print(f"❌ Error depositing funds: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to deposit funds"},
            status=500
        )


@router.post("/wallet/withdraw", auth=cookie_auth)
def withdraw_funds(request, amount: float, payment_method: str = "GCASH"):
    """Withdraw funds from wallet"""
    try:
        if amount <= 0:
            return Response(
                {"error": "Amount must be greater than 0"},
                status=400
            )
        
        # Get wallet
        try:
            wallet = Wallet.objects.get(accountFK=request.auth)
        except Wallet.DoesNotExist:
            return Response(
                {"error": "Wallet not found"},
                status=404
            )
        
        # Check sufficient balance
        if wallet.balance < Decimal(str(amount)):
            return Response(
                {"error": "Insufficient balance"},
                status=400
            )
        
        # Update balance
        wallet.balance -= Decimal(str(amount))
        wallet.save()
        
        # Create transaction record
        transaction = Transaction.objects.create(
            walletID=wallet,
            transactionType="WITHDRAWAL",
            amount=Decimal(str(amount)),
            balanceAfter=wallet.balance,
            status="COMPLETED",
            description=f"Withdrawal via {payment_method}",
            paymentMethod=payment_method,
            completedAt=timezone.now()
        )
        
        return {
            "success": True,
            "new_balance": float(wallet.balance),
            "transaction_id": transaction.transactionID,
            "message": f"Successfully withdrew ₱{amount}"
        }
        
    except Exception as e:
        print(f"❌ Error withdrawing funds: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to withdraw funds"},
            status=500
        )


@router.get("/wallet/transactions", auth=cookie_auth)
def get_wallet_transactions(request):
    """Get user's wallet transaction history"""
    try:
        # Get wallet
        try:
            wallet = Wallet.objects.get(accountFK=request.auth)
        except Wallet.DoesNotExist:
            return {
                "success": True,
                "transactions": []
            }
        
        # Get transactions
        transactions = Transaction.objects.filter(
            walletID=wallet
        ).order_by('-createdAt')[:50]  # Last 50 transactions
        
        transaction_list = [
            {
                "id": t.transactionID,
                "type": t.transactionType,
                "amount": float(t.amount),
                "balance_after": float(t.balanceAfter),
                "status": t.status,
                "description": t.description,
                "payment_method": t.paymentMethod,
                "reference_number": t.referenceNumber,
                "created_at": t.createdAt.isoformat(),
                "completed_at": t.completedAt.isoformat() if t.completedAt else None
            }
            for t in transactions
        ]
        
        return {
            "success": True,
            "transactions": transaction_list,
            "current_balance": float(wallet.balance)
        }
        
    except Exception as e:
        print(f"❌ Error fetching transactions: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch transactions"},
            status=500
        )


@router.post("/wallet/webhook", auth=None)  # No auth for webhooks
def xendit_webhook(request):
    """
    Handle Xendit payment webhook callbacks
    This endpoint is called by Xendit when payment status changes
    """
    try:
        from accounts.xendit_service import XenditService
        import json
        
        # Get webhook payload
        payload = json.loads(request.body)
        
        print(f"📥 Xendit Webhook received: {payload.get('id')}")
        
        # Verify webhook (optional in TEST mode)
        webhook_token = request.headers.get('x-callback-token', '')
        if not XenditService.verify_webhook_signature(webhook_token):
            print(f"❌ Invalid webhook signature")
            return Response(
                {"error": "Invalid webhook signature"},
                status=401
            )
        
        # Parse webhook data
        webhook_data = XenditService.parse_webhook_payload(payload)
        if not webhook_data:
            return Response(
                {"error": "Invalid webhook payload"},
                status=400
            )
        
        # Find transaction by Xendit invoice ID
        try:
            transaction = Transaction.objects.get(
                xenditInvoiceID=webhook_data['invoice_id']
            )
        except Transaction.DoesNotExist:
            print(f"❌ Transaction not found for invoice {webhook_data['invoice_id']}")
            return Response(
                {"error": "Transaction not found"},
                status=404
            )
        
        # Update transaction based on status
        invoice_status = webhook_data['status']
        
        if invoice_status == 'PAID':
            # Payment successful
            wallet = transaction.walletID
            
            # Update wallet balance
            wallet.balance += transaction.amount
            wallet.save()
            
            # Update transaction
            transaction.status = Transaction.TransactionStatus.COMPLETED
            transaction.balanceAfter = wallet.balance
            transaction.xenditPaymentID = webhook_data.get('payment_id')
            transaction.xenditPaymentChannel = webhook_data.get('payment_channel')
            transaction.xenditPaymentMethod = webhook_data.get('payment_method')
            transaction.completedAt = timezone.now()
            transaction.save()
            
            print(f"✅ Payment completed for transaction {transaction.transactionID}")
            
        elif invoice_status in ['EXPIRED', 'FAILED']:
            # Payment failed or expired
            transaction.status = Transaction.TransactionStatus.FAILED
            transaction.description = f"{transaction.description} - {invoice_status}"
            transaction.save()
            
            print(f"❌ Payment {invoice_status.lower()} for transaction {transaction.transactionID}")
        
        return {"success": True, "message": "Webhook processed"}
        
    except Exception as e:
        print(f"❌ Error processing webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to process webhook"},
            status=500
        )


@router.post("/wallet/simulate-payment/{transaction_id}", auth=cookie_auth)
def simulate_payment_completion(request, transaction_id: int):
    """
    DEVELOPMENT ONLY: Manually complete a payment for testing
    This simulates what the Xendit webhook would do
    """
    try:
        # Get transaction
        try:
            transaction = Transaction.objects.get(
                transactionID=transaction_id,
                walletID__accountFK=request.auth  # Ensure user owns this transaction
            )
        except Transaction.DoesNotExist:
            return Response(
                {"error": "Transaction not found"},
                status=404
            )
        
        # Check if already completed
        if transaction.status == Transaction.TransactionStatus.COMPLETED:
            return {
                "success": False,
                "message": "Transaction already completed",
                "balance": float(transaction.walletID.balance)
            }
        
        # Check if pending
        if transaction.status != Transaction.TransactionStatus.PENDING:
            return Response(
                {"error": f"Transaction is {transaction.status}, cannot complete"},
                status=400
            )
        
        # Complete the payment
        wallet = transaction.walletID
        
        print(f"💰 Simulating payment completion for transaction {transaction_id}")
        print(f"   Current balance: ₱{wallet.balance}")
        print(f"   Adding: ₱{transaction.amount}")
        
        # Update wallet balance
        wallet.balance += transaction.amount
        wallet.save()
        
        # Update transaction
        transaction.status = Transaction.TransactionStatus.COMPLETED
        transaction.balanceAfter = wallet.balance
        transaction.xenditPaymentID = "SIMULATED_" + str(transaction_id)
        transaction.xenditPaymentChannel = "GCASH"
        transaction.completedAt = timezone.now()
        transaction.save()
        
        print(f"   New balance: ₱{wallet.balance}")
        print(f"✅ Payment simulation completed!")
        
        return {
            "success": True,
            "message": "Payment completed successfully (simulated)",
            "transaction_id": transaction.transactionID,
            "amount": float(transaction.amount),
            "new_balance": float(wallet.balance)
        }
        
    except Exception as e:
        print(f"❌ Error simulating payment: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to simulate payment"},
            status=500
        )


@router.get("/wallet/payment-status/{transaction_id}", auth=cookie_auth)
def check_payment_status(request, transaction_id: int):
    """
    Check the current status of a payment transaction
    Used for polling payment status from frontend
    """
    try:
        from accounts.xendit_service import XenditService
        
        # Get transaction
        try:
            transaction = Transaction.objects.get(
                transactionID=transaction_id,
                walletID__accountFK=request.auth  # Ensure user owns this transaction
            )
        except Transaction.DoesNotExist:
            return Response(
                {"error": "Transaction not found"},
                status=404
            )
        
        # If transaction already completed/failed, return current status
        if transaction.status in [Transaction.TransactionStatus.COMPLETED, Transaction.TransactionStatus.FAILED]:
            return {
                "success": True,
                "status": transaction.status,
                "amount": float(transaction.amount),
                "balance_after": float(transaction.balanceAfter),
                "completed_at": transaction.completedAt.isoformat() if transaction.completedAt else None
            }
        
        # If still pending, check with Xendit
        if transaction.xenditInvoiceID:
            xendit_status = XenditService.get_invoice_status(transaction.xenditInvoiceID)
            
            return {
                "success": True,
                "status": transaction.status,
                "xendit_status": xendit_status.get('status'),
                "payment_url": transaction.invoiceURL,
                "amount": float(transaction.amount)
            }
        
        return {
            "success": True,
            "status": transaction.status,
            "amount": float(transaction.amount)
        }
        
    except Exception as e:
        print(f"❌ Error checking payment status: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to check payment status"},
            status=500
        )

#endregion
