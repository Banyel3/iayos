# portfolio_service.py
# Worker Phase 1 - Part 2: Portfolio Management Service

from .models import WorkerProfile, WorkerPortfolio, Notification
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.utils import timezone
from django.db import transaction
from datetime import datetime
from typing import Dict, List, Optional
from iayos_project.utils import upload_file


# File validation constants
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']


def upload_portfolio_image(
    worker_profile: WorkerProfile,
    image_file,
    caption: Optional[str] = None
) -> Dict:
    """
    Upload a portfolio image for a worker.
    
    Validates file size (5MB max) and format (JPEG/PNG).
    
    Args:
        worker_profile: WorkerProfile instance
        image_file: Uploaded image file
        caption: Optional caption (max 500 chars)
    
    Returns:
        dict: Created portfolio item data
    
    Raises:
        ValueError: If file validation fails
    """
    # Validate image file
    validation_result = validate_image_file(image_file)
    if not validation_result['valid']:
        raise ValueError(validation_result['error'])
    
    # Validate caption
    if caption and len(caption) > 500:
        raise ValueError("Caption must be 500 characters or less")
    
    # Upload image to Supabase
    try:
        worker_id = worker_profile.profileID.profileID
        file_name = f"portfolio_{int(datetime.now().timestamp())}"
        image_url = upload_worker_portfolio(image_file, file_name, worker_id)
        
        if not image_url:
            raise ValueError("Failed to upload portfolio image")
    except Exception as e:
        raise ValueError(f"Portfolio upload failed: {str(e)}")
    
    # Get next display order
    max_order = WorkerPortfolio.objects.filter(
        workerID=worker_profile
    ).aggregate(max_order=Max('display_order'))['max_order']
    
    next_order = (max_order + 1) if max_order is not None else 0
    
    # Create portfolio item
    portfolio_item = WorkerPortfolio.objects.create(
        workerID=worker_profile,
        image_url=image_url,
        caption=caption.strip() if caption else "",
        display_order=next_order,
        file_name=getattr(image_file, 'name', 'unknown'),
        file_size=getattr(image_file, 'size', None)
    )
    
    # Update profile completion
    worker_profile.update_profile_completion()
    
    # Create notification
    try:
        Notification.objects.create(
            accountFK=worker_profile.profileID.accountFK,
            notificationType='SYSTEM',
            title='Portfolio Image Added',
            message='Successfully added a new image to your portfolio',
            isRead=False
        )
    except Exception as e:
        print(f"Warning: Failed to create notification: {e}")
    
    return _format_portfolio_item(portfolio_item)


def get_portfolio(worker_profile: WorkerProfile) -> List[Dict]:
    """
    Get all portfolio images ordered by display_order.
    
    Args:
        worker_profile: WorkerProfile instance
    
    Returns:
        List[dict]: Portfolio items with URLs and metadata
    """
    portfolio_items = WorkerPortfolio.objects.filter(
        workerID=worker_profile
    ).order_by('display_order', '-createdAt')
    
    return [_format_portfolio_item(item) for item in portfolio_items]


def update_portfolio_caption(
    worker_profile: WorkerProfile,
    portfolio_id: int,
    caption: str
) -> Dict:
    """
    Update caption for a portfolio image.
    
    Args:
        worker_profile: WorkerProfile instance
        portfolio_id: Portfolio item ID
        caption: New caption (max 500 chars)
    
    Returns:
        dict: Updated portfolio item data
    
    Raises:
        ValueError: If validation fails
        ObjectDoesNotExist: If portfolio item not found
    """
    # Validate caption
    if len(caption) > 500:
        raise ValueError("Caption must be 500 characters or less")
    
    # Get portfolio item and verify ownership
    try:
        portfolio_item = WorkerPortfolio.objects.get(
            portfolioID=portfolio_id,
            workerID=worker_profile
        )
    except WorkerPortfolio.DoesNotExist:
        raise ObjectDoesNotExist("Portfolio item not found or you don't have permission to edit it")
    
    portfolio_item.caption = caption.strip()
    portfolio_item.save()
    
    return _format_portfolio_item(portfolio_item)


def reorder_portfolio(
    worker_profile: WorkerProfile,
    portfolio_id_order: List[int]
) -> Dict:
    """
    Reorder portfolio images.
    
    Args:
        worker_profile: WorkerProfile instance
        portfolio_id_order: List of portfolio IDs in desired order
    
    Returns:
        dict: {'success': bool, 'message': str, 'reordered_count': int}
    
    Raises:
        ValueError: If validation fails
    """
    if not portfolio_id_order or len(portfolio_id_order) == 0:
        raise ValueError("Portfolio ID order list cannot be empty")
    
    # Verify all portfolio items belong to worker
    portfolio_items = WorkerPortfolio.objects.filter(
        portfolioID__in=portfolio_id_order,
        workerID=worker_profile
    )
    
    if portfolio_items.count() != len(portfolio_id_order):
        raise ValueError("Some portfolio items not found or don't belong to you")
    
    # Update display_order for each item
    with transaction.atomic():
        for index, portfolio_id in enumerate(portfolio_id_order):
            WorkerPortfolio.objects.filter(
                portfolioID=portfolio_id,
                workerID=worker_profile
            ).update(display_order=index)
    
    return {
        'success': True,
        'message': 'Portfolio reordered successfully',
        'reordered_count': len(portfolio_id_order)
    }


def delete_portfolio_image(worker_profile: WorkerProfile, portfolio_id: int) -> Dict:
    """
    Delete a portfolio image and its associated file.
    
    Args:
        worker_profile: WorkerProfile instance
        portfolio_id: Portfolio item ID
    
    Returns:
        dict: {'success': bool, 'message': str}
    
    Raises:
        ObjectDoesNotExist: If portfolio item not found
    """
    # Get portfolio item and verify ownership
    try:
        portfolio_item = WorkerPortfolio.objects.get(
            portfolioID=portfolio_id,
            workerID=worker_profile
        )
    except WorkerPortfolio.DoesNotExist:
        raise ObjectDoesNotExist("Portfolio item not found or you don't have permission to delete it")
    
    # TODO: Delete file from Supabase if image_url exists
    # This would require implementing a delete_from_supabase() function
    
    # Delete portfolio item
    portfolio_item.delete()
    
    # Reorder remaining items to fill gaps
    remaining_items = WorkerPortfolio.objects.filter(
        workerID=worker_profile
    ).order_by('display_order')
    
    for index, item in enumerate(remaining_items):
        if item.display_order != index:
            item.display_order = index
            item.save(update_fields=['display_order'])
    
    # Update profile completion
    worker_profile.update_profile_completion()
    
    # Create notification
    try:
        Notification.objects.create(
            accountFK=worker_profile.profileID.accountFK,
            notificationType='SYSTEM',
            title='Portfolio Image Removed',
            message='Successfully removed an image from your portfolio',
            isRead=False
        )
    except Exception as e:
        print(f"Warning: Failed to create notification: {e}")
    
    return {
        'success': True,
        'message': 'Portfolio image deleted successfully'
    }


def validate_image_file(file) -> Dict:
    """
    Validate image file size and format.
    
    Args:
        file: Uploaded file object
    
    Returns:
        dict: {'valid': bool, 'error': str or None}
    """
    # Check if file exists
    if not file:
        return {'valid': False, 'error': 'No file provided'}
    
    # Check file size
    file_size = getattr(file, 'size', None)
    if file_size and file_size > MAX_FILE_SIZE:
        size_mb = file_size / (1024 * 1024)
        return {
            'valid': False,
            'error': f'File size ({size_mb:.2f}MB) exceeds maximum allowed size (5MB)'
        }
    
    # Check file type
    content_type = getattr(file, 'content_type', None)
    if content_type and content_type not in ALLOWED_IMAGE_TYPES:
        return {
            'valid': False,
            'error': f'Invalid file type. Allowed types: JPEG, PNG'
        }
    
    # Check file extension
    file_name = getattr(file, 'name', '')
    if file_name:
        extension = '.' + file_name.split('.')[-1].lower() if '.' in file_name else ''
        if extension and extension not in ALLOWED_EXTENSIONS:
            return {
                'valid': False,
                'error': f'Invalid file extension. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
            }
    
    return {'valid': True, 'error': None}


def _format_portfolio_item(portfolio_item: WorkerPortfolio) -> Dict:
    """
    Format portfolio item data for API response.
    
    Args:
        portfolio_item: WorkerPortfolio instance
    
    Returns:
        dict: Formatted portfolio item data
    """
    return {
        'portfolioID': portfolio_item.portfolioID,
        'image_url': portfolio_item.image_url,
        'caption': portfolio_item.caption,
        'display_order': portfolio_item.display_order,
        'file_name': portfolio_item.file_name,
        'file_size': portfolio_item.file_size,
        'createdAt': portfolio_item.createdAt.isoformat(),
        'updatedAt': portfolio_item.updatedAt.isoformat()
    }


def upload_worker_portfolio(file, file_name: str, worker_id: int) -> str:
    """
    Upload worker portfolio image to Supabase storage.
    
    Args:
        file: File object
        file_name: Name for the file
        worker_id: Worker profile ID
    
    Returns:
        str: Public URL of uploaded file
    """
    return upload_file(
        file,
        bucket="users",
        path=f"worker_{worker_id}/portfolio/",
        public=True,
        custom_name=file_name
    )


# Import Max aggregation
from django.db.models import Max
