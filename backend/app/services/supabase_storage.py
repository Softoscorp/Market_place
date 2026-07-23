import os
try:
    from supabase import create_client, Client  # type: ignore
    HAS_SUPABASE = True
except ImportError:
    create_client = None  # type: ignore
    Client = None  # type: ignore
    HAS_SUPABASE = False

from app.config import settings
import logging

logger = logging.getLogger(__name__)

supabase = None
if HAS_SUPABASE and settings.supabase_url and settings.supabase_key:
    try:
        # create_client may be None at type‑checking time; ignore for runtime safety
        supabase = create_client(settings.supabase_url, settings.supabase_key)  # type: ignore
    except Exception as e:
        logger.warning(f"Could not initialize Supabase client: {e}")

def upload_file(file_bytes: bytes, bucket: str, path: str, content_type: str = "application/octet-stream") -> str:
    """
    Uploads a file to Supabase Storage and returns the public URL.
    Falls back to local file storage if Supabase is not configured or fails.
    """
    if supabase:
        try:
            supabase.storage.from_(bucket).upload(
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
