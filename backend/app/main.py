import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import Base, engine
from .routers import auth, users, listings, messaging, ratings, admin, reports, roommates

Base.metadata.create_all(bind=engine)

def auto_migrate_columns():
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            for col in ["generator", "pool", "gym"]:
                try:
                    conn.execute(text(f"ALTER TABLE listings ADD COLUMN IF NOT EXISTS {col} BOOLEAN DEFAULT FALSE;"))
                    conn.commit()
                except Exception:
                    pass
    except Exception as e:
        print("Column migration notice:", e)

auto_migrate_columns()

app = FastAPI(title="North Cyprus Rental Platform API")

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


def seed_admin_users():
    try:
        from .database import SessionLocal
        from .models import User
        from .security import hash_password

        db = SessionLocal()
        users_to_seed = [
            {
                "email": "admin@test.com",
                "password": "adminpass123",
                "name": "Platform Admin",
                "phone": "1234567890",
                "role": "admin",
                "is_verified": True
            },
            {
                "email": "agent.demo@test.com",
                "password": "demo123",
                "name": "Demo Agent",
                "phone": "1234567890",
                "role": "agent",
                "is_verified": True
            },
            {
                "email": "renter.demo@test.com",
                "password": "demo123",
                "name": "Demo Renter",
                "phone": "1234567890",
                "role": "renter",
                "is_verified": True
            },
            {
                "email": "care.demo@test.com",
                "password": "demo123",
                "name": "Customer Care",
                "phone": "1234567890",
                "role": "customer_care",
                "is_verified": True
            }
        ]

        for user_data in users_to_seed:
            user = db.query(User).filter_by(email=user_data["email"]).first()
            if user:
                user.password_hash = hash_password(user_data["password"])  # type: ignore
                user.role = user_data["role"]  # type: ignore
            else:
                new_user = User(
                    email=user_data["email"],
                    password_hash=hash_password(user_data["password"]),
                    name=user_data["name"],
                    phone=user_data["phone"],
                    role=user_data["role"],
                    is_verified=user_data["is_verified"]
                )
                db.add(new_user)
        db.commit()
        db.close()
    except Exception as e:
        print("Error seeding admin users:", e)

seed_admin_users()


@app.get("/")
def root():
    return {"status": "ok", "service": "rental-platform-api"}


@app.get("/health")
def health():
    return {"status": "healthy"}
