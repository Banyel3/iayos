"""
Settings Service for Admin Panel
================================

Provides platform settings management and admin account management.

Functions:
- get_platform_settings(): Get current platform settings
- update_platform_settings(): Update platform settings
- get_admins(): List all admin accounts
- get_admin_detail(): Get specific admin details
- create_admin(): Create a new admin account
- update_admin(): Update an admin account
- delete_admin(): Delete an admin account
- update_admin_last_login(): Update admin's last login timestamp
"""

from datetime import datetime
from typing import Optional
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from adminpanel.models import PlatformSettings, AdminAccount, AuditLog
from adminpanel.audit_service import log_action
from accounts.models import Accounts


# =============================================================================
# PLATFORM SETTINGS MANAGEMENT
# =============================================================================

def get_platform_settings() -> dict:
    """
    Get current platform settings.
    
    Returns:
        Dictionary with platform settings
    """
    settings = PlatformSettings.get_settings()
    
    return {
        "success": True,
        "settings": {
            "platform_fee_percentage": float(settings.platformFeePercentage),
            "escrow_holding_days": settings.escrowHoldingDays,
            "max_job_budget": float(settings.maxJobBudget),
            "min_job_budget": float(settings.minJobBudget),
            "worker_verification_required": settings.workerVerificationRequired,
            "auto_approve_kyc": settings.autoApproveKYC,
            "kyc_document_expiry_days": settings.kycDocumentExpiryDays,
            "maintenance_mode": settings.maintenanceMode,
            "session_timeout_minutes": settings.sessionTimeoutMinutes,
            "max_upload_size_mb": settings.maxUploadSizeMB,
            # New KYC auto-approval threshold fields
            "kyc_auto_approve_min_confidence": float(getattr(settings, 'kycAutoApproveMinConfidence', 0.90)),
            "kyc_face_match_min_similarity": float(getattr(settings, 'kycFaceMatchMinSimilarity', 0.85)),
            "kyc_require_user_confirmation": getattr(settings, 'kycRequireUserConfirmation', True),
            "last_updated": settings.lastUpdated.isoformat() if settings.lastUpdated else None,
            "updated_by": settings.updatedBy.email if settings.updatedBy else None,
        }
    }


def update_platform_settings(
    admin: Accounts,
    data: dict,
    request=None
) -> dict:
    """
    Update platform settings.
    
    Args:
        admin: Admin account making the change
        data: Dictionary of settings to update
        request: HTTP request for audit logging
    
    Returns:
        Dictionary with success status
    """
    try:
        with transaction.atomic():
            settings = PlatformSettings.get_settings()
            
            # Store old values for audit log
            old_values = {
                "platform_fee_percentage": float(settings.platformFeePercentage),
                "escrow_holding_days": settings.escrowHoldingDays,
                "max_job_budget": float(settings.maxJobBudget),
                "min_job_budget": float(settings.minJobBudget),
                "worker_verification_required": settings.workerVerificationRequired,
                "auto_approve_kyc": settings.autoApproveKYC,
                "kyc_document_expiry_days": settings.kycDocumentExpiryDays,
                "maintenance_mode": settings.maintenanceMode,
                "session_timeout_minutes": settings.sessionTimeoutMinutes,
                "max_upload_size_mb": settings.maxUploadSizeMB,
            }
            
            # Update fields if provided
            if "platform_fee_percentage" in data:
                settings.platformFeePercentage = Decimal(str(data["platform_fee_percentage"]))
            if "escrow_holding_days" in data:
                settings.escrowHoldingDays = int(data["escrow_holding_days"])
            if "max_job_budget" in data:
                settings.maxJobBudget = Decimal(str(data["max_job_budget"]))
            if "min_job_budget" in data:
                settings.minJobBudget = Decimal(str(data["min_job_budget"]))
            if "worker_verification_required" in data:
                settings.workerVerificationRequired = bool(data["worker_verification_required"])
            if "auto_approve_kyc" in data:
                settings.autoApproveKYC = bool(data["auto_approve_kyc"])
            if "kyc_document_expiry_days" in data:
                settings.kycDocumentExpiryDays = int(data["kyc_document_expiry_days"])
            if "maintenance_mode" in data:
                settings.maintenanceMode = bool(data["maintenance_mode"])
            if "session_timeout_minutes" in data:
                settings.sessionTimeoutMinutes = int(data["session_timeout_minutes"])
            if "max_upload_size_mb" in data:
                settings.maxUploadSizeMB = int(data["max_upload_size_mb"])
            # New KYC auto-approval threshold fields
            if "kyc_auto_approve_min_confidence" in data:
                settings.kycAutoApproveMinConfidence = Decimal(str(data["kyc_auto_approve_min_confidence"]))
            if "kyc_face_match_min_similarity" in data:
                settings.kycFaceMatchMinSimilarity = Decimal(str(data["kyc_face_match_min_similarity"]))
            if "kyc_require_user_confirmation" in data:
                settings.kycRequireUserConfirmation = bool(data["kyc_require_user_confirmation"])
            
            settings.updatedBy = admin
            settings.save()
            
            # Store new values for audit log
            new_values = {
                "platform_fee_percentage": float(settings.platformFeePercentage),
                "escrow_holding_days": settings.escrowHoldingDays,
                "max_job_budget": float(settings.maxJobBudget),
                "min_job_budget": float(settings.minJobBudget),
                "worker_verification_required": settings.workerVerificationRequired,
                "auto_approve_kyc": settings.autoApproveKYC,
                "kyc_document_expiry_days": settings.kycDocumentExpiryDays,
                "maintenance_mode": settings.maintenanceMode,
                "session_timeout_minutes": settings.sessionTimeoutMinutes,
                "max_upload_size_mb": settings.maxUploadSizeMB,
            }
            
            # Log the action
            log_action(
                admin=admin,
                action=AuditLog.ActionType.SETTINGS_CHANGE,
                entity_type=AuditLog.EntityType.SETTINGS,
                entity_id="platform",
                details={"changed_fields": list(data.keys())},
                before_value=old_values,
                after_value=new_values,
                request=request
            )
            
            return {"success": True, "message": "Settings updated successfully"}
    
    except Exception as e:
        return {"success": False, "error": str(e)}


# =============================================================================
# ADMIN ACCOUNT MANAGEMENT
# =============================================================================

def get_admins(current_admin: Accounts) -> dict:
    """
    Get list of all admin accounts.
    
    Args:
        current_admin: The currently logged in admin
    
    Returns:
        Dictionary with admin list
    """
    admin_accounts = AdminAccount.objects.select_related('accountFK').all()
    
    admins = []
    for admin in admin_accounts:
        admins.append({
            "id": str(admin.adminID),
            "email": admin.accountFK.email,
            "role": admin.role,
            "permissions": admin.permissions,
            "is_active": admin.isActive,
            "created_at": admin.createdAt.isoformat(),
            "last_login": admin.lastLogin.isoformat() if admin.lastLogin else None,
        })
    
    return {
        "success": True,
        "admins": admins,
        "current_admin_id": str(current_admin.accountID)
    }


def get_admin_detail(admin_id: int) -> dict:
    """
    Get details of a specific admin account.
    
    Args:
        admin_id: ID of the admin account
    
    Returns:
        Dictionary with admin details or error
    """
    try:
        admin = AdminAccount.objects.select_related('accountFK').get(adminID=admin_id)
        
        return {
            "success": True,
            "admin": {
                "id": str(admin.adminID),
                "email": admin.accountFK.email,
                "role": admin.role,
                "permissions": admin.permissions,
                "is_active": admin.isActive,
                "created_at": admin.createdAt.isoformat(),
                "last_login": admin.lastLogin.isoformat() if admin.lastLogin else None,
            }
        }
    except AdminAccount.DoesNotExist:
        return {"success": False, "error": "Admin account not found"}


def create_admin(
    creator: Accounts,
    email: str,
    password: str,
    role: str = "moderator",
    permissions: list = None,
    request=None
) -> dict:
    """
    Create a new admin account.
    
    Args:
        creator: Admin account creating the new admin
        email: Email for the new admin
        password: Password for the new admin
        role: Role (super_admin, admin, moderator)
        permissions: List of permission strings
        request: HTTP request for audit logging
    
    Returns:
        Dictionary with success status and new admin ID
    """
    try:
        with transaction.atomic():
            # Check if email already exists
            if Accounts.objects.filter(email=email).exists():
                return {"success": False, "error": "Email already in use"}
            
            # Create the base account
            account = Accounts.objects.create(
                email=email,
                password=make_password(password),
                isVerified=True,
                isStaff=True
            )
            
            # Create the admin profile
            admin = AdminAccount.objects.create(
                accountFK=account,
                role=role,
                permissions=permissions or [],
                isActive=True
            )
            
            # Log the action
            log_action(
                admin=creator,
                action=AuditLog.ActionType.ADMIN_CREATE,
                entity_type=AuditLog.EntityType.ADMIN,
                entity_id=str(admin.adminID),
                details={"email": email, "role": role},
                after_value={"email": email, "role": role, "permissions": permissions or []},
                request=request
            )
            
            return {
                "success": True,
                "message": "Admin account created successfully",
                "admin_id": str(admin.adminID)
            }
    
    except Exception as e:
        return {"success": False, "error": str(e)}


def update_admin(
    updater: Accounts,
    admin_id: int,
    data: dict,
    request=None
) -> dict:
    """
    Update an admin account.
    
    Args:
        updater: Admin account making the update
        admin_id: ID of the admin to update
        data: Dictionary of fields to update
        request: HTTP request for audit logging
    
    Returns:
        Dictionary with success status
    """
    try:
        with transaction.atomic():
            admin = AdminAccount.objects.select_related('accountFK').get(adminID=admin_id)
            
            # Store old values
            old_values = {
                "role": admin.role,
                "permissions": admin.permissions,
                "is_active": admin.isActive,
            }
            
            # Update fields
            if "role" in data:
                admin.role = data["role"]
            if "permissions" in data:
                admin.permissions = data["permissions"]
            if "is_active" in data:
                admin.isActive = data["is_active"]
            
            admin.save()
            
            # Update password if provided
            if "password" in data and data["password"]:
                admin.accountFK.password = make_password(data["password"])
                admin.accountFK.save()
            
            # Store new values
            new_values = {
                "role": admin.role,
                "permissions": admin.permissions,
                "is_active": admin.isActive,
            }
            
            # Log the action
            log_action(
                admin=updater,
                action=AuditLog.ActionType.ADMIN_UPDATE,
                entity_type=AuditLog.EntityType.ADMIN,
                entity_id=str(admin.adminID),
                details={"updated_fields": list(data.keys())},
                before_value=old_values,
                after_value=new_values,
                request=request
            )
            
            return {"success": True, "message": "Admin account updated successfully"}
    
    except AdminAccount.DoesNotExist:
        return {"success": False, "error": "Admin account not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def delete_admin(
    deleter: Accounts,
    admin_id: int,
    reassign_to_id: Optional[int] = None,
    request=None
) -> dict:
    """
    Delete an admin account.
    
    Args:
        deleter: Admin account performing the deletion
        admin_id: ID of the admin to delete
        reassign_to_id: ID of admin to reassign tickets/tasks to
        request: HTTP request for audit logging
    
    Returns:
        Dictionary with success status
    """
    try:
        with transaction.atomic():
            admin = AdminAccount.objects.select_related('accountFK').get(adminID=admin_id)
            
            # Can't delete yourself
            if admin.accountFK_id == deleter.accountID:
                return {"success": False, "error": "Cannot delete your own account"}
            
            # Can't delete super_admin (unless you're also super_admin)
            if admin.role == AdminAccount.Role.SUPER_ADMIN:
                try:
                    deleter_admin = AdminAccount.objects.get(accountFK=deleter)
                    if deleter_admin.role != AdminAccount.Role.SUPER_ADMIN:
                        return {"success": False, "error": "Only super admins can delete super admin accounts"}
                except AdminAccount.DoesNotExist:
                    return {"success": False, "error": "Only super admins can delete super admin accounts"}
            
            # Store info for audit log
            admin_email = admin.accountFK.email
            admin_role = admin.role
            
            # Delete the admin account (this will also delete the base account due to CASCADE)
            admin.accountFK.delete()
            
            # Log the action
            log_action(
                admin=deleter,
                action=AuditLog.ActionType.ADMIN_DELETE,
                entity_type=AuditLog.EntityType.ADMIN,
                entity_id=str(admin_id),
                details={"email": admin_email, "role": admin_role},
                before_value={"email": admin_email, "role": admin_role},
                request=request
            )
            
            return {"success": True, "message": "Admin account deleted successfully"}
    
    except AdminAccount.DoesNotExist:
        return {"success": False, "error": "Admin account not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def update_admin_last_login(admin: Accounts, request=None) -> None:
    """
    Update admin's last login timestamp and log the login action.
    
    Args:
        admin: The admin account that logged in
        request: HTTP request for audit logging
    """
    try:
        admin_account = AdminAccount.objects.get(accountFK=admin)
        admin_account.lastLogin = timezone.now()
        admin_account.save(update_fields=['lastLogin'])
        
        # Log the login action
        log_action(
            admin=admin,
            action=AuditLog.ActionType.LOGIN,
            entity_type=AuditLog.EntityType.ADMIN,
            entity_id=str(admin_account.adminID),
            details={"success": True},
            request=request
        )
    except AdminAccount.DoesNotExist:
        # Admin profile doesn't exist - that's ok for regular users
        pass


def get_all_permissions() -> list:
    """
    Get list of all available permissions.
    
    Returns:
        List of permission dictionaries
    """
    return [
        {"id": "manage_users", "label": "Manage Users", "description": "Create, edit, suspend users"},
        {"id": "approve_kyc", "label": "Approve KYC", "description": "Review and approve KYC submissions"},
        {"id": "manage_jobs", "label": "Manage Jobs", "description": "Edit, cancel, monitor job listings"},
        {"id": "handle_payments", "label": "Handle Payments", "description": "Process refunds, disputes"},
        {"id": "view_reports", "label": "View Reports", "description": "Access analytics and reports"},
        {"id": "manage_settings", "label": "Manage Settings", "description": "Configure platform settings"},
        {"id": "manage_admins", "label": "Manage Admins", "description": "Create and manage admin accounts"},
    ]


def check_admin_permission(admin: Accounts, permission: str) -> bool:
    """
    Check if an admin has a specific permission.
    
    Args:
        admin: The admin account to check
        permission: The permission string to check
    
    Returns:
        Boolean indicating if the admin has the permission
    """
    try:
        admin_account = AdminAccount.objects.get(accountFK=admin)
        return admin_account.has_permission(permission)
    except AdminAccount.DoesNotExist:
        return False
