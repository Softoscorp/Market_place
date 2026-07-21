from app.database import SessionLocal
from app.models import User
from app.security import hash_password

db = SessionLocal()

users_to_seed = [
    {
        "email": "renter.demo@test.com",
        "password": "demo123",
        "name": "Demo Renter",
        "phone": "1234567890",
        "role": "renter",
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
        "email": "admin@test.com",
        "password": "adminpass123",
        "name": "Platform Admin",
        "phone": "1234567890",
        "role": "admin",
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
        user.password_hash = hash_password(user_data["password"])
        user.role = user_data["role"]
        print(f"Updated {user_data['email']} with password {user_data['password']}")
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
        print(f"Created {user_data['email']} with password {user_data['password']}")

db.commit()
print("Seeding complete.")
