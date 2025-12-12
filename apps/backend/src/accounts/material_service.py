# material_service.py
# Worker Materials/Products Management Service

import os
import re
from decimal import Decimal
from pathlib import Path

from .models import WorkerProfile, WorkerMaterial, Specializations, workerSpecialization, Notification
from django.core.exceptions import ObjectDoesNotExist
from typing import Dict, List, Optional
from iayos_project.utils import upload_file
from datetime import datetime

DEFAULT_UNIT = "per piece"
UNIT_PATTERN = re.compile(r"^[A-Za-z0-9\s\-\(\)\/\.,%°]+$")
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_SIZE_MB = 5
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024


def _sanitize_unit(raw_unit: Optional[str]) -> str:
    """Validate and sanitize the unit field to avoid injection payloads."""
    if not raw_unit:
        return DEFAULT_UNIT

    normalized = re.sub(r"\s+", " ", raw_unit.strip())

    if len(normalized) < 2 or len(normalized) > 50:
        raise ValueError("Unit must be between 2 and 50 characters long")

    if not UNIT_PATTERN.match(normalized):
        raise ValueError(
            "Unit contains invalid characters. Use letters, numbers, spaces, or -()/.,%° only"
        )

    return normalized


def add_material(
    worker_profile: WorkerProfile,
    name: str,
    description: str,
    price: float,
    unit: str = DEFAULT_UNIT,
    quantity: float = 1.0,
    image_file=None,
    category_id: Optional[int] = None,
) -> Dict:
    """Add a new material/product for a worker.
    
    Args:
        worker_profile: WorkerProfile instance
        name: Material name (required)
        description: Material description
        price: Price in PHP (required, > 0)
        unit: Unit of measurement (default: "piece")
        quantity: Quantity available (default: 1.0)
        image_file: Optional image file
        category_id: Optional specialization/category ID to link material to
    
    Returns:
        dict: Created material data
        
    Raises:
        ValueError: If validation fails or worker doesn't have the specified skill
    """
    if not name or len(name.strip()) == 0:
        raise ValueError("Material name is required")

    if price <= 0:
        raise ValueError("Price must be greater than 0")

    if quantity is None or quantity <= 0:
        raise ValueError("Quantity must be greater than 0")

    sanitized_unit = _sanitize_unit(unit)
    price_value = Decimal(str(price))
    quantity_value = Decimal(str(quantity))

    # Validate category if provided
    category = None
    if category_id:
        try:
            category = Specializations.objects.get(specializationID=category_id)
            # Verify worker has this specialization
            has_skill = workerSpecialization.objects.filter(
                workerID=worker_profile,
                specializationID=category
            ).exists()
            if not has_skill:
                raise ValueError(f"You must add '{category.specializationName}' as a skill before linking materials to this category")
        except Specializations.DoesNotExist:
            raise ValueError(f"Category with ID {category_id} not found")

    image_url = ""
    if image_file:
        try:
            worker_id = worker_profile.profileID.profileID
            file_name = f"material_{name.replace(' ', '_')}_{int(datetime.now().timestamp())}"
            image_url = upload_worker_material_image(image_file, file_name, worker_id)
            if not image_url:
                raise ValueError("Failed to upload material image")
        except Exception as e:
            raise ValueError(f"Image upload failed: {str(e)}")

    material = WorkerMaterial.objects.create(
        workerID=worker_profile,
        name=name.strip(),
        description=description.strip() if description else "",
        price=price_value,
        quantity=quantity_value,
        unit=sanitized_unit,
        image_url=image_url,
        is_available=True,
        categoryID=category,
    )
    
    # Create notification
    try:
        Notification.objects.create(
            accountFK=worker_profile.profileID.accountFK,
            notificationType='SYSTEM',
            title='Material Added',
            message=f'Successfully added material: {name}',
            isRead=False
        )
    except Exception as e:
        print(f"Warning: Failed to create notification: {e}")
    
    return _format_material(material)


def list_materials(worker_profile: WorkerProfile, category_id: Optional[int] = None) -> List[Dict]:
    """
    Get all materials for a worker, optionally filtered by category.
    
    Args:
        worker_profile: WorkerProfile instance
        category_id: Optional category/specialization ID to filter by
    
    Returns:
        list: List of material dictionaries
    """
    queryset = WorkerMaterial.objects.filter(workerID=worker_profile)
    
    if category_id:
        queryset = queryset.filter(categoryID_id=category_id)
    
    materials = queryset.order_by('-createdAt')
    
    return [_format_material(material) for material in materials]


def list_materials_for_client(worker_profile_id: int, category_id: Optional[int] = None) -> List[Dict]:
    """
    Get materials for a worker visible to clients, optionally filtered by category.
    Only returns available materials.
    
    Args:
        worker_profile_id: Worker's profile ID
        category_id: Optional category/specialization ID to filter by
    
    Returns:
        list: List of material dictionaries
    """
    try:
        worker_profile = WorkerProfile.objects.get(profileID__profileID=worker_profile_id)
    except WorkerProfile.DoesNotExist:
        raise ValueError("Worker profile not found")
    
    queryset = WorkerMaterial.objects.filter(
        workerID=worker_profile,
        is_available=True
    )
    
    if category_id:
        queryset = queryset.filter(categoryID_id=category_id)
    
    materials = queryset.order_by('-createdAt')
    
    return [_format_material(material) for material in materials]


def update_material(
    worker_profile: WorkerProfile,
    material_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    price: Optional[float] = None,
    unit: Optional[str] = None,
    quantity: Optional[float] = None,
    is_available: Optional[bool] = None,
    image_file = None,
    category_id: Optional[int] = None,
) -> Dict:
    """
    Update material information.
    
    Args:
        worker_profile: WorkerProfile instance
        material_id: ID of material to update
        name: Updated name
        description: Updated description
        price: Updated price
        unit: Updated unit
        quantity: Updated quantity
        is_available: Updated availability status
        image_file: Optional new image file
        category_id: Optional category ID (None to keep current, -1 to remove)
    
    Returns:
        dict: Updated material data
    
    Raises:
        ValueError: If material not found or validation fails
    """
    try:
        material = WorkerMaterial.objects.get(
            materialID=material_id,
            workerID=worker_profile
        )
    except ObjectDoesNotExist:
        raise ValueError("Material not found or does not belong to this worker")
    
    # Update fields if provided
    if name is not None:
        if len(name.strip()) == 0:
            raise ValueError("Material name cannot be empty")
        material.name = name.strip()
    
    if description is not None:
        material.description = description.strip()
    
    if price is not None:
        if price <= 0:
            raise ValueError("Price must be greater than 0")
        material.price = Decimal(str(price))
    
    if unit is not None:
        material.unit = _sanitize_unit(unit)

    if quantity is not None:
        if quantity <= 0:
            raise ValueError("Quantity must be greater than 0")
        material.quantity = Decimal(str(quantity))
    
    if is_available is not None:
        material.is_available = is_available
    
    # Update category if provided
    if category_id is not None:
        if category_id == -1:
            # Remove category link
            material.categoryID = None
        else:
            try:
                category = Specializations.objects.get(specializationID=category_id)
                # Verify worker has this specialization
                has_skill = workerSpecialization.objects.filter(
                    workerID=worker_profile,
                    specializationID=category
                ).exists()
                if not has_skill:
                    raise ValueError(f"You must add '{category.specializationName}' as a skill before linking materials to this category")
                material.categoryID = category
            except Specializations.DoesNotExist:
                raise ValueError(f"Category with ID {category_id} not found")
    
    # Upload new image if provided
    if image_file:
        try:
            worker_id = worker_profile.profileID.profileID
            file_name = f"mat_{material.name.replace(' ', '_')}_{int(datetime.now().timestamp())}"
            image_url = upload_worker_material_image(image_file, file_name, worker_id)
            
            if not image_url:
                raise ValueError("Failed to upload material image")
            
            material.image_url = image_url
        except Exception as e:
            raise ValueError(f"Material image upload failed: {str(e)}")
    
    material.save()
    
    # Create notification
    try:
        Notification.objects.create(
            accountFK=worker_profile.profileID.accountFK,
            notificationType='SYSTEM',
            title='Material Updated',
            message=f'Successfully updated material: {material.name}',
            isRead=False
        )
    except Exception as e:
        print(f"Warning: Failed to create notification: {e}")
    
    return _format_material(material)


def delete_material(worker_profile: WorkerProfile, material_id: int) -> Dict:
    """
    Delete a material.
    
    Args:
        worker_profile: WorkerProfile instance
        material_id: ID of material to delete
    
    Returns:
        dict: Success message
    
    Raises:
        ValueError: If material not found
    """
    try:
        material = WorkerMaterial.objects.get(
            materialID=material_id,
            workerID=worker_profile
        )
    except ObjectDoesNotExist:
        raise ValueError("Material not found or does not belong to this worker")
    
    material_name = material.name
    material.delete()
    
    # Create notification
    try:
        Notification.objects.create(
            accountFK=worker_profile.profileID.accountFK,
            notificationType='SYSTEM',
            title='Material Deleted',
            message=f'Successfully deleted material: {material_name}',
            isRead=False
        )
    except Exception as e:
        print(f"Warning: Failed to create notification: {e}")
    
    return {
        "success": True,
        "message": f"Material '{material_name}' deleted successfully"
    }


def _format_material(material: WorkerMaterial) -> Dict:
    """Format material object into dictionary"""
    return {
        "materialID": material.materialID,
        "name": material.name,
        "description": material.description,
        "price": float(material.price),
        "quantity": float(material.quantity),
        "unit": material.unit,
        "image_url": material.image_url if material.image_url else None,
        "is_available": material.is_available,
        "category_id": material.categoryID.specializationID if material.categoryID else None,
        "category_name": material.categoryID.specializationName if material.categoryID else None,
        "createdAt": material.createdAt.isoformat() if material.createdAt else "",
        "updatedAt": material.updatedAt.isoformat() if material.updatedAt else ""
    }


def upload_worker_material_image(file, file_name: str, worker_id: int) -> str:
    """
    Upload material image to Supabase storage.
    
    Args:
        file: Uploaded file object
        file_name: Name for the file
        worker_id: Worker profile ID
    
    Returns:
        str: Public URL of uploaded file
    """
    try:
        if not file:
            raise ValueError("No image file provided")

        extension = _validate_material_image(file)
        bucket_name = "users"
        folder_path = f"user_{worker_id}/materials"
        unique_name = f"{file_name}{extension}"

        file_url = upload_file(
            file,
            bucket=bucket_name,
            path=folder_path,
            public=True,
            custom_name=unique_name,
        )

        if not file_url:
            raise ValueError("Failed to upload material image")

        return file_url

    except ValueError:
        raise
    except Exception as e:
        print(f"❌ Error uploading material image: {e}")
        raise ValueError(f"Failed to upload material image: {str(e)}")


def _validate_material_image(file) -> str:
    """Validate file extension and size. Returns lowercase extension."""
    file_name = getattr(file, "name", "") or ""
    extension = Path(file_name).suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        allowed = ", ".join(sorted(ext.strip("." ).upper() for ext in ALLOWED_IMAGE_EXTENSIONS))
        raise ValueError(f"Unsupported image format. Use {allowed} files.")

    size_bytes = getattr(file, "size", None)
    if size_bytes is None:
        try:
            file.seek(0, os.SEEK_END)
            size_bytes = file.tell()
            file.seek(0)
        except Exception:
            size_bytes = None

    if size_bytes is not None and size_bytes > MAX_IMAGE_SIZE_BYTES:
        raise ValueError(f"Image size must be {MAX_IMAGE_SIZE_MB}MB or less")

    return extension
