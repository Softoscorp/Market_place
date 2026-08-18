import io

import numpy as np
from PIL import Image, ImageFilter

from app.services.proof_quality import check_proof_quality


def _png(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


def test_clear_selfie_on_white_background_passes():
    img = Image.new("RGB", (400, 500), (255, 255, 255))
    px = img.load()
    for x in range(120, 280):
        for y in range(120, 380):
            px[x, y] = (80, 60, 40)
    result = check_proof_quality(_png(img), "selfie")
    assert result["ok"] is True
    assert result["issues"] == []


def test_dark_photo_rejected():
    dark = Image.new("RGB", (400, 500), (20, 15, 15))
    result = check_proof_quality(_png(dark), "selfie")
    assert result["ok"] is False
    assert "verify_photo_dark" in result["issues"]


def test_selfie_without_white_background_rejected():
    bg = Image.new("RGB", (400, 500), (120, 180, 90))
    result = check_proof_quality(_png(bg), "selfie")
    assert result["ok"] is False
    assert "verify_white_background" in result["issues"]


def test_blurred_texture_detected_as_blurry():
    rng = np.random.default_rng(0)
    base = rng.integers(60, 220, (400, 500, 3), dtype=np.uint8)
    sharp = Image.fromarray(base, "RGB")
    blurred = sharp.filter(ImageFilter.GaussianBlur(radius=14))
    sharp_result = check_proof_quality(_png(sharp), "selfie")
    blur_result = check_proof_quality(_png(blurred), "selfie")
    assert sharp_result["metrics"]["blur_variance"] > blur_result["metrics"]["blur_variance"]
    # a very heavy blur should push variance below the sharp baseline
    assert blur_result["metrics"]["blur_variance"] < sharp_result["metrics"]["blur_variance"] * 0.2


def test_passport_skips_white_background_check():
    # passport doesn't require a white background
    img = Image.new("RGB", (400, 500), (120, 180, 90))
    result = check_proof_quality(_png(img), "passport")
    assert "verify_white_background" not in result["issues"]