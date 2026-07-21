"""
Creates (or promotes) the initial admin account. There's no public
"register as admin" endpoint by design — admins are created out-of-band.

Usage:
    ADMIN_BOOTSTRAP_EMAIL=admin@example.com \
    ADMIN_BOOTSTRAP_PASSWORD=changeme123 \
    python3 create_admin.py

Or just edit the two variables below and run it directly.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, Base, engine
from app import models
from app.security import hash_password
from app.config import settings

Base.metadata.create_all(bind=engine)


def main():
    email = settings.admin_bootstrap_email or input("Admin email: ").strip()
    password = settings.admin_bootstrap_password or input("Admin password: ").strip()

    if not email or not password:
        print("Email and password are required.")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            existing.role = models.UserRole.admin
            existing.account_status = models.AccountStatus.active
            db.commit()
            print(f"Promoted existing user '{email}' to admin.")
            return

        admin = models.User(
            email=email,
            password_hash=hash_password(password),
            name="Admin",
            phone="N/A",
            role=models.UserRole.admin,
            language="en",
        )
        db.add(admin)
        db.commit()
        print(f"Created admin account '{email}'.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
