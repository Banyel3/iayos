"""
Local File Storage Adapter for Offline/Defense Mode
Provides the same interface as SupabaseStorageAdapter but stores files locally.
Used when USE_LOCAL_DB=true in environment.
"""
import os
import shutil
from pathlib import Path
from django.conf import settings


class LocalStorageAdapter:
    """
    Adapter for local file storage that mimics Supabase Storage API.
    Files are stored in MEDIA_ROOT with the same bucket/path structure.
    """

    def __init__(self, media_root: str, media_url: str, base_url: str):
        self.media_root = Path(media_root)
        self.media_url = media_url
        self.base_url = base_url.rstrip('/')
        
        # Ensure media root exists
        self.media_root.mkdir(parents=True, exist_ok=True)
        print(f"📁 Local storage initialized at: {self.media_root}")

    def storage(self):
        """Return storage interface (mimics Supabase SDK)"""
        return LocalStorageInterface(self.media_root, self.media_url, self.base_url)


class LocalStorageInterface:
    """Storage interface that mimics Supabase SDK storage API"""

    def __init__(self, media_root: Path, media_url: str, base_url: str):
        self.media_root = media_root
        self.media_url = media_url
        self.base_url = base_url

    def from_(self, bucket_name: str):
        """Return bucket interface"""
        return LocalBucketInterface(self.media_root, bucket_name, self.media_url, self.base_url)


class LocalBucketInterface:
    """Bucket interface that mimics Supabase SDK bucket API"""

    def __init__(self, media_root: Path, bucket_name: str, media_url: str, base_url: str):
        self.media_root = media_root
        self.bucket_name = bucket_name
        self.media_url = media_url
        self.base_url = base_url
        self.bucket_path = media_root / bucket_name
        
        # Ensure bucket directory exists
        self.bucket_path.mkdir(parents=True, exist_ok=True)

    def upload(self, path: str, file_data: bytes, options: dict = None):
        """
        Upload file to local storage

        Args:
            path: File path in bucket (e.g., "user_123/profile.jpg")
            file_data: File content as bytes
            options: Upload options (e.g., {"upsert": "true"})

        Returns:
            dict: Upload result with path info
        """
        try:
            # Clean path (remove leading slash)
            path = path.lstrip('/')
            
            # Create full file path
            full_path = self.bucket_path / path
            
            # Create parent directories if needed
            full_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Handle upsert - if file exists and upsert is not true, could raise error
            # For simplicity, always overwrite (like upsert=true)
            
            # Write file
            with open(full_path, 'wb') as f:
                f.write(file_data)
            
            print(f"📤 Local upload success: {self.bucket_name}/{path}")
            return {'path': path, 'fullPath': f"{self.bucket_name}/{path}"}

        except Exception as e:
            print(f"❌ Local upload error: {str(e)}")
            return {'error': str(e)}

    def get_public_url(self, path: str) -> str:
        """
        Get public URL for a file

        Args:
            path: File path in bucket

        Returns:
            str: Relative URL path (served by Django)
            Using relative URL so it works from any client (web on localhost, mobile on IP)
        """
        # Clean path
        path = path.lstrip('/')
        
        # Return relative URL that works from any client
        # Format: /media/{bucket}/{path}
        # The client will automatically prepend their own host
        public_url = f"{self.media_url}{self.bucket_name}/{path}"
        return public_url

    def create_signed_url(self, path: str, expires_in: int = 3600) -> dict:
        """
        Create a signed URL for file access.
        For local storage, just return the public URL (no signing needed).

        Args:
            path: File path in bucket
            expires_in: Expiration time in seconds (ignored for local)

        Returns:
            dict: {'signedURL': str, 'error': None}
        """
        try:
            path = path.lstrip('/')
            url = self.get_public_url(path)
            return {'signedURL': url, 'error': None}
        except Exception as e:
            print(f"❌ Error creating signed URL: {str(e)}")
            return {'error': str(e), 'signedURL': None}

    def remove(self, paths: list) -> dict:
        """
        Remove files from local storage

        Args:
            paths: List of file paths to remove

        Returns:
            dict: Result of deletion
        """
        try:
            deleted = []
            errors = []
            
            for path in paths:
                path = path.lstrip('/')
                full_path = self.bucket_path / path
                
                if full_path.exists():
                    full_path.unlink()
                    deleted.append(path)
                    print(f"🗑️ Deleted: {self.bucket_name}/{path}")
                else:
                    errors.append(f"File not found: {path}")
            
            return {'deleted': deleted, 'errors': errors if errors else None}
        except Exception as e:
            print(f"❌ Error deleting files: {str(e)}")
            return {'error': str(e)}


def create_local_storage_client(media_root: str, media_url: str, base_url: str):
    """
    Factory function to create a local storage client.
    
    Args:
        media_root: Absolute path to media directory
        media_url: URL prefix for serving media (e.g., '/media/')
        base_url: Base URL of the server (e.g., 'http://192.168.137.1:8000')
    
    Returns:
        LocalStorageAdapter instance
    """
    return LocalStorageAdapter(media_root, media_url, base_url)
