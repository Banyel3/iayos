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
)
from .authentication import jwt_auth  # Use Bearer token auth for mobile
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


@mobile_router.get("/auth/profile", auth=jwt_auth)
def mobile_get_profile(request):
    print(f"📱 [MOBILE PROFILE] Request received for user: {request.auth.email if request.auth else 'None'}")
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
            profile = Profile.objects.get(accountFK=request.auth)
            print(f"      Profile found: ID={profile.profileID}, Type={profile.profileType}")
        except Profile.DoesNotExist:
            print(f"      ❌ Profile not found for user!")
            return Response({"error": "Profile not found"}, status=400)
        
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
