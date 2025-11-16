from ninja import Router, Form, File
from ninja.files import UploadedFile
from .schemas import (
    createAccountSchema, logInSchema, createAgencySchema,
    forgotPasswordSchema, resetPasswordSchema, assignRoleSchema,
    KYCUploadSchema, KYCStatusResponse, KYCUploadResponse,
    UpdateLocationSchema, LocationResponseSchema,
    ToggleLocationSharingSchema, NearbyWorkersSchema,
    DepositFundsSchema,
    # Worker Phase 1 schemas
    WorkerProfileUpdateSchema, WorkerProfileResponse, ProfileCompletionResponse,
    CertificationSchema, AddCertificationRequest, UpdateCertificationRequest, CertificationResponse,
    PortfolioItemSchema, UploadPortfolioRequest, UpdatePortfolioCaptionRequest,
    PortfolioItemResponse, ReorderPortfolioRequest
)
# Phase 8: Review schemas
from .review_schemas import (
    SubmitReviewRequest, ReviewResponse, ReviewListRequest, ReviewListResponse,
    ReviewStatsResponse, AddReviewResponseRequest, ReportReviewRequest, MyReviewsResponse
)
from .services import (
    create_account_individ, create_account_agency, login_account, 
    _verify_account, forgot_password_request, reset_password_verify, 
    logout_account, refresh_token, fetch_currentUser, generateCookie, 
    assign_role, upload_kyc_document, get_kyc_status, get_pending_kyc_submissions,
    update_user_location, toggle_location_sharing, get_user_location, find_nearby_workers
)
# Worker Phase 1 service imports
from .worker_profile_service import (
    update_worker_profile, get_worker_profile_completion
)
from .certification_service import (
    add_certification, get_certifications, get_expiring_certifications,
    update_certification, delete_certification, verify_certification
)
from .portfolio_service import (
    upload_portfolio_image, get_portfolio, update_portfolio_caption,
    reorder_portfolio, delete_portfolio_image
)
# Phase 8: Review service imports
from .review_service import (
    submit_review, get_reviews_for_worker, get_review_stats,
    get_my_reviews, edit_review, report_review
)
from ninja.responses import Response
from .authentication import cookie_auth, dual_auth
from django.shortcuts import redirect
from django.urls import reverse

router = Router(tags=["Accounts"])

#region USER-SIDE ACCOUNTS
@router.get("/auth/google/login")
def google_login(request):
 
    return redirect(reverse("google_login"))
    
@router.get("/auth/google/callback")
def google_callback(request):
    if not request.user.is_authenticated:
        return {"error": "Authentication failed"}
    
    return generateCookie(request.user)
@router.post("/register")
def register(request, payload: createAccountSchema):
    try:
        result = create_account_individ(payload)
        return result
    except ValueError as e:
        print(f"❌ ValueError in registration: {str(e)}")  # Add logging
        return Response(
            {"error": [{"message": str(e)}]}, 
            status=400
        )
    except Exception as e:
        print(f"❌ Exception in registration: {str(e)}")  # Add logging
        import traceback
        traceback.print_exc()  # Print full stack trace
        return Response(
            {"error": [{"message": "Registration failed"}]}, 
            status=500
        )
@router.post("/register/agency")
def register_agency(request, payload: createAgencySchema):
    try:
        result = create_account_agency(payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Registration failed"}]}

@router.post("/login")
def login(request, payload: logInSchema):
    try:
        result = login_account(payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Login failed"}]}

@router.post('/assign-role')
def assignRole(request, payload: assignRoleSchema):
    try:
        result = assign_role(payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Role Assigning Failed"}]}
@router.post("/logout", auth=cookie_auth)
def logout(request):
   try:
       result = logout_account()  # 🔥 FIX: Call the function with ()
       return result
   except ValueError as e:
        return {"error": [{"message": str(e)}]}

@router.post("/refresh", auth=cookie_auth)
def refresh(request):
    try:
        result = refresh_token(request.COOKIES.get("refresh"))
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}

@router.get("/me", auth=cookie_auth)
def get_user_profile(request):
    try:
        user = request.auth  # This comes from our cookie_auth
        print(f"✅ /me - Authenticated user: {user.email}")
        result = fetch_currentUser(user.accountID)
        return result
    except Exception as e:
        print(f"❌ /me error: {str(e)}")
        return {"error": [{"message": "Failed to fetch user profile"}]}

# Send Email Verification
@router.get("/verify")
def verify(request, verifyToken: str, accountID: int):
    try:
        result = _verify_account(verifyToken, accountID)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Verification failed"}]}

@router.post("/forgot-password/send-verify")
def forgot_password_send_verify(request, payload: forgotPasswordSchema):
    """Send password reset verification email"""
    try:
        result = forgot_password_request(payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Password reset request failed"}]}

@router.post("/forgot-password/verify")
def forgot_password_verify(request, payload: resetPasswordSchema, verifyToken: str, id: int):
    try:
        result = reset_password_verify(verifyToken, id, payload)
        return result
    except ValueError as e:
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        return {"error": [{"message": "Password reset failed"}]}
    
@router.post("/upload/kyc", auth=cookie_auth)
def upload_kyc(request):
    try:
        # 🔥 Use authenticated user's ID instead of trusting client
        user = request.auth
        accountID = user.accountID
        
        IDType = request.POST.get("IDType")
        clearanceType = request.POST.get("clearanceType")
        frontID = request.FILES.get("frontID")
        backID = request.FILES.get("backID")
        clearance = request.FILES.get("clearance")
        selfie = request.FILES.get("selfie")

        payload = KYCUploadSchema(
            accountID=accountID,
            IDType=IDType,
            clearanceType=clearanceType
        )
        result = upload_kyc_document(payload, frontID, backID, clearance, selfie)
        return result
    except ValueError as e:
        print(f"❌ ValueError in KYC upload: {str(e)}")
        return {"error": [{"message": str(e)}]}
    except Exception as e:
        print(f"❌ Exception in KYC upload: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": [{"message": "Upload Failed"}]}

@router.get("/kyc/history", auth=cookie_auth)
def get_kyc_application_history(request):
    """
    Get the authenticated user's KYC application history.
    
    Returns:
    - hasActiveKYC: boolean - if user has pending KYC
    - activeKYCId: ID of pending KYC (if any)
    - kycHistory: list of past applications with status, dates, and reasons
    - canResubmit: boolean - if user can submit new KYC
    - totalApplications: total number of KYC applications submitted
    """
    try:
        from adminpanel.service import get_user_kyc_history
        
        user = request.auth
        print(f"🔍 Fetching KYC history for user: {user.email} (ID: {user.accountID})")
        
        result = get_user_kyc_history(user.accountID)
        return {"success": True, **result}
        
    except Exception as e:
        print(f"❌ Error fetching KYC history: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to fetch KYC history"}


@router.get("/notifications", auth=dual_auth)
def get_notifications(request, limit: int = 50, unread_only: bool = False):
    """
    Get notifications for the authenticated user.
    
    Query params:
    - limit: Maximum number of notifications to return (default 50)
    - unread_only: If true, only return unread notifications (default false)
    """
    try:
        from .services import get_user_notifications
        
        user = request.auth
        notifications = get_user_notifications(user.accountID, limit, unread_only)
        
        return {
            "success": True,
            "notifications": notifications,
            "count": len(notifications)
        }
        
    except Exception as e:
        print(f"❌ Error fetching notifications: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to fetch notifications"}


@router.post("/notifications/{notification_id}/mark-read", auth=cookie_auth)
def mark_notification_read(request, notification_id: int):
    """
    Mark a specific notification as read.
    """
    try:
        from .services import mark_notification_as_read
        
        user = request.auth
        mark_notification_as_read(user.accountID, notification_id)
        
        return {"success": True, "message": "Notification marked as read"}
        
    except ValueError as e:
        return {"success": False, "error": str(e)}
    except Exception as e:
        print(f"❌ Error marking notification as read: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to mark notification as read"}


@router.post("/notifications/mark-all-read", auth=cookie_auth)
def mark_all_notifications_read(request):
    """
    Mark all notifications as read for the authenticated user.
    """
    try:
        from .services import mark_all_notifications_as_read
        
        user = request.auth
        count = mark_all_notifications_as_read(user.accountID)
        
        return {
            "success": True,
            "message": f"Marked {count} notifications as read",
            "count": count
        }
        
    except Exception as e:
        print(f"❌ Error marking all notifications as read: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to mark notifications as read"}


@router.get("/notifications/unread-count", auth=dual_auth)
def get_unread_count(request):
    """
    Get the count of unread notifications for the authenticated user.
    Supports both mobile (Bearer token) and web (cookie) authentication.
    """
    try:
        from .services import get_unread_notification_count

        user = request.auth
        count = get_unread_notification_count(user.accountID)

        return {"success": True, "unread_count": count}

    except Exception as e:
        print(f"❌ Error getting unread count: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to get unread count"}


@router.post("/register-push-token", auth=dual_auth)
def register_push_token(request, pushToken: str, deviceType: str = "android"):
    """
    Register or update an Expo push token for the authenticated user.

    Parameters:
        pushToken: Expo push token (ExponentPushToken[...])
        deviceType: 'ios' or 'android' (default: 'android')
    """
    try:
        from .services import register_push_token_service

        user = request.auth
        token = register_push_token_service(user.accountID, pushToken, deviceType)

        return {
            "success": True,
            "message": "Push token registered successfully",
            "tokenID": token.tokenID
        }

    except Exception as e:
        print(f"❌ Error registering push token: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to register push token"}


@router.get("/notification-settings", auth=cookie_auth)
def get_notification_settings(request):
    """
    Get notification settings for the authenticated user.
    """
    try:
        from .services import get_notification_settings_service

        user = request.auth
        settings = get_notification_settings_service(user.accountID)

        return {
            "success": True,
            "settings": {
                "pushEnabled": settings.pushEnabled,
                "soundEnabled": settings.soundEnabled,
                "jobUpdates": settings.jobUpdates,
                "messages": settings.messages,
                "payments": settings.payments,
                "reviews": settings.reviews,
                "kycUpdates": settings.kycUpdates,
                "doNotDisturbStart": settings.doNotDisturbStart.strftime("%H:%M") if settings.doNotDisturbStart else None,
                "doNotDisturbEnd": settings.doNotDisturbEnd.strftime("%H:%M") if settings.doNotDisturbEnd else None,
            }
        }

    except Exception as e:
        print(f"❌ Error fetching notification settings: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to fetch notification settings"}


@router.put("/notification-settings", auth=cookie_auth)
def update_notification_settings(request,
                                 pushEnabled: bool = None,
                                 soundEnabled: bool = None,
                                 jobUpdates: bool = None,
                                 messages: bool = None,
                                 payments: bool = None,
                                 reviews: bool = None,
                                 kycUpdates: bool = None,
                                 doNotDisturbStart: str = None,
                                 doNotDisturbEnd: str = None):
    """
    Update notification settings for the authenticated user.
    Only provided fields will be updated.
    """
    try:
        from .services import update_notification_settings_service

        user = request.auth
        settings_data = {}

        if pushEnabled is not None:
            settings_data['pushEnabled'] = pushEnabled
        if soundEnabled is not None:
            settings_data['soundEnabled'] = soundEnabled
        if jobUpdates is not None:
            settings_data['jobUpdates'] = jobUpdates
        if messages is not None:
            settings_data['messages'] = messages
        if payments is not None:
            settings_data['payments'] = payments
        if reviews is not None:
            settings_data['reviews'] = reviews
        if kycUpdates is not None:
            settings_data['kycUpdates'] = kycUpdates
        if doNotDisturbStart is not None:
            settings_data['doNotDisturbStart'] = doNotDisturbStart
        if doNotDisturbEnd is not None:
            settings_data['doNotDisturbEnd'] = doNotDisturbEnd

        settings = update_notification_settings_service(user.accountID, settings_data)

        return {
            "success": True,
            "message": "Notification settings updated successfully",
            "settings": {
                "pushEnabled": settings.pushEnabled,
                "soundEnabled": settings.soundEnabled,
                "jobUpdates": settings.jobUpdates,
                "messages": settings.messages,
                "payments": settings.payments,
                "reviews": settings.reviews,
                "kycUpdates": settings.kycUpdates,
                "doNotDisturbStart": settings.doNotDisturbStart.strftime("%H:%M") if settings.doNotDisturbStart else None,
                "doNotDisturbEnd": settings.doNotDisturbEnd.strftime("%H:%M") if settings.doNotDisturbEnd else None,
            }
        }

    except Exception as e:
        print(f"❌ Error updating notification settings: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to update notification settings"}


@router.delete("/notifications/{notification_id}/delete", auth=cookie_auth)
def delete_notification(request, notification_id: int):
    """
    Delete a specific notification for the authenticated user.
    """
    try:
        from .services import delete_notification_service

        user = request.auth
        success = delete_notification_service(user.accountID, notification_id)

        if success:
            return {"success": True, "message": "Notification deleted successfully"}
        else:
            return {"success": False, "error": "Notification not found or unauthorized"}

    except Exception as e:
        print(f"❌ Error deleting notification: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to delete notification"}


#region WORKER ENDPOINTS
@router.get("/users/workers")

def get_all_workers_endpoint(request, latitude: float = None, longitude: float = None):
    """
    Fetch all workers with their profiles and specializations.
    Public endpoint - no authentication required for browsing workers.
    
    Query Parameters:
        latitude (optional): Client's latitude for distance calculation
        longitude (optional): Client's longitude for distance calculation
    """
    try:
        from .services import get_all_workers
        
        # Pass client location to service function
        workers = get_all_workers(
            client_latitude=latitude,
            client_longitude=longitude
        )
        
        return {
            "success": True,
            "workers": workers,
            "count": len(workers)
        }
        
    except Exception as e:
        print(f"❌ Error fetching workers: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"success": False, "error": "Failed to fetch workers"}, 
            status=500
        )


@router.get("/users/workers/{user_id}")
def get_worker_by_id_endpoint(request, user_id: int, latitude: float = None, longitude: float = None):
    """
    Fetch a single worker by their account ID.
    Public endpoint - no authentication required for viewing worker profiles.
    
    Query Parameters:
        latitude (optional): Client's latitude for distance calculation
        longitude (optional): Client's longitude for distance calculation
    """
    try:
        from .services import get_worker_by_id
        
        # Pass client location to service function
        worker = get_worker_by_id(
            user_id,
            client_latitude=latitude,
            client_longitude=longitude
        )
        
        if worker is None:
            return Response(
                {"success": False, "error": "Worker not found"}, 
                status=404
            )
        
        return {
            "success": True,
            "worker": worker
        }
        
    except Exception as e:
        print(f"❌ Error fetching worker {user_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"success": False, "error": "Failed to fetch worker"}, 
            status=500
        )


@router.patch("/workers/availability", auth=cookie_auth)
def update_worker_availability_endpoint(request, is_available: bool):
    """
    Update the authenticated worker's availability status.
    Requires authentication.
    """
    try:
        from .services import update_worker_availability
        
        user = request.auth
        result = update_worker_availability(user.accountID, is_available)
        
        return {
            "success": True,
            "data": result
        }
        
    except ValueError as e:
        print(f"❌ ValueError updating availability: {str(e)}")
        return Response(
            {"success": False, "error": str(e)}, 
            status=400
        )
    except Exception as e:
        print(f"❌ Error updating worker availability: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"success": False, "error": "Failed to update availability"}, 
            status=500
        )


@router.get("/workers/availability", auth=cookie_auth)
def get_worker_availability_endpoint(request):
    """
    Get the authenticated worker's current availability status.
    Requires authentication.
    """
    try:
        from .services import get_worker_availability
        
        user = request.auth
        result = get_worker_availability(user.accountID)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        print(f"❌ Error getting worker availability: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"success": False, "error": "Failed to get availability"}, 
            status=500
        )
#endregion

#region LOCATION TRACKING APIs

@router.post("/location/update", auth=cookie_auth, response=LocationResponseSchema)
def update_location(request, payload: UpdateLocationSchema):
    """
    Update user's current GPS location
    """
    try:
        user = request.auth
        result = update_user_location(
            account_id=user.accountID,
            latitude=payload.latitude,
            longitude=payload.longitude
        )
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error updating location: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to update location"},
            status=500
        )


@router.get("/location/me", auth=cookie_auth, response=LocationResponseSchema)
def get_my_location(request):
    """
    Get current user's location
    """
    try:
        user = request.auth
        result = get_user_location(account_id=user.accountID)
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error getting location: {str(e)}")
        return Response(
            {"error": "Failed to get location"},
            status=500
        )


@router.post("/location/toggle-sharing", auth=cookie_auth, response=LocationResponseSchema)
def toggle_location_sharing_endpoint(request, payload: ToggleLocationSharingSchema):
    """
    Enable or disable location sharing
    """
    try:
        user = request.auth
        result = toggle_location_sharing(
            account_id=user.accountID,
            enabled=payload.enabled
        )
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error toggling location sharing: {str(e)}")
        return Response(
            {"error": "Failed to toggle location sharing"},
            status=500
        )


@router.post("/location/nearby-workers")
def get_nearby_workers(request, payload: NearbyWorkersSchema):
    """
    Find workers near a specific location
    Can be used by clients to find workers nearby
    """
    try:
        result = find_nearby_workers(
            latitude=payload.latitude,
            longitude=payload.longitude,
            radius_km=payload.radius_km,
            specialization_id=payload.specialization_id
        )
        return result
        
    except Exception as e:
        print(f"❌ Error finding nearby workers: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to find nearby workers"},
            status=500
        )

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
        from .services import upload_profile_image_service
        
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
        from .models import Wallet
        
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
        from .models import Wallet, Transaction, Profile
        from .xendit_service import XenditService
        from decimal import Decimal
        from django.utils import timezone
        
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
        from .models import Wallet, Transaction
        from decimal import Decimal
        from django.utils import timezone
        
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
        from .models import Wallet, Transaction
        
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
        from .models import Transaction
        from .xendit_service import XenditService
        from decimal import Decimal
        from django.utils import timezone
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
            
            # Update wallet balance based on transaction type
            if transaction.transactionType == Transaction.TransactionType.DEPOSIT:
                # Deposit adds to wallet
                wallet.balance += transaction.amount
                wallet.save()
                print(f"💰 Added ₱{transaction.amount} to wallet (DEPOSIT)")
            elif transaction.transactionType == Transaction.TransactionType.PAYMENT:
                # Payment/Escrow - money goes to platform, not deducted from wallet
                # Wallet balance stays the same (escrow is held by platform)
                print(f"💸 Escrow payment of ₱{transaction.amount} received (held by platform)")
            
            # Update transaction
            transaction.status = Transaction.TransactionStatus.COMPLETED
            transaction.balanceAfter = wallet.balance
            transaction.xenditPaymentID = webhook_data.get('payment_id')
            transaction.xenditPaymentChannel = webhook_data.get('payment_channel')
            transaction.xenditPaymentMethod = webhook_data.get('payment_method')
            transaction.completedAt = timezone.now()
            transaction.save()
            
            # If this is an escrow payment, mark the job as escrow paid
            if transaction.relatedJobPosting:
                job = transaction.relatedJobPosting
                if "escrow" in transaction.description.lower() or "downpayment" in transaction.description.lower():
                    job.escrowPaid = True
                    job.escrowPaidAt = timezone.now()
                    job.save()
                    print(f"✅ Job {job.jobID} escrow marked as paid")
                elif "remaining" in transaction.description.lower() or "final" in transaction.description.lower():
                    # This is the remaining payment - mark job as completed
                    job.remainingPaymentPaid = True
                    job.remainingPaymentPaidAt = timezone.now()
                    job.status = "COMPLETED"
                    job.save()
                    print(f"✅ Job {job.jobID} remaining payment received - Job marked as COMPLETED")
            
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
        from .models import Transaction
        from decimal import Decimal
        from django.utils import timezone
        
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
        
        # Update wallet balance based on transaction type
        if transaction.transactionType == Transaction.TransactionType.DEPOSIT:
            # Deposit adds to wallet
            wallet.balance += transaction.amount
            wallet.save()
            print(f"   Added: ₱{transaction.amount} (DEPOSIT)")
        elif transaction.transactionType == Transaction.TransactionType.PAYMENT:
            # Payment/Escrow - money goes to platform, not deducted from wallet
            # Wallet balance stays the same (escrow is held by platform)
            print(f"   Escrow payment: ₱{transaction.amount} (held by platform)")
        
        # Update transaction
        transaction.status = Transaction.TransactionStatus.COMPLETED
        transaction.balanceAfter = wallet.balance
        transaction.xenditPaymentID = "SIMULATED_" + str(transaction_id)
        transaction.xenditPaymentChannel = "GCASH"
        transaction.completedAt = timezone.now()
        transaction.save()
        
        # If this is an escrow payment, mark the job as escrow paid
        if transaction.relatedJobPosting:
            job = transaction.relatedJobPosting
            if "escrow" in transaction.description.lower() or "downpayment" in transaction.description.lower():
                job.escrowPaid = True
                job.escrowPaidAt = timezone.now()
                job.save()
                print(f"✅ Job {job.jobID} escrow marked as paid")
        
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
        from .models import Transaction
        from .xendit_service import XenditService
        
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




#region WORKER PHASE 1 - PROFILE ENHANCEMENT API
# ===========================================================================
# WORKER PROFILE ENHANCEMENT ENDPOINTS
# Profile management, certifications, and portfolio for workers
# ===========================================================================

@router.post("/worker/profile", auth=cookie_auth, response=WorkerProfileResponse)
def update_worker_profile_endpoint(request, payload: WorkerProfileUpdateSchema):
    """
    Update worker profile fields (bio, description, hourly_rate).
    
    Updates profile completion percentage automatically.
    """
    try:
        # Get authenticated user
        account = request.auth
        
        # Verify user has a profile
        if not hasattr(account, 'profile'):
            return Response(
                {"error": "User profile not found"},
                status=404
            )
        
        # Verify user is a worker
        if not hasattr(account.profile, 'worker_profile'):
            return Response(
                {"error": "Only workers can update worker profile"},
                status=403
            )
        
        worker_profile = account.profile.worker_profile
        
        # Call service function
        result = update_worker_profile(
            worker_profile=worker_profile,
            bio=payload.bio,
            description=payload.description,
            hourly_rate=payload.hourly_rate
        )
        
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error updating worker profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to update profile"},
            status=500
        )


@router.get("/worker/profile-completion", auth=cookie_auth, response=ProfileCompletionResponse)
def get_profile_completion_endpoint(request):
    """
    Get profile completion percentage and recommendations.
    
    Returns detailed information about completed/missing fields.
    """
    try:
        # Get authenticated user
        account = request.auth
        
        # Verify user has a profile
        if not hasattr(account, 'profile'):
            return Response(
                {"error": "User profile not found"},
                status=404
            )
        
        # Verify user is a worker
        if not hasattr(account.profile, 'worker_profile'):
            return Response(
                {"error": "Only workers can check profile completion"},
                status=403
            )
        
        worker_profile = account.profile.worker_profile
        
        # Call service function
        result = get_worker_profile_completion(worker_profile)
        
        return result
        
    except Exception as e:
        print(f"❌ Error getting profile completion: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to get profile completion"},
            status=500
        )


# ===========================
# CERTIFICATION ENDPOINTS
# ===========================

@router.post("/worker/certifications", auth=cookie_auth, response=CertificationResponse)
def add_certification_endpoint(
    request,
    name: str = Form(...),
    organization: str = Form(None),
    issue_date: str = Form(None),
    expiry_date: str = Form(None),
    certificate_file: UploadedFile = File(None)
):
    """
    Add a new certification with optional file upload.
    
    Form fields:
    - name (required): Certificate name
    - organization: Issuing organization
    - issue_date: Issue date (YYYY-MM-DD)
    - expiry_date: Expiry date (YYYY-MM-DD)
    - certificate_file: Certificate document/image
    """
    try:
        # Get authenticated user
        account = request.auth
        
        # Verify user has a profile
        if not hasattr(account, 'profile'):
            return Response(
                {"error": "User profile not found"},
                status=404
            )
        
        # Verify user is a worker
        if not hasattr(account.profile, 'worker_profile'):
            return Response(
                {"error": "Only workers can add certifications"},
                status=403
            )
        
        worker_profile = account.profile.worker_profile
        
        # Call service function
        certification = add_certification(
            worker_profile=worker_profile,
            name=name,
            organization=organization,
            issue_date=issue_date,
            expiry_date=expiry_date,
            certificate_file=certificate_file
        )
        
        return {
            "success": True,
            "message": "Certification added successfully",
            "certification": certification
        }
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error adding certification: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to add certification"},
            status=500
        )


@router.get("/worker/certifications", auth=cookie_auth, response=list[CertificationSchema])
def list_certifications_endpoint(request):
    """
    List all worker's certifications with expiry status.
    
    Includes is_expired flag and days_until_expiry.
    """
    try:
        # Get authenticated user
        account = request.auth
        
        # Verify user has a profile
        if not hasattr(account, 'profile'):
            return Response(
                {"error": "User profile not found"},
                status=404
            )
        
        # Verify user is a worker
        if not hasattr(account.profile, 'worker_profile'):
            return Response(
                {"error": "Only workers can list certifications"},
                status=403
            )
        
        worker_profile = account.profile.worker_profile
        
        # Call service function
        certifications = get_certifications(worker_profile)
        
        return certifications
        
    except Exception as e:
        print(f"❌ Error listing certifications: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to list certifications"},
            status=500
        )


@router.put("/worker/certifications/{certification_id}", auth=cookie_auth, response=CertificationResponse)
def update_certification_endpoint(request, certification_id: int, payload: UpdateCertificationRequest):
    """
    Update certification fields.
    
    Only the worker who owns the certification can update it.
    """
    try:
        # Get authenticated user
        account = request.auth
        
        # Verify user has a profile
        if not hasattr(account, 'profile'):
            return Response(
                {"error": "User profile not found"},
                status=404
            )
        
        # Verify user is a worker
        if not hasattr(account.profile, 'worker_profile'):
            return Response(
                {"error": "Only workers can update certifications"},
                status=403
            )
        
        worker_profile = account.profile.worker_profile
        
        # Call service function
        certification = update_certification(
            worker_profile=worker_profile,
            certification_id=certification_id,
            name=payload.name,
            organization=payload.organization,
            issue_date=payload.issue_date,
            expiry_date=payload.expiry_date
        )
        
        return {
            "success": True,
            "message": "Certification updated successfully",
            "certification": certification
        }
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error updating certification: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to update certification"},
            status=500
        )


@router.delete("/worker/certifications/{certification_id}", auth=cookie_auth)
def delete_certification_endpoint(request, certification_id: int):
    """
    Delete a certification.
    
    Only the worker who owns the certification can delete it.
    """
    try:
        # Get authenticated user
        account = request.auth
        
        # Verify user has a profile
        if not hasattr(account, 'profile'):
            return Response(
                {"error": "User profile not found"},
                status=404
            )
        
        # Verify user is a worker
        if not hasattr(account.profile, 'worker_profile'):
            return Response(
                {"error": "Only workers can delete certifications"},
                status=403
            )
        
        worker_profile = account.profile.worker_profile
        
        # Call service function
        result = delete_certification(worker_profile, certification_id)
        
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error deleting certification: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to delete certification"},
            status=500
        )


# ===========================
# PORTFOLIO ENDPOINTS
# ===========================

@router.post("/worker/portfolio", auth=cookie_auth, response=PortfolioItemResponse)
def upload_portfolio_endpoint(
    request,
    image: UploadedFile = File(...),
    caption: str = Form(None)
):
    """
    Upload a portfolio image with optional caption.
    
    Validates file size (5MB max) and format (JPEG/PNG).
    """
    try:
        # Get authenticated user
        account = request.auth
        
        # Verify user has a profile
        if not hasattr(account, 'profile'):
            return Response(
                {"error": "User profile not found"},
                status=404
            )
        
        # Verify user is a worker
        if not hasattr(account.profile, 'worker_profile'):
            return Response(
                {"error": "Only workers can upload portfolio images"},
                status=403
            )
        
        worker_profile = account.profile.worker_profile
        
        # Call service function
        portfolio_item = upload_portfolio_image(
            worker_profile=worker_profile,
            image_file=image,
            caption=caption
        )
        
        return {
            "success": True,
            "message": "Portfolio image uploaded successfully",
            "portfolio_item": portfolio_item
        }
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error uploading portfolio: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to upload portfolio image"},
            status=500
        )


@router.get("/worker/portfolio", auth=cookie_auth, response=list[PortfolioItemSchema])
def list_portfolio_endpoint(request):
    """
    List all worker's portfolio images ordered by display_order.
    """
    try:
        # Get authenticated user
        account = request.auth
        
        # Verify user has a profile
        if not hasattr(account, 'profile'):
            return Response(
                {"error": "User profile not found"},
                status=404
            )
        
        # Verify user is a worker
        if not hasattr(account.profile, 'worker_profile'):
            return Response(
                {"error": "Only workers can list portfolio"},
                status=403
            )
        
        worker_profile = account.profile.worker_profile
        
        # Call service function
        portfolio = get_portfolio(worker_profile)
        
        return portfolio
        
    except Exception as e:
        print(f"❌ Error listing portfolio: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to list portfolio"},
            status=500
        )


@router.put("/worker/portfolio/{portfolio_id}/caption", auth=cookie_auth, response=PortfolioItemResponse)
def update_portfolio_caption_endpoint(request, portfolio_id: int, payload: UpdatePortfolioCaptionRequest):
    """
    Update caption for a portfolio image.
    
    Only the worker who owns the portfolio item can update it.
    """
    try:
        # Get authenticated user
        account = request.auth
        
        # Verify user has a profile
        if not hasattr(account, 'profile'):
            return Response(
                {"error": "User profile not found"},
                status=404
            )
        
        # Verify user is a worker
        if not hasattr(account.profile, 'worker_profile'):
            return Response(
                {"error": "Only workers can update portfolio"},
                status=403
            )
        
        worker_profile = account.profile.worker_profile
        
        # Call service function
        portfolio_item = update_portfolio_caption(
            worker_profile=worker_profile,
            portfolio_id=portfolio_id,
            caption=payload.caption
        )
        
        return {
            "success": True,
            "message": "Caption updated successfully",
            "portfolio_item": portfolio_item
        }
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error updating caption: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to update caption"},
            status=500
        )


@router.put("/worker/portfolio/reorder", auth=cookie_auth)
def reorder_portfolio_endpoint(request, payload: ReorderPortfolioRequest):
    """
    Reorder portfolio images by providing list of portfolio IDs in desired order.
    
    Example: [3, 1, 5, 2, 4] will set display_order to 0, 1, 2, 3, 4 respectively.
    """
    try:
        # Get authenticated user
        account = request.auth
        
        # Verify user has a profile
        if not hasattr(account, 'profile'):
            return Response(
                {"error": "User profile not found"},
                status=404
            )
        
        # Verify user is a worker
        if not hasattr(account.profile, 'worker_profile'):
            return Response(
                {"error": "Only workers can reorder portfolio"},
                status=403
            )
        
        worker_profile = account.profile.worker_profile
        
        # Call service function
        result = reorder_portfolio(
            worker_profile=worker_profile,
            portfolio_id_order=payload.portfolio_id_order
        )
        
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error reordering portfolio: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to reorder portfolio"},
            status=500
        )


@router.delete("/worker/portfolio/{portfolio_id}", auth=cookie_auth)
def delete_portfolio_endpoint(request, portfolio_id: int):
    """
    Delete a portfolio image.
    
    Only the worker who owns the portfolio item can delete it.
    Remaining items are automatically reordered.
    """
    try:
        # Get authenticated user
        account = request.auth
        
        # Verify user has a profile
        if not hasattr(account, 'profile'):
            return Response(
                {"error": "User profile not found"},
                status=404
            )
        
        # Verify user is a worker
        if not hasattr(account.profile, 'worker_profile'):
            return Response(
                {"error": "Only workers can delete portfolio images"},
                status=403
            )
        
        worker_profile = account.profile.worker_profile
        
        # Call service function
        result = delete_portfolio_image(worker_profile, portfolio_id)
        
        return result
        
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error deleting portfolio: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to delete portfolio image"},
            status=500
        )

#endregion


#region REVIEWS & RATINGS API
# ===========================================================================
# PHASE 8: REVIEWS & RATINGS SYSTEM
# ===========================================================================

@router.post("/reviews/submit", auth=cookie_auth, response=ReviewResponse)
def submit_review_endpoint(request, payload: SubmitReviewRequest):
    """
    Submit a review for a completed job.

    - Job must be completed
    - Reviewer must be client or worker on the job
    - Cannot review yourself
    - Cannot review same job twice
    - Rating: 1.0 to 5.0
    """
    try:
        reviewer = request.auth
        review = submit_review(reviewer, payload)
        return review
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error submitting review: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to submit review"},
            status=500
        )


@router.get("/reviews/worker/{worker_id}", response=ReviewListResponse)
def get_worker_reviews(request, worker_id: int, page: int = 1, limit: int = 20, sort: str = "latest"):
    """
    Get all reviews for a specific worker.

    Query params:
    - page: Page number (default: 1)
    - limit: Reviews per page (default: 20)
    - sort: "latest", "highest", "lowest" (default: "latest")
    """
    try:
        reviews = get_reviews_for_worker(worker_id, page, limit, sort)
        return reviews
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=404
        )
    except Exception as e:
        print(f"❌ Error fetching reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch reviews"},
            status=500
        )


@router.get("/reviews/stats/{worker_id}", response=ReviewStatsResponse)
def get_worker_review_stats(request, worker_id: int):
    """
    Get review statistics for a worker.

    Returns:
    - Average rating
    - Total review count
    - Rating breakdown (5-star, 4-star, etc.)
    - Recent reviews (last 5)
    """
    try:
        stats = get_review_stats(worker_id)
        return stats
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=404
        )
    except Exception as e:
        print(f"❌ Error fetching review stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch review statistics"},
            status=500
        )


@router.get("/reviews/my-reviews", auth=cookie_auth, response=MyReviewsResponse)
def get_my_reviews_endpoint(request):
    """
    Get reviews given and received by current user.

    Returns:
    - Reviews given by user
    - Reviews received by user
    - User's rating statistics
    """
    try:
        user = request.auth
        my_reviews = get_my_reviews(user)
        return my_reviews
    except Exception as e:
        print(f"❌ Error fetching my reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch your reviews"},
            status=500
        )


@router.put("/reviews/{review_id}", auth=cookie_auth, response=ReviewResponse)
def edit_review_endpoint(request, review_id: int, comment: str, rating: float):
    """
    Edit a review (only within 24 hours of creation).

    - Must be your own review
    - Within 24-hour window
    - Rating: 1.0 to 5.0
    """
    try:
        user = request.auth
        updated_review = edit_review(review_id, user, comment, rating)
        return updated_review
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error editing review: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to edit review"},
            status=500
        )


@router.post("/reviews/{review_id}/report", auth=cookie_auth)
def report_review_endpoint(request, review_id: int, payload: ReportReviewRequest):
    """
    Report a review as inappropriate.

    Reasons:
    - spam
    - offensive
    - misleading
    - other
    """
    try:
        reporter = request.auth
        result = report_review(review_id, reporter, payload)
        return result
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Error reporting review: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to report review"},
            status=500
        )

#endregion


#region MOBILE API ROUTER
# ===========================================================================
# MOBILE-SPECIFIC API ENDPOINTS
# Optimized for mobile app with minimal payloads and better error handling
# ===========================================================================

mobile_router = Router(tags=["Mobile API"])

# ===========================
# MOBILE JOB ENDPOINTS
# ===========================
