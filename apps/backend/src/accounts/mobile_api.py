# mobile_api.py
# Mobile-specific API endpoints optimized for Flutter app

from ninja import Router
from ninja.responses import Response
from typing import Optional
from .schemas import (
    createAccountSchema,
    logInSchema,
    assignRoleSchema,
    AssignRoleMobileSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    CreateJobMobileSchema,
    CreateInviteJobMobileSchema,
    ApplyJobMobileSchema,
    UpdateApplicationMobileSchema,
    ApproveCompletionMobileSchema,
    SubmitReviewMobileSchema,
    SendMessageMobileSchema,
    DepositFundsSchema,
    WithdrawFundsSchema,
    SendVerificationEmailSchema,
    SendOTPEmailSchema,
    SwitchProfileSchema,
    AddPaymentMethodSchema,
    AddSkillSchema,
    UpdateSkillSchema,
    UpdateProfileMobileSchema,
)
from .authentication import jwt_auth, dual_auth  # Use Bearer token auth for mobile, dual_auth for endpoints that support both
from .profile_metrics_service import get_profile_metrics

# Create mobile router
mobile_router = Router(tags=["Mobile API"])

# Lightweight structured logging helper for mobile endpoints
def _log_mobile(event: str, **details):
    try:
        context = " | ".join(
            [
                f"{key}={value}"
                for key, value in details.items()
                if value is not None and value != ""
            ]
        )
        print(f"[MOBILE] {event}: {context}")
    except Exception:
        # Avoid breaking handlers due to logging errors
        print(f"[MOBILE] {event}: <logging failed>")

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

    print(f"📱 [MOBILE LOGIN] Request received for: {payload.email}")
    
    try:
        result = login_account(payload)
        print(f"   Login result type: {type(result)}")

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


@mobile_router.post("/auth/send-verification-email")
def mobile_send_verification_email(request, payload: SendVerificationEmailSchema):
    """
    Send verification email via Resend API for mobile registration
    This endpoint is called after successful registration to trigger email verification
    """
    import requests
    from django.conf import settings
    
    print(f"📧 [Mobile] Send verification email request for: {payload.email}")
    
    try:
        # Validate required environment variables
        resend_api_key = settings.RESEND_API_KEY
        if not resend_api_key:
            print("❌ [Mobile] RESEND_API_KEY not configured")
            return Response(
                {"error": "Email service not configured"},
                status=500
            )
        
        # Generate HTML email template
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="padding: 40px 30px; text-align: center;">
                                    <h1 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: bold;">
                                        Verify Your Email Address
                                    </h1>
                                    <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                                        Thank you for registering with iAyos! Please verify your email address to complete your registration.
                                    </p>
                                    <a href="{payload.verifyLink}" style="display: inline-block; padding: 14px 40px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold;">
                                        Verify Email Address
                                    </a>
                                    <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                                        If you didn't create an account, you can safely ignore this email.
                                    </p>
                                    <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; line-height: 1.5;">
                                        This link will expire on {payload.verifyLinkExpire}
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        # Call Resend API
        resend_url = f"{settings.RESEND_BASE_URL}/emails"
        headers = {
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json"
        }
        
        resend_payload = {
            "from": "team@devante.online",
            "to": [payload.email],
            "subject": "Verify Your Email - iAyos",
            "html": html_template
        }
        
        print(f"📧 [Mobile] Sending email to: {payload.email}")
        response = requests.post(resend_url, headers=headers, json=resend_payload, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ [Mobile] Email sent successfully. ID: {result.get('id')}")
            return {
                "success": True,
                "messageId": result.get('id'),
                "method": "resend-api"
            }
        else:
            print(f"❌ [Mobile] Resend API error: {response.status_code} - {response.text}")
            return Response(
                {
                    "error": "Failed to send verification email",
                    "details": response.text if settings.DEBUG else None
                },
                status=502
            )
            
    except requests.exceptions.Timeout:
        print("❌ [Mobile] Resend API timeout")
        return Response(
            {"error": "Email service timeout. Please try again."},
            status=504
        )
    except Exception as e:
        print(f"❌ [Mobile] Send email exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to send verification email"},
            status=500
        )


@mobile_router.post("/auth/send-otp-email")
def mobile_send_otp_email(request, payload: SendOTPEmailSchema):
    """
    Send OTP verification email via Resend API.
    This replaces the link-based verification with a 6-digit OTP code.
    """
    import requests
    from django.conf import settings
    
    print(f"📧 [Mobile] Send OTP email request for: {payload.email}")
    
    try:
        # Validate required environment variables
        resend_api_key = settings.RESEND_API_KEY
        resend_base_url = getattr(settings, 'RESEND_BASE_URL', 'https://api.resend.com')
        
        print(f"🔍 [Mobile] Checking email service configuration...")
        print(f"🔍 [Mobile] RESEND_API_KEY configured: {bool(resend_api_key)}")
        print(f"🔍 [Mobile] RESEND_BASE_URL: {resend_base_url}")
        
        if not resend_api_key:
            print("❌ [Mobile] RESEND_API_KEY not configured in environment")
            return Response(
                {"error": "Email service not configured. Please contact support."},
                status=500
            )
        
        # Generate OTP HTML email template
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td align="center" style="padding: 40px 0;">
                        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="padding: 40px 30px; text-align: center;">
                                    <h1 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: bold;">
                                        Your Verification Code
                                    </h1>
                                    <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                                        Use the following code to verify your email address:
                                    </p>
                                    <div style="display: inline-block; padding: 20px 40px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #007bff;">
                                            {payload.otp_code}
                                        </span>
                                    </div>
                                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                                        This code will expire in <strong>{payload.expires_in_minutes} minutes</strong>.
                                    </p>
                                    <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.5;">
                                        If you didn't request this code, you can safely ignore this email.
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                                    <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                                        © 2026 iAyos. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        # Call Resend API
        resend_url = f"{resend_base_url}/emails"
        headers = {
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json"
        }
        
        resend_payload = {
            "from": "team@devante.online",
            "to": [payload.email],
            "subject": f"Your iAyos Verification Code: {payload.otp_code}",
            "html": html_template
        }
        
        print(f"📧 [Mobile] Sending OTP email to: {payload.email}")
        print(f"📧 [Mobile] Using Resend URL: {resend_url}")
        response = requests.post(resend_url, headers=headers, json=resend_payload, timeout=10)
        print(f"📧 [Mobile] Resend API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ [Mobile] OTP email sent successfully. ID: {result.get('id')}")
            return {
                "success": True,
                "messageId": result.get('id'),
                "method": "resend-api-otp"
            }
        else:
            print(f"❌ [Mobile] Resend API error: {response.status_code} - {response.text}")
            return Response(
                {
                    "error": "Failed to send verification email",
                    "details": response.text if settings.DEBUG else None
                },
                status=502
            )
            
    except requests.exceptions.Timeout:
        print("❌ [Mobile] Resend API timeout")
        return Response(
            {"error": "Email service timeout. Please try again."},
            status=504
        )
    except Exception as e:
        print(f"❌ [Mobile] Send OTP email exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to send verification email"},
            status=500
        )


@mobile_router.get("/payment-verified", auth=None)
def payment_verification_redirect(request, success: bool = True, method_id: int = None):
    """
    Auto-redirect page for PayMongo payment verification.
    Automatically redirects back to the app using deep link, then closes browser.
    This page is displayed after PayMongo redirects back.
    """
    from django.http import HttpResponse
    
    if success:
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Verification Complete</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    color: white;
                    text-align: center;
                }
                .container {
                    padding: 40px;
                    max-width: 400px;
                }
                .icon { font-size: 80px; margin-bottom: 20px; }
                h1 { font-size: 24px; margin-bottom: 10px; }
                p { font-size: 16px; opacity: 0.9; }
                .close-hint {
                    margin-top: 30px;
                    padding: 15px 30px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 25px;
                    font-size: 14px;
                    cursor: pointer;
                }
            </style>
            <script>
                // Try to return to the app immediately
                function returnToApp() {
                    // Try Expo deep link first
                    window.location.href = 'iayosmobile://profile/payment-methods?verified=true';
                }
                
                // Auto-trigger after a short delay
                setTimeout(function() {
                    returnToApp();
                    
                    // If still here after 1 second, try to close
                    setTimeout(function() {
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage('close');
                        }
                        window.close();
                        
                        // Update hint if still visible
                        setTimeout(function() {
                            var hint = document.querySelector('.close-hint');
                            if (hint) {
                                hint.textContent = 'Tap here or "Done" to return to the app';
                                hint.onclick = returnToApp;
                            }
                        }, 500);
                    }, 1000);
                }, 1500);
            </script>
        </head>
        <body>
            <div class="container">
                <div class="icon">✓</div>
                <h1>Verification Successful!</h1>
                <p>Your GCash account has been verified. ₱1 has been credited to your wallet.</p>
                <div class="close-hint" onclick="returnToApp()">Returning to app...</div>
            </div>
        </body>
        </html>
        """
    else:
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Verification Failed</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
                    color: white;
                    text-align: center;
                }
                .container {
                    padding: 40px;
                    max-width: 400px;
                }
                .icon { font-size: 80px; margin-bottom: 20px; }
                h1 { font-size: 24px; margin-bottom: 10px; }
                p { font-size: 16px; opacity: 0.9; }
                .close-hint {
                    margin-top: 30px;
                    padding: 15px 30px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 25px;
                    font-size: 14px;
                    cursor: pointer;
                }
            </style>
            <script>
                function returnToApp() {
                    window.location.href = 'iayosmobile://profile/payment-methods?verified=false';
                }
                
                setTimeout(function() {
                    returnToApp();
                    
                    setTimeout(function() {
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage('close');
                        }
                        window.close();
                        
                        setTimeout(function() {
                            var hint = document.querySelector('.close-hint');
                            if (hint) {
                                hint.textContent = 'Tap here or "Done" to return to the app';
                                hint.onclick = returnToApp;
                            }
                        }, 500);
                    }, 1000);
                }, 2000);
            </script>
        </head>
        <body>
            <div class="container">
                <div class="icon">✗</div>
                <h1>Verification Failed</h1>
                <p>The payment was not completed. Please try adding your payment method again.</p>
                <div class="close-hint" onclick="returnToApp()">Returning to app...</div>
            </div>
        </body>
        </html>
        """
    
    return HttpResponse(html, content_type='text/html')


@mobile_router.get("/auth/profile", auth=jwt_auth)
def mobile_get_profile(request):
    print(f"📱 [MOBILE PROFILE] Request received for user: {request.auth.email if request.auth else 'None'}")
    """
    Get current user profile for mobile
    Returns mobile-optimized user data
    Uses profile_type from JWT token if available
    """
    from .services import fetch_currentUser

    try:
        user = request.auth
        
        # Get profile_type from JWT if available
        profile_type = getattr(user, 'profile_type', None)
        
        print(f"[SUCCESS] Mobile /auth/profile - User: {user.email}, Profile Type: {profile_type}")
        result = fetch_currentUser(user.accountID, profile_type=profile_type)
        return result
    except Exception as e:
        print(f"[ERROR] Mobile profile error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch profile"},
            status=500
        )


@mobile_router.get("/profile/metrics", auth=jwt_auth)
def mobile_profile_metrics(request):
    """Return trust & performance metrics for the authenticated account."""
    try:
        user = request.auth
        metrics = get_profile_metrics(user)
        return metrics
    except Exception as e:
        print(f"[ERROR] Mobile profile metrics error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch profile metrics"},
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
    max_distance: float = None,  # NEW: Distance filter
    sort_by: str = None,  # NEW: Sort option
    page: int = 1,
    limit: int = 20
):
    """
    Get paginated job listings optimized for mobile
    Returns minimal fields for list view performance
    
    NEW PARAMETERS:
    - max_distance: Filter jobs within X km radius (requires user location)
    - sort_by: 'distance_asc', 'distance_desc', 'budget_asc', 'budget_desc', 
               'created_desc', 'urgency_desc'
    """
    from .mobile_services import get_mobile_job_list

    print(f"📱 [MOBILE JOB LIST] Request received")
    print(f"   User: {request.auth.email}")
    print(f"   Filters: category={category}, budget={min_budget}-{max_budget}, location={location}")
    print(f"   Distance: max_distance={max_distance} km, sort_by={sort_by}")
    print(f"   Pagination: page={page}, limit={limit}")
    
    try:
        result = get_mobile_job_list(
            user=request.auth,
            category_id=category,
            min_budget=min_budget,
            max_budget=max_budget,
            location=location,
            max_distance=max_distance,  # NEW
            sort_by=sort_by,  # NEW
            page=page,
            limit=limit
        )
        
        print(f"   Result success: {result.get('success')}")
        if result.get('success'):
            job_count = len(result['data'].get('jobs', []))
            print(f"   Returning {job_count} jobs")

        if result['success']:
            return result['data']
        else:
            error_msg = result.get('error', 'Failed to fetch jobs')
            print(f"[ERROR] Mobile job list service error: {error_msg}")
            return Response(
                {"error": error_msg},
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


@mobile_router.get("/jobs/my-jobs", auth=jwt_auth)
def mobile_my_jobs(
    request, 
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    """Return jobs relevant to the authenticated user (client or worker)."""
    from .models import Profile, ClientProfile, WorkerProfile, JobPosting, JobApplication, JobDispute
    from jobs.models import JobPosting
    from django.db.models import Q

    print("\n" + "="*80)
    print(f"📱 [MY JOBS] Request received")
    print(f"   User: {request.auth.email}")
    print(f"   Query params: status={status}, page={page}, limit={limit}")
    print(f"   Query params types: status={type(status).__name__}, page={type(page).__name__}, limit={type(limit).__name__}")
    
    try:
        status_filter = status

        print(f"\n   🔍 Processing parameters:")
        print(f"      Status filter: {status_filter} (type: {type(status_filter).__name__})")
        print(f"      Page: {page} (type: {type(page).__name__})")
        print(f"      Limit: {limit} (type: {type(limit).__name__})")
        
        # Get user's profile
        print(f"\n   👤 Fetching user profile...")
        try:
            # Get profile_type from JWT if available, try both if not found
            profile_type = getattr(request.auth, 'profile_type', None)
            
            if profile_type:
                profile = Profile.objects.filter(
                    accountFK=request.auth,
                    profileType=profile_type
                ).first()
            else:
                # Fallback: get any profile
                profile = Profile.objects.filter(accountFK=request.auth).first()
            
            if not profile:
                print(f"      ❌ Profile not found for user!")
                return Response({"error": "Profile not found"}, status=400)
            
            print(f"      Profile found: ID={profile.profileID}, Type={profile.profileType}")
        except Exception as e:
            print(f"      ❌ Error fetching profile: {e}")
            return Response({"error": "Failed to fetch profile"}, status=500)
        
        # CLIENT: Jobs they posted
        if profile.profileType == 'CLIENT':
            print(f"\n   📋 CLIENT mode: Fetching posted jobs...")
            try:
                client_profile = ClientProfile.objects.get(profileID=profile)
                print(f"      Client profile found: ID={client_profile.profileID.profileID}")
            except ClientProfile.DoesNotExist:
                # Auto-create ClientProfile if it doesn't exist
                print(f"      ⚠️ Client profile not found, creating one...")
                client_profile = ClientProfile.objects.create(
                    profileID=profile,
                    description="",
                    totalJobsPosted=0,
                    clientRating=0
                )
                print(f"      ✅ Created client profile: ID={client_profile.profileID.profileID}")
            
            jobs_qs = JobPosting.objects.filter(
                clientID=client_profile
            ).select_related(
                'categoryID',
                'assignedWorkerID__profileID__accountFK',
                'assignedAgencyFK__accountFK'
            ).prefetch_related('photos')
            print(f"      Jobs query created for client")
        
        # WORKER: Jobs they applied to or assigned to
        elif profile.profileType == 'WORKER':
            print(f"\n   🔧 WORKER mode: Fetching applied/assigned jobs...")
            try:
                worker_profile = WorkerProfile.objects.get(profileID=profile)
                print(f"      Worker profile found: ID={worker_profile.profileID.profileID}")
            except WorkerProfile.DoesNotExist:
                print(f"      ❌ Worker profile not found!")
                return Response({"error": "Worker profile not found"}, status=400)
            
            applied_job_ids = JobApplication.objects.filter(
                workerID=worker_profile
            ).values_list('jobID', flat=True)
            print(f"      Found {len(applied_job_ids)} applications")
            
            jobs_qs = JobPosting.objects.filter(
                Q(assignedWorkerID=worker_profile) | Q(jobID__in=applied_job_ids)
            ).select_related(
                'clientID__profileID__accountFK',
                'categoryID',
                'assignedAgencyFK__accountFK'
            ).prefetch_related('photos')
            print(f"      Jobs query created for worker")
        else:
            print(f"      ❌ Invalid profile type: {profile.profileType}")
            return Response({"error": "Invalid profile type"}, status=400)
        
        # Filter by status if provided (supports comma-separated values like "COMPLETED,CANCELLED")
        if status_filter:
            statuses = [s.strip().upper() for s in status_filter.split(',')]
            print(f"\n   🔎 Filtering by status: {statuses}")
            if len(statuses) == 1:
                jobs_qs = jobs_qs.filter(status=statuses[0])
            else:
                jobs_qs = jobs_qs.filter(status__in=statuses)
        
        # Order by created date
        jobs_qs = jobs_qs.order_by('-createdAt')
        
        total_count = jobs_qs.count()
        print(f"\n   📊 Query results:")
        print(f"      Total jobs found: {total_count}")
        
        # Pagination
        offset = (page - 1) * limit
        jobs = jobs_qs[offset:offset + limit]
        print(f"      Returning jobs {offset + 1} to {offset + len(jobs)}")
        
        job_list = []
        for idx, job in enumerate(jobs):
            print(f"      Processing job {idx + 1}/{len(jobs)}: ID={job.jobID}, Title='{job.title[:30]}...'")
            assigned_agency = getattr(job, 'assignedAgencyFK', None)

            job_data = {
                'job_id': job.jobID,
                'title': job.title,
                'description': job.description,
                'budget': float(job.budget) if job.budget else 0.0,
                'location': job.location or '',
                'status': job.status,
                'urgency_level': job.urgency,
                'category_name': job.categoryID.specializationName if job.categoryID else 'General',
                'created_at': job.createdAt.isoformat() if job.createdAt else None,
                'job_type': job.jobType,  # LISTING or INVITE
                'invite_status': job.inviteStatus,  # PENDING, ACCEPTED, REJECTED
                'assigned_worker_id': job.assignedWorkerID.profileID.profileID if job.assignedWorkerID else None,
                'assigned_agency_id': assigned_agency.agencyId if assigned_agency else None,
                'has_backjob': JobDispute.objects.filter(jobID=job).exists(),  # Check if backjob/dispute exists
                # Team Job Fields
                'is_team_job': job.is_team_job,
                'total_workers_needed': job.total_workers_needed if job.is_team_job else None,
                'total_workers_assigned': job.total_workers_assigned if job.is_team_job else None,
                'team_fill_percentage': job.team_fill_percentage if job.is_team_job else None,
            }
            
            if job.clientID:
                client_prof = job.clientID.profileID
                job_data['client_name'] = f"{client_prof.firstName or ''} {client_prof.lastName or ''}".strip()
                job_data['client_img'] = client_prof.profileImg or ''
            
            if job.assignedWorkerID:
                worker_prof = job.assignedWorkerID.profileID
                job_data['worker_name'] = f"{worker_prof.firstName or ''} {worker_prof.lastName or ''}".strip()
                job_data['worker_img'] = worker_prof.profileImg or ''

            if assigned_agency:
                job_data['agency_name'] = getattr(assigned_agency, 'businessName', '')
                job_data['agency_logo'] = getattr(assigned_agency, 'logo', '')
            
            if profile.profileType == 'WORKER':
                application = JobApplication.objects.filter(
                    jobID=job,
                    workerID=worker_profile
                ).first()
                if application:
                    job_data['application_status'] = application.status
            
            # DEBUG: Log the job data being added
            print(f"         → job_type={job_data.get('job_type')}, invite_status={job_data.get('invite_status')}, assigned_worker_id={job_data.get('assigned_worker_id')}")
            
            # EXTRA DEBUG for INVITE jobs
            if job_data.get('job_type') == 'INVITE':
                print(f"         🎯 INVITE JOB DETAILS:")
                print(f"            - Job ID: {job.jobID}")
                print(f"            - Title: {job.title}")
                print(f"            - assignedWorkerID: {job.assignedWorkerID}")
                if job.assignedWorkerID:
                    print(f"            - assignedWorkerID.profileID: {job.assignedWorkerID.profileID}")
                    print(f"            - assignedWorkerID.profileID.profileID: {job.assignedWorkerID.profileID.profileID}")
                print(f"            - assigned_worker_id in response: {job_data.get('assigned_worker_id')}")
                print(f"            - Current worker profile ID: {worker_profile.profileID.profileID if profile.profileType == 'WORKER' else 'N/A'}")
            
            job_list.append(job_data)
            
            # 🔧 CONTINGENCY: Auto-create conversations for fully-filled team jobs missing them
            if profile.profileType == 'CLIENT' and job.is_team_job and job.status == 'ACTIVE':
                from profiles.models import Conversation, ConversationParticipant
                from accounts.models import JobWorkerAssignment
                
                print(f"\n      🔍 CONTINGENCY CHECK: Job #{job.jobID} '{job.title}'")
                print(f"         - can_start_team_job: {job.can_start_team_job}")
                print(f"         - workers: {job.total_workers_assigned}/{job.total_workers_needed}")
                
                if job.can_start_team_job:
                    existing_conv = Conversation.objects.filter(relatedJobPosting=job).first()
                    print(f"         - existing conversation: {'YES' if existing_conv else 'NO'}")
                    
                    if not existing_conv:
                        print(f"\n   🚨 CONTINGENCY: Creating missing conversation for job #{job.jobID}")
                        try:
                            conversation = Conversation.objects.create(
                                client=job.clientID.profileID if job.clientID else None,
                                worker=None,
                                relatedJobPosting=job,
                                status=Conversation.ConversationStatus.ACTIVE,
                                conversation_type='TEAM_GROUP'
                            )
                            
                            if job.clientID:
                                ConversationParticipant.objects.create(
                                    conversation=conversation,
                                    profile=job.clientID.profileID,
                                    participant_type='CLIENT'
                                )
                            
                            assignments = JobWorkerAssignment.objects.filter(
                                jobID=job,
                                assignment_status='ACTIVE'
                            ).select_related('workerID__profileID')
                            
                            for assign in assignments:
                                ConversationParticipant.objects.get_or_create(
                                    conversation=conversation,
                                    profile=assign.workerID.profileID,
                                    defaults={'participant_type': 'WORKER', 'skill_slot': assign.skillSlotID}
                                )
                            
                            print(f"      ✅ Created conversation #{conversation.conversationID}")
                            
                            from accounts.models import Notification
                            Notification.objects.create(
                                accountFK=job.clientID.profileID.accountFK,
                                notificationType="TEAM_JOB_READY",
                                title="Team Ready!",
                                message=f"All positions for '{job.title}' have been filled.",
                                relatedJobID=job.jobID
                            )
                            
                            for assign in assignments:
                                Notification.objects.create(
                                    accountFK=assign.workerID.profileID.accountFK,
                                    notificationType="TEAM_JOB_READY",
                                    title="Team Complete!",
                                    message=f"The team for '{job.title}' is now complete.",
                                    relatedJobID=job.jobID
                                )
                        except Exception as e:
                            print(f"      ❌ Error: {str(e)}")
                            import traceback
                            traceback.print_exc()
        
        print(f"\n   ✅ SUCCESS: Returning {len(job_list)} jobs")
        print(f"      Total count: {total_count}")
        print(f"      Page: {page}/{(total_count + limit - 1) // limit}")
        print("="*80 + "\n")
        
        return {
            'jobs': job_list,
            'total_count': total_count,
            'page': page,
            'pages': (total_count + limit - 1) // limit,
            'profile_type': profile.profileType
        }
        
    except Exception as e:
        print(f"\n❌ [ERROR] Mobile my jobs exception occurred!")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Error message: {str(e)}")
        print(f"   User: {request.auth.email if hasattr(request, 'auth') else 'Unknown'}")
        print(f"\n   Full traceback:")
        import traceback
        traceback.print_exc()
        print("="*80 + "\n")
        return Response({"error": f"Failed to fetch jobs: {str(e)}"}, status=500)


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


@mobile_router.get("/skills/available", auth=jwt_auth)
def mobile_available_skills(request):
    """
    Get all available skills (specializations) for skill picker
    Returns: List of skills with id, name, description, minimumRate
    """
    from .models import Specializations

    try:
        skills = Specializations.objects.all().order_by('specializationName')
        
        skills_data = [
            {
                'id': skill.specializationID,
                'name': skill.specializationName,
                'description': skill.description or '',
                'minimumRate': float(skill.minimumRate) if skill.minimumRate else 0.0,
                'rateType': skill.rateType,
                'skillLevel': skill.skillLevel,
            }
            for skill in skills
        ]
        
        return {
            'success': True,
            'data': skills_data,
            'count': len(skills_data)
        }
    except Exception as e:
        print(f"[ERROR] Mobile available skills error: {str(e)}")
        return Response(
            {"error": "Failed to fetch available skills"},
            status=500
        )


@mobile_router.get("/skills/my-skills", auth=jwt_auth)
def mobile_my_skills(request):
    """
    Get current worker's skills (specializations they have added)
    Returns: List of skills the worker has with id, name, experience years
    """
    from .models import WorkerProfile, workerSpecialization

    try:
        user = request.auth
        
        # Get worker profile
        try:
            worker_profile = WorkerProfile.objects.get(profileID__accountFK=user)
        except WorkerProfile.DoesNotExist:
            return Response(
                {"error": "Worker profile not found"},
                status=404
            )
        
        # Get worker's specializations
        worker_skills = workerSpecialization.objects.filter(
            workerID=worker_profile
        ).select_related('specializationID').order_by('specializationID__specializationName')
        
        skills_data = [
            {
                'id': ws.id,  # workerSpecialization ID - used for linking certifications
                'specializationId': ws.specializationID.specializationID,  # Specializations table ID
                'name': ws.specializationID.specializationName,
                'description': ws.specializationID.description or '',
                'experienceYears': ws.experienceYears,
                'certification': ws.certification or '',
            }
            for ws in worker_skills
        ]
        
        return {
            'success': True,
            'data': skills_data,
            'count': len(skills_data)
        }
    except Exception as e:
        print(f"[ERROR] Mobile my skills error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch your skills"},
            status=500
        )


@mobile_router.get("/skills/available", auth=jwt_auth)
def mobile_available_skills(request):
    """
    Get all available specializations that workers can add to their profile.
    Returns: List of all specializations with id, name, description, rates
    """
    from .models import Specializations

    try:
        specializations = Specializations.objects.all().order_by('specializationName')
        
        skills_data = [
            {
                'id': spec.specializationID,
                'name': spec.specializationName,
                'description': spec.description or '',
                'minimumRate': float(spec.minimumRate),
                'rateType': spec.rateType,
                'skillLevel': spec.skillLevel,
            }
            for spec in specializations
        ]
        
        return {
            'success': True,
            'data': skills_data,
            'count': len(skills_data)
        }
    except Exception as e:
        print(f"[ERROR] Mobile available skills error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch available skills"},
            status=500
        )


@mobile_router.post("/skills/add", auth=jwt_auth)
def mobile_add_skill(request, payload: AddSkillSchema):
    """
    Add a skill (specialization) to worker's profile.
    Payload: { specialization_id: int, experience_years: int }
    """
    from .models import WorkerProfile, workerSpecialization, Specializations

    try:
        user = request.auth
        
        # Get values from schema
        specialization_id = payload.specialization_id
        experience_years = payload.experience_years
        
        if not specialization_id:
            return Response(
                {"error": "specialization_id is required"},
                status=400
            )
        
        if experience_years < 0 or experience_years > 50:
            return Response(
                {"error": "experience_years must be between 0 and 50"},
                status=400
            )
        
        # Get worker profile
        try:
            worker_profile = WorkerProfile.objects.get(profileID__accountFK=user)
        except WorkerProfile.DoesNotExist:
            return Response(
                {"error": "Worker profile not found"},
                status=404
            )
        
        # Check specialization exists
        try:
            specialization = Specializations.objects.get(specializationID=specialization_id)
        except Specializations.DoesNotExist:
            return Response(
                {"error": "Specialization not found"},
                status=404
            )
        
        # Check if worker already has this skill
        if workerSpecialization.objects.filter(
            workerID=worker_profile,
            specializationID=specialization
        ).exists():
            return Response(
                {"error": f"You already have '{specialization.specializationName}' as a skill"},
                status=400
            )
        
        # Create worker specialization
        worker_skill = workerSpecialization.objects.create(
            workerID=worker_profile,
            specializationID=specialization,
            experienceYears=experience_years,
            certification=''
        )
        
        print(f"✅ [SKILL] Added skill '{specialization.specializationName}' to {user.email}")
        
        return {
            'success': True,
            'message': f"Added '{specialization.specializationName}' to your skills",
            'data': {
                'id': specialization.specializationID,
                'workerSkillId': worker_skill.id,
                'name': specialization.specializationName,
                'experienceYears': experience_years,
            }
        }
    except Exception as e:
        print(f"[ERROR] Mobile add skill error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to add skill"},
            status=500
        )


@mobile_router.put("/skills/{skill_id}", auth=jwt_auth)
def mobile_update_skill(request, skill_id: int, payload: UpdateSkillSchema):
    """
    Update experience years for a worker's skill.
    skill_id: The specialization ID (not workerSpecialization ID)
    Payload: { experience_years: int }
    """
    from .models import WorkerProfile, workerSpecialization

    try:
        user = request.auth
        experience_years = payload.experience_years
        
        if experience_years is None:
            return Response(
                {"error": "experience_years is required"},
                status=400
            )
        
        if experience_years < 0 or experience_years > 50:
            return Response(
                {"error": "experience_years must be between 0 and 50"},
                status=400
            )
        
        # Get worker profile
        try:
            worker_profile = WorkerProfile.objects.get(profileID__accountFK=user)
        except WorkerProfile.DoesNotExist:
            return Response(
                {"error": "Worker profile not found"},
                status=404
            )
        
        # Get worker's skill
        try:
            worker_skill = workerSpecialization.objects.get(
                workerID=worker_profile,
                specializationID_id=skill_id
            )
        except workerSpecialization.DoesNotExist:
            return Response(
                {"error": "Skill not found in your profile"},
                status=404
            )
        
        # Update experience years
        worker_skill.experienceYears = experience_years
        worker_skill.save()
        
        print(f"✅ [SKILL] Updated skill experience for {user.email}: {worker_skill.specializationID.specializationName} = {experience_years} years")
        
        return {
            'success': True,
            'message': 'Skill updated successfully',
            'data': {
                'id': skill_id,
                'name': worker_skill.specializationID.specializationName,
                'experienceYears': experience_years,
            }
        }
    except Exception as e:
        print(f"[ERROR] Mobile update skill error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to update skill"},
            status=500
        )


@mobile_router.delete("/skills/{skill_id}", auth=jwt_auth)
def mobile_remove_skill(request, skill_id: int):
    """
    Remove a skill from worker's profile.
    skill_id: The specialization ID (not workerSpecialization ID)
    Note: This will also cascade delete linked certifications.
    """
    from .models import WorkerProfile, workerSpecialization, WorkerCertification

    try:
        user = request.auth
        
        # Get worker profile
        try:
            worker_profile = WorkerProfile.objects.get(profileID__accountFK=user)
        except WorkerProfile.DoesNotExist:
            return Response(
                {"error": "Worker profile not found"},
                status=404
            )
        
        # Get worker's skill
        try:
            worker_skill = workerSpecialization.objects.get(
                workerID=worker_profile,
                specializationID_id=skill_id
            )
        except workerSpecialization.DoesNotExist:
            return Response(
                {"error": "Skill not found in your profile"},
                status=404
            )
        
        skill_name = worker_skill.specializationID.specializationName
        
        # Check for linked certifications
        linked_certs_count = WorkerCertification.objects.filter(
            workerID=worker_profile,
            specializationID=worker_skill
        ).count()
        
        # Delete the skill (will cascade delete linked certifications)
        worker_skill.delete()
        
        print(f"✅ [SKILL] Removed skill '{skill_name}' from {user.email} (cascaded {linked_certs_count} certifications)")
        
        return {
            'success': True,
            'message': f"Removed '{skill_name}' from your skills",
            'deletedCertifications': linked_certs_count
        }
    except Exception as e:
        print(f"[ERROR] Mobile remove skill error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to remove skill"},
            status=500
        )


@mobile_router.get("/locations/cities", auth=jwt_auth)
def get_cities(request):
    """
    Get all cities
    """
    from .models import City
    
    try:
        cities = City.objects.all().values('cityID', 'name', 'province', 'region')
        return {
            'success': True,
            'cities': list(cities)
        }
    except Exception as e:
        print(f"[ERROR] Get cities error: {str(e)}")
        return Response(
            {"error": "Failed to fetch cities"},
            status=500
        )


@mobile_router.get("/locations/cities/{city_id}/barangays", auth=jwt_auth)
def get_barangays(request, city_id: int):
    """
    Get all barangays for a specific city
    """
    from .models import Barangay
    
    try:
        barangays = Barangay.objects.filter(city_id=city_id).values(
            'barangayID', 'name', 'zipCode'
        ).order_by('name')
        
        return {
            'success': True,
            'barangays': list(barangays)
        }
    except Exception as e:
        print(f"[ERROR] Get barangays error: {str(e)}")
        return Response(
            {"error": "Failed to fetch barangays"},
            status=500
        )


@mobile_router.get("/jobs/my-backjobs", auth=jwt_auth)
def get_my_backjobs_mobile(request, status: Optional[str] = None):
    """
    Get backjobs assigned to the current worker or agency.
    Only shows approved backjobs (UNDER_REVIEW status means admin approved and worker needs to action).
    NOTE: This route MUST be defined before /jobs/{job_id} to avoid route matching conflict!
    """
    from .models import Profile, WorkerProfile, Agency, Job, JobDispute
    
    try:
        print(f"📋 [MOBILE] Fetching backjobs for user {request.auth.email}")
        
        # Determine if user is worker or agency
        profile = Profile.objects.filter(accountFK=request.auth).first()
        agency = Agency.objects.filter(accountFK=request.auth).first()
        
        if not profile and not agency:
            return Response({"error": "Profile not found"}, status=404)
        
        # Build query for disputes where the related job was assigned to this worker/agency
        disputes_query = JobDispute.objects.select_related(
            'jobID',
            'jobID__clientID__profileID__accountFK',
            'jobID__assignedWorkerID__profileID',
            'jobID__assignedAgencyFK',
            'jobID__categoryID'
        ).prefetch_related('evidence')
        
        # Filter by jobs assigned to this user
        if agency:
            disputes_query = disputes_query.filter(jobID__assignedAgencyFK=agency)
        elif profile and profile.profileType == "WORKER":
            worker_profile = WorkerProfile.objects.filter(profileID=profile).first()
            if worker_profile:
                disputes_query = disputes_query.filter(jobID__assignedWorkerID=worker_profile)
            else:
                return {"backjobs": [], "total": 0}
        else:
            return {"backjobs": [], "total": 0}
        
        # Only show approved backjobs (UNDER_REVIEW means admin has reviewed and assigned to worker)
        # or show all if status filter provided
        if status:
            disputes_query = disputes_query.filter(status=status)
        else:
            # By default show UNDER_REVIEW (approved for action) and RESOLVED
            disputes_query = disputes_query.filter(status__in=["UNDER_REVIEW", "RESOLVED"])
        
        disputes = disputes_query.order_by('-openedDate')
        
        backjobs_data = []
        for dispute in disputes:
            job = dispute.jobID
            client = job.clientID.profileID if job.clientID else None
            
            evidence_urls = [e.imageURL for e in dispute.evidence.all()]
            
            backjobs_data.append({
                "dispute_id": dispute.disputeID,
                "job_id": job.jobID,
                "job_title": job.title,
                "job_description": job.description,
                "job_budget": float(job.budget),
                "job_location": job.location,
                "job_category": job.categoryID.specializationName if job.categoryID else None,
                "reason": dispute.reason,
                "description": dispute.description,
                "status": dispute.status,
                "priority": dispute.priority,
                "opened_date": dispute.openedDate.isoformat() if dispute.openedDate else None,
                "resolution": dispute.resolution,
                "resolved_date": dispute.resolvedDate.isoformat() if dispute.resolvedDate else None,
                "evidence_images": evidence_urls,
                "client": {
                    "id": client.profileID if client else None,
                    "name": f"{client.firstName} {client.lastName}" if client else "Unknown",
                    "avatar": client.profileImg if client else None
                } if client else None
            })
        
        print(f"📋 [MOBILE] Found {len(backjobs_data)} backjobs")
        return {
            "backjobs": backjobs_data,
            "total": len(backjobs_data)
        }
        
    except Exception as e:
        print(f"❌ Error fetching backjobs: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Failed to fetch backjobs"}, status=500)


@mobile_router.get("/jobs/{job_id}", auth=jwt_auth)
def mobile_job_detail(request, job_id: int):
    """
    Get complete job details for mobile view
    Includes user-specific data (is_applied, etc.)
    """
    from .mobile_services import get_mobile_job_detail

    print(f"\n{'='*60}")
    print(f"📱 [MOBILE JOB DETAIL] REQUEST STARTED")
    print(f"{'='*60}")
    print(f"📋 Job ID received: {job_id}")
    print(f"📋 Job ID type: {type(job_id)}")
    print(f"📋 Job ID repr: {repr(job_id)}")
    print(f"👤 User: {request.auth.email if request.auth else 'None'}")
    print(f"🔗 Request path: {request.path if hasattr(request, 'path') else 'N/A'}")
    print(f"{'='*60}\n")
    
    try:
        result = get_mobile_job_detail(job_id=job_id, user=request.auth)
        
        print(f"📊 Service result success: {result.get('success')}")
        if not result.get('success'):
            print(f"❌ Service error: {result.get('error')}")

        if result['success']:
            print(f"✅ [MOBILE JOB DETAIL] Success - Returning job data")
            print(f"{'='*60}\n")
            return result['data']
        else:
            status_code = 404 if 'not found' in result.get('error', '').lower() else 400
            print(f"❌ [MOBILE JOB DETAIL] Failed with status {status_code}: {result.get('error')}")
            print(f"{'='*60}\n")
            return Response(
                {"error": result.get('error', 'Failed to fetch job')},
                status=status_code
            )
    except Exception as e:
        print(f"❌ [MOBILE JOB DETAIL] EXCEPTION OCCURRED")
        print(f"❌ Exception type: {type(e).__name__}")
        print(f"❌ Exception message: {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
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

    print(f"📱 [MOBILE CREATE JOB] Request received")
    print(f"   User: {request.auth.email}")
    print(f"   Title: {payload.title}")
    print(f"   Budget: {payload.budget}")
    
    try:
        job_data = payload.dict()
        result = create_mobile_job(user=request.auth, job_data=job_data)
        print(f"   Create job result: {result.get('success')}")

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


@mobile_router.get("/jobs/test-invite", auth=jwt_auth)
def mobile_test_invite_endpoint(request):
    """Test endpoint to verify routing works"""
    print("✅ TEST ENDPOINT HIT - Routing works!")
    return {"message": "Test endpoint works!", "user": request.auth.email}


@mobile_router.post("/jobs/test-invite-post", auth=jwt_auth)
def mobile_test_invite_post_endpoint(request, title: str):
    """Test POST endpoint to verify POST works"""
    print(f"✅ TEST POST ENDPOINT HIT - title: {title}")
    return {"message": "Test POST works!", "title": title}


@mobile_router.post("/jobs/invite", auth=jwt_auth)
def mobile_create_invite_job(request, payload: CreateInviteJobMobileSchema):
    """
    Create INVITE-type job (direct worker/agency hiring) from mobile
    - Client directly hires a specific worker or agency
    - 50% + 5% commission downpayment held in escrow
    - Worker/agency can accept or reject
    - Payment: WALLET or GCASH
    """
    from .mobile_services import create_mobile_invite_job

    print("="*80)
    print(f"📱 [MOBILE CREATE INVITE JOB] Endpoint HIT!")
    print(f"   Request path: {request.path}")
    print(f"   Request method: {request.method}")
    print(f"   User authenticated: {request.auth is not None}")
    print(f"   User email: {request.auth.email if request.auth else 'None'}")
    print(f"   Payload received: {payload.dict()}")
    print(f"   Title: {payload.title}")
    print(f"   Worker ID: {payload.worker_id}, Agency ID: {payload.agency_id}")
    print(f"   Budget: ₱{payload.budget}")
    print("="*80)
    
    try:
        job_data = payload.dict()
        result = create_mobile_invite_job(user=request.auth, job_data=job_data)
        print(f"   Create invite job result: {result.get('success')}")

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Invite job creation failed')},
                status=400
            )
    except Exception as e:
        print(f"❌ Mobile create invite job error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to create invite job"},
            status=500
        )


@mobile_router.delete("/jobs/{job_id}", auth=jwt_auth)
def mobile_delete_job(request, job_id: int):
    """
    Delete a job posting (only if not in progress)
    - Only client who created the job can delete it
    - Cannot delete if status is IN_PROGRESS
    - Fully removes from database
    """
    from .mobile_services import delete_mobile_job

    print("="*80)
    print(f"🗑️  [MOBILE DELETE JOB] Endpoint HIT!")
    print(f"   Job ID: {job_id}")
    print(f"   User: {request.auth.email}")
    print("="*80)
    
    try:
        result = delete_mobile_job(job_id=job_id, user=request.auth)
        
        if result['success']:
            return {"message": result.get('message', 'Job deleted successfully')}
        else:
            return Response(
                {"error": result.get('error', 'Failed to delete job')},
                status=400
            )
    except Exception as e:
        print(f"❌ Mobile delete job error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to delete job"},
            status=500
        )


@mobile_router.get("/jobs/{job_id}/applications", auth=jwt_auth)
def mobile_get_job_applications(request, job_id: int):
    """
    Get all applications for a specific job posting (mobile version)
    Only the client who created the job can view applications
    """
    from .models import Profile, ClientProfile, JobApplication
    from jobs.models import JobPosting
    
    try:
        print(f"📋 [MOBILE] Fetching applications for job {job_id} by {request.auth.email}")
        
        # Get user's profile
        profile_type = getattr(request.auth, 'profile_type', None)
        if profile_type:
            profile = Profile.objects.filter(
                accountFK=request.auth,
                profileType=profile_type
            ).first()
        else:
            profile = Profile.objects.filter(accountFK=request.auth).first()
            
        if not profile or profile.profileType != 'CLIENT':
            return Response(
                {"error": "Only clients can view job applications"},
                status=403
            )
        
        # Get client profile
        try:
            client_profile = ClientProfile.objects.get(profileID=profile)
        except ClientProfile.DoesNotExist:
            return Response(
                {"error": "Client profile not found"},
                status=403
            )
        
        # Get the job posting
        try:
            job = JobPosting.objects.get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job posting not found"},
                status=404
            )
        
        # Verify this client owns the job
        if job.clientID.profileID.profileID != client_profile.profileID.profileID:
            return Response(
                {"error": "You can only view applications for your own job postings"},
                status=403
            )
        
        # Get all applications for this job
        applications = JobApplication.objects.filter(
            jobID=job
        ).select_related(
            'workerID__profileID__accountFK'
        ).order_by('-createdAt')
        
        # Format the response
        applications_data = []
        for app in applications:
            worker_profile = app.workerID.profileID
            worker_account = worker_profile.accountFK
            
            applications_data.append({
                "id": app.applicationID,
                "worker": {
                    "id": app.workerID.profileID.profileID,
                    "name": f"{worker_profile.firstName} {worker_profile.lastName}".strip(),
                    "avatar": worker_profile.profileImg or "",
                    "rating": app.workerID.workerRating if hasattr(app.workerID, 'workerRating') else 0,
                    "city": worker_account.city or ""
                },
                "proposal_message": app.proposalMessage or "",
                "proposed_budget": float(app.proposedBudget) if app.proposedBudget else 0.0,
                "estimated_duration": app.estimatedDuration or "",
                "budget_option": app.budgetOption,
                "status": app.status,
                "created_at": app.createdAt.isoformat() if app.createdAt else None,
                "updated_at": app.updatedAt.isoformat() if app.updatedAt else None
            })
        
        print(f"✅ [MOBILE] Found {len(applications_data)} applications for job {job_id}")
        
        # Get platform's ML prediction for the job
        estimated_completion = None
        try:
            from ml.prediction import predict_for_job_instance
            ml_prediction = predict_for_job_instance(job)
            if ml_prediction:
                estimated_completion = ml_prediction
        except Exception as ml_error:
            print(f"⚠️ [MOBILE] ML prediction failed for job applications: {ml_error}")
        
        return {
            "success": True,
            "applications": applications_data,
            "total": len(applications_data),
            "job_title": job.title,
            "estimated_completion": estimated_completion
        }
        
    except Exception as e:
        print(f"❌ [MOBILE] Error fetching job applications: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch applications: {str(e)}"},
            status=500
        )


@mobile_router.post("/jobs/{job_id}/applications/{application_id}/accept", auth=jwt_auth)
def mobile_accept_application(request, job_id: int, application_id: int):
    """
    Accept a job application (mobile version)
    - Assigns the worker to the job
    - Updates job status
    - Rejects all other applications
    """
    from .models import Profile, ClientProfile, JobApplication
    from jobs.models import JobPosting
    
    try:
        print(f"✅ [MOBILE] Accepting application {application_id} for job {job_id} by {request.auth.email}")
        
        # Get user's profile
        profile_type = getattr(request.auth, 'profile_type', None)
        if profile_type:
            profile = Profile.objects.filter(
                accountFK=request.auth,
                profileType=profile_type
            ).first()
        else:
            profile = Profile.objects.filter(accountFK=request.auth).first()
            
        if not profile or profile.profileType != 'CLIENT':
            return Response(
                {"error": "Only clients can accept applications"},
                status=403
            )
        
        # Get the job
        try:
            job = JobPosting.objects.get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job posting not found"},
                status=404
            )
        
        # Verify ownership
        if job.clientID.profileID.profileID != profile.profileID:
            return Response(
                {"error": "You can only accept applications for your own jobs"},
                status=403
            )
        
        # Get the application
        try:
            application = JobApplication.objects.get(
                applicationID=application_id,
                jobID=job
            )
        except JobApplication.DoesNotExist:
            return Response(
                {"error": "Application not found"},
                status=404
            )
        
        # Accept this application
        application.status = "ACCEPTED"
        application.save()
        
        # Use database transaction for atomicity
        from django.db import transaction as db_transaction
        with db_transaction.atomic():
            # Update job status to IN_PROGRESS and assign the worker
            job.status = JobPosting.JobStatus.IN_PROGRESS
            job.assignedWorkerID = application.workerID
            
            # If worker negotiated a different budget and it was accepted, update the job budget
            original_budget = job.budget
            if application.budgetOption == JobApplication.BudgetOption.NEGOTIATE:
                print(f"💰 [MOBILE] Updating job budget from ₱{job.budget} to negotiated price ₱{application.proposedBudget}")
                job.budget = application.proposedBudget
                
                # Recalculate escrow and fees based on new budget
                from decimal import Decimal
                job.escrowAmount = Decimal(str(job.budget)) * Decimal('0.5')
                job.remainingPayment = Decimal(str(job.budget)) * Decimal('0.5')
            
            # Process payment: Convert reservation to actual deduction (for LISTING jobs)
            # LISTING jobs have escrowPaid=False and funds are reserved
            if not job.escrowPaid:
                from decimal import Decimal
                from .models import Wallet, Transaction, Notification
                
                # Get client's wallet
                wallet = Wallet.objects.get(accountFK=request.auth)
                
                # Calculate the total to charge (50% escrow + 10% platform fee)
                escrow_amount = job.escrowAmount
                platform_fee = Decimal(str(job.budget)) * Decimal('0.10')
                total_to_charge = escrow_amount + platform_fee
                
                # Calculate original reserved amount (based on original budget before negotiation)
                original_escrow = Decimal(str(original_budget)) * Decimal('0.5')
                original_fee = Decimal(str(original_budget)) * Decimal('0.10')
                original_reserved = original_escrow + original_fee
                
                print(f"💳 [MOBILE] Processing payment for accepted application:")
                print(f"   Original budget: ₱{original_budget}, reserved: ₱{original_reserved}")
                print(f"   Final budget: ₱{job.budget}, to charge: ₱{total_to_charge}")
                
                # Release the original reservation
                wallet.reservedBalance -= original_reserved
                
                # If negotiated price is different, check if we have enough balance
                if total_to_charge > original_reserved:
                    additional_needed = total_to_charge - original_reserved
                    if wallet.balance - wallet.reservedBalance < additional_needed:
                        # Restore the reservation and abort
                        wallet.reservedBalance += original_reserved
                        return Response(
                            {
                                "error": "Insufficient balance for negotiated price",
                                "required": float(total_to_charge),
                                "available": float(wallet.balance - wallet.reservedBalance),
                                "message": f"The negotiated price requires ₱{total_to_charge} but you only have ₱{wallet.balance - wallet.reservedBalance} available."
                            },
                            status=400
                        )
                
                # Deduct the actual amount from balance
                wallet.balance -= total_to_charge
                wallet.save()
                
                print(f"💸 [MOBILE] Deducted ₱{total_to_charge} from wallet. New balance: ₱{wallet.balance}")
                
                # Update job escrow status
                from django.utils import timezone
                job.escrowPaid = True
                job.escrowPaidAt = timezone.now()
                
                # Update pending transactions to completed
                pending_escrow = Transaction.objects.filter(
                    relatedJobPosting=job,
                    transactionType=Transaction.TransactionType.PAYMENT,
                    status=Transaction.TransactionStatus.PENDING
                ).first()
                
                if pending_escrow:
                    pending_escrow.status = Transaction.TransactionStatus.COMPLETED
                    pending_escrow.completedAt = timezone.now()
                    pending_escrow.amount = escrow_amount  # Update if negotiated
                    pending_escrow.balanceAfter = wallet.balance
                    pending_escrow.save()
                    print(f"✅ [MOBILE] Updated escrow transaction {pending_escrow.transactionID} to COMPLETED")
                
                pending_fee = Transaction.objects.filter(
                    relatedJobPosting=job,
                    transactionType=Transaction.TransactionType.FEE,
                    status=Transaction.TransactionStatus.PENDING
                ).first()
                
                if pending_fee:
                    pending_fee.status = Transaction.TransactionStatus.COMPLETED
                    pending_fee.completedAt = timezone.now()
                    pending_fee.amount = platform_fee  # Update if negotiated
                    pending_fee.balanceAfter = wallet.balance
                    pending_fee.save()
                    print(f"✅ [MOBILE] Updated fee transaction {pending_fee.transactionID} to COMPLETED")
                
                # Create escrow payment notification
                Notification.objects.create(
                    accountFK=request.auth,
                    notificationType="ESCROW_PAID",
                    title=f"Payment Processed",
                    message=f"₱{total_to_charge} has been deducted from your wallet for '{job.title}' (₱{escrow_amount} escrow + ₱{platform_fee} platform fee).",
                    relatedJobID=job.jobID
                )
            
            job.save()
            
            print(f"✅ [MOBILE] Job {job_id} moved to IN_PROGRESS, assigned worker {application.workerID.profileID.profileID}")
            print(f"💵 [MOBILE] Final job budget: ₱{job.budget}")
        
        # Create a conversation between client and worker
        from profiles.models import Conversation, Message
        conversation, created = Conversation.objects.get_or_create(
            relatedJobPosting=job,
            defaults={
                'client': profile,
                'worker': application.workerID.profileID,
                'status': Conversation.ConversationStatus.ACTIVE
            }
        )
        
        if created:
            print(f"✅ [MOBILE] Created conversation {conversation.conversationID} for job {job_id}")
            
            # Create a system message to start the conversation
            Message.create_system_message(
                conversation=conversation,
                message_text=f"Application accepted! You can now chat about the job: {job.title}"
            )
        
        # Only reject other applications for non-team (single-worker) jobs
        # Team jobs use separate accept_team_application endpoint and should not auto-reject
        if not job.is_team_job:
            JobApplication.objects.filter(
                jobID=job
            ).exclude(
                applicationID=application_id
            ).update(status="REJECTED")
        
        print(f"✅ [MOBILE] Application {application_id} accepted, worker assigned, conversation created")
        
        return {
            "success": True,
            "message": "Application accepted and worker assigned",
            "conversation_id": conversation.conversationID
        }
        
    except Exception as e:
        print(f"❌ [MOBILE] Error accepting application: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to accept application: {str(e)}"},
            status=500
        )


@mobile_router.post("/jobs/{job_id}/applications/{application_id}/reject", auth=jwt_auth)
def mobile_reject_application(request, job_id: int, application_id: int):
    """
    Reject a job application (mobile version)
    """
    from .models import Profile, ClientProfile, JobApplication
    from jobs.models import JobPosting
    
    try:
        print(f"❌ [MOBILE] Rejecting application {application_id} for job {job_id} by {request.auth.email}")
        
        # Get user's profile
        profile_type = getattr(request.auth, 'profile_type', None)
        if profile_type:
            profile = Profile.objects.filter(
                accountFK=request.auth,
                profileType=profile_type
            ).first()
        else:
            profile = Profile.objects.filter(accountFK=request.auth).first()
            
        if not profile or profile.profileType != 'CLIENT':
            return Response(
                {"error": "Only clients can reject applications"},
                status=403
            )
        
        # Get the job
        try:
            job = JobPosting.objects.get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job posting not found"},
                status=404
            )
        
        # Verify ownership
        if job.clientID.profileID.profileID != profile.profileID:
            return Response(
                {"error": "You can only reject applications for your own jobs"},
                status=403
            )
        
        # Get the application
        try:
            application = JobApplication.objects.get(
                applicationID=application_id,
                jobID=job
            )
        except JobApplication.DoesNotExist:
            return Response(
                {"error": "Application not found"},
                status=404
            )
        
        # Reject the application
        application.status = "REJECTED"
        application.save()
        
        print(f"✅ [MOBILE] Application {application_id} rejected")
        
        return {
            "success": True,
            "message": "Application rejected"
        }
        
    except Exception as e:
        print(f"❌ [MOBILE] Error rejecting application: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to reject application: {str(e)}"},
            status=500
        )


@mobile_router.post("/jobs/{job_id}/apply", auth=dual_auth)
def mobile_apply_for_job(request, job_id: int, payload: ApplyJobMobileSchema):
    """
    Submit an application for a job posting (mobile version)
    Only workers can apply for jobs
    Supports both Bearer token (mobile) and cookie (web) authentication
    """
    from .models import Profile, WorkerProfile, Agency, Notification
    from jobs.models import JobPosting
    from accounts.models import JobApplication
    
    try:
        print(f"📝 [MOBILE] Worker {request.auth.email} applying for job {job_id}")
        
        # CRITICAL: Block agencies from applying to jobs
        if Agency.objects.filter(accountFK=request.auth).exists():
            return Response(
                {"error": "Agencies cannot apply to jobs. Please use the 'Accept Job' feature instead."},
                status=403
            )
        
        # Get user's profile
        profile_type = getattr(request.auth, 'profile_type', None)
        if profile_type:
            profile = Profile.objects.filter(
                accountFK=request.auth,
                profileType=profile_type
            ).first()
        else:
            profile = Profile.objects.filter(accountFK=request.auth).first()
            
        if not profile or profile.profileType != 'WORKER':
            return Response(
                {"error": "Only workers can apply for jobs"},
                status=403
            )
        
        # Get worker profile
        try:
            worker_profile = WorkerProfile.objects.get(profileID=profile)
        except WorkerProfile.DoesNotExist:
            return Response(
                {"error": "Worker profile not found"},
                status=403
            )
        
        # Get the job posting
        try:
            job = JobPosting.objects.get(jobID=job_id)
        except JobPosting.DoesNotExist:
            return Response(
                {"error": "Job posting not found"},
                status=404
            )
        
        # CRITICAL: Prevent users from applying to their own jobs (self-hiring)
        if job.clientID.profileID.accountFK == request.auth:
            return Response(
                {"error": "You cannot apply to your own job posting"},
                status=403
            )
        
        # Check if job is still active
        if job.status != JobPosting.JobStatus.ACTIVE:
            return Response(
                {"error": "This job is no longer accepting applications"},
                status=400
            )
        
        # Check if worker already applied
        existing_application = JobApplication.objects.filter(
            jobID=job,
            workerID=worker_profile
        ).first()
        
        if existing_application:
            return Response(
                {"error": "You have already applied for this job"},
                status=400
            )
        
        # Validate budget option
        if payload.budget_option not in ['ACCEPT', 'NEGOTIATE']:
            return Response(
                {"error": "Invalid budget option"},
                status=400
            )
        
        # Validate proposal message
        if not payload.proposal_message or len(payload.proposal_message.strip()) < 10:
            return Response(
                {"error": "Proposal message must be at least 10 characters"},
                status=400
            )
        
        # Validate proposed budget if negotiating
        if payload.budget_option == 'NEGOTIATE' and not payload.proposed_budget:
            return Response(
                {"error": "Proposed budget is required when negotiating"},
                status=400
            )
        
        # Create the application
        application = JobApplication.objects.create(
            jobID=job,
            workerID=worker_profile,
            proposalMessage=payload.proposal_message,
            proposedBudget=payload.proposed_budget or 0,
            estimatedDuration=payload.estimated_duration or '',
            budgetOption=payload.budget_option,
            status=JobApplication.ApplicationStatus.PENDING
        )

        print(f"✅ [MOBILE] Application {application.applicationID} created successfully")

        # Create notification for the client
        worker_name = f"{worker_profile.profileID.firstName} {worker_profile.profileID.lastName}".strip()
        Notification.objects.create(
            accountFK=job.clientID.profileID.accountFK,
            notificationType="APPLICATION_RECEIVED",
            title=f"New Application for '{job.title}'",
            message=f"{worker_name} applied for your job posting. Review their proposal and qualifications.",
            relatedJobID=job.jobID,
            relatedApplicationID=application.applicationID
        )
        print(f"📬 [MOBILE] Notification sent to client {job.clientID.profileID.accountFK.email}")

        return {
            "success": True,
            "message": "Application submitted successfully",
            "application_id": application.applicationID
        }
        
    except Exception as e:
        print(f"❌ [MOBILE] Error applying for job: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to submit application: {str(e)}"},
            status=500
        )


@mobile_router.get("/jobs/applications/my", auth=dual_auth)
def mobile_get_my_applications(request):
    """
    Get all applications submitted by the current worker (mobile version)
    Supports both Bearer token (mobile) and cookie (web) authentication
    """
    from .models import Profile, WorkerProfile
    from accounts.models import JobApplication
    
    try:
        print(f"📋 [MOBILE] Fetching applications for {request.auth.email}")
        
        # Get user's profile using profile_type from JWT if available
        profile_type = getattr(request.auth, 'profile_type', None)
        if profile_type:
            profile = Profile.objects.filter(
                accountFK=request.auth,
                profileType=profile_type
            ).first()
        else:
            # Fallback - assume WORKER for this endpoint
            profile = Profile.objects.filter(
                accountFK=request.auth,
                profileType='WORKER'
            ).first()
            
        if not profile:
            return Response(
                {"error": "Worker profile not found"},
                status=403
            )
        
        # Get worker profile
        try:
            worker_profile = WorkerProfile.objects.get(profileID=profile)
        except WorkerProfile.DoesNotExist:
            return Response(
                {"error": "Only workers can view applications"},
                status=403
            )
        
        # Get all applications for this worker
        applications = JobApplication.objects.filter(
            workerID=worker_profile
        ).select_related('jobID', 'jobID__clientID__profileID__accountFK', 'applied_skill_slot').order_by('-createdAt')
        
        # Format the response
        applications_data = []
        for app in applications:
            job = app.jobID
            client_profile = job.clientID.profileID
            
            applications_data.append({
                "application_id": app.applicationID,
                "job_id": job.jobID,
                "job_title": job.title,
                "job_description": job.description,
                "job_budget": float(job.budget),
                "job_location": job.location,
                "job_status": job.status,
                "application_status": app.status,
                "proposal_message": app.proposalMessage,
                "proposed_budget": float(app.proposedBudget) if app.proposedBudget else None,
                "estimated_duration": app.estimatedDuration,
                "budget_option": app.budgetOption,
                "created_at": app.createdAt.isoformat(),
                "client_name": f"{client_profile.firstName} {client_profile.lastName}".strip(),
                "client_img": (
                    getattr(client_profile, 'profileImage', None)
                    or getattr(client_profile, 'profileImg', None)
                ),
                "is_team_job": job.is_team_job,
                "applied_skill_slot_id": app.applied_skill_slot.skillSlotID if app.applied_skill_slot else None,
            })
        
        print(f"✅ [MOBILE] Found {len(applications_data)} applications")
        
        return {
            "success": True,
            "applications": applications_data,
            "total": len(applications_data)
        }
        
    except Exception as e:
        print(f"❌ [MOBILE] Error fetching applications: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Failed to fetch applications: {str(e)}"},
            status=500
        )


@mobile_router.get("/jobs/search", auth=jwt_auth)
def mobile_job_search(request, query: str, page: int = 1, limit: int = 20):
    """
    Search jobs with fuzzy matching
    Returns mobile-optimized results
    """
    from .mobile_services import search_mobile_jobs

    print(f"📱 [MOBILE JOB SEARCH] Query: '{query}', Page: {page}, Limit: {limit}")
    print(f"   User: {request.auth.email}")
    
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
def mobile_get_current_profile(request):
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
def mobile_update_profile(request, payload: UpdateProfileMobileSchema):
    """
    Update user profile
    Fields: firstName, lastName, contactNum, birthDate
    """
    from .mobile_services import update_user_profile_mobile

    try:
        print(f"[MOBILE] Profile update - payload received: {payload}")
        user = request.auth
        # Convert schema to dict, excluding None values
        payload_dict = {k: v for k, v in payload.dict().items() if v is not None}
        print(f"[MOBILE] Profile update - payload_dict: {payload_dict}")
        result = update_user_profile_mobile(user, payload_dict, request)

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

        _log_mobile(
            "profile_image_upload:start",
            user=user.email if user else None,
            path=getattr(request, "path", None),
            method=getattr(request, "method", None),
            files=list(request.FILES.keys()),
        )

        if 'profile_image' not in request.FILES:
            _log_mobile(
                "profile_image_upload:missing_file",
                user=user.email if user else None,
            )
            return Response(
                {"error": "No image file provided"},
                status=400
            )

        image_file = request.FILES['profile_image']
        _log_mobile(
            "profile_image_upload:file_received",
            filename=getattr(image_file, "name", None),
            content_type=getattr(image_file, "content_type", None),
            size=getattr(image_file, "size", getattr(image_file, "_size", None)),
        )
        result = upload_profile_image_mobile(user, image_file)

        if result['success']:
            _log_mobile(
                "profile_image_upload:success",
                user=user.email if user else None,
                url=result['data'].get('profile_image_url') if isinstance(result.get('data'), dict) else None,
            )
            return result['data']
        else:
            _log_mobile(
                "profile_image_upload:failed",
                user=user.email if user else None,
                error=result.get('error'),
            )
            return Response(
                {"error": result.get('error', 'Failed to upload image')},
                status=400
            )
    except Exception as e:
        print(f"[ERROR] Mobile upload profile image error: {str(e)}")
        import traceback
        traceback.print_exc()
        _log_mobile(
            "profile_image_upload:exception",
            user=request.auth.email if hasattr(request, 'auth') and request.auth else None,
            error=str(e),
        )
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
        print(f"\n{'='*60}")
        print(f"📋 MOBILE WORKERS LIST REQUEST")
        print(f"{'='*60}")
        print(f"👤 User: {user.email} (ID: {user.accountID})")
        print(f"📍 Location: lat={latitude}, lon={longitude}")
        print(f"📄 Pagination: page={page}, limit={limit}")
        
        result = get_workers_list_mobile(
            user=user,
            latitude=latitude,
            longitude=longitude,
            page=page,
            limit=limit
        )

        if result['success']:
            worker_count = len(result['data'].get('workers', []))
            total_count = result['data'].get('total_count', 0)
            print(f"✅ Workers list retrieved: {worker_count}/{total_count} workers (page {page})")
            print(f"{'='*60}\n")
            return result['data']
        else:
            error_msg = result.get('error', 'Failed to fetch workers')
            print(f"❌ Workers list failed: {error_msg}")
            print(f"{'='*60}\n")
            return Response(
                {"error": error_msg},
                status=400
            )
    except Exception as e:
        print(f"❌ MOBILE WORKERS LIST ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        return Response(
            {"error": "Failed to fetch workers"},
            status=500
        )


@mobile_router.get("/agencies/list", auth=jwt_auth)
def mobile_agencies_list(request, page: int = 1, limit: int = 20,
                         city: str = None, province: str = None,
                         min_rating: float = None, sort_by: str = "rating"):
    """
    Get list of agencies for clients
    Supports filtering and sorting
    """
    try:
        user = request.auth
        print(f"\n{'='*60}")
        print(f"📋 MOBILE AGENCIES LIST REQUEST")
        print(f"{'='*60}")
        print(f"👤 User: {user.email} (ID: {user.accountID})")
        print(f"📄 Pagination: page={page}, limit={limit}")
        print(f"🔍 Filters: city={city}, province={province}, min_rating={min_rating}")
        print(f"📊 Sort by: {sort_by}")
        
        # Use the existing client services for browsing agencies
        from client.services import browse_agencies
        
        result = browse_agencies(
            page=page,
            limit=limit,
            city=city,
            province=province,
            min_rating=min_rating,
            kyc_status="APPROVED",  # Only show approved agencies
            sort_by=sort_by
        )
        
        agency_count = len(result.get('agencies', []))
        total_count = result.get('total', 0)
        print(f"✅ Agencies list retrieved: {agency_count}/{total_count} agencies (page {page})")
        print(f"{'='*60}\n")
        
        return result
        
    except Exception as e:
        print(f"❌ MOBILE AGENCIES LIST ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        return Response(
            {"error": "Failed to fetch agencies"},
            status=500
        )


@mobile_router.get("/agencies/detail/{agency_id}", auth=jwt_auth)
def mobile_agency_detail(request, agency_id: int):
    """
    Get detailed agency profile
    Returns data formatted for AgencyDetail interface in mobile app
    """
    from .mobile_services import get_agency_detail_mobile

    print(f"📱 [AGENCY DETAIL] Request received for agency_id: {agency_id}")
    
    try:
        user = request.auth
        result = get_agency_detail_mobile(user, agency_id)

        if result['success']:
            print(f"   ✅ Agency details retrieved successfully")
            return {
                'success': True,
                'agency': result['data']
            }
        else:
            print(f"   ❌ Agency not found: {result.get('error')}")
            return Response(
                {"error": result.get('error', 'Agency not found')},
                status=404
            )
    except Exception as e:
        print(f"❌ [ERROR] Mobile agency detail error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch agency details"},
            status=500
        )


@mobile_router.get("/clients/{client_id}", auth=jwt_auth)
def mobile_client_detail(request, client_id: int):
    """
    Get client profile details.
    Allows workers to view client profile information.
    """
    from .mobile_services import get_client_detail_mobile

    try:
        user = request.auth
        result = get_client_detail_mobile(user, client_id)

        if result['success']:
            return {
                'success': True,
                'client': result['data']
            }
        else:
            return Response(
                {"error": result.get('error', 'Client not found')},
                status=404
            )
    except Exception as e:
        print(f"[ERROR] Mobile client detail error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch client details"},
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


@mobile_router.get("/workers/detail/{worker_id}", auth=jwt_auth)
def mobile_worker_detail_v2(request, worker_id: int):
    """
    Get detailed worker profile (V2 - matches mobile app interface)
    Returns data formatted for WorkerDetail interface in mobile app
    """
    from .mobile_services import get_worker_detail_mobile_v2

    print(f"📱 [WORKER DETAIL V2] Request received for worker_id: {worker_id}")
    
    try:
        user = request.auth
        result = get_worker_detail_mobile_v2(user, worker_id)

        if result['success']:
            print(f"   ✅ Worker details retrieved successfully")
            return {
                'success': True,
                'worker': result['data']
            }
        else:
            print(f"   ❌ Worker not found: {result.get('error')}")
            return Response(
                {"error": result.get('error', 'Worker not found')},
                status=404
            )
    except Exception as e:
        print(f"❌ [ERROR] Mobile worker detail V2 error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch worker details"},
            status=500
        )


@mobile_router.get("/jobs/available", auth=jwt_auth)
def mobile_available_jobs(request, page: int = 1, limit: int = 20):
    """
    Get available jobs for workers to apply to
    Only shows ACTIVE jobs that worker hasn't applied to
    """
    from .mobile_services import get_available_jobs_mobile

    print(f"📱 [MOBILE AVAILABLE JOBS] Request received")
    print(f"   User: {request.auth.email if request.auth else 'None'}")
    print(f"   Pagination: page={page}, limit={limit}")
    
    try:
        user = request.auth
        result = get_available_jobs_mobile(
            user=user,
            page=page,
            limit=limit
        )
        
        print(f"   Result success: {result.get('success')}")
        if result.get('success'):
            job_count = len(result['data'].get('jobs', []))
            print(f"   ✅ Returning {job_count} available jobs")

        if result['success']:
            return result['data']
        else:
            print(f"   ❌ Error: {result.get('error')}")
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
    """Get current user's wallet balance including reserved funds and pending earnings - Mobile"""
    try:
        from .models import Wallet, Transaction
        from django.db.models import Sum
        from django.utils import timezone
        from decimal import Decimal

        # Get or create wallet for the user
        wallet, created = Wallet.objects.get_or_create(
            accountFK=request.auth,
            defaults={'balance': Decimal('0.00'), 'reservedBalance': Decimal('0.00'), 'pendingEarnings': Decimal('0.00')}
        )

        print(f"💵 [Mobile] Balance request for user {request.auth.email}: ₱{wallet.balance} (₱{wallet.reservedBalance} reserved, ₱{wallet.pendingEarnings} pending)")

        # Aggregate wallet stats for dashboard cards
        pending_total = (
            wallet.transactions.filter(
                status=Transaction.TransactionStatus.PENDING
            ).aggregate(total=Sum('amount'))['total']
            or Decimal('0.00')
        )

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        this_month_total = (
            wallet.transactions.filter(
                createdAt__gte=month_start,
                status=Transaction.TransactionStatus.COMPLETED,
                transactionType__in=[
                    Transaction.TransactionType.EARNING,
                    Transaction.TransactionType.PAYMENT,
                ],
            ).aggregate(total=Sum('amount'))['total']
            or Decimal('0.00')
        )

        total_earned = (
            wallet.transactions.filter(
                transactionType=Transaction.TransactionType.EARNING,
                status=Transaction.TransactionStatus.COMPLETED,
            ).aggregate(total=Sum('amount'))['total']
            or Decimal('0.00')
        )

        last_transaction = wallet.transactions.order_by('-completedAt', '-createdAt').first()
        if last_transaction:
            last_updated_source = last_transaction.completedAt or last_transaction.createdAt
        else:
            last_updated_source = wallet.updatedAt

        # Get pending earnings details (Due Balance)
        from jobs.payment_buffer_service import get_pending_earnings_for_account
        pending_earnings_list = get_pending_earnings_for_account(request.auth)
        
        return {
            "success": True,
            "balance": float(wallet.balance),
            "reservedBalance": float(wallet.reservedBalance),
            "availableBalance": float(wallet.availableBalance),
            # NEW: Pending earnings (7-day buffer)
            "pendingEarnings": float(wallet.pendingEarnings),
            "totalBalance": float(wallet.totalBalance),  # balance + pendingEarnings
            "pendingEarningsCount": len(pending_earnings_list),
            # Aggregates
            "pending": float(pending_total),
            "this_month": float(this_month_total),
            "total_earned": float(total_earned),
            "last_updated": last_updated_source.isoformat() if last_updated_source else None,
            "currency": "PHP",
            "created": created,
        }

    except Exception as e:
        print(f"❌ [Mobile] Error fetching wallet balance: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch wallet balance"},
            status=500
        )


@mobile_router.get("/wallet/pending-earnings", auth=jwt_auth)
def mobile_get_pending_earnings(request):
    """
    Get detailed list of pending earnings (Due Balance) for the current user.
    Shows all completed jobs where payment is held in the 7-day buffer period.
    
    Returns:
        - List of pending payments with job details and release dates
        - Total pending amount
        - Buffer period info from PlatformSettings
    """
    try:
        from .models import Wallet
        from decimal import Decimal
        from jobs.payment_buffer_service import (
            get_pending_earnings_for_account, 
            get_payment_buffer_days
        )
        
        # Get wallet for pending balance
        try:
            wallet = Wallet.objects.get(accountFK=request.auth)
            pending_total = float(wallet.pendingEarnings)
        except Wallet.DoesNotExist:
            pending_total = 0.0
        
        # Get detailed list of pending earnings
        pending_list = get_pending_earnings_for_account(request.auth)
        
        buffer_days = get_payment_buffer_days()
        
        print(f"📋 [Mobile] Pending earnings for {request.auth.email}: {len(pending_list)} payments, ₱{pending_total} total")
        
        return {
            "success": True,
            "pending_earnings": pending_list,
            "total_pending": pending_total,
            "count": len(pending_list),
            "buffer_days": buffer_days,
            "info_message": f"Payments are held for {buffer_days} days after job completion before being released to your wallet."
        }
        
    except Exception as e:
        print(f"❌ [Mobile] Error fetching pending earnings: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch pending earnings"},
            status=500
        )


@mobile_router.get("/config", auth=None)
def get_mobile_config(request):
    """
    Get mobile app configuration including feature flags.
    No authentication required - used for app initialization.
    """
    from django.conf import settings
    
    return {
        "testing": getattr(settings, 'TESTING', False),
        "features": {
            "gcash_direct_deposit": getattr(settings, 'TESTING', False),  # TODO: REMOVE FOR PROD
            "qrph_deposit": True,
            "auto_withdraw": True,
        },
        "platform": {
            "min_deposit": 100,
            "max_deposit": 100000,
            "min_withdraw": 100,
            "auto_withdraw_day": "Friday",
            "auto_withdraw_minimum": 100,
        }
    }


# TODO: REMOVE FOR PROD - Testing only GCash direct deposit
@mobile_router.post("/wallet/deposit-gcash", auth=jwt_auth)
def mobile_deposit_funds_gcash(request, payload: DepositFundsSchema):
    """
    TODO: REMOVE FOR PROD - Testing only
    Mobile wallet deposit via direct GCash (for testing when QR PH doesn't work)
    Only available when TESTING=true in environment.
    """
    from django.conf import settings
    
    # Check if testing mode is enabled
    if not getattr(settings, 'TESTING', False):
        return Response(
            {"error": "GCash direct deposit is only available in testing mode"},
            status=404
        )
    
    try:
        from .models import Wallet, Transaction, Profile
        from .payment_provider import get_payment_provider
        from decimal import Decimal
        
        amount = payload.amount
        payment_method = "GCASH"

        print(f"📥 [Mobile] GCash Direct Deposit request (TESTING): ₱{amount} from {request.auth.email}")
        
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
            profile_type = getattr(request.auth, 'profile_type', None)
            if profile_type:
                profile = Profile.objects.filter(
                    accountFK=request.auth,
                    profileType=profile_type
                ).first()
            else:
                profile = Profile.objects.filter(accountFK=request.auth).first()
            
            if profile:
                user_name = f"{profile.firstName} {profile.lastName}"
            else:
                user_name = request.auth.email.split('@')[0]
        except Exception:
            user_name = request.auth.email.split('@')[0]
        
        # Create PENDING transaction
        transaction = Transaction.objects.create(
            walletID=wallet,
            transactionType=Transaction.TransactionType.DEPOSIT,
            amount=Decimal(str(amount)),
            balanceAfter=wallet.balance,
            status=Transaction.TransactionStatus.PENDING,
            description=f"TOP UP via {payment_method} (Testing) - ₱{amount}",
            paymentMethod=payment_method,
        )
        
        # Create GCash direct payment
        payment_provider = get_payment_provider()
        
        # Use the direct GCash method instead of QR PH
        payment_result = payment_provider.create_gcash_direct_payment(
            amount=amount,
            user_email=request.auth.email,
            user_name=user_name,
            transaction_id=transaction.transactionID
        )
        
        if not payment_result.get("success"):
            transaction.status = Transaction.TransactionStatus.FAILED
            transaction.description = f"TOP UP FAILED - ₱{amount} - {payment_result.get('error', 'Payment provider error')}"
            transaction.save()
            return Response(
                {"error": "Failed to create payment invoice"},
                status=500
            )
        
        # Update transaction with payment provider details
        transaction.xenditInvoiceID = payment_result.get('checkout_id') or payment_result.get('invoice_id')
        transaction.xenditExternalID = payment_result.get('external_id')
        transaction.invoiceURL = payment_result.get('checkout_url') or payment_result.get('invoice_url')
        transaction.xenditPaymentChannel = payment_method
        transaction.xenditPaymentMethod = "PAYMONGO_GCASH"
        transaction.save()
        
        print(f"📄 GCash Direct payment created (TESTING): {transaction.xenditInvoiceID}")
        
        return {
            "success": True,
            "transaction_id": transaction.transactionID,
            "payment_url": payment_result.get('checkout_url') or payment_result.get('invoice_url'),
            "invoice_id": transaction.xenditInvoiceID,
            "amount": amount,
            "current_balance": float(wallet.balance),
            "expiry_date": payment_result.get('expiry_date'),
            "provider": "paymongo",
            "method": "gcash_direct",
            "status": "pending",
            "message": "GCash payment link created (Testing mode). Complete payment to add funds."
        }
        
    except Exception as e:
        print(f"❌ [Mobile] Error with GCash direct deposit: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to create GCash deposit"},
            status=500
        )


@mobile_router.post("/wallet/deposit", auth=jwt_auth)
def mobile_deposit_funds(request, payload: DepositFundsSchema):
    """
    Mobile wallet deposit via PayMongo QR PH
    User scans QR code displayed in checkout and pays via any Philippine bank/e-wallet
    
    SECURE FLOW:
    1. Create PENDING transaction (no balance change)
    2. Redirect user to PayMongo checkout (shows QR PH code)
    3. User scans QR and pays via any bank/e-wallet
    4. Webhook confirms payment
    5. Webhook handler adds funds to wallet
    """
    try:
        from .models import Wallet, Transaction, Profile
        from .payment_provider import get_payment_provider
        from decimal import Decimal
        from django.utils import timezone
        
        amount = payload.amount
        payment_method = "QRPH"  # Universal QR payment - any PH bank/e-wallet

        print(f"📥 [Mobile] Deposit request: ₱{amount} via {payment_method} from {request.auth.email}")
        
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
            # Get profile_type from JWT if available, try both if not found
            profile_type = getattr(request.auth, 'profile_type', None)
            
            if profile_type:
                profile = Profile.objects.filter(
                    accountFK=request.auth,
                    profileType=profile_type
                ).first()
            else:
                # Fallback: get any profile
                profile = Profile.objects.filter(accountFK=request.auth).first()
            
            if profile:
                user_name = f"{profile.firstName} {profile.lastName}"
            else:
                user_name = request.auth.email.split('@')[0]
        except Exception:
            user_name = request.auth.email.split('@')[0]
        
        print(f"💰 Current balance: ₱{wallet.balance}")
        
        # Create PENDING transaction - funds NOT added yet!
        # Balance will be updated by webhook after payment is confirmed
        transaction = Transaction.objects.create(
            walletID=wallet,
            transactionType=Transaction.TransactionType.DEPOSIT,
            amount=Decimal(str(amount)),
            balanceAfter=wallet.balance,  # Balance unchanged until payment confirmed
            status=Transaction.TransactionStatus.PENDING,  # PENDING until webhook confirms
            description=f"TOP UP via {payment_method.upper()} - ₱{amount}",
            paymentMethod=payment_method,
        )
        
        print(f"   Transaction {transaction.transactionID} created as PENDING")
        print(f"   ⚠️ Funds will be added after payment confirmation")
        
        # Create payment invoice using configured provider
        payment_provider = get_payment_provider()
        provider_name = payment_provider.provider_name
        
        payment_result = payment_provider.create_gcash_payment(
            amount=amount,
            user_email=request.auth.email,
            user_name=user_name,
            transaction_id=transaction.transactionID
        )
        
        if not payment_result.get("success"):
            # If payment provider fails, mark transaction as failed
            transaction.status = Transaction.TransactionStatus.FAILED
            transaction.description = f"TOP UP FAILED - ₱{amount} - {payment_result.get('error', 'Payment provider error')}"
            transaction.save()
            return Response(
                {"error": "Failed to create payment invoice"},
                status=500
            )
        
        # Update transaction with payment provider details
        transaction.xenditInvoiceID = payment_result.get('checkout_id') or payment_result.get('invoice_id')
        transaction.xenditExternalID = payment_result.get('external_id')
        transaction.invoiceURL = payment_result.get('checkout_url') or payment_result.get('invoice_url')
        transaction.xenditPaymentChannel = payment_method.upper()
        transaction.xenditPaymentMethod = provider_name.upper()
        transaction.save()
        
        print(f"📄 {provider_name.upper()} invoice created: {transaction.xenditInvoiceID}")
        print(f"   ⏳ Waiting for user to complete payment...")
        
        return {
            "success": True,
            "transaction_id": transaction.transactionID,
            "payment_url": payment_result.get('checkout_url') or payment_result.get('invoice_url'),
            "invoice_id": transaction.xenditInvoiceID,
            "amount": amount,
            "current_balance": float(wallet.balance),  # Show current balance, not new
            "expiry_date": payment_result.get('expiry_date'),
            "provider": provider_name,
            "status": "pending",
            "message": "Payment invoice created. Complete payment to add funds to wallet."
        }
        
    except Exception as e:
        print(f"❌ [Mobile] Error depositing funds: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to deposit funds"},
            status=500
        )


@mobile_router.post("/wallet/withdraw", auth=jwt_auth)
def mobile_withdraw_funds(request, payload: WithdrawFundsSchema):
    """
    Withdraw funds from wallet to GCash via PayMongo/Xendit Disbursement.
    Uses configured payment provider (PayMongo by default, Xendit for legacy).
    Deducts balance immediately and creates disbursement request.
    """
    try:
        from .models import Wallet, Transaction, Profile, UserPaymentMethod
        from .payment_provider import get_payment_provider
        from decimal import Decimal
        from django.utils import timezone
        from django.db import transaction as db_transaction
        
        amount = payload.amount
        payment_method_id = payload.payment_method_id
        notes = payload.notes or ""

        print(f"💸 [Mobile] Withdraw request: ₱{amount} to payment method {payment_method_id} from {request.auth.email}")
        
        # Validate amount
        if amount <= 0:
            return Response(
                {"error": "Amount must be greater than 0"},
                status=400
            )
        
        # Minimum withdrawal of ₱100
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
                {"error": f"Insufficient balance. Available: ₱{wallet.balance}"},
                status=400
            )
        
        # Get payment method
        try:
            payment_method = UserPaymentMethod.objects.get(
                id=payment_method_id,
                accountFK=request.auth
            )
        except UserPaymentMethod.DoesNotExist:
            return Response(
                {"error": "Payment method not found"},
                status=404
            )
        
        # Validate payment method type
        supported_types = ['GCASH', 'BANK', 'PAYPAL']
        if payment_method.methodType not in supported_types:
            return Response(
                {"error": f"Unsupported payment method type: {payment_method.methodType}"},
                status=400
            )
        
        # Get user's profile for name
        try:
            profile_type = getattr(request.auth, 'profile_type', None)
            
            if profile_type:
                profile = Profile.objects.filter(
                    accountFK=request.auth,
                    profileType=profile_type
                ).first()
            else:
                profile = Profile.objects.filter(accountFK=request.auth).first()
            
            if profile:
                user_name = f"{profile.firstName} {profile.lastName}"
            else:
                user_name = request.auth.email.split('@')[0]
        except Exception:
            user_name = request.auth.email.split('@')[0]
        
        print(f"💰 Current balance: ₱{wallet.balance}")
        
        # Use atomic transaction to ensure consistency
        with db_transaction.atomic():
            # Deduct balance immediately
            old_balance = wallet.balance
            wallet.balance -= Decimal(str(amount))
            wallet.save()
            
            # Create pending withdrawal transaction
            method_display = {
                'GCASH': f'GCash - {payment_method.accountNumber}',
                'BANK': f'Bank Transfer - {payment_method.bankName or "Bank"} {payment_method.accountNumber}',
                'PAYPAL': f'PayPal - {payment_method.accountNumber}',
                'VISA': f'Visa/Credit Card - ****{payment_method.accountNumber[-4:] if len(payment_method.accountNumber) >= 4 else payment_method.accountNumber}',
                'GRABPAY': f'GrabPay - {payment_method.accountNumber}',
                'MAYA': f'Maya - {payment_method.accountNumber}'
            }.get(payment_method.methodType, f'{payment_method.methodType} - {payment_method.accountNumber}')
            
            transaction = Transaction.objects.create(
                walletID=wallet,
                transactionType=Transaction.TransactionType.WITHDRAWAL,
                amount=Decimal(str(amount)),
                balanceAfter=wallet.balance,
                status=Transaction.TransactionStatus.PENDING,
                description=f"Withdrawal to {method_display}",
                paymentMethod=payment_method.methodType
            )
            
            print(f"✅ New balance: ₱{wallet.balance}")
            
            # Map payment method type to channel code for PayMongo
            channel_mapping = {
                'GCASH': 'GCASH',
                'BANK': 'BANK_TRANSFER',  # PayMongo InstaPay/PESONet
                'PAYPAL': 'PAYPAL',  # For manual processing
                'VISA': 'CARD',  # Credit/Debit card
                'GRABPAY': 'GRABPAY',  # GrabPay e-wallet
                'MAYA': 'PAYMAYA'  # Maya/PayMaya e-wallet
            }
            channel_code = channel_mapping.get(payment_method.methodType, 'GCASH')
            
            # Create disbursement using configured payment provider
            payment_provider = get_payment_provider()
            provider_name = payment_provider.provider_name
            print(f"📤 Creating {provider_name.upper()} disbursement for {payment_method.methodType}...")
            
            # For BANK type, include bank name in metadata
            metadata = {
                "user_email": request.auth.email,
                "user_name": user_name,
                "payment_method_type": payment_method.methodType
            }
            if payment_method.methodType == 'BANK' and payment_method.bankName:
                metadata["bank_name"] = payment_method.bankName
            
            disbursement_result = payment_provider.create_disbursement(
                amount=amount,
                currency="PHP",
                recipient_name=payment_method.accountName,
                account_number=payment_method.accountNumber,
                channel_code=channel_code,
                transaction_id=transaction.transactionID,
                description=notes or f"Withdrawal from iAyos Wallet - ₱{amount}",
                metadata=metadata
            )
            
            if not disbursement_result.get("success"):
                # Rollback balance deduction
                wallet.balance = old_balance
                wallet.save()
                transaction.delete()
                
                return Response(
                    {"error": f"Failed to create disbursement: {disbursement_result.get('error', 'Unknown error')}"},
                    status=500
                )
            
            # Update transaction with provider details
            transaction.xenditInvoiceID = disbursement_result.get('disbursement_id')
            transaction.xenditExternalID = disbursement_result.get('external_id')
            transaction.xenditPaymentChannel = channel_code
            transaction.xenditPaymentMethod = provider_name.upper()
            
            # Withdrawals always stay PENDING until manually processed
            # This is production-ready: admin must manually send payment and mark complete
            transaction.status = Transaction.TransactionStatus.PENDING
            transaction.save()
            
            print(f"📄 {provider_name.upper()} withdrawal request created: {disbursement_result.get('disbursement_id')}")
            print(f"📊 Status: PENDING (requires admin approval)")
            print(f"   Recipient: {payment_method.accountName} ({payment_method.accountNumber})")
            print(f"   Method: {payment_method.methodType}")
        
        # Customize message based on payment method type
        method_messages = {
            'GCASH': "Your funds will be transferred to your GCash within 1-3 business days after verification.",
            'BANK': f"Your funds will be transferred to your {payment_method.bankName or 'bank'} account within 1-3 business days after verification.",
            'PAYPAL': "Your funds will be transferred to your PayPal account within 1-3 business days after verification."
        }
        success_message = method_messages.get(payment_method.methodType, "Your funds will be transferred within 1-3 business days after verification.")
        
        # Build response
        response_data = {
            "success": True,
            "transaction_id": transaction.transactionID,
            "disbursement_id": disbursement_result.get('disbursement_id'),
            "amount": amount,
            "new_balance": float(wallet.balance),
            "status": "PENDING",
            "recipient": payment_method.accountNumber,
            "recipient_name": payment_method.accountName,
            "payment_method_type": payment_method.methodType,
            "provider": provider_name,
            "message": f"Withdrawal request submitted successfully. {success_message}",
            "estimated_arrival": "1-3 business days"
        }
        
        return response_data
        
    except Exception as e:
        print(f"❌ [Mobile] Error withdrawing funds: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to process withdrawal"},
            status=500
        )


@mobile_router.get("/wallet/transactions", auth=jwt_auth)
def mobile_get_transactions(request, page: int = 1, limit: int = 20, type: Optional[str] = None):
    """Get wallet transaction history - Mobile with pagination"""
    try:
        from .models import Wallet, Transaction
        
        # Get user's wallet
        wallet = Wallet.objects.filter(accountFK=request.auth).first()
        
        if not wallet:
            return {
                "results": [],
                "count": 0,
                "has_next": False,
                "next_page": None
            }
        
        # Build query with optional type filter
        queryset = Transaction.objects.filter(walletID=wallet)
        
        if type:
            type_mapping = {
                'DEPOSIT': Transaction.TransactionType.DEPOSIT,
                'PAYMENT': Transaction.TransactionType.PAYMENT,
                'WITHDRAWAL': Transaction.TransactionType.WITHDRAWAL,
            }
            if type.upper() in type_mapping:
                queryset = queryset.filter(transactionType=type_mapping[type.upper()])
        
        # Get total count
        total_count = queryset.count()
        
        # Paginate
        offset = (page - 1) * limit
        transactions = queryset.order_by('-createdAt')[offset:offset + limit]
        
        transaction_list = []
        for t in transactions:
            # Map transaction type to frontend format
            type_display = t.transactionType
            if t.transactionType == Transaction.TransactionType.EARNING:
                type_display = 'PAYMENT'  # Frontend expects PAYMENT for earnings
            
            transaction_list.append({
                'id': t.transactionID,
                'type': type_display,
                'title': t.description or f'{t.transactionType} Transaction',
                'description': t.description or '',
                'amount': float(t.amount),
                'created_at': t.createdAt.isoformat(),
                'status': t.status.lower() if t.status else 'pending',
                'payment_method': t.paymentMethod or 'wallet',
                'transaction_id': str(t.transactionID),
                'job': None,  # TODO: Link to job if applicable
            })
        
        has_next = (offset + limit) < total_count
        
        return {
            "results": transaction_list,
            "count": total_count,
            "has_next": has_next,
            "next_page": page + 1 if has_next else None
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

#region MOBILE REVIEW ENDPOINTS

@mobile_router.post("/reviews/submit", auth=jwt_auth)
def mobile_submit_review(request, job_id: int, payload: SubmitReviewMobileSchema):
    """
    Submit a review after job completion
    Supports both client-to-worker and worker-to-client reviews
    Includes category ratings (quality, communication, punctuality, professionalism)
    """
    from .mobile_services import submit_review_mobile

    try:
        user = request.auth
        result = submit_review_mobile(
            user=user,
            job_id=job_id,
            rating_quality=payload.rating_quality,
            rating_communication=payload.rating_communication,
            rating_punctuality=payload.rating_punctuality,
            rating_professionalism=payload.rating_professionalism,
            comment=payload.comment,
            review_type=payload.review_type
        )

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to submit review')},
                status=400
            )
    except Exception as e:
        print(f"❌ [Mobile] Submit review error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to submit review"},
            status=500
        )


@mobile_router.get("/reviews/worker/{worker_id}", auth=jwt_auth)
def mobile_get_worker_reviews(request, worker_id: int, page: int = 1, limit: int = 20):
    """
    Get all reviews for a specific worker
    Returns paginated reviews with reviewer info
    """
    from .mobile_services import get_worker_reviews_mobile

    try:
        result = get_worker_reviews_mobile(
            worker_id=worker_id,
            page=page,
            limit=limit
        )

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch reviews')},
                status=400
            )
    except Exception as e:
        print(f"❌ [Mobile] Get worker reviews error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch worker reviews"},
            status=500
        )


@mobile_router.get("/reviews/client/{client_id}", auth=jwt_auth)
def mobile_get_client_reviews(request, client_id: int, page: int = 1, limit: int = 20):
    """
    Get all reviews for a specific client (reviews from workers about the client)
    Returns paginated reviews with reviewer info
    """
    from .mobile_services import get_client_reviews_mobile

    try:
        result = get_client_reviews_mobile(
            client_id=client_id,
            page=page,
            limit=limit
        )

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch reviews')},
                status=400
            )
    except Exception as e:
        print(f"❌ [Mobile] Get client reviews error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch client reviews"},
            status=500
        )


@mobile_router.get("/reviews/job/{job_id}", auth=jwt_auth)
def mobile_get_job_reviews(request, job_id: int):
    """
    Get all reviews for a specific job
    Returns both worker and client reviews
    """
    from .mobile_services import get_job_reviews_mobile

    try:
        result = get_job_reviews_mobile(job_id=job_id)

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch job reviews')},
                status=400
            )
    except Exception as e:
        print(f"❌ [Mobile] Get job reviews error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch job reviews"},
            status=500
        )


@mobile_router.get("/reviews/my-reviews", auth=jwt_auth)
def mobile_get_my_reviews(request, type: str = "given", page: int = 1, limit: int = 20):
    """
    Get user's reviews
    type: 'given' (reviews written by user) or 'received' (reviews about user)
    """
    from .mobile_services import get_my_reviews_mobile

    try:
        user = request.auth
        result = get_my_reviews_mobile(
            user=user,
            review_type=type,
            page=page,
            limit=limit
        )

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch reviews')},
                status=400
            )
    except Exception as e:
        print(f"❌ [Mobile] Get my reviews error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch my reviews"},
            status=500
        )


@mobile_router.get("/reviews/stats/{worker_id}", auth=jwt_auth)
def mobile_get_review_stats(request, worker_id: int):
    """
    Get review statistics for a worker
    Returns average rating, total reviews, rating breakdown, etc.
    """
    from .mobile_services import get_review_stats_mobile

    try:
        result = get_review_stats_mobile(worker_id=worker_id)

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch review stats')},
                status=400
            )
    except Exception as e:
        print(f"❌ [Mobile] Get review stats error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch review stats"},
            status=500
        )


@mobile_router.put("/reviews/{review_id}", auth=jwt_auth)
def mobile_edit_review(request, review_id: int, rating: int, comment: str):
    """
    Edit an existing review (only allowed within 24 hours)
    """
    from .mobile_services import edit_review_mobile

    try:
        user = request.auth
        result = edit_review_mobile(
            user=user,
            review_id=review_id,
            rating=rating,
            comment=comment
        )

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to edit review')},
                status=400
            )
    except Exception as e:
        print(f"❌ [Mobile] Edit review error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to edit review"},
            status=500
        )


@mobile_router.post("/reviews/{review_id}/report", auth=jwt_auth)
def mobile_report_review(request, review_id: int, reason: str):
    """
    Report a review for inappropriate content
    """
    from .mobile_services import report_review_mobile

    try:
        user = request.auth
        result = report_review_mobile(
            user=user,
            review_id=review_id,
            reason=reason
        )

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to report review')},
                status=400
            )
    except Exception as e:
        print(f"❌ [Mobile] Report review error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to report review"},
            status=500
        )


@mobile_router.get("/reviews/pending", auth=jwt_auth)
def mobile_get_pending_reviews(request):
    """
    Get list of jobs that need reviews from the current user
    Returns completed jobs where user hasn't submitted a review yet
    """
    from .mobile_services import get_pending_reviews_mobile

    try:
        user = request.auth
        result = get_pending_reviews_mobile(user=user)

        if result['success']:
            return result['data']
        else:
            return Response(
                {"error": result.get('error', 'Failed to fetch pending reviews')},
                status=400
            )
    except Exception as e:
        print(f"❌ [Mobile] Get pending reviews error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to fetch pending reviews"},
            status=500
        )

#endregion

#region PROFILE SWITCHING

@mobile_router.post("/profile/switch-profile", auth=jwt_auth)
def switch_profile(request):
    """
    Switch active profile without logging out
    Returns new JWT tokens with updated profile_type
    Expects JSON body: { "profile_type": "WORKER" | "CLIENT" }
    """
    from .services import generateCookie
    from .models import Profile
    import json

    try:
        user = request.auth
        
        # Parse JSON body
        try:
            body = json.loads(request.body.decode('utf-8'))
            profile_type = body.get('profile_type')
        except (json.JSONDecodeError, AttributeError):
            return Response(
                {"error": "Invalid JSON body"},
                status=400
            )
        
        if not profile_type:
            return Response(
                {"error": "Missing profile_type in request body"},
                status=400
            )
        
        # Validate profile_type
        if profile_type not in ['WORKER', 'CLIENT']:
            return Response(
                {"error": "Invalid profile type. Must be 'WORKER' or 'CLIENT'"},
                status=400
            )
        
        # Check if profile exists
        profile_exists = Profile.objects.filter(
            accountFK__accountID=user.accountID,
            profileType=profile_type
        ).exists()
        
        if not profile_exists:
            return Response(
                {"error": f"{profile_type} profile does not exist for this account"},
                status=404
            )
        
        # Generate new tokens with updated profile_type
        result = generateCookie(user, profile_type=profile_type)
        
        # Extract tokens from JsonResponse
        if hasattr(result, 'content'):
            response_data = json.loads(result.content.decode('utf-8'))
            
            # Add success message
            response_data['message'] = f"Switched to {profile_type} profile"
            response_data['profile_type'] = profile_type
            
            return response_data
        else:
            return result

    except Exception as e:
        print(f"❌ [Mobile] Switch profile error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to switch profile"},
            status=500
        )

#endregion

#region DUAL PROFILE MANAGEMENT

@mobile_router.get("/profile/dual-status", auth=jwt_auth)
def get_dual_profile_status(request):
    """
    Check if user has both worker and client profiles
    Returns which profiles exist and current active profile
    """
    from .models import Profile, WorkerProfile, ClientProfile

    try:
        user = request.auth
        
        # Get all profiles for this account
        profiles = Profile.objects.filter(accountFK=user)
        
        has_worker = False
        has_client = False
        current_profile_type = None
        worker_profile_id = None
        client_profile_id = None
        
        for profile in profiles:
            if profile.profileType == 'WORKER':
                has_worker = True
                worker_profile_id = profile.profileID
                # Check if worker profile exists
                if not WorkerProfile.objects.filter(profileID=profile).exists():
                    has_worker = False
            elif profile.profileType == 'CLIENT':
                has_client = True
                client_profile_id = profile.profileID
                # Check if client profile exists
                if not ClientProfile.objects.filter(profileID=profile).exists():
                    has_client = False
        
        # Get current active profile (most recently updated)
        current_profile = profiles.order_by('-profileID').first()
        if current_profile:
            current_profile_type = current_profile.profileType
        
        return {
            'success': True,
            'has_worker_profile': has_worker,
            'has_client_profile': has_client,
            'current_profile_type': current_profile_type,
            'worker_profile_id': worker_profile_id,
            'client_profile_id': client_profile_id,
        }
    except Exception as e:
        print(f"❌ [Mobile] Get dual profile status error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to get profile status"},
            status=500
        )


@mobile_router.post("/profile/create-client", auth=jwt_auth)
def create_client_profile(request):
    """
    Create a CLIENT profile for a user who currently only has a WORKER profile
    Creates blank client profile with default values
    """
    from .models import Profile, ClientProfile
    from django.utils import timezone

    try:
        user = request.auth
        
        # Check if client profile already exists
        existing_client = Profile.objects.filter(
            accountFK=user,
            profileType='CLIENT'
        ).first()
        
        if existing_client:
            return Response(
                {"error": "Client profile already exists"},
                status=400
            )
        
        # Get worker profile to copy basic info
        worker_profile = Profile.objects.filter(
            accountFK=user,
            profileType='WORKER'
        ).first()
        
        if not worker_profile:
            return Response(
                {"error": "Worker profile not found"},
                status=404
            )
        
        # Create new CLIENT profile with same basic info
        client_profile = Profile.objects.create(
            accountFK=user,
            firstName=worker_profile.firstName,
            middleName=worker_profile.middleName,
            lastName=worker_profile.lastName,
            contactNum=worker_profile.contactNum,
            birthDate=worker_profile.birthDate,
            profileType='CLIENT',
            profileImg=worker_profile.profileImg,  # Copy avatar
        )
        
        # Create ClientProfile entry
        ClientProfile.objects.create(
            profileID=client_profile,
            description="",
            totalJobsPosted=0,
            clientRating=0,
        )
        
        print(f"✅ [Mobile] Created CLIENT profile for user {user.email}")
        
        return {
            'success': True,
            'message': 'Client profile created successfully',
            'profile_id': client_profile.profileID,
        }
    except Exception as e:
        print(f"❌ [Mobile] Create client profile error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to create client profile"},
            status=500
        )


@mobile_router.post("/profile/create-worker", auth=jwt_auth)
def create_worker_profile(request):
    """
    Create a WORKER profile for a user who currently only has a CLIENT profile
    Creates blank worker profile with default values
    """
    from .models import Profile, WorkerProfile
    from django.utils import timezone

    try:
        user = request.auth
        
        # Check if worker profile already exists
        existing_worker = Profile.objects.filter(
            accountFK=user,
            profileType='WORKER'
        ).first()
        
        if existing_worker:
            return Response(
                {"error": "Worker profile already exists"},
                status=400
            )
        
        # Get client profile to copy basic info
        client_profile = Profile.objects.filter(
            accountFK=user,
            profileType='CLIENT'
        ).first()
        
        if not client_profile:
            return Response(
                {"error": "Client profile not found"},
                status=404
            )
        
        # Create new WORKER profile with same basic info
        worker_profile = Profile.objects.create(
            accountFK=user,
            firstName=client_profile.firstName,
            middleName=client_profile.middleName,
            lastName=client_profile.lastName,
            contactNum=client_profile.contactNum,
            birthDate=client_profile.birthDate,
            profileType='WORKER',
            profileImg=client_profile.profileImg,  # Copy avatar
        )
        
        # Create WorkerProfile entry
        WorkerProfile.objects.create(
            profileID=worker_profile,
            description="",
            workerRating=0,
            totalEarningGross=0,
            bio="",
            profile_completion_percentage=0,
        )
        
        print(f"✅ [Mobile] Created WORKER profile for user {user.email}")
        
        return {
            'success': True,
            'message': 'Worker profile created successfully',
            'profile_id': worker_profile.profileID,
        }
    except Exception as e:
        print(f"❌ [Mobile] Create worker profile error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to create worker profile"},
            status=500
        )


#region Payment Methods Management

@mobile_router.get("/payment-methods", auth=jwt_auth)
def get_payment_methods(request):
    """Get user's verified payment methods for withdrawals"""
    try:
        from .models import UserPaymentMethod
        
        # Only show verified payment methods
        # Unverified methods are pending verification or were canceled
        methods = UserPaymentMethod.objects.filter(
            accountFK=request.auth,
            isVerified=True
        )
        
        payment_methods = []
        for method in methods:
            payment_methods.append({
                'id': method.id,
                'type': method.methodType,
                'account_name': method.accountName,
                'account_number': method.accountNumber,
                'bank_name': method.bankName,
                'is_primary': method.isPrimary,
                'is_verified': method.isVerified,
                'created_at': method.createdAt.isoformat() if method.createdAt else None
            })
        
        return {
            'payment_methods': payment_methods
        }
    except Exception as e:
        print(f"❌ Get payment methods error: {str(e)}")
        return Response(
            {"error": "Failed to fetch payment methods"},
            status=500
        )


@mobile_router.post("/payment-methods", auth=jwt_auth)
def add_payment_method(request, payload: AddPaymentMethodSchema):
    """
    Add a new payment method for withdrawals.
    
    Supported types:
    - GCASH: Requires ₱1 PayMongo verification
    - BANK: Bank account (InstaPay/PESONet via PayMongo)
    - PAYPAL: PayPal account (manual processing)
    
    GCASH Flow:
    1. User submits GCash account details
    2. We create a ₱1 verification checkout via PayMongo
    3. User pays ₱1 using their GCash account
    4. PayMongo webhook confirms payment + verifies account
    5. ₱1 is credited to user's wallet as bonus
    6. Payment method is marked as verified
    
    BANK/PAYPAL Flow:
    1. User submits bank/PayPal account details
    2. Account is added in unverified state
    3. Admin manually verifies on first withdrawal
    """
    try:
        from .models import UserPaymentMethod
        from django.db import transaction as db_transaction
        from .paymongo_service import PayMongoService
        from django.conf import settings
        import re
        
        method_type = payload.type or 'GCASH'

        # Validate method type
        if method_type not in ['GCASH', 'BANK', 'PAYPAL']:
            return Response(
                {"error": "Invalid payment method type. Supported: GCASH, BANK, PAYPAL"},
                status=400
            )
        
        # Validate required fields
        if not payload.account_name or not payload.account_number:
            return Response(
                {"error": "Account name and number are required"},
                status=400
            )

        # Type-specific validation
        if method_type == 'GCASH':
            # Validate and clean GCash number format
            clean_number = payload.account_number.replace(' ', '').replace('-', '')
            if not clean_number.startswith('09') or len(clean_number) != 11:
                return Response(
                    {"error": "Invalid GCash number format (must be 11 digits starting with 09)"},
                    status=400
                )
        elif method_type == 'BANK':
            # Validate bank account number format (alphanumeric, 5-20 chars)
            clean_number = payload.account_number.replace(' ', '').replace('-', '')
            if not re.match(r'^[0-9]{5,20}$', clean_number):
                return Response(
                    {"error": "Invalid bank account number format (5-20 digits)"},
                    status=400
                )
            # Bank name is required for bank accounts
            if not payload.bank_name:
                return Response(
                    {"error": "Bank name is required for bank accounts"},
                    status=400
                )
        elif method_type == 'PAYPAL':
            # Validate PayPal email format
            clean_number = payload.account_number.strip().lower()
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, clean_number):
                return Response(
                    {"error": "Invalid PayPal email format"},
                    status=400
                )
        else:
            clean_number = payload.account_number
        
        # Check for duplicate account number
        existing = UserPaymentMethod.objects.filter(
            accountFK=request.auth,
            methodType=method_type,
            accountNumber=clean_number
        ).first()
        
        if existing:
            if existing.isVerified:
                return Response(
                    {"error": f"This {method_type.lower()} account is already verified on your account"},
                    status=400
                )
            else:
                # Delete unverified duplicate and create new
                existing.delete()
        
        with db_transaction.atomic():
            # Check if this is the first payment method
            has_existing = UserPaymentMethod.objects.filter(accountFK=request.auth).exists()
            is_first = not has_existing
            
            # Create payment method
            # Only GCASH requires verification, BANK and PAYPAL are manually verified by admin
            is_verified = (method_type in ['BANK', 'PAYPAL'])
            
            method = UserPaymentMethod.objects.create(
                accountFK=request.auth,
                methodType=method_type,
                accountName=payload.account_name,
                accountNumber=clean_number,
                bankName=payload.bank_name if method_type == 'BANK' else None,
                isPrimary=is_first,
                isVerified=is_verified
            )
            
            print(f"📱 Payment method created ({'verified' if is_verified else 'pending verification'}): {method.id} ({method_type}) for {request.auth.email}")
        
        # Only GCASH requires PayMongo verification
        if method_type != 'GCASH':
            return {
                'success': True,
                'message': f'{method_type} account added successfully',
                'method_id': method.id,
                'verification_required': False,
                'is_verified': is_verified,
                'note': 'Your account will be verified on your first withdrawal request' if method_type in ['BANK', 'PAYPAL'] else None
            }
        
        # Create PayMongo verification checkout for GCASH
        paymongo = PayMongoService()
        
        # Use the mobile API URL for redirects - must be accessible from user's phone
        # Redirect to our success/failure page that shows a nice message
        import os
        api_url = os.getenv('EXPO_PUBLIC_API_URL', 'http://localhost:8000').strip('"').strip("'")
        
        print(f"📱 Using API URL for redirects: {api_url}")
        
        result = paymongo.create_verification_checkout(
            user_email=request.auth.email,
            user_name=payload.account_name,
            payment_method_id=method.id,
            account_number=clean_number,
            success_url=f"{api_url}/api/mobile/payment-verified?success=true&method_id={method.id}",
            failure_url=f"{api_url}/api/mobile/payment-verified?success=false&method_id={method.id}"
        )
        
        if not result.get("success"):
            # Cleanup the pending method if checkout creation failed
            method.delete()
            return Response(
                {"error": result.get("error", "Failed to create verification checkout")},
                status=500
            )
        
        print(f"✅ Verification checkout created for method {method.id}: {result.get('checkout_id')}")
        
        return {
            'success': True,
            'message': 'Please complete GCash verification to activate this payment method',
            'method_id': method.id,
            'verification_required': True,
            'checkout_url': result.get('checkout_url'),
            'checkout_id': result.get('checkout_id'),
            'verification_amount': 1.00,
            'note': 'The ₱1 verification fee will be credited to your wallet after successful verification'
        }
        
    except Exception as e:
        print(f"❌ Add payment method error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Failed to add payment method"},
            status=500
        )


@mobile_router.delete("/payment-methods/{method_id}", auth=jwt_auth)
def delete_payment_method(request, method_id: int):
    """Delete a payment method"""
    try:
        from .models import UserPaymentMethod
        from django.db import transaction as db_transaction
        
        method = UserPaymentMethod.objects.filter(
            id=method_id,
            accountFK=request.auth
        ).first()
        
        if not method:
            return Response(
                {"error": "Payment method not found"},
                status=404
            )
        
        was_primary = method.isPrimary
        
        with db_transaction.atomic():
            method.delete()
            
            # If deleted method was primary, set another method as primary
            if was_primary:
                next_method = UserPaymentMethod.objects.filter(
                    accountFK=request.auth
                ).first()
                
                if next_method:
                    next_method.isPrimary = True
                    next_method.save()
                    print(f"✅ Set new primary payment method: {next_method.id}")
        
        print(f"✅ Payment method deleted: {method_id} for {request.auth.email}")
        
        return {
            'success': True,
            'message': 'Payment method removed successfully'
        }
    except Exception as e:
        print(f"❌ Delete payment method error: {str(e)}")
        return Response(
            {"error": "Failed to remove payment method"},
            status=500
        )


@mobile_router.post("/payment-methods/{method_id}/set-primary", auth=jwt_auth)
def set_primary_payment_method(request, method_id: int):
    """Set a payment method as primary"""
    try:
        from .models import UserPaymentMethod
        from django.db import transaction as db_transaction
        
        method = UserPaymentMethod.objects.filter(
            id=method_id,
            accountFK=request.auth
        ).first()
        
        if not method:
            return Response(
                {"error": "Payment method not found"},
                status=404
            )
        
        with db_transaction.atomic():
            # Remove primary from all other methods
            UserPaymentMethod.objects.filter(
                accountFK=request.auth
            ).update(isPrimary=False)
            
            # Set this method as primary
            method.isPrimary = True
            method.save()
        
        print(f"✅ Set primary payment method: {method_id} for {request.auth.email}")
        
        return {
            'success': True,
            'message': 'Primary payment method updated'
        }
    except Exception as e:
        print(f"❌ Set primary payment method error: {str(e)}")
        return Response(
            {"error": "Failed to update primary payment method"},
            status=500
        )

#endregion

#endregion


# ══════════════════════════════════════════════════════════════════════════════
# MAESTRO E2E TEST CLEANUP
# ══════════════════════════════════════════════════════════════════════════════
# This endpoint cleans up test data created by Maestro E2E tests
# ONLY works in non-production environments for safety
# ══════════════════════════════════════════════════════════════════════════════

@mobile_router.delete("/test/cleanup-maestro-data")
def cleanup_maestro_test_data(request):
    """
    Clean up test data created by Maestro E2E tests.
    
    Deletes:
    - Jobs with title containing '[TEST]' or 'MAESTRO'
    - Payment methods with name containing 'Maestro'
    - Saved jobs from test users (worker.test@iayos.com, client.test@iayos.com)
    - Job applications from test users
    
    SECURITY: Only works in non-production environments.
    """
    import os
    from django.conf import settings
    from django.db import transaction as db_transaction
    
    # Safety check - only allow in non-production
    env = os.environ.get('DJANGO_ENV', 'development')
    debug = getattr(settings, 'DEBUG', False)
    api_url = os.environ.get('API_URL', '')
    
    # Block cleanup in production
    if env == 'production' or (not debug and 'api.iayos.online' in api_url):
        return Response(
            {"error": "Cleanup not allowed in production environment"},
            status=403
        )
    
    try:
        from .models import (
            Job, JobApplication, SavedJob, UserPaymentMethod, 
            Accounts, Profile
        )
        
        cleanup_stats = {
            'jobs_deleted': 0,
            'applications_deleted': 0,
            'saved_jobs_deleted': 0,
            'payment_methods_deleted': 0,
        }
        
        # Test user emails
        test_emails = [
            'worker.test@iayos.com',
            'client.test@iayos.com',
            'test@maestro.test',
        ]
        
        with db_transaction.atomic():
            # 1. Delete test jobs (by title pattern)
            test_jobs = Job.objects.filter(
                title__icontains='[TEST]'
            ) | Job.objects.filter(
                title__icontains='MAESTRO'
            ) | Job.objects.filter(
                description__icontains='MAESTRO_TEST'
            )
            cleanup_stats['jobs_deleted'] = test_jobs.count()
            test_jobs.delete()
            
            # 2. Get test user accounts
            test_accounts = Accounts.objects.filter(email__in=test_emails)
            
            if test_accounts.exists():
                # 3. Delete job applications from test users
                for account in test_accounts:
                    profile = Profile.objects.filter(accountFK=account).first()
                    if profile and hasattr(profile, 'workerprofile'):
                        apps = JobApplication.objects.filter(
                            workerID=profile.workerprofile
                        )
                        cleanup_stats['applications_deleted'] += apps.count()
                        apps.delete()
                
                # 4. Delete saved jobs from test users
                for account in test_accounts:
                    profile = Profile.objects.filter(accountFK=account).first()
                    if profile:
                        saved = SavedJob.objects.filter(worker=profile)
                        cleanup_stats['saved_jobs_deleted'] += saved.count()
                        saved.delete()
            
            # 5. Delete test payment methods (by name pattern)
            test_payment_methods = UserPaymentMethod.objects.filter(
                accountName__icontains='Maestro'
            ) | UserPaymentMethod.objects.filter(
                accountName__icontains='Test User Maestro'
            )
            cleanup_stats['payment_methods_deleted'] = test_payment_methods.count()
            test_payment_methods.delete()
        
        print(f"🧹 Maestro test cleanup completed: {cleanup_stats}")
        
        return {
            'success': True,
            'message': 'Test data cleaned up successfully',
            'stats': cleanup_stats
        }
        
    except Exception as e:
        print(f"❌ Maestro cleanup error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": f"Cleanup failed: {str(e)}"},
            status=500
        )
