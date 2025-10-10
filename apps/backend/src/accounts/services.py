# services.py
from .models import Accounts, Profile, Agency, kyc, kycFiles
from adminpanel.models import SystemRoles
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import timedelta, date
from django.http import JsonResponse
from django.conf import settings
import uuid
import jwt
import hashlib
from datetime import timedelta
from iayos_project.utils import upload_kyc_doc
import os


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


    # 3️⃣ Create Accounts user
    user = Accounts.objects.create_user(
        email=data.email,
        password=data.password,
        street_address=data.street_address,
        city=data.city,
        province=data.province,
        postal_code=data.postal_code,
        country=data.country
        
    )


    verifyToken = uuid.uuid4()
    strVerifyToken = str(verifyToken)
    hashed_token = hashlib.sha256(strVerifyToken.encode("utf-8")).hexdigest()

    user.verifyToken = hashed_token

    user.verifyTokenExpiry = timezone.now() + timedelta(hours=24)  # valid for 24h
    user.save()

    # 4️⃣ Create Profile
    profile = Profile.objects.create(
        accountFK=user,
        firstName=data.firstName,
        middleName=data.middleName,
        lastName=data.lastName,
        contactNum=data.contactNum,
        birthDate=birth_date,
        profileImg=""  # Provide empty default for required field to avoid DB errors
    )

    verifyLink = f"http://localhost:3000/auth/verify-email?verifyToken={verifyToken}&id={user.accountID}"
    return {
        "accountID": user.accountID,
        "verifyLink": verifyLink,
        "verifyLinkExpire": user.verifyTokenExpiry.isoformat(),
        "email": user.email
    }
def create_account_agency(data):
    # 1️⃣ Check if email exists
    if Accounts.objects.filter(email__iexact=data.email).exists():
        raise ValueError("Email already registered")
    
    user = Accounts.objects.create_user(
        email=data.email,
        password=data.password,
    )
    
    verifyToken = uuid.uuid4()
    strVerifyToken = str(verifyToken)
    hashed_token = hashlib.sha256(strVerifyToken.encode("utf-8")).hexdigest()

    user.verifyToken = hashed_token

    user.verifyTokenExpiry = timezone.now() + timedelta(hours=24)  # valid for 24h
    user.save()

    # 4️⃣ Create Profile
    profile = Agency.objects.create(
        accountFK=user,
        businessName=data.businessName,
        businessDesc=""  # Provide empty string for required field
    )

    verifyLink = f"http://localhost:3000/auth/verify-email?verifyToken={verifyToken}&id={user.accountID}"
    
    result = {
        "accountID": user.accountID,
        "verifyLink": verifyLink,
        "verifyLinkExpire": user.verifyTokenExpiry.isoformat(),
        "email": user.email
    }
    return result


def login_account(data):
    try:
        user = Accounts.objects.get(email__iexact=data.email)
    except Accounts.DoesNotExist:
        raise ValueError("Invalid email or password")

    if not user.check_password(data.password):
        raise ValueError("Invalid email or password")

    if not user.isVerified:
        raise ValueError("Please verify your email before logging in")
    
    return generateCookie(user)

def generateCookie(user):    
    now = timezone.now()
    access_payload = {
        'user_id': user.accountID,
        'email': user.email,
        'exp': now + timedelta(minutes=60),
        'iat': now
    }

    refresh_payload = {
        'user_id': user.accountID,
        'email': user.email,
        'exp': now + timedelta(minutes=60),
        'iat': now
    }

    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')

    response = JsonResponse({"message": "Login Successful"})
    response.set_cookie(
        key="access",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        max_age=3600,
        domain=None,  # No domain = works for whatever domain sets it
    )
    response.set_cookie(
        key="refresh",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        max_age=86400,
        domain=None,  # No domain
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
        Profile.objects.get(accountFK=account)
        account_type = "individual"
    except Profile.DoesNotExist:
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
    resetLink = f"http://localhost:3000/auth/forgot-password/verified?verifyToken={resetToken}&id={user.accountID}"
    
    return {
        "accountID": user.accountID,
        "verifyLink": resetLink,
        "verifyLinkExpire": user.verifyTokenExpiry,
        "email": user.email
    }

def reset_password_verify(verifyToken, userID, data):
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
    
    return {"message": "Password updated successfully"}

def logout_account():
    response = JsonResponse({"Message": "Logged Out successfully"})
    response.delete_cookie("access")
    response.delete_cookie("refresh")
    return response

def refresh_token(expired_token):
    try:
        # Decode the refresh token
        payload = jwt.decode(expired_token, settings.SECRET_KEY, algorithms=["HS256"])

        # Get the user
        user = Accounts.objects.get(accountID=payload['user_id'])

        # Create new access token
        access_payload = {
            'user_id': user.accountID,
            'email': user.email,
            'exp': timezone.now() + timedelta(minutes=60),  # 1 hour
            'iat': timezone.now(),
        }

        access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')

        response = JsonResponse({"Message": "Token Refreshed"})
        response.set_cookie("access", access_token, httponly=True, secure=False, samesite="Lax")
        return response

    except jwt.ExpiredSignatureError:
        raise ValueError("Refresh token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid refresh token")
    except Accounts.DoesNotExist:
        raise ValueError("User not found")


def fetch_currentUser(accountID):
    try:
        account = Accounts.objects.get(accountID=accountID)

        # Check if a SystemRole exists for this account
        role_obj = SystemRoles.objects.filter(accountID=account).first()
        user_role = role_obj.systemRole if role_obj else None

        try:
            profile = Profile.objects.select_related("accountFK").get(accountFK=account)

            profile_data = {
                "firstName": profile.firstName,
                "lastName": profile.lastName,
                "profileImg": profile.profileImg,
                "profileType": profile.profileType,
                "contactNum": profile.contactNum,
                "birthDate": profile.birthDate.isoformat() if profile.birthDate else None,
            }

            return {
                "accountID": account.accountID,
                "email": account.email,
                "role": user_role,  # <-- systemRole from SystemRoles
                "profile_data": profile_data,
            }

        except Profile.DoesNotExist:
            return {
                "accountID": account.accountID,
                "email": account.email,
                "role": user_role,
                "profile_data": None,
                "user_data": {},
                "skill_categories": []
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
        profile = Profile.objects.get(accountFK=user)

        # Update profile type
        profile.profileType = data.selectedType
        profile.save()
        
        print(f"✅ Assigned role {data.selectedType} to user {user.email}")

        # Create WorkerProfile or ClientProfile based on role
        if data.selectedType == Profile.ProfileType.WORKER:
            # Create or update WorkerProfile
            worker_profile, created = WorkerProfile.objects.get_or_create(
                profileID=profile,
                defaults={
                    'description': '',
                    'workerRating': 0,
                    'totalEarningGross': 0.00,
                    'availabilityStatus': 'OFFLINE'
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

def upload_kyc_document(payload, frontID, backID, clearance, selfie):
    try:
        user = Accounts.objects.get(accountID=payload.accountID)

        # Define image inputs
        images = {
            'FRONTID': frontID,
            'BACKID': backID,
            'CLEARANCE': clearance,
            'SELFIE': selfie
        }

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
            defaults={'kycStatus': 'PENDING', 'notes': ''}
        )

        # If KYC record already exists, delete old files to avoid duplicates
        # and reset status to PENDING for re-review
        if not created:
            kycFiles.objects.filter(kycID=kyc_record).delete()
            kyc_record.kycStatus = 'PENDING'
            kyc_record.notes = 'Re-submitted'
            kyc_record.save()

        uploaded_files = []

        # Upload each file
        for key, file in images.items():
            if not file:
                continue

            if file.content_type not in allowed_mime_types:
                raise ValueError(f"{key}: Invalid file type. Allowed: JPEG, PNG, PDF")

            if file.size > max_size:
                raise ValueError(f"{key}: File too large. Maximum size is 5MB")

            unique_filename = unique_names[key]
            file_url = upload_kyc_doc(
                file=file,
                user_id=user.accountID,
                file_name=unique_filename
            )

            # Assign proper ID type or clearance type
            id_type = None
            if key in ['FRONTID', 'BACKID']:
                id_type = payload.IDType.upper()
            elif key == 'CLEARANCE':
                id_type = payload.clearanceType.upper()

            kycFiles.objects.create(
                kycID=kyc_record,
                idType=id_type,
                fileURL=file_url,
                fileName=unique_filename,
                fileSize=file.size
            )

            uploaded_files.append({
                "file_type": key.lower(),
                "file_url": file_url,
                "file_name": unique_filename,
                "file_size": file.size
            })

        return {
            "message": "KYC documents uploaded successfully",
            "kyc_id": kyc_record.kycID,
            "files": uploaded_files
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
            "status": kyc_record.kycStatus,
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
        pending_kyc = kyc.objects.filter(kycStatus='PENDING').select_related('accountFK')
        
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
                        "file_type": f.fileType,
                        "id_type": f.idType,
                        "file_name": f.fileName
                    } for f in files
                ]
            })

        return {"pending_submissions": results}

    except Exception as e:
        raise ValueError(f"Failed to fetch pending KYC: {str(e)}")


def get_user_notifications(user_account_id, limit=50, unread_only=False):
    """
    Fetch notifications for a specific user.
    
    Args:
        user_account_id: The account ID of the user
        limit: Maximum number of notifications to return (default 50)
        unread_only: If True, only return unread notifications
        
    Returns:
        List of notification dictionaries
    """
    from .models import Notification
    
    try:
        queryset = Notification.objects.filter(accountFK__accountID=user_account_id)
        
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


def get_unread_notification_count(user_account_id):
    """
    Get the count of unread notifications for a user.
    
    Args:
        user_account_id: The account ID of the user
        
    Returns:
        Integer count of unread notifications
    """
    from .models import Notification
    
    try:
        count = Notification.objects.filter(
            accountFK__accountID=user_account_id,
            isRead=False
        ).count()
        
        return count
        
    except Exception as e:
        print(f"❌ Error getting unread notification count: {str(e)}")
        raise


def get_all_workers():
    """
    Fetch all workers with their profiles and specializations.
    
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
            availabilityStatus='AVAILABLE'  # Use string value instead of enum
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
                "distance": 5.0  # TODO: Calculate based on location when implemented
            }
            
            workers.append(worker_data)
        
        # Sort by distance (currently placeholder values)
        workers.sort(key=lambda x: x['distance'])
        
        print(f"✅ Fetched {len(workers)} workers")
        return workers
        
    except Exception as e:
        print(f"❌ Error fetching workers: {str(e)}")
        raise


def get_worker_by_id(user_id):
    """
    Fetch a single worker by their account ID.
    
    Args:
        user_id: The account ID of the worker
        
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
            "distance": 5.0  # TODO: Calculate based on location when implemented
        }
        
        print(f"✅ Fetched worker {user_id}")
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
                'availabilityStatus': 'OFFLINE'
            }
        )
        
        if created:
            print(f"⚠️ Created WorkerProfile for legacy user {user_id} (should have been created during role selection)")
        
        # Update availability status
        if is_available:
            worker_profile.availabilityStatus = 'AVAILABLE'
        else:
            worker_profile.availabilityStatus = 'OFFLINE'
        
        worker_profile.save()
        
        print(f"✅ Updated worker {user_id} availability to {worker_profile.availabilityStatus}")
        
        return {
            "accountID": user_id,
            "availabilityStatus": worker_profile.availabilityStatus,
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
                'availabilityStatus': 'OFFLINE'
            }
        )
        
        if created:
            print(f"⚠️ Created WorkerProfile for legacy user {user_id} (should have been created during role selection)")
        
        is_available = worker_profile.availabilityStatus == 'AVAILABLE'
        
        return {
            "accountID": user_id,
            "availabilityStatus": worker_profile.availabilityStatus,
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
