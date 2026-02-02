"""
Support System Service Layer

Provides service functions for:
- Support Tickets (CRUD, assignment, status management)
- Canned Responses (CRUD, usage tracking)
- FAQs (CRUD, view tracking)
- User Reports (CRUD, review workflow)
"""

from django.db import transaction
from django.db.models import Q, Count
from django.utils import timezone
from typing import Optional, List, Dict, Any

from accounts.models import Accounts
from adminpanel.models import (
    SupportTicket,
    SupportTicketReply,
    CannedResponse,
    FAQ,
    UserReport,
)


# =============================================================================
# SUPPORT TICKETS
# =============================================================================

def get_tickets(
    page: int = 1,
    limit: int = 30,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    assigned_to: Optional[int] = None,
    search: Optional[str] = None,
    ticket_type: Optional[str] = None,
    agency_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Get paginated list of support tickets with filters.
    
    Args:
        ticket_type: Filter by 'individual' or 'agency'
        agency_id: Filter by specific agency ID
    """
    queryset = SupportTicket.objects.select_related('userFK', 'assignedTo', 'agencyFK').all()
    
    # Apply filters
    if status and status != 'all':
        queryset = queryset.filter(status=status)
    if priority and priority != 'all':
        queryset = queryset.filter(priority=priority)
    if category and category != 'all':
        queryset = queryset.filter(category=category)
    if assigned_to:
        queryset = queryset.filter(assignedTo_id=assigned_to)
    if ticket_type and ticket_type != 'all':
        queryset = queryset.filter(ticketType=ticket_type)
    if agency_id:
        queryset = queryset.filter(agencyFK_id=agency_id)
    if search:
        queryset = queryset.filter(
            Q(subject__icontains=search) |
            Q(userFK__email__icontains=search)
        )
    
    total = queryset.count()
    total_pages = (total + limit - 1) // limit
    
    offset = (page - 1) * limit
    tickets = queryset[offset:offset + limit]
    
    return {
        'success': True,
        'tickets': [
            {
                'id': str(t.ticketID),
                'user_id': str(t.userFK_id),
                'user_name': t.userFK.email.split('@')[0] if t.userFK else 'Unknown',
                'subject': t.subject,
                'category': t.category,
                'priority': t.priority,
                'status': t.status,
                'ticket_type': t.ticketType,
                'agency_id': str(t.agencyFK_id) if t.agencyFK_id else None,
                'agency_name': t.agencyFK.businessName if t.agencyFK else None,
                'assigned_to': str(t.assignedTo_id) if t.assignedTo else None,
                'assigned_to_name': t.assignedTo.email.split('@')[0] if t.assignedTo else None,
                'created_at': t.createdAt.isoformat(),
                'last_reply_at': t.lastReplyAt.isoformat() if t.lastReplyAt else t.createdAt.isoformat(),
                'reply_count': t.reply_count,
            }
            for t in tickets
        ],
        'total': total,
        'page': page,
        'total_pages': total_pages,
    }


def get_ticket_detail(ticket_id: int) -> Dict[str, Any]:
    """
    Get detailed information about a specific ticket including replies.
    """
    try:
        ticket = SupportTicket.objects.select_related('userFK', 'assignedTo').get(ticketID=ticket_id)
    except SupportTicket.DoesNotExist:
        return {'success': False, 'error': 'Ticket not found'}
    
    replies = ticket.replies.select_related('senderFK').all()
    
    # Determine if sender is admin (simple check - not the ticket creator)
    def is_admin(reply):
        return reply.senderFK_id != ticket.userFK_id
    
    return {
        'success': True,
        'ticket': {
            'id': str(ticket.ticketID),
            'user_id': str(ticket.userFK_id),
            'user_name': ticket.userFK.email.split('@')[0] if ticket.userFK else 'Unknown',
            'user_email': ticket.userFK.email if ticket.userFK else None,
            'user_profile_type': 'user',
            'subject': ticket.subject,
            'description': '',  # First reply contains the description
            'category': ticket.category,
            'priority': ticket.priority,
            'status': ticket.status,
            'assigned_to': str(ticket.assignedTo_id) if ticket.assignedTo else None,
            'assigned_to_name': ticket.assignedTo.email.split('@')[0] if ticket.assignedTo else None,
            'created_at': ticket.createdAt.isoformat(),
            'updated_at': ticket.updatedAt.isoformat(),
            'last_reply_at': ticket.lastReplyAt.isoformat() if ticket.lastReplyAt else None,
            'resolved_at': ticket.resolvedAt.isoformat() if ticket.resolvedAt else None,
            'reply_count': ticket.reply_count,
            'user_total_tickets': SupportTicket.objects.filter(userFK=ticket.userFK).count(),
            'user_open_tickets': SupportTicket.objects.filter(userFK=ticket.userFK, status='open').count(),
            'attachments': [],
            'history': [],
        },
        'messages': [
            {
                'id': str(r.replyID),
                'sender_id': str(r.senderFK_id),
                'sender_name': r.senderFK.email.split('@')[0] if r.senderFK else 'Unknown',
                'sender_email': r.senderFK.email if r.senderFK else None,
                'is_admin': is_admin(r),
                'message': r.content,
                'content': r.content,
                'is_system_message': r.isSystemMessage,
                'is_internal': False,  # We don't have this field yet
                'attachment_url': r.attachmentURL,
                'created_at': r.createdAt.isoformat(),
            }
            for r in replies
        ],
        # Keep replies for backward compatibility
        'replies': [
            {
                'id': str(r.replyID),
                'sender_id': str(r.senderFK_id),
                'sender_name': r.senderFK.email.split('@')[0] if r.senderFK else 'Unknown',
                'sender_email': r.senderFK.email if r.senderFK else None,
                'content': r.content,
                'is_system_message': r.isSystemMessage,
                'attachment_url': r.attachmentURL,
                'created_at': r.createdAt.isoformat(),
            }
            for r in replies
        ],
    }


def create_ticket(
    user: Accounts,
    subject: str,
    content: str,
    category: str = 'general',
    priority: str = 'medium',
) -> Dict[str, Any]:
    """
    Create a new support ticket.
    """
    with transaction.atomic():
        ticket = SupportTicket.objects.create(
            userFK=user,
            subject=subject,
            category=category,
            priority=priority,
        )
        
        # Create the initial message as a reply
        SupportTicketReply.objects.create(
            ticketFK=ticket,
            senderFK=user,
            content=content,
        )
        
        ticket.lastReplyAt = timezone.now()
        ticket.save()
    
    return {
        'success': True,
        'ticket_id': str(ticket.ticketID),
        'message': 'Ticket created successfully',
    }


def reply_to_ticket(
    ticket_id: int,
    sender: Accounts,
    content: str,
    attachment_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Add a reply to an existing ticket.
    """
    try:
        ticket = SupportTicket.objects.get(ticketID=ticket_id)
    except SupportTicket.DoesNotExist:
        return {'success': False, 'error': 'Ticket not found'}
    
    with transaction.atomic():
        reply = SupportTicketReply.objects.create(
            ticketFK=ticket,
            senderFK=sender,
            content=content,
            attachmentURL=attachment_url,
        )
        
        ticket.lastReplyAt = timezone.now()
        
        # If admin replies, update status to in_progress
        if sender != ticket.userFK and ticket.status == 'open':
            ticket.status = 'in_progress'
        
        ticket.save()
    
    return {
        'success': True,
        'reply_id': str(reply.replyID),
        'message': 'Reply added successfully',
    }


def update_ticket_status(
    ticket_id: int,
    status: str,
    admin: Optional[Accounts] = None,
) -> Dict[str, Any]:
    """
    Update ticket status.
    """
    try:
        ticket = SupportTicket.objects.get(ticketID=ticket_id)
    except SupportTicket.DoesNotExist:
        return {'success': False, 'error': 'Ticket not found'}
    
    valid_statuses = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed']
    if status not in valid_statuses:
        return {'success': False, 'error': f'Invalid status. Valid: {valid_statuses}'}
    
    with transaction.atomic():
        ticket.status = status
        
        if status in ['resolved', 'closed'] and not ticket.resolvedAt:
            ticket.resolvedAt = timezone.now()
        
        ticket.save()
        
        # Add system message about status change
        SupportTicketReply.objects.create(
            ticketFK=ticket,
            senderFK=admin or ticket.userFK,
            content=f"Ticket status changed to: {status}",
            isSystemMessage=True,
        )
    
    return {'success': True, 'message': f'Ticket status updated to {status}'}


def assign_ticket(
    ticket_id: int,
    admin_id: int,
) -> Dict[str, Any]:
    """
    Assign a ticket to an admin.
    """
    try:
        ticket = SupportTicket.objects.get(ticketID=ticket_id)
        admin = Accounts.objects.get(accountID=admin_id)
    except SupportTicket.DoesNotExist:
        return {'success': False, 'error': 'Ticket not found'}
    except Accounts.DoesNotExist:
        return {'success': False, 'error': 'Admin not found'}
    
    with transaction.atomic():
        ticket.assignedTo = admin
        if ticket.status == 'open':
            ticket.status = 'in_progress'
        ticket.save()
        
        # Add system message
        SupportTicketReply.objects.create(
            ticketFK=ticket,
            senderFK=admin,
            content=f"Ticket assigned to {admin.email.split('@')[0]}",
            isSystemMessage=True,
        )
    
    return {'success': True, 'message': f'Ticket assigned to {admin.email}'}


def get_ticket_stats() -> Dict[str, Any]:
    """
    Get support ticket statistics.
    """
    today = timezone.now().date()
    
    stats = SupportTicket.objects.aggregate(
        total=Count('ticketID'),
        open=Count('ticketID', filter=Q(status='open')),
        in_progress=Count('ticketID', filter=Q(status='in_progress')),
        resolved=Count('ticketID', filter=Q(status='resolved')),
        closed=Count('ticketID', filter=Q(status='closed')),
    )
    
    resolved_today = SupportTicket.objects.filter(
        resolvedAt__date=today
    ).count()
    
    return {
        'success': True,
        'stats': {
            'total': stats['total'],
            'open': stats['open'],
            'in_progress': stats['in_progress'],
            'resolved': stats['resolved'],
            'closed': stats['closed'],
            'resolved_today': resolved_today,
        }
    }


# =============================================================================
# CANNED RESPONSES
# =============================================================================

def get_canned_responses(
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get list of canned responses.
    """
    queryset = CannedResponse.objects.all()
    
    if category and category != 'all':
        queryset = queryset.filter(category=category)
    
    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) |
            Q(content__icontains=search)
        )
    
    return {
        'success': True,
        'responses': [
            {
                'id': str(r.responseID),
                'title': r.title,
                'content': r.content,
                'category': r.category,
                'usage_count': r.usageCount,
                'shortcuts': r.shortcuts or [],
            }
            for r in queryset
        ],
    }


def create_canned_response(
    title: str,
    content: str,
    category: str = 'general',
    shortcuts: Optional[List[str]] = None,
    created_by: Optional[Accounts] = None,
) -> Dict[str, Any]:
    """
    Create a new canned response.
    """
    response = CannedResponse.objects.create(
        title=title,
        content=content,
        category=category,
        shortcuts=shortcuts or [],
        createdBy=created_by,
    )
    
    return {
        'success': True,
        'response_id': str(response.responseID),
        'message': 'Canned response created successfully',
    }


def update_canned_response(
    response_id: int,
    title: Optional[str] = None,
    content: Optional[str] = None,
    category: Optional[str] = None,
    shortcuts: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Update an existing canned response.
    """
    try:
        response = CannedResponse.objects.get(responseID=response_id)
    except CannedResponse.DoesNotExist:
        return {'success': False, 'error': 'Response not found'}
    
    if title is not None:
        response.title = title
    if content is not None:
        response.content = content
    if category is not None:
        response.category = category
    if shortcuts is not None:
        response.shortcuts = shortcuts
    
    response.save()
    
    return {'success': True, 'message': 'Canned response updated successfully'}


def delete_canned_response(response_id: int) -> Dict[str, Any]:
    """
    Delete a canned response.
    """
    try:
        response = CannedResponse.objects.get(responseID=response_id)
        response.delete()
        return {'success': True, 'message': 'Canned response deleted successfully'}
    except CannedResponse.DoesNotExist:
        return {'success': False, 'error': 'Response not found'}


def increment_canned_response_usage(response_id: int) -> Dict[str, Any]:
    """
    Increment the usage count of a canned response.
    """
    try:
        response = CannedResponse.objects.get(responseID=response_id)
        response.usageCount += 1
        response.save()
        return {'success': True}
    except CannedResponse.DoesNotExist:
        return {'success': False, 'error': 'Response not found'}


# =============================================================================
# FAQs
# =============================================================================

def get_faqs(
    category: Optional[str] = None,
    published_only: bool = True,
) -> Dict[str, Any]:
    """
    Get list of FAQs.
    """
    queryset = FAQ.objects.all()
    
    if published_only:
        queryset = queryset.filter(isPublished=True)
    
    if category and category != 'all':
        queryset = queryset.filter(category=category)
    
    return {
        'success': True,
        'faqs': [
            {
                'id': str(f.faqID),
                'question': f.question,
                'answer': f.answer,
                'category': f.category,
                'sort_order': f.sortOrder,
                'order': f.sortOrder,  # Alias for frontend
                'view_count': f.viewCount,
                'views': f.viewCount,  # Alias for frontend
                'is_published': f.isPublished,
                'created_at': f.createdAt.isoformat(),
                'updated_at': f.updatedAt.isoformat(),
            }
            for f in queryset
        ],
    }


def create_faq(
    question: str,
    answer: str,
    category: str = 'general',
    sort_order: int = 0,
    is_published: bool = True,
) -> Dict[str, Any]:
    """
    Create a new FAQ.
    """
    faq = FAQ.objects.create(
        question=question,
        answer=answer,
        category=category,
        sortOrder=sort_order,
        isPublished=is_published,
    )
    
    return {
        'success': True,
        'faq_id': str(faq.faqID),
        'message': 'FAQ created successfully',
    }


def update_faq(
    faq_id: int,
    question: Optional[str] = None,
    answer: Optional[str] = None,
    category: Optional[str] = None,
    sort_order: Optional[int] = None,
    is_published: Optional[bool] = None,
) -> Dict[str, Any]:
    """
    Update an existing FAQ.
    """
    try:
        faq = FAQ.objects.get(faqID=faq_id)
    except FAQ.DoesNotExist:
        return {'success': False, 'error': 'FAQ not found'}
    
    if question is not None:
        faq.question = question
    if answer is not None:
        faq.answer = answer
    if category is not None:
        faq.category = category
    if sort_order is not None:
        faq.sortOrder = sort_order
    if is_published is not None:
        faq.isPublished = is_published
    
    faq.save()
    
    return {'success': True, 'message': 'FAQ updated successfully'}


def delete_faq(faq_id: int) -> Dict[str, Any]:
    """
    Delete an FAQ.
    """
    try:
        faq = FAQ.objects.get(faqID=faq_id)
        faq.delete()
        return {'success': True, 'message': 'FAQ deleted successfully'}
    except FAQ.DoesNotExist:
        return {'success': False, 'error': 'FAQ not found'}


def increment_faq_view(faq_id: int) -> Dict[str, Any]:
    """
    Increment the view count of an FAQ.
    """
    try:
        faq = FAQ.objects.get(faqID=faq_id)
        faq.viewCount += 1
        faq.save()
        return {'success': True}
    except FAQ.DoesNotExist:
        return {'success': False, 'error': 'FAQ not found'}


# =============================================================================
# USER REPORTS
# =============================================================================

def get_reports(
    page: int = 1,
    limit: int = 30,
    status: Optional[str] = None,
    report_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get paginated list of user reports.
    """
    queryset = UserReport.objects.select_related('reporterFK', 'reportedUserFK', 'reviewedBy').all()
    
    if status and status != 'all':
        queryset = queryset.filter(status=status)
    if report_type and report_type != 'all':
        queryset = queryset.filter(reportType=report_type)
    
    total = queryset.count()
    total_pages = (total + limit - 1) // limit
    
    offset = (page - 1) * limit
    reports = queryset[offset:offset + limit]
    
    return {
        'success': True,
        'reports': [
            {
                'id': str(r.reportID),
                'reporter_id': str(r.reporterFK_id),
                'reporter_name': r.reporterFK.email.split('@')[0] if r.reporterFK else 'Unknown',
                'reported_user_id': str(r.reportedUserFK_id) if r.reportedUserFK else None,
                'reported_user_name': r.reportedUserFK.email.split('@')[0] if r.reportedUserFK else None,
                'report_type': r.reportType,
                'reason': r.reason,
                'description': r.description[:200] + '...' if len(r.description) > 200 else r.description,
                'status': r.status,
                'action_taken': r.actionTaken,
                'created_at': r.createdAt.isoformat(),
                'reviewed_by': r.reviewedBy.email.split('@')[0] if r.reviewedBy else None,
            }
            for r in reports
        ],
        'total': total,
        'page': page,
        'total_pages': total_pages,
    }


def get_report_detail(report_id: int) -> Dict[str, Any]:
    """
    Get detailed information about a specific report.
    """
    try:
        report = UserReport.objects.select_related(
            'reporterFK', 'reportedUserFK', 'reviewedBy'
        ).get(reportID=report_id)
    except UserReport.DoesNotExist:
        return {'success': False, 'error': 'Report not found'}
    
    return {
        'success': True,
        'report': {
            'id': str(report.reportID),
            'reporter_id': str(report.reporterFK_id),
            'reporter_name': report.reporterFK.email.split('@')[0] if report.reporterFK else 'Unknown',
            'reporter_email': report.reporterFK.email if report.reporterFK else None,
            'reported_user_id': str(report.reportedUserFK_id) if report.reportedUserFK else None,
            'reported_user_name': report.reportedUserFK.email.split('@')[0] if report.reportedUserFK else None,
            'reported_user_email': report.reportedUserFK.email if report.reportedUserFK else None,
            'report_type': report.reportType,
            'reason': report.reason,
            'description': report.description,
            'related_content_id': report.relatedContentID,
            'status': report.status,
            'action_taken': report.actionTaken,
            'admin_notes': report.adminNotes,
            'created_at': report.createdAt.isoformat(),
            'updated_at': report.updatedAt.isoformat(),
            'resolved_at': report.resolvedAt.isoformat() if report.resolvedAt else None,
            'reviewed_by': report.reviewedBy.email.split('@')[0] if report.reviewedBy else None,
        },
    }


def create_report(
    reporter: Accounts,
    report_type: str,
    reason: str,
    description: str,
    reported_user_id: Optional[int] = None,
    related_content_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Create a new user report.
    """
    reported_user = None
    if reported_user_id:
        try:
            reported_user = Accounts.objects.get(accountID=reported_user_id)
        except Accounts.DoesNotExist:
            pass
    
    report = UserReport.objects.create(
        reporterFK=reporter,
        reportedUserFK=reported_user,
        reportType=report_type,
        reason=reason,
        description=description,
        relatedContentID=related_content_id,
    )
    
    return {
        'success': True,
        'report_id': str(report.reportID),
        'message': 'Report submitted successfully',
    }


def review_report(
    report_id: int,
    admin: Accounts,
    status: str,
    action_taken: str = 'none',
    admin_notes: str = '',
) -> Dict[str, Any]:
    """
    Review and take action on a report.
    """
    try:
        report = UserReport.objects.get(reportID=report_id)
    except UserReport.DoesNotExist:
        return {'success': False, 'error': 'Report not found'}
    
    valid_statuses = ['pending', 'investigating', 'resolved', 'dismissed']
    if status not in valid_statuses:
        return {'success': False, 'error': f'Invalid status. Valid: {valid_statuses}'}
    
    valid_actions = ['none', 'warning', 'suspended', 'banned', 'content_removed']
    if action_taken not in valid_actions:
        return {'success': False, 'error': f'Invalid action. Valid: {valid_actions}'}
    
    with transaction.atomic():
        report.status = status
        report.actionTaken = action_taken
        report.adminNotes = admin_notes
        report.reviewedBy = admin
        
        if status in ['resolved', 'dismissed']:
            report.resolvedAt = timezone.now()
        
        report.save()
    
    return {'success': True, 'message': 'Report reviewed successfully'}


def get_report_stats() -> Dict[str, Any]:
    """
    Get user report statistics.
    """
    stats = UserReport.objects.aggregate(
        total=Count('reportID'),
        pending=Count('reportID', filter=Q(status='pending')),
        investigating=Count('reportID', filter=Q(status='investigating')),
        resolved=Count('reportID', filter=Q(status='resolved')),
        dismissed=Count('reportID', filter=Q(status='dismissed')),
    )
    
    by_type = UserReport.objects.values('reportType').annotate(
        count=Count('reportID')
    )
    
    by_reason = UserReport.objects.values('reason').annotate(
        count=Count('reportID')
    )
    
    return {
        'success': True,
        'stats': {
            'total': stats['total'],
            'pending': stats['pending'],
            'investigating': stats['investigating'],
            'resolved': stats['resolved'],
            'dismissed': stats['dismissed'],
            'by_type': {item['reportType']: item['count'] for item in by_type},
            'by_reason': {item['reason']: item['count'] for item in by_reason},
        }
    }
