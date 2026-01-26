from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        """
        Called when Django starts up. 
        Performs health checks for AI services (CompreFace, Tesseract).
        """
        # Only run in main process, not in migrations/tests
        import os
        if os.environ.get('RUN_MAIN') != 'true':
            return
        
        # Delay import to avoid circular imports
        try:
            from accounts.document_verification_service import DocumentVerificationService, COMPREFACE_URL
            import httpx
            
            print("\n" + "="*60)
            print("🔍 AI SERVICES HEALTH CHECK")
            print("="*60)
            
            # Check CompreFace
            try:
                response = httpx.get(f"{COMPREFACE_URL}/api/v1/detection/detect", timeout=5.0)
                if response.status_code in [200, 400, 401, 403, 404, 405]:
                    print(f"✅ CompreFace: AVAILABLE at {COMPREFACE_URL}")
                else:
                    print(f"⚠️  CompreFace: UNEXPECTED STATUS {response.status_code} at {COMPREFACE_URL}")
            except Exception as e:
                print(f"❌ CompreFace: UNAVAILABLE at {COMPREFACE_URL}")
                print(f"   Error: {e}")
                print(f"   Face detection will be SKIPPED - documents will require manual review!")
            
            # Check Tesseract
            try:
                import pytesseract
                pytesseract.get_tesseract_version()
                print(f"✅ Tesseract OCR: AVAILABLE")
            except Exception as e:
                print(f"❌ Tesseract OCR: UNAVAILABLE - {e}")
                print(f"   OCR text extraction will be DISABLED!")
            
            print("="*60 + "\n")
            
        except Exception as e:
            logger.warning(f"Could not run AI services health check: {e}")
