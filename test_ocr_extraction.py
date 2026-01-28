"""
Test OCR extraction on actual DTI certificate image.
This script directly tests the document_verification_service OCR functionality.
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'backend', 'src'))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')

import django
django.setup()

from accounts.document_verification_service import DocumentVerificationService

# Path to the DTI certificate image
DTI_IMAGE_PATH = r"C:\Users\User\.gemini\antigravity\brain\6c91ead0-bd4a-4589-833b-15fb7417768a\uploaded_media_1769607357290.png"

def test_ocr_extraction():
    """Test OCR extraction on DTI certificate"""
    print("=" * 60)
    print("Testing OCR Extraction on DTI Certificate")
    print("=" * 60)
    
    # Check if image exists
    if not os.path.exists(DTI_IMAGE_PATH):
        print(f"❌ Image not found: {DTI_IMAGE_PATH}")
        return
    
    print(f"📁 Image path: {DTI_IMAGE_PATH}")
    
    # Read the image file
    with open(DTI_IMAGE_PATH, 'rb') as f:
        file_data = f.read()
    
    print(f"📊 File size: {len(file_data)} bytes")
    
    # Initialize verification service
    service = DocumentVerificationService()
    
    # Test with BUSINESS_PERMIT document type
    print("\n" + "-" * 60)
    print("Testing verify_document with BUSINESS_PERMIT type...")
    print("-" * 60)
    
    result = service.verify_document(
        file_data=file_data,
        document_type="BUSINESS_PERMIT",
        file_name="dti_certificate.png"
    )
    
    print("\n" + "=" * 60)
    print("VERIFICATION RESULT")
    print("=" * 60)
    print(f"Status: {result.status}")
    print(f"Confidence: {result.confidence_score}")
    print(f"Rejection Reason: {result.rejection_reason}")
    print(f"Face Detected: {result.face_detected}")
    print(f"Quality Score: {result.quality_score}")
    print(f"Warnings: {result.warnings}")
    
    print("\n" + "-" * 60)
    print("EXTRACTED TEXT (OCR)")
    print("-" * 60)
    if result.extracted_text:
        print(f"Length: {len(result.extracted_text)} chars")
        print(f"Preview:\n{result.extracted_text[:1000]}")
    else:
        print("❌ NO TEXT EXTRACTED!")
    
    print("\n" + "-" * 60)
    print("DETAILS")
    print("-" * 60)
    for key, value in (result.details or {}).items():
        print(f"  {key}: {value}")

if __name__ == "__main__":
    test_ocr_extraction()
