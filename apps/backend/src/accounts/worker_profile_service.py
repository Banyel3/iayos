# worker_profile_service.py
# Worker Phase 1 - Part 2: Profile Management Service

from .models import WorkerProfile, workerSpecialization, Notification
from django.core.exceptions import ValidationError
from django.utils import timezone
from typing import Dict, List, Optional
from decimal import Decimal


def update_worker_profile(
    worker_profile: WorkerProfile,
    bio: Optional[str] = None,
    description: Optional[str] = None,
    hourly_rate: Optional[float] = None
) -> Dict:
    """
    Update worker profile fields and recalculate completion percentage.
    
    Args:
        worker_profile: WorkerProfile instance
        bio: Optional bio text (max 200 chars)
        description: Optional description (max 350 chars)
        hourly_rate: Optional hourly rate (must be > 0)
    
    Returns:
        dict: {
            'success': bool,
            'message': str,
            'profile_completion_percentage': int,
            'bio': str,
            'description': str,
            'hourly_rate': Decimal or None
        }
    
    Raises:
        ValueError: If validation fails
    """
    # Validate inputs
    if bio is not None:
        if len(bio) > 200:
            raise ValueError("Bio must be 200 characters or less")
        worker_profile.bio = bio.strip()
    
    if description is not None:
        if len(description) > 350:
            raise ValueError("Description must be 350 characters or less")
        worker_profile.description = description.strip()
    
    if hourly_rate is not None:
        if hourly_rate <= 0:
            raise ValueError("Hourly rate must be greater than 0")
        worker_profile.hourly_rate = Decimal(str(hourly_rate))
    
    # Save changes
    worker_profile.save()
    
    # Update profile completion percentage
    completion_percentage = worker_profile.update_profile_completion()
    
    # Create notification
    try:
        Notification.objects.create(
            accountFK=worker_profile.profileID.accountFK,
            notificationType='SYSTEM',
            title='Profile Updated',
            message=f'Your profile has been updated. Profile completion: {completion_percentage}%',
            isRead=False
        )
    except Exception as e:
        # Don't fail the whole operation if notification fails
        print(f"Warning: Failed to create notification: {e}")
    
    return {
        'success': True,
        'message': 'Profile updated successfully',
        'profile_completion_percentage': completion_percentage,
        'bio': worker_profile.bio,
        'description': worker_profile.description,
        'hourly_rate': float(worker_profile.hourly_rate) if worker_profile.hourly_rate else None
    }


def get_worker_profile_completion(worker_profile: WorkerProfile) -> Dict:
    """
    Get detailed profile completion information.
    
    Args:
        worker_profile: WorkerProfile instance
    
    Returns:
        dict: {
            'completion_percentage': int,
            'missing_fields': List[str],
            'recommendations': List[str],
            'completed_fields': List[str]
        }
    """
    missing_fields = []
    completed_fields = []
    
    # Check each field
    if not worker_profile.bio or len(worker_profile.bio.strip()) == 0:
        missing_fields.append('bio')
    else:
        completed_fields.append('bio')
    
    if not worker_profile.description or len(worker_profile.description.strip()) == 0:
        missing_fields.append('description')
    else:
        completed_fields.append('description')
    
    if not worker_profile.hourly_rate or worker_profile.hourly_rate <= 0:
        missing_fields.append('hourly_rate')
    else:
        completed_fields.append('hourly_rate')
    
    if not worker_profile.profileID.profileImg:
        missing_fields.append('profile_image')
    else:
        completed_fields.append('profile_image')
    
    if not workerSpecialization.objects.filter(workerID=worker_profile).exists():
        missing_fields.append('specializations')
    else:
        completed_fields.append('specializations')
    
    if not hasattr(worker_profile, 'certifications') or not worker_profile.certifications.exists():
        missing_fields.append('certifications')
    else:
        completed_fields.append('certifications')
    
    if not hasattr(worker_profile, 'portfolio') or not worker_profile.portfolio.exists():
        missing_fields.append('portfolio')
    else:
        completed_fields.append('portfolio')
    
    # Calculate percentage
    total_fields = len(missing_fields) + len(completed_fields)
    completion_percentage = int((len(completed_fields) / total_fields) * 100) if total_fields > 0 else 0
    
    # Generate recommendations
    recommendations = get_profile_completion_recommendations(missing_fields)
    
    return {
        'completion_percentage': completion_percentage,
        'missing_fields': missing_fields,
        'recommendations': recommendations,
        'completed_fields': completed_fields
    }


def get_profile_completion_recommendations(missing_fields: List[str]) -> List[str]:
    """
    Generate user-friendly recommendations for missing fields.
    
    Args:
        missing_fields: List of missing field names
    
    Returns:
        List of recommendation strings
    """
    recommendations_map = {
        'bio': 'Add a short bio to introduce yourself to clients',
        'description': 'Write a detailed description of your skills and experience',
        'hourly_rate': 'Set your hourly rate to help clients understand your pricing',
        'profile_image': 'Upload a professional profile photo',
        'specializations': 'Add your specializations to show your expertise',
        'certifications': 'Upload professional certifications to build trust',
        'portfolio': 'Upload work samples to showcase your quality'
    }
    
    recommendations = []
    for field in missing_fields:
        if field in recommendations_map:
            recommendations.append(recommendations_map[field])
    
    return recommendations


def validate_profile_fields(bio: Optional[str] = None, description: Optional[str] = None, 
                           hourly_rate: Optional[float] = None) -> Dict:
    """
    Validate profile fields without saving.
    
    Returns:
        dict: {'valid': bool, 'errors': Dict[str, str]}
    """
    errors = {}
    
    if bio is not None:
        if len(bio) > 200:
            errors['bio'] = 'Bio must be 200 characters or less'
    
    if description is not None:
        if len(description) > 350:
            errors['description'] = 'Description must be 350 characters or less'
    
    if hourly_rate is not None:
        if hourly_rate <= 0:
            errors['hourly_rate'] = 'Hourly rate must be greater than 0'
        if hourly_rate > 999999:
            errors['hourly_rate'] = 'Hourly rate is too high'
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }
