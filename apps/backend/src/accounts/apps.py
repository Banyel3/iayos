from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        """
        Called when Django starts up. 
        Performs health checks for AI services (MediaPipe, Azure Face, Tesseract).
        """
        # Only run in main process, not in migrations/tests
        import os
        if os.environ.get('RUN_MAIN') != 'true':
            return
        
        # Delay import to avoid circular imports
        try:
            from accounts.face_detection_service import check_face_services_available
            
            print("\n" + "="*60)
            print("🔍 AI SERVICES HEALTH CHECK")
            print("="*60)
            
            # Check Face Detection Services (InsightFace)
            try:
                status = check_face_services_available()
                
                # InsightFace
                if status.get('insightface_available'):
                    print("✅ InsightFace Face Recognition: AVAILABLE")
                    print(f"   Model: {status.get('model', 'Unknown')}")
                    print(f"   Similarity Threshold: {status.get('threshold', 'Unknown')}")
                else:
                    print("❌ InsightFace: NOT AVAILABLE")
                
                # Overall face detection status
                if status.get('insightface_available'):
                    print("✅ Face Detection & Verification: ENABLED")
                    print("   (Local processing using ONNX Runtime)")
                else:
                    print("❌ Face Detection: DISABLED - all documents will require manual review!")
                    
            except Exception as e:
                print(f"❌ Face Services: ERROR checking availability - {e}")
            
            # Check Tesseract
            try:
                import pytesseract
                pytesseract.get_tesseract_version()
                print("✅ Tesseract OCR: AVAILABLE")
            except Exception as e:
                print(f"❌ Tesseract OCR: UNAVAILABLE - {e}")
                print("   OCR text extraction will be DISABLED!")
            
            print("="*60 + "\n")
            
            # Start InsightFace pre-warm in background thread
            # This loads InsightFace before first request arrives, so first upload is fast
            try:
                from accounts.face_detection_service import prewarm_insightface
                prewarm_insightface()
            except Exception as e:
                logger.warning(f"Could not start InsightFace pre-warm: {e}")
            
        except Exception as e:
            logger.warning(f"Could not run AI services health check: {e}")

