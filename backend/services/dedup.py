"""Article deduplication: exact title-hash (fast) + fuzzy similarity (near-duplicates).

Two-pass approach:
  1. MD5 of normalized title — O(1) lookup, catches wire-identical stories.
  2. SequenceMatcher ratio — catches near-duplicates like "Tesla Q2 beats estimates"
     vs "Tesla Q2 beats estimates by 8%", with a conservative 0.82 threshold to avoid
     false positives on distinct articles that happen to share a template.
"""
from __future__ import annotations

import hashlib
import re
import unicodedata
from difflib import SequenceMatcher
from typing import Any

FUZZY_THRESHOLD: float = 0.82


def _canonical(title: str) -> str:
    title = unicodedata.normalize("NFKD", title.lower())
    title = re.sub(r"[^\w\s]", "", title)
    title = re.sub(r"\s+", " ", title).strip()
    return title


def _hash(title: str) -> str:
    return hashlib.md5(_canonical(title).encode()).hexdigest()


def _similar(a: str, b: str) -> bool:
    if not a or not b:
        return False
    # Pre-filter: lengths must be within 40% of each other
    if min(len(a), len(b)) / max(len(a), len(b)) < 0.60:
        return False
    return SequenceMatcher(None, a, b).ratio() >= FUZZY_THRESHOLD


def deduplicate(articles: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    """Return (deduped_articles, removed_count).

    First-occurrence semantics: the first copy of any near-duplicate cluster is kept.
    """
    seen_hashes: set[str] = set()
    seen_titles: list[str] = []   # canonical titles kept so far (for fuzzy scan)
    out: list[dict[str, Any]] = []

    for a in articles:
        raw   = a.get("title", "")
        canon = _canonical(raw)
        h     = hashlib.md5(canon.encode()).hexdigest()

        if h in seen_hashes:
            continue

        if any(_similar(canon, t) for t in seen_titles):
            continue

        seen_hashes.add(h)
        seen_titles.append(canon)
        out.append(a)

    return out, len(articles) - len(out)
