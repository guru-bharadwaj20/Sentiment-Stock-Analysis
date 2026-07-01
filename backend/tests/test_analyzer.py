"""Tests for confidence formula, verdict reasons, and trend computation."""
import pytest
from services.analyzer import _confidence, _reasons, _compute_trend


# ── confidence ─────────────────────────────────────────────────

def test_confidence_in_range():
    c = _confidence(0.5, 0.1, 0.8, 25, 10, 20, 0.9)
    assert 0 <= c <= 100


def test_confidence_high_beats_low():
    high = _confidence(0.5, 0.05, 0.85, 40, 15, 30, 1.0)
    low  = _confidence(0.1, 0.40, 0.40,  5,  1,  5, 0.75)
    assert high > low, "Strong signal should beat weak signal"


def test_confidence_zero_articles():
    c = _confidence(0.0, 0.0, 0.5, 0, 0, 0, 0.8)
    assert 0 <= c < 30, "Zero articles → very low confidence"


def test_confidence_perfect_conditions():
    c = _confidence(0.5, 0.0, 1.0, 50, 20, 20, 1.0)
    assert c > 80, "Near-perfect conditions should yield high confidence"


def test_confidence_caps_at_100():
    c = _confidence(1.0, 0.0, 1.0, 100, 50, 50, 1.0)
    assert c <= 100


# ── reasons ────────────────────────────────────────────────────

def test_reasons_bullish_dominance():
    reasons = _reasons("BUY", 0.75, 0.10, 0.15, 0.1, 0.75, 0.10, 5, 0.3)
    assert any("bullish" in r.lower() for r in reasons)


def test_reasons_bearish_dominance():
    reasons = _reasons("SELL", 0.10, 0.75, 0.15, -0.15, 0.75, 0.10, 5, -0.3)
    assert any("bearish" in r.lower() for r in reasons)


def test_reasons_returns_list():
    reasons = _reasons("HOLD", 0.33, 0.33, 0.34, 0.0, 0.34, 0.2, 3, 0.01)
    assert isinstance(reasons, list)
    assert len(reasons) >= 1


def test_reasons_high_volatility_flagged():
    reasons = _reasons("HOLD", 0.4, 0.4, 0.2, 0.0, 0.4, 0.45, 2, 0.05)
    assert any("volatility" in r.lower() or "conflicting" in r.lower() for r in reasons)


# ── trend ──────────────────────────────────────────────────────

def test_trend_new_ticker():
    trend = _compute_trend(0.2, 65.0, "BUY", [])
    assert trend["direction"] == "new"
    assert trend["prev_verdict"] is None
    assert trend["verdict_changed"] is False


def test_trend_improving():
    prev = [{"avg_sentiment": 0.05, "confidence_score": 45.0, "verdict": "HOLD"}]
    trend = _compute_trend(0.25, 70.0, "BUY", prev)
    assert trend["direction"] == "improving"
    assert trend["sentiment_delta"] > 0
    assert trend["verdict_changed"] is True


def test_trend_deteriorating():
    prev = [{"avg_sentiment": 0.30, "confidence_score": 75.0, "verdict": "BUY"}]
    trend = _compute_trend(0.05, 50.0, "HOLD", prev)
    assert trend["direction"] == "deteriorating"
    assert trend["sentiment_delta"] < 0


def test_trend_stable():
    prev = [{"avg_sentiment": 0.20, "confidence_score": 65.0, "verdict": "BUY"}]
    trend = _compute_trend(0.21, 66.0, "BUY", prev)
    assert trend["direction"] == "stable"
    assert trend["verdict_changed"] is False


def test_trend_fields_present():
    prev = [{"avg_sentiment": 0.1, "confidence_score": 50.0, "verdict": "HOLD"}]
    trend = _compute_trend(0.2, 60.0, "BUY", prev)
    for key in ("direction", "sentiment_delta", "confidence_delta", "prev_verdict", "verdict_changed"):
        assert key in trend
