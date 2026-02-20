from django.apps import AppConfig
import logging
import threading
import os
import time

logger = logging.getLogger(__name__)

# Keep-alive configuration
KEEP_ALIVE_INTERVAL = int(os.getenv("KEEP_ALIVE_INTERVAL", "300"))  # 5 minutes
_keep_alive_thread = None
_request_count = 0


def _keep_alive_loop():
    """
    Background thread to prevent Render free tier spin-down.
    Logs activity every KEEP_ALIVE_INTERVAL seconds and optionally pings health endpoint.
    """
    global _request_count
    import requests
    
    # Wait for server to fully start
    time.sleep(30)
    
    # Get base URL from environment
    base_url = os.getenv("RENDER_EXTERNAL_URL", os.getenv("API_URL", ""))
    health_url = f"{base_url}/health/ready" if base_url else None
    
    logger.info(f"🔄 Keep-alive started (interval: {KEEP_ALIVE_INTERVAL}s, url: {health_url or 'logging only'})")
    print(f"🔄 Keep-alive started (interval: {KEEP_ALIVE_INTERVAL}s)")
    
    while True:
        try:
            # Log status to show activity
            status = "healthy"
            logger.info(f"🏓 Keep-alive: status={status}, requests_served={_request_count}")
            print(f"🏓 Keep-alive ping: status={status}")
            
            # Self-ping if we have a URL (keeps Render from spinning down)
            if health_url:
                try:
                    response = requests.get(health_url, timeout=10)
                    logger.info(f"🏓 Self-ping: {response.status_code}")
                except Exception as ping_error:
                    logger.warning(f"⚠️ Self-ping failed: {ping_error}")
                    
        except Exception as e:
            logger.error(f"Keep-alive error: {e}")
        
        time.sleep(KEEP_ALIVE_INTERVAL)


def increment_request_count():
    """Called from middleware to track request count."""
    global _request_count
    _request_count += 1


def _prewarm_face_api_async():
    """Pre-warm face_recognition (dlib) in a background thread to avoid blocking startup."""
    try:
        from accounts.face_detection_service import prewarm_face_api
        print("🔥 Pre-warming face_recognition (dlib)...")
        success = prewarm_face_api()
        if success:
            print("✅ Face Recognition: PRE-WARMED (dlib model loaded, ready for requests)")
        else:
            print("⚠️ Face Recognition: Pre-warm failed (will retry on first request)")
    except BaseException as e:
        print(f"⚠️ Face Recognition pre-warm error: {e}")


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
        
        # Pre-warm face_recognition (dlib) in background thread (non-blocking)
        # This loads the dlib face model (~150 MB) before user requests arrive
        print("✅ Face Detection: Using local face_recognition (dlib)")
        threading.Thread(target=_prewarm_face_api_async, daemon=True).start()
        
        # Start keep-alive background thread (prevents Render free tier spin-down)
        global _keep_alive_thread
        if _keep_alive_thread is None:
            _keep_alive_thread = threading.Thread(target=_keep_alive_loop, daemon=True)
            _keep_alive_thread.start()
            print("✅ Keep-alive thread: STARTED")
        
        print("="*60 + "\n")
