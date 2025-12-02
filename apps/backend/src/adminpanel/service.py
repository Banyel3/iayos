from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from typing import Optional
import hashlib
import uuid

from accounts.models import Accounts, kyc, kycFiles, Profile, Notification, Agency, WorkerProfile
from agency.models import AgencyKYC, AgencyKycFile
from adminpanel.models import SystemRoles, KYCLogs
from adminpanel.audit_service import log_action



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
        field = SystemRoles._meta.get_field('systemRole')
        # choices might be a callable or a list
        raw_choices = field.choices() if callable(field.choices) else field.choices
        allowed = {c[0] for c in raw_choices} if raw_choices else {"ADMIN", "CLIENT"}
    except Exception:
        # Fallback to a conservative set if reflection fails
        allowed = {"ADMIN", "CLIENT"}

    if normalized_role not in allowed:
        raise ValueError(f"Invalid role. Allowed roles: {allowed}")

    # Check if account already exists
    if Accounts.objects.filter(email__iexact=email).exists():
        raise ValueError("Email already registered")

    # Create user via model manager (uses create_user to hash password)
    user = Accounts.objects.create_user(email=email, password=password)  # type: ignore

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
    
    # Debug: Show pending records specifically
    pending_kyc = kyc_records.filter(kyc_status='PENDING')
    print(f"[ADMIN KYC] Total KYC records: {kyc_records.count()}")
    print(f"[ADMIN KYC] Pending KYC records: {pending_kyc.count()}")
    print(f"[ADMIN KYC] Pending KYC IDs: {[k.kycID for k in pending_kyc]}")
    for pending in pending_kyc:
        file_count = kycFiles.objects.filter(kycID=pending).count()
        print(f"[ADMIN KYC] Pending kycID={pending.kycID} has {file_count} files")

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

    # Serialize KYC records with proper field naming for frontend (camelCase)
    kyc_serialized = []
    for record in kyc_records:
        kyc_serialized.append({
            "kycID": record.kycID,
            "accountFK_id": record.accountFK.accountID,
            "kycStatus": record.kyc_status,  # Convert snake_case to camelCase
            "reviewedAt": record.reviewedAt.isoformat() if record.reviewedAt else None,
            "reviewedBy_id": record.reviewedBy.accountID if record.reviewedBy else None,
            "notes": record.notes,
            "createdAt": record.createdAt.isoformat() if record.createdAt else None,
            "updatedAt": record.updatedAt.isoformat() if record.updatedAt else None,
        })

    # Serialize KYC files with proper field naming
    kyc_files_serialized = []
    for file in kyc_files:
        kyc_files_serialized.append({
            "kycFileID": file.kycFileID,
            "kycID_id": file.kycID.kycID,
            "idType": file.idType,
            "fileName": file.fileName,
            "fileURL": file.fileURL,
        })

    data = {
        "kyc": kyc_serialized,
        "kyc_files": kyc_files_serialized,
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

        # Serialize agency KYC records (note: status not kyc_status)
        agency_kyc_serialized = []
        for record in agency_records:
            agency_kyc_serialized.append({
                "agencyKycID": record.agencyKycID,
                "accountFK_id": record.accountFK.accountID,
                "status": record.status,  # Already correct field name
                "reviewedAt": record.reviewedAt.isoformat() if record.reviewedAt else None,
                "reviewedBy_id": record.reviewedBy.accountID if record.reviewedBy else None,
                "notes": record.notes,
                "createdAt": record.createdAt.isoformat() if record.createdAt else None,
                "updatedAt": record.updatedAt.isoformat() if record.updatedAt else None,
            })

        # Serialize agency KYC files
        agency_files_serialized = []
        for file in agency_files:
            agency_files_serialized.append({
                "fileID": file.fileID,
                "agencyKyc_id": file.agencyKyc.agencyKycID,
                "fileType": file.fileType,
                "fileName": file.fileName,
                "fileURL": file.fileURL,
                "fileSize": file.fileSize,
                "uploadedAt": file.uploadedAt.isoformat() if file.uploadedAt else None,
            })

        data.update({
            "agency_kyc": agency_kyc_serialized,
            "agency_kyc_files": agency_files_serialized,
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
        print(f"âš ï¸ Warning: failed to include agency KYC in admin response: {e}")

    return data


def review_kyc_items(request):
    import json
    
    print("ðŸ” review_kyc_items called")
    
    # Parse JSON body from request
    try:
        body = json.loads(request.body.decode('utf-8'))
        print(f"ðŸ“¥ Request body: {body}")
    except Exception as e:
        print(f"âŒ Error parsing request body: {str(e)}")
        raise
    
    front_id_link = body.get("frontIDLink")
    back_id_link = body.get("backIDLink")
    clearance_link = body.get("clearanceLink")
    selfie_link = body.get("selfieLink")

    print(f"ðŸ“‚ File URLs received:")
    print(f"  - frontIDLink: {front_id_link}")
    print(f"  - backIDLink: {back_id_link}")
    print(f"  - clearanceLink: {clearance_link}")
    print(f"  - selfieLink: {selfie_link}")

    # Create signed URLs only for files that exist
    urls = {}
    
    # Check if storage is configured
    if not settings.STORAGE:
        print("Storage not configured - cannot create signed URLs")
        return {"error": "Storage not configured"}
    
    try:
        def _create_signed(bucket_name, path):
            try:
                return settings.STORAGE.storage().from_(bucket_name).create_signed_url(path, expires_in=60 * 60)
            except Exception as e:
                print(f"âŒ Error creating signed URL for {bucket_name}:{path}: {e}")
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
            print(f"DEBUG: _create_signed returned type={type(res)}, value={res}")
            
            if isinstance(res, dict):
                # Try all possible key variations
                signed_url = res.get('signedURL') or res.get('signed_url') or res.get('signedUrl')
                print(f"DEBUG: Extracted signedURL from dict: {signed_url}")
                
                # Check if URL has duplicate path and fix it
                if signed_url and '/object/sign/kyc-docs//object/sign/kyc-docs/' in signed_url:
                    print(f"WARN: Found duplicate path in signed URL, fixing...")
                    # Replace the duplicate path with single path
                    signed_url = signed_url.replace('/object/sign/kyc-docs//object/sign/kyc-docs/', '/object/sign/kyc-docs/')
                    print(f"DEBUG: Fixed URL: {signed_url}")
                    
                return signed_url or ""
            elif isinstance(res, str):
                print(f"DEBUG: Result is string: {res}")
                # Check for duplicate path in string response too
                if '/object/sign/kyc-docs//object/sign/kyc-docs/' in res:
                    print(f"WARN: Found duplicate path in string result, fixing...")
                    res = res.replace('/object/sign/kyc-docs//object/sign/kyc-docs/', '/object/sign/kyc-docs/')
                    print(f"DEBUG: Fixed URL: {res}")
                return res
            else:
                print(f"ERROR: Unexpected response type from Supabase, falling back to public URL")
                # fallback to public url if available
                try:
                    return settings.STORAGE.storage().from_(bucket).get_public_url(path)
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

        print(f"âœ… Final URLs: {urls}")
        return urls
    except Exception as e:
        print(f"âŒ Error creating signed URLs: {str(e)}")
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
    
    kyc_id = None
    try:
        # Parse request body
        body = json.loads(request.body.decode('utf-8'))
        kyc_id = body.get("kycID")
        
        print(f"ðŸ” approve_kyc called for KYC ID: {kyc_id}")
        
        if not kyc_id:
            raise ValueError("kycID is required")
        
        # Get the KYC record
        kyc_record = kyc.objects.select_related('accountFK').get(kycID=kyc_id)
        
        print(f"ðŸ“‹ Found KYC record for user: {kyc_record.accountFK.email}")
        
        # Check if already approved
        if kyc_record.kyc_status == "APPROVED":
            return {
                "success": True,
                "message": "KYC already approved",
                "kycID": kyc_id,
                "accountID": kyc_record.accountFK.accountID,
                "kycStatus": kyc_record.kyc_status,
                "kycVerified": bool(kyc_record.accountFK.KYCVerified),
            }
        
        # Update KYC status to APPROVED
        kyc_record.kyc_status = "APPROVED"
        kyc_record.reviewedAt = timezone.now()
        
        # Get the authenticated admin user from request.auth (set by CookieJWTAuth)
        reviewer = None
        if hasattr(request, 'auth') and request.auth:
            reviewer = request.auth
            kyc_record.reviewedBy = reviewer
            print(f"ðŸ‘¤ Reviewed by admin: {reviewer.email} (ID: {reviewer.accountID})")
        else:
            print(f"âš ï¸  Warning: No authenticated user found in request.auth")
        
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
            title="KYC Verification Approved! âœ…",
            message=f"Congratulations! Your KYC verification has been approved. You can now access all features of iAyos.",
            relatedKYCLogID=kyc_log.kycLogID,
        )
        
        # Log audit trail for KYC approval
        if reviewer:
            log_action(
                admin=reviewer,
                action="kyc_approval",
                entity_type="kyc",
                entity_id=str(kyc_id),
                details={"email": user_account.email, "action": "approved", "kyc_type": "USER"},
                before_value={"kyc_status": "PENDING", "KYCVerified": False},
                after_value={"kyc_status": "APPROVED", "KYCVerified": True},
                request=request
            )
        
        print(f"âœ… KYC approved successfully!")
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
        print("â„¹ï¸ Retaining KYC DB record and kycFiles for audit/history")
        
        return {
            "success": True,
            "message": "KYC approved successfully",
            "kycID": kyc_id,
            "accountID": user_account.accountID,
            "userEmail": user_account.email,
            "kycStatus": kyc_record.kyc_status,
            "kycVerified": bool(user_account.KYCVerified),
        }
        
    except kyc.DoesNotExist:
        print(f"âŒ KYC record not found: {kyc_id}")
        raise ValueError(f"KYC record with ID {kyc_id} not found")
    except Exception as e:
        print(f"âŒ Error approving KYC: {str(e)}")
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
    
    kyc_id = None
    try:
        # Parse request body
        body = json.loads(request.body.decode('utf-8'))
        kyc_id = body.get("kycID")
        reason = body.get("reason", "Documents did not meet verification requirements")
        
        print(f"ðŸ” reject_kyc called for KYC ID: {kyc_id}")
        
        if not kyc_id:
            raise ValueError("kycID is required")
        
        # Get the KYC record
        kyc_record = kyc.objects.select_related('accountFK').get(kycID=kyc_id)
        
        print(f"ðŸ“‹ Found KYC record for user: {kyc_record.accountFK.email}")
        
        # Update KYC status to REJECTED
        kyc_record.kyc_status = "Rejected"
        kyc_record.reviewedAt = timezone.now()
        
        # Get the authenticated admin user from request.auth (set by CookieJWTAuth)
        reviewer = None
        if hasattr(request, 'auth') and request.auth:
            reviewer = request.auth
            kyc_record.reviewedBy = reviewer
            print(f"ðŸ‘¤ Reviewed by admin: {reviewer.email} (ID: {reviewer.accountID})")
        else:
            print(f"âš ï¸  Warning: No authenticated user found in request.auth")
        
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
        
        # Log audit trail for KYC rejection
        if reviewer:
            log_action(
                admin=reviewer,
                action="kyc_rejection",
                entity_type="kyc",
                entity_id=str(kyc_id),
                details={"email": user_account.email, "action": "rejected", "reason": reason, "kyc_type": "USER"},
                before_value={"kyc_status": "PENDING"},
                after_value={"kyc_status": "REJECTED", "reason": reason},
                request=request
            )
        
        print(f"âœ… KYC rejected successfully!")
        print(f"   - KYC ID: {kyc_id}")
        print(f"   - User: {user_account.email}")
        print(f"   - Account ID: {user_account.accountID}")
        print(f"   - Reason: {reason}")
        print(f"   - Audit log created")
        print(f"   - Notification sent to user")
        
        # NOTE: Keep the rejected KYC record and kycFiles so the user can
        # see the rejection reason and history. We no longer delete DB
        # records during reject flow.
        print("â„¹ï¸ Retaining rejected KYC DB record and kycFiles for audit/history")
        
        return {
            "success": True,
            "message": "KYC rejected",
            "kycID": kyc_id,
            "accountID": user_account.accountID,
            "userEmail": user_account.email,
            "kycStatus": kyc_record.kyc_status,
            "kycVerified": bool(user_account.KYCVerified),
            "reason": reason,
        }
        
    except kyc.DoesNotExist:
        print(f"âŒ KYC record not found: {kyc_id}")
        raise ValueError(f"KYC record with ID {kyc_id} not found")
    except Exception as e:
        print(f"âŒ Error rejecting KYC: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


from agency.models import AgencyKYC, AgencyKycFile, AgencyEmployee


def get_agency_kyc_list(status_filter: Optional[str] = None):
    """
    Get list of agency KYC submissions with optional status filtering.
    
    Args:
        status_filter: Optional status filter (PENDING, APPROVED, REJECTED)
    
    Returns:
        List of agency KYC submissions with account and file details
    """
    from django.db.models import Prefetch
    
    # Base queryset with related data
    queryset = AgencyKYC.objects.select_related(
        'accountFK',
        'reviewedBy'
    ).prefetch_related(
        Prefetch('agencykycfile_set', queryset=AgencyKycFile.objects.all())
    ).order_by('-createdAt')
    
    # Apply status filter if provided
    if status_filter and status_filter.upper() in ['PENDING', 'APPROVED', 'REJECTED']:
        queryset = queryset.filter(status=status_filter.upper())
    
    # Serialize results
    submissions = []
    for kyc in queryset:
        # Get files for this KYC
        files = []
        for kyc_file in kyc.agencykycfile_set.all():
            files.append({
                'file_id': kyc_file.fileID,
                'file_type': kyc_file.fileType,
                'file_url': kyc_file.fileURL,
                'file_name': kyc_file.fileName or 'document',
                'uploaded_at': kyc_file.uploadedAt.isoformat() if kyc_file.uploadedAt else None,
            })
        
        submissions.append({
            'agency_kyc_id': kyc.agencyKycID,
            'account_id': kyc.accountFK.accountID,
            'account_email': kyc.accountFK.email,
            'business_name': getattr(kyc, 'businessName', '') or '',
            'business_desc': getattr(kyc, 'businessDesc', '') or '',
            'registration_number': getattr(kyc, 'registrationNumber', '') or '',
            'status': kyc.status,
            'notes': kyc.notes or None,
            'reviewed_at': kyc.reviewedAt.isoformat() if kyc.reviewedAt else None,
            'reviewed_by_email': kyc.reviewedBy.email if kyc.reviewedBy else None,
            'submitted_at': kyc.createdAt.isoformat() if kyc.createdAt else None,
            'files': files,
        })
    
    return submissions


def review_agency_kyc(agency_kyc_id: int, status: str, notes: str, reviewer):
    """
    Review (approve or reject) an agency KYC submission.
    
    Args:
        agency_kyc_id: ID of the AgencyKYC record
        status: 'APPROVED' or 'REJECTED'
        notes: Optional review notes (required for rejection)
        reviewer: Admin account performing the review
    """
    if status not in ['APPROVED', 'REJECTED']:
        raise ValueError("Status must be 'APPROVED' or 'REJECTED'")
    
    # Fetch the AgencyKYC record
    agency_record = AgencyKYC.objects.select_related('accountFK').get(agencyKycID=agency_kyc_id)
    account = agency_record.accountFK
    
    # If already in final state, return early
    if agency_record.status == status:
        return {
            "success": True,
            "message": f"Agency KYC already {status.lower()}",
            "agencyKycID": agency_kyc_id,
        }
    
    # Update status
    agency_record.status = status
    agency_record.reviewedAt = timezone.now()
    agency_record.reviewedBy = reviewer
    agency_record.notes = notes or ""
    agency_record.save()
    
    # Create audit log
    kyc_log = KYCLogs.objects.create(
        kycID=agency_record.agencyKycID,
        accountFK=account,
        action=status,
        reviewedBy=reviewer,
        reviewedAt=agency_record.reviewedAt,
        reason=notes or f"Agency KYC {status.lower()}",
        userEmail=account.email,
        userAccountID=account.accountID,
        kycType="AGENCY",
    )
    
    # Create notification
    if status == "APPROVED":
        # Mark account as KYC verified
        account.KYCVerified = True
        account.save()
        
        Notification.objects.create(
            accountFK=account,
            notificationType="AGENCY_KYC_APPROVED",
            title="Agency KYC Verification Approved ✅",
            message=f"Your agency KYC verification has been approved.",
            relatedKYCLogID=kyc_log.kycLogID,
        )
    else:
        Notification.objects.create(
            accountFK=account,
            notificationType="AGENCY_KYC_REJECTED",
            title="Agency KYC Verification Rejected",
            message=f"Your agency KYC submission was rejected. Reason: {notes}",
            relatedKYCLogID=kyc_log.kycLogID,
        )
    
    return {
        "success": True,
        "message": f"Agency KYC {status.lower()} successfully",
        "agencyKycID": agency_kyc_id,
        "accountID": account.accountID,
        "status": status,
    }


def approve_agency_kyc(request):
    """
    Approve an AgencyKYC submission.

    Expects JSON body with:
    - agencyKycID: The ID of the AgencyKYC record to approve
    """
    import json

    agency_kyc_id = None
    try:
        body = json.loads(request.body.decode('utf-8'))
        agency_kyc_id = body.get("agencyKycID")

        print(f"ðŸ” approve_agency_kyc called for AgencyKYC ID: {agency_kyc_id}")

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
            print(f"ðŸ‘¤ Reviewed by admin: {reviewer.email} (ID: {reviewer.accountID})")
        else:
            print(f"âš ï¸  Warning: No authenticated user found in request.auth")

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
            title="Agency KYC Verification Approved âœ…",
            message=f"Your agency KYC verification has been approved.",
            relatedKYCLogID=kyc_log.kycLogID,
        )
        
        # Log audit trail for Agency KYC approval
        if reviewer:
            log_action(
                admin=reviewer,
                action="kyc_approval",
                entity_type="kyc",
                entity_id=str(agency_kyc_id),
                details={"email": account.email, "action": "approved", "kyc_type": "AGENCY"},
                before_value={"status": "PENDING", "KYCVerified": False},
                after_value={"status": "APPROVED", "KYCVerified": True},
                request=request
            )

        # Mark the agency account as verified so the verification wall is removed
        try:
            account.KYCVerified = True
            account.save()
            print(f"   âœ… Account KYCVerified set to True for account {account.accountID}")
        except Exception as e:
            print(f"   âš ï¸ Warning: Could not set account KYCVerified: {e}")

        print(f"âœ… Agency KYC approved: {agency_kyc_id} for account {account.email}")

        # After approval we remove stored submission artifacts for privacy.
        # Attempt to delete files; failures are non-fatal and logged.
        # NOTE: Per new requirements, retain AgencyKYC and AgencyKycFile
        # records after approval so history is available in the admin UI.
        # If storage cleanup is desired later, implement a retention policy
        # or background task to remove older artifacts.
        print("â„¹ï¸ Retaining AgencyKYC DB record and AgencyKycFile records for audit/history")

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
        print(f"âŒ AgencyKYC record not found: {agency_kyc_id}")
        raise ValueError(f"AgencyKYC record with ID {agency_kyc_id} not found")
    except Exception as e:
        print(f"âŒ Error approving AgencyKYC: {str(e)}")
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

    agency_kyc_id = None
    try:
        body = json.loads(request.body.decode('utf-8'))
        agency_kyc_id = body.get("agencyKycID")
        reason = body.get("reason", "Agency documents did not meet verification requirements")

        print(f"ðŸ” reject_agency_kyc called for AgencyKYC ID: {agency_kyc_id}")

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
            print(f"ðŸ‘¤ Reviewed by admin: {reviewer.email} (ID: {reviewer.accountID})")
        else:
            print(f"âš ï¸  Warning: No authenticated user found in request.auth")

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
        
        # Log audit trail for Agency KYC rejection
        if reviewer:
            log_action(
                admin=reviewer,
                action="kyc_rejection",
                entity_type="kyc",
                entity_id=str(agency_kyc_id),
                details={"email": account.email, "action": "rejected", "reason": reason, "kyc_type": "AGENCY"},
                before_value={"status": "PENDING"},
                after_value={"status": "REJECTED", "reason": reason},
                request=request
            )

        print(f"âœ… Agency KYC rejected: {agency_kyc_id} for account {account.email}")

        # Do not delete agency files or the record here â€” keep submission so the agency
        # can view the rejection reason and resubmit. Mark account as unverified.
        try:
            account.KYCVerified = False
            account.save()
            print(f"   âœ… Account KYCVerified set to False for account {account.accountID}")
        except Exception as e:
            print(f"   âš ï¸ Warning: Could not set account KYCVerified: {e}")

        # Attach reason to AgencyKYC notes for frontend display
        try:
            agency_record.notes = reason
            agency_record.save()
            print(f"   âœï¸  Wrote rejection notes to AgencyKYC {agency_record.agencyKycID}")
        except Exception as e:
            print(f"   âš ï¸ Warning: Could not write notes to AgencyKYC: {e}")

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
        print(f"âŒ AgencyKYC record not found: {agency_kyc_id}")
        raise ValueError(f"AgencyKYC record with ID {agency_kyc_id} not found")
    except Exception as e:
        print(f"âŒ Error rejecting AgencyKYC: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def fetch_kyc_logs(action_filter: str | None = None, limit: int = 100):
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
        
        print(f"ðŸ“Š Fetched {len(logs)} KYC logs")
        return logs
        
    except Exception as e:
        print(f"âŒ Error fetching KYC logs: {str(e)}")
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
            kyc_status="PENDING"
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
        
        print(f"ðŸ“‹ User KYC History for Account ID {user_account_id}:")
        print(f"   - Active KYC: {result['hasActiveKYC']}")
        print(f"   - Total Applications: {result['totalApplications']}")
        print(f"   - Can Resubmit: {result['canResubmit']}")
        
        return result
        
    except Exception as e:
        print(f"âŒ Error fetching user KYC history: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_admin_dashboard_stats():
    """Get comprehensive dashboard statistics for admin panel."""
    from django.db.models import Count, Q, Sum
    
    try:
        # User statistics
        total_users = Accounts.objects.count()
        
        # Count by account type (agencies are accounts with a linked agency profile)
        total_agencies = Accounts.objects.filter(agency__isnull=False).count()
        
        # Clients and workers from Profile
        profiles_with_type = Profile.objects.exclude(profileType__isnull=True)
        total_clients = profiles_with_type.filter(profileType='CLIENT').count()
        total_workers = profiles_with_type.filter(profileType='WORKER').count()
        
        # Active users (verified accounts)
        active_users = Accounts.objects.filter(isVerified=True).count()
        
        # KYC statistics
        pending_kyc = kyc.objects.filter(kyc_status='PENDING').count()
        pending_agency_kyc = AgencyKYC.objects.filter(status='PENDING').count()
        total_pending_kyc = pending_kyc + pending_agency_kyc
        
        # Job statistics - using Job model from accounts
        try:
            from accounts.models import Job
            total_jobs = Job.objects.count()
            
            # Active job postings (not yet started)
            active_jobs = Job.objects.filter(status='ACTIVE').count()
            
            # Jobs in progress
            in_progress_jobs = Job.objects.filter(status='IN_PROGRESS').count()
            
            # Completed jobs
            completed_jobs = Job.objects.filter(status='COMPLETED').count()
            
            # Cancelled jobs
            cancelled_jobs = Job.objects.filter(status='CANCELLED').count()
            
            # Open jobs = Active + In Progress (available for workers or currently being worked on)
            open_jobs = active_jobs + in_progress_jobs
            
        except Exception as e:
            # If Job model doesn't exist or has issues
            print(f"Warning: Could not fetch job statistics: {e}")
            total_jobs = 0
            active_jobs = 0
            in_progress_jobs = 0
            completed_jobs = 0
            cancelled_jobs = 0
            open_jobs = 0
        
        # Calculate new users this month
        from datetime import datetime
        from django.utils import timezone
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_users_this_month = Accounts.objects.filter(
            createdAt__gte=current_month_start
        ).count()
        
        return {
            "total_users": total_users,
            "total_clients": total_clients,
            "total_workers": total_workers,
            "total_agencies": total_agencies,
            "active_users": active_users,
            "new_users_this_month": new_users_this_month,
            "pending_kyc": total_pending_kyc,
            "pending_individual_kyc": pending_kyc,
            "pending_agency_kyc": pending_agency_kyc,
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "in_progress_jobs": in_progress_jobs,
            "completed_jobs": completed_jobs,
            "cancelled_jobs": cancelled_jobs,
            "open_jobs": open_jobs,
        }
        
    except Exception as e:
        print(f"âŒ Error fetching admin dashboard stats: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_clients_list(page: int = 1, page_size: int = 50, search: str | None = None, status_filter: str | None = None):
    """Get paginated list of client accounts with their details."""
    from django.db.models import Q, Count
    from django.core.paginator import Paginator
    
    try:
        # Get all profiles with type CLIENT
        clients_query = Profile.objects.filter(profileType='CLIENT').select_related('accountFK')
        
        # Apply search filter
        if search:
            clients_query = clients_query.filter(
                Q(accountFK__email__icontains=search) |
                Q(firstName__icontains=search) |
                Q(lastName__icontains=search)
            )
        
        # Apply status filter
        if status_filter and status_filter != 'all':
            if status_filter == 'active':
                clients_query = clients_query.filter(accountFK__isVerified=True)
            elif status_filter == 'inactive':
                clients_query = clients_query.filter(accountFK__isVerified=False)
        
        # Order by creation date (newest first)
        clients_query = clients_query.order_by('-accountFK__createdAt')
        
        # Paginate
        paginator = Paginator(clients_query, page_size)
        page_obj = paginator.get_page(page)
        
        # Build result
        clients_list = []
        for profile in page_obj:
            account = profile.accountFK
            
            # Get KYC status from logs (most recent entry)
            try:
                from adminpanel.models import KYCLogs
                latest_log = KYCLogs.objects.filter(
                    accountFK=account,
                    kycType=KYCLogs.KYCSubject.USER
                ).order_by('-reviewedAt').first()
                
                if latest_log:
                    kyc_status = latest_log.action  # APPROVED or REJECTED
                else:
                    # No log entry - check if KYC exists and is pending
                    try:
                        kyc_obj = kyc.objects.get(accountFK=account)
                        kyc_status = kyc_obj.kyc_status  # PENDING
                    except kyc.DoesNotExist:
                        kyc_status = 'NOT_SUBMITTED'
            except Exception as e:
                kyc_status = 'NOT_SUBMITTED'
            
            # Get client jobs posted and total spent
            try:
                from accounts.models import Job, Transaction, ClientProfile as CP
                
                # Get ClientProfile for this profile
                try:
                    client_profile = CP.objects.get(profileID=profile)
                    
                    # Count jobs by status that client posted
                    # Job model uses clientID (FK to ClientProfile)
                    client_jobs = Job.objects.filter(clientID=client_profile)
                    jobs_posted = client_jobs.count()
                    jobs_active = client_jobs.filter(status='ACTIVE').count()
                    jobs_in_progress = client_jobs.filter(status='IN_PROGRESS').count()
                    jobs_completed = client_jobs.filter(status='COMPLETED').count()
                    jobs_cancelled = client_jobs.filter(status='CANCELLED').count()
                    
                    # Calculate total spent from completed jobs
                    completed_jobs = Job.objects.filter(
                        clientID=client_profile,
                        status='COMPLETED'
                    )
                    total_spent = sum(job.budget or 0 for job in completed_jobs)
                except CP.DoesNotExist:
                    # Client profile doesn't exist yet
                    jobs_posted = 0
                    jobs_active = 0
                    jobs_in_progress = 0
                    jobs_completed = 0
                    jobs_cancelled = 0
                    total_spent = 0
            except Exception as e:
                print(f"Error getting client jobs for {account.email}: {e}")
                import traceback
                traceback.print_exc()
                jobs_posted = 0
                jobs_active = 0
                jobs_in_progress = 0
                jobs_completed = 0
                jobs_cancelled = 0
                total_spent = 0
            
            # Get client rating from reviews (as reviewee)
            try:
                from accounts.models import JobReview
                from django.db.models import Avg, Count
                
                reviews_stats = JobReview.objects.filter(
                    revieweeID=account,  # revieweeID is ForeignKey to Accounts, not Profile
                    status='ACTIVE'
                ).aggregate(
                    avg_rating=Avg('rating'),
                    review_count=Count('reviewID')
                )
                
                avg_rating = float(reviews_stats['avg_rating'] or 0.0)
                review_count = reviews_stats['review_count'] or 0
            except Exception as e:
                print(f"Error getting client rating for {account.email}: {e}")
                avg_rating = 0.0
                review_count = 0
            
            # Check if this account is an agency and get employee count
            is_agency = False
            agency_info = None
            employee_count = 0
            try:
                from accounts.models import Agency
                from agency.models import AgencyEmployee
                
                # Check if account has an Agency record
                agency = Agency.objects.filter(accountFK=account).first()
                if agency:
                    is_agency = True
                    employee_count = AgencyEmployee.objects.filter(
                        agency=account,
                        isActive=True
                    ).count()
                    agency_info = {
                        'business_name': agency.businessName,
                        'employee_count': employee_count,
                    }
            except Exception as e:
                print(f"Error checking agency for {account.email}: {e}")
            
            clients_list.append({
                'id': str(account.accountID),
                'profile_id': str(profile.profileID),
                'email': account.email,
                'first_name': profile.firstName or '',
                'last_name': profile.lastName or '',
                'phone': profile.contactNum or '',
                'address': f"{account.city}, {account.province}".strip(', ') if (account.city or account.province) else account.country or 'N/A',
                'status': 'active' if account.isVerified else 'inactive',
                'kyc_status': kyc_status,
                'join_date': account.createdAt.isoformat() if account.createdAt else None,
                'is_verified': account.isVerified,
                'is_suspended': account.is_suspended,
                'is_banned': account.is_banned,
                'jobs_posted': jobs_posted,
                'jobs_active': jobs_active,
                'jobs_in_progress': jobs_in_progress,
                'jobs_completed': jobs_completed,
                'jobs_cancelled': jobs_cancelled,
                'total_spent': float(total_spent),
                'rating': round(avg_rating, 1),
                'review_count': review_count,
                'is_agency': is_agency,
                'agency_info': agency_info,
            })
        
        return {
            'clients': clients_list,
            'total': paginator.count,
            'page': page,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching clients list: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_workers_list(page: int = 1, page_size: int = 50, search: str | None = None, status_filter: str | None = None):
    """Get paginated list of worker accounts with their details."""
    from django.db.models import Q, Avg
    from django.core.paginator import Paginator
    from accounts.models import Agency
    
    try:
        # Get account IDs that own agencies (to exclude from workers list)
        agency_owner_account_ids = Agency.objects.values_list('accountFK_id', flat=True)
        
        # Get all profiles with type WORKER, excluding agency owners
        workers_query = Profile.objects.filter(
            profileType='WORKER'
        ).exclude(
            accountFK__accountID__in=agency_owner_account_ids
        ).select_related('accountFK')
        
        # Apply search filter
        if search:
            workers_query = workers_query.filter(
                Q(accountFK__email__icontains=search) |
                Q(firstName__icontains=search) |
                Q(lastName__icontains=search)
            )
        
        # Apply status filter
        if status_filter and status_filter != 'all':
            if status_filter == 'active':
                workers_query = workers_query.filter(accountFK__isVerified=True)
            elif status_filter == 'inactive':
                workers_query = workers_query.filter(accountFK__isVerified=False)
        
        # Order by creation date (newest first)
        workers_query = workers_query.order_by('-accountFK__createdAt')
        
        # Paginate
        paginator = Paginator(workers_query, page_size)
        page_obj = paginator.get_page(page)
        
        # Build result
        workers_list = []
        for profile in page_obj:
            account = profile.accountFK
            
            # Get KYC status from logs (most recent entry)
            try:
                from adminpanel.models import KYCLogs
                latest_log = KYCLogs.objects.filter(
                    accountFK=account,
                    kycType=KYCLogs.KYCSubject.USER
                ).order_by('-reviewedAt').first()
                
                if latest_log:
                    kyc_status = latest_log.action  # APPROVED or REJECTED
                else:
                    # No log entry - check if KYC exists and is pending
                    try:
                        kyc_obj = kyc.objects.get(accountFK=account)
                        kyc_status = kyc_obj.kyc_status  # PENDING
                    except kyc.DoesNotExist:
                        kyc_status = 'NOT_SUBMITTED'
            except Exception as e:
                kyc_status = 'NOT_SUBMITTED'
            
            # Get worker rating, completed jobs, and total earnings
            try:
                from accounts.models import Job, WorkerProfile as WP
                
                # Get WorkerProfile for this profile
                try:
                    worker_profile = WP.objects.get(profileID=profile)
                    
                    # Count jobs by status that worker is assigned to
                    # Job model uses assignedWorkerID (FK to WorkerProfile)
                    worker_jobs = Job.objects.filter(assignedWorkerID=worker_profile)
                    total_jobs = worker_jobs.count()
                    jobs_active = worker_jobs.filter(status='ACTIVE').count()
                    jobs_in_progress = worker_jobs.filter(status='IN_PROGRESS').count()
                    jobs_completed = worker_jobs.filter(status='COMPLETED').count()
                    jobs_cancelled = worker_jobs.filter(status='CANCELLED').count()
                    
                    # Calculate total earnings from completed jobs
                    completed_jobs_query = Job.objects.filter(
                        assignedWorkerID=worker_profile,
                        status='COMPLETED'
                    )
                    total_earnings = sum(job.budget or 0 for job in completed_jobs_query)
                except WP.DoesNotExist:
                    # Worker profile doesn't exist yet
                    total_jobs = 0
                    jobs_active = 0
                    jobs_in_progress = 0
                    jobs_completed = 0
                    jobs_cancelled = 0
                    total_earnings = 0
            except Exception as e:
                print(f"Error getting worker jobs for {account.email}: {e}")
                import traceback
                traceback.print_exc()
                total_jobs = 0
                jobs_active = 0
                jobs_in_progress = 0
                jobs_completed = 0
                jobs_cancelled = 0
                total_earnings = 0
            
            # Get worker rating from reviews (as reviewee)
            try:
                from accounts.models import JobReview
                from django.db.models import Avg, Count
                
                reviews_stats = JobReview.objects.filter(
                    revieweeID=account,  # revieweeID is ForeignKey to Accounts, not Profile
                    status='ACTIVE'
                ).aggregate(
                    avg_rating=Avg('rating'),
                    review_count=Count('reviewID')
                )
                
                avg_rating = float(reviews_stats['avg_rating'] or 0.0)
                review_count = reviews_stats['review_count'] or 0
            except Exception as e:
                print(f"Error getting worker rating for {account.email}: {e}")
                avg_rating = 0.0
                review_count = 0
            
            # Get worker skills
            try:
                from accounts.models import WorkerProfile, workerSpecialization
                worker_profile = WorkerProfile.objects.get(profileID=profile)
                specializations = workerSpecialization.objects.filter(
                    workerID=worker_profile
                ).select_related('specializationID')
                
                skills = [
                    {
                        'name': spec.specializationID.specializationName,
                        'experience_years': spec.experienceYears
                    }
                    for spec in specializations
                ]
            except:
                skills = []
            
            workers_list.append({
                'id': str(account.accountID),
                'profile_id': str(profile.profileID),
                'email': account.email,
                'first_name': profile.firstName or '',
                'last_name': profile.lastName or '',
                'phone': profile.contactNum or '',
                'address': f"{account.city}, {account.province}".strip(', ') if (account.city or account.province) else account.country or 'N/A',
                'status': 'active' if account.isVerified else 'inactive',
                'kyc_status': kyc_status,
                'join_date': account.createdAt.isoformat() if account.createdAt else None,
                'is_verified': account.isVerified,
                'is_suspended': account.is_suspended,
                'is_banned': account.is_banned,
                'total_jobs': total_jobs,
                'jobs_active': jobs_active,
                'jobs_in_progress': jobs_in_progress,
                'jobs_completed': jobs_completed,
                'jobs_cancelled': jobs_cancelled,
                'total_earnings': float(total_earnings),
                'rating': round(avg_rating, 1),
                'review_count': review_count,
                'skills': skills,
                'skills_count': len(skills),
            })
        
        return {
            'workers': workers_list,
            'total': paginator.count,
            'page': page,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching workers list: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_worker_detail(account_id: str):
    """Get detailed information about a specific worker by account ID."""
    from django.db.models import Q, Count
    from adminpanel.models import KYCLogs
    
    try:
        # Get the worker profile
        profile = Profile.objects.filter(
            profileType='WORKER',
            accountFK__accountID=account_id
        ).select_related('accountFK').first()
        
        if not profile:
            return None
        
        account = profile.accountFK
        
        # Get KYC status from logs (most recent entry)
        try:
            latest_log = KYCLogs.objects.filter(
                accountFK=account,
                kycType=KYCLogs.KYCSubject.USER
            ).order_by('-reviewedAt').first()
            
            if latest_log:
                kyc_status = latest_log.action  # APPROVED or REJECTED
            else:
                # No log entry - check if KYC exists and is pending
                try:
                    kyc_obj = kyc.objects.get(accountFK=account)
                    kyc_status = kyc_obj.kyc_status  # PENDING
                except kyc.DoesNotExist:
                    kyc_status = 'NOT_SUBMITTED'
        except Exception as e:
            kyc_status = 'NOT_SUBMITTED'
        
        # Get worker rating and completed jobs
        try:
            from accounts.models import Job
            # Get WorkerProfile for this profile
            try:
                worker_profile_obj = WorkerProfile.objects.get(profileID=profile)
                
                # Job model uses assignedWorkerID (FK to WorkerProfile), not workerFK
                total_jobs = Job.objects.filter(assignedWorkerID=worker_profile_obj).count()
                completed_jobs = Job.objects.filter(
                    assignedWorkerID=worker_profile_obj,
                    status='COMPLETED'
                ).count()
                active_jobs = Job.objects.filter(
                    assignedWorkerID=worker_profile_obj,
                    status='ACTIVE'
                ).count()
            except WorkerProfile.DoesNotExist:
                total_jobs = 0
                completed_jobs = 0
                active_jobs = 0
        except Exception as e:
            print(f"Error getting worker jobs: {str(e)}")
            total_jobs = 0
            completed_jobs = 0
            active_jobs = 0
        
        # Get worker specializations/skills
        from accounts.models import workerSpecialization, Specializations
        try:
            worker_profile = WorkerProfile.objects.get(profileID=profile)
            
            # Get specializations
            specializations = workerSpecialization.objects.filter(
                workerID=worker_profile
            ).select_related('specializationID')
            
            skills = [
                {
                    'name': spec.specializationID.specializationName,
                    'experience_years': spec.experienceYears,
                    'certification': spec.certification or ''
                }
                for spec in specializations
            ]
            
            # Get worker-specific data
            worker_description = worker_profile.description or ''
            worker_rating = worker_profile.workerRating or 0
            availability_status = worker_profile.availability_status
            total_earnings = float(worker_profile.totalEarningGross) if worker_profile.totalEarningGross else 0.0
        except WorkerProfile.DoesNotExist:
            skills = []
            worker_description = ''
            worker_rating = 0
            availability_status = 'OFFLINE'
            total_earnings = 0.0
        except Exception as e:
            print(f"âŒ Error fetching worker profile details: {str(e)}")
            skills = []
            worker_description = ''
            worker_rating = 0
            availability_status = 'OFFLINE'
            total_earnings = 0.0
        
        # Get worker rating and review count from reviews (as reviewee)
        try:
            from accounts.models import JobReview
            from django.db.models import Avg, Count
            
            reviews_stats = JobReview.objects.filter(
                revieweeID=account,  # revieweeID is ForeignKey to Accounts
                status='ACTIVE'
            ).aggregate(
                avg_rating=Avg('rating'),
                review_count=Count('reviewID')
            )
            
            review_count = reviews_stats['review_count'] or 0
            avg_rating_from_reviews = float(reviews_stats['avg_rating'] or 0.0)
        except Exception as e:
            print(f"Error getting worker reviews: {str(e)}")
            review_count = 0
            avg_rating_from_reviews = 0.0
        
        return {
            'id': str(account.accountID),
            'profile_id': str(profile.profileID),
            'email': account.email,
            'first_name': profile.firstName or '',
            'last_name': profile.lastName or '',
            'full_name': f"{profile.firstName or ''} {profile.lastName or ''}".strip(),
            'phone': profile.contactNum or '',
            'birth_date': profile.birthDate.isoformat() if profile.birthDate else None,
            'profile_image': profile.profileImg or '',
            'address': {
                'street': account.street_address or '',
                'city': account.city or '',
                'province': account.province or '',
                'postal_code': account.postal_code or '',
                'country': account.country or 'Philippines',
            },
            'location': {
                'latitude': float(profile.latitude) if profile.latitude else None,
                'longitude': float(profile.longitude) if profile.longitude else None,
                'sharing_enabled': profile.location_sharing_enabled,
                'updated_at': profile.location_updated_at.isoformat() if profile.location_updated_at else None,
            },
            'status': 'active' if account.isVerified else 'inactive',
            'kyc_status': kyc_status,
            'join_date': account.createdAt.isoformat() if account.createdAt else None,
            'is_verified': account.isVerified,
            'is_suspended': account.is_suspended,
            'is_banned': account.is_banned,
            'worker_data': {
                'description': worker_description,
                'rating': avg_rating_from_reviews,  # Use calculated average from reviews, not WorkerProfile field
                'availability_status': availability_status,
                'total_earnings': total_earnings,
            },
            'skills': skills,
            'job_stats': {
                'total_jobs': total_jobs,
                'completed_jobs': completed_jobs,
                'active_jobs': active_jobs,
                'completion_rate': (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0,
            },
            'review_count': review_count,  # Fixed: Now calculated from JobReview model
        }
        
    except Exception as e:
        print(f"âŒ Error fetching worker detail: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_client_detail(account_id: str):
    """Get detailed information about a specific client by account ID."""
    from django.db.models import Q, Count
    from adminpanel.models import KYCLogs
    
    try:
        # Get the client profile
        profile = Profile.objects.filter(
            profileType='CLIENT',
            accountFK__accountID=account_id
        ).select_related('accountFK').first()
        
        if not profile:
            return None
        
        account = profile.accountFK
        
        # Get KYC status from logs (most recent entry)
        try:
            latest_log = KYCLogs.objects.filter(
                accountFK=account,
                kycType=KYCLogs.KYCSubject.USER
            ).order_by('-reviewedAt').first()
            
            if latest_log:
                kyc_status = latest_log.action  # APPROVED or REJECTED
            else:
                # No log entry - check if KYC exists and is pending
                try:
                    kyc_obj = kyc.objects.get(accountFK=account)
                    kyc_status = kyc_obj.kyc_status  # PENDING
                except kyc.DoesNotExist:
                    kyc_status = 'NOT_SUBMITTED'
        except Exception as e:
            kyc_status = 'NOT_SUBMITTED'
        
        # Get client's posted jobs
        try:
            from accounts.models import Job, ClientProfile, JobReview
            from django.db.models import Sum, Avg, Count
            
            # Get client profile for additional data
            try:
                client_profile = ClientProfile.objects.get(profileID=profile)
                client_description = client_profile.description or ''
            except ClientProfile.DoesNotExist:
                client_profile = None
                client_description = ''
            
            # Get job statistics using correct relationship
            if client_profile:
                all_jobs = Job.objects.filter(clientID=client_profile)
                total_jobs = all_jobs.count()
                completed_jobs = all_jobs.filter(status='COMPLETED').count()
                active_jobs = all_jobs.filter(status='ACTIVE').count()
                in_progress_jobs = all_jobs.filter(status='IN_PROGRESS').count()
                cancelled_jobs = all_jobs.filter(status='CANCELLED').count()
                
                # Calculate total spent (completed jobs only)
                total_spent = all_jobs.filter(
                    status='COMPLETED',
                    budget__isnull=False
                ).aggregate(total=Sum('budget'))['total'] or 0
                
                # Get review statistics for client (reviews ABOUT the client from workers)
                reviews_stats = JobReview.objects.filter(
                    revieweeID=account,  # Client received the review
                    reviewerType=JobReview.ReviewerType.WORKER  # Review from worker
                ).aggregate(
                    avg_rating=Avg('rating'),
                    review_count=Count('reviewID')
                )
                
                client_rating = float(reviews_stats['avg_rating'] or 0)
                review_count = reviews_stats['review_count'] or 0
            else:
                total_jobs = 0
                completed_jobs = 0
                active_jobs = 0
                in_progress_jobs = 0
                cancelled_jobs = 0
                total_spent = 0
                client_rating = 0
                review_count = 0
        except Exception as e:
            print(f"Error fetching client job stats: {str(e)}")
            import traceback
            traceback.print_exc()
            client_description = ''
            total_jobs = 0
            completed_jobs = 0
            active_jobs = 0
            in_progress_jobs = 0
            cancelled_jobs = 0
            total_spent = 0
            client_rating = 0
            review_count = 0
        
        return {
            'id': str(account.accountID),
            'profile_id': str(profile.profileID),
            'email': account.email,
            'first_name': profile.firstName or '',
            'last_name': profile.lastName or '',
            'full_name': f"{profile.firstName or ''} {profile.lastName or ''}".strip(),
            'phone': profile.contactNum or '',
            'birth_date': profile.birthDate.isoformat() if profile.birthDate else None,
            'profile_image': profile.profileImg or '',
            'address': {
                'street': account.street_address or '',
                'city': account.city or '',
                'province': account.province or '',
                'postal_code': account.postal_code or '',
                'country': account.country or 'Philippines',
            },
            'location': {
                'latitude': float(profile.latitude) if profile.latitude else None,
                'longitude': float(profile.longitude) if profile.longitude else None,
                'sharing_enabled': profile.location_sharing_enabled,
                'updated_at': profile.location_updated_at.isoformat() if profile.location_updated_at else None,
            },
            'status': 'active' if account.isVerified else 'inactive',
            'kyc_status': kyc_status,
            'join_date': account.createdAt.isoformat() if account.createdAt else None,
            'is_verified': account.isVerified,
            'is_suspended': account.is_suspended,
            'is_banned': account.is_banned,
            'client_data': {
                'description': client_description,
                'rating': client_rating,
            },
            'job_stats': {
                'total_jobs': total_jobs,
                'completed_jobs': completed_jobs,
                'active_jobs': active_jobs,
                'in_progress_jobs': in_progress_jobs,
                'cancelled_jobs': cancelled_jobs,
                'completion_rate': (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0,
            },
            'review_count': review_count,
            'total_spent': float(total_spent),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching client detail: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_agency_detail(account_id: str):
    """Get detailed information about a specific agency by account ID."""
    from django.db.models import Q, Count
    from adminpanel.models import KYCLogs
    from agency.models import AgencyKYC, AgencyEmployee
    
    try:
        # Get the agency
        agency = Agency.objects.filter(
            accountFK__accountID=account_id
        ).select_related('accountFK').first()
        
        if not agency:
            return None
        
        account = agency.accountFK
        
        # Get Agency KYC status from logs (most recent entry)
        try:
            latest_log = KYCLogs.objects.filter(
                accountFK=account,
                kycType=KYCLogs.KYCSubject.AGENCY
            ).order_by('-reviewedAt').first()
            
            if latest_log:
                kyc_status = latest_log.action  # APPROVED or REJECTED
            else:
                # No log entry - check if AgencyKYC exists and is pending
                try:
                    agency_kyc_obj = AgencyKYC.objects.get(accountFK=account)
                    kyc_status = agency_kyc_obj.status  # PENDING, APPROVED, REJECTED
                except AgencyKYC.DoesNotExist:
                    kyc_status = 'NOT_SUBMITTED'
        except Exception as e:
            kyc_status = 'NOT_SUBMITTED'
        
        # Count employees (AgencyEmployee model - separate from Profile)
        try:
            employees = AgencyEmployee.objects.filter(agency=account)
            total_employees = employees.count()
            
            # Get employee details
            employee_list = [
                {
                    'id': str(emp.employeeID),
                    'name': emp.name,
                    'email': emp.email,
                    'role': emp.role or 'Employee',
                    'rating': float(emp.rating) if emp.rating else 0.0,
                    'avatar': emp.avatar or '',
                }
                for emp in employees[:10]  # Limit to first 10 employees for detail view
            ]
        except:
            total_employees = 0
            employee_list = []
        
        # Count jobs
        try:
            from accounts.models import Job
            all_jobs = Job.objects.filter(agencyFK=agency)
            total_jobs = all_jobs.count()
            completed_jobs = all_jobs.filter(status='COMPLETED').count()
            active_jobs = all_jobs.filter(status='ACTIVE').count()
        except:
            total_jobs = 0
            completed_jobs = 0
            active_jobs = 0
        
        # Get agency rating and review count from reviews (as reviewee)
        try:
            from accounts.models import JobReview
            from django.db.models import Avg, Count
            
            reviews_stats = JobReview.objects.filter(
                revieweeID=account,  # revieweeID is ForeignKey to Accounts
                status='ACTIVE'
            ).aggregate(
                avg_rating=Avg('rating'),
                review_count=Count('reviewID')
            )
            
            agency_rating = float(reviews_stats['avg_rating'] or 0.0)
            review_count = reviews_stats['review_count'] or 0
        except Exception as e:
            print(f"Error getting agency reviews: {str(e)}")
            agency_rating = 0.0
            review_count = 0
        
        return {
            'id': str(account.accountID),
            'agency_id': str(agency.agencyId),
            'email': account.email,
            'business_name': agency.businessName or '',
            'phone': agency.contactNumber or '',
            'address': {
                'street': agency.street_address or '',
                'city': agency.city or '',
                'province': agency.province or '',
                'postal_code': agency.postal_code or '',
                'country': agency.country or '',
                'full_address': f"{agency.street_address or ''}, {agency.city or ''}, {agency.province or ''} {agency.postal_code or ''}".strip(', '),
            },
            'business_description': agency.businessDesc or '',
            'status': 'active' if account.isVerified else 'inactive',
            'kyc_status': kyc_status,
            'join_date': account.createdAt.isoformat() if account.createdAt else None,
            'is_verified': account.isVerified,
            'employee_stats': {
                'total_employees': total_employees,
                'employees': employee_list,
            },
            'job_stats': {
                'total_jobs': total_jobs,
                'completed_jobs': completed_jobs,
                'active_jobs': active_jobs,
                'completion_rate': (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0,
            },
            'rating': agency_rating,  # Fixed: Now calculated from JobReview model
            'review_count': review_count,  # Fixed: Now calculated from JobReview model
        }
        
    except Exception as e:
        print(f"âŒ Error fetching agency detail: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_agencies_list(page: int = 1, page_size: int = 50, search: str | None = None, status_filter: str | None = None):
    """Get paginated list of agency accounts with their details."""
    from django.db.models import Q, Count
    from django.core.paginator import Paginator
    
    try:
        # Get all agencies
        agencies_query = Agency.objects.select_related('accountFK').all()
        
        # Apply search filter
        if search:
            agencies_query = agencies_query.filter(
                Q(accountFK__email__icontains=search) |
                Q(businessName__icontains=search)
            )
        
        # Apply status filter
        if status_filter and status_filter != 'all':
            if status_filter == 'active':
                agencies_query = agencies_query.filter(accountFK__isVerified=True)
            elif status_filter == 'inactive':
                agencies_query = agencies_query.filter(accountFK__isVerified=False)
        
        # Order by creation date (newest first)
        agencies_query = agencies_query.order_by('-accountFK__createdAt')
        
        # Paginate
        paginator = Paginator(agencies_query, page_size)
        page_obj = paginator.get_page(page)
        
        # Build result
        agencies_list = []
        for agency in page_obj:
            account = agency.accountFK
            
            # Get Agency KYC status from logs (most recent entry)
            try:
                from adminpanel.models import KYCLogs
                latest_log = KYCLogs.objects.filter(
                    accountFK=account,
                    kycType=KYCLogs.KYCSubject.AGENCY
                ).order_by('-reviewedAt').first()
                
                if latest_log:
                    kyc_status = latest_log.action  # APPROVED or REJECTED
                else:
                    # No log entry - check if AgencyKYC exists and is pending
                    try:
                        agency_kyc_obj = AgencyKYC.objects.get(accountFK=account)
                        kyc_status = agency_kyc_obj.status  # PENDING, APPROVED, REJECTED
                    except AgencyKYC.DoesNotExist:
                        kyc_status = 'NOT_SUBMITTED'
            except Exception as e:
                kyc_status = 'NOT_SUBMITTED'
            
            # Count employees (AgencyEmployee model - separate from Profile)
            try:
                from agency.models import AgencyEmployee
                total_workers = AgencyEmployee.objects.filter(agency=account).count()
                
                # Get detailed employee information
                employees = AgencyEmployee.objects.filter(
                    agency=account,
                    isActive=True
                ).order_by('-rating', 'name')
                
                employees_list = [
                    {
                        'id': str(emp.employeeID),
                        'name': emp.name,
                        'email': emp.email,
                        'role': emp.role or 'Worker',
                        'rating': float(emp.rating) if emp.rating else 0.0,
                        'total_jobs_completed': emp.totalJobsCompleted,
                        'total_earnings': float(emp.totalEarnings),
                        'is_employee_of_month': emp.employeeOfTheMonth,
                        'avatar': emp.avatar,
                    }
                    for emp in employees[:10]  # Limit to top 10 employees
                ]
            except Exception as e:
                print(f"Error getting agency employees: {e}")
                total_workers = 0
                employees_list = []
            
            # Count jobs
            try:
                from accounts.models import Job
                total_jobs = Job.objects.filter(agencyFK=agency).count()
                completed_jobs = Job.objects.filter(
                    agencyFK=agency,
                    status='COMPLETED'
                ).count()
            except:
                total_jobs = 0
                completed_jobs = 0
            
            # Get agency rating and review count from reviews
            try:
                from accounts.models import JobReview
                from django.db.models import Avg, Count
                
                reviews_stats = JobReview.objects.filter(
                    revieweeID=account,
                    status='ACTIVE'
                ).aggregate(
                    avg_rating=Avg('rating'),
                    review_count=Count('reviewID')
                )
                
                agency_rating = float(reviews_stats['avg_rating'] or 0.0)
                review_count = reviews_stats['review_count'] or 0
            except Exception as e:
                print(f"Error getting agency reviews for {account.email}: {e}")
                agency_rating = 0.0
                review_count = 0
            
            agencies_list.append({
                'id': str(agency.agencyId),
                'account_id': str(account.accountID),
                'email': account.email,
                'agency_name': agency.businessName or '',
                'phone': agency.contactNumber or '',
                'address': f"{agency.city}, {agency.province}".strip(', ') if (agency.city or agency.province) else agency.country or 'N/A',
                'status': 'active' if account.isVerified else 'inactive',
                'kyc_status': kyc_status,
                'join_date': account.createdAt.isoformat() if account.createdAt else None,
                'is_verified': account.isVerified,
                'total_workers': total_workers,
                'total_jobs': total_jobs,
                'completed_jobs': completed_jobs,
                'rating': round(agency_rating, 1),  # Fixed: Calculated from JobReview model
                'review_count': review_count,  # Fixed: Calculated from JobReview model
                'employees': employees_list,
            })
        
        return {
            'agencies': agencies_list,
            'total': paginator.count,
            'page': page,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching agencies list: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


# ==========================================
# JOBS MANAGEMENT FUNCTIONS
# ==========================================

def get_jobs_list(page: int = 1, page_size: int = 20, status: str | None = None, category_id: int | None = None):
    """
    Get paginated list of all jobs with filtering options
    """
    from accounts.models import Job, Specializations
    from django.core.paginator import Paginator
    from django.db.models import Count
    
    try:
        # Start with all jobs
        queryset = Job.objects.select_related(
            'clientID__profileID__accountFK',
            'categoryID',
            'assignedWorkerID__profileID__accountFK'
        ).prefetch_related('applications')
        
        # Apply filters
        if status:
            queryset = queryset.filter(status=status.upper())
        
        if category_id:
            queryset = queryset.filter(categoryID_id=category_id)
        
        # Paginate
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        jobs_list = []
        for job in page_obj:
            client_profile = job.clientID.profileID
            client_account = client_profile.accountFK
            
            # Get category info
            category = None
            if job.categoryID:
                category = {
                    'id': job.categoryID.specializationID,
                    'name': job.categoryID.specializationName
                }
            
            # Get worker info if assigned
            worker_info = None
            if job.assignedWorkerID:
                worker_profile = job.assignedWorkerID.profileID
                worker_account = worker_profile.accountFK
                worker_info = {
                    'id': str(worker_account.accountID),
                    'name': f"{worker_profile.firstName} {worker_profile.lastName}",
                    'rating': float(job.assignedWorkerID.workerRating) if job.assignedWorkerID.workerRating else 0.0
                }
            
            # Count applications
            applications_count = job.applications.count()
            
            jobs_list.append({
                'id': str(job.jobID),
                'title': job.title,
                'description': job.description,
                'category': category,
                'client': {
                    'id': str(client_account.accountID),
                    'name': f"{client_profile.firstName} {client_profile.lastName}",
                    'rating': float(job.clientID.clientRating) if job.clientID.clientRating else 0.0
                },
                'worker': worker_info,
                'budget': float(job.budget),
                'location': job.location,
                'urgency': job.urgency,
                'status': job.status,
                'job_type': job.jobType,  # LISTING or INVITE
                'invite_status': job.inviteStatus if job.jobType == 'INVITE' else None,  # PENDING/ACCEPTED/REJECTED for INVITE jobs
                'applications_count': applications_count,
                'created_at': job.createdAt.isoformat(),
                'updated_at': job.updatedAt.isoformat(),
                'completed_at': job.completedAt.isoformat() if job.completedAt else None,
            })
        
        return {
            'jobs': jobs_list,
            'total': paginator.count,
            'page': page,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching jobs list: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_job_applications_list(page: int = 1, page_size: int = 20, status: str | None = None):
    """
    Get paginated list of all job applications
    """
    from accounts.models import JobApplication
    from django.core.paginator import Paginator
    
    try:
        queryset = JobApplication.objects.select_related(
            'jobID__clientID__profileID__accountFK',
            'jobID__categoryID',
            'workerID__profileID__accountFK'
        ).all()
        
        # Apply status filter if provided
        if status:
            queryset = queryset.filter(status=status.upper())
        
        # Paginate
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        applications_list = []
        for app in page_obj:
            worker_profile = app.workerID.profileID
            worker_account = worker_profile.accountFK
            
            client_profile = app.jobID.clientID.profileID
            client_account = client_profile.accountFK
            
            applications_list.append({
                'id': str(app.applicationID),
                'job': {
                    'id': str(app.jobID.jobID),
                    'title': app.jobID.title,
                },
                'worker': {
                    'id': str(worker_account.accountID),
                    'name': f"{worker_profile.firstName} {worker_profile.lastName}",
                    'rating': float(app.workerID.rating) if app.workerID.rating else 0.0,
                    'completed_jobs': app.workerID.completedJobs or 0,
                },
                'client': {
                    'id': str(client_account.accountID),
                    'name': f"{client_profile.firstName} {client_profile.lastName}",
                },
                'proposed_budget': float(app.proposedBudget),
                'budget_option': app.budgetOption,
                'estimated_duration': app.estimatedDuration,
                'proposal_message': app.proposalMessage,
                'status': app.status,
                'applied_date': app.createdAt.isoformat(),
                'updated_at': app.updatedAt.isoformat(),
            })
        
        return {
            'applications': applications_list,
            'total': paginator.count,
            'page': page,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching applications list: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_jobs_dashboard_stats():
    """
    Get statistics for jobs dashboard
    """
    from accounts.models import Job, JobApplication
    from django.db.models import Count, Sum, Avg, Q
    from decimal import Decimal
    
    try:
        # Total jobs by status
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status='ACTIVE').count()
        in_progress_jobs = Job.objects.filter(status='IN_PROGRESS').count()
        completed_jobs = Job.objects.filter(status='COMPLETED').count()
        cancelled_jobs = Job.objects.filter(status='CANCELLED').count()
        
        # Applications stats
        total_applications = JobApplication.objects.count()
        pending_applications = JobApplication.objects.filter(status='PENDING').count()
        accepted_applications = JobApplication.objects.filter(status='ACCEPTED').count()
        
        # Budget stats
        total_budget = Job.objects.aggregate(total=Sum('budget'))['total'] or Decimal('0')
        avg_budget = Job.objects.aggregate(avg=Avg('budget'))['avg'] or Decimal('0')
        
        # Completion rate
        completion_rate = 0.0
        if total_jobs > 0:
            completion_rate = (completed_jobs / total_jobs) * 100
        
        return {
            'total_jobs': total_jobs,
            'active_jobs': active_jobs,
            'in_progress_jobs': in_progress_jobs,
            'completed_jobs': completed_jobs,
            'cancelled_jobs': cancelled_jobs,
            'total_applications': total_applications,
            'pending_applications': pending_applications,
            'accepted_applications': accepted_applications,
            'total_budget': float(total_budget),
            'avg_budget': float(avg_budget),
            'completion_rate': round(completion_rate, 2),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching jobs dashboard stats: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_job_categories_list():
    """
    Get list of all job categories with statistics
    Returns all categories with job counts
    """
    try:
        from accounts.models import Specializations
        from django.db.models import Count
        
        # Get all categories with job counts
        categories = Specializations.objects.annotate(
            jobs_count=Count('jobs', distinct=True),
            workers_count=Count('workerspecialization', distinct=True),
            clients_count=Count('interestedjobs', distinct=True)
        ).order_by('specializationName')
        
        categories_data = []
        for category in categories:
            categories_data.append({
                'id': category.specializationID,
                'name': category.specializationName,
                'description': category.description or '',
                'minimum_rate': float(category.minimumRate),
                'rate_type': category.rateType,
                'skill_level': category.skillLevel,
                'average_project_cost_min': float(category.averageProjectCostMin),
                'average_project_cost_max': float(category.averageProjectCostMax),
                'jobs_count': getattr(category, 'jobs_count', 0),
                'workers_count': getattr(category, 'workers_count', 0),
                'clients_count': getattr(category, 'clients_count', 0),
            })
        
        return categories_data
        
    except Exception as e:
        print(f"âŒ Error fetching job categories: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_job_disputes_list(page=1, page_size=20, status=None, priority=None):
    """
    Get paginated list of job disputes
    Returns disputes with job, client, and worker information
    """
    try:
        from accounts.models import JobDispute
        from django.core.paginator import Paginator
        
        # Base query with related data
        disputes_query = JobDispute.objects.select_related(
            'jobID',
            'jobID__clientID',
            'jobID__clientID__profileID',
            'jobID__assignedWorkerID',
            'jobID__assignedWorkerID__profileID',
            'jobID__categoryID'
        )
        
        # Apply filters
        if status:
            disputes_query = disputes_query.filter(status=status.upper())
        if priority:
            disputes_query = disputes_query.filter(priority=priority.upper())
        
        # Order by priority (critical first) then by date
        priority_order = {
            'CRITICAL': 1,
            'HIGH': 2,
            'MEDIUM': 3,
            'LOW': 4
        }
        
        # Annotate with priority order for sorting
        from django.db.models import Case, When, IntegerField
        disputes_query = disputes_query.annotate(
            priority_order=Case(
                When(priority='CRITICAL', then=1),
                When(priority='HIGH', then=2),
                When(priority='MEDIUM', then=3),
                When(priority='LOW', then=4),
                output_field=IntegerField(),
            )
        ).order_by('priority_order', '-openedDate')
        
        # Paginate
        paginator = Paginator(disputes_query, page_size)
        disputes_page = paginator.get_page(page)
        
        # Format response
        disputes_data = []
        for dispute in disputes_page:
            job = dispute.jobID
            client = job.clientID
            worker = job.assignedWorkerID
            
            disputes_data.append({
                'id': f"DISP-{str(dispute.disputeID).zfill(3)}",
                'dispute_id': dispute.disputeID,
                'job_id': f"JOB-{str(job.jobID).zfill(3)}",
                'job_title': job.title,
                'category': job.categoryID.specializationName if job.categoryID else None,
                'disputed_by': dispute.disputedBy.lower(),
                'client': {
                    'id': str(client.profileID.profileID),
                    'name': f"{client.profileID.firstName} {client.profileID.lastName}",
                },
                'worker': {
                    'id': str(worker.profileID.profileID) if worker else None,
                    'name': f"{worker.profileID.firstName} {worker.profileID.lastName}" if worker else "Not Assigned",
                } if worker else None,
                'reason': dispute.reason,
                'description': dispute.description,
                'opened_date': dispute.openedDate.isoformat(),
                'status': dispute.status.lower(),
                'priority': dispute.priority.lower(),
                'job_amount': float(dispute.jobAmount),
                'disputed_amount': float(dispute.disputedAmount),
                'resolution': dispute.resolution,
                'resolved_date': dispute.resolvedDate.isoformat() if dispute.resolvedDate else None,
                'assigned_to': dispute.assignedTo,
            })
        
        return {
            'disputes': disputes_data,
            'total_count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': page,
            'has_next': disputes_page.has_next(),
            'has_previous': disputes_page.has_previous(),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching job disputes: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_disputes_dashboard_stats():
    """
    Get statistics for disputes dashboard
    Returns counts by status and priority
    """
    try:
        from accounts.models import JobDispute
        from django.db.models import Sum, Avg
        from decimal import Decimal
        
        # Total disputes
        total_disputes = JobDispute.objects.count()
        
        # By status
        open_disputes = JobDispute.objects.filter(status='OPEN').count()
        under_review = JobDispute.objects.filter(status='UNDER_REVIEW').count()
        resolved_disputes = JobDispute.objects.filter(status='RESOLVED').count()
        closed_disputes = JobDispute.objects.filter(status='CLOSED').count()
        
        # By priority
        critical_disputes = JobDispute.objects.filter(priority='CRITICAL', status__in=['OPEN', 'UNDER_REVIEW']).count()
        high_priority = JobDispute.objects.filter(priority='HIGH', status__in=['OPEN', 'UNDER_REVIEW']).count()
        
        # By disputed party
        client_disputes = JobDispute.objects.filter(disputedBy='CLIENT').count()
        worker_disputes = JobDispute.objects.filter(disputedBy='WORKER').count()
        
        # Amount stats
        total_disputed_amount = JobDispute.objects.aggregate(total=Sum('disputedAmount'))['total'] or Decimal('0')
        avg_disputed_amount = JobDispute.objects.aggregate(avg=Avg('disputedAmount'))['avg'] or Decimal('0')
        
        # Resolution rate
        resolution_rate = 0.0
        if total_disputes > 0:
            resolution_rate = ((resolved_disputes + closed_disputes) / total_disputes) * 100
        
        return {
            'total_disputes': total_disputes,
            'open_disputes': open_disputes,
            'under_review': under_review,
            'resolved_disputes': resolved_disputes,
            'closed_disputes': closed_disputes,
            'critical_disputes': critical_disputes,
            'high_priority': high_priority,
            'client_disputes': client_disputes,
            'worker_disputes': worker_disputes,
            'total_disputed_amount': float(total_disputed_amount),
            'avg_disputed_amount': float(avg_disputed_amount),
            'resolution_rate': round(resolution_rate, 2),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching disputes dashboard stats: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_all_reviews_list(page=1, page_size=20, status=None, reviewer_type=None, min_rating=None):
    """
    Get paginated list of all reviews (general user reviews)
    Returns reviews with reviewer and reviewee information
    """
    try:
        from accounts.models import JobReview
        from django.core.paginator import Paginator
        
        # Base query with related data
        reviews_query = JobReview.objects.select_related(
            'jobID',
            'jobID__categoryID',
            'reviewerID',
            'revieweeID'
        )
        
        # Apply filters
        if status:
            reviews_query = reviews_query.filter(status=status.upper())
        if reviewer_type:
            reviews_query = reviews_query.filter(reviewerType=reviewer_type.upper())
        if min_rating:
            reviews_query = reviews_query.filter(rating__gte=min_rating)
        
        # Order by most recent
        reviews_query = reviews_query.order_by('-createdAt')
        
        # Paginate
        paginator = Paginator(reviews_query, page_size)
        reviews_page = paginator.get_page(page)
        
        # Format response
        reviews_data = []
        for review in reviews_page:
            job = review.jobID
            reviewer = review.reviewerID
            reviewee = review.revieweeID
            
            reviews_data.append({
                'id': f"REV-{str(review.reviewID).zfill(3)}",
                'review_id': review.reviewID,
                'job': {
                    'id': f"JOB-{str(job.jobID).zfill(3)}",
                    'title': job.title,
                    'category': job.categoryID.specializationName if job.categoryID else None,
                },
                'reviewer': {
                    'id': str(reviewer.profileID),
                    'name': f"{reviewer.firstName} {reviewer.lastName}",
                    'type': review.reviewerType.lower(),
                },
                'reviewee': {
                    'id': str(reviewee.profileID),
                    'name': f"{reviewee.firstName} {reviewee.lastName}",
                    'type': 'worker' if review.reviewerType == 'CLIENT' else 'client',
                },
                'rating': float(review.rating),
                'comment': review.comment,
                'status': review.status.lower(),
                'is_flagged': review.isFlagged,
                'flag_reason': review.flagReason,
                'helpful_count': review.helpfulCount,
                'created_at': review.createdAt.isoformat(),
            })
        
        return {
            'reviews': reviews_data,
            'total_count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': page,
            'has_next': reviews_page.has_next(),
            'has_previous': reviews_page.has_previous(),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching all reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_job_reviews_list(page=1, page_size=20, status=None):
    """
    Get paginated list of reviews grouped by job
    Returns jobs with their client and worker reviews
    """
    try:
        from accounts.models import Job, JobReview
        from django.core.paginator import Paginator
        from django.db.models import Q, Count, Avg
        
        # Get completed jobs that have at least one review
        jobs_query = Job.objects.filter(
            status='COMPLETED',
            reviews__isnull=False
        ).select_related(
            'clientID',
            'clientID__profileID',
            'assignedWorkerID',
            'assignedWorkerID__profileID',
            'categoryID'
        ).distinct()
        
        # Order by completion date (most recent first)
        jobs_query = jobs_query.order_by('-completedAt')
        
        # Paginate
        paginator = Paginator(jobs_query, page_size)
        jobs_page = paginator.get_page(page)
        
        # Format response
        job_reviews_data = []
        for job in jobs_page:
            client = job.clientID
            worker = job.assignedWorkerID
            
            # Get client's review (review given by client about worker)
            client_review = JobReview.objects.filter(
                jobID=job,
                reviewerType='CLIENT'
            ).first()
            
            # Get worker's review (review given by worker about client)
            worker_review = JobReview.objects.filter(
                jobID=job,
                reviewerType='WORKER'
            ).first()
            
            # Determine review status
            if client_review and worker_review:
                review_status = 'completed'
            elif client_review or worker_review:
                review_status = 'pending'
            else:
                review_status = 'none'
            
            job_data = {
                'job_id': f"JOB-{str(job.jobID).zfill(3)}",
                'job_title': job.title,
                'category': job.categoryID.specializationName if job.categoryID else None,
                'completion_date': job.completedAt.isoformat() if job.completedAt else None,
                'client': {
                    'id': str(client.profileID.profileID),
                    'name': f"{client.profileID.firstName} {client.profileID.lastName}",
                },
                'worker': {
                    'id': str(worker.profileID.profileID) if worker else None,
                    'name': f"{worker.profileID.firstName} {worker.profileID.lastName}" if worker else "Not Assigned",
                } if worker else None,
                'review_status': review_status,
            }
            
            # Add client review if exists
            if client_review:
                job_data['client_review'] = {
                    'id': f"REV-{str(client_review.reviewID).zfill(3)}",
                    'rating': float(client_review.rating),
                    'comment': client_review.comment,
                    'date': client_review.createdAt.isoformat(),
                    'is_flagged': client_review.isFlagged,
                    'status': client_review.status.lower(),
                }
            
            # Add worker review if exists
            if worker_review:
                job_data['worker_review'] = {
                    'id': f"REV-{str(worker_review.reviewID).zfill(3)}",
                    'rating': float(worker_review.rating),
                    'comment': worker_review.comment,
                    'date': worker_review.createdAt.isoformat(),
                    'is_flagged': worker_review.isFlagged,
                    'status': worker_review.status.lower(),
                }
            
            job_reviews_data.append(job_data)
        
        return {
            'job_reviews': job_reviews_data,
            'total_count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': page,
            'has_next': jobs_page.has_next(),
            'has_previous': jobs_page.has_previous(),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching job reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_reviews_dashboard_stats():
    """
    Get statistics for reviews dashboard
    Returns counts and averages
    """
    try:
        from accounts.models import JobReview, Job
        from django.db.models import Avg, Count, Q
        from decimal import Decimal
        
        # Total reviews
        total_reviews = JobReview.objects.filter(status='ACTIVE').count()
        
        # By reviewer type
        client_reviews = JobReview.objects.filter(reviewerType='CLIENT', status='ACTIVE').count()
        worker_reviews = JobReview.objects.filter(reviewerType='WORKER', status='ACTIVE').count()
        
        # Average ratings
        avg_rating_all = JobReview.objects.filter(status='ACTIVE').aggregate(avg=Avg('rating'))['avg'] or Decimal('0')
        avg_client_given = JobReview.objects.filter(reviewerType='CLIENT', status='ACTIVE').aggregate(avg=Avg('rating'))['avg'] or Decimal('0')
        avg_worker_given = JobReview.objects.filter(reviewerType='WORKER', status='ACTIVE').aggregate(avg=Avg('rating'))['avg'] or Decimal('0')
        
        # Flagged reviews
        flagged_reviews = JobReview.objects.filter(isFlagged=True).count()
        
        # Rating distribution
        five_star = JobReview.objects.filter(rating__gte=4.5, status='ACTIVE').count()
        four_star = JobReview.objects.filter(rating__gte=3.5, rating__lt=4.5, status='ACTIVE').count()
        three_star = JobReview.objects.filter(rating__gte=2.5, rating__lt=3.5, status='ACTIVE').count()
        below_three = JobReview.objects.filter(rating__lt=2.5, status='ACTIVE').count()
        
        # Jobs with reviews
        completed_jobs = Job.objects.filter(status='COMPLETED').count()
        jobs_with_reviews = Job.objects.filter(
            status='COMPLETED',
            reviews__isnull=False
        ).distinct().count()
        
        # Review completion rate
        review_rate = 0.0
        if completed_jobs > 0:
            review_rate = (jobs_with_reviews / completed_jobs) * 100
        
        return {
            'total_reviews': total_reviews,
            'client_reviews': client_reviews,
            'worker_reviews': worker_reviews,
            'avg_rating_all': round(float(avg_rating_all), 2),
            'avg_client_given': round(float(avg_client_given), 2),
            'avg_worker_given': round(float(avg_worker_given), 2),
            'flagged_reviews': flagged_reviews,
            'five_star': five_star,
            'four_star': four_star,
            'three_star': three_star,
            'below_three': below_three,
            'completed_jobs': completed_jobs,
            'jobs_with_reviews': jobs_with_reviews,
            'review_completion_rate': round(review_rate, 2),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching reviews dashboard stats: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_flagged_reviews_list(page=1, page_size=20):
    """
    Get paginated list of flagged reviews
    """
    try:
        from accounts.models import JobReview
        from django.core.paginator import Paginator
        
        # Get flagged reviews
        reviews_query = JobReview.objects.filter(
            isFlagged=True
        ).select_related(
            'jobID',
            'jobID__categoryID',
            'reviewerID',
            'revieweeID',
            'flaggedBy'
        ).order_by('-flaggedAt')
        
        # Paginate
        paginator = Paginator(reviews_query, page_size)
        reviews_page = paginator.get_page(page)
        
        # Format response
        reviews_data = []
        for review in reviews_page:
            job = review.jobID
            reviewer = review.reviewerID
            reviewee = review.revieweeID
            
            review_data = {
                'id': f"REV-{str(review.reviewID).zfill(3)}",
                'review_id': review.reviewID,
                'job': {
                    'id': f"JOB-{str(job.jobID).zfill(3)}",
                    'title': job.title,
                    'category': job.categoryID.specializationName if job.categoryID else None,
                },
                'reviewer': {
                    'id': str(reviewer.profileID),
                    'name': f"{reviewer.firstName} {reviewer.lastName}",
                    'type': review.reviewerType.lower(),
                },
                'reviewee': {
                    'id': str(reviewee.profileID),
                    'name': f"{reviewee.firstName} {reviewee.lastName}",
                    'type': 'worker' if review.reviewerType == 'CLIENT' else 'client',
                },
                'rating': float(review.rating),
                'comment': review.comment,
                'status': review.status.lower(),
                'flag_reason': review.flagReason,
                'flagged_at': review.flaggedAt.isoformat() if review.flaggedAt else None,
                'created_at': review.createdAt.isoformat(),
            }
            
            if review.flaggedBy:
                review_data['flagged_by'] = {
                    'id': str(review.flaggedBy.profileID),
                    'name': f"{review.flaggedBy.firstName} {review.flaggedBy.lastName}",
                }
            
            reviews_data.append(review_data)
        
        return {
            'reviews': reviews_data,
            'total_count': paginator.count,
            'total_pages': paginator.num_pages,
            'current_page': page,
            'has_next': reviews_page.has_next(),
            'has_previous': reviews_page.has_previous(),
        }
        
    except Exception as e:
        print(f"âŒ Error fetching flagged reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        raise







def get_job_detail(job_id: str):
    """
    Get comprehensive job details including timeline data for admin panel
    """
    from accounts.models import Job, JobPhoto, JobApplication, JobReview
    from django.shortcuts import get_object_or_404
    
    try:
        # Fetch job with all related data
        job = get_object_or_404(
            Job.objects.select_related(
                'clientID__profileID__accountFK',
                'categoryID',
                'assignedWorkerID__profileID__accountFK',
                'assignedAgencyFK'
            ).prefetch_related(
                'photos',
                'applications',
                'reviews'
            ),
            jobID=job_id
        )
        
        # Client information
        client_profile = job.clientID.profileID
        client_account = client_profile.accountFK
        client_info = {
            'id': str(client_account.accountID),
            'name': f"{client_profile.firstName} {client_profile.lastName}",
            'email': client_account.email,
            'phone': client_profile.contactNum or '',
            'location': job.location,  # Use job location, not profile
            'rating': float(job.clientID.clientRating) if job.clientID.clientRating else 0.0,
            'avatar_url': client_profile.profileImg or None
        }
        
        # Worker information (if assigned)
        worker_info = None
        if job.assignedWorkerID:
            worker_profile = job.assignedWorkerID.profileID
            worker_account = worker_profile.accountFK
            worker_info = {
                'id': str(worker_account.accountID),
                'name': f"{worker_profile.firstName} {worker_profile.lastName}",
                'email': worker_account.email,
                'phone': worker_profile.contactNum or '',
                'rating': float(job.assignedWorkerID.workerRating) if job.assignedWorkerID.workerRating else 0.0,
                'completed_jobs': 0,
                'avatar_url': worker_profile.profileImg or None
            }
        
        # Category information
        category = None
        if job.categoryID:
            category = {
                'id': job.categoryID.specializationID,
                'name': job.categoryID.specializationName
            }
        
        # Timeline data - 7 milestones
        timeline = {
            'job_posted': job.createdAt.isoformat(),
            'worker_assigned': job.assignedWorkerID and job.updatedAt.isoformat(),
            'start_initiated': job.clientConfirmedWorkStartedAt.isoformat() if job.clientConfirmedWorkStartedAt else None,
            'worker_arrived': job.clientConfirmedWorkStartedAt.isoformat() if job.clientConfirmedWorkStartedAt else None,
            'worker_completed': job.workerMarkedCompleteAt.isoformat() if job.workerMarkedCompleteAt else None,
            'client_confirmed': job.clientMarkedCompleteAt.isoformat() if job.clientMarkedCompleteAt else None,
            'reviews_submitted': job.completedAt.isoformat() if job.completedAt else None
        }
        
        # Completion photos
        photos = [
            {
                'id': photo.photoID,
                'url': photo.photoURL,
                'uploaded_at': photo.uploadedAt.isoformat()
            }
            for photo in job.photos.all()
        ]
        
        # Applications
        applications = []
        for app in job.applications.select_related('workerID__profileID__accountFK')[:10]:
            worker_profile = app.workerID.profileID
            worker_account = worker_profile.accountFK
            applications.append({
                'id': str(app.applicationID),
                'worker': {
                    'id': str(worker_account.accountID),
                    'name': f"{worker_profile.firstName} {worker_profile.lastName}",
                    'rating': float(app.workerID.workerRating) if app.workerID.workerRating else 0.0,
                    'avatar_url': worker_profile.profileImg or None
                },
                'proposed_budget': float(app.proposedBudget),
                'status': app.status,
                'message': app.proposalMessage or '',
                'applied_at': app.createdAt.isoformat()
            })
        
        # Reviews
        reviews = []
        for review in job.reviews.select_related('reviewerID')[:10]:
            # Get the reviewer's profile (could be WorkerProfile or ClientProfile)
            reviewer_account = review.reviewerID
            try:
                # Try to get profile through WorkerProfile or ClientProfile
                reviewer_profile = Profile.objects.filter(accountFK=reviewer_account).first()
                if reviewer_profile:
                    reviewer_name = f"{reviewer_profile.firstName} {reviewer_profile.lastName}"
                else:
                    reviewer_name = reviewer_account.email
            except:
                reviewer_name = reviewer_account.email
                
            reviews.append({
                'id': str(review.reviewID),
                'reviewer_name': reviewer_name,
                'reviewer_type': review.reviewerType,
                'rating': float(review.rating),
                'comment': review.comment or '',
                'created_at': review.createdAt.isoformat()
            })
        
        # Build comprehensive job detail
        job_detail = {
            'id': str(job.jobID),
            'title': job.title,
            'description': job.description,
            'category': category,
            'budget': float(job.budget),
            'location': job.location,
            'urgency': job.urgency,
            'status': job.status,
            'job_type': job.jobType,
            'materials_needed': job.materialsNeeded,
            'expected_duration': job.expectedDuration,
            'preferred_start_date': job.preferredStartDate.isoformat() if job.preferredStartDate else None,
            
            # Payment tracking
            'escrow_amount': float(job.escrowAmount),
            'escrow_paid': job.escrowPaid,
            'escrow_paid_at': job.escrowPaidAt.isoformat() if job.escrowPaidAt else None,
            'remaining_payment': float(job.remainingPayment),
            'remaining_payment_paid': job.remainingPaymentPaid,
            'remaining_payment_paid_at': job.remainingPaymentPaidAt.isoformat() if job.remainingPaymentPaidAt else None,
            
            # Completion tracking
            'worker_marked_complete': job.workerMarkedComplete,
            'client_marked_complete': job.clientMarkedComplete,
            'client_confirmed_work_started': job.clientConfirmedWorkStarted,
            
            # Timestamps
            'created_at': job.createdAt.isoformat(),
            'updated_at': job.updatedAt.isoformat(),
            'completed_at': job.completedAt.isoformat() if job.completedAt else None,
            
            # Related entities
            'client': client_info,
            'worker': worker_info,
            'timeline': timeline,
            'photos': photos,
            'applications': applications,
            'applications_count': job.applications.count(),
            'reviews': reviews
        }
        
        return job_detail
        
    except Exception as e:
        print(f"❌ Error fetching job detail: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def delete_job(job_id: str):
    """
    Delete a job listing and all related records.
    
    Args:
        job_id: Job ID to delete
    
    Returns:
        dict: Success status and message
    """
    from accounts.models import Job, JobApplication, JobReview, Transaction
    from django.db import transaction
    
    try:
        # Get the job
        job = Job.objects.get(jobID=job_id)
        
        # Check if job can be deleted (only ACTIVE or CANCELLED jobs)
        if job.status in ['IN_PROGRESS', 'COMPLETED']:
            return {
                'success': False,
                'error': f'Cannot delete job with status {job.status}. Only ACTIVE or CANCELLED jobs can be deleted.'
            }
        
        # Use atomic transaction to ensure all deletions succeed or none do
        with transaction.atomic():
            # Delete related job applications
            JobApplication.objects.filter(jobID=job).delete()
            
            # Delete related reviews (if any)
            JobReview.objects.filter(jobID=job).delete()
            
            # Delete related transactions (if any)
            Transaction.objects.filter(relatedJobPosting=job).delete()
            
            # Delete the job itself
            job.delete()
        
        return {
            'success': True,
            'message': f'Job "{job.title}" deleted successfully'
        }
        
    except Job.DoesNotExist:
        return {
            'success': False,
            'error': 'Job not found'
        }
    except Exception as e:
        print(f"❌ Error deleting job: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }


def get_job_invoice(job_id: int):
    """
    Get invoice data for a completed job.
    Returns detailed invoice information including client, worker, 
    payment breakdown, and transaction details.
    """
    from accounts.models import Job, Transaction, Profile
    from decimal import Decimal
    
    try:
        # Get the job with related data
        job = Job.objects.select_related(
            'clientID', 'clientID__profileID', 'clientID__profileID__accountFK',
            'assignedEmployeeID', 'assignedEmployeeID__workerProfile', 
            'assignedEmployeeID__workerProfile__accountFK',
            'categoryID'
        ).get(jobID=job_id)
        
        # Get transactions for this job
        transactions = Transaction.objects.filter(relatedJobPosting=job).order_by('-createdAt')
        
        # Get client info
        client_profile = job.clientID.profileID if job.clientID else None
        client_account = client_profile.accountFK if client_profile else None
        
        # Get worker info - could be from assignedEmployee (agency worker) or direct assignment
        worker_profile = None
        worker_account = None
        
        if job.assignedEmployeeID:
            # Agency employee assigned
            worker_profile = job.assignedEmployeeID.workerProfile
            worker_account = worker_profile.accountFK if worker_profile else None
        else:
            # Check for accepted application
            from accounts.models import JobApplication
            accepted_app = JobApplication.objects.filter(
                jobID=job, 
                status='ACCEPTED'
            ).select_related('workerID', 'workerID__accountFK').first()
            if accepted_app:
                worker_profile = accepted_app.workerID
                worker_account = worker_profile.accountFK if worker_profile else None
        
        # Calculate amounts
        budget = float(job.budget) if job.budget else 0
        downpayment = budget * 0.5
        platform_fee = downpayment * 0.05  # 5% of downpayment
        subtotal = budget
        total_paid = downpayment + platform_fee  # What client paid upfront
        remaining = budget - downpayment  # Remaining 50%
        
        # Get transaction details
        transaction_data = []
        for txn in transactions:
            transaction_data.append({
                'id': txn.transactionID,
                'type': txn.transactionType,
                'amount': float(txn.amount) if txn.amount else 0,
                'status': txn.status,
                'payment_method': txn.paymentMethod,
                'created_at': txn.createdAt.isoformat() if txn.createdAt else None,
            })
        
        return {
            'success': True,
            'invoice': {
                'job_id': job.jobID,
                'invoice_number': f"INV-{job.jobID:05d}",
                'title': job.title,
                'description': job.description,
                'category': job.categoryID.specializationName if job.categoryID else 'General',
                'status': job.status,
                'location': job.location,
                'created_at': job.createdAt.isoformat() if job.createdAt else None,
                'completed_at': job.completedAt.isoformat() if job.completedAt else None,
                'client': {
                    'id': client_account.accountID if client_account else None,
                    'name': f"{client_account.firstName or ''} {client_account.lastName or ''}".strip() or client_account.email.split('@')[0] if client_account else 'Unknown',
                    'email': client_account.email if client_account else '',
                    'phone': client_account.phoneNumber if client_account else '',
                    'address': job.location or '',
                },
                'worker': {
                    'id': worker_account.accountID if worker_account else None,
                    'name': f"{worker_account.firstName or ''} {worker_account.lastName or ''}".strip() or worker_account.email.split('@')[0] if worker_account else 'Unknown',
                    'email': worker_account.email if worker_account else '',
                    'phone': worker_account.phoneNumber if worker_account else '',
                },
                'budget': budget,
                'budget_type': 'fixed',
                'subtotal': subtotal,
                'downpayment': downpayment,
                'platform_fee': platform_fee,
                'remaining_balance': remaining,
                'final_amount': budget,
                'payment_status': 'paid' if job.status == 'COMPLETED' else 'pending',
                'transactions': transaction_data,
                'materials': job.materials.split(',') if job.materials else [],
            }
        }
        
    except Job.DoesNotExist:
        return {
            'success': False,
            'error': 'Job not found'
        }
    except Exception as e:
        print(f"❌ Error fetching job invoice: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }

