from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import hashlib
import uuid

from accounts.models import Accounts, kyc, kycFiles, Profile, Notification, Agency
from agency.models import AgencyKYC, AgencyKycFile
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

    # Include Agency KYC submissions -> stored in separate app/models
    try:
        agency_records = AgencyKYC.objects.all().order_by('-createdAt')
        print(f"[ADMIN KYC] AgencyKYC count: {agency_records.count()} | IDs: {[a.agencyKycID for a in agency_records]}")
        agency_files = AgencyKycFile.objects.filter(agencyKyc__in=agency_records)

        # Gather Agency profile data (businessName etc.)
        agency_account_ids = agency_records.values_list('accountFK', flat=True)
        agencies = Agency.objects.filter(accountFK__in=agency_account_ids).select_related('accountFK')

        agency_profile_data = {
            a.accountFK.accountID: {
                "businessName": a.businessName,
                "businessDesc": a.businessDesc,
                "agencyId": a.agencyId,
            }
            for a in agencies
        }

        data.update({
            "agency_kyc": list(agency_records.values()),
            "agency_kyc_files": list(agency_files.values()),
            "agencies": [
                {
                    "accountID": a.accountFK.accountID,
                    "email": a.accountFK.email,
                    **agency_profile_data.get(a.accountFK.accountID, {}),
                }
                for a in agencies
            ]
        })
    except Exception as e:
        print(f"⚠️ Warning: failed to include agency KYC in admin response: {e}")

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
        def _create_signed(bucket_name, path):
            try:
                return settings.SUPABASE.storage.from_(bucket_name).create_signed_url(path, expires_in=60 * 60)
            except Exception as e:
                print(f"❌ Error creating signed URL for {bucket_name}:{path}: {e}")
                return None

        def _resolve_link(link, default_bucket="kyc-docs"):
            """
            Accept either a string path (assume default_bucket) or a dict {bucket, path}.
            Returns signed URL string or empty string on failure.
            """
            if not link:
                return ""
            # If it's a mapping, expect {'bucket': 'agency', 'path': 'agency_1/kyc/file.pdf'}
            if isinstance(link, dict):
                bucket = link.get('bucket') or default_bucket
                path = link.get('path')
            else:
                # If it's a full URL, return it directly (assume already accessible)
                if isinstance(link, str) and (link.startswith('http://') or link.startswith('https://')):
                    return link

                # It's a storage path string. Try to infer bucket from path prefix.
                path = link
                if isinstance(path, str) and path.startswith('agency_'):
                    bucket = 'agency'
                else:
                    bucket = default_bucket

            if not path:
                return ""

            res = _create_signed(bucket, path)
            if isinstance(res, dict) and ('signedURL' in res or 'signed_url' in res):
                return res.get('signedURL') or res.get('signed_url')
            elif isinstance(res, str):
                return res
            else:
                # fallback to public url if available
                try:
                    return settings.SUPABASE.storage.from_(bucket).get_public_url(path)
                except Exception:
                    return ""
        # Use _resolve_link for each incoming field
        urls["frontIDLink"] = _resolve_link(front_id_link, default_bucket="kyc-docs") if front_id_link else ""
        urls["backIDLink"] = _resolve_link(back_id_link, default_bucket="kyc-docs") if back_id_link else ""
        urls["clearanceLink"] = _resolve_link(clearance_link, default_bucket="kyc-docs") if clearance_link else ""
        urls["selfieLink"] = _resolve_link(selfie_link, default_bucket="kyc-docs") if selfie_link else ""
        # Support addressProofLink if frontend sends it
        address_link = body.get("addressProofLink")
        urls["addressProofLink"] = _resolve_link(address_link, default_bucket="kyc-docs") if address_link else ""

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
                "kycStatus": kyc_record.kycStatus,
                "kycVerified": bool(kyc_record.accountFK.KYCVerified),
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
            kycType="USER",
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
        
        # NOTE: Previously we deleted the KYC record and its files for privacy.
        # Per new requirements, retain the KYC record and associated kycFiles
        # so the approved/rejected history remains visible in the admin UI.
        # If you still want to remove storage artifacts for privacy later,
        # consider a background retention/cleanup job.
        print("ℹ️ Retaining KYC DB record and kycFiles for audit/history")
        
        return {
            "success": True,
            "message": "KYC approved successfully",
            "kycID": kyc_id,
            "accountID": user_account.accountID,
            "userEmail": user_account.email,
            "kycStatus": kyc_record.kycStatus,
            "kycVerified": bool(user_account.KYCVerified),
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
            kycType="USER",
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
        
        # NOTE: Keep the rejected KYC record and kycFiles so the user can
        # see the rejection reason and history. We no longer delete DB
        # records during reject flow.
        print("ℹ️ Retaining rejected KYC DB record and kycFiles for audit/history")
        
        return {
            "success": True,
            "message": "KYC rejected",
            "kycID": kyc_id,
            "accountID": user_account.accountID,
            "userEmail": user_account.email,
            "kycStatus": kyc_record.kycStatus,
            "kycVerified": bool(user_account.KYCVerified),
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


def approve_agency_kyc(request):
    """
    Approve an AgencyKYC submission.

    Expects JSON body with:
    - agencyKycID: The ID of the AgencyKYC record to approve
    """
    import json

    try:
        body = json.loads(request.body.decode('utf-8'))
        agency_kyc_id = body.get("agencyKycID")

        print(f"🔍 approve_agency_kyc called for AgencyKYC ID: {agency_kyc_id}")

        if not agency_kyc_id:
            raise ValueError("agencyKycID is required")

        # Fetch the AgencyKYC record
        agency_record = AgencyKYC.objects.select_related('accountFK').get(agencyKycID=agency_kyc_id)

        account = agency_record.accountFK

        # If already approved
        if agency_record.status == "APPROVED":
            return {
                "success": True,
                "message": "Agency KYC already approved",
                "agencyKycID": agency_kyc_id,
                "accountID": account.accountID,
            }

        # Update status
        agency_record.status = "APPROVED"
        agency_record.reviewedAt = timezone.now()

        reviewer = None
        if hasattr(request, 'auth') and request.auth:
            reviewer = request.auth
            agency_record.reviewedBy = reviewer
            print(f"👤 Reviewed by admin: {reviewer.email} (ID: {reviewer.accountID})")
        else:
            print(f"⚠️  Warning: No authenticated user found in request.auth")

        agency_record.save()

        # Create audit log
        kyc_log = KYCLogs.objects.create(
            kycID=agency_record.agencyKycID,
            accountFK=account,
            action="APPROVED",
            reviewedBy=agency_record.reviewedBy,
            reviewedAt=agency_record.reviewedAt,
            reason="Agency KYC documents verified and approved",
            userEmail=account.email,
            userAccountID=account.accountID,
            kycType="AGENCY",
        )

        # Create notification for the agency account
        Notification.objects.create(
            accountFK=account,
            notificationType="AGENCY_KYC_APPROVED",
            title="Agency KYC Verification Approved ✅",
            message=f"Your agency KYC verification has been approved.",
            relatedKYCLogID=kyc_log.kycLogID,
        )

        # Mark the agency account as verified so the verification wall is removed
        try:
            account.KYCVerified = True
            account.save()
            print(f"   ✅ Account KYCVerified set to True for account {account.accountID}")
        except Exception as e:
            print(f"   ⚠️ Warning: Could not set account KYCVerified: {e}")

        print(f"✅ Agency KYC approved: {agency_kyc_id} for account {account.email}")

        # After approval we remove stored submission artifacts for privacy.
        # Attempt to delete files; failures are non-fatal and logged.
        # NOTE: Per new requirements, retain AgencyKYC and AgencyKycFile
        # records after approval so history is available in the admin UI.
        # If storage cleanup is desired later, implement a retention policy
        # or background task to remove older artifacts.
        print("ℹ️ Retaining AgencyKYC DB record and AgencyKycFile records for audit/history")

        return {
            "success": True,
            "message": "Agency KYC approved successfully",
            "agencyKycID": agency_kyc_id,
            "accountID": account.accountID,
            "userEmail": account.email,
            "status": agency_record.status,
            "kycVerified": bool(account.KYCVerified),
        }

    except AgencyKYC.DoesNotExist:
        print(f"❌ AgencyKYC record not found: {agency_kyc_id}")
        raise ValueError(f"AgencyKYC record with ID {agency_kyc_id} not found")
    except Exception as e:
        print(f"❌ Error approving AgencyKYC: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def reject_agency_kyc(request):
    """
    Reject an AgencyKYC submission.

    Expects JSON body with:
    - agencyKycID: The ID of the AgencyKYC record to reject
    - reason: optional reason string
    """
    import json

    try:
        body = json.loads(request.body.decode('utf-8'))
        agency_kyc_id = body.get("agencyKycID")
        reason = body.get("reason", "Agency documents did not meet verification requirements")

        print(f"🔍 reject_agency_kyc called for AgencyKYC ID: {agency_kyc_id}")

        if not agency_kyc_id:
            raise ValueError("agencyKycID is required")

        agency_record = AgencyKYC.objects.select_related('accountFK').get(agencyKycID=agency_kyc_id)
        account = agency_record.accountFK

        # Update status
        agency_record.status = "REJECTED"
        agency_record.reviewedAt = timezone.now()

        reviewer = None
        if hasattr(request, 'auth') and request.auth:
            reviewer = request.auth
            agency_record.reviewedBy = reviewer
            print(f"👤 Reviewed by admin: {reviewer.email} (ID: {reviewer.accountID})")
        else:
            print(f"⚠️  Warning: No authenticated user found in request.auth")

        agency_record.save()

        # Create audit log
        kyc_log = KYCLogs.objects.create(
            kycID=agency_record.agencyKycID,
            accountFK=account,
            action="Rejected",
            reviewedBy=agency_record.reviewedBy,
            reviewedAt=agency_record.reviewedAt,
            reason=reason,
            userEmail=account.email,
            userAccountID=account.accountID,
            kycType="AGENCY",
        )

        # Create notification for the agency account
        Notification.objects.create(
            accountFK=account,
            notificationType="AGENCY_KYC_REJECTED",
            title="Agency KYC Verification Rejected",
            message=f"Your agency KYC was not approved. Reason: {reason}. You may resubmit your documents.",
            relatedKYCLogID=kyc_log.kycLogID,
        )

        print(f"✅ Agency KYC rejected: {agency_kyc_id} for account {account.email}")

        # Do not delete agency files or the record here — keep submission so the agency
        # can view the rejection reason and resubmit. Mark account as unverified.
        try:
            account.KYCVerified = False
            account.save()
            print(f"   ✅ Account KYCVerified set to False for account {account.accountID}")
        except Exception as e:
            print(f"   ⚠️ Warning: Could not set account KYCVerified: {e}")

        # Attach reason to AgencyKYC notes for frontend display
        try:
            agency_record.notes = reason
            agency_record.save()
            print(f"   ✍️  Wrote rejection notes to AgencyKYC {agency_record.agencyKycID}")
        except Exception as e:
            print(f"   ⚠️ Warning: Could not write notes to AgencyKYC: {e}")

        return {
            "success": True,
            "message": "Agency KYC rejected",
            "agencyKycID": agency_kyc_id,
            "accountID": account.accountID,
            "userEmail": account.email,
            "status": agency_record.status,
            "kycVerified": bool(account.KYCVerified),
            "reason": reason,
        }

    except AgencyKYC.DoesNotExist:
        print(f"❌ AgencyKYC record not found: {agency_kyc_id}")
        raise ValueError(f"AgencyKYC record with ID {agency_kyc_id} not found")
    except Exception as e:
        print(f"❌ Error rejecting AgencyKYC: {str(e)}")
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
                "kycType": log.kycType,
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


