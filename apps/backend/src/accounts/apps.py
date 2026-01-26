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
            
            # Check Face Detection Services (MediaPipe/OpenCV/Azure)
            try:
                status = check_face_services_available()
                
                # MediaPipe
                if status.get('mediapipe_available'):
                    print("✅ MediaPipe Face Detection: AVAILABLE")
                else:
                    print("⚠️  MediaPipe: NOT AVAILABLE")
                
                # OpenCV (fallback)
                if status.get('opencv_available'):
                    print("✅ OpenCV Haar Cascade: AVAILABLE (fallback)")
                else:
                    print("⚠️  OpenCV: NOT AVAILABLE")
                
                # Azure Face API (optional, for face comparison)
                if status.get('azure_available'):
                    print("✅ Azure Face API: AVAILABLE (face comparison enabled)")
                else:
                    azure_endpoint = os.getenv('AZURE_FACE_ENDPOINT', '')
                    if azure_endpoint:
                        print("⚠️  Azure Face API: CONFIGURED BUT UNAVAILABLE")
                    else:
                        print("ℹ️  Azure Face API: NOT CONFIGURED (face comparison uses manual review)")
                
                # Overall face detection status
                if status.get('face_detection_available'):
                    print("✅ Face Detection: ENABLED")
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
            
        except Exception as e:
            logger.warning(f"Could not run AI services health check: {e}")
