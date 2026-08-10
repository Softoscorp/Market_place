"""
Translation is an external service dependency (per spec) — this module
defines a clean interface so the rest of the app doesn't care which
implementation is behind it.

- GoogleTranslateService: calls the real Google Cloud Translation API v2
  REST endpoint. Requires GOOGLE_TRANSLATE_API_KEY to be set.
- MockTranslationService: used automatically when no API key is configured,
  so the app is runnable/demoable without one. It does NOT actually
  translate — it clearly labels output as untranslated so nobody mistakes
  it for real translation in a demo.

IMPORTANT: this sandbox has no network access to translation.googleapis.com
(egress is restricted to package registries only), so GoogleTranslateService
below is written correctly against Google's documented REST API but could
NOT be tested against the live API in this environment. Everything that
uses it (caching, language routing, message display logic) IS tested, via
the mock. See README for how to verify the real API once you have a key.
"""
import requests

from .config import settings

_translation_cache: dict[tuple[str, str, str], str] = {}

GOOGLE_TRANSLATE_ENDPOINT = "https://translation.googleapis.com/language/translate/v2"


class TranslationService:
    def translate(self, text: str, source_lang: str | None, target_lang: str) -> str:
        raise NotImplementedError


class GoogleTranslateService(TranslationService):
    def __init__(self, api_key: str):
        self.api_key = api_key

    def translate(self, text: str, source_lang: str | None, target_lang: str) -> str:
        params: dict[str, str] = {"key": self.api_key}
        payload: dict[str, object] = {
            "q": text,
            "target": target_lang,
            "format": "text",
        }
        # Omit `source` entirely to let Google auto-detect the language.
        if source_lang and source_lang != "auto":
            params["source"] = source_lang
        response = requests.post(
            GOOGLE_TRANSLATE_ENDPOINT,
            params=params,
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        return data["data"]["translations"][0]["translatedText"]


class MockTranslationService(TranslationService):
    """No API key configured — clearly-labeled passthrough so the app is
    still demoable, without pretending to translate for real."""

    def translate(self, text: str, source_lang: str | None, target_lang: str) -> str:
        return f"[{target_lang}, untranslated — no translation API key configured] {text}"


_service_instance: TranslationService | None = None


def get_translation_service() -> TranslationService:
    global _service_instance
    if _service_instance is None:
        if settings.google_translate_api_key:
            _service_instance = GoogleTranslateService(settings.google_translate_api_key)
        else:
            _service_instance = MockTranslationService()
    return _service_instance


def reset_translation_service_cache():
    """Test helper — lets tests swap the API key/service mid-run."""
    global _service_instance
    _service_instance = None


def translate_with_cache(text: str, source_lang: str | None, target_lang: str, service: TranslationService | None = None) -> str:
    """Return a cached translation when possible to avoid repeated slow translation calls."""
    key = (text, source_lang or "auto", target_lang)
    if key in _translation_cache:
        return _translation_cache[key]

    active_service = service or get_translation_service()
    translated = active_service.translate(text, source_lang, target_lang)
    _translation_cache[key] = translated
    return translated


def reset_translation_cache():
    """Clear the in-process translation cache."""
    _translation_cache.clear()
