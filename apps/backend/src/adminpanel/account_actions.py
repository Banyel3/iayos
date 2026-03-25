"""
Admin Panel Account Management Actions
Handles suspend, ban, activate, and delete operations for user accounts.
"""

from django.utils import timezone
from datetime import timedelta
from django.contrib.sessions.models import Session
from zoneinfo import ZoneInfo
from accounts.models import Accounts, Notification
from adminpanel.audit_service import log_action


PH_TIMEZONE = ZoneInfo("Asia/Manila")


def _format_datetime_ph(dt_value):
    if not dt_value:
        return "indefinitely"

    effective_dt = dt_value
    if timezone.is_naive(effective_dt):
        effective_dt = timezone.make_aware(effective_dt, timezone.get_current_timezone())

    return timezone.localtime(effective_dt, PH_TIMEZONE).strftime("%Y-%m-%d %I:%M %p PHT")


def _revoke_account_sessions(account: Accounts) -> int:
    """Invalidate auth for account by revoking tokens and deleting sessions."""
    account.auth_revoked_at = timezone.now()
    account.save(update_fields=["auth_revoked_at"])

    deleted_sessions = 0
    for session in Session.objects.all().iterator():
        try:
            session_data = session.get_decoded()
        except Exception:
            continue

        if str(session_data.get("_auth_user_id")) == str(account.accountID):
            session.delete()
            deleted_sessions += 1

    return deleted_sessions


def suspend_account(
    account_id: str,
    reason: str,
    admin_user,
    request=None,
    suspended_until=None,
):
    """Suspend an account (temporary restriction)."""
    try:
        account = Accounts.objects.get(accountID=account_id)
        
        # Store before state for audit
        before_state = {
            "is_active": account.is_active,
            "is_suspended": getattr(account, 'is_suspended', False),
        }
        
        # Suspend for 30 days by default (fallback)
        effective_suspended_until = suspended_until or (timezone.now() + timedelta(days=30))
        account.is_suspended = True
        account.suspended_until = effective_suspended_until
        account.suspended_reason = reason
        account.is_active = False  # Also mark as inactive
        account.save()

        revoked_sessions = _revoke_account_sessions(account)
        
        # Create notification for user
        try:
            suspended_date = _format_datetime_ph(account.suspended_until)
            Notification.objects.create(
                accountFK=account,
                message=f"Your account has been suspended. Reason: {reason}. Suspended until: {suspended_date}",
                status='UNREAD'
            )
        except Exception:
            pass
        
        # Log audit trail
        log_action(
            admin=admin_user,
            action="user_suspend",
            entity_type="user",
            entity_id=str(account_id),
            details={
                "email": account.email,
                "action": "suspended",
                "reason": reason,
                "suspended_until": account.suspended_until.isoformat() if account.suspended_until else None,
                "sessions_revoked": revoked_sessions,
            },
            before_value=before_state,
            after_value={
                "is_active": False,
                "is_suspended": True,
                "reason": reason,
                "suspended_until": account.suspended_until.isoformat() if account.suspended_until else None,
            },
            request=request
        )
        
        print(f"✅ Account {account_id} suspended by admin {admin_user.accountID}")
        return {'success': True, 'message': 'Account suspended successfully'}
        
    except Accounts.DoesNotExist:
        return {'success': False, 'error': 'Account not found'}
    except Exception as e:
        print(f"❌ Error suspending account: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def ban_account(account_id: str, reason: str, admin_user, request=None):
    """Ban an account permanently."""
    try:
        account = Accounts.objects.get(accountID=account_id)
        
        # Store before state for audit
        before_state = {
            "is_active": account.is_active,
            "is_banned": getattr(account, 'is_banned', False),
        }
        
        account.is_banned = True
        account.banned_at = timezone.now()
        account.banned_reason = reason
        account.banned_by = admin_user
        account.is_active = False  # Mark as inactive
        account.is_suspended = False  # Clear suspension if any
        account.save()

        revoked_sessions = _revoke_account_sessions(account)
        
        # Create notification for user
        try:
            Notification.objects.create(
                accountFK=account,
                message=f"Your account has been permanently banned. Reason: {reason}",
                status='UNREAD'
            )
        except:
            pass
        
        # Log audit trail
        log_action(
            admin=admin_user,
            action="user_ban",
            entity_type="user",
            entity_id=str(account_id),
            details={
                "email": account.email,
                "action": "banned",
                "reason": reason,
                "sessions_revoked": revoked_sessions,
            },
            before_value=before_state,
            after_value={"is_active": False, "is_banned": True, "reason": reason},
            request=request
        )
        
        print(f"✅ Account {account_id} banned by admin {admin_user.accountID}")
        return {'success': True, 'message': 'Account banned successfully'}
        
    except Accounts.DoesNotExist:
        return {'success': False, 'error': 'Account not found'}
    except Exception as e:
        print(f"❌ Error banning account: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def activate_account(account_id: str, admin_user, request=None):
    """Activate/reactivate an account (remove suspension or ban)."""
    try:
        account = Accounts.objects.get(accountID=account_id)
        
        # Store before state for audit
        before_state = {
            "is_active": account.is_active,
            "is_suspended": getattr(account, 'is_suspended', False),
            "is_banned": getattr(account, 'is_banned', False),
        }
        
        # Clear all restrictions
        account.is_active = True
        account.is_suspended = False
        account.suspended_until = None
        account.suspended_reason = None
        account.is_banned = False
        account.banned_at = None
        account.banned_reason = None
        account.banned_by = None
        account.save()
        
        # Create notification for user
        try:
            Notification.objects.create(
                accountFK=account,
                message="Your account has been reactivated. You can now access all features.",
                status='UNREAD'
            )
        except:
            pass
        
        # Log audit trail
        log_action(
            admin=admin_user,
            action="user_activate",
            entity_type="user",
            entity_id=str(account_id),
            details={"email": account.email, "action": "reactivated"},
            before_value=before_state,
            after_value={"is_active": True, "is_suspended": False, "is_banned": False},
            request=request
        )
        
        print(f"✅ Account {account_id} activated by admin {admin_user.accountID}")
        return {'success': True, 'message': 'Account activated successfully'}
        
    except Accounts.DoesNotExist:
        return {'success': False, 'error': 'Account not found'}
    except Exception as e:
        print(f"❌ Error activating account: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def delete_account(account_id: str, admin_user, request=None):
    """Soft delete an account (mark as inactive, don't actually delete)."""
    try:
        account = Accounts.objects.get(accountID=account_id)
        
        # Store before state for audit
        before_state = {
            "is_active": account.is_active,
            "is_banned": getattr(account, 'is_banned', False),
            "email": account.email,
        }
        
        # Soft delete - just mark as inactive and banned
        account.is_active = False
        account.is_banned = True
        account.banned_at = timezone.now()
        account.banned_reason = "Account deleted by administrator"
        account.banned_by = admin_user
        account.save()

        revoked_sessions = _revoke_account_sessions(account)
        
        # Log audit trail
        log_action(
            admin=admin_user,
            action="user_delete",
            entity_type="user",
            entity_id=str(account_id),
            details={
                "email": account.email,
                "action": "soft-deleted",
                "sessions_revoked": revoked_sessions,
            },
            before_value=before_state,
            after_value={"is_active": False, "is_banned": True, "deleted": True},
            request=request
        )
        
        print(f"✅ Account {account_id} soft-deleted by admin {admin_user.accountID}")
        return {'success': True, 'message': 'Account deleted successfully'}
        
    except Accounts.DoesNotExist:
        return {'success': False, 'error': 'Account not found'}
    except Exception as e:
        print(f"❌ Error deleting account: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def get_account_status(account_id: str):
    """Get detailed account status information."""
    try:
        account = Accounts.objects.get(accountID=account_id)
        
        status_info = {
            'account_id': str(account.accountID),
            'email': account.email,
            'is_active': account.is_active,
            'is_verified': account.isVerified,
            'is_suspended': getattr(account, 'is_suspended', False),
            'suspended_until': account.suspended_until.isoformat() if hasattr(account, 'suspended_until') and account.suspended_until else None,
            'suspended_reason': getattr(account, 'suspended_reason', None),
            'is_banned': getattr(account, 'is_banned', False),
            'banned_at': account.banned_at.isoformat() if hasattr(account, 'banned_at') and account.banned_at else None,
            'banned_reason': getattr(account, 'banned_reason', None),
            'banned_by': str(account.banned_by.accountID) if hasattr(account, 'banned_by') and account.banned_by else None,
        }
        
        return {'success': True, 'status': status_info}
        
    except Accounts.DoesNotExist:
        return {'success': False, 'error': 'Account not found'}
    except Exception as e:
        print(f"❌ Error getting account status: {str(e)}")
        raise
