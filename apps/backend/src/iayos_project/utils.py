from django.conf import settings
import os

def upload_file(file, bucket: str, path: str, public: bool = True):
    """
    Generic uploader to Supabase storage.

    :param file: Django InMemoryUploadedFile
    :param bucket: Supabase bucket name
    :param path: file path inside bucket (e.g. 'user_123/profile/avatar.png')
    :param public: if True, returns public URL, else returns file path only
    """
    file_bytes = file.read()
    
    # Upload
    result = settings.supabase.storage.from_(bucket).upload(path, file_bytes)
    if not result:
        return None

    if public:
        return settings.supabase.storage.from_(bucket).get_public_url(path)
    return path  # store path in DB, fetch later with signed URL

def upload_profile_image(file, user_id):
    return upload_file(
        file,
        bucket="users",
        path=f"user_{user_id}/profile/avatar.png",
        public=True
    )

def upload_job_image(file, user_id, job_id):
    return upload_file(
        file,
        bucket="users",
        path=f"user_{user_id}/jobs/{job_id}/job.png",
        public=True
    )

def upload_kyc_doc(file, user_id, kyc_type):
    return upload_file(
        file,
        bucket="kyc-docs",
        path=f"user_{user_id}/kyc/{kyc_type}/{file.name}",
        public=False  # keep private
    )