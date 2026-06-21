"""Main analysis orchestrator.

Flow:
    cache hit?  → return cached result (with cache age metadata)
    get previous history (for trend)
    fetch stock info + all 7 news sources concurrently (timed)
    deduplicate articles (exact hash + fuzzy similarity)
    batch-score articles (VADER or FinBERT depending on SENTIMENT_MODEL)
    compute aggregate metrics (timed)
    compute confidence (6-factor formula)
    compute per-source contribution (with avg age)
    compute trend vs previous run
    generate verdict reasons
    persist to SQLite
    cache and return (with cache metadata)
"""
from __future__ import annotations

import asyncio
import logging
import math
import time
from datetime import datetime, timezone
from typing import Any

from config import MIN_SENTIMENT_THRESHOLD, SOURCE_WEIGHTS, DEFAULT_SOURCE_WEIGHT, CACHE_TTL_SECONDS
from fetchers.sources import fetch_all, fetch_stock_info_async
from services.dedup import deduplicate
from services import cache as _cache_module
from services.sentiment import batch_score, weighted_score, get_verdict, get_model_name
from db import history as db

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── confidence ─────────────────────────────────────────────────


def _confidence(
    avg_sentiment: float,
    volatility: float,
    consensus: float,
    total: int,
    articles_24h: int,
    articles_7d: int,
    avg_src_weight: float,
) -> float:
    """Multi-factor confidence score (0–100).

    Weights:
        Signal magnitude  35 %
        Consensus         25 %
        Volume            15 %
        Source quality    10 %
        Recency           10 %
        Stability          5 %
    """
    magnitude  = min(abs(avg_sentiment) * 2.0, 1.0)
    vol_factor = max(0.0, 1.0 - volatility * 2.0)
    volume     = min(total / 30.0, 1.0)
    recency    = min((articles_24h / max(articles_7d, 1)) * 2.0, 1.0)

    raw = (
        magnitude        * 0.35
        + consensus      * 0.25
        + volume         * 0.15
        + avg_src_weight * 0.10
        + recency        * 0.10
        + vol_factor     * 0.05
    ) * 100.0

    return round(min(raw, 100.0), 2)


# ── trend ──────────────────────────────────────────────────────


def _compute_trend(
    avg_sentiment: float,
    confidence: float,
    verdict: str,
    prev_history: list[dict],
) -> dict:
    if not prev_history:
        return {
            "direction": "new",
            "sentiment_delta": 0.0,
            "confidence_delta": 0.0,
            "prev_verdict": None,
            "verdict_changed": False,
        }

    prev             = prev_history[0]
    sentiment_delta  = avg_sentiment - prev["avg_sentiment"]
    confidence_delta = confidence    - prev["confidence_score"]

    if sentiment_delta > 0.03:
        direction = "improving"
    elif sentiment_delta < -0.03:
        direction = "deteriorating"
    else:
        direction = "stable"

    return {
        "direction":        direction,
        "sentiment_delta":  round(sentiment_delta,  4),
        "confidence_delta": round(confidence_delta, 2),
        "prev_verdict":     prev["verdict"],
        "verdict_changed":  prev["verdict"] != verdict,
    }


# ── verdict reasons ────────────────────────────────────────────


def _reasons(
    verdict: str,
    bullish_ratio: float,
    bearish_ratio: float,
    neutral_ratio: float,
    momentum: float,
    consensus: float,
    volatility: float,
    articles_24h: int,
    avg_sentiment: float,
) -> list[str]:
    out: list[str] = []

    if bullish_ratio > 0.60:
        out.append(f"{bullish_ratio * 100:.0f}% of articles are bullish")
    elif bearish_ratio > 0.60:
        out.append(f"{bearish_ratio * 100:.0f}% of articles are bearish")
    elif neutral_ratio > 0.50:
        out.append(f"Majority of coverage is neutral ({neutral_ratio * 100:.0f}%)")

    if abs(avg_sentiment) > 0.25:
        direction = "strongly positive" if avg_sentiment > 0 else "strongly negative"
        out.append(f"Average sentiment is {direction} ({avg_sentiment:+.2f})")
    elif abs(avg_sentiment) > 0.10:
        direction = "moderately positive" if avg_sentiment > 0 else "moderately negative"
        out.append(f"Average sentiment is {direction} ({avg_sentiment:+.2f})")

    if momentum > 0.08:
        out.append("Positive momentum — recent articles more bullish than older ones")
    elif momentum < -0.08:
        out.append("Negative momentum — recent articles more bearish than older ones")

    if consensus > 0.75:
        out.append("Strong consensus across news sources")
    elif consensus < 0.45:
        out.append("Mixed signals — sources disagree on direction")

    if volatility < 0.12:
        out.append("Low volatility — consistent sentiment signal")
    elif volatility > 0.30:
        out.append("High volatility — conflicting sentiment signals")

    if articles_24h >= 8:
        out.append(f"Active recent coverage ({articles_24h} articles in last 24 h)")
    elif articles_24h == 0:
        out.append("No articles found from the last 24 hours")

    if not out:
        out.append("Insufficient signal strength for a confident recommendation")

    return out


# ── main entry point ───────────────────────────────────────────


async def analyze_ticker(ticker: str) -> dict[str, Any]:
    ticker = ticker.upper()
    t_total = time.perf_counter()

    # 1. Cache check
    cached = _cache_module.get(ticker)
    if cached is not None:
        logger.info("Cache hit for %s", ticker)
        cache_meta = _cache_module.get_meta(ticker)
        cached["cached"] = True
        cached.setdefault("meta", {})["cached"] = True
        cached["cache_meta"] = cache_meta
        return cached

    logger.info("Starting analysis for %s (model=%s)", ticker, get_model_name())

    # 2. Previous history (before this run — used for trend)
    prev_history = db.get_history(ticker, limit=1)

    # 3. Parallel: stock info + all news sources
    t0 = time.perf_counter()
    stock_info, (raw_articles, source_health) = await asyncio.gather(
        fetch_stock_info_async(ticker),
        fetch_all(ticker, ticker),
    )
    fetch_s = time.perf_counter() - t0

    articles_raw = len(raw_articles)
    logger.info("Collected %d raw articles for %s", articles_raw, ticker)

    # 4. Deduplicate (exact hash + fuzzy similarity)
    t0 = time.perf_counter()
    raw_articles, dupes_removed = deduplicate(raw_articles)
    dedup_ms = (time.perf_counter() - t0) * 1000
    logger.info("Dedup: %d → %d (%d removed)", articles_raw, len(raw_articles), dupes_removed)

    sources_succeeded = sum(1 for h in source_health if h["status"] == "ok")

    if not raw_articles:
        return _empty_result(ticker, stock_info, source_health, articles_raw, dupes_removed, sources_succeeded)

    # 5. Batch-score all articles (efficient for FinBERT via single model call)
    t0 = time.perf_counter()
    now = _utcnow()

    article_pairs = [(art["title"], art.get("summary") or "") for art in raw_articles]
    compounds_batch = batch_score(article_pairs)

    scored: list[dict[str, Any]] = []
    for art, compound in zip(raw_articles, compounds_batch):
        if abs(compound) < MIN_SENTIMENT_THRESHOLD:
            continue

        pub: datetime = art.get("published", now)
        if pub.tzinfo is None:
            pub = pub.replace(tzinfo=timezone.utc)

        hours_old  = (now - pub).total_seconds() / 3600.0
        days_old   = hours_old / 24.0
        src_weight = SOURCE_WEIGHTS.get(art["source"], DEFAULT_SOURCE_WEIGHT)
        w_score    = weighted_score(compound, days_old, src_weight)

        scored.append({
            "text":          art["title"][:200],
            "compound":      compound,
            "weighted":      w_score,
            "source":        art["source"],
            "source_weight": src_weight,
            "sentiment":     "bullish" if compound > 0.05 else "bearish" if compound < -0.05 else "neutral",
            "published":     pub,
            "hours_old":     hours_old,
            "days_old":      days_old,
            "url":           art.get("url"),
        })

    score_ms = (time.perf_counter() - t0) * 1000

    if not scored:
        return _empty_result(ticker, stock_info, source_health, articles_raw, dupes_removed, sources_succeeded)

    # 6. Aggregate metrics
    t0 = time.perf_counter()
    total       = len(scored)
    compounds   = [a["compound"]      for a in scored]
    w_scores    = [a["weighted"]      for a in scored]
    src_weights = [a["source_weight"] for a in scored]

    avg_sentiment      = sum(compounds) / total
    weighted_sentiment = sum(w_scores)  / total
    final_metric       = weighted_sentiment

    variance   = sum((x - avg_sentiment) ** 2 for x in compounds) / total
    volatility = math.sqrt(variance)

    bullish_count = sum(1 for a in scored if a["sentiment"] == "bullish")
    bearish_count = sum(1 for a in scored if a["sentiment"] == "bearish")
    neutral_count = sum(1 for a in scored if a["sentiment"] == "neutral")

    bullish_ratio = bullish_count / total
    bearish_ratio = bearish_count / total
    neutral_ratio = neutral_count / total
    consensus     = max(bullish_ratio, bearish_ratio)

    recent_24h = [a for a in scored if a["hours_old"] <= 24]
    recent_7d  = [a for a in scored if a["days_old"]  <= 7]

    sentiment_24h = sum(a["compound"] for a in recent_24h) / len(recent_24h) if recent_24h else 0.0
    sentiment_7d  = sum(a["compound"] for a in recent_7d)  / len(recent_7d)  if recent_7d  else 0.0

    by_time = sorted(scored, key=lambda x: x["hours_old"])
    if len(by_time) >= 3:
        momentum = (
            sum(a["compound"] for a in by_time[:3]) / 3
            - sum(a["compound"] for a in by_time[-3:]) / 3
        )
    else:
        momentum = 0.0

    avg_age        = sum(a["hours_old"] for a in scored) / total
    avg_src_weight = sum(src_weights) / total

    # Per-source contribution (includes avg article age per source)
    src_stats: dict[str, dict] = {}
    total_weighted_abs = sum(abs(a["weighted"]) for a in scored) or 1.0
    for a in scored:
        src = a["source"]
        if src not in src_stats:
            src_stats[src] = {"articles": 0, "sentiment_sum": 0.0, "weighted_sum": 0.0, "age_sum": 0.0}
        src_stats[src]["articles"]      += 1
        src_stats[src]["sentiment_sum"] += a["compound"]
        src_stats[src]["weighted_sum"]  += abs(a["weighted"])
        src_stats[src]["age_sum"]       += a["hours_old"]

    source_contributions = {
        src: {
            "articles":         v["articles"],
            "avg_sentiment":    round(v["sentiment_sum"] / v["articles"], 4),
            "contribution_pct": round(v["weighted_sum"] / total_weighted_abs * 100, 1),
            "avg_age_hours":    round(v["age_sum"] / v["articles"], 1),
        }
        for src, v in src_stats.items()
    }

    agg_ms  = (time.perf_counter() - t0) * 1000
    total_s = time.perf_counter() - t_total

    # 7. Confidence
    confidence = _confidence(
        avg_sentiment, volatility, consensus, total,
        len(recent_24h), len(recent_7d), avg_src_weight,
    )

    # 8. Verdict
    verdict = get_verdict(final_metric)

    # 9. Reasons
    reasons = _reasons(
        verdict, bullish_ratio, bearish_ratio, neutral_ratio,
        momentum, consensus, volatility, len(recent_24h), avg_sentiment,
    )

    # 10. Trend vs previous run
    trend = _compute_trend(avg_sentiment, confidence, verdict, prev_history)

    # 11. Top comments (by absolute weighted score)
    top_15 = sorted(scored, key=lambda x: abs(x["weighted"]), reverse=True)[:15]
    top_comments = []
    for a in top_15:
        h = a["hours_old"]
        if h < 1:
            time_ago = f"{int(h * 60)}m ago"
        elif h < 24:
            time_ago = f"{int(h)}h ago"
        else:
            time_ago = f"{int(a['days_old'])}d ago"

        top_comments.append({
            "text":          a["text"],
            "score":         round(a["compound"], 3),
            "sentiment":     a["sentiment"],
            "source":        a["source"],
            "source_weight": round(a["source_weight"], 2),
            "time_ago":      time_ago,
            "hours_old":     round(h, 1),
            "url":           a.get("url"),
        })

    # 12. Persist
    db.save(ticker, verdict, confidence, avg_sentiment, total)

    # 13. Build result
    result: dict[str, Any] = {
        "ticker":              ticker,
        "verdict":             verdict,
        "confidence_score":    confidence,
        "verdict_reasons":     reasons,
        "model_used":          get_model_name(),
        "stats":               {"bullish": bullish_count, "bearish": bearish_count, "neutral": neutral_count},
        "top_comments":        top_comments,
        "stock_info":          stock_info,
        "advanced_stats": {
            "avg_sentiment":         round(avg_sentiment,      4),
            "weighted_sentiment":    round(weighted_sentiment,  4),
            "volatility":            round(volatility,          4),
            "momentum":              round(momentum,            4),
            "sentiment_24h":         round(sentiment_24h,       4),
            "sentiment_7d":          round(sentiment_7d,        4),
            "articles_24h":          len(recent_24h),
            "articles_7d":           len(recent_7d),
            "bullish_ratio":         round(bullish_ratio,  3),
            "bearish_ratio":         round(bearish_ratio,  3),
            "neutral_ratio":         round(neutral_ratio,  3),
            "consensus_strength":    round(consensus,      3),
            "avg_article_age_hours": round(avg_age,        1),
            "total_articles":        total,
            "deduplicated_count":    total,
        },
        "trend":                trend,
        "source_contributions": source_contributions,
        "source_health":        source_health,
        "meta": {
            "articles_raw":       articles_raw,
            "duplicates_removed": dupes_removed,
            "sources_succeeded":  sources_succeeded,
            "sources_total":      len(source_health),
            "cached":             False,
        },
        "cache_meta": {
            "age_s":        0.0,
            "expires_in_s": float(CACHE_TTL_SECONDS),
        },
        "timing": {
            "fetch_s":        round(fetch_s,   3),
            "dedup_ms":       round(dedup_ms,  1),
            "scoring_ms":     round(score_ms,  1),
            "aggregation_ms": round(agg_ms,    1),
            "total_s":        round(total_s,   3),
        },
        "history": db.get_history(ticker),
        "cached":  False,
    }

    _cache_module.set(ticker, result)
    return result


def _empty_result(
    ticker: str,
    stock_info: dict,
    source_health: list,
    articles_raw: int = 0,
    dupes_removed: int = 0,
    sources_succeeded: int = 0,
) -> dict[str, Any]:
    return {
        "ticker":              ticker,
        "verdict":             "INSUFFICIENT DATA",
        "confidence_score":    0.0,
        "verdict_reasons":     ["No articles with meaningful sentiment were found"],
        "model_used":          get_model_name(),
        "stats":               {"bullish": 0, "bearish": 0, "neutral": 0},
        "top_comments":        [],
        "stock_info":          stock_info,
        "advanced_stats":      None,
        "trend": {
            "direction": "new",
            "sentiment_delta": 0.0,
            "confidence_delta": 0.0,
            "prev_verdict": None,
            "verdict_changed": False,
        },
        "source_contributions": {},
        "source_health":        source_health,
        "meta": {
            "articles_raw":       articles_raw,
            "duplicates_removed": dupes_removed,
            "sources_succeeded":  sources_succeeded,
            "sources_total":      len(source_health),
            "cached":             False,
        },
        "cache_meta":  None,
        "timing":      None,
        "history":     db.get_history(ticker),
        "cached":      False,
    }
