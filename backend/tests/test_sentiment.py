"""Tests for VADER sentiment scoring and financial lexicon."""
import pytest
from services.sentiment import score, weighted_score, get_verdict, recency_multiplier


def test_positive_headline():
    s = score("Tesla crushes earnings, beats estimates by 20%, record profits")
    assert s > 0.2, f"Expected > 0.2, got {s}"


def test_negative_headline():
    s = score("Company declares bankruptcy, fraud investigation launched, stock plunges")
    assert s < -0.3, f"Expected < -0.3, got {s}"


def test_neutral_headline():
    s = score("Company reports quarterly results in line with expectations")
    assert -0.15 < s < 0.15, f"Expected near-neutral, got {s}"


def test_financial_lexicon_bullish():
    s = score("Analysts remain bullish on the stock's long-term outlook")
    assert s > 0, f"'bullish' should yield positive score, got {s}"


def test_financial_lexicon_bearish():
    s = score("Stock faces downgrade as bearish sentiment dominates")
    assert s < 0, f"'bearish'/'downgrade' should yield negative score, got {s}"


def test_financial_lexicon_bankruptcy():
    s = score("Filed for bankruptcy")
    assert s < -0.3, f"'bankruptcy' should be very negative, got {s}"


def test_recency_today_vs_week_old():
    recent = recency_multiplier(0.0)
    old    = recency_multiplier(6.5)
    assert recent > old, "Today's article should have higher recency weight"


def test_recency_very_old_is_positive():
    w = recency_multiplier(10.0)
    assert w > 0, "Even old articles should have a positive (non-zero) weight"


def test_recency_decreasing_monotone():
    weights = [recency_multiplier(float(d)) for d in range(8)]
    for i in range(len(weights) - 1):
        assert weights[i] >= weights[i + 1], f"Recency should be non-increasing, failed at day {i}"


def test_weighted_score_preserves_sign():
    assert weighted_score(0.5, 1.0, 0.9) > 0
    assert weighted_score(-0.5, 1.0, 0.9) < 0


def test_get_verdict_thresholds():
    assert get_verdict(0.25) == "STRONG BUY"
    assert get_verdict(0.12) == "BUY"
    assert get_verdict(0.00) == "HOLD"
    assert get_verdict(-0.12) == "SELL"
    assert get_verdict(-0.30) == "STRONG SELL"


def test_get_verdict_boundaries():
    assert get_verdict(0.20) == "STRONG BUY"
    assert get_verdict(0.05) == "BUY"
    assert get_verdict(-0.05) == "SELL"
    assert get_verdict(-0.20) == "STRONG SELL"
