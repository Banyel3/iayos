from django.apps import AppConfig
import logging
import threading

logger = logging.getLogger(__name__)


def _prewarm_face_api_async():
    """Pre-warm Face API in a background thread to avoid blocking startup."""
    try:
        from accounts.face_detection_service import prewarm_face_api, FACE_API_URL
        if FACE_API_URL:
            print(f"🔥 Pre-warming Face API: {FACE_API_URL}")
            success = prewarm_face_api()
            if success:
                print("✅ Face API: PRE-WARMED (ready for requests)")
            else:
                print("⚠️ Face API: Pre-warm failed (will retry on first request)")
    except Exception as e:
        print(f"⚠️ Face API pre-warm error: {e}")


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        """
        Called when Django starts up. 
        Performs simple health checks (no heavy ML model loading).
        Pre-warms external services in background threads.
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
            # Pre-warm Face API in background thread (non-blocking)
            # This wakes up Render free tier before user requests
            threading.Thread(target=_prewarm_face_api_async, daemon=True).start()
        else:
            print("⚠️ Face API: FACE_API_URL not set - face detection disabled")
        
        print("="*60 + "\n")
