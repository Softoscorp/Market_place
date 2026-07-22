import os
from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

supabase: Client | None = None
if settings.supabase_url and settings.supabase_key:
    supabase = create_client(settings.supabase_url, settings.supabase_key)

def upload_file(file_bytes: bytes, bucket: str, path: str, content_type: str = "application/octet-stream") -> str:
    """
    Uploads a file to Supabase Storage and returns the public URL.
    Falls back to local file storage if Supabase is not configured or fails.
    """
    if supabase:
        try:
            res = supabase.storage.from_(bucket).upload(
                file=file_bytes,
                path=path,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            return supabase.storage.from_(bucket).get_public_url(path)
        except Exception as e:
            logger.error(f"Supabase upload failed: {e}. Falling back to local storage.")

    # Local storage fallback
    dest_path = os.path.join(settings.media_root, path)
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with open(dest_path, "wb") as f:
        f.write(file_bytes)
    
    return f"/media/{path}"

def delete_file(bucket: str, path: str):
    """Deletes a file from Supabase or local storage."""
    if supabase:
        try:
            supabase.storage.from_(bucket).remove([path])
        except Exception as e:
            logger.error(f"Supabase delete failed: {e}")
    else:
        dest_path = os.path.join(settings.media_root, path)
        if os.path.exists(dest_path):
            os.remove(dest_path)
