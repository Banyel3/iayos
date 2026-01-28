from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        """
        Called when Django starts up. 
        Starts InsightFace pre-warm in background thread.
        """
        import os
        
        # Skip in migration/test contexts
        # RUN_MAIN is only set by Django's runserver reloader (dev mode)
        # In production with Daphne, it's not set - so we check for other signals
        run_main = os.environ.get('RUN_MAIN')
        if run_main == 'false':
            # Explicitly disabled
            return

        
        print("\n" + "="*60)
        print("🚀 AI SERVICES INITIALIZATION")
        print("="*60)
        
        # Check Tesseract (fast, synchronous check - OK)
        try:
            import pytesseract
            pytesseract.get_tesseract_version()
            print("✅ Tesseract OCR: AVAILABLE")
        except Exception as e:
            print(f"⚠️ Tesseract OCR: UNAVAILABLE - {e}")
        
        # Start InsightFace pre-warm in background thread (async - doesn't block)
        # This loads InsightFace AFTER Django startup, so server can accept requests immediately
        try:
            from accounts.face_detection_service import prewarm_insightface
            prewarm_insightface()
            print("🔄 InsightFace: Pre-warming in background (first KYC request may be slow)")
        except Exception as e:
            logger.warning(f"⚠️ Could not start InsightFace pre-warm: {e}")
        
        print("="*60 + "\n")


