"""Tests for article deduplication (exact + fuzzy)."""
import pytest
from services.dedup import deduplicate


def _art(title: str) -> dict:
    return {"title": title, "summary": "", "source": "Test", "url": None}


def test_exact_duplicates_removed():
    arts = [_art("Apple beats earnings"), _art("Apple beats earnings")]
    result, removed = deduplicate(arts)
    assert len(result) == 1
    assert removed == 1


def test_case_insensitive():
    arts = [_art("Apple Beats Earnings"), _art("apple beats earnings")]
    result, removed = deduplicate(arts)
    assert len(result) == 1
    assert removed == 1


def test_punctuation_normalized():
    arts = [_art("Apple's Q2 Earnings Beat!"), _art("Apples Q2 Earnings Beat")]
    result, removed = deduplicate(arts)
    assert len(result) == 1
    assert removed == 1


def test_fuzzy_near_duplicates():
    arts = [
        _art("Tesla reports record Q2 deliveries beating expectations"),
        _art("Tesla reports record Q2 deliveries, beating expectations by 5%"),
    ]
    result, removed = deduplicate(arts)
    assert len(result) == 1, f"Near-duplicate should be removed; got {len(result)} articles"


def test_distinct_articles_preserved():
    arts = [
        _art("Tesla surges on earnings beat"),
        _art("Apple faces antitrust investigation"),
    ]
    result, removed = deduplicate(arts)
    assert len(result) == 2
    assert removed == 0


def test_empty_input():
    result, removed = deduplicate([])
    assert result == []
    assert removed == 0


def test_single_article():
    arts = [_art("Only one article")]
    result, removed = deduplicate(arts)
    assert len(result) == 1
    assert removed == 0


def test_first_occurrence_kept():
    arts = [_art("First Tesla article"), _art("First Tesla article")]
    result, _ = deduplicate(arts)
    assert result[0]["title"] == "First Tesla article"


def test_returns_tuple():
    result = deduplicate([_art("Test")])
    assert isinstance(result, tuple)
    assert len(result) == 2


def test_removed_count_correct():
    arts = [_art("Same title")] * 5
    result, removed = deduplicate(arts)
    assert len(result) == 1
    assert removed == 4
