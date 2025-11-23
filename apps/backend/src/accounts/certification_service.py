# certification_service.py
# Worker Phase 1 - Part 2: Certification Management Service

from .models import WorkerProfile, WorkerCertification, Notification, Accounts
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.utils import timezone
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional
from iayos_project.utils import upload_file


def add_certification(
    worker_profile: WorkerProfile,
    name: str,
    organization: Optional[str] = None,
    issue_date: Optional[str] = None,
    expiry_date: Optional[str] = None,
    certificate_file = None
) -> Dict:
    """
    Add a new certification for a worker.
    
    Args:
        worker_profile: WorkerProfile instance
        name: Certificate name (required)
        organization: Issuing organization
        issue_date: Date issued (YYYY-MM-DD format)
        expiry_date: Expiration date (YYYY-MM-DD format)
        certificate_file: Uploaded file (optional)
    
    Returns:
        dict: Created certification data
    
    Raises:
        ValueError: If validation fails
    """
    # Validate required fields
    if not name or len(name.strip()) == 0:
        raise ValueError("Certificate name is required")
    
    # Parse dates
    parsed_issue_date = None
    parsed_expiry_date = None
    
    if issue_date:
        try:
            parsed_issue_date = datetime.strptime(issue_date, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError("Invalid issue date format. Use YYYY-MM-DD")
    
    if expiry_date:
        try:
            parsed_expiry_date = datetime.strptime(expiry_date, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError("Invalid expiry date format. Use YYYY-MM-DD")
    
    # Validate dates
    if parsed_issue_date and parsed_expiry_date:
        if parsed_expiry_date < parsed_issue_date:
            raise ValueError("Expiry date cannot be before issue date")
    
    # Upload certificate file if provided
    certificate_url = ""
    if certificate_file:
        try:
            worker_id = worker_profile.profileID.profileID
            file_name = f"cert_{name.replace(' ', '_')}_{int(datetime.now().timestamp())}"
            certificate_url = upload_worker_certificate(certificate_file, file_name, worker_id)
            
            if not certificate_url:
                raise ValueError("Failed to upload certificate file")
        except Exception as e:
            raise ValueError(f"Certificate upload failed: {str(e)}")
    
    # Create certification
    certification = WorkerCertification.objects.create(
        workerID=worker_profile,
        name=name.strip(),
        issuing_organization=organization.strip() if organization else "",
        issue_date=parsed_issue_date,
        expiry_date=parsed_expiry_date,
        certificate_url=certificate_url
    )
    
    # Update profile completion
    worker_profile.update_profile_completion()
    
    # Create notification
    try:
        Notification.objects.create(
            accountFK=worker_profile.profileID.accountFK,
            notificationType='SYSTEM',
            title='Certification Added',
            message=f'Successfully added certification: {name}',
            isRead=False
        )
    except Exception as e:
        print(f"Warning: Failed to create notification: {e}")
    
    return _format_certification(certification)


def get_certifications(worker_profile: WorkerProfile) -> List[Dict]:
    """
    Get all certifications for a worker with expiry status.
    
    Args:
        worker_profile: WorkerProfile instance
    
    Returns:
        List[dict]: Certifications with is_expired and days_until_expiry
    """
    certifications = WorkerCertification.objects.filter(
        workerID=worker_profile
    ).order_by('-issue_date', '-createdAt')
    
    return [_format_certification(cert) for cert in certifications]


def get_expiring_certifications(worker_profile: WorkerProfile, days: int = 30) -> List[Dict]:
    """
    Get certifications expiring within N days.
    
    Args:
        worker_profile: WorkerProfile instance
        days: Number of days to look ahead (default 30)
    
    Returns:
        List[dict]: Expiring certifications
    """
    today = timezone.now().date()
    expiry_threshold = today + timedelta(days=days)
    
    certifications = WorkerCertification.objects.filter(
        workerID=worker_profile,
        expiry_date__isnull=False,
        expiry_date__gte=today,
        expiry_date__lte=expiry_threshold
    ).order_by('expiry_date')
    
    return [_format_certification(cert) for cert in certifications]


def update_certification(
    worker_profile: WorkerProfile,
    certification_id: int,
    name: Optional[str] = None,
    organization: Optional[str] = None,
    issue_date: Optional[str] = None,
    expiry_date: Optional[str] = None
) -> Dict:
    """
    Update certification fields.
    
    Args:
        worker_profile: WorkerProfile instance
        certification_id: Certification ID
        name: Optional new certificate name
        organization: Optional new organization
        issue_date: Optional new issue date (YYYY-MM-DD)
        expiry_date: Optional new expiry date (YYYY-MM-DD)
    
    Returns:
        dict: Updated certification data
    
    Raises:
        ValueError: If validation fails
        ObjectDoesNotExist: If certification not found
    """
    # Get certification and verify ownership
    try:
        certification = WorkerCertification.objects.get(
            certificationID=certification_id,
            workerID=worker_profile
        )
    except WorkerCertification.DoesNotExist:
        raise ObjectDoesNotExist("Certification not found or you don't have permission to edit it")
    
    # Update fields if provided
    if name is not None:
        if len(name.strip()) == 0:
            raise ValueError("Certificate name cannot be empty")
        certification.name = name.strip()
    
    if organization is not None:
        certification.issuing_organization = organization.strip()
    
    if issue_date is not None:
        try:
            certification.issue_date = datetime.strptime(issue_date, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError("Invalid issue date format. Use YYYY-MM-DD")
    
    if expiry_date is not None:
        try:
            certification.expiry_date = datetime.strptime(expiry_date, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError("Invalid expiry date format. Use YYYY-MM-DD")
    
    # Validate dates
    if certification.issue_date and certification.expiry_date:
        if certification.expiry_date < certification.issue_date:
            raise ValueError("Expiry date cannot be before issue date")
    
    certification.save()
    
    return _format_certification(certification)


def delete_certification(worker_profile: WorkerProfile, certification_id: int) -> Dict:
    """
    Delete a certification and its associated file.
    
    Args:
        worker_profile: WorkerProfile instance
        certification_id: Certification ID
    
    Returns:
        dict: {'success': bool, 'message': str}
    
    Raises:
        ObjectDoesNotExist: If certification not found
    """
    # Get certification and verify ownership
    try:
        certification = WorkerCertification.objects.get(
            certificationID=certification_id,
            workerID=worker_profile
        )
    except WorkerCertification.DoesNotExist:
        raise ObjectDoesNotExist("Certification not found or you don't have permission to delete it")
    
    cert_name = certification.name
    
    # TODO: Delete file from Supabase if certificate_url exists
    # This would require implementing a delete_from_supabase() function
    
    # Delete certification
    certification.delete()
    
    # Update profile completion
    worker_profile.update_profile_completion()
    
    # Create notification
    try:
        Notification.objects.create(
            accountFK=worker_profile.profileID.accountFK,
            notificationType='SYSTEM',
            title='Certification Removed',
            message=f'Certification "{cert_name}" has been removed from your profile',
            isRead=False
        )
    except Exception as e:
        print(f"Warning: Failed to create notification: {e}")
    
    return {
        'success': True,
        'message': f'Certification "{cert_name}" deleted successfully'
    }


def verify_certification(admin_account: Accounts, certification_id: int) -> Dict:
    """
    Admin function to verify a certification.
    
    Args:
        admin_account: Admin Accounts instance
        certification_id: Certification ID
    
    Returns:
        dict: Updated certification data
    
    Raises:
        ObjectDoesNotExist: If certification not found
    """
    try:
        certification = WorkerCertification.objects.get(certificationID=certification_id)
    except WorkerCertification.DoesNotExist:
        raise ObjectDoesNotExist("Certification not found")
    
    certification.is_verified = True
    certification.verified_at = timezone.now()
    certification.verified_by = admin_account
    certification.save()
    
    # Notify worker
    try:
        Notification.objects.create(
            accountFK=certification.workerID.profileID.accountFK,
            notificationType='SYSTEM',
            title='Certification Verified',
            message=f'Your certification "{certification.name}" has been verified by an administrator',
            isRead=False
        )
    except Exception as e:
        print(f"Warning: Failed to create notification: {e}")
    
    return _format_certification(certification)


def _format_certification(certification: WorkerCertification) -> Dict:
    """
    Format certification data for API response.
    
    Args:
        certification: WorkerCertification instance
    
    Returns:
        dict: Formatted certification data
    """
    is_expired = certification.is_expired()
    days_until_expiry = None
    
    if certification.expiry_date and not is_expired:
        today = timezone.now().date()
        days_until_expiry = (certification.expiry_date - today).days
    
    return {
        'certificationID': certification.certificationID,
        'name': certification.name,
        'issuing_organization': certification.issuing_organization,
        'issue_date': certification.issue_date.isoformat() if certification.issue_date else None,
        'expiry_date': certification.expiry_date.isoformat() if certification.expiry_date else None,
        'certificate_url': certification.certificate_url if certification.certificate_url else None,
        'is_verified': certification.is_verified,
        'is_expired': is_expired,
        'days_until_expiry': days_until_expiry,
        'verified_at': certification.verified_at.isoformat() if certification.verified_at else None,
        'createdAt': certification.createdAt.isoformat(),
        'updatedAt': certification.updatedAt.isoformat()
    }


def upload_worker_certificate(file, file_name: str, worker_id: int) -> str:
    """
    Upload worker certificate to Supabase storage.
    
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
        path=f"worker_{worker_id}/certificates/",
        public=True,
        custom_name=file_name
    )
