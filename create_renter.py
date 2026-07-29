from app.database import SessionLocal
from app.models import User, UserRole

db = SessionLocal()
u = User(name="Test Renter", email="renter@rental.com", password_hash="blah", role=UserRole.renter)
db.add(u)
db.commit()
print("Renter created:", u.id)
