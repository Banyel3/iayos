import requests
import os
from pathlib import Path

# Configuration
BACKEND_URL = "https://api.iayos.online"
AGENCY_API_URL = f"{BACKEND_URL}/api/agency"

# You might need auth headers/cookies if these endpoints are protected
# For now, we'll try to hit them and see what we get (401/403 confirms endpoint exists at least)

def test_backend_health():
    """Test backend health status"""
    url = f"{BACKEND_URL}/health/status"
    print(f"Testing Backend Health at {url}...")
    try:
        resp = requests.get(url)
        print(f"Backend Status: {resp.status_code}")
        if resp.status_code == 200:
            print("✅ Backend is reachable")
            print(resp.json())
        else:
            print(f"⚠️ Backend returned {resp.status_code}")
            # Try root API docs
            resp2 = requests.get(f"{BACKEND_URL}/api/docs")
            print(f"API Docs Status: {resp2.status_code}")
    except Exception as e:
        print(f"❌ Backend unreachable: {e}")

def test_upload_dummy_document():
    """Test document validation endpoint which calls Face API"""
    url = f"{AGENCY_API_URL}/kyc/validate-document"
    print(f"\nTesting Document Validation Endpoint at {url}...")
    
    # Create valid dummy image
    from PIL import Image
    import io
    
    # Create black image (no face) - should be valid but marked as 'no face detected'
    img = Image.new('RGB', (600, 400), color='black')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    files = {
        'file': ('test.jpg', img_byte_arr, 'image/jpeg')
    }
    data = {
        'document_type': 'BUSINESS_PERMIT'  # Should NOT require face
    }
    
    try:
        resp = requests.post(url, files=files, data=data)
        print(f"Validate Document Status: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        if resp.status_code == 200:
             print("✅ Document validation endpoint works!")
        elif resp.status_code in [401, 403]:
             print("⚠️ Endpoint requires Auth (Expected for Agency UI)")
        else:
             print("❌ Endpoint failed")
             
    except Exception as e:
        print(f"❌ Verification Request failed: {e}")

if __name__ == "__main__":
    print("🚀 Starting Agency UI API Tests...")
    test_backend_health()
    test_upload_dummy_document()
