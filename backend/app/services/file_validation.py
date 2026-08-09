"""Shared upload validation: extension whitelist + size caps + MIME sniffing."""
import os

from fastapi import HTTPException, UploadFile

# Whitelists (lowercase, with leading dot)
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
AUDIO_EXTS = {".webm", ".ogg", ".mp3", ".m4a", ".opus", ".wav"}
IMAGE_MAX_BYTES = 15 * 1024 * 1024  # 15 MB
VOICE_MAX_BYTES = 15 * 1024 * 1024  # 15 MB
PROOF_MAX_BYTES = 10 * 1024 * 1024  # 10 MB

IMAGE_SIGNATURES = (
    (b"\xff\xd8\xff", "jpg"),     # JPEG
    (b"\x89PNG\r\n\x1a\n", "png"),  # PNG
    (b"GIF87a", "gif"),            # GIF
    (b"GIF89a", "gif"),            # GIF
    (b"RIFF", "webp"),             # WEBP (RIFF....WEBP)
)

AUDIO_SIGNATURES = (
    (b"OggS", "ogg/opus"),        # Ogg (Opus/Vorbis)
    (b"ID3", "mp3"),               # MP3 (ID3 header)
    (b"\xff\xfb", "mp3"),          # MP3 (raw frame sync)
    (b"fLaC", "flac"),
)


def _sniff_image_mime(data: bytes) -> str | None:
    for sig, name in IMAGE_SIGNATURES:
        if data.startswith(sig):
            return name
    # WEBP has RIFF header at 0 and "WEBP" at bytes 8-11
    if len(data) > 12 and data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "webp"
    return None


def _sniff_audio_mime(data: bytes) -> str | None:
    for sig, name in AUDIO_SIGNATURES:
        if data.startswith(sig):
            return name
    return None


def validate_image(file: UploadFile, data: bytes | None = None) -> bytes:
    """Validate an image upload: extension + size + content sniff."""
    if data is None:
        data = file.file.read()
    if len(data) > IMAGE_MAX_BYTES:
        raise HTTPException(status_code=400, detail=f"Image can't be larger than {IMAGE_MAX_BYTES // (1024 * 1024)} MB")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext and ext not in IMAGE_EXTS:
        raise HTTPException(status_code=400, detail="Unsupported image format. Allowed: JPG, PNG, WEBP, GIF.")

    if _sniff_image_mime(data) is None:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")
    return data


def validate_voice(file: UploadFile, data: bytes | None = None) -> bytes:
    """Validate a voice upload: extension + size + content sniff."""
    if data is None:
        data = file.file.read()
    if len(data) > VOICE_MAX_BYTES:
        raise HTTPException(status_code=400, detail=f"Voice message can't be larger than {VOICE_MAX_BYTES // (1024 * 1024)} MB")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext and ext not in AUDIO_EXTS:
        raise HTTPException(status_code=400, detail="Unsupported audio format.")

    if _sniff_audio_mime(data) is None:
        # .webm often has an EBML header, which we accept explicitly below.
        if not data.startswith(b"\x1aE\xdf\xa3"):
            raise HTTPException(status_code=400, detail="Uploaded file is not a valid audio message.")
    return data


def validate_proof(file: UploadFile, data: bytes | None = None) -> bytes:
    """Validate a verification-proof upload: accept images or PDFs."""
    if data is None:
        data = file.file.read()
    if len(data) > PROOF_MAX_BYTES:
        raise HTTPException(status_code=400, detail=f"File can't be larger than {PROOF_MAX_BYTES // (1024 * 1024)} MB")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext in {".pdf"}:
        if not data.startswith(b"%PDF"):
            raise HTTPException(status_code=400, detail="Uploaded file is not a valid PDF.")
        return data
    if ext in IMAGE_EXTS or not ext:
        if _sniff_image_mime(data) is None:
            raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")
        return data
    raise HTTPException(status_code=400, detail="Unsupported file format. Allowed: JPG, PNG, WEBP, GIF, PDF.")
