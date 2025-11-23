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
    SendVerificationEmailSchema,
    SwitchProfileSchema,
)
from .authentication import jwt_auth, dual_auth  # Use Bearer token auth for mobile, dual_auth for endpoints that support both
from .profile_metrics_service import get_profile_metrics

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
    page: int = 1,
    limit: int = 20
):
    """
    Get paginated job listings optimized for mobile
    Returns minimal fields for list view performance
    """
    from .mobile_services import get_mobile_job_list

    print(f"📱 [MOBILE JOB LIST] Request received")
    print(f"   User: {request.auth.email}")
    print(f"   Filters: category={category}, budget={min_budget}-{max_budget}, location={location}")
    print(f"   Pagination: page={page}, limit={limit}")
    
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
    from .models import Profile, ClientProfile, WorkerProfile, JobPosting, JobApplication
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
                print(f"      ❌ Client profile not found!")
                return Response({"error": "Client profile not found"}, status=400)
            
            jobs_qs = JobPosting.objects.filter(
                clientID=client_profile
            ).select_related(
                'categoryID', 
                'assignedWorkerID__profileID__accountFK'
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
                'categoryID'
            ).prefetch_related('photos')
            print(f"      Jobs query created for worker")
        else:
            print(f"      ❌ Invalid profile type: {profile.profileType}")
            return Response({"error": "Invalid profile type"}, status=400)
        
        # Filter by status if provided
        if status_filter:
            print(f"\n   🔎 Filtering by status: {status_filter.upper()}")
            jobs_qs = jobs_qs.filter(status=status_filter.upper())
        
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
            }
            
            if job.clientID:
                client_prof = job.clientID.profileID
                job_data['client_name'] = f"{client_prof.firstName or ''} {client_prof.lastName or ''}".strip()
                job_data['client_img'] = client_prof.profileImg or ''
            
            if job.assignedWorkerID:
                worker_prof = job.assignedWorkerID.profileID
                job_data['worker_name'] = f"{worker_prof.firstName or ''} {worker_prof.lastName or ''}".strip()
                job_data['worker_img'] = worker_prof.profileImg or ''
            
            if profile.profileType == 'WORKER':
                application = JobApplication.objects.filter(
                    jobID=job,
                    workerID=worker_profile
                ).first()
                if application:
                    job_data['application_status'] = application.status
            
            # DEBUG: Log the job data being added
            print(f"         → job_type={job_data.get('job_type')}, invite_status={job_data.get('invite_status')}, assigned_worker_id={job_data.get('assigned_worker_id')}")
            
            job_list.append(job_data)
        
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
        
        return {
            "success": True,
            "applications": applications_data,
            "total": len(applications_data)
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
        
        # Update job status to IN_PROGRESS and assign the worker
        job.status = JobPosting.JobStatus.IN_PROGRESS
        job.assignedWorkerID = application.workerID
        
        # If worker negotiated a different budget and it was accepted, update the job budget
        if application.budgetOption == JobApplication.BudgetOption.NEGOTIATE:
            print(f"💰 [MOBILE] Updating job budget from ₱{job.budget} to negotiated price ₱{application.proposedBudget}")
            job.budget = application.proposedBudget
        
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
        
        # Reject all other pending applications
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
        ).select_related('jobID', 'jobID__clientID__profileID__accountFK').order_by('-createdAt')
        
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
    """Get current user's wallet balance - Mobile"""
    try:
        from .models import Wallet, Transaction
        from django.db.models import Sum
        from django.utils import timezone
        from decimal import Decimal

        # Get or create wallet for the user
        wallet, created = Wallet.objects.get_or_create(
            accountFK=request.auth,
            defaults={'balance': 0.00}
        )

        print(f"💵 [Mobile] Balance request for user {request.auth.email}: ₱{wallet.balance}")

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

        return {
            "success": True,
            "balance": float(wallet.balance),
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


@mobile_router.post("/wallet/deposit", auth=jwt_auth)
def mobile_deposit_funds(request, payload: DepositFundsSchema):
    """
    Mobile wallet deposit via Xendit GCash
    TEST MODE: Transaction auto-approved, funds added immediately
    """
    try:
        from .models import Wallet, Transaction, Profile
        from .xendit_service import XenditService
        from decimal import Decimal
        from django.utils import timezone
        
        amount = payload.amount
        payment_method = payload.payment_method or "GCASH"

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
            description=f"TOP UP via {payment_method.upper()} - ₱{amount}",
            paymentMethod=payment_method,
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
        transaction.xenditPaymentChannel = payment_method.upper()
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

#region MOBILE REVIEW ENDPOINTS

@mobile_router.post("/reviews/submit", auth=jwt_auth)
def mobile_submit_review(request, job_id: int, payload: SubmitReviewMobileSchema):
    """
    Submit a review after job completion
    Supports both client-to-worker and worker-to-client reviews
    Includes category ratings (quality, communication, professionalism, etc.)
    """
    from .mobile_services import submit_review_mobile

    try:
        user = request.auth
        result = submit_review_mobile(
            user=user,
            job_id=job_id,
            rating=payload.rating,
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

#endregion
