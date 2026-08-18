"""Free, self-hosted quality checks for verification documents.

Runs entirely on the backend with Pillow + numpy — no external AI vendor.
Checks:
  - blur:     Laplacian variance of the grayscale image (low variance = blurry)
  - brightness: mean luminance too dark or overexposed
  - white background: for selfies, a wide border band should be near-white

Each check returns a machine-readable `code` that the frontend maps to a
localized message, plus numeric metrics stored for the admin to see.
"""
import io
from typing import Any

from fastapi import HTTPException
from PIL import Image, ImageFilter, ImageStat

# Laplacian variance below this → image is too blurry
BLUR_VAR_THRESHOLD = 100.0
# Mean luminance below this → too dark; above → overexposed
DARK_LUMINANCE_THRESHOLD = 40.0
BRIGHT_LUMINANCE_THRESHOLD = 245.0
# Fraction of border pixels near-white required for a selfie
WHITE_BG_MIN_RATIO = 0.80
WHITE_BG_PIXEL_THRESHOLD = 220

_MAX_DIMENSION = 1000


def _open_rgb(data: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(data))
    img = img.convert("RGB")
    # Downscale huge photos so thresholds behave consistently.
    img.thumbnail((_MAX_DIMENSION, _MAX_DIMENSION))
    return img


def _laplacian_variance(gray: Image.Image) -> float:
    laplacian = gray.filter(ImageFilter.Kernel((3, 3), (0, 1, 0, 1, -4, 1, 0, 1, 0), scale=1))
    stat = ImageStat.Stat(laplacian)
    return float(stat.var[0])


def _mean_luminance(gray: Image.Image) -> float:
    return float(ImageStat.Stat(gray).mean[0])


def _white_background_ratio(img: Image.Image) -> float:
    w, h = img.size
    border_w = max(8, int(w * 0.08))
    border_h = max(8, int(h * 0.08))
    left = img.crop((0, 0, border_w, h))
    right = img.crop((w - border_w, 0, w, h))
    top = img.crop((0, 0, w, border_h))
    bottom = img.crop((0, h - border_h, w, h))
    px = list(left.getdata()) + list(right.getdata()) + list(top.getdata()) + list(bottom.getdata())
    if not px:
        return 0.0
    white = sum(1 for r, g, b in px if min(r, g, b) >= WHITE_BG_PIXEL_THRESHOLD)
    return white / len(px)


def _check_image(data: bytes, doc_type: str) -> dict[str, Any]:
    img = _open_rgb(data)
    gray = img.convert("L")

    blur_var = _laplacian_variance(gray)
    luminance = _mean_luminance(gray)

    issues: list[str] = []
    metrics: dict[str, Any] = {"blur_variance": round(blur_var, 1), "luminance": round(luminance, 1)}

    if blur_var < BLUR_VAR_THRESHOLD:
        issues.append("verify_photo_blurry")
    if luminance < DARK_LUMINANCE_THRESHOLD:
        issues.append("verify_photo_dark")
    elif luminance > BRIGHT_LUMINANCE_THRESHOLD:
        issues.append("verify_photo_overexposed")

    if doc_type == "selfie":
        white_ratio = _white_background_ratio(img)
        metrics["white_background_ratio"] = round(white_ratio, 3)
        if white_ratio < WHITE_BG_MIN_RATIO:
            issues.append("verify_white_background")

    return {"ok": len(issues) == 0, "issues": issues, "metrics": metrics}


def check_proof_quality(data: bytes, doc_type: str) -> dict[str, Any]:
    """Runs quality checks on an uploaded image. PDFs bypass image checks.

    Returns {"ok": bool, "issues": [codes], "metrics": {...}}.
    """
    if doc_type not in ("selfie", "passport"):
        doc_type = "selfie"
    try:
        return _check_image(data, doc_type)
    except HTTPException:
        raise
    except Exception as exc:  # malformed/unsupported image → let admin review manually
        return {"ok": True, "issues": [], "metrics": {"error": str(exc)}, "skipped": True}


def quality_error_detail(result: dict[str, Any]) -> str:
    """Builds the FastAPI error detail from the first failing quality check."""
    if not result.get("issues"):
        return ""
    first = result["issues"][0]
    return f"{first}:{result['metrics'].get('blur_variance', '')}:{result['metrics'].get('luminance', '')}"