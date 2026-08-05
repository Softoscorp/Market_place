from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
response = client.get("/listings")
print(response.status_code)
print(response.json())
