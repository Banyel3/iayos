from time import time
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

def upload_profile_image(file, custom_name, user_id):
    return upload_file(
        file,
        bucket="users",
        path=f"user_{user_id}/profile/avatar.png",
        public=True,
        custom_name=custom_name
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