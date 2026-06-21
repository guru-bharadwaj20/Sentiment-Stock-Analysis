"""Main analysis orchestrator.

Flow:
    cache hit?  → return cached result
    fetch stock info (async)
    fetch all 7 news sources concurrently
    deduplicate articles
    score each article (VADER + recency + source weight)
    compute advanced stats
    compute confidence
    generate verdict reasons
    persist to SQLite
    cache result
    return
"""
from __future__ import annotations

import asyncio
import logging
import math
from datetime import datetime, timezone
from typing import Any

from config import MIN_SENTIMENT_THRESHOLD, SOURCE_WEIGHTS, DEFAULT_SOURCE_WEIGHT
from fetchers.sources import fetch_all, fetch_stock_info_async
from services.dedup import deduplicate
from services import cache as _cache_module
from services.sentiment import score as vader_score, weighted_score, get_verdict
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
    """
    Multi-factor confidence score (0–100).

    Weights:
        Signal magnitude  35 %  — how strong is the directional signal
        Consensus         25 %  — what fraction of articles agree on direction
        Volume            15 %  — more articles → more reliable estimate
        Source quality    10 %  — higher-credibility sources → more confidence
        Recency           10 %  — fresher news matters more
        Stability          5 %  — low volatility → consistent signal
    """
    magnitude  = min(abs(avg_sentiment) * 2.0, 1.0)
    vol_factor = max(0.0, 1.0 - volatility * 2.0)
    volume     = min(total / 30.0, 1.0)
    recency    = min((articles_24h / max(articles_7d, 1)) * 2.0, 1.0)

    score = (
        magnitude      * 0.35
        + consensus    * 0.25
        + volume       * 0.15
        + avg_src_weight * 0.10
        + recency      * 0.10
        + vol_factor   * 0.05
    ) * 100.0

    return round(min(score, 100.0), 2)


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

    # Direction signal
    if bullish_ratio > 0.60:
        out.append(f"{bullish_ratio * 100:.0f}% of articles are bullish")
    elif bearish_ratio > 0.60:
        out.append(f"{bearish_ratio * 100:.0f}% of articles are bearish")
    elif neutral_ratio > 0.50:
        out.append(f"Majority of coverage is neutral ({neutral_ratio * 100:.0f}%)")

    # Sentiment strength
    if abs(avg_sentiment) > 0.25:
        direction = "strongly positive" if avg_sentiment > 0 else "strongly negative"
        out.append(f"Average sentiment is {direction} ({avg_sentiment:+.2f})")
    elif abs(avg_sentiment) > 0.10:
        direction = "moderately positive" if avg_sentiment > 0 else "moderately negative"
        out.append(f"Average sentiment is {direction} ({avg_sentiment:+.2f})")

    # Momentum
    if momentum > 0.08:
        out.append("Positive momentum — recent articles more bullish than older ones")
    elif momentum < -0.08:
        out.append("Negative momentum — recent articles more bearish than older ones")

    # Consensus
    if consensus > 0.75:
        out.append("Strong consensus across news sources")
    elif consensus < 0.45:
        out.append("Mixed signals — sources disagree on direction")

    # Volatility / stability
    if volatility < 0.12:
        out.append("Low volatility — consistent sentiment signal")
    elif volatility > 0.30:
        out.append("High volatility — conflicting sentiment signals")

    # Recency
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

    # 1. Cache check
    cached = _cache_module.get(ticker)
    if cached is not None:
        logger.info("Cache hit for %s", ticker)
        cached["cached"] = True
        return cached

    logger.info("Starting analysis for %s", ticker)

    # 2. Parallel: stock info + all news (each manages its own httpx client)
    stock_info, raw_articles = await asyncio.gather(
        fetch_stock_info_async(ticker),
        fetch_all(ticker, ticker),   # use ticker as company fallback; Google/Bing still work well
    )

    company_name = stock_info["name"]
    logger.info("Collected %d raw articles for %s", len(raw_articles), ticker)

    # 3. Deduplicate
    articles_before = len(raw_articles)
    raw_articles = deduplicate(raw_articles)
    logger.info("Deduplication: %d → %d articles", articles_before, len(raw_articles))

    if not raw_articles:
        return _empty_result(ticker, stock_info)

    # 4. Score each article
    now = _utcnow()
    scored: list[dict[str, Any]] = []

    for art in raw_articles:
        text     = f"{art['title']} {art['summary']}"
        compound = vader_score(text)

        if abs(compound) < MIN_SENTIMENT_THRESHOLD:
            continue

        pub: datetime = art.get("published", now)
        if pub.tzinfo is None:
            pub = pub.replace(tzinfo=timezone.utc)

        hours_old = (now - pub).total_seconds() / 3600.0
        days_old  = hours_old / 24.0

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

    if not scored:
        return _empty_result(ticker, stock_info)

    # 5. Aggregate metrics
    total = len(scored)
    compounds    = [a["compound"]      for a in scored]
    w_scores     = [a["weighted"]      for a in scored]
    src_weights  = [a["source_weight"] for a in scored]

    avg_sentiment      = sum(compounds) / total
    weighted_sentiment = sum(w_scores)  / total
    final_metric       = weighted_sentiment

    variance  = sum((x - avg_sentiment) ** 2 for x in compounds) / total
    volatility = math.sqrt(variance)

    bullish_count = sum(1 for a in scored if a["sentiment"] == "bullish")
    bearish_count = sum(1 for a in scored if a["sentiment"] == "bearish")
    neutral_count = sum(1 for a in scored if a["sentiment"] == "neutral")

    bullish_ratio  = bullish_count / total
    bearish_ratio  = bearish_count / total
    neutral_ratio  = neutral_count / total
    consensus      = max(bullish_ratio, bearish_ratio)

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

    avg_age         = sum(a["hours_old"]     for a in scored) / total
    avg_src_weight  = sum(src_weights) / total

    # 6. Confidence
    confidence = _confidence(
        avg_sentiment, volatility, consensus, total,
        len(recent_24h), len(recent_7d), avg_src_weight,
    )

    # 7. Verdict
    verdict = get_verdict(final_metric)

    # 8. Reasons
    reasons = _reasons(
        verdict, bullish_ratio, bearish_ratio, neutral_ratio,
        momentum, consensus, volatility, len(recent_24h), avg_sentiment,
    )

    # 9. Top comments (sorted by absolute weighted score)
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

    # 10. Persist
    db.save(ticker, verdict, confidence, avg_sentiment, total)

    # 11. Build result
    result: dict[str, Any] = {
        "ticker":          ticker,
        "verdict":         verdict,
        "confidence_score": confidence,
        "verdict_reasons": reasons,
        "stats": {
            "bullish": bullish_count,
            "bearish": bearish_count,
            "neutral": neutral_count,
        },
        "top_comments": top_comments,
        "stock_info": stock_info,
        "advanced_stats": {
            "avg_sentiment":      round(avg_sentiment,      4),
            "weighted_sentiment": round(weighted_sentiment,  4),
            "volatility":         round(volatility,          4),
            "momentum":           round(momentum,            4),
            "sentiment_24h":      round(sentiment_24h,       4),
            "sentiment_7d":       round(sentiment_7d,        4),
            "articles_24h":       len(recent_24h),
            "articles_7d":        len(recent_7d),
            "bullish_ratio":      round(bullish_ratio,  3),
            "bearish_ratio":      round(bearish_ratio,  3),
            "neutral_ratio":      round(neutral_ratio,  3),
            "consensus_strength": round(consensus,      3),
            "avg_article_age_hours": round(avg_age,     1),
            "total_articles":     total,
            "deduplicated_count": total,
        },
        "history": db.get_history(ticker),
        "cached":  False,
    }

    _cache_module.set(ticker, result)
    return result


def _empty_result(ticker: str, stock_info: dict) -> dict[str, Any]:
    return {
        "ticker":          ticker,
        "verdict":         "INSUFFICIENT DATA",
        "confidence_score": 0.0,
        "verdict_reasons": ["No articles with meaningful sentiment were found"],
        "stats":           {"bullish": 0, "bearish": 0, "neutral": 0},
        "top_comments":    [],
        "stock_info":      stock_info,
        "advanced_stats":  None,
        "history":         db.get_history(ticker),
        "cached":          False,
    }
