from ninja import Router, Form, File
from ninja.files import UploadedFile
from .schemas import (
    createAccountSchema, logInSchema, createAgencySchema, 
    forgotPasswordSchema, resetPasswordSchema, assignRoleSchema, 
    KYCUploadSchema, KYCStatusResponse, KYCUploadResponse,
    UpdateLocationSchema, LocationResponseSchema, 
    ToggleLocationSharingSchema, NearbyWorkersSchema
)
from .services import (
    create_account_individ, create_account_agency, login_account, 
    _verify_account, forgot_password_request, reset_password_verify, 
    logout_account, refresh_token, fetch_currentUser, generateCookie, 
    assign_role, upload_kyc_document, get_kyc_status, get_pending_kyc_submissions,
    update_user_location, toggle_location_sharing, get_user_location, find_nearby_workers
)
from ninja.responses import Response
from .authentication import cookie_auth
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
    
@router.post("/upload/kyc")
def upload_kyc(request):
    try:
        accountID = int(request.POST.get("accountID"))
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


@router.get("/notifications", auth=cookie_auth)
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


@router.get("/notifications/unread-count", auth=cookie_auth)
def get_unread_count(request):
    """
    Get the count of unread notifications for the authenticated user.
    """
    try:
        from .services import get_unread_notification_count
        
        user = request.auth
        count = get_unread_notification_count(user.accountID)
        
        return {"success": True, "unreadCount": count}
        
    except Exception as e:
        print(f"❌ Error getting unread count: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": "Failed to get unread count"}


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
