"""
Creates/promotes privileged accounts from environment variables.

This intentionally does NOT hardcode any demo credentials. To create an
admin or customer-care account run:

    ADMIN_BOOTSTRAP_EMAIL=you@example.com \
    ADMIN_BOOTSTRAP_PASSWORD=... \
    ADMIN_BOOTSTRAP_ROLE=admin python3 create_admin.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import User, UserRole
from app.security import hash_password

db = SessionLocal()

email = os.getenv("ADMIN_BOOTSTRAP_EMAIL", "").strip()
password = os.getenv("ADMIN_BOOTSTRAP_PASSWORD", "").strip()
role_name = (os.getenv("ADMIN_BOOTSTRAP_ROLE", "admin") or "admin").strip().lower()

role_map = {"admin": UserRole.admin, "customer_care": UserRole.customer_care}

if not email or not password:
    print("ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD must be set. Nothing to do.")
    sys.exit(0)

if role_name not in role_map:
    print(f"Unknown role '{role_name}'. Use 'admin' or 'customer_care'. Nothing to do.")
    sys.exit(0)
role = role_map[role_name]

user = db.query(User).filter_by(email=email).first()
if user:
    user.role = role
    user.account_status = "active"
    print(f"Promoted {email} to {role_name}.")
else:
    db.add(User(
        email=email,
        password_hash=hash_password(password),
        name="Admin" if role == UserRole.admin else "Customer Care",
        phone="N/A",
        role=role,
        language="en",
    ))
    print(f"Created {role_name} account {email}.")

db.commit()
db.close()
print("Done.")
