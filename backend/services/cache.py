"""Simple in-memory TTL cache keyed by ticker symbol."""
from __future__ import annotations
import time
from typing import Any, Optional

from config import CACHE_TTL_SECONDS


class TTLCache:
    def __init__(self, ttl: int = CACHE_TTL_SECONDS) -> None:
        self._store: dict[str, tuple[Any, float]] = {}
        self._ttl = ttl

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.monotonic() >= expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._store[key] = (value, time.monotonic() + self._ttl)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()

    def size(self) -> int:
        now = time.monotonic()
        return sum(1 for _, exp in self._store.values() if now < exp)


_cache = TTLCache()


def get(ticker: str) -> Optional[Any]:
    return _cache.get(ticker)


def set(ticker: str, value: Any) -> None:
    _cache.set(ticker, value)


def clear() -> None:
    _cache.clear()


def size() -> int:
    return _cache.size()
