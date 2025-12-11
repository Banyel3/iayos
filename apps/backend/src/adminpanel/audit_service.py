"""
Audit Service for Admin Panel
============================

Provides comprehensive audit logging for all admin actions.
Tracks who did what, when, and the before/after states.

Functions:
- log_action(): Create an audit log entry
- get_audit_logs(): Retrieve audit logs with filtering and pagination
- get_audit_log_detail(): Get details of a specific audit log
- export_audit_logs(): Export audit logs to CSV format
- get_admin_activity(): Get activity summary for a specific admin
"""

from datetime import datetime, timedelta
from typing import Optional, Any
from django.db.models import Q, Count
from django.utils import timezone
from adminpanel.models import AuditLog, AdminAccount
from accounts.models import Accounts
import csv
from io import StringIO


def get_client_ip(request) -> Optional[str]:
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def get_user_agent(request) -> str:
    """Extract user agent from request."""
    return request.META.get('HTTP_USER_AGENT', '')


def log_action(
    admin: Accounts,
    action: str,
    entity_type: str,
    entity_id: str = "",
    details: dict = None,
    before_value: dict = None,
    after_value: dict = None,
    request = None
) -> AuditLog:
    """
    Create an audit log entry.
    
    Args:
        admin: The admin account performing the action
        action: Type of action (from AuditLog.ActionType)
        entity_type: Type of entity affected (from AuditLog.EntityType)
        entity_id: ID of the affected entity
        details: Additional details about the action
        before_value: State before the change
        after_value: State after the change
        request: HTTP request object (for IP and user agent)
    
    Returns:
        Created AuditLog instance
    """
    ip_address = None
    user_agent = ""
    
    if request:
        ip_address = get_client_ip(request)
        user_agent = get_user_agent(request)
    
    log_entry = AuditLog.objects.create(
        adminFK=admin,
        adminEmail=admin.email,
        action=action,
        entityType=entity_type,
        entityID=str(entity_id) if entity_id else "",
        details=details or {},
        beforeValue=before_value,
        afterValue=after_value,
        ipAddress=ip_address,
        userAgent=user_agent
    )
    
    return log_entry


def get_audit_logs(
    page: int = 1,
    limit: int = 100,
    admin_id: Optional[str] = None,
    action_type: Optional[str] = None,
    entity_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None
) -> dict:
    """
    Retrieve audit logs with filtering and pagination.
    
    Args:
        page: Page number (1-indexed)
        limit: Number of records per page
        admin_id: Filter by admin account ID
        action_type: Filter by action type
        entity_type: Filter by entity type
        date_from: Filter from date (YYYY-MM-DD)
        date_to: Filter to date (YYYY-MM-DD)
        search: Search in details
    
    Returns:
        Dictionary with logs, pagination info
    """
    queryset = AuditLog.objects.select_related('adminFK').all()
    
    # Apply filters
    if admin_id and admin_id != "all":
        queryset = queryset.filter(adminFK_id=admin_id)
    
    if action_type and action_type != "all":
        queryset = queryset.filter(action=action_type)
    
    if entity_type and entity_type != "all":
        queryset = queryset.filter(entityType=entity_type)
    
    if date_from:
        try:
            from_date = datetime.strptime(date_from, "%Y-%m-%d")
            queryset = queryset.filter(createdAt__gte=from_date)
        except ValueError:
            pass
    
    if date_to:
        try:
            to_date = datetime.strptime(date_to, "%Y-%m-%d")
            # Add one day to include the entire day
            to_date = to_date + timedelta(days=1)
            queryset = queryset.filter(createdAt__lt=to_date)
        except ValueError:
            pass
    
    if search:
        search_lower = search.lower()
        queryset = queryset.filter(
            Q(details__icontains=search) |
            Q(adminEmail__icontains=search) |
            Q(entityID__icontains=search)
        )
    
    # Get total count
    total = queryset.count()
    
    # Calculate pagination
    total_pages = max(1, (total + limit - 1) // limit)
    offset = (page - 1) * limit
    
    # Get paginated results
    logs = queryset[offset:offset + limit]
    
    # Format logs for response
    formatted_logs = []
    for log in logs:
        formatted_logs.append({
            "id": str(log.auditLogID),
            "admin_id": str(log.adminFK_id) if log.adminFK_id else None,
            "admin_email": log.adminEmail,
            "action": log.action,
            "entity_type": log.entityType,
            "entity_id": log.entityID,
            "details": log.details,
            "before_value": log.beforeValue,
            "after_value": log.afterValue,
            "ip_address": log.ipAddress,
            "user_agent": log.userAgent,
            "timestamp": log.createdAt.isoformat(),
        })
    
    return {
        "success": True,
        "logs": formatted_logs,
        "total": total,
        "page": page,
        "total_pages": total_pages
    }


def get_audit_log_detail(log_id: int) -> dict:
    """
    Get details of a specific audit log entry.
    
    Args:
        log_id: ID of the audit log entry
    
    Returns:
        Dictionary with log details or error
    """
    try:
        log = AuditLog.objects.select_related('adminFK').get(auditLogID=log_id)
        
        return {
            "success": True,
            "log": {
                "id": str(log.auditLogID),
                "admin_id": str(log.adminFK_id) if log.adminFK_id else None,
                "admin_email": log.adminEmail,
                "action": log.action,
                "action_display": log.get_action_display(),
                "entity_type": log.entityType,
                "entity_type_display": log.get_entityType_display(),
                "entity_id": log.entityID,
                "details": log.details,
                "before_value": log.beforeValue,
                "after_value": log.afterValue,
                "ip_address": log.ipAddress,
                "user_agent": log.userAgent,
                "timestamp": log.createdAt.isoformat(),
            }
        }
    except AuditLog.DoesNotExist:
        return {"success": False, "error": "Audit log not found"}


def export_audit_logs(
    admin_id: Optional[str] = None,
    action_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> str:
    """
    Export audit logs to CSV format.
    
    Args:
        admin_id: Filter by admin account ID
        action_type: Filter by action type
        date_from: Filter from date (YYYY-MM-DD)
        date_to: Filter to date (YYYY-MM-DD)
    
    Returns:
        CSV string
    """
    queryset = AuditLog.objects.select_related('adminFK').all()
    
    # Apply filters
    if admin_id and admin_id != "all":
        queryset = queryset.filter(adminFK_id=admin_id)
    
    if action_type and action_type != "all":
        queryset = queryset.filter(action=action_type)
    
    if date_from:
        try:
            from_date = datetime.strptime(date_from, "%Y-%m-%d")
            queryset = queryset.filter(createdAt__gte=from_date)
        except ValueError:
            pass
    
    if date_to:
        try:
            to_date = datetime.strptime(date_to, "%Y-%m-%d")
            to_date = to_date + timedelta(days=1)
            queryset = queryset.filter(createdAt__lt=to_date)
        except ValueError:
            pass
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "ID", "Timestamp", "Admin Email", "Action", "Entity Type",
        "Entity ID", "IP Address", "Details"
    ])
    
    # Write rows
    for log in queryset[:10000]:  # Limit to 10k rows
        writer.writerow([
            log.auditLogID,
            log.createdAt.strftime("%Y-%m-%d %H:%M:%S"),
            log.adminEmail,
            log.get_action_display(),
            log.get_entityType_display(),
            log.entityID,
            log.ipAddress or "",
            str(log.details)
        ])
    
    return output.getvalue()


def get_admin_activity(admin_id: int, days: int = 30) -> dict:
    """
    Get activity summary for a specific admin.
    
    Args:
        admin_id: ID of the admin account
        days: Number of days to look back
    
    Returns:
        Dictionary with activity summary
    """
    cutoff_date = timezone.now() - timedelta(days=days)
    
    logs = AuditLog.objects.filter(
        adminFK_id=admin_id,
        createdAt__gte=cutoff_date
    )
    
    # Count by action type
    action_counts = logs.values('action').annotate(
        count=Count('action')
    ).order_by('-count')
    
    # Get recent activities
    recent_logs = logs.order_by('-createdAt')[:10]
    
    return {
        "success": True,
        "admin_id": admin_id,
        "period_days": days,
        "total_actions": logs.count(),
        "action_breakdown": [
            {"action": item['action'], "count": item['count']}
            for item in action_counts
        ],
        "recent_activities": [
            {
                "id": str(log.auditLogID),
                "action": log.action,
                "entity_type": log.entityType,
                "entity_id": log.entityID,
                "timestamp": log.createdAt.isoformat()
            }
            for log in recent_logs
        ]
    }


def get_audit_statistics() -> dict:
    """
    Get overall audit log statistics.
    
    Returns:
        Dictionary with statistics
    """
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    # Total counts
    total_logs = AuditLog.objects.count()
    today_logs = AuditLog.objects.filter(createdAt__gte=today_start).count()
    week_logs = AuditLog.objects.filter(createdAt__gte=week_start).count()
    month_logs = AuditLog.objects.filter(createdAt__gte=month_start).count()
    
    # Most active admins
    top_admins = AuditLog.objects.filter(
        createdAt__gte=month_start
    ).values('adminEmail').annotate(
        count=Count('auditLogID')
    ).order_by('-count')[:5]
    
    # Most common actions
    top_actions = AuditLog.objects.filter(
        createdAt__gte=month_start
    ).values('action').annotate(
        count=Count('auditLogID')
    ).order_by('-count')[:10]
    
    return {
        "success": True,
        "total_logs": total_logs,
        "today_logs": today_logs,
        "week_logs": week_logs,
        "month_logs": month_logs,
        "top_admins": [
            {"email": item['adminEmail'], "count": item['count']}
            for item in top_admins
        ],
        "top_actions": [
            {"action": item['action'], "count": item['count']}
            for item in top_actions
        ]
    }
