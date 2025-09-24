from decouple import config
from supabase import create_client

SUPABASE_URL = config("SUPABASE_URL")
SUPABASE_KEY = config("SUPABASE_KEY", default="")  # Optional if you only need public URLs
BUCKET_NAME = config("SUPABASE_BUCKET")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

PROFILE_BUCKET = config("SUPABASE_BUCKET_PROFILES")
CERTS_BUCKET= config("SUPABASE_BUCKET_CERTS")