"""
Supabase Storage Adapter using new Secret API Keys
This adapter uses direct HTTP requests to Supabase Storage API
instead of the Supabase client SDK (which requires JWT service_role key)
"""
import requests
import os


class SupabaseStorageAdapter:
    """
    Adapter for Supabase Storage using the new secret API keys
    Provides same interface as the old Supabase client SDK
    """

    def __init__(self, url: str, secret_key: str, anon_key: str = None):
        self.url = url.rstrip('/')
        self.secret_key = secret_key
        self.anon_key = anon_key

        # Use secret key for authenticated requests (bypasses RLS)
        # For new secret API keys (sb_secret_*), use apikey header only (no Bearer token)
        self.headers = {
            'apikey': self.secret_key,  # Secret key in apikey header
            'Authorization': f'Bearer {self.secret_key}',  # Also in Authorization for compatibility
        }

    def storage(self):
        """Return storage interface"""
        return StorageInterface(self.url, self.headers)


class StorageInterface:
    """Storage interface that mimics Supabase SDK storage API"""

    def __init__(self, url: str, headers: dict):
        self.url = url
        self.headers = headers

    def from_(self, bucket_name: str):
        """Return bucket interface"""
        return BucketInterface(self.url, bucket_name, self.headers)


class BucketInterface:
    """Bucket interface that mimics Supabase SDK bucket API"""

    def __init__(self, url: str, bucket_name: str, headers: dict):
        self.url = url
        self.bucket_name = bucket_name
        self.headers = headers
        self.storage_url = f"{url}/storage/v1/object/{bucket_name}"

    def upload(self, path: str, file_data: bytes, options: dict = None):
        """
        Upload file to Supabase Storage

        Args:
            path: File path in bucket (e.g., "user_123/profile.jpg")
            file_data: File content as bytes
            options: Upload options (e.g., {"upsert": "true"})

        Returns:
            dict or str: Upload result
        """
        try:
            # Clean path (remove leading slash)
            path = path.lstrip('/')

            url = f"{self.storage_url}/{path}"

            # Add headers for file upload
            upload_headers = self.headers.copy()
            upload_headers['Content-Type'] = 'application/octet-stream'

            # Handle upsert option
            if options and options.get('upsert') == 'true':
                # Use POST for upsert (will overwrite if exists)
                response = requests.post(url, data=file_data, headers=upload_headers, timeout=(30, 120))
            else:
                # Use POST for normal upload
                response = requests.post(url, data=file_data, headers=upload_headers, timeout=(30, 120))

            if response.status_code in [200, 201]:
                # Success
                return {'path': path, 'fullPath': f"{self.bucket_name}/{path}"}
            else:
                # Error
                error_msg = response.json() if response.text else {'message': 'Upload failed'}
                print(f"❌ Supabase upload error: {response.status_code} - {error_msg}")
                return {'error': error_msg}

        except Exception as e:
            print(f"❌ Supabase upload exception: {str(e)}")
            return {'error': str(e)}

    def get_public_url(self, path: str) -> str:
        """
        Get public URL for a file

        Args:
            path: File path in bucket

        Returns:
            str: Public URL
        """
        # Clean path
        path = path.lstrip('/')

        # Public URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
        return f"{self.url}/storage/v1/object/public/{self.bucket_name}/{path}"

    def create_signed_url(self, path: str, expires_in: int = 3600) -> dict:
        """
        Create a signed URL for private file access

        Args:
            path: File path in bucket
            expires_in: Expiration time in seconds (default: 1 hour)

        Returns:
            dict: {'signedURL': str, 'error': None} or {'error': str}
        """
        try:
            # Clean path
            path = path.lstrip('/')

            url = f"{self.url}/storage/v1/object/sign/{self.bucket_name}/{path}"

            payload = {
                'expiresIn': expires_in
            }

            response = requests.post(url, json=payload, headers=self.headers, timeout=(10, 30))

            if response.status_code == 200:
                data = response.json()
                # Supabase returns signedURL which is just the token parameter
                # e.g., "?token=eyJ..." - NOT a full path
                signed_url_or_token = data.get('signedURL')
                if signed_url_or_token:
                    # Check if it's already a full URL (shouldn't happen but be safe)
                    if signed_url_or_token.startswith('http'):
                        return {'signedURL': signed_url_or_token, 'error': None}
                    # Check if it's a full path already (to prevent double path)
                    elif '/object/sign/' in signed_url_or_token:
                        # It's a relative path with token, just prepend base URL
                        full_signed_url = f"{self.url}/storage/v1{signed_url_or_token}"
                        return {'signedURL': full_signed_url, 'error': None}
                    # It's just the token or relative path, construct the full URL
                    else:
                        full_signed_url = f"{self.url}/storage/v1/object/sign/{self.bucket_name}/{path}{signed_url_or_token}"
                        return {'signedURL': full_signed_url, 'error': None}

            error_msg = response.json() if response.text else {'message': 'Failed to create signed URL'}
            return {'error': error_msg, 'signedURL': None}

        except Exception as e:
            print(f"❌ Error creating signed URL: {str(e)}")
            return {'error': str(e), 'signedURL': None}

    def download(self, path: str) -> bytes:
        """
        Download file from Supabase Storage

        Args:
            path: File path in bucket

        Returns:
            bytes: File content
        """
        try:
            path = path.lstrip('/')
            url = f"{self.storage_url}/{path}"

            response = requests.get(url, headers=self.headers, timeout=(30, 120))

            if response.status_code == 200:
                return response.content
            else:
                print(f"❌ Download failed: {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ Download exception: {str(e)}")
            return None

    def remove(self, paths: list) -> dict:
        """
        Remove files from bucket

        Args:
            paths: List of file paths to remove

        Returns:
            dict: Result
        """
        try:
            url = f"{self.url}/storage/v1/object/{self.bucket_name}"

            payload = {
                'prefixes': paths
            }

            response = requests.delete(url, json=payload, headers=self.headers, timeout=(10, 30))

            if response.status_code in [200, 204]:
                return {'data': paths, 'error': None}
            else:
                error_msg = response.json() if response.text else {'message': 'Delete failed'}
                return {'error': error_msg}

        except Exception as e:
            return {'error': str(e)}


def create_supabase_client(url: str, secret_key: str, anon_key: str = None):
    """
    Factory function to create Supabase adapter
    Mimics the supabase.create_client() interface

    Args:
        url: Supabase project URL
        secret_key: Secret API key (sb_secret_...)
        anon_key: Optional anon key

    Returns:
        SupabaseStorageAdapter: Adapter instance
    """
    return SupabaseStorageAdapter(url, secret_key, anon_key)
