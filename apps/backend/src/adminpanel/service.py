from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import hashlib
import uuid

from accounts.models import Accounts, kyc, kycFiles, Profile, Notification
from adminpanel.models import SystemRoles, KYCLogs



def create_admin_account(email: str, password: str, role: str = "ADMIN"):
    """Create an account and assign a system role (ADMIN or CLIENT/STAFF).

    This helper is useful for tests or seeding an admin user.

    Returns a dict with accountID and role, or raises ValueError on invalid input.
    """

    # Basic validation
    if not email or "@" not in email:
        raise ValueError("A valid email is required")

    if not password or len(password) < 6:
        raise ValueError("Password must be at least 6 characters")

    # Normalize role
    normalized_role = role.upper().strip()

    # Retrieve allowed choices from the model field to avoid shadowing issues
    # The model defines an inner TextChoices class and a field with the same
    # name; accessing SystemRoles.systemRole directly returns a DeferredAttribute
    # (the model field). Use _meta.get_field(...) to get the choices tuples.
    try:
        raw_choices = SystemRoles._meta.get_field('systemRole').choices
        allowed = {c[0] for c in raw_choices}
    except Exception:
        # Fallback to a conservative set if reflection fails
        allowed = {"ADMIN", "CLIENT"}

    if normalized_role not in allowed:
        raise ValueError(f"Invalid role. Allowed roles: {allowed}")

    # Check if account already exists
    if Accounts.objects.filter(email__iexact=email).exists():
        raise ValueError("Email already registered")

    # Create user via model manager (uses create_user to hash password)
    user = Accounts.objects.create_user(email=email, password=password)

    # Optionally set verification token & expiry so account can be tested as verified
    user.isVerified = True
    user.verifyToken = None
    user.verifyTokenExpiry = None
    user.save()

    # Create SystemRoles entry
    system_role = SystemRoles.objects.create(accountID=user, systemRole=normalized_role)

    return {
        "accountID": user.accountID,
        "email": user.email,
        "role": system_role.systemRole,
    }

def fetchAll_kyc(request):
    kyc_records = kyc.objects.all().order_by('-createdAt')
    kyc_files = kycFiles.objects.filter(kycID__in=kyc_records)

    # Collect all user IDs linked to KYC records
    user_ids = kyc_records.values_list('accountFK', flat=True)
    users = Accounts.objects.filter(accountID__in=user_ids)
    profiles = Profile.objects.filter(accountFK__in=users).select_related('accountFK')

    # Build profile data dictionary keyed by accountID
    profile_data = {
        p.accountFK.accountID: {
            "firstName": p.firstName,
            "lastName": p.lastName,
            "contactNum": p.contactNum,
            "birthDate": p.birthDate.isoformat() if p.birthDate else None,
            "profileImg": p.profileImg,
            "profileType": p.profileType,
        }
        for p in profiles
    }

    data = {
        "kyc": list(kyc_records.values()),
        "kyc_files": list(kyc_files.values()),
        "users": [
            {
                "accountID": user.accountID,
                "email": user.email,
                **profile_data.get(user.accountID, {})
            }
            for user in users
        ]
    }

    return data


def review_kyc_items(request):
    import json
    
    print("🔍 review_kyc_items called")
    
    # Parse JSON body from request
    try:
        body = json.loads(request.body.decode('utf-8'))
        print(f"📥 Request body: {body}")
    except Exception as e:
        print(f"❌ Error parsing request body: {str(e)}")
        raise
    
    front_id_link = body.get("frontIDLink")
    back_id_link = body.get("backIDLink")
    clearance_link = body.get("clearanceLink")
    selfie_link = body.get("selfieLink")

    print(f"📂 File URLs received:")
    print(f"  - frontIDLink: {front_id_link}")
    print(f"  - backIDLink: {back_id_link}")
    print(f"  - clearanceLink: {clearance_link}")
    print(f"  - selfieLink: {selfie_link}")

    # Create signed URLs only for files that exist
    urls = {}
    
    try:
        if front_id_link:
            print(f"🔗 Creating signed URL for front ID: '{front_id_link}'")
            try:
                result = settings.SUPABASE.storage.from_("kyc-docs").create_signed_url(front_id_link, expires_in=60 * 60)
                print(f"📤 Front ID result type: {type(result)}, value: {result}")
                # Supabase returns a dict with 'signedURL' key
                if isinstance(result, dict) and 'signedURL' in result:
                    urls["frontIDLink"] = result['signedURL']
                    print(f"✅ Front ID signed URL created successfully")
                elif isinstance(result, dict) and 'signed_url' in result:
                    urls["frontIDLink"] = result['signed_url']
                    print(f"✅ Front ID signed URL created successfully")
                elif isinstance(result, str):
                    urls["frontIDLink"] = result
                    print(f"✅ Front ID signed URL created successfully")
                else:
                    print(f"⚠️ Unexpected result format: {result}")
                    urls["frontIDLink"] = ""
            except Exception as e:
                print(f"❌ Error creating signed URL for front ID: {type(e).__name__}: {str(e)}")
                import traceback
                print(f"   Traceback: {traceback.format_exc()}")
                urls["frontIDLink"] = ""
        else:
            urls["frontIDLink"] = ""
        
        if back_id_link:
            print(f"🔗 Creating signed URL for back ID: '{back_id_link}'")
            try:
                result = settings.SUPABASE.storage.from_("kyc-docs").create_signed_url(back_id_link, expires_in=60 * 60)
                print(f"📤 Back ID result type: {type(result)}, value: {result}")
                if isinstance(result, dict) and 'signedURL' in result:
                    urls["backIDLink"] = result['signedURL']
                elif isinstance(result, dict) and 'signed_url' in result:
                    urls["backIDLink"] = result['signed_url']
                elif isinstance(result, str):
                    urls["backIDLink"] = result
                else:
                    print(f"⚠️ Unexpected result format, using public URL as fallback")
                    urls["backIDLink"] = settings.SUPABASE.storage.from_("kyc-docs").get_public_url(back_id_link)
            except Exception as e:
                print(f"❌ Error creating signed URL for back ID: {str(e)}")
                print(f"   Attempting public URL fallback...")
                try:
                    public_url = settings.SUPABASE.storage.from_("kyc-docs").get_public_url(back_id_link)
                    urls["backIDLink"] = public_url.rstrip('?')  # Remove trailing ?
                    print(f"✅ Using public URL: {urls['backIDLink']}")
                except:
                    urls["backIDLink"] = ""
        else:
            urls["backIDLink"] = ""
        
        if clearance_link:
            print(f"🔗 Creating signed URL for clearance: '{clearance_link}'")
            try:
                result = settings.SUPABASE.storage.from_("kyc-docs").create_signed_url(clearance_link, expires_in=60 * 60)
                print(f"📤 Clearance result type: {type(result)}, value: {result}")
                if isinstance(result, dict) and 'signedURL' in result:
                    urls["clearanceLink"] = result['signedURL']
                    print(f"✅ Clearance signed URL created successfully")
                elif isinstance(result, dict) and 'signed_url' in result:
                    urls["clearanceLink"] = result['signed_url']
                    print(f"✅ Clearance signed URL created successfully")
                elif isinstance(result, str):
                    urls["clearanceLink"] = result
                    print(f"✅ Clearance signed URL created successfully")
                else:
                    print(f"⚠️ Unexpected result format: {result}")
                    urls["clearanceLink"] = ""
            except Exception as e:
                print(f"❌ Error creating signed URL for clearance: {type(e).__name__}: {str(e)}")
                import traceback
                print(f"   Traceback: {traceback.format_exc()}")
                urls["clearanceLink"] = ""
        else:
            urls["clearanceLink"] = ""
        
        if selfie_link:
            print(f"🔗 Creating signed URL for selfie: '{selfie_link}'")
            try:
                result = settings.SUPABASE.storage.from_("kyc-docs").create_signed_url(selfie_link, expires_in=60 * 60)
                print(f"📤 Selfie result type: {type(result)}, value: {result}")
                if isinstance(result, dict) and 'signedURL' in result:
                    urls["selfieLink"] = result['signedURL']
                elif isinstance(result, dict) and 'signed_url' in result:
                    urls["selfieLink"] = result['signed_url']
                elif isinstance(result, str):
                    urls["selfieLink"] = result
                else:
                    print(f"⚠️ Unexpected result format, using public URL as fallback")
                    urls["selfieLink"] = settings.SUPABASE.storage.from_("kyc-docs").get_public_url(selfie_link)
            except Exception as e:
                print(f"❌ Error creating signed URL for selfie: {str(e)}")
                print(f"   Attempting public URL fallback...")
                try:
                    public_url = settings.SUPABASE.storage.from_("kyc-docs").get_public_url(selfie_link)
                    urls["selfieLink"] = public_url.rstrip('?')  # Remove trailing ?
                    print(f"✅ Using public URL: {urls['selfieLink']}")
                except:
                    urls["selfieLink"] = ""
        else:
            urls["selfieLink"] = ""

        print(f"✅ Final URLs: {urls}")
        return urls
    except Exception as e:
        print(f"❌ Error creating signed URLs: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def approve_kyc(request):
    """
    Approve a KYC submission and set the user's KYCVerified status to True.
    
    Expects JSON body with:
    - kycID: The ID of the KYC record to approve
    
    Returns success message or raises exception on error.
    """
    import json
    
    try:
        # Parse request body
        body = json.loads(request.body.decode('utf-8'))
        kyc_id = body.get("kycID")
        
        print(f"🔍 approve_kyc called for KYC ID: {kyc_id}")
        
        if not kyc_id:
            raise ValueError("kycID is required")
        
        # Get the KYC record
        kyc_record = kyc.objects.select_related('accountFK').get(kycID=kyc_id)
        
        print(f"📋 Found KYC record for user: {kyc_record.accountFK.email}")
        
        # Check if already approved
        if kyc_record.kycStatus == "APPROVED":
            return {
                "success": True,
                "message": "KYC already approved",
                "kycID": kyc_id,
                "accountID": kyc_record.accountFK.accountID,
            }
        
        # Update KYC status to APPROVED
        kyc_record.kycStatus = "APPROVED"
        kyc_record.reviewedAt = timezone.now()
        
        # Get the authenticated admin user from request.auth (set by CookieJWTAuth)
        reviewer = None
        if hasattr(request, 'auth') and request.auth:
            reviewer = request.auth
            kyc_record.reviewedBy = reviewer
            print(f"👤 Reviewed by admin: {reviewer.email} (ID: {reviewer.accountID})")
        else:
            print(f"⚠️  Warning: No authenticated user found in request.auth")
        
        kyc_record.save()
        
        # Update the user's KYCVerified status
        user_account = kyc_record.accountFK
        user_account.KYCVerified = True
        user_account.save()
        
        # Create audit log entry BEFORE deleting the KYC record
        kyc_log = KYCLogs.objects.create(
            kycID=kyc_record.kycID,
            accountFK=user_account,
            action="APPROVED",
            reviewedBy=kyc_record.reviewedBy,
            reviewedAt=kyc_record.reviewedAt,
            reason="KYC documents verified and approved",
            userEmail=user_account.email,
            userAccountID=user_account.accountID,
        )
        
        # Create notification for the user
        Notification.objects.create(
            accountFK=user_account,
            notificationType="KYC_APPROVED",
            title="KYC Verification Approved! ✅",
            message=f"Congratulations! Your KYC verification has been approved. You can now access all features of iAyos.",
            relatedKYCLogID=kyc_log.kycLogID,
        )
        
        print(f"✅ KYC approved successfully!")
        print(f"   - KYC ID: {kyc_id}")
        print(f"   - User: {user_account.email}")
        print(f"   - Account ID: {user_account.accountID}")
        print(f"   - KYCVerified set to: {user_account.KYCVerified}")
        print(f"   - Audit log created")
        print(f"   - Notification sent to user")
        
        # Delete all KYC files from Supabase storage for privacy
        kyc_files = kycFiles.objects.filter(kycID=kyc_record)
        deleted_files_count = 0
        
        for file in kyc_files:
            try:
                # Extract the file path from fileURL
                # Format: user_{accountID}/kyc/{filename}
                file_path = f"user_{user_account.accountID}/kyc/{file.fileName}"
                
                # Delete from Supabase storage
                settings.SUPABASE.storage.from_("kyc-docs").remove([file_path])
                deleted_files_count += 1
                print(f"   🗑️  Deleted file from storage: {file_path}")
            except Exception as e:
                print(f"   ⚠️  Warning: Could not delete file {file.fileName} from storage: {str(e)}")
        
        # Delete all kycFiles records from database
        kyc_files_deleted = kyc_files.delete()[0]
        print(f"   🗑️  Deleted {kyc_files_deleted} kycFiles records from database")
        
        # Delete the kyc record itself from database
        kyc_record.delete()
        print(f"   🗑️  Deleted KYC record from database")
        print(f"   ✅ Privacy cleanup complete: {deleted_files_count} files removed from storage")
        
        return {
            "success": True,
            "message": "KYC approved successfully",
            "kycID": kyc_id,
            "accountID": user_account.accountID,
            "userEmail": user_account.email,
            "kycStatus": kyc_record.kycStatus,
        }
        
    except kyc.DoesNotExist:
        print(f"❌ KYC record not found: {kyc_id}")
        raise ValueError(f"KYC record with ID {kyc_id} not found")
    except Exception as e:
        print(f"❌ Error approving KYC: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def reject_kyc(request):
    """
    Reject a KYC submission with a reason.
    
    Expects JSON body with:
    - kycID: The ID of the KYC record to reject
    - reason: (optional) Reason for rejection
    
    Returns success message or raises exception on error.
    """
    import json
    
    try:
        # Parse request body
        body = json.loads(request.body.decode('utf-8'))
        kyc_id = body.get("kycID")
        reason = body.get("reason", "Documents did not meet verification requirements")
        
        print(f"🔍 reject_kyc called for KYC ID: {kyc_id}")
        
        if not kyc_id:
            raise ValueError("kycID is required")
        
        # Get the KYC record
        kyc_record = kyc.objects.select_related('accountFK').get(kycID=kyc_id)
        
        print(f"📋 Found KYC record for user: {kyc_record.accountFK.email}")
        
        # Update KYC status to REJECTED
        kyc_record.kycStatus = "Rejected"
        kyc_record.reviewedAt = timezone.now()
        
        # Get the authenticated admin user from request.auth (set by CookieJWTAuth)
        reviewer = None
        if hasattr(request, 'auth') and request.auth:
            reviewer = request.auth
            kyc_record.reviewedBy = reviewer
            print(f"👤 Reviewed by admin: {reviewer.email} (ID: {reviewer.accountID})")
        else:
            print(f"⚠️  Warning: No authenticated user found in request.auth")
        
        kyc_record.save()
        
        # Make sure user's KYCVerified is False
        user_account = kyc_record.accountFK
        user_account.KYCVerified = False
        user_account.save()
        
        # Create audit log entry BEFORE deleting the KYC record
        kyc_log = KYCLogs.objects.create(
            kycID=kyc_record.kycID,
            accountFK=user_account,
            action="Rejected",
            reviewedBy=kyc_record.reviewedBy,
            reviewedAt=kyc_record.reviewedAt,
            reason=reason,
            userEmail=user_account.email,
            userAccountID=user_account.accountID,
        )
        
        # Create notification for the user
        Notification.objects.create(
            accountFK=user_account,
            notificationType="KYC_REJECTED",
            title="KYC Verification Rejected",
            message=f"Your KYC verification was not approved. Reason: {reason}. You can resubmit your documents with the correct information.",
            relatedKYCLogID=kyc_log.kycLogID,
        )
        
        print(f"✅ KYC rejected successfully!")
        print(f"   - KYC ID: {kyc_id}")
        print(f"   - User: {user_account.email}")
        print(f"   - Account ID: {user_account.accountID}")
        print(f"   - Reason: {reason}")
        print(f"   - Audit log created")
        print(f"   - Notification sent to user")
        
        # Delete all KYC files from Supabase storage for privacy
        kyc_files = kycFiles.objects.filter(kycID=kyc_record)
        deleted_files_count = 0
        
        for file in kyc_files:
            try:
                # Extract the file path from fileURL
                # Format: user_{accountID}/kyc/{filename}
                file_path = f"user_{user_account.accountID}/kyc/{file.fileName}"
                
                # Delete from Supabase storage
                settings.SUPABASE.storage.from_("kyc-docs").remove([file_path])
                deleted_files_count += 1
                print(f"   🗑️  Deleted file from storage: {file_path}")
            except Exception as e:
                print(f"   ⚠️  Warning: Could not delete file {file.fileName} from storage: {str(e)}")
        
        # Delete all kycFiles records from database
        kyc_files_deleted = kyc_files.delete()[0]
        print(f"   🗑️  Deleted {kyc_files_deleted} kycFiles records from database")
        
        # Delete the kyc record itself from database
        kyc_record.delete()
        print(f"   🗑️  Deleted KYC record from database")
        print(f"   ✅ Privacy cleanup complete: {deleted_files_count} files removed from storage")
        
        return {
            "success": True,
            "message": "KYC rejected",
            "kycID": kyc_id,
            "accountID": user_account.accountID,
            "userEmail": user_account.email,
            "kycStatus": kyc_record.kycStatus,
            "reason": reason,
        }
        
    except kyc.DoesNotExist:
        print(f"❌ KYC record not found: {kyc_id}")
        raise ValueError(f"KYC record with ID {kyc_id} not found")
    except Exception as e:
        print(f"❌ Error rejecting KYC: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def fetch_kyc_logs(action_filter=None, limit=100):
    """
    Fetch KYC audit logs with optional filtering.
    
    Args:
        action_filter: Filter by action type ("APPROVED" or "Rejected")
        limit: Maximum number of logs to return (default 100)
    
    Returns list of log dictionaries with related user and reviewer info.
    """
    try:
        queryset = KYCLogs.objects.select_related(
            'accountFK', 'reviewedBy'
        ).all()
        
        # Apply action filter if provided
        if action_filter:
            queryset = queryset.filter(action=action_filter)
        
        # Limit results
        queryset = queryset[:limit]
        
        logs = []
        for log in queryset:
            logs.append({
                "kycLogID": log.kycLogID,
                "kycID": log.kycID,
                "action": log.action,
                "userEmail": log.userEmail,
                "userAccountID": log.userAccountID,
                "reviewedBy": log.reviewedBy.email if log.reviewedBy else None,
                "reviewedByID": log.reviewedBy.accountID if log.reviewedBy else None,
                "reviewedAt": log.reviewedAt.isoformat(),
                "reason": log.reason,
                "createdAt": log.createdAt.isoformat(),
            })
        
        print(f"📊 Fetched {len(logs)} KYC logs")
        return logs
        
    except Exception as e:
        print(f"❌ Error fetching KYC logs: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_user_kyc_history(user_account_id):
    """
    Get KYC application history for a specific user.
    
    Returns user-facing information WITHOUT revealing reviewer details.
    Shows application history, status, dates, and reasons (if rejected).
    
    Args:
        user_account_id: The account ID of the user
        
    Returns:
        dict with:
        - hasActiveKYC: boolean - if user has pending KYC
        - kycHistory: list of past reviews (approved/rejected)
        - canResubmit: boolean - if user can submit new KYC
    """
    try:
        # Check if user has an active/pending KYC submission
        active_kyc = kyc.objects.filter(
            accountFK__accountID=user_account_id,
            kycStatus="PENDING"
        ).first()
        
        # Get all KYC logs for this user (ordered by most recent first)
        kyc_logs = KYCLogs.objects.filter(
            accountFK__accountID=user_account_id
        ).order_by('-reviewedAt')
        
        history = []
        for log in kyc_logs:
            history.append({
                "applicationId": log.kycID,
                "status": log.action,  # "APPROVED" or "Rejected"
                "submittedDate": log.createdAt.isoformat(),
                "reviewedDate": log.reviewedAt.isoformat(),
                "reason": log.reason if log.action == "Rejected" else None,
                # DO NOT include reviewer information for user privacy/security
            })
        
        # User can resubmit if:
        # 1. No active/pending KYC
        # 2. Last application was rejected (if any history exists)
        can_resubmit = active_kyc is None
        
        # If user has history, only allow resubmit if last one was rejected
        if history and history[0]["status"] == "APPROVED":
            can_resubmit = False
        
        result = {
            "hasActiveKYC": active_kyc is not None,
            "activeKYCId": active_kyc.kycID if active_kyc else None,
            "kycHistory": history,
            "canResubmit": can_resubmit,
            "totalApplications": len(history),
        }
        
        print(f"📋 User KYC History for Account ID {user_account_id}:")
        print(f"   - Active KYC: {result['hasActiveKYC']}")
        print(f"   - Total Applications: {result['totalApplications']}")
        print(f"   - Can Resubmit: {result['canResubmit']}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error fetching user KYC history: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


