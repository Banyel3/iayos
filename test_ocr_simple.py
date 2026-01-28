"""
Test raw Tesseract OCR extraction on DTI certificate image.
No Django required - just tests if Tesseract can read the image.
"""
import os

# Check if Tesseract is available
try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
    print("✅ pytesseract module available")
except ImportError as e:
    TESSERACT_AVAILABLE = False
    print(f"❌ pytesseract not available: {e}")

# Path to the DTI certificate image
DTI_IMAGE_PATH = r"C:\Users\User\.gemini\antigravity\brain\6c91ead0-bd4a-4589-833b-15fb7417768a\uploaded_media_1769607357290.png"

def test_tesseract_ocr():
    """Test raw Tesseract OCR on DTI certificate"""
    print("=" * 60)
    print("Testing RAW Tesseract OCR on DTI Certificate")
    print("=" * 60)
    
    if not TESSERACT_AVAILABLE:
        print("❌ Cannot test - pytesseract not installed")
        return
    
    # Check if image exists
    if not os.path.exists(DTI_IMAGE_PATH):
        print(f"❌ Image not found: {DTI_IMAGE_PATH}")
        return
    
    print(f"📁 Image path: {DTI_IMAGE_PATH}")
    
    # Load image with PIL
    try:
        image = Image.open(DTI_IMAGE_PATH)
        print(f"📊 Image size: {image.size}")
        print(f"📊 Image mode: {image.mode}")
    except Exception as e:
        print(f"❌ Failed to load image: {e}")
        return
    
    # Convert to RGB if needed
    if image.mode != 'RGB':
        image = image.convert('RGB')
        print(f"📊 Converted to RGB")
    
    # Run Tesseract OCR
    print("\n" + "-" * 60)
    print("Running Tesseract OCR...")
    print("-" * 60)
    
    try:
        # Check Tesseract version
        try:
            version = pytesseract.get_tesseract_version()
            print(f"📊 Tesseract version: {version}")
        except Exception as e:
            print(f"⚠️ Could not get Tesseract version: {e}")
        
        # Extract text
        extracted_text = pytesseract.image_to_string(image, lang='eng')
        
        print("\n" + "=" * 60)
        print("EXTRACTED TEXT (OCR)")
        print("=" * 60)
        print(f"Length: {len(extracted_text)} chars")
        print("-" * 60)
        print(extracted_text)
        print("-" * 60)
        
        # Check for expected DTI keywords
        print("\n" + "=" * 60)
        print("KEYWORD CHECKS")
        print("=" * 60)
        
        keywords_to_check = [
            "DTI", "BUSINESS", "CERTIFICATE", "REGISTRATION",
            "DEVANTE", "SOFTWARE", "VANIEL", "CORNELIO",
            "ZAMBOANGA", "7663018", "2026", "2031"
        ]
        
        text_upper = extracted_text.upper()
        for keyword in keywords_to_check:
            found = keyword.upper() in text_upper
            status = "✅" if found else "❌"
            print(f"  {status} '{keyword}': {'FOUND' if found else 'NOT FOUND'}")
        
    except Exception as e:
        print(f"❌ Tesseract OCR failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_tesseract_ocr()
