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

    def get_meta(self, key: str) -> Optional[dict]:
        """Return cache timing metadata without consuming the entry."""
        entry = self._store.get(key)
        if entry is None:
            return None
        _, expires_at = entry
        now = time.monotonic()
        if now >= expires_at:
            return None
        remaining = expires_at - now
        return {
            "age_s":        round(self._ttl - remaining, 1),
            "expires_in_s": round(remaining, 1),
        }

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


def get_meta(ticker: str) -> Optional[dict]:
    return _cache.get_meta(ticker)


def set(ticker: str, value: Any) -> None:
    _cache.set(ticker, value)


def delete(ticker: str) -> None:
    _cache.delete(ticker)


def clear() -> None:
    _cache.clear()


def size() -> int:
    return _cache.size()
