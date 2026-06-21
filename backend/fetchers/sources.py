"""Async news fetchers — one per source, all returning the same Article dict shape.

Article dict keys:
    title:     str
    summary:   str
    url:       str | None
    source:    str
    published: datetime (UTC-aware)

fetch_all() fires all 7 fetchers concurrently and returns
(articles, source_health) where source_health is a list of timing/status dicts.
Individual fetchers are pure async functions with no try/except — errors are
caught by the _fetch_one wrapper inside fetch_all, which records them to
source_health without aborting the other fetchers.
"""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone, timedelta
from typing import Any

import feedparser
import httpx
from bs4 import BeautifulSoup

from config import MAX_ARTICLES_PER_SOURCE, NEWS_FETCH_TIMEOUT_CONNECT, NEWS_FETCH_TIMEOUT_READ

logger = logging.getLogger(__name__)

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
_TIMEOUT = httpx.Timeout(
    connect=NEWS_FETCH_TIMEOUT_CONNECT,
    read=NEWS_FETCH_TIMEOUT_READ,
    write=4.0,
    pool=None,
)

# ── helpers ────────────────────────────────────────────────────


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _parse_struct_time(st: Any) -> datetime:
    if st is None:
        return _utcnow()
    try:
        return datetime(*st[:6], tzinfo=timezone.utc)
    except Exception:
        return _utcnow()


def _parse_iso(s: str) -> datetime:
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return _utcnow()


async def _fetch_rss(client: httpx.AsyncClient, url: str) -> feedparser.FeedParserDict:
    resp = await client.get(url, headers={"User-Agent": _UA})
    resp.raise_for_status()
    return feedparser.parse(resp.content)


# ── individual fetchers (no try/except — errors handled by fetch_all wrapper) ──


async def fetch_google_news(client: httpx.AsyncClient, ticker: str, company: str) -> list[dict]:
    query = company if company != ticker else ticker
    url = f"https://news.google.com/rss/search?q={query}+stock&hl=en-US&gl=US&ceid=US:en"
    feed = await _fetch_rss(client, url)
    return [
        {
            "title":     e.title,
            "summary":   e.get("summary", ""),
            "url":       e.get("link"),
            "source":    "Google News",
            "published": _parse_struct_time(e.get("published_parsed")),
        }
        for e in feed.entries[:MAX_ARTICLES_PER_SOURCE]
    ]


async def fetch_bing_news(client: httpx.AsyncClient, ticker: str, company: str) -> list[dict]:
    query = company if company != ticker else ticker
    url = f"https://www.bing.com/news/search?q={query}+stock&format=rss"
    feed = await _fetch_rss(client, url)
    return [
        {
            "title":     e.title,
            "summary":   e.get("description", e.get("summary", "")),
            "url":       e.get("link"),
            "source":    "Bing News",
            "published": _parse_struct_time(e.get("published_parsed")),
        }
        for e in feed.entries[:MAX_ARTICLES_PER_SOURCE]
    ]


async def fetch_yahoo_finance(client: httpx.AsyncClient, ticker: str) -> list[dict]:
    url = f"https://finance.yahoo.com/quote/{ticker}/news"
    resp = await client.get(url, headers={"User-Agent": _UA})
    resp.raise_for_status()
    soup = BeautifulSoup(resp.content, "html.parser")
    articles = []
    for h3 in soup.find_all("h3", limit=MAX_ARTICLES_PER_SOURCE):
        title = h3.get_text(strip=True)
        if title and len(title) > 10:
            link_tag = h3.find("a") or h3.find_parent("a")
            url_val = link_tag.get("href") if link_tag else None
            articles.append({
                "title":     title,
                "summary":   "",
                "url":       url_val,
                "source":    "Yahoo Finance",
                "published": _utcnow(),
            })
    return articles


async def fetch_seeking_alpha(client: httpx.AsyncClient, ticker: str) -> list[dict]:
    url = f"https://seekingalpha.com/api/sa/combined/{ticker}.xml"
    feed = await _fetch_rss(client, url)
    return [
        {
            "title":     e.title,
            "summary":   e.get("summary", ""),
            "url":       e.get("link"),
            "source":    "Seeking Alpha",
            "published": _parse_struct_time(e.get("published_parsed")),
        }
        for e in feed.entries[:MAX_ARTICLES_PER_SOURCE]
    ]


async def fetch_finnhub(client: httpx.AsyncClient, ticker: str) -> list[dict]:
    now   = _utcnow()
    from_d = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    to_d   = now.strftime("%Y-%m-%d")
    url = (
        f"https://finnhub.io/api/v1/company-news"
        f"?symbol={ticker}&from={from_d}&to={to_d}&token=demo"
    )
    resp = await client.get(url)
    resp.raise_for_status()
    items = resp.json()
    if not isinstance(items, list):
        return []
    return [
        {
            "title":     a.get("headline", ""),
            "summary":   a.get("summary", ""),
            "url":       a.get("url"),
            "source":    "Finnhub",
            "published": datetime.fromtimestamp(
                a.get("datetime", now.timestamp()), tz=timezone.utc
            ),
        }
        for a in items[:MAX_ARTICLES_PER_SOURCE]
        if a.get("headline")
    ]


async def fetch_marketaux(client: httpx.AsyncClient, ticker: str) -> list[dict]:
    url = (
        f"https://api.marketaux.com/v1/news/all"
        f"?symbols={ticker}&filter_entities=true&language=en&limit={MAX_ARTICLES_PER_SOURCE}"
    )
    resp = await client.get(url)
    resp.raise_for_status()
    items = resp.json().get("data", [])
    return [
        {
            "title":     a.get("title", ""),
            "summary":   a.get("description", ""),
            "url":       a.get("url"),
            "source":    "Marketaux",
            "published": _parse_iso(a.get("published_at", "")),
        }
        for a in items
        if a.get("title")
    ]


async def fetch_alpha_vantage(client: httpx.AsyncClient, ticker: str) -> list[dict]:
    url = (
        f"https://www.alphavantage.co/query"
        f"?function=NEWS_SENTIMENT&tickers={ticker}&apikey=demo"
    )
    resp = await client.get(url)
    resp.raise_for_status()
    items = resp.json().get("feed", [])
    results = []
    now = _utcnow()
    for item in items[:MAX_ARTICLES_PER_SOURCE]:
        ts = item.get("time_published", "")
        try:
            pub = datetime.strptime(ts, "%Y%m%dT%H%M%S").replace(tzinfo=timezone.utc)
        except ValueError:
            pub = now
        results.append({
            "title":     item.get("title", ""),
            "summary":   item.get("summary", ""),
            "url":       item.get("url"),
            "source":    "Alpha Vantage",
            "published": pub,
        })
    return results


# ── orchestration ──────────────────────────────────────────────


async def fetch_all(ticker: str, company: str) -> tuple[list[dict], list[dict]]:
    """Fire all 7 sources concurrently.

    Returns (all_articles, source_health) where source_health is a list of:
        {"name": str, "status": "ok"|"error", "duration_ms": int, "articles": int, "error"?: str}
    """
    SOURCES = [
        ("Google News",   lambda c: fetch_google_news(c, ticker, company)),
        ("Bing News",     lambda c: fetch_bing_news(c, ticker, company)),
        ("Yahoo Finance", lambda c: fetch_yahoo_finance(c, ticker)),
        ("Seeking Alpha", lambda c: fetch_seeking_alpha(c, ticker)),
        ("Finnhub",       lambda c: fetch_finnhub(c, ticker)),
        ("Marketaux",     lambda c: fetch_marketaux(c, ticker)),
        ("Alpha Vantage", lambda c: fetch_alpha_vantage(c, ticker)),
    ]

    async def _fetch_one(client: httpx.AsyncClient, name: str, fn) -> tuple[list[dict], dict]:
        t0 = time.monotonic()
        try:
            articles = await fn(client)
            ms = round((time.monotonic() - t0) * 1000)
            health: dict = {"name": name, "status": "ok", "duration_ms": ms, "articles": len(articles)}
        except Exception as exc:
            ms = round((time.monotonic() - t0) * 1000)
            logger.warning("%s failed in %d ms: %s", name, ms, exc)
            articles = []
            health = {"name": name, "status": "error", "duration_ms": ms, "articles": 0, "error": type(exc).__name__}
        logger.info("%s → %s: %d articles in %d ms", name, health["status"], len(articles), ms)
        return articles, health

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        pairs = await asyncio.gather(*[
            _fetch_one(client, name, fn) for name, fn in SOURCES
        ])

    all_articles: list[dict] = []
    health_list: list[dict] = []
    for articles, health in pairs:
        all_articles.extend(articles)
        health_list.append(health)

    return all_articles, health_list


async def fetch_stock_info_async(ticker: str) -> dict:
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        return await fetch_stock_info(client, ticker)


async def fetch_stock_info(client: httpx.AsyncClient, ticker: str) -> dict:
    url = f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={ticker}"
    try:
        resp = await client.get(url, headers={"User-Agent": _UA})
        resp.raise_for_status()
        result = resp.json().get("quoteResponse", {}).get("result", [])
        if result:
            info = result[0]
            return {
                "name":          info.get("longName") or info.get("shortName") or ticker,
                "sector":        info.get("sector", "Unknown"),
                "current_price": float(info.get("regularMarketPrice", 0)),
            }
    except Exception as exc:
        logger.warning("Stock info failed for %s: %s", ticker, exc)
    return {"name": ticker, "sector": "Unknown", "current_price": 0.0}
