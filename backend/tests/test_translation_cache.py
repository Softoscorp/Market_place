import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.translation import TranslationService, reset_translation_cache, translate_with_cache


class CountingTranslationService(TranslationService):
    def __init__(self):
        self.calls = 0

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        self.calls += 1
        return f"{target_lang}:{text}"


def test_translate_with_cache_reuses_results_for_repeated_requests():
    reset_translation_cache()
    service = CountingTranslationService()

    first = translate_with_cache("hola", "es", "en", service=service)
    second = translate_with_cache("hola", "es", "en", service=service)

    assert first == "en:hola"
    assert second == "en:hola"
    assert service.calls == 1
