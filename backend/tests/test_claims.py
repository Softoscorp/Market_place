from app.services.ttl_cache import clear_cache


def test_clear_cache_runs():
    # smoke test: clearing the cache must not raise
    clear_cache()
    clear_cache()
    assert True