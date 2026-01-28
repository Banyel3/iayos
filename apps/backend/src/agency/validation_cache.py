"""
Redis cache for agency KYC validation results.

This module provides caching for AI validation results (face detection, quality checks)
to avoid duplicate processing during upload.
"""

from django.core.cache import cache
import hashlib
import json
from typing import Optional, Dict, Any


def generate_file_hash(file_data: bytes) -> str:
    """Generate SHA-256 hash of file data for cache key."""
    return hashlib.sha256(file_data).hexdigest()


def cache_validation_result(
    file_hash: str,
    document_type: str,
    validation_result: Dict[str, Any],
    timeout: int = 300  # 5 minutes
) -> None:
    """
    Cache validation result in Redis.
    
    Args:
        file_hash: SHA-256 hash of file data
        document_type: Document type (BUSINESS_PERMIT, REP_ID_FRONT, etc.)
        validation_result: Dictionary containing validation results
        timeout: Cache timeout in seconds (default: 5 minutes)
    """
    cache_key = f"agency_kyc_validation:{document_type}:{file_hash}"
    
    # Serialize validation result
    cache_data = {
        'ai_status': validation_result.get('ai_status'),
        'face_detected': validation_result.get('face_detected'),
        'face_count': validation_result.get('face_count'),
        'face_confidence': validation_result.get('face_confidence'),
        'quality_score': validation_result.get('quality_score'),
        'ai_confidence_score': validation_result.get('ai_confidence_score'),
        'ai_warnings': validation_result.get('ai_warnings', []),
        'ai_details': validation_result.get('ai_details', {}),
        'ai_rejection_reason': validation_result.get('ai_rejection_reason'),
        'ai_rejection_message': validation_result.get('ai_rejection_message'),
    }
    
    cache.set(cache_key, json.dumps(cache_data), timeout)
    print(f"✅ Cached validation for {document_type} (hash: {file_hash[:16]}...)")


def get_cached_validation(file_hash: str, document_type: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve cached validation result from Redis.
    
    Args:
        file_hash: SHA-256 hash of file data
        document_type: Document type
    
    Returns:
        Dictionary with validation results if cached, None otherwise
    """
    cache_key = f"agency_kyc_validation:{document_type}:{file_hash}"
    cached_data = cache.get(cache_key)
    
    if cached_data:
        print(f"✅ Cache HIT for {document_type} (hash: {file_hash[:16]}...)")
        return json.loads(cached_data)
    
    print(f"❌ Cache MISS for {document_type} (hash: {file_hash[:16]}...)")
    return None


def invalidate_validation_cache(file_hash: str, document_type: str) -> None:
    """
    Invalidate cached validation result.
    
    Args:
        file_hash: SHA-256 hash of file data
        document_type: Document type
    """
    cache_key = f"agency_kyc_validation:{document_type}:{file_hash}"
    cache.delete(cache_key)
    print(f"🗑️ Invalidated cache for {document_type} (hash: {file_hash[:16]}...)")


def cache_ocr_extraction(
    kyc_id: int,
    extraction_data: Dict[str, Any],
    timeout: int = 600  # 10 minutes
) -> None:
    """
    Cache OCR extraction results for business form autofill.
    
    Args:
        kyc_id: AgencyKYC ID
        extraction_data: Dictionary containing extracted business data
        timeout: Cache timeout in seconds (default: 10 minutes)
    """
    cache_key = f"agency_kyc_extraction:{kyc_id}"
    cache.set(cache_key, json.dumps(extraction_data), timeout)
    print(f"✅ Cached OCR extraction for KYC {kyc_id}")


def get_cached_ocr_extraction(kyc_id: int) -> Optional[Dict[str, Any]]:
    """
    Retrieve cached OCR extraction results.
    
    Args:
        kyc_id: AgencyKYC ID
    
    Returns:
        Dictionary with extraction data if cached, None otherwise
    """
    cache_key = f"agency_kyc_extraction:{kyc_id}"
    cached_data = cache.get(cache_key)
    
    if cached_data:
        print(f"✅ Cache HIT for OCR extraction (KYC {kyc_id})")
        return json.loads(cached_data)
    
    print(f"❌ Cache MISS for OCR extraction (KYC {kyc_id})")
    return None
