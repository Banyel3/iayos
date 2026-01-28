
import os
import sys
import logging
import httpx

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mock Django settings to allow importing the service
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')

# Manual check script
def check_face_api():
    url = "https://iayos-face-api.onrender.com"
    print(f"Testing connectivity to: {url}")
    
    try:
        response = httpx.get(f"{url}/health", timeout=10.0)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ SUCECSS: Face API is reachable.")
        else:
            print("❌ FAIL: Face API returned non-200 status.")
            
    except Exception as e:
        print(f"❌ ERROR: Could not connect to Face API: {e}")

if __name__ == "__main__":
    check_face_api()
