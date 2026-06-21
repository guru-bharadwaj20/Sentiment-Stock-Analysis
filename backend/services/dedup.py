"""Article deduplication via normalized title hashing.

Multiple RSS sources often republish the same Reuters/AP story.
Deduplication prevents those repeats from biasing the sentiment average.
"""
from __future__ import annotations
import hashlib
import re
import unicodedata
from typing import Any


def _canonical(title: str) -> str:
    title = unicodedata.normalize("NFKD", title.lower())
    title = re.sub(r"[^\w\s]", "", title)
    title = re.sub(r"\s+", " ", title).strip()
    return title


def _hash(title: str) -> str:
    return hashlib.md5(_canonical(title).encode()).hexdigest()


def deduplicate(articles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return articles with duplicate titles removed (first occurrence kept)."""
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for a in articles:
        key = _hash(a.get("title", ""))
        if key not in seen:
            seen.add(key)
            out.append(a)
    return out
