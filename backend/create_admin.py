"""
Creates (or promotes) an initial admin or customer-care account. There's no
public "register as admin" endpoint by design — privileged roles are granted
out-of-band via this script.

Usage:
    ADMIN_BOOTSTRAP_EMAIL=admin@example.com \
    ADMIN_BOOTSTRAP_PASSWORD=changeme123 \
    ADMIN_BOOTSTRAP_ROLE=customer_care \
    python3 create_admin.py

ADMIN_BOOTSTRAP_ROLE can be "admin" (default) or "customer_care".
If the account already exists it is promoted to the requested role.
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
    email = settings.admin_bootstrap_email or input("Account email: ").strip()
    password = settings.admin_bootstrap_password or input("Account password: ").strip()
    role_name = (os.getenv("ADMIN_BOOTSTRAP_ROLE", "admin") or "admin").strip().lower()

    role_map = {"admin": models.UserRole.admin, "customer_care": models.UserRole.customer_care}
    if role_name not in role_map:
        print("ADMIN_BOOTSTRAP_ROLE must be 'admin' or 'customer_care'.")
        sys.exit(1)
    role = role_map[role_name]

    if not email or not password:
        print("Email and password are required.")
        sys.exit(1)

    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            existing.role = role
            existing.account_status = models.AccountStatus.active
            db.commit()
            print(f"Promoted existing user '{email}' to {role_name}.")
            return

        user = models.User(
            email=email,
            password_hash=hash_password(password),
            name="Admin" if role == models.UserRole.admin else "Customer Care",
            phone="N/A",
            role=role,
            language="en",
        )
        db.add(user)
        db.commit()
        print(f"Created {role_name} account '{email}'.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
