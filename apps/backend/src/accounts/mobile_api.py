# mobile_api.py
# Mobile-specific API endpoints optimized for Flutter app

from ninja import Router
from ninja.responses import Response
from .schemas import (
    createAccountSchema,
    logInSchema,
    assignRoleSchema,
    AssignRoleMobileSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    CreateJobMobileSchema,
    ApplyJobMobileSchema,
    UpdateApplicationMobileSchema,
    ApproveCompletionMobileSchema,
    SubmitReviewMobileSchema,
    SendMessageMobileSchema
)
from .authentication import jwt_auth  # Use Bearer token auth for mobile

# Create mobile router
mobile_router = Router(tags=["Mobile API"])

#region MOBILE AUTH ENDPOINTS

@mobile_router.post("/auth/register")
def mobile_register(request, payload: createAccountSchema):
    """
    Mobile user registration
    Returns tokens in JSON body (not cookies)
    """
    from .services import create_account_individ

    try:
        result = create_account_individ(payload)
        # Registration returns accountID and verifyLink
        # Don't auto-login, require email verification
        return {
            'success': True,
            'data': result,
            'message': 'Registration successful. Please verify your email.'
        }
    except ValueError as e:
        print(f"❌ Mobile registration error: {str(e)}")
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Mobile registration exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Registration failed. Please try again."},
            status=500
        )


@mobile_router.post("/auth/login")
def mobile_login(request, payload: logInSchema):
    """
    Mobile user login
    Returns tokens in JSON body (not cookies)
    """
    from .services import login_account
    import json

    try:
        result = login_account(payload)

        # login_account returns JsonResponse, extract the content
        if hasattr(result, 'content'):
            # It's a JsonResponse, extract the JSON data
            response_data = json.loads(result.content.decode('utf-8'))
            return response_data
        else:
            # It's already a dict
            return result

    except ValueError as e:
        print(f"[ERROR] Mobile login error: {str(e)}")
        return Response(
            {"error": str(e)},
            status=401
        )
    except Exception as e:
        print(f"[ERROR] Mobile login exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Login failed. Please check your credentials."},
            status=500
        )


@mobile_router.post("/auth/logout", auth=jwt_auth)
def mobile_logout(request):
    """
    Mobile user logout
    Clears tokens (mobile should delete local tokens)
    """
    from .services import logout_account

    try:
        result = logout_account()
        return {
            'success': True,
            'message': 'Logged out successfully'
        }
    except Exception as e:
        print(f"❌ Mobile logout error: {str(e)}")
        return Response(
            {"error": "Logout failed"},
            status=500
        )


@mobile_router.get("/auth/profile", auth=jwt_auth)
def mobile_get_profile(request):
    """
    Get current user profile for mobile
    Returns mobile-optimized user data
    """
    from .services import fetch_currentUser

    try:
        user = request.auth
        print(f"[SUCCESS] Mobile /auth/profile - User: {user.email}")
        result = fetch_currentUser(user.accountID)
        return result
    except Exception as e:
        print(f"[ERROR] Mobile profile error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch profile"},
            status=500
        )


@mobile_router.post("/auth/assign-role", auth=jwt_auth)
def mobile_assign_role(request, payload: AssignRoleMobileSchema):
    """
    Assign user role (CLIENT or WORKER) for mobile
    Uses authenticated user's email automatically
    """
    from .services import assign_role

    try:
        # Get email from authenticated user
        user = request.auth

        # Create assignRoleSchema with user's email
        class AssignRoleData:
            email = user.email
            selectedType = payload.profile_type

        result = assign_role(AssignRoleData())
        return result
    except ValueError as e:
        print(f"[ERROR] Mobile assign role error: {str(e)}")
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"[ERROR] Mobile assign role exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to assign role"},
            status=500
        )


@mobile_router.post("/auth/refresh")
def mobile_refresh_token(request):
    """
    Refresh access token for mobile
    Accepts refresh token from Authorization header (Bearer token)
    """
    from .services import refresh_token as refresh_token_service
    import json

    try:
        # Get refresh token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return Response(
                {"error": "Refresh token required in Authorization header"},
                status=401
            )

        refresh_token_value = auth_header.replace('Bearer ', '')

        if not refresh_token_value:
            return Response(
                {"error": "Refresh token not found"},
                status=401
            )

        result = refresh_token_service(refresh_token_value)

        # Extract JSON from JsonResponse if needed
        if hasattr(result, 'content'):
            response_data = json.loads(result.content.decode('utf-8'))
            return response_data
        else:
            return result

    except ValueError as e:
        print(f"❌ Mobile refresh token error: {str(e)}")
        return Response(
            {"error": "Invalid or expired refresh token"},
            status=401
        )
    except Exception as e:
        print(f"❌ Mobile refresh token exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Token refresh failed"},
            status=500
        )


@mobile_router.post("/auth/forgot-password")
def mobile_forgot_password(request, payload: forgotPasswordSchema):
    """
    Request password reset for mobile
    """
    from .services import forgot_password_request

    try:
        result = forgot_password_request(payload)
        return {
            'success': True,
            'message': 'Password reset email sent'
        }
    except ValueError as e:
        print(f"❌ Mobile forgot password error: {str(e)}")
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Mobile forgot password exception: {str(e)}")
        return Response(
            {"error": "Failed to send reset email"},
            status=500
        )


@mobile_router.post("/auth/reset-password")
def mobile_reset_password(request, payload: resetPasswordSchema, verifyToken: str, id: int):
    """
    Reset password with token for mobile
    """
    from .services import reset_password_verify

    try:
        result = reset_password_verify(verifyToken, id, payload)
        return {
            'success': True,
            'message': 'Password reset successful'
        }
    except ValueError as e:
        print(f"❌ Mobile reset password error: {str(e)}")
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Mobile reset password exception: {str(e)}")
        return Response(
            {"error": "Password reset failed"},
            status=500
        )


@mobile_router.get("/auth/verify")
def mobile_verify_email(request, verifyToken: str, accountID: int):
    """
    Verify email address for mobile
    """
    from .services import _verify_account

    try:
        result = _verify_account(verifyToken, accountID)
        return {
            'success': True,
            'message': 'Email verified successfully',
            'data': result
        }
    except ValueError as e:
        print(f"❌ Mobile email verification error: {str(e)}")
        return Response(
            {"error": str(e)},
            status=400
        )
    except Exception as e:
        print(f"❌ Mobile email verification exception: {str(e)}")
        return Response(
            {"error": "Email verification failed"},
            status=500
        )

#endregion

#region MOBILE JOB ENDPOINTS

@mobile_router.get("/jobs/list", auth=jwt_auth)
def mobile_job_list(
    request,
    category: int = None,
    min_budget: float = None,
    max_budget: float = None,
    location: str = None,
    page: int = 1,
    limit: int = 20
):
    """
    Get paginated job listings optimized for mobile
    Returns minimal fields for list view performance
    """
    from .mobile_services import get_mobile_job_list

    try:
        result = get_mobile_job_list(
            user=request.auth,
            category_id=category,
            min_budget=min_budget,
            max_budget=max_budget,
            location=location,
            page=page,
            limit=limit
        )

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch jobs')},
                status=400
            )
    except Exception as e:
        print(f"[ERROR] Mobile job list error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch job listings"},
            status=500
        )


@mobile_router.get("/jobs/categories", auth=jwt_auth)
def mobile_job_categories(request):
    """
    Get all job categories/specializations for mobile
    """
    from .mobile_services import get_job_categories_mobile

    try:
        result = get_job_categories_mobile()

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch categories')},
                status=400
            )
    except Exception as e:
        print(f"[ERROR] Mobile categories error: {str(e)}")
        return Response(
            {"error": "Failed to fetch categories"},
            status=500
        )


@mobile_router.get("/jobs/{job_id}", auth=jwt_auth)
def mobile_job_detail(request, job_id: int):
    """
    Get complete job details for mobile view
    Includes user-specific data (is_applied, etc.)
    """
    from .mobile_services import get_mobile_job_detail

    try:
        result = get_mobile_job_detail(job_id=job_id, user=request.auth)

        if result['success']:
            return result['data']
        else:
            status_code = 404 if 'not found' in result.get('error', '').lower() else 400
            return Response(
                {"error": result.get('error', 'Failed to fetch job')},
                status=status_code
            )
    except Exception as e:
        print(f"❌ Mobile job detail error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch job details"},
            status=500
        )


@mobile_router.post("/jobs/create", auth=jwt_auth)
def mobile_create_job(request, payload: CreateJobMobileSchema):
    """
    Create job posting from mobile app
    Handles payment and returns job_id with payment instructions
    """
    from .mobile_services import create_mobile_job

    try:
        job_data = payload.dict()
        result = create_mobile_job(user=request.auth, job_data=job_data)

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Job creation failed')},
                status=400
            )
    except Exception as e:
        print(f"❌ Mobile create job error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to create job"},
            status=500
        )


@mobile_router.get("/jobs/search", auth=jwt_auth)
def mobile_job_search(request, query: str, page: int = 1, limit: int = 20):
    """
    Search jobs with fuzzy matching
    Returns mobile-optimized results
    """
    from .mobile_services import search_mobile_jobs

    try:
        if not query or len(query) < 2:
            return Response(
                {"error": "Search query must be at least 2 characters"},
                status=400
            )

        result = search_mobile_jobs(
            query=query,
            user=request.auth,
            page=page,
            limit=limit
        )

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Search failed')},
                status=400
            )
    except Exception as e:
        print(f"❌ Mobile job search error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Search operation failed"},
            status=500
        )


#endregion

#region MOBILE DASHBOARD ENDPOINTS

@mobile_router.get("/dashboard/stats", auth=jwt_auth)
def mobile_dashboard_stats(request):
    """
    Get dashboard statistics for mobile
    Returns different data for CLIENT vs WORKER
    """
    from .mobile_dashboard import get_dashboard_stats_mobile

    try:
        user = request.auth
        result = get_dashboard_stats_mobile(user)

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch dashboard stats')},
                status=400
            )
    except Exception as e:
        print(f"❌ Mobile dashboard stats error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch dashboard stats"},
            status=500
        )


@mobile_router.get("/dashboard/recent-jobs", auth=jwt_auth)
def mobile_dashboard_recent_jobs(request, limit: int = 5):
    """
    Get recent jobs for dashboard
    - Workers: Recent available jobs to apply to
    - Clients: Their recent posted jobs
    """
    from .mobile_dashboard import get_dashboard_recent_jobs_mobile

    try:
        user = request.auth
        result = get_dashboard_recent_jobs_mobile(user, limit)

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch recent jobs')},
                status=400
            )
    except Exception as e:
        print(f"❌ Mobile recent jobs error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch recent jobs"},
            status=500
        )


@mobile_router.get("/dashboard/available-workers", auth=jwt_auth)
def mobile_dashboard_available_workers(request, limit: int = 10):
    """
    Get available workers (for clients)
    """
    from .mobile_dashboard import get_available_workers_mobile

    try:
        user = request.auth
        result = get_available_workers_mobile(user, limit)

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch workers')},
                status=400
            )
    except Exception as e:
        print(f"❌ Mobile available workers error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch workers"},
            status=500
        )

#endregion

#region MOBILE PROFILE ENDPOINTS

@mobile_router.get("/profile/me", auth=jwt_auth)
def mobile_get_profile(request):
    """
    Get current user profile
    Same as /api/accounts/me but optimized for mobile
    """
    from .mobile_services import get_user_profile_mobile

    try:
        user = request.auth
        result = get_user_profile_mobile(user)

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch profile')},
                status=400
            )
    except Exception as e:
        print(f"[ERROR] Mobile get profile error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch profile"},
            status=500
        )


@mobile_router.put("/profile/update", auth=jwt_auth)
def mobile_update_profile(request, payload: dict):
    """
    Update user profile
    Fields: firstName, lastName, contactNum, birthDate
    """
    from .mobile_services import update_user_profile_mobile

    try:
        user = request.auth
        result = update_user_profile_mobile(user, payload)

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to update profile')},
                status=400
            )
    except Exception as e:
        print(f"[ERROR] Mobile update profile error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to update profile"},
            status=500
        )


@mobile_router.post("/profile/upload-image", auth=jwt_auth)
def mobile_upload_profile_image(request):
    """
    Upload profile image
    Expects multipart/form-data with 'profile_image' file
    """
    from .mobile_services import upload_profile_image_mobile

    try:
        user = request.auth

        if 'profile_image' not in request.FILES:
            return Response(
                {"error": "No image file provided"},
                status=400
            )

        image_file = request.FILES['profile_image']
        result = upload_profile_image_mobile(user, image_file)

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to upload image')},
                status=400
            )
    except Exception as e:
        print(f"[ERROR] Mobile upload profile image error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to upload profile image"},
            status=500
        )

#endregion

#region MOBILE WORKER & JOB LISTING ENDPOINTS

@mobile_router.get("/workers/list", auth=jwt_auth)
def mobile_workers_list(request, latitude: float = None, longitude: float = None,
                        page: int = 1, limit: int = 20):
    """
    Get list of workers for clients
    Optional location parameters for distance calculation
    """
    from .mobile_services import get_workers_list_mobile

    try:
        user = request.auth
        result = get_workers_list_mobile(
            user=user,
            latitude=latitude,
            longitude=longitude,
            page=page,
            limit=limit
        )

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch workers')},
                status=400
            )
    except Exception as e:
        print(f"[ERROR] Mobile workers list error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch workers"},
            status=500
        )


@mobile_router.get("/workers/{worker_id}", auth=jwt_auth)
def mobile_worker_detail(request, worker_id: int):
    """
    Get worker profile details
    """
    from .mobile_services import get_worker_detail_mobile

    try:
        user = request.auth
        result = get_worker_detail_mobile(user, worker_id)

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Worker not found')},
                status=404
            )
    except Exception as e:
        print(f"[ERROR] Mobile worker detail error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch worker details"},
            status=500
        )


@mobile_router.get("/jobs/my-jobs", auth=jwt_auth)
def mobile_my_jobs(request, status: str = None, page: int = 1, limit: int = 20):
    """
    Get user's jobs (different for CLIENT vs WORKER)
    - CLIENT: Jobs they posted
    - WORKER: Jobs they applied to or are assigned to

    Optional status filter: ACTIVE, IN_PROGRESS, COMPLETED, PENDING
    """
    from .mobile_services import get_my_jobs_mobile

    try:
        user = request.auth
        result = get_my_jobs_mobile(
            user=user,
            status=status,
            page=page,
            limit=limit
        )

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch jobs')},
                status=400
            )
    except Exception as e:
        print(f"[ERROR] Mobile my jobs error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch jobs"},
            status=500
        )


@mobile_router.get("/jobs/available", auth=jwt_auth)
def mobile_available_jobs(request, page: int = 1, limit: int = 20):
    """
    Get available jobs for workers to apply to
    Only shows ACTIVE jobs that worker hasn't applied to
    """
    from .mobile_services import get_available_jobs_mobile

    try:
        user = request.auth
        result = get_available_jobs_mobile(
            user=user,
            page=page,
            limit=limit
        )

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch jobs')},
                status=400
            )
    except Exception as e:
        print(f"[ERROR] Mobile available jobs error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch available jobs"},
            status=500
        )

#endregion

#region MOBILE WALLET ENDPOINTS

@mobile_router.get("/wallet/balance", auth=jwt_auth)
def mobile_get_wallet_balance(request):
    """Get current user's wallet balance - Mobile"""
    try:
        from .models import Wallet
        
        # Get or create wallet for the user
        wallet, created = Wallet.objects.get_or_create(
            accountFK=request.auth,
            defaults={'balance': 0.00}
        )
        
        print(f"💵 [Mobile] Balance request for user {request.auth.email}: ₱{wallet.balance}")
        
        return {
            "success": True,
            "balance": float(wallet.balance),
            "created": created
        }
        
    except Exception as e:
        print(f"❌ [Mobile] Error fetching wallet balance: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch wallet balance"},
            status=500
        )


@mobile_router.post("/wallet/deposit", auth=jwt_auth)
def mobile_deposit_funds(request, amount: float, payment_method: str = "GCASH"):
    """
    Mobile wallet deposit via Xendit GCash
    TEST MODE: Transaction auto-approved, funds added immediately
    """
    try:
        from .models import Wallet, Transaction, Profile
        from .xendit_service import XenditService
        from decimal import Decimal
        from django.utils import timezone
        
        print(f"📥 [Mobile] Deposit request: ₱{amount} from {request.auth.email}")
        
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
            user_name = request.auth.email.split('@')[0]
        
        print(f"💰 Current balance: ₱{wallet.balance}")
        
        # TEST MODE: Add funds immediately
        wallet.balance += Decimal(str(amount))
        wallet.save()
        
        # Create completed transaction
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
        
        print(f"✅ New balance: ₱{wallet.balance}")
        
        # Create Xendit invoice
        xendit_result = XenditService.create_gcash_payment(
            amount=amount,
            user_email=request.auth.email,
            user_name=user_name,
            transaction_id=transaction.transactionID
        )
        
        if not xendit_result.get("success"):
            return Response(
                {"error": "Failed to create payment invoice"},
                status=500
            )
        
        # Update transaction with Xendit details
        transaction.xenditInvoiceID = xendit_result['invoice_id']
        transaction.xenditExternalID = xendit_result['external_id']
        transaction.invoiceURL = xendit_result['invoice_url']
        transaction.xenditPaymentChannel = "GCASH"
        transaction.xenditPaymentMethod = "EWALLET"
        transaction.save()
        
        print(f"📄 Invoice created: {xendit_result['invoice_id']}")
        
        return {
            "success": True,
            "transaction_id": transaction.transactionID,
            "payment_url": xendit_result['invoice_url'],
            "invoice_id": xendit_result['invoice_id'],
            "amount": amount,
            "new_balance": float(wallet.balance),
            "expiry_date": xendit_result['expiry_date'],
            "message": "Funds added successfully"
        }
        
    except Exception as e:
        print(f"❌ [Mobile] Error depositing funds: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to deposit funds"},
            status=500
        )


@mobile_router.get("/wallet/transactions", auth=jwt_auth)
def mobile_get_transactions(request):
    """Get wallet transaction history - Mobile"""
    try:
        from .models import Wallet, Transaction
        
        # Get user's wallet
        wallet = Wallet.objects.filter(accountFK=request.auth).first()
        
        if not wallet:
            return {
                "success": True,
                "transactions": []
            }
        
        # Get transactions
        transactions = Transaction.objects.filter(
            walletID=wallet
        ).order_by('-createdAt')[:50]  # Last 50 transactions
        
        transaction_list = []
        for t in transactions:
            transaction_list.append({
                'transactionID': t.transactionID,
                'transactionType': t.transactionType,
                'amount': float(t.amount),
                'balanceAfter': float(t.balanceAfter),
                'status': t.status,
                'description': t.description,
                'paymentMethod': t.paymentMethod,
                'invoiceURL': t.invoiceURL,
                'createdAt': t.createdAt.isoformat(),
                'completedAt': t.completedAt.isoformat() if t.completedAt else None,
            })
        
        return {
            "success": True,
            "transactions": transaction_list
        }
        
    except Exception as e:
        print(f"❌ [Mobile] Error fetching transactions: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch transactions"},
            status=500
        )

#endregion
