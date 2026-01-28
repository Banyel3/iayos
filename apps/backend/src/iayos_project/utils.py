import time
import uuid
from django.conf import settings
import os

def upload_file(file, bucket: str, path: str, public: bool = True, custom_name: str = None):
    filename = custom_name or f"{uuid.uuid4().hex[:8]}_{int(time.time())}"
    full_path = os.path.join(path.rstrip("/"), filename).replace("\\", "/")

    file.seek(0)
    file_bytes = file.read()

    # Check if storage is configured
    if not settings.STORAGE:
        print("❌ Storage not configured - check USE_LOCAL_DB and Supabase settings")
        return None

    try:
        # Upload with upsert option to overwrite if file exists
        # Uses unified STORAGE adapter (local or Supabase based on USE_LOCAL_DB)
        result = settings.STORAGE.storage().from_(bucket).upload(
            full_path, 
            file_bytes,
            {"upsert": "true"}
        )
        print(f"📤 Upload result for {full_path}: {result}")
        
        # Supabase Python client returns different structures
        # On success, it might return the path or a dict with 'path' key
        # On error, it returns a dict with 'error' key
        if result:
            # Check if it's an error response
            if isinstance(result, dict) and 'error' in result:
                print(f"❌ Upload failed with error: {result.get('error')}")
                return None
            
            # Success - get public URL
            if public:
                public_url = settings.STORAGE.storage().from_(bucket).get_public_url(full_path)
                # Remove trailing '?' if present (Supabase SDK sometimes adds this)
                if public_url and public_url.endswith('?'):
                    public_url = public_url.rstrip('?')
                print(f"🔗 Public URL generated: {public_url}")
                return public_url
            return full_path
        else:
            print(f"❌ Upload returned falsy result: {result}")
            return None
    except Exception as e:
        print(f"❌ Upload exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def upload_profile_image(file, user_id, custom_name=None):
    """
    Upload user profile image to Supabase storage.
    Path structure: user_{user_id}/profileImage/avatar.png
    Bucket: users (public)
    """
    filename = custom_name or "avatar.png"
    return upload_file(
        file,
        bucket="users",
        path=f"user_{user_id}/profileImage/{filename}",
        public=True,
        custom_name=None  # Use filename directly in path
    )

def upload_job_image(file, user_id, file_name, job_id):
    return upload_file(
        file,
        bucket="users",
        path=f"user_{user_id}/jobs/{job_id}/job.png",
        public=True,
        custom_name=file_name
    )

def upload_kyc_doc(file, file_name, user_id):
    return upload_file(
        file,
        bucket="kyc-docs",
        path=f"user_{user_id}/kyc/",
        public=False,
        custom_name=file_name
    )


def upload_agency_doc(file, file_name, user_id):
    """
    Upload agency KYC documents to the dedicated private 'agency' bucket.
    Path structure: agency_{user_id}/kyc/<file_name>
    """
    return upload_file(
        file,
        bucket="agency",
        path=f"agency_{user_id}/kyc/",
        public=False,
        custom_name=file_name
    )


def get_signed_url(bucket: str, path: str, expires_in: int = 3600) -> str:
    """
    Generate a signed URL for accessing private files.
    
    Args:
        bucket: Supabase storage bucket name
        path: File path within the bucket
        expires_in: URL validity in seconds (default: 1 hour)
    
    Returns:
        Signed URL string, or None if failed
    """
    if not settings.STORAGE:
        print("❌ Storage not configured")
        return None
    
    try:
        result = settings.STORAGE.storage().from_(bucket).create_signed_url(path, expires_in)
        if result and 'signedURL' in result:
            return result['signedURL']
        elif result and 'error' in result:
            print(f"❌ Signed URL error: {result['error']}")
            return None
        return None
    except Exception as e:
        print(f"❌ Signed URL exception: {e}")
        return None


def delete_storage_file(bucket: str, path: str) -> bool:
    """
    Delete a file from Supabase storage.
    
    Args:
        bucket: Supabase storage bucket name  
        path: File path within the bucket
    
    Returns:
        True if deleted successfully, False otherwise
    """
    if not settings.STORAGE:
        print("❌ Storage not configured")
        return False
    
    try:
        result = settings.STORAGE.storage().from_(bucket).remove([path])
        print(f"🗑️ Deleted file: {bucket}/{path}")
        return True
    except Exception as e:
        print(f"❌ Delete file exception: {e}")
        return False