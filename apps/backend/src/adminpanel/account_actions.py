"""
Admin Panel Account Management Actions
Handles suspend, ban, activate, and delete operations for user accounts.
"""

from django.utils import timezone
from datetime import timedelta
from accounts.models import Accounts, Notification


def suspend_account(account_id: str, reason: str, admin_user):
    """Suspend an account (temporary restriction)."""
    try:
        account = Accounts.objects.get(accountID=account_id)
        
        # Suspend for 30 days by default
        account.is_suspended = True
        account.suspended_until = timezone.now() + timedelta(days=30)
        account.suspended_reason = reason
        account.is_active = False  # Also mark as inactive
        account.save()
        
        # Create notification for user
        try:
            suspended_date = 'indefinitely'
            if account.suspended_until is not None:
                suspended_date = account.suspended_until.strftime('%Y-%m-%d')
            Notification.objects.create(
                accountFK=account,
                message=f"Your account has been suspended. Reason: {reason}. Suspended until: {suspended_date}",
                status='UNREAD'
            )
        except Exception:
            pass
        
        print(f"✅ Account {account_id} suspended by admin {admin_user.accountID}")
        return {'success': True, 'message': 'Account suspended successfully'}
        
    except Accounts.DoesNotExist:
        return {'success': False, 'error': 'Account not found'}
    except Exception as e:
        print(f"❌ Error suspending account: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def ban_account(account_id: str, reason: str, admin_user):
    """Ban an account permanently."""
    try:
        account = Accounts.objects.get(accountID=account_id)
        
        account.is_banned = True
        account.banned_at = timezone.now()
        account.banned_reason = reason
        account.banned_by = admin_user
        account.is_active = False  # Mark as inactive
        account.is_suspended = False  # Clear suspension if any
        account.save()
        
        # Create notification for user
        try:
            Notification.objects.create(
                accountFK=account,
                message=f"Your account has been permanently banned. Reason: {reason}",
                status='UNREAD'
            )
        except:
            pass
        
        print(f"✅ Account {account_id} banned by admin {admin_user.accountID}")
        return {'success': True, 'message': 'Account banned successfully'}
        
    except Accounts.DoesNotExist:
        return {'success': False, 'error': 'Account not found'}
    except Exception as e:
        print(f"❌ Error banning account: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def activate_account(account_id: str, admin_user):
    """Activate/reactivate an account (remove suspension or ban)."""
    try:
        account = Accounts.objects.get(accountID=account_id)
        
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
        
        print(f"✅ Account {account_id} activated by admin {admin_user.accountID}")
        return {'success': True, 'message': 'Account activated successfully'}
        
    except Accounts.DoesNotExist:
        return {'success': False, 'error': 'Account not found'}
    except Exception as e:
        print(f"❌ Error activating account: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


def delete_account(account_id: str, admin_user):
    """Soft delete an account (mark as inactive, don't actually delete)."""
    try:
        account = Accounts.objects.get(accountID=account_id)
        
        # Soft delete - just mark as inactive and banned
        account.is_active = False
        account.is_banned = True
        account.banned_at = timezone.now()
        account.banned_reason = "Account deleted by administrator"
        account.banned_by = admin_user
        account.save()
        
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
