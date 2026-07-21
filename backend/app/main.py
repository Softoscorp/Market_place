import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import Base, engine
from .routers import auth, users, listings, messaging, ratings, admin, reports, roommates

Base.metadata.create_all(bind=engine)

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


@app.get("/")
def root():
    return {"status": "ok", "service": "rental-platform-api"}


@app.get("/health")
def health():
    return {"status": "healthy"}
