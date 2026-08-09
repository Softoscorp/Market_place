"""Small in-memory TTL cache for hot, read-only public endpoints."""
import threading
import time
from functools import wraps

from sqlalchemy.orm import Session


def _primitive(value):
    """Reduce an arg to a hashable primitive; drop unhashable ones (Sessions, ORM)."""
    if isinstance(value, Session):
        # SQLAlchemy sessions ARE hashable (by identity), so we must explicitly
        # exclude them — otherwise the cache key changes on every request and
        # the cache never hits.
        return f"<{type(value).__name__}>"
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, (list, tuple)):
        return tuple(_primitive(v) for v in value)
    if isinstance(value, dict):
        return tuple(sorted((k, _primitive(v)) for k, v in value.items()))
    # Unhashable objects (dependency results) — skip from the key.
    try:
        hash(value)
        return f"<{type(value).__name__}:{id(value)}>"
    except TypeError:
        return f"<{type(value).__name__}>"


class _TTLCache:
    def __init__(self):
        self._store = {}
        self._lock = threading.Lock()

    def get(self, key):
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                return None
            value, expires_at = entry
            if expires_at < time.time():
                self._store.pop(key, None)
                return None
            return value

    def set(self, key, value, ttl_seconds):
        with self._lock:
            self._store[key] = (value, time.time() + ttl_seconds)


_cache = _TTLCache()


def ttl_cache(ttl_seconds: int = 15):
    """Cache a sync function's return value in-memory for `ttl_seconds`.

    The cache key is built from primitive (hashable) argument values only.
    Use ONLY for read-only endpoints; never for anything mutating state.
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Skip cache entirely if the caller explicitly passes
            # _cache_bust=True (e.g. admin previews).
            if kwargs.pop("_cache_bust", False):
                return func(*args, **kwargs)

            key = (func.__module__, func.__name__, tuple(_primitive(a) for a in args),
                   tuple(sorted((k, _primitive(v)) for k, v in kwargs.items())))
            cached = _cache.get(key)
            if cached is not None:
                return cached
            result = func(*args, **kwargs)
            _cache.set(key, result, ttl_seconds)
            return result

        return wrapper

    return decorator
