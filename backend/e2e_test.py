import io
import os

os.environ["DATABASE_URL"] = "sqlite:////tmp/test_rental_e2e.db"
os.environ["SECRET_KEY"] = "test-secret"
if os.path.exists("/tmp/test_rental_e2e.db"):
    os.remove("/tmp/test_rental_e2e.db")

from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app import models
from app.security import hash_password

client = TestClient(app)


def check(cond, msg):
    if not cond:
        raise AssertionError(f"FAILED: {msg}")
    print(f"OK: {msg}")


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# 1. Registration & auth
# ============================================================================
r = client.post("/auth/register", json={
    "email": "agent@test.com", "password": "password123",
    "name": "Mehmet Agent", "phone": "05331112233", "role": "agent", "language": "tr",
})
check(r.status_code == 201, "agent registers")
agent = r.json()["user"]
agent_headers = auth_headers(r.json()["access_token"])
check(agent.get("phone") == "05331112233", "owner's own /me response includes their correct phone number")

r = client.post("/auth/register", json={
    "email": "renter@test.com", "password": "password123",
    "name": "Alice Renter", "phone": "07911112233", "role": "renter", "language": "en",
})
check(r.status_code == 201, "renter registers")
renter = r.json()["user"]
renter_headers = auth_headers(r.json()["access_token"])

r = client.post("/auth/register", json={
    "email": "renter2@test.com", "password": "password123",
    "name": "Bob Renter", "phone": "07911119999", "role": "renter", "language": "en",
})
renter2_headers = auth_headers(r.json()["access_token"])

# Admin can't be self-registered
r = client.post("/auth/register", json={
    "email": "wannabe-admin@test.com", "password": "password123",
    "name": "X", "phone": "123", "role": "admin", "language": "en",
})
check(r.status_code == 422, "self-registering as admin is rejected")

# Duplicate email
r = client.post("/auth/register", json={
    "email": "agent@test.com", "password": "password123",
    "name": "Dup", "phone": "0", "role": "agent",
})
check(r.status_code == 400, "duplicate email rejected")

r = client.post("/auth/login", json={"email": "agent@test.com", "password": "wrong"})
check(r.status_code == 401, "wrong password rejected")

# Bootstrap an admin directly via DB (matches how create_admin.py works)
db = SessionLocal()
admin_user = models.User(
    email="admin@test.com", password_hash=hash_password("adminpass123"),
    name="Admin", phone="N/A", role=models.UserRole.admin, language="en",
)
db.add(admin_user)
db.commit()
db.refresh(admin_user)
db.close()

r = client.post("/auth/login", json={"email": "admin@test.com", "password": "adminpass123"})
check(r.status_code == 200, "admin logs in")
admin_headers = auth_headers(r.json()["access_token"])

# ============================================================================
# 2. Listings — creation, permissions, contact-info filtering
# ============================================================================
r = client.post("/listings", headers=renter_headers, json={
    "title": "Nice flat", "description": "Cozy", "price": 15000,
    "house_type": "1+1", "location": "Kyrenia",
})
check(r.status_code == 403, "renter cannot create a listing")

r = client.post("/listings", headers=agent_headers, json={
    "title": "Call me on 0533 123 45 67", "description": "Nice flat",
    "price": 15000, "house_type": "1+1", "location": "Kyrenia",
})
check(r.status_code == 400, "listing title with a phone number is rejected")

r = client.post("/listings", headers=agent_headers, json={
    "title": "Sea view 2+1 in Kyrenia", "description": "Fully furnished, 5 min from the beach.",
    "price": 18000, "house_type": "2+1", "location": "Kyrenia Centre",
    "furnished": True, "parking": True, "pet_friendly": False,
})
check(r.status_code == 201, "agent creates a listing")
listing1 = r.json()
listing1_id = listing1["id"]
check(listing1["agent"]["is_verified"] is False, "unverified agent shows is_verified=false on listing")
check("phone" not in listing1["agent"], "agent phone is not exposed on the listing")

r = client.post("/listings", headers=agent_headers, json={
    "title": "Studio near university", "description": "Small and cheap, great for students.",
    "price": 8000, "house_type": "1+0", "location": "Famagusta",
})
check(r.status_code == 201, "agent creates second listing")
listing2_id = r.json()["id"]

r = client.post("/listings", headers=agent_headers, json={
    "title": "Family home", "description": "Spacious 4+1 with garden.",
    "price": 35000, "house_type": "4+1", "location": "Nicosia",
})
check(r.status_code == 201, "agent creates third listing")
listing3_id = r.json()["id"]

# Photo upload
photo_bytes = b"\xff\xd8\xff\xe0fakejpegdata"
r = client.post(
    f"/listings/{listing1_id}/photos", headers=agent_headers,
    files={"file": ("photo.jpg", photo_bytes, "image/jpeg")},
)
check(r.status_code == 200 and len(r.json()["photos"]) == 1, "photo upload works")

# Ownership enforcement
r = client.patch(f"/listings/{listing1_id}", headers=renter_headers, json={"price": 1})
check(r.status_code == 403, "non-owner cannot edit listing")

r = client.patch(f"/listings/{listing1_id}", headers=agent_headers, json={"price": 17000})
check(r.status_code == 200 and r.json()["price"] == 17000, "owner can edit listing")

# ============================================================================
# 3. Search & filter
# ============================================================================
r = client.get("/listings")
check(r.json()["total"] == 3, "browse returns all 3 active listings")

r = client.get("/listings?house_type=2%2B1")
check(r.json()["total"] == 1 and r.json()["items"][0]["id"] == listing1_id, "filter by house_type")

r = client.get("/listings?min_price=10000&max_price=20000")
check(r.json()["total"] == 1, "filter by price range")

r = client.get("/listings?location=Famagusta")
check(r.json()["total"] == 1 and r.json()["items"][0]["id"] == listing2_id, "filter by location")

r = client.get("/listings?sort=price_asc")
check([i["id"] for i in r.json()["items"]] == [listing2_id, listing1_id, listing3_id], "sort by price ascending")

r = client.get("/listings?sort=price_desc")
check([i["id"] for i in r.json()["items"]] == [listing3_id, listing1_id, listing2_id], "sort by price descending")

# ============================================================================
# 4. Messaging — text, translation, voice
# ============================================================================
r = client.post("/messages/conversations", headers=agent_headers, json={
    "listing_id": listing1_id, "message": "hi"
})
check(r.status_code == 403, "agents cannot start conversations (renter-only)")

r = client.post("/messages/conversations", headers=renter_headers, json={
    "listing_id": listing1_id, "message": "Is this still available? My number is 07911234567"
})
check(r.status_code == 400, "starting a conversation with a phone number in the message is rejected")

r = client.post("/messages/conversations", headers=renter_headers, json={
    "listing_id": listing1_id, "message": "Is this still available? Interested in viewing."
})
check(r.status_code == 201, "renter starts conversation on listing1")
conv1 = r.json()
conv1_id = conv1["id"]
check(conv1["last_message"]["was_translated"] is False, "sender sees own message untranslated")

# renter (en) sent a message; agent (tr) should see a translated version
r = client.get(f"/messages/conversations/{conv1_id}/messages", headers=agent_headers)
check(r.status_code == 200 and len(r.json()) == 1, "agent sees the message")
msg = r.json()[0]
check(msg["was_translated"] is True, "agent (different language) sees a translated version")
check(msg["text"].startswith("[tr,"), "mock translator clearly labels output (no real API key in this sandbox)")

# renter re-reads own message — should NOT be marked as translated
r = client.get(f"/messages/conversations/{conv1_id}/messages", headers=renter_headers)
check(r.json()[0]["was_translated"] is False, "renter reading their own message sees the original")

# agent replies in Turkish
r = client.post(
    f"/messages/conversations/{conv1_id}/messages", headers=agent_headers,
    data={"body": "Evet, hala musait."},
)
check(r.status_code == 201, "agent sends a reply")

r = client.post(
    f"/messages/conversations/{conv1_id}/messages", headers=agent_headers,
    data={"body": "call me on whatsapp"},
)
check(r.status_code == 400, "agent's reply mentioning whatsapp is rejected")

# unread counts
r = client.get("/messages/conversations", headers=renter_headers)
check(r.json()[0]["unread_count"] == 1, "renter has 1 unread (the agent's reply) before opening thread")

r = client.get(f"/messages/conversations/{conv1_id}/messages", headers=renter_headers)
r2 = client.get("/messages/conversations", headers=renter_headers)
check(r2.json()[0]["unread_count"] == 0, "unread count resets after opening the thread")

# stranger can't read the conversation
r = client.get(f"/messages/conversations/{conv1_id}/messages", headers=renter2_headers)
check(r.status_code == 403, "non-participant cannot read the conversation")

# voice message
voice_bytes = b"\x1a\x45\xdf\xa3fakewebmdata"
r = client.post(
    f"/messages/conversations/{conv1_id}/voice", headers=renter_headers,
    files={"file": ("voice.webm", voice_bytes, "audio/webm")},
    data={"duration_seconds": "4.5"},
)
check(r.status_code == 201, "voice message upload works")
voice_msg = r.json()
check(voice_msg["message_type"] == "voice" and voice_msg["audio_url"], "voice message has an audio_url")
check(voice_msg["text"] is None, "voice message has no text field")

r = client.post(
    f"/messages/conversations/{conv1_id}/voice", headers=renter_headers,
    files={"file": ("voice.webm", voice_bytes, "audio/webm")},
    data={"duration_seconds": "999"},
)
check(r.status_code == 400, "overly long voice message is rejected")

# ============================================================================
# 5. Ratings — gated on having messaged first
# ============================================================================
r = client.post(f"/listings/{listing2_id}/ratings", headers=renter_headers, json={"stars": 5})
check(r.status_code == 400, "cannot rate an apartment without messaging its agent first")

r = client.post(f"/agents/{agent['id']}/ratings", headers=renter2_headers, json={"stars": 3})
check(r.status_code == 400, "cannot rate an agent without messaging them first")

r = client.post(f"/listings/{listing1_id}/ratings", headers=renter_headers, json={
    "stars": 5, "comment": "Lovely apartment, exactly as described."
})
check(r.status_code == 201, "renter rates the apartment after messaging about it")

r = client.post(f"/listings/{listing1_id}/ratings", headers=renter_headers, json={"stars": 4})
check(r.status_code == 400, "cannot rate the same apartment twice")

r = client.post(f"/agents/{agent['id']}/ratings", headers=renter_headers, json={
    "stars": 4, "comment": "Responsive and helpful."
})
check(r.status_code == 201, "renter rates the agent after messaging them")

r = client.get(f"/listings/{listing1_id}")
check("agent_average_rating" in r.json(), "listing object includes agent_average_rating")
r = client.get(f"/agents/{agent['id']}")
check(r.json()["average_rating"] == 4.0 and r.json()["rating_count"] == 1, "agent profile shows correct average rating")
check(len(r.json()["listings"]) == 3, "agent profile lists their active listings")

# ============================================================================
# 6. Admin — verify, suspend, ban, reports
# ============================================================================
r = client.get("/admin/users", headers=renter_headers)
check(r.status_code == 403, "non-admin cannot access admin endpoints")

r = client.patch(f"/admin/agents/{agent['id']}/verify", headers=admin_headers, json={"is_verified": True})
check(r.status_code == 200 and r.json()["is_verified"] is True, "admin verifies the agent")

r = client.get(f"/listings/{listing1_id}")
check(r.json()["agent"]["is_verified"] is True, "verified badge now shows on the listing")

r = client.post("/reports", headers=renter2_headers, json={
    "target_type": "listing", "target_id": listing3_id, "reason": "Suspicious, asks for deposit upfront via bank transfer",
})
check(r.status_code == 201, "user reports a listing")

r = client.get("/admin/reports", headers=admin_headers)
check(r.status_code == 200 and len(r.json()) == 1, "admin sees the report")
report_id = r.json()[0]["id"]

r = client.patch(f"/admin/reports/{report_id}", headers=admin_headers, json={"status": "reviewed"})
check(r.status_code == 200 and r.json()["status"] == "reviewed", "admin marks report as reviewed")

r = client.patch(
    f"/admin/users/{agent['id']}/status", headers=admin_headers,
    json={"account_status": "suspended", "reason": "Multiple scam reports pending review"},
)
check(r.status_code == 200, "admin suspends the agent")

r = client.post("/auth/login", json={"email": "agent@test.com", "password": "password123"})
check(r.status_code == 403, "suspended agent cannot log in")

r = client.get("/users/me", headers=agent_headers)
check(r.status_code == 403, "suspended agent's existing token is also rejected on subsequent requests")

r = client.patch(
    f"/admin/users/{agent['id']}/status", headers=admin_headers,
    json={"account_status": "active"},
)
check(r.status_code == 200, "admin reactivates the agent")

r = client.post("/auth/login", json={"email": "agent@test.com", "password": "password123"})
check(r.status_code == 200, "reactivated agent can log in again")

r = client.get(f"/listings/{listing1_id}")
check(r.status_code == 200 and "phone" not in r.json()["agent"] and "email" not in r.json()["agent"], "listing detail's embedded agent exposes no phone/email")

r = client.get(f"/agents/{agent['id']}")
check("phone" not in r.json()["agent"] and "email" not in r.json()["agent"], "agent public profile exposes no phone/email")

print("\nALL API-LEVEL CHECKS PASSED")
