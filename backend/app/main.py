import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import Base, engine, get_db
from .routers import auth, users, listings, messaging, ratings, admin, reports, roommates, verifications, notifications, claims
import sentry_sdk
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException

Base.metadata.create_all(bind=engine)

def auto_migrate_columns():
    try:
        from sqlalchemy import text

        def _run(stmt: str, **kwargs) -> bool:
            """Run a DDL statement in its own transaction; roll back on failure
            so one failed ALTER can't abort every later statement on the
            shared connection."""
            with engine.begin() as conn:
                conn.execute(text(stmt), kwargs)
            return True

        # Force create notification tables in case Base.metadata.create_all missed them
        _run(
            """
            CREATE TABLE IF NOT EXISTS fcm_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR NOT NULL UNIQUE,
                platform VARCHAR NOT NULL DEFAULT 'android',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        _run(
            """
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                endpoint VARCHAR NOT NULL UNIQUE,
                p256dh VARCHAR NOT NULL,
                auth VARCHAR NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """
        )

        for col in ["generator", "pool", "gym"]:
            try:
                _run(f"ALTER TABLE listings ADD COLUMN {col} BOOLEAN DEFAULT FALSE;")
            except Exception:
                pass
        try:
            _run("ALTER TABLE listings ADD COLUMN view_count INTEGER DEFAULT 0;")
        except Exception:
            pass
        try:
            _run("ALTER TABLE messages ADD COLUMN image_url VARCHAR;")
        except Exception:
            pass
        try:
            _run("ALTER TABLE messages ADD COLUMN listing_id INTEGER;")
        except Exception:
            pass
        try:
            _run("ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE;")
        except Exception:
            pass
        try:
            _run("ALTER TABLE users ADD COLUMN verification_tier VARCHAR DEFAULT 'none';")
        except Exception:
            pass

        # Extend the native Postgres enum 'messagetype' with new message values.
        # SQLAlchemy's Enum() uses a native PG enum type, so adding values to the
        # Python enum does NOT update the DB type. ALTER TYPE ... ADD VALUE must
        # run outside an explicit transaction on PG < 12, so use AUTOCOMMIT.
        try:
            aconn = engine.connect().execution_options(isolation_level="AUTOCOMMIT")
            aconn.execute(text("ALTER TYPE messagetype ADD VALUE IF NOT EXISTS 'image';"))
            aconn.execute(text("ALTER TYPE messagetype ADD VALUE IF NOT EXISTS 'listing';"))
            aconn.close()
        except Exception as e:
            print("Enum migration notice:", e)
    except Exception as e:
        print("Column migration notice:", e)

auto_migrate_columns()

app = FastAPI(title="North Cyprus Rental Platform API")

sentry_dsn = os.getenv("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; "
            "style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; "
            "frame-ancestors 'none'; connect-src 'self' https:; base-uri 'self'",
        )
        return response


app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.media_root, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.media_root), name="media")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(listings.router)
app.include_router(messaging.router)
app.include_router(ratings.router)
app.include_router(admin.router)
app.include_router(reports.router)
app.include_router(roommates.router)
app.include_router(verifications.router)
app.include_router(notifications.router)
app.include_router(claims.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "rental-platform-api"}


@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database connection failed")
