import time
import uuid
from django.conf import settings
import os

def upload_file(file, bucket: str, path: str, public: bool = True, custom_name: str = None):
    filename = custom_name or f"{uuid.uuid4().hex[:8]}_{int(time.time())}"
    full_path = os.path.join(path.rstrip("/"), filename).replace("\\", "/")

    file.seek(0)
    file_bytes = file.read()

    result = settings.SUPABASE.storage.from_(bucket).upload(full_path, file_bytes)
    if not result:
        return None

    if public:
        return settings.SUPABASE.storage.from_(bucket).get_public_url(full_path)
    return full_path

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