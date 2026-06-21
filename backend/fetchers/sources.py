"""Async news fetchers — one per source, all returning the same Article dict shape.

Article dict:
    title:     str
    summary:   str
    url:       str | None
    source:    str
    published: datetime (UTC-aware)
"""
from __future__ import annotations

import asyncio
import logging
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
    """Convert a feedparser struct_time tuple to a UTC-aware datetime."""
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
    """Fetch RSS URL with httpx then parse with feedparser (no network call in feedparser)."""
    resp = await client.get(url, headers={"User-Agent": _UA})
    resp.raise_for_status()
    # feedparser.parse() accepts bytes; feedparser will honour the XML encoding declaration.
    return feedparser.parse(resp.content)


# ── individual fetchers ────────────────────────────────────────


async def fetch_google_news(client: httpx.AsyncClient, ticker: str, company: str) -> list[dict]:
    query = company if company != ticker else ticker
    url = f"https://news.google.com/rss/search?q={query}+stock&hl=en-US&gl=US&ceid=US:en"
    try:
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
    except Exception as exc:
        logger.warning("Google News failed: %s", exc)
        return []


async def fetch_bing_news(client: httpx.AsyncClient, ticker: str, company: str) -> list[dict]:
    query = company if company != ticker else ticker
    url = f"https://www.bing.com/news/search?q={query}+stock&format=rss"
    try:
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
    except Exception as exc:
        logger.warning("Bing News failed: %s", exc)
        return []


async def fetch_yahoo_finance(client: httpx.AsyncClient, ticker: str) -> list[dict]:
    url = f"https://finance.yahoo.com/quote/{ticker}/news"
    try:
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
    except Exception as exc:
        logger.warning("Yahoo Finance failed: %s", exc)
        return []


async def fetch_seeking_alpha(client: httpx.AsyncClient, ticker: str) -> list[dict]:
    url = f"https://seekingalpha.com/api/sa/combined/{ticker}.xml"
    try:
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
    except Exception as exc:
        logger.warning("Seeking Alpha failed: %s", exc)
        return []


async def fetch_finnhub(client: httpx.AsyncClient, ticker: str) -> list[dict]:
    now = _utcnow()
    from_d = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    to_d   = now.strftime("%Y-%m-%d")
    url = (
        f"https://finnhub.io/api/v1/company-news"
        f"?symbol={ticker}&from={from_d}&to={to_d}&token=demo"
    )
    try:
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
    except Exception as exc:
        logger.warning("Finnhub failed: %s", exc)
        return []


async def fetch_marketaux(client: httpx.AsyncClient, ticker: str) -> list[dict]:
    url = (
        f"https://api.marketaux.com/v1/news/all"
        f"?symbols={ticker}&filter_entities=true&language=en&limit={MAX_ARTICLES_PER_SOURCE}"
    )
    try:
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
    except Exception as exc:
        logger.warning("Marketaux failed: %s", exc)
        return []


async def fetch_alpha_vantage(client: httpx.AsyncClient, ticker: str) -> list[dict]:
    url = (
        f"https://www.alphavantage.co/query"
        f"?function=NEWS_SENTIMENT&tickers={ticker}&apikey=demo"
    )
    try:
        resp = await client.get(url)
        resp.raise_for_status()
        items = resp.json().get("feed", [])
        results = []
        for item in items[:MAX_ARTICLES_PER_SOURCE]:
            ts = item.get("time_published", "")
            try:
                pub = datetime.strptime(ts, "%Y%m%dT%H%M%S").replace(tzinfo=timezone.utc)
            except ValueError:
                pub = _utcnow()
            results.append({
                "title":     item.get("title", ""),
                "summary":   item.get("summary", ""),
                "url":       item.get("url"),
                "source":    "Alpha Vantage",
                "published": pub,
            })
        return results
    except Exception as exc:
        logger.warning("Alpha Vantage failed: %s", exc)
        return []


async def fetch_stock_info_async(ticker: str) -> dict:
    """Standalone wrapper that creates its own client — use when no shared client is available."""
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
        logger.warning("Stock info failed: %s", exc)
    return {"name": ticker, "sector": "Unknown", "current_price": 0.0}


# ── orchestrated parallel fetch ────────────────────────────────

async def fetch_all(ticker: str, company: str) -> list[dict]:
    """
    Fire all 7 sources concurrently via asyncio.gather.
    Each source has its own timeout; failures are swallowed and logged.
    """
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        results = await asyncio.gather(
            fetch_google_news(client, ticker, company),
            fetch_bing_news(client, ticker, company),
            fetch_yahoo_finance(client, ticker),
            fetch_seeking_alpha(client, ticker),
            fetch_finnhub(client, ticker),
            fetch_marketaux(client, ticker),
            fetch_alpha_vantage(client, ticker),
            return_exceptions=False,
        )

    all_articles: list[dict] = []
    source_names = [
        "Google News", "Bing News", "Yahoo Finance", "Seeking Alpha",
        "Finnhub", "Marketaux", "Alpha Vantage",
    ]
    for name, batch in zip(source_names, results):
        logger.info("%s → %d articles", name, len(batch))
        all_articles.extend(batch)

    return all_articles
