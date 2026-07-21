import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://rental:rental@localhost:5432/rental",
    )
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-change-me")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    media_root: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "media")
    cors_origins: list[str] = ["*"]

    max_listing_photos: int = 8
    max_voice_message_seconds: int = 120

    # Translation: if this is unset, the app falls back to a mock translator
    # (clearly marked as such) instead of failing outright. See translation.py.
    google_translate_api_key: str = os.getenv("GOOGLE_TRANSLATE_API_KEY", "")

    # Initial admin bootstrap (used by create_admin.py, not the public API —
    # there is no public "register as admin" endpoint).
    admin_bootstrap_email: str = os.getenv("ADMIN_BOOTSTRAP_EMAIL", "")

    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    admin_bootstrap_password: str = os.getenv("ADMIN_BOOTSTRAP_PASSWORD", "")

    # Resend email API
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    resend_from_email: str = os.getenv("RESEND_FROM_EMAIL", "noreply@houseagent.co")

    class Config:
        env_file = ".env"


settings = Settings()
