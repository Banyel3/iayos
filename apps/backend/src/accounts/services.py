# services.py
from .models import Accounts, Profile, Agency, kyc, kycFiles
from adminpanel.models import SystemRoles
from adminpanel.audit_service import log_action
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import timedelta, date
from django.http import JsonResponse
from django.conf import settings
import uuid
import jwt
import hashlib
import random
from datetime import timedelta
from iayos_project.utils import upload_kyc_doc
import os


def generate_otp():
    """Generate a random 6-digit OTP code"""
    return ''.join(random.choices('0123456789', k=6))


def get_full_image_url(image_path):
    """
    Ensure image URLs are absolute and properly formatted for mobile apps.
    If the path is relative or just a filename, construct the full Supabase URL.
    If it's already a full URL, return as is.
    """
    # Handle None, empty string, or whitespace-only strings
    if not image_path or not image_path.strip():
        print("   → Image path is None/empty/whitespace, returning None")
        return None
    
    # If it's already a full URL (starts with http:// or https://), return as is
    if image_path.startswith(('http://', 'https://')):
        print(f"   → Already full URL, returning as-is: {image_path}")
        return image_path
    
    # If it's a relative path starting with /, it's a local fallback image
    if image_path.startswith('/'):
        # For mobile apps, these won't work - return None to trigger fallback avatar
        print(f"   → Relative path detected ({image_path}), returning None for mobile")
        return None
    
    # Otherwise, it's a Supabase storage path - construct the full URL
    supabase_url = settings.SUPABASE_URL
    full_url = f"{supabase_url}/storage/v1/object/public/users/{image_path}"
    print(f"   → Constructing full URL: {full_url}")
    return full_url


def create_account_individ(data):
    # 1️⃣ Check if email exists
    if Accounts.objects.filter(email__iexact=data.email).exists():
        raise ValueError("Email already registered")

    # 2️⃣ Parse birth date
    try:
        birth_date = parse_date(data.birthDate)
        if not birth_date:
            raise ValueError("Invalid birth date format, use YYYY-MM-DD")
    except Exception as e:
        raise ValueError(f"Invalid date format: {str(e)}")
    
     # ✅ Check if user is over 18
    today = date.today()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    if age < 18:
        raise ValueError("You must be at least 18 years old to register")

    # Wrap the entire registration in a transaction to ensure consistency
    from django.db import transaction
    
    with transaction.atomic():
        # 3️⃣ Create Accounts user
        user = Accounts.objects.create_user(
            email=data.email,
            password=data.password,
            street_address=data.street_address,
            barangay=data.barangay,
            city=data.city,
            province=data.province,
            postal_code=data.postal_code,
            country=data.country
            
        )

        # Generate 6-digit OTP for email verification (5-minute expiry)
        otp_code = generate_otp()
        user.email_otp = otp_code
        user.email_otp_expiry = timezone.now() + timedelta(minutes=5)
        user.email_otp_attempts = 0
        
        # Keep legacy token fields for backward compatibility (can be removed later)
        verifyToken = uuid.uuid4()
        strVerifyToken = str(verifyToken)
        hashed_token = hashlib.sha256(strVerifyToken.encode("utf-8")).hexdigest()
        user.verifyToken = hashed_token
        user.verifyTokenExpiry = timezone.now() + timedelta(hours=24)
        user.save()

        # 4️⃣ Create Profile with profileType (defaults to CLIENT if not specified)
        profile_type = getattr(data, 'profileType', None) or 'CLIENT'
        print(f"📝 Creating profile with type: {profile_type}")
        
        profile = Profile.objects.create(
            accountFK=user,
            firstName=data.firstName,
            middleName=data.middleName,
            lastName=data.lastName,
            contactNum=data.contactNum,
            birthDate=birth_date,
            profileType=profile_type,
            profileImg=None  # NULL until user uploads a profile picture
        )

        # 5️⃣ Create WorkerProfile or ClientProfile immediately
        from .models import WorkerProfile, ClientProfile
        if profile_type == Profile.ProfileType.WORKER:
            WorkerProfile.objects.create(
                profileID=profile,
                description='',
                workerRating=0,
                totalEarningGross=0.00,
                availability_status='OFFLINE'
            )
            print(f"✅ Auto-created WorkerProfile during registration for {user.email}")
        elif profile_type == Profile.ProfileType.CLIENT:
            ClientProfile.objects.create(
                profileID=profile,
                description='',
                totalJobsPosted=0,
                clientRating=0
            )
            print(f"✅ Auto-created ClientProfile during registration for {user.email}")

    # Return registration data (OTP is kept server-side for security)
    verifyLink = f"{settings.FRONTEND_URL}/auth/verify-email?verifyToken={verifyToken}&id={user.accountID}"
    return {
        "accountID": user.accountID,
        "verifyLink": verifyLink,  # Legacy, kept for backward compatibility
        "verifyLinkExpire": user.verifyTokenExpiry.isoformat(),
        "email": user.email,
        "otp_expiry_minutes": 5  # Tells frontend how long OTP is valid
    }
def create_account_agency(data):
    # 1️⃣ Check if email exists
    if Accounts.objects.filter(email__iexact=data.email).exists():
        raise ValueError("Email already registered")
    
    user = Accounts.objects.create_user(
        email=data.email,
        password=data.password,
    )
    
    # Generate 6-digit OTP for email verification (5-minute expiry)
    otp_code = generate_otp()
    user.email_otp = otp_code
    user.email_otp_expiry = timezone.now() + timedelta(minutes=5)
    user.email_otp_attempts = 0
    
    # Keep legacy token fields for backward compatibility (can be removed later)
    verifyToken = uuid.uuid4()
    strVerifyToken = str(verifyToken)
    hashed_token = hashlib.sha256(strVerifyToken.encode("utf-8")).hexdigest()
    user.verifyToken = hashed_token
    user.verifyTokenExpiry = timezone.now() + timedelta(hours=24)
    user.save()

    # 4️⃣ Create Agency
    profile = Agency.objects.create(
        accountFK=user,
        businessName=data.businessName,
        street_address=data.street_address,
        barangay=data.barangay,
        city=data.city,
        province=data.province,
        postal_code=data.postal_code,
        businessDesc=""  # Provide empty string for required field
    )

    # Return OTP for email sending (frontend will trigger email)
    verifyLink = f"{settings.FRONTEND_URL}/auth/verify-email?verifyToken={verifyToken}&id={user.accountID}"
    
    result = {
        "accountID": user.accountID,
        "verifyLink": verifyLink,  # Legacy, kept for backward compatibility
        "verifyLinkExpire": user.verifyTokenExpiry.isoformat(),
        "email": user.email,
        "otp_code": otp_code,  # New: OTP code for email
        "otp_expiry_minutes": 5  # New: Expiry time in minutes
    }
    return result


def login_account(data, request=None):
    try:
        user = Accounts.objects.get(email__iexact=data.email)
    except Accounts.DoesNotExist:
        raise ValueError("Invalid email or password")

    if not user.check_password(data.password):
        raise ValueError("Invalid email or password")

    if not user.isVerified:
        raise ValueError("Please verify your email before logging in")
    
    # Check if account is banned (permanent)
    if user.is_banned:
        reason = user.banned_reason or "Your account has been permanently banned."
        raise ValueError(f"Your account has been banned: {reason}")
    
    # Check if account is suspended (temporary, may auto-expire)
    if user.is_suspended:
        if user.suspended_until and user.suspended_until < timezone.now():
            # Suspension expired — auto-reactivate
            user.is_suspended = False
            user.suspended_until = None
            user.suspended_reason = None
            user.save(update_fields=['is_suspended', 'suspended_until', 'suspended_reason'])
        else:
            reason = user.suspended_reason or "Your account has been temporarily suspended."
            raise ValueError(f"Your account has been suspended: {reason}")
    
    # Check if account is deactivated
    if not user.is_active:
        raise ValueError("Your account has been deactivated. Please contact support.")
    
    # Log user login for audit trail
    try:
        log_action(
            admin=user,  # For user actions, user is the "admin"
            action="user_login",
            entity_type="user",
            entity_id=str(user.accountID),
            details={"email": user.email, "action": "login"},
            before_value={},
            after_value={"logged_in": True},
            request=request
        )
    except Exception as e:
        # Don't block login if audit log fails
        print(f"⚠️ Failed to log user login: {e}")
    
    return generateCookie(user)

def generateCookie(user, profile_type=None):    
    now = timezone.now()
    
    # If profile_type not provided, fetch the most recent or preferred profile
    if profile_type is None:
        try:
            from .models import Profile
            # Get last used profile (most recently updated)
            profile = Profile.objects.filter(accountFK=user).order_by('-profileID').first()
            profile_type = profile.profileType if profile else None
        except Exception as e:
            print(f"⚠️ Could not fetch profile type for user {user.accountID}: {e}")
            profile_type = None
    
    access_payload = {
        'user_id': user.accountID,
        'email': user.email,
        'profile_type': profile_type,  # Include profile type in JWT
        'exp': now + settings.JWT_ACCESS_TOKEN_LIFETIME,  # From settings (default: 1 hour)
        'iat': now
    }

    refresh_payload = {
        'user_id': user.accountID,
        'email': user.email,
        'profile_type': profile_type,  # Include profile type in JWT
        'exp': now + settings.JWT_REFRESH_TOKEN_LIFETIME,  # From settings (default: 7 days)
        'iat': now
    }

    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')

    # Return tokens both in cookies (for web) and in response body (for mobile)
    response = JsonResponse({
        "message": "Login Successful",
        "access": access_token,
        "refresh": refresh_token,
        "user": {
            "accountID": user.accountID,
            "email": user.email,
            "isVerified": user.isVerified
        }
    })
    
    # Set cookies for Next.js web app compatibility
    # Production (Vercel/Render): secure=True, samesite='Lax', domain=.iayos.online
    # Development (localhost): secure=False, samesite='Lax', domain=None
    is_production = not settings.DEBUG
    cookie_domain = ".iayos.online" if is_production else None  # Shared domain for frontend/backend
    
    response.set_cookie(
        key="access",
        value=access_token,
        httponly=True,
        secure=is_production,           # True for HTTPS in production
        samesite='Lax',                 # Lax is sufficient when same parent domain
        max_age=3600,                   # 1 hour (matches token expiry)
        domain=cookie_domain,           # .iayos.online in production
    )
    response.set_cookie(
        key="refresh",
        value=refresh_token,
        httponly=True,
        secure=is_production,           # True for HTTPS in production
        samesite='Lax',                 # Lax is sufficient when same parent domain
        max_age=604800,                 # 7 days (matches token expiry)
        domain=cookie_domain,           # .iayos.online in production
    )
    return response

def _verify_account(dbVerifyToken, userID):
    verifyToken = hashlib.sha256(dbVerifyToken.encode('utf-8')).hexdigest()
    try:
        account = Accounts.objects.filter(accountID=userID, verifyToken=verifyToken).first()
    except Accounts.DoesNotExist:
        raise ValueError("Invalid or expired token")
    
    if not account:
        raise ValueError("Invalid or expired token")

    if account.verifyTokenExpiry < timezone.now():
        raise ValueError("Token has expired")

    account.isVerified = True
    account.verifyToken = None
    account.verifyTokenExpiry = None
    account.save()

    # Determine account type for response
    account_type = "individual"
    try:
        # Check if profile exists (use .first() to avoid dual profile error)
        profile_exists = Profile.objects.filter(accountFK=account).exists()
        if profile_exists:
            account_type = "individual"
        else:
            # Check for agency
            try:
                Agency.objects.get(accountFK=account)
                account_type = "agency"
            except Agency.DoesNotExist:
                pass
    except Exception:
        try:
            Agency.objects.get(accountFK=account)
            account_type = "agency"
        except Agency.DoesNotExist:
            pass

    return {
        "message": "Account verified successfully",
        "accountType": account_type,
        "accountID": account.accountID,
        "email": account.email
    }

def forgot_password_request(data):
    """Send password reset email to user"""
    
    # 1️⃣ Check if user exists
    try:
        user = Accounts.objects.get(email__iexact=data.email)
    except Accounts.DoesNotExist:
        # Don't reveal if email exists or not for security
        return {
            "message": "If an account with that email exists, we've sent password reset instructions.",
            "email": data.email
        }
    
    # 2️⃣ Generate reset token
    resetToken = uuid.uuid4()
    strResetToken = str(resetToken)
    hashed_token = hashlib.sha256(strResetToken.encode("utf-8")).hexdigest()
    
    # 3️⃣ Update user with reset token
    user.verifyToken = hashed_token  # Reuse verifyToken field for password reset
    user.verifyTokenExpiry = timezone.now() + timedelta(minutes=60)  # 1 hour expiry for password reset
    user.save()
    
    # 4️⃣ Generate reset link
    resetLink = f"{settings.FRONTEND_URL}/auth/forgot-password/verified?verifyToken={resetToken}&id={user.accountID}"
    
    return {
        "accountID": user.accountID,
        "verifyLink": resetLink,
        "verifyLinkExpire": user.verifyTokenExpiry,
        "email": user.email
    }

def reset_password_verify(verifyToken, userID, data, request=None):
    """Reset user password with verification token"""
    
    # 1️⃣ Validate passwords match
    if data.newPassword != data.confirmPassword:
        raise ValueError("Passwords don't match")
    
    # 2️⃣ Hash the verification token to match stored format
    hashed_token = hashlib.sha256(verifyToken.encode("utf-8")).hexdigest()
    
    # 3️⃣ Find user with matching token
    try:
        user = Accounts.objects.get(accountID=userID, verifyToken=hashed_token)
    except Accounts.DoesNotExist:
        raise ValueError("Invalid or expired reset token")
    
    # 4️⃣ Check if token has expired
    if user.verifyTokenExpiry < timezone.now():
        raise ValueError("Reset token has expired")
    
    # 5️⃣ Update password and clear reset token
    user.set_password(data.newPassword)  # This properly hashes the password
    user.verifyToken = None
    user.verifyTokenExpiry = None
    user.save()
    
    # 6️⃣ Log password reset for audit trail
    try:
        log_action(
            admin=user,  # For user actions, user is the "admin"
            action="password_reset",
            entity_type="user",
            entity_id=str(user.accountID),
            details={"email": user.email, "action": "password_reset"},
            before_value={},
            after_value={"password_changed": True},
            request=request
        )
    except Exception as e:
        # Don't block password reset if audit log fails
        print(f"⚠️ Failed to log password reset: {e}")
    
    return {"message": "Password updated successfully"}

def logout_account():
    """
    Logout user by deleting authentication cookies.
    CRITICAL: Must match the cookie parameters used in set_cookie() to properly delete them.
    """
    response = JsonResponse({"Message": "Logged Out successfully"})
    
    # Production (Vercel/Render): secure=True, samesite='Lax', domain=.iayos.online
    # Development (localhost): secure=False, samesite='Lax', domain=None
    is_production = not settings.DEBUG
    cookie_domain = ".iayos.online" if is_production else None
    
    # Delete cookies with EXACT same parameters used in set_cookie
    # Without matching domain/path/secure/samesite, cookies won't be deleted
    response.delete_cookie(
        key="access",
        path="/",
        domain=cookie_domain,
        samesite='Lax'
    )
    response.delete_cookie(
        key="refresh",
        path="/",
        domain=cookie_domain,
        samesite='Lax'
    )
    
    return response

def refresh_token(expired_token):
    try:
        # Decode the refresh token
        payload = jwt.decode(expired_token, settings.SECRET_KEY, algorithms=["HS256"])

        # Get the user
        user = Accounts.objects.get(accountID=payload['user_id'])

        # Create new access token (preserve profile_type from refresh token)
        access_payload = {
            'user_id': user.accountID,
            'email': user.email,
            'profile_type': payload.get('profile_type'),
            'exp': timezone.now() + settings.JWT_ACCESS_TOKEN_LIFETIME,
            'iat': timezone.now(),
        }

        access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')

        response = JsonResponse({"Message": "Token Refreshed"})
        is_production = not settings.DEBUG
        cookie_domain = ".iayos.online" if is_production else None
        response.set_cookie(
            "access",
            access_token,
            httponly=True,
            secure=is_production,
            samesite='Lax',
            max_age=int(settings.JWT_ACCESS_TOKEN_LIFETIME.total_seconds()),
            domain=cookie_domain,
        )
        return response

    except jwt.ExpiredSignatureError:
        raise ValueError("Refresh token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid refresh token")
    except Accounts.DoesNotExist:
        raise ValueError("User not found")


def fetch_currentUser(accountID, profile_type=None):
    try:
        account = Accounts.objects.get(accountID=accountID)

        # Check if a SystemRole exists for this account
        role_obj = SystemRoles.objects.filter(accountID=account).first()
        user_role = role_obj.systemRole if role_obj else None
        
        # Fallback: If no SystemRole but user is staff/superuser, treat as ADMIN
        if not user_role and (account.is_staff or account.is_superuser):
            user_role = "ADMIN"
            print(f"✅ fetch_currentUser: User {account.email} is staff/superuser, setting role to ADMIN")

        # AGENCY CHECK FIRST: Unless the JWT explicitly says WORKER or CLIENT
        # (mobile app), always check Agency before Profile. This prevents users
        # who have BOTH a stale CLIENT Profile and an Agency from being
        # misidentified as "individual".  Covers: profile_type=AGENCY,
        # profile_type=None (old cookie / web default), or any other value.
        _pt = (profile_type or '').upper()
        if _pt not in ('WORKER', 'CLIENT'):
            agency = Agency.objects.filter(accountFK=account).first()
            if agency:
                print(f"✅ fetch_currentUser: Agency found for {account.email} (profile_type={profile_type})")
                needs_completion = not agency.businessName or not agency.contactNumber
                return {
                    "accountID": account.accountID,
                    "email": account.email,
                    "role": user_role,
                    "kycVerified": account.KYCVerified,
                    "profile_data": {
                        "profileType": "AGENCY",
                        "businessName": agency.businessName or "",
                        "contactNumber": agency.contactNumber or "",
                        "businessDesc": agency.businessDesc or "",
                    },
                    "accountType": "agency",
                    "needs_profile_completion": needs_completion,
                }
            else:
                print(f"⚠️  fetch_currentUser: No Agency record for {account.email}, falling through to Profile")

        try:
            # If profile_type is specified (from JWT), fetch that specific profile
            if profile_type:
                print(f"🔍 fetch_currentUser: Looking for {profile_type} profile for account {accountID}")
                profile = Profile.objects.select_related("accountFK").filter(
                    accountFK=account, 
                    profileType=profile_type
                ).first()
                
                if profile:
                    print(f"✅ fetch_currentUser: Found {profile_type} profile (ID: {profile.profileID})")
                else:
                    print(f"⚠️  fetch_currentUser: No {profile_type} profile found for account {accountID}, falling back to any profile")
                    profile = Profile.objects.select_related("accountFK").filter(accountFK=account).order_by('-profileID').first()
                    if profile:
                        print(f"⚠️  fetch_currentUser: Using fallback profile type: {profile.profileType}")
            else:
                print(f"🔍 fetch_currentUser: No profile_type specified, using most recent profile")
                # Default behavior: get most recent profile
                profile = Profile.objects.select_related("accountFK").filter(accountFK=account).order_by('-profileID').first()
            
            if not profile:
                raise Profile.DoesNotExist

            # Debug: Log what's stored in DB vs what we're sending
            raw_profile_img = profile.profileImg
            formatted_profile_img = get_full_image_url(profile.profileImg)
            print(f"🖼️  Profile Image Debug for user {accountID}:")
            print(f"   Raw DB value: {raw_profile_img}")
            print(f"   Formatted URL: {formatted_profile_img}")

            profile_data = {
                "id": profile.profileID,  # Add profile ID
                "firstName": profile.firstName,
                "lastName": profile.lastName,
                "profileImg": formatted_profile_img,  # Ensure full URL for mobile
                "profileType": profile.profileType,
                "contactNum": profile.contactNum,
                "birthDate": profile.birthDate.isoformat() if profile.birthDate else None,
            }
            
            # If worker, add worker profile ID and skills
            if profile.profileType == "WORKER":
                try:
                    from .models import WorkerProfile, workerSpecialization, WorkerCertification
                    # Auto-repair: Get or create WorkerProfile if it's missing
                    worker_profile, created = WorkerProfile.objects.get_or_create(
                        profileID=profile,
                        defaults={
                            'description': '',
                            'workerRating': 0,
                            'totalEarningGross': 0.00,
                            'availability_status': 'OFFLINE'
                        }
                    )
                    
                    if created:
                        print(f"   🔧 Auto-repaired: Created missing WorkerProfile for profile {profile.profileID}")
                    
                    profile_data["workerProfileId"] = worker_profile.id  # WorkerProfile primary key
                    profile_data["bio"] = worker_profile.bio or ""
                    profile_data["hourlyRate"] = float(worker_profile.hourly_rate) if worker_profile.hourly_rate else None
                    profile_data["softSkills"] = worker_profile.soft_skills or ""
                    print(f"   🔧 Added worker profile ID: {worker_profile.id}")
                    
                    # Get skills with certification counts
                    specializations_query = workerSpecialization.objects.filter(
                        workerID=worker_profile
                    ).select_related('specializationID')
                    
                    skills_list = []
                    for ws in specializations_query:
                        cert_count = WorkerCertification.objects.filter(
                            workerID=worker_profile,
                            specializationID=ws
                        ).count()
                        
                        skills_list.append({
                            'id': ws.id,  # workerSpecialization ID
                            'specializationId': ws.specializationID.specializationID,
                            'name': ws.specializationID.specializationName,
                            'experienceYears': ws.experienceYears,
                            'certificationCount': cert_count
                        })
                    
                    profile_data["skills"] = skills_list
                    print(f"   🔧 Added {len(skills_list)} skills to profile data")
                    
                except WorkerProfile.DoesNotExist:
                    print(f"   ⚠️  Worker profile not found for profile {profile.profileID}")
                    
            print(f"   👤 Profile Data for {account.email}: Type={profile.profileType} (Raw: {repr(profile.profileType)})")

            # If a Profile exists we treat this as an "individual" account
            needs_profile_completion = not profile.contactNum or not profile.birthDate
            return {
                "accountID": account.accountID,
                "email": account.email,
                "role": user_role,  # <-- systemRole from SystemRoles
                "kycVerified": account.KYCVerified,  # <-- KYC verification status from Accounts
                "profile_data": profile_data,
                "accountType": "individual",
                "needs_profile_completion": needs_profile_completion,
            }

        except Profile.DoesNotExist:
            # No Profile found - check if this account has an Agency record
            try:
                agency = Agency.objects.filter(accountFK=account).first()
            except Exception:
                agency = None

            if agency:
                # Agency user — return agency-specific data
                needs_completion = not agency.businessName or not agency.contactNumber
                return {
                    "accountID": account.accountID,
                    "email": account.email,
                    "role": user_role,
                    "kycVerified": account.KYCVerified,
                    "profile_data": {
                        "profileType": "AGENCY",
                        "businessName": agency.businessName or "",
                        "contactNumber": agency.contactNumber or "",
                        "businessDesc": agency.businessDesc or "",
                    },
                    "accountType": "agency",
                    "needs_profile_completion": needs_completion,
                }
            else:
                return {
                    "accountID": account.accountID,
                    "email": account.email,
                    "role": user_role,
                    "kycVerified": account.KYCVerified,
                    "profile_data": None,
                    "user_data": {},
                    "skill_categories": [],
                    "accountType": "individual",
                }

    except Accounts.DoesNotExist:
        raise ValueError("User not found")

def assign_role(data):
    """
    Assign a role (WORKER or CLIENT) to a user and create the corresponding profile.
    Creates WorkerProfile for workers or ClientProfile for clients.
    """
    from .models import WorkerProfile, ClientProfile
    
    try:
        # Get user and profile
        user = Accounts.objects.get(email__iexact=data.email)
        
        # Try to get existing profile data from another profile type
        # (e.g., if user is creating WORKER profile but already has CLIENT profile)
        existing_profile = Profile.objects.filter(accountFK=user).first()
        
        # Get or create profile for selected type
        # Note: During initial onboarding, user has no profile yet
        # For dual profiles, we need to create a NEW profile with the selected type
        profile, created = Profile.objects.get_or_create(
            accountFK=user,
            profileType=data.selectedType,
            defaults={
                'firstName': existing_profile.firstName if existing_profile else '',
                'lastName': existing_profile.lastName if existing_profile else '',
                'contactNum': existing_profile.contactNum if existing_profile else '',
                'birthDate': existing_profile.birthDate if existing_profile else None,
                'latitude': None,
                'longitude': None,
                'location_sharing_enabled': False
            }
        )
        
        if created:
            print(f"✅ Created new {data.selectedType} profile for user {user.email}")
        else:
            print(f"✅ Using existing {data.selectedType} profile for user {user.email}")

        # Create WorkerProfile or ClientProfile based on role
        if data.selectedType == Profile.ProfileType.WORKER:
            # Create or update WorkerProfile
            worker_profile, created = WorkerProfile.objects.get_or_create(
                profileID=profile,
                defaults={
                    'description': '',
                    'workerRating': 0,
                    'totalEarningGross': 0.00,
                    'availability_status': 'OFFLINE'
                }
            )
            if created:
                print(f"✅ Created WorkerProfile for user {user.email}")
            else:
                print(f"ℹ️ WorkerProfile already exists for user {user.email}")
                
        elif data.selectedType == Profile.ProfileType.CLIENT:
            # Create or update ClientProfile
            client_profile, created = ClientProfile.objects.get_or_create(
                profileID=profile,
                defaults={
                    'description': '',
                    'totalJobsPosted': 0,
                    'clientRating': 0
                }
            )
            if created:
                print(f"✅ Created ClientProfile for user {user.email}")
            else:
                print(f"ℹ️ ClientProfile already exists for user {user.email}")

        return {"message": "Role Assigned Successfully"}
        
    except Accounts.DoesNotExist:
        raise ValueError("User account not found")
    except Profile.DoesNotExist:
        raise ValueError("User profile not found")
    except Exception as e:
        print(f"❌ Error assigning role: {str(e)}")
        raise ValueError(f"Failed to assign role: {str(e)}")

def upload_kyc_document(payload, frontID=None, backID=None, clearance=None, selfie=None, skip_ai_verification=True, extracted_id_data=None, extracted_clearance_data=None, pre_uploaded_urls=None):
    """
    Upload KYC documents to storage and create database records.
    
    Args:
        payload: KYC upload schema with accountID, IDType, clearanceType
        frontID, backID, clearance, selfie: File objects
        skip_ai_verification: If True (default), skip AI verification since 
                              per-step validation already happened via /validate-document.
                              Set to False to run full AI verification during upload.
        extracted_id_data: User-confirmed ID extraction data from per-step /extract-id endpoint
        extracted_clearance_data: User-confirmed clearance extraction data from per-step /extract-clearance endpoint
    """
    try:
        print(f"🔍 Starting KYC document upload for accountID: {payload.accountID}")
        print(f"   IDType: {payload.IDType}, ClearanceType: {payload.clearanceType}")
        print(f"   skip_ai_verification: {skip_ai_verification}")
        
        user = Accounts.objects.get(accountID=payload.accountID)
        print(f"✅ User found: {user.email}")

        # Define image inputs
        images = {
            'FRONTID': frontID,
            'BACKID': backID,
            'CLEARANCE': clearance,
            'SELFIE': selfie
        }
        
        # Log which files were received
        received_files = [key for key, file in images.items() if file]
        pre_url_keys = list(pre_uploaded_urls.keys()) if pre_uploaded_urls else []
        print(f"📎 Files received: {', '.join(received_files) if received_files else 'NONE'}")
        print(f"📎 Pre-uploaded URLs: {', '.join(pre_url_keys) if pre_url_keys else 'NONE'}")
        
        if not received_files and not pre_url_keys:
            print("❌ CRITICAL: No files received in upload request!")
            raise ValueError("No files were provided for upload")

        allowed_mime_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        max_size = 5 * 1024 * 1024  # 5 MB

        # Validate ID Type
        if payload.IDType:
            allowed_id_types = ['PASSPORT', 'NATIONALID', 'UMID', 'PHILHEALTH', 'DRIVERSLICENSE']
            if payload.IDType.upper() not in allowed_id_types:
                raise ValueError(f"Invalid ID type. Allowed: {', '.join(allowed_id_types)}")

        # Validate Clearance Type
        if payload.clearanceType:
            allowed_clearance_types = ['POLICE', 'NBI']
            if payload.clearanceType.upper() not in allowed_clearance_types:
                raise ValueError(f"Invalid clearance type. Allowed: {', '.join(allowed_clearance_types)}")

        # Generate unique filenames per document
        unique_names = {}
        for key, file in images.items():
            if not file:
                continue

            # Determine type label (for naming)
            type_label = None
            if key in ['FRONTID', 'BACKID']:
                type_label = payload.IDType.lower()
            elif key == 'CLEARANCE':
                type_label = payload.clearanceType.lower()
            else:
                type_label = key.lower()

            ext = os.path.splitext(file.name)[1]
            unique_names[key] = f"{key.lower()}_{type_label}_{uuid.uuid4().hex}{ext}"

        # Get or create KYC record
        kyc_record, created = kyc.objects.get_or_create(
            accountFK=user,
            defaults={'kyc_status': 'PENDING', 'notes': ''}
        )
        
        if created:
            print(f"✅ New KYC record created: kycID={kyc_record.kycID}")
        else:
            print(f"ℹ️  Existing KYC record found: kycID={kyc_record.kycID}, status={kyc_record.kyc_status}")

        # If KYC record already exists, delete old files to avoid duplicates
        # and reset status to PENDING for re-review
        if not created:
            old_files_count = kycFiles.objects.filter(kycID=kyc_record).count()
            kycFiles.objects.filter(kycID=kyc_record).delete()
            print(f"🗑️  Deleted {old_files_count} old kycFiles records for re-submission")
            
            kyc_record.kyc_status = 'PENDING'
            kyc_record.notes = 'Re-submitted'
            kyc_record.save()
            print(f"♻️  KYC status reset to PENDING for re-review")

        uploaded_files = []
        verification_results = []
        any_failed = False
        failure_messages = []
        
        # Store raw file data for face matching later
        file_data_cache = {}

        # Import verification service (deferred to avoid circular imports)
        from accounts.document_verification_service import verify_kyc_document, should_auto_reject, VerificationStatus, verify_face_match
        from django.utils import timezone

        # Upload each file
        for key, file in images.items():
            if not file:
                # Check if a pre-uploaded URL exists for this key
                if pre_uploaded_urls and key in pre_uploaded_urls:
                    pre_url = pre_uploaded_urls[key]
                    if key in ['FRONTID', 'BACKID']:
                        _id_type = payload.IDType.upper() if payload.IDType else key
                    elif key == 'CLEARANCE':
                        _id_type = payload.clearanceType.upper() if payload.clearanceType else key
                    else:
                        _id_type = None  # SELFIE has no IDType (field is null=True)
                    kycFiles.objects.create(
                        kycID=kyc_record,
                        idType=_id_type,
                        fileURL=pre_url,
                        fileName=f"{key.lower()}_staged",
                        fileSize=0
                    )
                    uploaded_files.append({'key': key, 'url': pre_url, 'pre_staged': True})
                    print(f"✅ Using pre-staged URL for {key}: {pre_url}")
                continue

            if file.content_type not in allowed_mime_types:
                raise ValueError(f"{key}: Invalid file type. Allowed: JPEG, PNG, PDF")

            if file.size > max_size:
                raise ValueError(f"{key}: File too large. Maximum size is 5MB")

            unique_filename = unique_names[key]
            print(f"📤 Uploading {key}: filename={unique_filename}, size={file.size} bytes")
            
            # Read file data for verification (before upload)
            file_data = file.read()
            file.seek(0)  # Reset file pointer for upload
            
            # Cache file data for face matching (FRONTID and SELFIE)
            if key in ['FRONTID', 'SELFIE']:
                file_data_cache[key] = file_data
            
            file_url = upload_kyc_doc(
                file=file,
                user_id=user.accountID,
                file_name=unique_filename
            )

            # Check if upload succeeded
            if not file_url:
                print(f"❌ CRITICAL: File upload failed for {key}! No URL returned from Supabase.")
                raise ValueError(f"Failed to upload {key} to Supabase storage. Please try again.")

            print(f"✅ Upload successful for {key}: {file_url}")

            # Assign proper ID type or clearance type
            id_type = None
            document_type_for_verification = key  # Default to FRONTID, BACKID, etc.
            if key in ['FRONTID', 'BACKID']:
                id_type = payload.IDType.upper()
                document_type_for_verification = payload.IDType.upper()
            elif key == 'CLEARANCE':
                id_type = payload.clearanceType.upper()
                document_type_for_verification = payload.clearanceType.upper()
            elif key == 'SELFIE':
                document_type_for_verification = 'SELFIE'

            # Run AI verification on the document (only if not skipped)
            verification_result = None
            should_reject = False
            
            if skip_ai_verification:
                # Skip AI - per-step validation already validated via /validate-document
                print(f"⏭️  Skipping AI verification for {key} (per-step validation already done)")
            else:
                print(f"🤖 Running AI verification for {key} (type: {document_type_for_verification})...")
                
                try:
                    verification_result = verify_kyc_document(
                        file_data=file_data,
                        document_type=document_type_for_verification,
                        file_name=unique_filename
                    )
                    verification_results.append({
                        "key": key,
                        "result": verification_result
                    })
                    
                    # Check if this document should be auto-rejected
                    should_reject, rejection_message = should_auto_reject(verification_result)
                    
                    if should_reject:
                        any_failed = True
                        failure_messages.append(f"{key}: {rejection_message}")
                        print(f"❌ AI Verification FAILED for {key}: {rejection_message}")
                    else:
                        print(f"✅ AI Verification PASSED for {key}: confidence={verification_result.confidence_score:.2f}")
                    
                except Exception as ve:
                    print(f"⚠️  AI Verification ERROR for {key}: {str(ve)}")
                    # Don't fail the upload, just log warning
                    verification_result = None
                    verification_results.append({
                        "key": key,
                        "result": None,
                        "error": str(ve)
                    })
                    should_reject = False  # Default to not rejecting on error

            print(f"💾 Creating kycFiles record: idType={id_type}, fileURL={file_url}")
            
            # Create kycFiles record with AI verification data
            kyc_file_data = {
                'kycID': kyc_record,
                'idType': id_type,
                'fileURL': file_url,
                'fileName': unique_filename,
                'fileSize': file.size
            }
            
            # Add AI verification fields if available
            if verification_result:
                kyc_file_data.update({
                    'ai_verification_status': verification_result.status.value,
                    'face_detected': verification_result.face_detected,
                    'face_count': verification_result.face_count,
                    'face_confidence': verification_result.details.get('face_detection', {}).get('confidence'),
                    'ocr_text': verification_result.extracted_text[:2000] if verification_result.extracted_text else None,
                    'ocr_confidence': verification_result.details.get('ocr', {}).get('confidence'),
                    'quality_score': verification_result.quality_score,
                    'ai_confidence_score': verification_result.confidence_score,
                    'ai_rejection_reason': verification_result.rejection_reason.value if verification_result.rejection_reason else None,
                    'ai_rejection_message': failure_messages[-1] if should_reject and failure_messages else None,
                    'ai_warnings': verification_result.warnings,
                    'ai_details': verification_result.details,
                    'verified_at': timezone.now()
                })
            
            kycFiles.objects.create(**kyc_file_data)
            
            print(f"✅ kycFiles record created successfully for {key}")

            uploaded_files.append({
                "file_type": key.lower(),
                "file_url": file_url,
                "file_name": unique_filename,
                "file_size": file.size,
                "ai_status": verification_result.status.value if verification_result else "SKIPPED",
                "ai_passed": not should_reject if verification_result else None
            })

        # ============================================
        # FACE MATCHING: Compare selfie with ID photo
        # Runs ASYNC in background thread to avoid
        # proxy timeout (dlib encoding takes 5-15s)
        # ============================================
        # Ensure pre-staged FRONTID/SELFIE bytes are in cache so face matching
        # runs even when files were uploaded in a prior request (pre-staged flow).
        for _face_key in ['FRONTID', 'SELFIE']:
            if _face_key not in file_data_cache and pre_uploaded_urls and _face_key in pre_uploaded_urls:
                try:
                    _pre_path = pre_uploaded_urls[_face_key]
                    # Extract storage path from full URL if needed
                    if '/object/public/' in _pre_path:
                        _pre_path = _pre_path.split('/object/public/kyc-docs/')[-1]
                    elif '/object/sign/' in _pre_path:
                        _pre_path = _pre_path.split('/object/sign/kyc-docs/')[-1].split('?')[0]
                    _face_bytes = settings.STORAGE.storage().from_('kyc-docs').download(_pre_path)
                    if _face_bytes:
                        file_data_cache[_face_key] = _face_bytes
                        print(f"📥 Downloaded {_face_key} bytes from storage for face matching ({len(_face_bytes):,} bytes)")
                    else:
                        print(f"⚠️ Could not download {_face_key} for face matching: empty response")
                except Exception as _face_dl_err:
                    print(f"⚠️ Could not download {_face_key} for face matching: {_face_dl_err}")

        face_match_result = None
        if 'FRONTID' in file_data_cache and 'SELFIE' in file_data_cache:
            print("🔍 Scheduling ASYNC face matching between ID and selfie...")
            import threading
            
            # Copy data for the background thread (Django request data won't be available later)
            frontid_data = file_data_cache['FRONTID']
            selfie_data = file_data_cache['SELFIE']
            kyc_id = kyc_record.kycID
            user_id = user.accountID
            
            def _run_face_match_async(frontid_bytes, selfie_bytes, kyc_record_id, account_id):
                """Background thread: run face comparison and store results in DB."""
                import django
                django.setup()  # Ensure Django is ready in this thread
                try:
                    from accounts.document_verification_service import verify_face_match as _verify_face_match
                    from accounts.models import KYCExtractedData, kyc as KYCModel, Notification
                    
                    print(f"🧵 [ASYNC FACE MATCH] Starting for kycID={kyc_record_id}...")
                    result = _verify_face_match(
                        id_image_data=frontid_bytes,
                        selfie_image_data=selfie_bytes,
                        similarity_threshold=0.55
                    )
                    
                    # Store result in KYCExtractedData
                    kyc_rec = KYCModel.objects.get(kycID=kyc_record_id)
                    extracted, _ = KYCExtractedData.objects.get_or_create(
                        kycID=kyc_rec,
                        defaults={'extraction_status': 'CONFIRMED'}
                    )
                    
                    # Fix A: key is 'error' not 'reason' in FaceComparisonResult.to_dict()
                    if result.get('skipped'):
                        print(f"🧵 [ASYNC FACE MATCH] Skipped: {result.get('error')}")
                        # face_recognition model not installed — leave KYC as PENDING
                        # for manual admin review instead of auto-approving.
                        kyc_rec.notes = (
                            "Pending manual review: Face comparison unavailable "
                            "(face_recognition model not installed on server). "
                            "Please verify ID and selfie match manually."
                        )
                        kyc_rec.save(update_fields=['notes'])
                        try:
                            from accounts.models import Accounts
                            account = Accounts.objects.get(accountID=account_id)
                            Notification.objects.create(
                                accountFK=account,
                                notificationType=Notification.NotificationType.KYC_APPROVED,
                                title='KYC Under Manual Review 🔍',
                                message='Your KYC submission is being reviewed by our team. You will be notified within 1-2 business days.',
                            )
                            print(f"🧵 [ASYNC FACE MATCH] 🔍 KYC flagged for manual review (kycID={kyc_record_id}) — face model unavailable")
                        except Exception as notif_err:
                            print(f"🧵 [ASYNC FACE MATCH] ⚠️ Notification error: {notif_err}")
                        return
                    
                    similarity = result.get('similarity', 0)
                    method = result.get('method', 'unknown')
                    is_verified = method in ('face_recognition', 'insightface', 'azure')
                    
                    extracted.face_match_score = similarity
                    extracted.face_match_completed = is_verified
                    extracted.save(update_fields=['face_match_score', 'face_match_completed'])
                    
                    if result.get('match'):
                        print(f"🧵 [ASYNC FACE MATCH] ✅ PASSED: similarity={similarity:.2f} (kycID={kyc_record_id})")
                        # Fix C: auto-approval was completely missing from the happy path.
                        # The reject branch correctly wrote REJECTED but APPROVED was never
                        # written — KYC stayed PENDING forever even after a passing face match.
                        try:
                            from accounts.models import Accounts
                            kyc_rec.kyc_status = 'APPROVED'
                            kyc_rec.notes = f"Auto-approved: Face match passed (similarity: {similarity:.0%})."
                            kyc_rec.save(update_fields=['kyc_status', 'notes'])
                            account = Accounts.objects.get(accountID=account_id)
                            account.KYCVerified = True
                            account.save(update_fields=['KYCVerified'])
                            Notification.objects.create(
                                accountFK=account,
                                notificationType=Notification.NotificationType.KYC_APPROVED,
                                title='KYC Verified ✅',
                                message='Your identity documents have been verified successfully.',
                            )
                            print(f"🧵 [ASYNC FACE MATCH] ✅ KYC auto-approved (kycID={kyc_record_id})")
                        except Exception as approve_err:
                            print(f"🧵 [ASYNC FACE MATCH] ⚠️ Auto-approve error: {approve_err}")
                    else:
                        if similarity > 0:
                            # Faces detected but don't match → auto-reject
                            print(f"🧵 [ASYNC FACE MATCH] ❌ FAILED: similarity={similarity:.2f} < 0.55 (kycID={kyc_record_id})")
                            kyc_rec.kyc_status = 'REJECTED'
                            kyc_rec.notes = f"Auto-rejected: Selfie does not match ID photo (similarity: {similarity:.0%})"
                            kyc_rec.save(update_fields=['kyc_status', 'notes'])
                            
                            # Notify user
                            try:
                                from accounts.models import Accounts
                                account = Accounts.objects.get(accountID=account_id)
                                Notification.objects.create(
                                    accountFK=account,
                                    notificationType=Notification.NotificationType.KYC_REJECTED,
                                    title='KYC Verification Failed ❌',
                                    message=f'Your selfie does not match your ID photo (similarity: {similarity:.0%}). Please resubmit with matching photos.',
                                )
                            except Exception as notif_err:
                                print(f"🧵 [ASYNC FACE MATCH] ⚠️ Notification error: {notif_err}")
                        else:
                            # Fix D: face_recognition available but couldn't encode faces
                            # (bad photo quality / no face detected). Flag for manual review
                            # instead of silently doing nothing.
                            print(f"🧵 [ASYNC FACE MATCH] ⚠️ Could not extract faces: {result.get('error')}")
                            kyc_rec.notes = (
                                f"Pending manual review: Unable to extract face encodings from documents. "
                                f"Error: {result.get('error')}"
                            )
                            kyc_rec.save(update_fields=['notes'])
                            try:
                                from accounts.models import Accounts
                                account = Accounts.objects.get(accountID=account_id)
                                Notification.objects.create(
                                    accountFK=account,
                                    notificationType=Notification.NotificationType.KYC_APPROVED,
                                    title='KYC Under Review 🔍',
                                    message='Your KYC submission is being reviewed manually by our team. You will be notified within 1-2 business days.',
                                )
                            except Exception as notif_err:
                                print(f"🧵 [ASYNC FACE MATCH] ⚠️ Notification error: {notif_err}")
                    
                    print(f"🧵 [ASYNC FACE MATCH] Complete for kycID={kyc_record_id}")
                    
                except Exception as async_err:
                    print(f"🧵 [ASYNC FACE MATCH] ❌ Error for kycID={kyc_record_id}: {str(async_err)}")
                    import traceback
                    traceback.print_exc()
            
            # Launch background thread
            thread = threading.Thread(
                target=_run_face_match_async,
                args=(frontid_data, selfie_data, kyc_id, user_id),
                daemon=True,
                name=f"face-match-kyc-{kyc_id}"
            )
            thread.start()
            print(f"🧵 Face match thread started (daemon) for kycID={kyc_id}")
            
            face_match_result = {
                "status": "processing",
                "message": "Face comparison is running in the background. Results will be stored automatically."
            }
        else:
            missing = []
            if 'FRONTID' not in file_data_cache:
                missing.append('FRONTID')
            if 'SELFIE' not in file_data_cache:
                missing.append('SELFIE')
            print(f"⏭️  Skipping face matching - missing: {', '.join(missing)}")

        # If any document failed AI verification, set KYC status to REJECTED
        # (Only applies when skip_ai_verification=False)
        if any_failed and not skip_ai_verification:
            kyc_record.kyc_status = 'REJECTED'
            # Format rejection messages in a user-friendly way with bullet points
            formatted_reasons = "\n".join([f"• {msg}" for msg in failure_messages])
            kyc_record.notes = f"Your documents could not be verified automatically:\n\n{formatted_reasons}\n\nPlease resubmit with clearer images."
            kyc_record.save()
            print(f"❌ KYC auto-rejected due to AI verification failures")
            
            return {
                "message": "KYC documents could not be verified",
                "kyc_id": kyc_record.kycID,
                "status": "REJECTED",
                "auto_rejected": True,
                "rejection_reasons": failure_messages,
                "files": uploaded_files,
                "face_match": face_match_result
            }

        # Verify all files were saved
        saved_files_count = kycFiles.objects.filter(kycID=kyc_record).count()
        print(f"✅ KYC upload complete! kycID={kyc_record.kycID}, Files saved: {saved_files_count}/{len(uploaded_files)}")
        
        if saved_files_count != len(uploaded_files):
            print(f"⚠️  WARNING: Mismatch between uploaded ({len(uploaded_files)}) and saved ({saved_files_count}) files!")

        # Store user-confirmed extraction data directly (from per-step /extract-id and /extract-clearance)
        # This replaces the old trigger_kyc_extraction_after_upload() which re-extracted from OCR
        if extracted_id_data or extracted_clearance_data:
            try:
                from .models import KYCExtractedData
                print(f"💾 [KYC UPLOAD] Storing user-confirmed extraction data...")
                
                extracted, created = KYCExtractedData.objects.get_or_create(
                    kycID=kyc_record,
                    defaults={'extraction_status': 'CONFIRMED'}
                )
                
                # Store ID extraction data
                if extracted_id_data:
                    if isinstance(extracted_id_data, str):
                        import json
                        extracted_id_data = json.loads(extracted_id_data)
                    
                    # Map frontend field names to model fields
                    field_mapping = {
                        'full_name': 'extracted_full_name',
                        'fullName': 'extracted_full_name',
                        'first_name': 'extracted_first_name',
                        'firstName': 'extracted_first_name',
                        'last_name': 'extracted_last_name',
                        'lastName': 'extracted_last_name',
                        'middle_name': 'extracted_middle_name',
                        'middleName': 'extracted_middle_name',
                        'id_number': 'extracted_id_number',
                        'idNumber': 'extracted_id_number',
                        'birth_date': 'extracted_birth_date',
                        'birthDate': 'extracted_birth_date',
                        'date_of_birth': 'extracted_birth_date',
                        'address': 'extracted_address',
                        'sex': 'extracted_sex',
                        'gender': 'extracted_sex',
                    }
                    
                    for frontend_key, model_field in field_mapping.items():
                        if frontend_key in extracted_id_data:
                            value = extracted_id_data[frontend_key]
                            # Handle nested objects with 'value' key
                            if isinstance(value, dict) and 'value' in value:
                                value = value['value']
                            if value:
                                setattr(extracted, model_field, value)
                                print(f"   📝 Set {model_field} = '{value[:50] if isinstance(value, str) and len(value) > 50 else value}'")
                
                # Store clearance extraction data
                if extracted_clearance_data:
                    if isinstance(extracted_clearance_data, str):
                        import json
                        extracted_clearance_data = json.loads(extracted_clearance_data)
                    
                    clearance_mapping = {
                        'clearance_number': 'extracted_clearance_number',
                        'clearanceNumber': 'extracted_clearance_number',
                        'nbi_number': 'extracted_clearance_number',
                        'nbiNumber': 'extracted_clearance_number',
                        'issue_date': 'extracted_clearance_issue_date',
                        'issueDate': 'extracted_clearance_issue_date',
                        'valid_until': 'extracted_clearance_validity_date',
                        'validUntil': 'extracted_clearance_validity_date',
                        'expiry_date': 'extracted_clearance_validity_date',
                        'expiryDate': 'extracted_clearance_validity_date',
                    }
                    
                    for frontend_key, model_field in clearance_mapping.items():
                        if frontend_key in extracted_clearance_data:
                            value = extracted_clearance_data[frontend_key]
                            if isinstance(value, dict) and 'value' in value:
                                value = value['value']
                            if value:
                                setattr(extracted, model_field, value)
                                print(f"   📝 Set {model_field} = '{value}'")
                
                extracted.extraction_status = 'CONFIRMED'
                extracted.save()
                print(f"✅ [KYC UPLOAD] User-confirmed data stored to KYCExtractedData")
                
            except Exception as ext_error:
                print(f"⚠️ [KYC UPLOAD] Failed to store extraction data: {str(ext_error)}")
                import traceback
                traceback.print_exc()
                # Don't fail upload - admin can still verify manually
        else:
            print(f"ℹ️ [KYC UPLOAD] No extraction data provided - admin will extract manually")

        return {
            "message": "KYC documents uploaded successfully",
            "kyc_id": kyc_record.kycID,
            "status": "PENDING",
            "files": uploaded_files,
            "face_match": face_match_result  # Include face matching result
        }

    except Accounts.DoesNotExist:
        raise ValueError("User not found")
    except ValueError:
        raise
    except Exception as e:
        print(f"KYC upload error: {str(e)}")
        raise ValueError("Internal server error during upload")

def get_kyc_status(user_id):
    """
    Get current KYC status and uploaded documents
    """
    try:
        user = Accounts.objects.get(accountID=user_id)

        try:
            kyc_record = kyc.objects.get(accountFK=user)
        except kyc.DoesNotExist:
            return {
                "status": "NOT_STARTED",
                "message": "No KYC submission found"
            }

        kyc_files = kycFiles.objects.filter(kycID=kyc_record)

        return {
            "kyc_id": kyc_record.kycID,
            "status": kyc_record.kyc_status,
            "notes": kyc_record.notes,
            "reviewed_at": kyc_record.reviewedAt,
            "submitted_at": kyc_record.createdAt,
            "files": [
                {
                    "id_type": f.idType,
                    "file_name": f.fileName,
                    "file_size": f.fileSize,
                    "uploaded_at": f.uploadedAt
                } for f in kyc_files
            ]
        }

    except Accounts.DoesNotExist:
        raise ValueError("User not found")
    except Exception as e:
        raise ValueError(f"Failed to fetch KYC status: {str(e)}")


def get_pending_kyc_submissions():
    """
    Get all pending KYC submissions (for admin)
    """
    try:
        pending_kyc = kyc.objects.filter(kyc_status='PENDING').select_related('accountFK')
        
        results = []
        for kyc_record in pending_kyc:
            files = kycFiles.objects.filter(kycID=kyc_record)
            results.append({
                "kyc_id": kyc_record.kycID,
                "account_id": kyc_record.accountFK.accountID,
                "email": kyc_record.accountFK.email,
                "submitted_at": kyc_record.createdAt,
                "files_count": files.count(),
                "files": [
                    {
                        "id_type": f.idType,
                        "file_name": f.fileName,
                        "file_url": f.fileURL
                    } for f in files
                ]
            })

        return {"pending_submissions": results}

    except Exception as e:
        raise ValueError(f"Failed to fetch pending KYC: {str(e)}")


def get_user_notifications(user_account_id, limit=50, unread_only=False, profile_type=None):
    """
    Fetch notifications for a specific user.
    
    Args:
        user_account_id: The account ID of the user
        limit: Maximum number of notifications to return (default 50)
        unread_only: If True, only return unread notifications
        profile_type: Filter by profile type (WORKER or CLIENT). 
                     If None, returns notifications with null profile_type only (account-level).
                     If provided, returns notifications for that profile type AND null profile_type.
        
    Returns:
        List of notification dictionaries
    """
    from .models import Notification
    from django.db.models import Q
    
    try:
        queryset = Notification.objects.filter(accountFK__accountID=user_account_id)
        
        # Filter by profile_type: show notifications for the specific profile + account-level (null)
        if profile_type:
            queryset = queryset.filter(
                Q(profile_type=profile_type) | Q(profile_type__isnull=True)
            )
        else:
            # If no profile_type provided, only show account-level notifications
            queryset = queryset.filter(profile_type__isnull=True)
        
        if unread_only:
            queryset = queryset.filter(isRead=False)
        
        queryset = queryset.order_by('-createdAt')[:limit]
        
        notifications = []
        for notif in queryset:
            notifications.append({
                "notificationID": notif.notificationID,
                "type": notif.notificationType,
                "title": notif.title,
                "message": notif.message,
                "isRead": notif.isRead,
                "createdAt": notif.createdAt.isoformat(),
                "readAt": notif.readAt.isoformat() if notif.readAt else None,
                "relatedKYCLogID": notif.relatedKYCLogID,
                "profileType": notif.profile_type,
            })
        
        return notifications
        
    except Exception as e:
        print(f"❌ Error fetching notifications: {str(e)}")
        raise


def mark_notification_as_read(user_account_id, notification_id):
    """
    Mark a specific notification as read.
    
    Args:
        user_account_id: The account ID of the user
        notification_id: The notification ID to mark as read
        
    Returns:
        Success boolean
    """
    from .models import Notification
    
    try:
        notification = Notification.objects.get(
            notificationID=notification_id,
            accountFK__accountID=user_account_id
        )
        
        if not notification.isRead:
            notification.isRead = True
            notification.readAt = timezone.now()
            notification.save()
            print(f"✅ Notification {notification_id} marked as read")
        
        return True
        
    except Notification.DoesNotExist:
        raise ValueError("Notification not found")
    except Exception as e:
        print(f"❌ Error marking notification as read: {str(e)}")
        raise


def mark_all_notifications_as_read(user_account_id):
    """
    Mark all notifications as read for a user.
    
    Args:
        user_account_id: The account ID of the user
        
    Returns:
        Number of notifications marked as read
    """
    from .models import Notification
    
    try:
        updated_count = Notification.objects.filter(
            accountFK__accountID=user_account_id,
            isRead=False
        ).update(
            isRead=True,
            readAt=timezone.now()
        )
        
        print(f"✅ Marked {updated_count} notifications as read")
        return updated_count
        
    except Exception as e:
        print(f"❌ Error marking all notifications as read: {str(e)}")
        raise


def get_unread_notification_count(user_account_id, profile_type=None):
    """
    Get the count of unread notifications for a user.

    Args:
        user_account_id: The account ID of the user
        profile_type: Filter by profile type (WORKER or CLIENT).
                     If None, counts only account-level notifications.
                     If provided, counts profile-specific + account-level notifications.

    Returns:
        Integer count of unread notifications
    """
    from .models import Notification
    from django.db.models import Q

    try:
        queryset = Notification.objects.filter(
            accountFK__accountID=user_account_id,
            isRead=False
        )
        
        # Filter by profile_type: count notifications for the specific profile + account-level (null)
        if profile_type:
            queryset = queryset.filter(
                Q(profile_type=profile_type) | Q(profile_type__isnull=True)
            )
        else:
            # If no profile_type provided, only count account-level notifications
            queryset = queryset.filter(profile_type__isnull=True)
        
        count = queryset.count()

        return count

    except Exception as e:
        print(f"❌ Error getting unread notification count: {str(e)}")
        raise


def register_push_token_service(user_account_id, push_token, device_type="android"):
    """
    Register or update an Expo push token for a user.
    If the token already exists, update its lastUsed timestamp.

    Args:
        user_account_id: The account ID of the user
        push_token: Expo push token string
        device_type: 'ios' or 'android'

    Returns:
        PushToken instance
    """
    from .models import PushToken, Accounts

    try:
        user = Accounts.objects.get(accountID=user_account_id)

        # Check if this token already exists
        token, created = PushToken.objects.update_or_create(
            pushToken=push_token,
            defaults={
                'accountFK': user,
                'deviceType': device_type,
                'isActive': True,
                'lastUsed': timezone.now()
            }
        )

        if not created:
            # Token already existed, just update lastUsed
            token.lastUsed = timezone.now()
            token.isActive = True
            token.save()

        print(f"✅ Push token registered for user {user.email}: {push_token[:20]}...")
        return token

    except Exception as e:
        print(f"❌ Error registering push token: {str(e)}")
        raise


def get_notification_settings_service(user_account_id):
    """
    Get or create notification settings for a user.

    Args:
        user_account_id: The account ID of the user

    Returns:
        NotificationSettings instance
    """
    from .models import NotificationSettings, Accounts

    try:
        user = Accounts.objects.get(accountID=user_account_id)

        # Get or create notification settings with defaults
        settings, created = NotificationSettings.objects.get_or_create(
            accountFK=user,
            defaults={
                'pushEnabled': True,
                'soundEnabled': True,
                'jobUpdates': True,
                'messages': True,
                'payments': True,
                'reviews': True,
                'kycUpdates': True,
            }
        )

        if created:
            print(f"✅ Created default notification settings for user {user.email}")

        return settings

    except Exception as e:
        print(f"❌ Error getting notification settings: {str(e)}")
        raise


def update_notification_settings_service(user_account_id, settings_data):
    """
    Update notification settings for a user.

    Args:
        user_account_id: The account ID of the user
        settings_data: Dictionary of settings to update

    Returns:
        Updated NotificationSettings instance
    """
    from .models import NotificationSettings, Accounts
    from datetime import datetime

    try:
        user = Accounts.objects.get(accountID=user_account_id)
        settings, created = NotificationSettings.objects.get_or_create(
            accountFK=user
        )

        # Update boolean fields
        for field in ['pushEnabled', 'soundEnabled', 'jobUpdates', 'messages', 'payments', 'reviews', 'kycUpdates']:
            if field in settings_data:
                setattr(settings, field, settings_data[field])

        # Update time fields
        if 'doNotDisturbStart' in settings_data:
            if settings_data['doNotDisturbStart']:
                try:
                    time_obj = datetime.strptime(settings_data['doNotDisturbStart'], "%H:%M").time()
                    settings.doNotDisturbStart = time_obj
                except ValueError:
                    pass
            else:
                settings.doNotDisturbStart = None

        if 'doNotDisturbEnd' in settings_data:
            if settings_data['doNotDisturbEnd']:
                try:
                    time_obj = datetime.strptime(settings_data['doNotDisturbEnd'], "%H:%M").time()
                    settings.doNotDisturbEnd = time_obj
                except ValueError:
                    pass
            else:
                settings.doNotDisturbEnd = None

        settings.save()
        print(f"✅ Updated notification settings for user {user.email}")
        return settings

    except Exception as e:
        print(f"❌ Error updating notification settings: {str(e)}")
        raise


def delete_notification_service(user_account_id, notification_id):
    """
    Delete a notification for a user.

    Args:
        user_account_id: The account ID of the user
        notification_id: The ID of the notification to delete

    Returns:
        Boolean indicating success
    """
    from .models import Notification

    try:
        # Only allow users to delete their own notifications
        notification = Notification.objects.filter(
            notificationID=notification_id,
            accountFK__accountID=user_account_id
        ).first()

        if notification:
            notification.delete()
            print(f"✅ Deleted notification {notification_id} for user {user_account_id}")
            return True
        else:
            print(f"⚠️ Notification {notification_id} not found for user {user_account_id}")
            return False

    except Exception as e:
        print(f"❌ Error deleting notification: {str(e)}")
        raise


def get_all_workers(client_latitude: float = None, client_longitude: float = None):
    """
    Fetch all workers with their profiles and specializations.
    
    Args:
        client_latitude: Optional latitude of the client viewing workers
        client_longitude: Optional longitude of the client viewing workers
    
    Returns:
        List of worker dictionaries matching WorkerListing interface
    """
    from .models import WorkerProfile, Profile, workerSpecialization, Specializations, Accounts
    
    try:
        # Query all worker profiles with related data - ONLY AVAILABLE workers
        worker_profiles = WorkerProfile.objects.select_related(
            'profileID',
            'profileID__accountFK'
        ).filter(
            availability_status='AVAILABLE'  # Use string value instead of enum
        ).all()
        
        workers = []
        
        for worker_profile in worker_profiles:
            profile = worker_profile.profileID
            account = profile.accountFK
            
            # Get primary specialization (first one if multiple)
            worker_spec = workerSpecialization.objects.filter(
                workerID=worker_profile
            ).select_related('specializationID').first()
            
            specialization_name = "General Worker"
            experience_years = 0
            
            if worker_spec:
                specialization_name = worker_spec.specializationID.specializationName
                experience_years = worker_spec.experienceYears
            
            # Format experience text
            if experience_years == 0:
                experience_text = "New"
            elif experience_years == 1:
                experience_text = "1 year"
            else:
                experience_text = f"{experience_years}+ years"
            
            # Calculate distance if client location is provided
            distance = None
            if client_latitude is not None and client_longitude is not None:
                # Check if worker has location data and has location sharing enabled
                if (profile.latitude is not None and 
                    profile.longitude is not None and 
                    profile.location_sharing_enabled):
                    distance = calculate_distance(
                        client_latitude,
                        client_longitude,
                        float(profile.latitude),
                        float(profile.longitude)
                    )
                    distance = round(distance, 1)  # Round to 1 decimal place
            
            # Use placeholder distance if no location data available
            if distance is None:
                distance = 999.9  # High number to sort workers without location data to the end
            
            # Build worker data matching WorkerListing interface
            worker_data = {
                "id": str(account.accountID),
                "name": f"{profile.firstName} {profile.lastName}",
                "avatar": profile.profileImg if profile.profileImg else "/worker1.jpg",
                "rating": round(worker_profile.workerRating / 20, 1) if worker_profile.workerRating > 0 else 0.0,  # Convert 0-100 to 0-5 scale
                "reviewCount": 0,  # TODO: Implement review system
                "startingPrice": "₱500",  # TODO: Add pricing to WorkerProfile model
                "experience": experience_text,
                "specialization": specialization_name,
                "isVerified": account.KYCVerified,
                "distance": distance
            }
            
            workers.append(worker_data)
        
        # Sort by distance
        workers.sort(key=lambda x: x['distance'])
        
        print(f"✅ Fetched {len(workers)} workers (client location: {client_latitude}, {client_longitude})")
        return workers
        
    except Exception as e:
        print(f"❌ Error fetching workers: {str(e)}")
        raise


def get_worker_by_id(user_id, client_latitude: float = None, client_longitude: float = None):
    """
    Fetch a single worker by their account ID.
    
    Args:
        user_id: The account ID of the worker
        client_latitude: Optional latitude of the client viewing the worker
        client_longitude: Optional longitude of the client viewing the worker
        
    Returns:
        Worker dictionary matching WorkerListing interface, or None if not found
    """
    from .models import WorkerProfile, Profile, workerSpecialization, Specializations, Accounts
    
    try:
        # Get the account
        account = Accounts.objects.get(accountID=user_id)
        
        # Get the profile
        profile = Profile.objects.get(accountFK=account, profileType=Profile.ProfileType.WORKER)
        
        # Get the worker profile
        worker_profile = WorkerProfile.objects.get(profileID=profile)
        
        # Get primary specialization
        worker_spec = workerSpecialization.objects.filter(
            workerID=worker_profile
        ).select_related('specializationID').first()
        
        specialization_name = "General Worker"
        experience_years = 0
        
        if worker_spec:
            specialization_name = worker_spec.specializationID.specializationName
            experience_years = worker_spec.experienceYears
        
        # Format experience text
        if experience_years == 0:
            experience_text = "New"
        elif experience_years == 1:
            experience_text = "1 year"
        else:
            experience_text = f"{experience_years}+ years"
        
        # Calculate distance if client location is provided
        distance = None
        if client_latitude is not None and client_longitude is not None:
            # Check if worker has location data and has location sharing enabled
            if (profile.latitude is not None and 
                profile.longitude is not None and 
                profile.location_sharing_enabled):
                distance = calculate_distance(
                    client_latitude,
                    client_longitude,
                    float(profile.latitude),
                    float(profile.longitude)
                )
                distance = round(distance, 1)  # Round to 1 decimal place
        
        # Use placeholder distance if no location data available
        if distance is None:
            distance = None  # Return None instead of placeholder to indicate no distance available
        
        # Build worker data
        worker_data = {
            "id": str(account.accountID),
            "name": f"{profile.firstName} {profile.lastName}",
            "avatar": profile.profileImg if profile.profileImg else "/worker1.jpg",
            "rating": round(worker_profile.workerRating / 20, 1) if worker_profile.workerRating > 0 else 0.0,
            "reviewCount": 0,  # TODO: Implement review system
            "startingPrice": "₱500",  # TODO: Add pricing to WorkerProfile model
            "experience": experience_text,
            "specialization": specialization_name,
            "isVerified": account.KYCVerified,
            "distance": distance  # Will be None if location unavailable
        }
        
        print(f"✅ Fetched worker {user_id} (distance: {distance} km)")
        return worker_data
        
    except Accounts.DoesNotExist:
        print(f"❌ Account {user_id} not found")
        return None
    except Profile.DoesNotExist:
        print(f"❌ Profile for account {user_id} not found")
        return None
    except WorkerProfile.DoesNotExist:
        print(f"❌ Worker profile for account {user_id} not found")
        return None
    except Exception as e:
        print(f"❌ Error fetching worker {user_id}: {str(e)}")
        raise


def update_worker_availability(user_id, is_available):
    """
    Update a worker's availability status.
    WorkerProfile should already exist from role selection.
    
    Args:
        user_id: The account ID of the worker
        is_available: Boolean indicating if worker is available (True) or offline (False)
        
    Returns:
        Dictionary with updated availability status
    """
    from .models import WorkerProfile, Profile, Accounts
    
    try:
        # Get the account
        account = Accounts.objects.get(accountID=user_id)
        
        # Get the profile
        profile = Profile.objects.get(accountFK=account, profileType=Profile.ProfileType.WORKER)
        
        # Get or create the worker profile (fallback for legacy users)
        worker_profile, created = WorkerProfile.objects.get_or_create(
            profileID=profile,
            defaults={
                'description': '',
                'workerRating': 0,
                'totalEarningGross': 0.00,
                'availability_status': 'OFFLINE'
            }
        )
        
        if created:
            print(f"⚠️ Created WorkerProfile for legacy user {user_id} (should have been created during role selection)")
        
        # Update availability status
        if is_available:
            worker_profile.availability_status = 'AVAILABLE'
        else:
            worker_profile.availability_status = 'OFFLINE'
        
        worker_profile.save()
        
        print(f"✅ Updated worker {user_id} availability to {worker_profile.availability_status}")
        
        return {
            "accountID": user_id,
            "availabilityStatus": worker_profile.availability_status,
            "isAvailable": is_available
        }
        
    except Accounts.DoesNotExist:
        print(f"❌ Account {user_id} not found")
        raise ValueError("Account not found")
    except Profile.DoesNotExist:
        print(f"❌ Profile for account {user_id} not found or not a worker")
        raise ValueError("Worker profile not found")
    except Exception as e:
        print(f"❌ Error updating worker availability: {str(e)}")
        raise


def get_worker_availability(user_id):
    """
    Get a worker's current availability status.
    WorkerProfile should already exist from role selection.
    
    Args:
        user_id: The account ID of the worker
        
    Returns:
        Dictionary with availability status
    """
    from .models import WorkerProfile, Profile, Accounts
    
    try:
        # Get the account
        account = Accounts.objects.get(accountID=user_id)
        
        # Get the profile
        profile = Profile.objects.get(accountFK=account, profileType=Profile.ProfileType.WORKER)
        
        # Get or create the worker profile (fallback for legacy users)
        worker_profile, created = WorkerProfile.objects.get_or_create(
            profileID=profile,
            defaults={
                'description': '',
                'workerRating': 0,
                'totalEarningGross': 0.00,
                'availability_status': 'OFFLINE'
            }
        )
        
        if created:
            print(f"⚠️ Created WorkerProfile for legacy user {user_id} (should have been created during role selection)")
        
        is_available = worker_profile.availability_status == 'AVAILABLE'
        
        return {
            "accountID": user_id,
            "availabilityStatus": worker_profile.availability_status,
            "isAvailable": is_available
        }
        
    except Exception as e:
        print(f"❌ Error getting worker availability: {str(e)}")
        raise


#region LOCATION TRACKING SERVICES

def update_user_location(account_id: int, latitude: float, longitude: float):
    """
    Update user's GPS location
    """
    from django.utils import timezone
    
    try:
        # Get the user's profile
        profile = Profile.objects.filter(accountFK_id=account_id).first()
        
        if not profile:
            raise ValueError("Profile not found")
        
        # Update location
        profile.latitude = latitude
        profile.longitude = longitude
        profile.location_updated_at = timezone.now()
        
        # Enable location sharing if not already enabled
        if not profile.location_sharing_enabled:
            profile.location_sharing_enabled = True
        
        profile.save()
        
        return {
            "profile_id": profile.profileID,
            "latitude": float(profile.latitude),
            "longitude": float(profile.longitude),
            "location_updated_at": profile.location_updated_at.isoformat(),
            "location_sharing_enabled": profile.location_sharing_enabled,
            "message": "Location updated successfully"
        }
        
    except Profile.DoesNotExist:
        raise ValueError("Profile not found")
    except Exception as e:
        print(f"❌ Error updating location: {str(e)}")
        raise


def toggle_location_sharing(account_id: int, enabled: bool):
    """
    Enable or disable location sharing for a user
    """
    try:
        profile = Profile.objects.filter(accountFK_id=account_id).first()
        
        if not profile:
            raise ValueError("Profile not found")
        
        profile.location_sharing_enabled = enabled
        profile.save()
        
        return {
            "profile_id": profile.profileID,
            "latitude": float(profile.latitude) if profile.latitude else None,
            "longitude": float(profile.longitude) if profile.longitude else None,
            "location_updated_at": profile.location_updated_at.isoformat() if profile.location_updated_at else None,
            "location_sharing_enabled": profile.location_sharing_enabled,
            "message": f"Location sharing {'enabled' if enabled else 'disabled'} successfully"
        }
        
    except Profile.DoesNotExist:
        raise ValueError("Profile not found")
    except Exception as e:
        print(f"❌ Error toggling location sharing: {str(e)}")
        raise


def get_user_location(account_id: int):
    """
    Get user's current location
    """
    try:
        profile = Profile.objects.filter(accountFK_id=account_id).first()
        
        if not profile:
            raise ValueError("Profile not found")
        
        return {
            "profile_id": profile.profileID,
            "latitude": float(profile.latitude) if profile.latitude else None,
            "longitude": float(profile.longitude) if profile.longitude else None,
            "location_updated_at": profile.location_updated_at.isoformat() if profile.location_updated_at else None,
            "location_sharing_enabled": profile.location_sharing_enabled,
            "message": "Location retrieved successfully"
        }
        
    except Profile.DoesNotExist:
        raise ValueError("Profile not found")
    except Exception as e:
        print(f"❌ Error getting location: {str(e)}")
        raise


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two GPS coordinates using Haversine formula
    Returns distance in kilometers
    """
    from math import radians, cos, sin, asin, sqrt
    
    # Convert to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    # Radius of Earth in kilometers
    r = 6371
    
    return c * r


def find_nearby_workers(latitude: float, longitude: float, radius_km: float = 10.0, specialization_id: int = None):
    """
    Find workers near a specific location
    """
    from .models import WorkerProfile, workerSpecialization
    from django.db.models import Q
    
    try:
        # Get all worker profiles with location sharing enabled
        workers_query = Profile.objects.filter(
            profileType='WORKER',
            location_sharing_enabled=True,
            latitude__isnull=False,
            longitude__isnull=False
        ).select_related('accountFK')
        
        nearby_workers = []
        
        for profile in workers_query:
            # Calculate distance
            distance = calculate_distance(
                latitude, 
                longitude, 
                float(profile.latitude), 
                float(profile.longitude)
            )
            
            # Check if within radius
            if distance <= radius_km:
                try:
                    # Get worker profile
                    worker_profile = WorkerProfile.objects.get(profileID=profile)
                    
                    # Get specializations
                    specializations_query = workerSpecialization.objects.filter(
                        workerID=worker_profile
                    ).select_related('specializationID')
                    
                    specializations = [
                        {
                            "id": ws.specializationID.specializationID,
                            "name": ws.specializationID.specializationName,
                            "experience_years": ws.experienceYears,
                            "certification": ws.certification
                        }
                        for ws in specializations_query
                    ]
                    
                    # Filter by specialization if provided
                    if specialization_id:
                        if not any(s['id'] == specialization_id for s in specializations):
                            continue
                    
                    nearby_workers.append({
                        "profile_id": profile.profileID,
                        "worker_id": worker_profile.profileID.profileID,
                        "first_name": profile.firstName,
                        "last_name": profile.lastName,
                        "profile_img": profile.profileImg if profile.profileImg else None,
                        "latitude": float(profile.latitude),
                        "longitude": float(profile.longitude),
                        "distance_km": round(distance, 2),
                        "availability_status": worker_profile.availabilityStatus,
                        "specializations": specializations
                    })
                    
                except WorkerProfile.DoesNotExist:
                    continue
        
        # Sort by distance
        nearby_workers.sort(key=lambda x: x['distance_km'])
        
        return {
            "workers": nearby_workers,
            "count": len(nearby_workers),
            "search_location": {
                "latitude": latitude,
                "longitude": longitude,
                "radius_km": radius_km
            }
        }
        
    except Exception as e:
        print(f"❌ Error finding nearby workers: {str(e)}")
        raise

#endregion

#region PROFILE IMAGE UPLOAD

def upload_profile_image_service(user, profile_image_file):
    """
    Upload user profile image to Supabase and update Profile model.
    
    Args:
        user: Authenticated user object (Accounts)
        profile_image_file: Uploaded image file
    
    Returns:
        dict with success status, image URL, and message
    """
    try:
        from iayos_project.utils import upload_profile_image
        
        # Validate file
        allowed_mime_types = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        max_size = 5 * 1024 * 1024  # 5 MB
        
        if profile_image_file.content_type not in allowed_mime_types:
            raise ValueError("Invalid file type. Allowed: JPEG, PNG, JPG, WEBP")
        
        if profile_image_file.size > max_size:
            raise ValueError("File too large. Maximum size is 5MB")
        
        # Get user's profile
        try:
            # Get profile_type from JWT if available, try both if not found
            profile_type = getattr(user, 'profile_type', None)
            
            if profile_type:
                profile = Profile.objects.filter(
                    accountFK=user,
                    profileType=profile_type
                ).first()
            else:
                # Fallback: get any profile
                profile = Profile.objects.filter(accountFK=user).first()
            
            if not profile:
                raise ValueError("User profile not found")
        except Exception as e:
            if "User profile not found" in str(e):
                raise
            raise ValueError("Failed to get user profile")
        
        # Upload to Supabase with structure: user_{userID}/profileImage/avatar.png
        image_url = upload_profile_image(
            file=profile_image_file,
            user_id=user.accountID
        )
        
        if not image_url:
            raise ValueError("Failed to upload image to storage")
        
        # Update profile with new image URL
        profile.profileImg = image_url
        profile.save()
        
        print(f"✅ Profile image uploaded successfully for user {user.accountID}")
        print(f"   Image URL: {image_url}")
        
        return {
            "success": True,
            "message": "Profile image uploaded successfully",
            "image_url": image_url,
            "accountID": user.accountID
        }
        
    except ValueError as e:
        print(f"❌ Validation error: {str(e)}")
        raise
    except Exception as e:
        print(f"❌ Error uploading profile image: {str(e)}")
        import traceback
        traceback.print_exc()
        raise ValueError("Failed to upload profile image")

#endregion
