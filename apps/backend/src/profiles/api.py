from ninja import Router, File
from ninja.files import UploadedFile
from ninja.responses import Response
from accounts.authentication import cookie_auth
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

#region CHAT ENDPOINTS

def get_participant_info(profile: Profile, job_title: str = None) -> dict:
    """Helper function to get participant information"""
    return {
        "profile_id": profile.profileID,
        "name": f"{profile.firstName} {profile.lastName}",
        "avatar": profile.profileImg or "/worker1.jpg",
        "profile_type": profile.profileType,
        "city": profile.accountFK.city if profile.accountFK else None,
        "job_title": job_title
    }


@router.get("/chat/conversations", auth=cookie_auth)
def get_conversations(request):
    """
    Get all job-based conversations for the current user's profile.
    Returns list of conversations tied to jobs where user is either client or worker.
    """
    try:
        # Get user's profile
        try:
            user_profile = Profile.objects.get(accountFK=request.auth)
        except Profile.DoesNotExist:
            return Response(
                {"error": "Profile not found"},
                status=400
            )
        
        # Get all conversations where user is either client or worker
        conversations = Conversation.objects.filter(
            Q(client=user_profile) | Q(worker=user_profile)
        ).select_related(
            'client__accountFK',
            'worker__accountFK',
            'relatedJobPosting',
            'lastMessageSender'
        ).order_by('-updatedAt')
        
        result = []
        for conv in conversations:
            # Determine the other participant (if user is client, show worker; if worker, show client)
            is_client = conv.client == user_profile
            other_participant = conv.worker if is_client else conv.client
            
            # Get job info
            job = conv.relatedJobPosting
            
            # Count unread messages
            unread_count = conv.unreadCountClient if is_client else conv.unreadCountWorker
            
            # Check review status for this job
            from accounts.models import JobReview
            worker_account = job.assignedWorkerID.profileID.accountFK if job.assignedWorkerID else None
            client_account = job.clientID.profileID.accountFK
            
            worker_reviewed = False
            client_reviewed = False
            
            if worker_account and client_account:
                worker_reviewed = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=worker_account
                ).exists()
                
                client_reviewed = JobReview.objects.filter(
                    jobID=job,
                    reviewerID=client_account
                ).exists()
            
            result.append({
                "id": conv.conversationID,
                "job": {
                    "id": job.jobID,
                    "title": job.title,
                    "status": job.status,
                    "budget": float(job.budget),
                    "location": job.location,
                    "workerMarkedComplete": job.workerMarkedComplete,
                    "clientMarkedComplete": job.clientMarkedComplete,
                    "workerReviewed": worker_reviewed,
                    "clientReviewed": client_reviewed
                },
                "other_participant": get_participant_info(other_participant, job.title),
                "my_role": "CLIENT" if is_client else "WORKER",
                "last_message": conv.lastMessageText,
                "last_message_time": conv.lastMessageTime.isoformat() if conv.lastMessageTime else None,
                "last_message_sender_id": conv.lastMessageSender.profileID if conv.lastMessageSender else None,
                "unread_count": unread_count,
                "status": conv.status,
                "created_at": conv.createdAt.isoformat()
            })
        
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


@router.get("/chat/conversations/{conversation_id}", auth=cookie_auth)
def get_conversation_messages(request, conversation_id: int):
    """
    Get all messages in a specific job conversation.
    Also marks messages as read.
    """
    try:
        # Get user's profile
        try:
            user_profile = Profile.objects.get(accountFK=request.auth)
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
                'relatedJobPosting'
            ).get(conversationID=conversation_id)
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found"},
                status=404
            )
        
        # Verify user is a participant (either client or worker)
        is_client = conversation.client == user_profile
        is_worker = conversation.worker == user_profile
        
        if not (is_client or is_worker):
            return Response(
                {"error": "You are not a participant in this conversation"},
                status=403
            )
        
        # Determine the other participant
        other_participant = conversation.worker if is_client else conversation.client
        
        # Get job info
        job = conversation.relatedJobPosting
        
        # Get all messages
        messages = Message.objects.filter(
            conversationID=conversation
        ).select_related('sender__accountFK').order_by('createdAt')
        
        # Mark unread messages as read and reset unread count
        Message.objects.filter(
            conversationID=conversation,
            sender=other_participant,
            isRead=False
        ).update(isRead=True, readAt=timezone.now())
        
        # Reset unread count for this user
        if is_client:
            conversation.unreadCountClient = 0
        else:
            conversation.unreadCountWorker = 0
        conversation.save(update_fields=['unreadCountClient' if is_client else 'unreadCountWorker'])
        
        # Format messages
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "id": msg.messageID,
                "sender_id": msg.sender.profileID,
                "sender_name": f"{msg.sender.firstName} {msg.sender.lastName}",
                "sender_avatar": msg.sender.profileImg or "/worker1.jpg",
                "message_text": msg.messageText,
                "message_type": msg.messageType,
                "is_read": msg.isRead,
                "created_at": msg.createdAt.isoformat(),
                "is_mine": msg.sender == user_profile
            })
        
        # Check review status for this job
        from accounts.models import JobReview
        worker_account = job.assignedWorkerID.profileID.accountFK if job.assignedWorkerID else None
        client_account = job.clientID.profileID.accountFK
        
        worker_reviewed = False
        client_reviewed = False
        
        if worker_account and client_account:
            worker_reviewed = JobReview.objects.filter(
                jobID=job,
                reviewerID=worker_account
            ).exists()
            
            client_reviewed = JobReview.objects.filter(
                jobID=job,
                reviewerID=client_account
            ).exists()
        
        return {
            "success": True,
            "conversation_id": conversation.conversationID,
            "job": {
                "id": job.jobID,
                "title": job.title,
                "status": job.status,
                "budget": float(job.budget),
                "location": job.location,
                "workerMarkedComplete": job.workerMarkedComplete,
                "clientMarkedComplete": job.clientMarkedComplete,
                "workerReviewed": worker_reviewed,
                "clientReviewed": client_reviewed
            },
            "other_participant": get_participant_info(other_participant, job.title),
            "my_role": "CLIENT" if is_client else "WORKER",
            "messages": formatted_messages,
            "total_messages": len(formatted_messages)
        }
        
    except Exception as e:
        print(f"❌ Error fetching conversation messages: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch messages: {str(e)}"},
            status=500
        )


@router.post("/chat/messages", auth=cookie_auth)
def send_message(request, data: SendMessageSchema):
    """
    Send a new message within an existing job conversation.
    Conversations are created when job applications are accepted.
    """
    try:
        # Get sender's profile
        try:
            sender_profile = Profile.objects.get(accountFK=request.auth)
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
        is_client = conversation.client == sender_profile
        is_worker = conversation.worker == sender_profile
        
        if not (is_client or is_worker):
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
                "id": message.messageID,
                "conversation_id": conversation.conversationID,
                "sender_id": sender_profile.profileID,
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


@router.post("/chat/messages/mark-read", auth=cookie_auth)
def mark_messages_as_read(request, data: MarkAsReadSchema):
    """
    Mark messages in a job conversation as read.
    """
    try:
        # Get user's profile
        try:
            user_profile = Profile.objects.get(accountFK=request.auth)
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


@router.get("/chat/unread-count", auth=cookie_auth)
def get_unread_count(request):
    """
    Get total unread message count for the current user across all job conversations.
    """
    try:
        # Get user's profile
        try:
            user_profile = Profile.objects.get(accountFK=request.auth)
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

#endregion
