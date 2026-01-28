from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        """
        Called when Django starts up. 
        Performs simple health checks (no heavy ML model loading).
        """
        import os
        import sys
        
        # Skip during migrations/test contexts
        is_management_command = len(sys.argv) > 1 and sys.argv[1] in [
            'migrate', 'makemigrations', 'shell', 'test', 'collectstatic',
            'showmigrations', 'check', 'create_admin', 'create_test_users'
        ]
        
        if is_management_command:
            return
        
        print("\n" + "="*60)
        print("🚀 AI SERVICES STATUS")
        print("="*60)
        
        # Check Tesseract (fast, lightweight)
        try:
            import pytesseract
            pytesseract.get_tesseract_version()
            print("✅ Tesseract OCR: AVAILABLE")
        except Exception as e:
            print(f"⚠️ Tesseract OCR: UNAVAILABLE - {e}")
        
        # Check Face API URL (just env var check, no network call)
        face_api_url = os.getenv("FACE_API_URL", "")
        if face_api_url:
            print(f"✅ Face API URL: {face_api_url}")
        else:
            print("⚠️ Face API: FACE_API_URL not set - face detection disabled")
        
        print("="*60 + "\n")
