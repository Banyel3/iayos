from ninja import Router, File
from ninja.files import UploadedFile
from ninja.responses import Response
from accounts.authentication import cookie_auth, dual_auth
from accounts.models import Wallet, Transaction, Profile
from .schemas import (
    DepositFundsSchema,
    ProductCreateSchema,
    ProductSchema,
    SendMessageSchema,
    MessageResponseSchema,
    ConversationSchema,
    ConversationParticipantSchema,
    MarkAsReadSchema
)
from .models import Conversation, Message, MessageAttachment
from decimal import Decimal
from django.utils import timezone
from django.db.models import Q


from .schemas import ProductCreateSchema, ProductSchema
from .services import add_product_to_profile, list_products_for_profile, delete_product_for_profile


router = Router()

__all__ = ["router"]


def _get_user_profile(request) -> Profile:
    """Return the current user's profile respecting JWT profile_type."""
    profile_type = getattr(request.auth, "profile_type", None)
    query = Profile.objects.filter(accountFK=request.auth)

    if profile_type:
        profile = query.filter(profileType=profile_type).first()
        if profile:
            return profile

    profile = query.first()
    if profile:
        return profile

    raise Profile.DoesNotExist

#region PRODUCT ENDPOINTS

# List all products/materials for the authenticated worker
@router.get("/profile/products/", response=list[ProductSchema], auth=cookie_auth)
def list_products(request):
    """
    List all products/materials for the authenticated worker's profile.
    If profile not found, return an empty list to keep frontend UX simple.
    """
    try:
        try:
            profile = _get_user_profile(request)
        except Profile.DoesNotExist:
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
        profile = _get_user_profile(request)
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
        profile = _get_user_profile(request)
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
    """Get current user's wallet balance including reserved funds"""
    try:
        from decimal import Decimal
        
        # Get or create wallet for the user
        wallet, created = Wallet.objects.get_or_create(
            accountFK=request.auth,
            defaults={'balance': Decimal('0.00'), 'reservedBalance': Decimal('0.00')}
        )
        
        return {
            "success": True,
            "balance": float(wallet.balance),
            "reservedBalance": float(wallet.reservedBalance),
            "availableBalance": float(wallet.availableBalance),
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
            profile = _get_user_profile(request)
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
def withdraw_funds(request, amount: float, payment_method_id: int, notes: str = ""):
    """
    Withdraw funds from wallet with Xendit order summary display
    TEST MODE: Funds deducted immediately, creates Xendit invoice for receipt/UX
    Similar to deposit flow - shows order summary page instead of disbursement
    """
    try:
        from accounts.xendit_service import XenditService
        from accounts.models import PaymentMethod
        
        print(f"📤 Withdrawal request received: amount={amount}, payment_method_id={payment_method_id}")
        
        if amount <= 0:
            return Response(
                {"error": "Amount must be greater than 0"},
                status=400
            )
        
        if amount < 100:
            return Response(
                {"error": "Minimum withdrawal amount is ₱100"},
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
        
        # Get payment method details
        try:
            payment_method = PaymentMethod.objects.get(
                id=payment_method_id,
                accountFK=request.auth
            )
        except PaymentMethod.DoesNotExist:
            return Response(
                {"error": "Payment method not found"},
                status=404
            )
        
        # Get user's profile for name
        try:
            profile = _get_user_profile(request)
            user_name = f"{profile.firstName} {profile.lastName}"
        except Profile.DoesNotExist:
            user_name = request.auth.email.split('@')[0]
        
        print(f"💸 Processing withdrawal for {user_name}")
        print(f"   Current balance: ₱{wallet.balance}")
        print(f"   Withdrawing to: {payment_method.accountNumber}")
        
        # TEST MODE: Deduct funds immediately
        wallet.balance -= Decimal(str(amount))
        wallet.save()
        
        # Create completed transaction
        description = f"Withdrawal to {payment_method.accountName} ({payment_method.accountNumber})"
        if notes:
            description += f" - {notes}"
        
        transaction = Transaction.objects.create(
            walletID=wallet,
            transactionType=Transaction.TransactionType.WITHDRAWAL,
            amount=Decimal(str(amount)),
            balanceAfter=wallet.balance,
            status=Transaction.TransactionStatus.COMPLETED,
            description=description,
            paymentMethod=Transaction.PaymentMethod.GCASH,
            completedAt=timezone.now()
        )
        
        print(f"   New balance: ₱{wallet.balance}")
        print(f"✅ Funds deducted immediately! Transaction {transaction.transactionID}")
        
        # Create Xendit invoice for order summary/receipt display
        print(f"🔄 Creating Xendit order summary...")
        xendit_result = XenditService.create_withdrawal_receipt(
            amount=amount,
            user_email=request.auth.email,
            user_name=user_name,
            transaction_id=transaction.transactionID,
            payment_method_name=payment_method.accountName,
            payment_method_number=payment_method.accountNumber
        )
        
        if not xendit_result.get("success"):
            # If Xendit fails, funds are still deducted but return without receipt
            print(f"⚠️  Xendit receipt creation failed, but withdrawal completed")
            return {
                "success": True,
                "transaction_id": transaction.transactionID,
                "new_balance": float(wallet.balance),
                "message": f"Successfully withdrew ₱{amount}",
                "test_mode": True
            }
        
        # Update transaction with Xendit details
        transaction.xenditInvoiceID = xendit_result['invoice_id']
        transaction.xenditExternalID = xendit_result['external_id']
        transaction.invoiceURL = xendit_result['invoice_url']
        transaction.xenditPaymentChannel = "GCASH"
        transaction.xenditPaymentMethod = "EWALLET"
        transaction.save()
        
        print(f"📄 Xendit order summary created: {xendit_result['invoice_id']}")
        print(f"🔗 Receipt URL: {xendit_result['invoice_url']}")
        
        return {
            "success": True,
            "transaction_id": transaction.transactionID,
            "receipt_url": xendit_result['invoice_url'],  # Changed from payment_url for clarity
            "invoice_id": xendit_result['invoice_id'],
            "amount": amount,
            "new_balance": float(wallet.balance),
            "message": f"Successfully withdrew ₱{amount}",
            "test_mode": xendit_result.get('test_mode', True)
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

#region CHAT ENDPOINTS

def get_participant_info(profile: Profile = None, agency = None, job_title: str = None, job = None) -> dict:
    """Helper function to get participant information (supports both Profile and Agency)"""
    if profile:
        return {
            "name": f"{profile.firstName} {profile.lastName}",
            "avatar": profile.profileImg or "/worker1.jpg",
            "profile_type": profile.profileType,
            "location": profile.location if hasattr(profile, 'location') else None,
            "job_title": job_title,
            "is_agency": False,
            "assigned_employee": None
        }
    elif agency:
        # Get assigned employee info if job is provided
        assigned_employee = None
        if job and job.assignedEmployeeID:
            emp = job.assignedEmployeeID
            # AgencyEmployee has direct fields (name, avatar, rating), not a workerProfile FK
            assigned_employee = {
                "name": emp.name,
                "avatar": emp.avatar,
                "rating": float(emp.rating) if emp.rating else None,
                "is_employee_of_month": emp.employeeOfTheMonth
            }
        return {
            "name": agency.businessName,
            "avatar": None,  # Agencies don't have profile pics yet
            "profile_type": "AGENCY",
            "location": agency.city if hasattr(agency, 'city') else None,
            "job_title": job_title,
            "is_agency": True,
            "assigned_employee": assigned_employee
        }
    else:
        return {
            "name": "Unknown",
            "avatar": "/worker1.jpg",
            "profile_type": "UNKNOWN",
            "location": None,
            "job_title": job_title,
            "is_agency": False,
            "assigned_employee": None
        }


@router.get("/chat/conversations", auth=dual_auth)
def get_conversations(request, filter: str = "all"):
    """
    Get all job-based conversations for the current user's profile.
    Returns list of conversations tied to jobs where user is either client or worker.
    Includes both 1:1 conversations and team group conversations.
    
    Query params:
    - filter: 'all', 'unread', or 'archived' (default: 'all')
    """
    try:
        from profiles.models import ConversationParticipant
        
        # Get user's profile based on profile_type from JWT
        profile_type = getattr(request.auth, 'profile_type', None)
        if profile_type:
            user_profile = Profile.objects.filter(
                accountFK=request.auth,
                profileType=profile_type
            ).first()
        else:
            user_profile = Profile.objects.filter(accountFK=request.auth).first()
        
        if not user_profile:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        print(f"\n🔍 === CONVERSATION DEBUG ===")
        print(f"📧 Logged in user: {request.auth.email}")
        print(f"👤 Profile ID: {user_profile.profileID}")
        print(f"📋 Profile Type: {user_profile.profileType}")
        print(f"🎫 JWT Profile Type: {profile_type}")
        
        # Get 1:1 conversations where user is client or worker
        one_on_one_query = Conversation.objects.filter(
            Q(client=user_profile) | Q(worker=user_profile),
            conversation_type='ONE_ON_ONE'
        )
        
        # Get team group conversations where user is a participant
        team_conv_ids = ConversationParticipant.objects.filter(
            profile=user_profile
        ).values_list('conversation_id', flat=True)
        
        team_query = Conversation.objects.filter(
            conversationID__in=team_conv_ids,
            conversation_type='TEAM_GROUP'
        )
        
        # Combine both queries
        conversations_query = (one_on_one_query | team_query).select_related(
            'client__accountFK',
            'worker__accountFK',
            'relatedJobPosting',
            'lastMessageSender'
        ).distinct()
        
        print(f"💬 Total conversations found: {conversations_query.count()}")
        
        # Apply filters based on the filter parameter
        if filter == "archived":
            # For 1:1: use archivedByClient/archivedByWorker
            # For team: check ConversationParticipant.is_archived
            archived_team_ids = ConversationParticipant.objects.filter(
                profile=user_profile,
                is_archived=True
            ).values_list('conversation_id', flat=True)
            
            conversations_query = conversations_query.filter(
                (Q(conversation_type='ONE_ON_ONE') & (
                    (Q(client=user_profile) & Q(archivedByClient=True)) |
                    (Q(worker=user_profile) & Q(archivedByWorker=True))
                )) |
                (Q(conversation_type='TEAM_GROUP') & Q(conversationID__in=archived_team_ids))
            )
        else:
            # For 'all' and 'unread', exclude archived conversations
            archived_team_ids = ConversationParticipant.objects.filter(
                profile=user_profile,
                is_archived=True
            ).values_list('conversation_id', flat=True)
            
            conversations_query = conversations_query.filter(
                (Q(conversation_type='ONE_ON_ONE') & (
                    (Q(client=user_profile) & Q(archivedByClient=False)) |
                    (Q(worker=user_profile) & Q(archivedByWorker=False))
                )) |
                (Q(conversation_type='TEAM_GROUP') & ~Q(conversationID__in=archived_team_ids))
            )
            
            # Additional filter for unread only
            if filter == "unread":
                unread_team_ids = ConversationParticipant.objects.filter(
                    profile=user_profile,
                    unread_count__gt=0
                ).values_list('conversation_id', flat=True)
                
                conversations_query = conversations_query.filter(
                    (Q(conversation_type='ONE_ON_ONE') & (
                        (Q(client=user_profile) & Q(unreadCountClient__gt=0)) |
                        (Q(worker=user_profile) & Q(unreadCountWorker__gt=0))
                    )) |
                    (Q(conversation_type='TEAM_GROUP') & Q(conversationID__in=unread_team_ids))
                )
        
        conversations = conversations_query.order_by('-updatedAt')
        
        print(f"📊 After filters: {conversations.count()} conversations")
        
        result = []
        for conv in conversations:
            # Handle team group conversations differently
            if conv.conversation_type == 'TEAM_GROUP':
                job = conv.relatedJobPosting
                
                # Get participant info for this user
                participant = ConversationParticipant.objects.filter(
                    conversation=conv,
                    profile=user_profile
                ).first()
                
                # Get all participants for team info
                all_participants = ConversationParticipant.objects.filter(
                    conversation=conv
                ).select_related('profile', 'skill_slot__specializationID')
                
                team_members = []
                for p in all_participants:
                    if p.profile != user_profile:  # Exclude self
                        team_members.append({
                            'profile_id': p.profile.profileID,
                            'name': f"{p.profile.firstName} {p.profile.lastName}",
                            'avatar': p.profile.profileImg or None,  # profileImg is a CharField (URL string), not FileField
                            'role': p.participant_type,
                            'skill': p.skill_slot.specializationID.specializationName if p.skill_slot else None
                        })
                
                unread_count = participant.unread_count if participant else 0
                is_archived = participant.is_archived if participant else False
                
                result.append({
                    "id": conv.conversationID,
                    "conversation_type": "TEAM_GROUP",
                    "job": {
                        "id": job.jobID,
                        "title": job.title,
                        "status": job.status,
                        "budget": float(job.budget),
                        "location": job.location,
                        "is_team_job": job.is_team_job,
                        "total_workers": job.total_workers_assigned if job.is_team_job else 1
                    },
                    "team_members": team_members,
                    "my_role": participant.participant_type if participant else "WORKER",
                    "my_skill": participant.skill_slot.specializationID.specializationName if participant and participant.skill_slot else None,
                    "last_message": conv.lastMessageText,
                    "last_message_time": conv.lastMessageTime.isoformat() if conv.lastMessageTime else None,
                    "unread_count": unread_count,
                    "is_archived": is_archived,
                    "status": conv.status,
                    "created_at": conv.createdAt.isoformat()
                })
                continue
            
            # Handle 1:1 conversations (existing logic)
            # Determine the other participant (if user is client, show worker/agency; if worker, show client)
            is_client = conv.client == user_profile
            
            # Handle agency conversations - other party might be agency instead of worker
            if is_client:
                other_participant = conv.worker  # Could be None for agency jobs
                other_agency = conv.agency  # Check if this is an agency conversation
            else:
                other_participant = conv.client
                other_agency = None
            
            worker_info = conv.worker.accountFK.email if conv.worker else (conv.agency.businessName if conv.agency else "N/A")
            print(f"  📨 Conv {conv.conversationID}: Client={conv.client.accountFK.email}, Worker/Agency={worker_info}, Job={conv.relatedJobPosting.title}")
            
            # Get job info
            job = conv.relatedJobPosting
            
            # Count unread messages
            unread_count = conv.unreadCountClient if is_client else conv.unreadCountWorker
            
            # Check if archived by current user
            is_archived = conv.archivedByClient if is_client else conv.archivedByWorker
            
            # Check review status for this job
            from accounts.models import JobReview
            # Worker account can be from assignedWorkerID or assignedAgencyFK
            worker_account = None
            if job.assignedWorkerID:
                worker_account = job.assignedWorkerID.profileID.accountFK
            elif job.assignedAgencyFK:
                worker_account = job.assignedAgencyFK.accountFK
            client_account = job.clientID.profileID.accountFK
            
            worker_reviewed = False
            client_reviewed = False
            
            # Check if this is an agency job
            is_agency_job = job.assignedEmployeeID is not None
            
            if worker_account and client_account:
                worker_reviewed = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=worker_account
                ).exists()
                
                if is_agency_job:
                    # For agency jobs, client must have reviewed BOTH employee AND agency
                    employee_review_exists = JobReview.objects.filter(
                        jobID=job,
                        reviewerID=client_account,
                        revieweeEmployeeID__isnull=False
                    ).exists()
                    
                    agency_review_exists = JobReview.objects.filter(
                        jobID=job,
                        reviewerID=client_account,
                        revieweeAgencyID__isnull=False
                    ).exists()
                    
                    client_reviewed = employee_review_exists and agency_review_exists
                else:
                    client_reviewed = JobReview.objects.filter(
                        jobID=job,
                        reviewerID=client_account
                    ).exists()
            
            result.append({
                "id": conv.conversationID,
                "conversation_type": "ONE_ON_ONE",
                "job": {
                    "id": job.jobID,
                    "title": job.title,
                    "status": job.status,
                    "budget": float(job.budget),
                    "location": job.location,
                    "workerMarkedComplete": job.workerMarkedComplete,
                    "clientMarkedComplete": job.clientMarkedComplete,
                    "workerReviewed": worker_reviewed,
                    "clientReviewed": client_reviewed,
                    "remainingPaymentPaid": job.remainingPaymentPaid,
                    "is_team_job": job.is_team_job
                },
                "other_participant": get_participant_info(profile=other_participant, agency=other_agency, job_title=job.title, job=job),
                "my_role": "CLIENT" if is_client else "WORKER",
                "last_message": conv.lastMessageText,
                "last_message_time": conv.lastMessageTime.isoformat() if conv.lastMessageTime else None,
                "unread_count": unread_count,
                "is_archived": is_archived,
                "status": conv.status,
                "created_at": conv.createdAt.isoformat()
            })
        
        print(f"✅ Returning {len(result)} conversations")
        print(f"🔍 === END DEBUG ===\n")
        
        return {
            "success": True,
            "conversations": result,
            "total": len(result)
        }
        
    except Exception as e:
        print(f"❌ Error fetching conversations: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch conversations: {str(e)}"},
            status=500
        )


@router.get("/chat/conversation-by-job/{job_id}", auth=dual_auth)
def get_conversation_by_job(request, job_id: int, reopen: bool = False):
    """
    Get the conversation for a specific job.
    Returns the conversation ID if found, or creates one if the user is a participant.
    
    Query params:
    - reopen: If True and conversation exists but is closed/completed, reopen it (for backjobs)
    """
    try:
        from accounts.models import Job
        
        # Get user's profile
        try:
            user_profile = _get_user_profile(request)
        except Profile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=400)
        
        # Get the job
        try:
            job = Job.objects.select_related(
                'clientID__profileID',
                'assignedWorkerID__profileID',
                'assignedAgencyFK'
            ).get(jobID=job_id)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=404)
        
        # Check if user is a participant of this job
        is_client = job.clientID and job.clientID.profileID == user_profile
        is_worker = job.assignedWorkerID and job.assignedWorkerID.profileID == user_profile
        is_agency_owner = job.assignedAgencyFK and job.assignedAgencyFK.accountFK == request.auth
        
        if not (is_client or is_worker or is_agency_owner):
            return Response({"error": "You are not a participant of this job"}, status=403)
        
        # Try to find existing conversation
        conversation = Conversation.objects.filter(relatedJobPosting=job).first()
        
        # Check if there's an active backjob/dispute for this job
        from accounts.models import JobDispute
        active_dispute = JobDispute.objects.filter(
            jobID=job,
            status__in=['OPEN', 'UNDER_REVIEW']
        ).first()
        
        backjob_info = None
        if active_dispute:
            backjob_info = {
                "has_backjob": True,
                "dispute_id": active_dispute.disputeID,
                "status": active_dispute.status,
                "reason": active_dispute.reason,
                "priority": active_dispute.priority,
                # Backjob workflow tracking fields
                "backjob_started": active_dispute.backjobStarted,
                "backjob_started_at": active_dispute.backjobStartedAt.isoformat() if active_dispute.backjobStartedAt else None,
                "worker_marked_complete": active_dispute.workerMarkedBackjobComplete,
                "worker_marked_complete_at": active_dispute.workerMarkedBackjobCompleteAt.isoformat() if active_dispute.workerMarkedBackjobCompleteAt else None,
                "client_confirmed_complete": active_dispute.clientConfirmedBackjob,
                "client_confirmed_complete_at": active_dispute.clientConfirmedBackjobAt.isoformat() if active_dispute.clientConfirmedBackjobAt else None,
            }
            print(f"   🔄 Backjob info: {backjob_info}")
        
        if conversation:
            reopened = False
            system_message_added = False
            
            # If reopen is requested and conversation is not active, check if we should reopen
            # Only reopen if there's an APPROVED backjob (UNDER_REVIEW status)
            # OPEN status means waiting for admin approval - don't reopen yet
            should_reopen = (
                reopen and 
                conversation.status != Conversation.ConversationStatus.ACTIVE and
                active_dispute and 
                active_dispute.status == 'UNDER_REVIEW'  # Only if admin approved
            )
            
            if should_reopen:
                old_status = conversation.status
                conversation.status = Conversation.ConversationStatus.ACTIVE
                conversation.save()
                reopened = True
                print(f"[get_conversation_by_job] Reopened conversation {conversation.conversationID} (was {old_status}) - backjob approved")
                
                # Add system message only on first reopen for APPROVED backjob
                # Check if there's already a "Backjob" related message
                existing_reopen_msg = Message.objects.filter(
                    conversationID=conversation,
                    messageType="SYSTEM",
                    messageText__icontains="backjob"
                ).exists()
                
                if not existing_reopen_msg:
                    # First time reopening for approved backjob - add system message
                    Message.objects.create(
                        conversationID=conversation,
                        sender=None,
                        senderAgency=None,
                        messageText="💬 Conversation reopened for backjob discussion. Please coordinate the backjob work here.",
                        messageType="SYSTEM"
                    )
                    system_message_added = True
                    print(f"[get_conversation_by_job] Added backjob system message to conversation {conversation.conversationID}")
            
            return {
                "success": True,
                "conversation_id": conversation.conversationID,
                "exists": True,
                "reopened": reopened,
                "system_message_added": system_message_added,
                "backjob": backjob_info
            }
        
        # If no conversation exists and user is a valid participant, create one
        client_profile = job.clientID.profileID if job.clientID else None
        worker_profile = job.assignedWorkerID.profileID if job.assignedWorkerID else None
        agency = job.assignedAgencyFK
        
        if not client_profile:
            return Response({"error": "Job has no client"}, status=400)
        
        if not worker_profile and not agency:
            return Response({"error": "Job has no assigned worker or agency"}, status=400)
        
        conversation = Conversation.objects.create(
            client=client_profile,
            worker=worker_profile,
            agency=agency,
            relatedJobPosting=job,
            status=ConversationStatus.ACTIVE
        )
        
        print(f"[get_conversation_by_job] Created new conversation {conversation.conversationID} for job {job_id}")
        
        return {
            "success": True,
            "conversation_id": conversation.conversationID,
            "exists": False,
            "created": True
        }
        
    except Exception as e:
        print(f"[get_conversation_by_job] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)


@router.get("/chat/conversations/{conversation_id}", auth=dual_auth)
def get_conversation_messages(request, conversation_id: int):
    """
    Get all messages in a specific job conversation.
    Also marks messages as read.
    Supports both regular (client-worker) and agency (client-agency) conversations.
    """
    try:
        # Get user's profile
        try:
            user_profile = _get_user_profile(request)
            print(f"\n🔍 [GET MESSAGES] User profile resolved:")
            print(f"   Profile ID: {user_profile.profileID}")
            print(f"   Profile Type: {user_profile.profileType}")
            print(f"   Account: {user_profile.accountFK.email}")
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get the conversation
        try:
            conversation = Conversation.objects.select_related(
                'client__accountFK',
                'worker__accountFK',
                'relatedJobPosting',
                'agency'
            ).get(conversationID=conversation_id)
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found"},
                status=404
            )
        
        # Check if this is an agency conversation
        is_agency_conversation = conversation.agency is not None and conversation.worker is None
        
        # Verify user is a participant (either client, worker, team participant, or agency owner)
        is_client = conversation.client == user_profile
        is_worker = conversation.worker == user_profile if conversation.worker else False

        # Team conversations use ConversationParticipant entries instead of the single worker field
        from profiles.models import ConversationParticipant
        is_team_participant = ConversationParticipant.objects.filter(
            conversation=conversation,
            profile=user_profile
        ).exists()
        # Treat team participant as worker-equivalent for permissioning and role calculation
        is_worker = is_worker or is_team_participant
        
        # For agency conversations, check if user is the agency owner
        is_agency_owner = False
        if is_agency_conversation and conversation.agency:
            is_agency_owner = conversation.agency.accountFK == request.auth
        
        print(f"   Conversation ID: {conversation.conversationID}")
        print(f"   Client Profile ID: {conversation.client.profileID}")
        print(f"   Is Agency Conversation: {is_agency_conversation}")
        if conversation.worker:
            print(f"   Worker Profile ID: {conversation.worker.profileID}")
        if conversation.agency:
            print(f"   Agency: {conversation.agency.businessName}")
        print(f"   Is Client: {is_client}, Is Worker: {is_worker}, Is Agency Owner: {is_agency_owner}")
        print(f"   Is Team Participant: {is_team_participant}")
        
        if not (is_client or is_worker or is_agency_owner or is_team_participant):
            return Response(
                {"error": "You are not a participant in this conversation"},
                status=403
            )
        
        # Determine the other participant
        if is_agency_conversation:
            # For agency conversations
            other_participant = conversation.client if is_agency_owner else None
            other_agency = conversation.agency if is_client else None
        else:
            # For regular worker conversations
            other_participant = conversation.worker if is_client else conversation.client
            other_agency = None
        
        # Get job info
        job = conversation.relatedJobPosting
        
        # Get all messages with attachments
        messages = Message.objects.filter(
            conversationID=conversation
        ).select_related('sender__accountFK').prefetch_related('attachments').order_by('createdAt')
        
        # Mark unread messages as read and reset unread count
        # For agency conversations, mark all messages not from current user as read
        if other_participant:
            Message.objects.filter(
                conversationID=conversation,
                sender=other_participant,
                isRead=False
            ).update(isRead=True, readAt=timezone.now())
        else:
            # For agency-side view, mark messages from client as read
            Message.objects.filter(
                conversationID=conversation,
                isRead=False
            ).exclude(sender=user_profile).update(isRead=True, readAt=timezone.now())
        
        # Reset unread count for this user
        if is_client:
            conversation.unreadCountClient = 0
        else:
            # Both worker and agency use unreadCountWorker
            conversation.unreadCountWorker = 0
        conversation.save(update_fields=['unreadCountClient' if is_client else 'unreadCountWorker'])
        
        # Build base URL for media files from request
        # This ensures URLs work from any client (web on localhost, mobile on IP)
        scheme = request.scheme if hasattr(request, 'scheme') else 'http'
        host = request.get_host() if hasattr(request, 'get_host') else 'localhost:8000'
        base_url = f"{scheme}://{host}"
        
        def make_absolute_url(url):
            """Convert relative URL to absolute if needed"""
            if url and url.startswith('/'):
                return f"{base_url}{url}"
            return url
        
        # Format messages
        formatted_messages = []
        for msg in messages:
            # Handle system messages (both sender and senderAgency are None)
            if msg.sender is None and msg.senderAgency is None:
                # This is a system message
                is_mine = False
                sender_name = "System"
                sender_avatar = None
                print(f"   System message: {msg.messageText[:50]}...")
            elif msg.sender is None:
                # This is an agency message
                is_mine = is_agency_owner  # Mine if I'm the agency owner
                sender_name = conversation.agency.businessName if conversation.agency else "Agency"
                sender_avatar = "/agency-default.jpg"  # Agency model doesn't have avatar/logo field
                print(f"   Message from Agency: is_mine={is_mine}")
            else:
                # Regular message from a Profile
                is_mine = msg.sender == user_profile
                sender_name = f"{msg.sender.firstName} {msg.sender.lastName}"
                sender_avatar = msg.sender.profileImg or "/worker1.jpg"
                print(f"   Message from Profile {msg.sender.profileID}: is_mine={is_mine} (comparing with {user_profile.profileID})")
            
            # Get attachments for this message
            attachments = []
            for attachment in msg.attachments.all():
                attachments.append({
                    "attachment_id": attachment.attachmentID,
                    "file_url": make_absolute_url(attachment.fileURL),
                    "file_name": attachment.fileName,
                    "file_size": attachment.fileSize,
                    "file_type": attachment.fileType,
                    "uploaded_at": attachment.uploadedAt.isoformat()
                })
            
            message_data = {
                "sender_name": sender_name,
                "sender_avatar": sender_avatar,
                "message_text": msg.messageText,
                "message_type": msg.messageType,
                "is_read": msg.isRead,
                "created_at": msg.createdAt.isoformat(),
                "is_mine": is_mine
            }
            
            # Add attachments if present
            if attachments:
                message_data["attachments"] = attachments
            
            formatted_messages.append(message_data)
        
        # Check review status for this job
        from accounts.models import JobReview
        worker_account = job.assignedWorkerID.profileID.accountFK if job.assignedWorkerID else None
        client_account = job.clientID.profileID.accountFK
        
        worker_reviewed = False
        client_reviewed = False
        
        # Check if this is an agency job (for review logic) - use is_agency_conversation
        is_agency_job_for_reviews = is_agency_conversation
        employee_review_exists = False
        agency_review_exists = False
        employees_pending_review = []  # For multi-employee support
        
        # For agency jobs, check employee and agency reviews separately
        if is_agency_job_for_reviews and client_account:
            from accounts.models import JobEmployeeAssignment
            
            # Get all assigned employees (multi-employee support)
            assigned_employees = JobEmployeeAssignment.objects.filter(
                job=job,
                status__in=['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']
            ).select_related('employee')
            
            # Get all employee IDs that have been reviewed
            reviewed_employee_ids = set(JobReview.objects.filter(
                jobID=job,
                reviewerID=client_account,
                revieweeEmployeeID__isnull=False
            ).values_list('revieweeEmployeeID', flat=True))
            
            # Check if ALL employees have been reviewed
            all_assigned_ids = set(a.employee_id for a in assigned_employees)
            
            # Backward compatibility: if no M2M assignments, check legacy field
            if not all_assigned_ids and job.assignedEmployeeID:
                all_assigned_ids = {job.assignedEmployeeID.employeeID}
            
            employee_review_exists = all_assigned_ids.issubset(reviewed_employee_ids) if all_assigned_ids else False
            
            # Build list of employees still pending review
            pending_ids = all_assigned_ids - reviewed_employee_ids
            if pending_ids:
                from agency.models import AgencyEmployee
                pending_emps = AgencyEmployee.objects.filter(employeeID__in=pending_ids)
                employees_pending_review = [
                    {"employee_id": emp.employeeID, "name": emp.name, "avatar": emp.avatar}
                    for emp in pending_emps
                ]
            
            agency_review_exists = JobReview.objects.filter(
                jobID=job,
                reviewerID=client_account,
                revieweeAgencyID__isnull=False
            ).exists()
            
            client_reviewed = employee_review_exists and agency_review_exists
            
            # For agency jobs, worker_reviewed is tracked separately (agency reviews client)
            # Get the agency account for checking if agency reviewed the client
            if job.assignedEmployeeID and job.assignedEmployeeID.agency:
                agency_account = job.assignedEmployeeID.agency
                worker_reviewed = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=agency_account
                ).exists()
        elif worker_account and client_account:
            # Regular (non-agency) job
            worker_reviewed = JobReview.objects.filter(
                jobID=job,
                reviewerID=worker_account
            ).exists()
            
            client_reviewed = JobReview.objects.filter(
                jobID=job,
                reviewerID=client_account
            ).exists()
        
        # Build other_participant_info - handle agency case
        if other_participant:
            other_participant_info = get_participant_info(other_participant, job.title)
        elif other_agency:
            # Client viewing agency conversation - show agency info
            other_participant_info = {
                "id": other_agency.agencyId,
                "name": other_agency.businessName,
                "avatar": "/agency-default.jpg",  # Agency model doesn't have avatar/logo field
                "role": "AGENCY",
                "account_id": other_agency.accountFK.accountID if other_agency.accountFK else None,
            }
        else:
            other_participant_info = None
        
        # Determine my_role
        if is_client:
            my_role = "CLIENT"
        elif is_agency_owner:
            my_role = "AGENCY"
        else:
            my_role = "WORKER"
        
        # Get assigned employee info for agency jobs (legacy single employee)
        assigned_employee_info = None
        if is_agency_conversation and job.assignedEmployeeID:
            emp = job.assignedEmployeeID
            assigned_employee_info = {
                "id": emp.employeeID,
                "name": emp.name,
                "avatar": emp.avatar or "/worker-default.jpg",
                "rating": float(emp.rating) if emp.rating else None,
            }
        
        # Get ALL assigned employees for multi-employee jobs
        assigned_employees_list = []
        if is_agency_conversation:
            from accounts.models import JobEmployeeAssignment
            assignments = JobEmployeeAssignment.objects.filter(
                job=job,
                status__in=['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']
            ).select_related('employee').order_by('-isPrimaryContact', 'assignedAt')
            
            for assignment in assignments:
                emp = assignment.employee
                assigned_employees_list.append({
                    "id": emp.employeeID,
                    "name": emp.name,
                    "avatar": emp.avatar or "/worker-default.jpg",
                    "rating": float(emp.rating) if emp.rating else None,
                    "isPrimaryContact": assignment.isPrimaryContact,
                    "status": assignment.status,
                })
            
            # Fallback to legacy if no M2M assignments
            if not assigned_employees_list and job.assignedEmployeeID:
                emp = job.assignedEmployeeID
                assigned_employees_list.append({
                    "id": emp.employeeID,
                    "name": emp.name,
                    "avatar": emp.avatar or "/worker-default.jpg",
                    "rating": float(emp.rating) if emp.rating else None,
                    "isPrimaryContact": True,
                    "status": "ASSIGNED",
                })
        
        # Get ML prediction for estimated completion time
        ml_prediction = None
        try:
            from ml.prediction_service import predict_for_job_instance
            prediction = predict_for_job_instance(job)
            if prediction and prediction.get('predicted_hours') is not None:
                ml_prediction = {
                    'predicted_hours': prediction.get('predicted_hours'),
                    'confidence_interval_lower': prediction.get('confidence_interval', (None, None))[0],
                    'confidence_interval_upper': prediction.get('confidence_interval', (None, None))[1],
                    'confidence_level': prediction.get('confidence_level', 0.0),
                    'formatted_duration': prediction.get('formatted_duration', 'Unknown'),
                    'source': prediction.get('source', 'fallback'),
                    'is_low_confidence': prediction.get('confidence_level', 0.0) < 0.5,
                }
        except Exception as e:
            print(f"   ⚠️ ML prediction error: {str(e)}")

        # Team job worker review tracking
        is_team_job = job.is_team_job
        team_workers_pending_review = []
        all_team_workers_reviewed = False
        team_worker_assignments = []
        
        if is_team_job and is_client:
            from accounts.models import JobWorkerAssignment, JobReview
            
            # Get all assigned workers for this team job
            assignments = JobWorkerAssignment.objects.filter(
                jobID=job,
                assignment_status__in=['ACTIVE', 'COMPLETED']
            ).select_related('workerID__profileID__accountFK', 'skillSlotID__specializationID')
            
            # Get list of worker accounts already reviewed by this client
            reviewed_worker_accounts = set(JobReview.objects.filter(
                jobID=job,
                reviewerID=request.auth,
                reviewerType="CLIENT"
            ).values_list('revieweeID', flat=True))
            
            for assignment in assignments:
                worker_profile = assignment.workerID.profileID
                worker_account_id = worker_profile.accountFK.accountID
                worker_name = f"{worker_profile.firstName} {worker_profile.lastName}"
                skill_name = assignment.skillSlotID.specializationID.specializationName if assignment.skillSlotID else None
                
                worker_info = {
                    # Use FK raw id to avoid attribute errors (WorkerProfile has no workerID attr)
                    "worker_id": assignment.workerID_id,
                    "account_id": worker_account_id,
                    "name": worker_name,
                    "avatar": worker_profile.profileImg,
                    "skill": skill_name,
                    "assignment_id": assignment.assignmentID,
                    "is_reviewed": worker_account_id in reviewed_worker_accounts,
                    # Arrival tracking (matches regular job workflow)
                    "client_confirmed_arrival": assignment.client_confirmed_arrival,
                    "client_confirmed_arrival_at": assignment.client_confirmed_arrival_at.isoformat() if assignment.client_confirmed_arrival_at else None,
                    # Completion tracking
                    "worker_marked_complete": assignment.worker_marked_complete,
                    "worker_marked_complete_at": assignment.worker_marked_complete_at.isoformat() if assignment.worker_marked_complete_at else None
                }
                team_worker_assignments.append(worker_info)
                
                if worker_account_id not in reviewed_worker_accounts:
                    team_workers_pending_review.append(worker_info)
            
            all_team_workers_reviewed = len(team_workers_pending_review) == 0 and len(team_worker_assignments) > 0
        
        # Check for active backjob/dispute
        from accounts.models import JobDispute
        active_dispute = JobDispute.objects.filter(
            jobID=job,
            status__in=['OPEN', 'UNDER_REVIEW']
        ).first()
        
        backjob_info = None
        if active_dispute:
            backjob_info = {
                "has_backjob": True,
                "dispute_id": active_dispute.disputeID,
                "status": active_dispute.status,
                "reason": active_dispute.reason,
                "priority": active_dispute.priority,
                "description": active_dispute.description,
                # Backjob workflow tracking fields
                "backjob_started": active_dispute.backjobStarted,
                "backjob_started_at": active_dispute.backjobStartedAt.isoformat() if active_dispute.backjobStartedAt else None,
                "worker_marked_complete": active_dispute.workerMarkedBackjobComplete,
                "worker_marked_complete_at": active_dispute.workerMarkedBackjobCompleteAt.isoformat() if active_dispute.workerMarkedBackjobCompleteAt else None,
                "client_confirmed_complete": active_dispute.clientConfirmedBackjob,
                "client_confirmed_complete_at": active_dispute.clientConfirmedBackjobAt.isoformat() if active_dispute.clientConfirmedBackjobAt else None,
            }
            print(f"   🔄 Backjob info: started={active_dispute.backjobStarted}, worker_done={active_dispute.workerMarkedBackjobComplete}, client_confirmed={active_dispute.clientConfirmedBackjob}")

        # Get payment buffer info for completed jobs
        payment_buffer_info = None
        if job.status == 'COMPLETED' and job.clientMarkedComplete:
            from jobs.payment_buffer_service import get_payment_buffer_days
            buffer_days = get_payment_buffer_days()
            
            # Calculate remaining days if release date is set
            remaining_days = None
            if job.paymentReleaseDate:
                remaining = (job.paymentReleaseDate - timezone.now()).days
                remaining_days = max(0, remaining)  # Don't show negative days
            
            payment_buffer_info = {
                "buffer_days": buffer_days,
                "payment_release_date": job.paymentReleaseDate.isoformat() if job.paymentReleaseDate else None,
                "payment_release_date_formatted": job.paymentReleaseDate.strftime("%b %d, %Y") if job.paymentReleaseDate else None,
                "is_payment_released": job.paymentReleasedToWorker,
                "payment_released_at": job.paymentReleasedAt.isoformat() if job.paymentReleasedAt else None,
                "payment_held_reason": job.paymentHeldReason,
                "remaining_days": remaining_days,
            }

        return {
            "success": True,
            "conversation_id": conversation.conversationID,
            "job": {
                "id": job.jobID,
                "title": job.title,
                "status": job.status,
                "budget": float(job.budget),
                "location": job.location,
                "clientConfirmedWorkStarted": job.clientConfirmedWorkStarted,
                "workerMarkedComplete": job.workerMarkedComplete,
                "clientMarkedComplete": job.clientMarkedComplete,
                "workerReviewed": worker_reviewed,
                "clientReviewed": client_reviewed,
                "employeeReviewed": employee_review_exists if is_agency_job_for_reviews else None,
                "agencyReviewed": agency_review_exists if is_agency_job_for_reviews else None,
                "employeesPendingReview": employees_pending_review if is_agency_job_for_reviews else [],
                "assignedWorkerId": worker_account.accountID if worker_account else None,
                "clientId": client_account.accountID if client_account else None,
                "estimatedCompletion": ml_prediction,
                "paymentBuffer": payment_buffer_info,
            },
            "other_participant": other_participant_info,
            "assigned_employee": assigned_employee_info,  # Legacy single employee
            "assigned_employees": assigned_employees_list,  # NEW: All assigned employees
            # Multi-employee review tracking (for frontend convenience)
            "pending_employee_reviews": [e["employee_id"] for e in employees_pending_review] if is_agency_job_for_reviews else [],
            "all_employees_reviewed": employee_review_exists if is_agency_job_for_reviews else None,
            "is_agency_job": is_agency_conversation,
            "is_team_job": is_team_job,
            "team_worker_assignments": team_worker_assignments if is_team_job else [],
            "pending_team_worker_reviews": team_workers_pending_review if is_team_job else [],
            "all_team_workers_reviewed": all_team_workers_reviewed if is_team_job else None,
            "my_role": my_role,
            "messages": formatted_messages,
            "total_messages": len(formatted_messages),
            "backjob": backjob_info
        }
        
    except Exception as e:
        print(f"❌ Error fetching conversation messages: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch messages: {str(e)}"},
            status=500
        )


@router.post("/chat/messages", auth=dual_auth)
def send_message(request, data: SendMessageSchema):
    """
    Send a new message within an existing job conversation.
    Conversations are created when job applications are accepted.
    """
    try:
        # Get sender's profile
        try:
            sender_profile = _get_user_profile(request)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get the conversation
        try:
            conversation = Conversation.objects.select_related(
                'client',
                'worker',
                'relatedJobPosting'
            ).get(conversationID=data.conversation_id)
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found"},
                status=404
            )
        
        # Verify sender is a participant
        # For regular conversations, check client/worker fields
        is_client = conversation.client == sender_profile
        is_worker = conversation.worker == sender_profile
        
        # For team conversations, also check ConversationParticipant table
        is_team_participant = False
        if conversation.conversation_type == 'TEAM_GROUP':
            from profiles.models import ConversationParticipant
            is_team_participant = ConversationParticipant.objects.filter(
                conversation=conversation,
                profile=sender_profile
            ).exists()
        
        if not (is_client or is_worker or is_team_participant):
            return Response(
                {"error": "You are not a participant in this conversation"},
                status=403
            )
        
        # Create the message
        message = Message.objects.create(
            conversationID=conversation,
            sender=sender_profile,
            messageText=data.message_text,
            messageType=data.message_type or "TEXT"
        )
        
        return {
            "success": True,
            "message": {
                "conversation_id": conversation.conversationID,
                "sender_name": f"{sender_profile.firstName} {sender_profile.lastName}",
                "message_text": message.messageText,
                "message_type": message.messageType,
                "created_at": message.createdAt.isoformat(),
                "is_mine": True
            }
        }
        
    except Exception as e:
        print(f"❌ Error sending message: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to send message: {str(e)}"},
            status=500
        )


@router.post("/chat/messages/mark-read", auth=dual_auth)
def mark_messages_as_read(request, data: MarkAsReadSchema):
    """
    Mark messages in a job conversation as read.
    """
    try:
        # Get user's profile
        try:
            user_profile = _get_user_profile(request)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get the conversation
        try:
            conversation = Conversation.objects.get(conversationID=data.conversation_id)
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found"},
                status=404
            )
        
        # Verify user is a participant
        is_client = conversation.client == user_profile
        is_worker = conversation.worker == user_profile
        
        if not (is_client or is_worker):
            return Response(
                {"error": "You are not a participant in this conversation"},
                status=403
            )
        
        # Determine the other participant
        other_participant = conversation.worker if is_client else conversation.client
        
        # Mark messages as read
        query = Message.objects.filter(
            conversationID=conversation,
            sender=other_participant,
            isRead=False
        )
        
        if data.message_id:
            # Mark up to specific message
            query = query.filter(messageID__lte=data.message_id)
        
        updated_count = query.update(isRead=True, readAt=timezone.now())
        
        # Reset unread count
        if is_client:
            conversation.unreadCountClient = 0
        else:
            conversation.unreadCountWorker = 0
        conversation.save(update_fields=['unreadCountClient' if is_client else 'unreadCountWorker'])
        
        return {
            "success": True,
            "marked_count": updated_count
        }
        
    except Exception as e:
        print(f"❌ Error marking messages as read: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to mark messages as read: {str(e)}"},
            status=500
        )


@router.get("/chat/unread-count", auth=dual_auth)
def get_unread_count(request):
    """
    Get total unread message count for the current user across all job conversations.
    """
    try:
        # Get user's profile
        try:
            user_profile = _get_user_profile(request)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get all conversations where user is either client or worker
        conversations = Conversation.objects.filter(
            Q(client=user_profile) | Q(worker=user_profile)
        )
        
        total_unread = 0
        for conv in conversations:
            # Add unread count based on user's role
            if conv.client == user_profile:
                total_unread += conv.unreadCountClient
            else:
                total_unread += conv.unreadCountWorker
        
        return {
            "success": True,
            "unread_count": total_unread
        }
        
    except Exception as e:
        print(f"❌ Error getting unread count: {str(e)}")
        return Response(
            {"error": f"Failed to get unread count: {str(e)}"},
            status=500
        )


@router.post("/chat/conversations/{conversation_id}/toggle-archive", auth=dual_auth)
def toggle_conversation_archive(request, conversation_id: int):
    """
    Toggle archive status for a conversation for the current user.
    Each user can archive/unarchive independently.
    """
    try:
        # Get user's profile
        try:
            user_profile = _get_user_profile(request)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get the conversation
        try:
            conversation = Conversation.objects.get(conversationID=conversation_id)
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found"},
                status=404
            )
        
        # Verify user is a participant
        is_client = conversation.client == user_profile
        is_worker = conversation.worker == user_profile
        
        if not (is_client or is_worker):
            return Response(
                {"error": "You are not a participant in this conversation"},
                status=403
            )
        
        # Toggle archive status based on user role
        if is_client:
            conversation.archivedByClient = not conversation.archivedByClient
            is_archived = conversation.archivedByClient
            conversation.save(update_fields=['archivedByClient'])
        else:
            conversation.archivedByWorker = not conversation.archivedByWorker
            is_archived = conversation.archivedByWorker
            conversation.save(update_fields=['archivedByWorker'])
        
        return {
            "success": True,
            "is_archived": is_archived,
            "conversation_id": conversation_id,
            "message": "Conversation archived" if is_archived else "Conversation unarchived"
        }

    except Exception as e:
        print(f"❌ Error toggling archive status: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to toggle archive status: {str(e)}"},
            status=500
        )


@router.post("/chat/{conversation_id}/upload-image", auth=dual_auth)
def upload_chat_image(request, conversation_id: int, image: UploadedFile = File(...)):
    """
    Upload an image to a chat conversation.
    Creates a new IMAGE type message with the uploaded image URL.
    
    Supports both Supabase (cloud) and local storage (offline/defense mode).

    Args:
        conversation_id: ID of the conversation
        image: Image file (JPEG, PNG, JPG, max 5MB)

    Returns:
        message_id: int
        image_url: string (public URL)
        uploaded_at: datetime
    """
    try:
        from django.conf import settings
        import os

        # Get sender's profile
        try:
            sender_profile = _get_user_profile(request)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=400
            )

        # Get the conversation
        try:
            conversation = Conversation.objects.select_related(
                'client',
                'worker'
            ).get(conversationID=conversation_id)
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found"},
                status=404
            )

        # Verify sender is a participant
        is_client = conversation.client == sender_profile
        is_worker = conversation.worker == sender_profile

        if not (is_client or is_worker):
            return Response(
                {"error": "You are not a participant in this conversation"},
                status=403
            )

        # Validate file size (5MB max)
        if image.size > 5 * 1024 * 1024:
            return Response(
                {"error": "Image size must be less than 5MB"},
                status=400
            )

        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if image.content_type not in allowed_types:
            return Response(
                {"error": "Invalid file type. Allowed: JPEG, PNG, JPG, WEBP"},
                status=400
            )

        # Check if storage is configured
        if not settings.STORAGE:
            return Response(
                {"error": "File storage not configured"},
                status=500
            )

        # Generate unique filename
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        file_extension = os.path.splitext(image.name)[1]
        filename = f"message_{timestamp}_{sender_profile.profileID}{file_extension}"

        # Upload to storage (Supabase or local depending on settings)
        # Path: chat/conversation_{id}/images/{filename}
        storage_path = f"chat/conversation_{conversation_id}/images/{filename}"

        try:
            # Read file content
            file_content = image.read()

            # Upload using unified STORAGE adapter
            upload_response = settings.STORAGE.storage().from_('iayos_files').upload(
                storage_path,
                file_content,
                {"upsert": "true"}
            )
            
            # Check for upload error
            if isinstance(upload_response, dict) and 'error' in upload_response:
                raise Exception(f"Upload failed: {upload_response['error']}")

            # Get public URL
            public_url = settings.STORAGE.storage().from_('iayos_files').get_public_url(storage_path)

            # Create IMAGE type message
            message = Message.objects.create(
                conversationID=conversation,
                sender=sender_profile,
                messageText="",  # Empty text for image messages
                messageType="IMAGE"
            )

            # Create message attachment record
            MessageAttachment.objects.create(
                messageID=message,
                fileURL=public_url,
                fileType="IMAGE"
            )

            print(f"✅ Chat image uploaded: {public_url}")

            return {
                "success": True,
                "message_id": message.messageID,
                "image_url": public_url,
                "uploaded_at": message.createdAt.isoformat(),
                "conversation_id": conversation_id
            }

        except Exception as upload_error:
            print(f"❌ Supabase upload error: {str(upload_error)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Failed to upload image to storage: {str(upload_error)}"},
                status=500
            )

    except Exception as e:
        print(f"❌ Error uploading chat image: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to upload image: {str(e)}"},
            status=500
        )


#endregion

