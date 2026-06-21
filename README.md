# Stock Sentiment Analyzer

> Production-grade real-time market sentiment analysis — 7 concurrent async news sources, VADER NLP with financial lexicon, fuzzy deduplication, source contribution breakdown, sentiment trend tracking, background scheduler, dark mode, export, and full CI/CD.

---

## Overview

The system fetches news in parallel from 7 independent sources, fuzzy-deduplicates repeated stories, scores each article with a domain-enhanced VADER model, and aggregates the results into a single verdict with detailed reasoning, per-source contribution analysis, and trend tracking — all within 5–10 seconds on first fetch, < 1 ms on cache hit.

**What makes it technically interesting:**

| Feature | Implementation |
|---------|---------------|
| Concurrent I/O | `httpx.AsyncClient` + `asyncio.gather` across 7 sources |
| Deduplication | MD5 hash (exact) + SequenceMatcher (fuzzy, 0.82 threshold) |
| Source health | Per-fetcher timing, status, and article count tracked in every response |
| Source contribution | Weighted contribution % per source with avg sentiment breakdown |
| Source weighting | Per-source reliability multiplier (0.75–1.00) applied before aggregation |
| Financial NLP | VADER lexicon extended with 40+ financial domain terms |
| Confidence model | 6-factor weighted formula (magnitude, consensus, volume, reliability, recency, stability) |
| Sentiment trend | Compares current run vs previous SQLite entry — improving / deteriorating / stable |
| Background scheduler | Hourly asyncio task refreshes 8 predefined tickers automatically |
| Performance timing | Fetch / dedup / scoring / aggregation breakdown returned in every response |
| Caching | In-process TTL cache (5 min, configurable) — zero-latency repeat queries |
| Persistence | SQLite history — verdict + confidence trend visible across runs |
| Export | Frontend JSON / CSV download of full analysis and top headlines |
| Dark mode | System-preference-aware theme with localStorage persistence |
| Search autocomplete | Fuzzy prefix matching on 40+ predefined tickers with keyboard navigation |
| Type safety | Full Pydantic v2 response models; structured logging throughout |
| Container-ready | Dockerfile (backend + frontend) + docker-compose.yml |
| CI/CD | GitHub Actions: lint → test → build → Docker smoke test |

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  React 18 Frontend  (Vite · Tailwind CSS · Recharts)          │
│                                                               │
│  useAnalysis hook → api.js → GET /analyze/{ticker}            │
│  useTheme hook → dark/light toggle persisted to localStorage  │
│  SearchBar with fuzzy autocomplete from 40+ predefined stocks │
│  AnalyticsCards · SourceContribution · TrendBadge             │
│  Export: JSON / CSV download (no backend round-trip)          │
└─────────────────────┬─────────────────────────────────────────┘
                      │ JSON
┌─────────────────────▼─────────────────────────────────────────┐
│  FastAPI  (uvicorn)                                           │
│                                                               │
│  GET /analyze/{ticker}                                        │
│      │                                                        │
│      ├─ TTL cache hit? → return in < 1 ms                    │
│      │                                                        │
│      └─ asyncio.gather ──────────────────────────────────┐   │
│              │                                           │   │
│    ┌─────────▼──────────────────────────────────────┐   │   │
│    │  7 httpx.AsyncClient fetchers (concurrent)    │   │   │
│    │  Google RSS · Bing RSS · Yahoo Finance scrape │   │   │
│    │  Finnhub API · Marketaux API                  │   │   │
│    │  Seeking Alpha RSS · Alpha Vantage API        │   │   │
│    │  Per-fetcher: timing + status → source_health │   │   │
│    └─────────┬──────────────────────────────────────┘   │   │
│              │ raw articles                              │   │
│              ▼                                           │   │
│    MD5 hash dedup + SequenceMatcher fuzzy (0.82)         │   │
│              │                                           │   │
│              ▼                                           │   │
│    VADER score × recency_weight × source_weight          │   │
│              │                                           │   │
│              ▼                                           │   │
│    aggregate → per-source contribution %                 │   │
│    compare vs prev SQLite run → trend direction          │   │
│    verdict + confidence + reasons                        │   │
│              │                                           │   │
│    SQLite (sentiment_history.db) ◄────────────────────────┘   │
│    TTL cache ← set                                            │
│                                                               │
│  Background Scheduler (asyncio task)                          │
│      every 60 min: refresh 8 predefined tickers              │
└───────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend

| Package | Version | Role |
|---------|---------|------|
| FastAPI | 0.109 | Async REST framework |
| Uvicorn | 0.27 | ASGI server |
| httpx | 0.26 | Async HTTP client |
| vaderSentiment | 3.3 | NLP engine + financial lexicon |
| BeautifulSoup4 | 4.12 | Yahoo Finance HTML parsing |
| feedparser | 6.0 | RSS/Atom parsing |
| Pydantic | 2.5 | Request validation + response models |
| sqlite3 | stdlib | History persistence |

### Frontend

| Package | Role |
|---------|------|
| React 18 | UI framework |
| Vite 7 | Build tool |
| Tailwind CSS 3 | Utility-first styling (dark mode via `class` strategy) |
| Recharts 2 | Radar, pie, bar, line, history charts |
| Lucide React | Icons |
| Axios | HTTP client |

---

## Project Structure

```
Sentiment_Stock_Analysis/
├── docker-compose.yml
├── .github/
│   └── workflows/ci.yml         # lint → test → build → Docker smoke test
│
├── backend/
│   ├── main.py                  # FastAPI app + CORS + startup (DB + scheduler)
│   ├── config.py                # All constants, source weights, scheduler config
│   ├── scheduler.py             # Background asyncio task — hourly ticker refresh
│   ├── requirements.txt
│   ├── requirements-dev.txt     # + pytest, pytest-asyncio
│   ├── pytest.ini
│   ├── Dockerfile
│   │
│   ├── api/
│   │   └── routes.py            # /analyze, /history, /cache, /scheduler/status
│   │
│   ├── models/
│   │   └── schemas.py           # Pydantic v2 response models
│   │
│   ├── fetchers/
│   │   └── sources.py           # 7 async fetchers + health/timing tracking
│   │
│   ├── services/
│   │   ├── analyzer.py          # Orchestration: fetch → dedup → score → trend → cache → persist
│   │   ├── sentiment.py         # VADER + financial lexicon + recency weighting
│   │   ├── cache.py             # In-process TTL dict cache
│   │   └── dedup.py             # MD5 (exact) + SequenceMatcher (fuzzy) dedup
│   │
│   ├── db/
│   │   └── history.py           # SQLite persistence
│   │
│   └── tests/
│       ├── test_sentiment.py    # 12 tests: scoring, lexicon, recency, verdict thresholds
│       ├── test_dedup.py        # 10 tests: exact, case, fuzzy, count
│       ├── test_analyzer.py     # 12 tests: confidence, reasons, trend
│       └── test_api.py          # 8 async integration tests via httpx + ASGITransport
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.jsx                      # Composition root + dark mode toggle
        ├── main.jsx
        ├── index.css                    # Tailwind + dark scrollbar + animations
        │
        ├── hooks/
        │   ├── useAnalysis.js           # Analysis state + staged progress phases
        │   └── useTheme.js              # Dark/light toggle persisted to localStorage
        │
        ├── constants/
        │   └── stocks.js                # 40+ stocks across 6 markets
        │
        ├── services/
        │   └── api.js                   # Axios wrappers
        │
        └── components/
            ├── SearchBar.jsx            # Input + fuzzy autocomplete dropdown
            ├── Sidebar.jsx              # Desktop + mobile variants (dark mode)
            ├── LoadingSkeleton.jsx      # Animated placeholder dashboard
            └── Dashboard/
                ├── index.jsx            # Composition + JSON/CSV export handler
                ├── VerdictCard.jsx      # Verdict + confidence + TrendBadge
                ├── AnalyticsCards.jsx   # Articles scanned, dupes, sources, cache, time, export
                ├── MetricCards.jsx      # 4 KPI cards + bull/neutral/bear bars
                ├── SourceContribution.jsx  # Per-source %, avg sentiment, health icons
                ├── Charts.jsx           # Radar, time, pie, source bar, trend line, history
                └── Headlines.jsx        # Clickable headlines with source/recency badges
```

---

## Quick Start

### Option A — Docker (recommended)

```bash
git clone https://github.com/guru-bharadwaj20/Sentiment_Stock_Analysis
cd Sentiment_Stock_Analysis
docker compose up --build
```

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:8000  
- **Swagger docs:** http://localhost:8000/docs

### Option B — Local dev

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows

pip install -r requirements.txt
uvicorn main:app --reload
# API:  http://localhost:8000
# Docs: http://localhost:8000/docs
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

**Run tests**
```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v
```

No API keys required. Both servers must run simultaneously.

### Environment variables (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |
| `CACHE_TTL` | `300` | Cache TTL in seconds |
| `DB_PATH` | `sentiment_history.db` | SQLite file path |
| `FETCH_TIMEOUT_CONNECT` | `4` | httpx connect timeout (s) |
| `FETCH_TIMEOUT_READ` | `7` | httpx read timeout (s) |
| `SCHEDULER_ENABLED` | `true` | Enable background refresh scheduler |
| `SCHEDULER_INTERVAL` | `60` | Scheduler interval in minutes |
| `SCHEDULED_TICKERS` | `TSLA,AAPL,...` | Comma-separated tickers to pre-warm |
| `VITE_API_URL` | `http://localhost:8000` | Backend URL for the frontend |

---

## API Reference

### `GET /`
```json
{ "status": "ok", "version": "3.0.0", "cache_entries": 3 }
```

### `GET /analyze/{ticker}`

Full sentiment analysis. Cached for 5 minutes per ticker.

**Response (key fields):**
```json
{
  "ticker": "TSLA",
  "verdict": "BUY",
  "confidence_score": 64.3,
  "verdict_reasons": [
    "71% of articles are bullish",
    "Average sentiment is moderately positive (+0.18)"
  ],
  "trend": {
    "direction": "improving",
    "sentiment_delta": 0.0842,
    "confidence_delta": 3.2,
    "prev_verdict": "HOLD",
    "verdict_changed": true
  },
  "source_contributions": {
    "Finnhub": { "articles": 8, "avg_sentiment": 0.42, "contribution_pct": 31.2 },
    "Google News": { "articles": 12, "avg_sentiment": 0.18, "contribution_pct": 28.1 }
  },
  "source_health": [
    { "name": "Finnhub", "status": "ok", "duration_ms": 312, "articles": 12 },
    { "name": "Marketaux", "status": "error", "duration_ms": 7001, "articles": 0, "error": "TimeoutException" }
  ],
  "meta": {
    "articles_raw": 82, "duplicates_removed": 11,
    "sources_succeeded": 6, "sources_total": 7, "cached": false
  },
  "timing": {
    "fetch_s": 3.21, "dedup_ms": 4.1, "scoring_ms": 18.3,
    "aggregation_ms": 2.0, "total_s": 3.64
  },
  "stats": { "bullish": 22, "bearish": 6, "neutral": 3 },
  "advanced_stats": { "avg_sentiment": 0.2341, "volatility": 0.1613, "momentum": 0.0954, ... },
  "history": [{ "timestamp": "...", "verdict": "HOLD", "confidence_score": 61.2, "avg_sentiment": 0.15 }],
  "cached": false
}
```

### `GET /history/{ticker}?limit=8`
Previous analysis runs for a ticker from SQLite.

### `DELETE /cache`
Clears the in-memory TTL cache.

### `GET /scheduler/status`
```json
{ "active": true, "tickers": ["TSLA", "AAPL", "NVDA", ...], "count": 8 }
```

---

## Sentiment Analysis Methodology

### Pipeline

```
7 sources (asyncio.gather — all concurrent, per-fetcher timing tracked)
    │
    ▼ raw articles
MD5 hash dedup (exact) → SequenceMatcher fuzzy dedup (threshold 0.82)
    │
    ▼ unique articles
for each article:
    clean_text() → strip URLs, HTML, normalize unicode
    VADER compound score  c ∈ [-1.0, 1.0]  (financial lexicon applied)
    if |c| < 0.02: discard
    recency_mult = log(max(1, 7 − days_old) + 1)   # 0.69 – 2.08
    source_weight = SOURCE_WEIGHTS[source]           # 0.75 – 1.00
    weighted = c × recency_mult × source_weight
    │
    ▼ scored articles
per-source contribution % (weighted_sum / total_weighted × 100)
aggregate metrics → verdict + confidence + reasons
compare vs previous SQLite run → trend direction
    │
SQLite persist → cache set → return
```

### Verdict thresholds (mean weighted score)

| Range | Verdict |
|-------|---------|
| > 0.20 | STRONG BUY |
| 0.05 – 0.20 | BUY |
| −0.05 – 0.05 | HOLD |
| −0.20 – −0.05 | SELL |
| < −0.20 | STRONG SELL |

### Source reliability weights

| Source | Weight | Rationale |
|--------|--------|-----------|
| Finnhub | 1.00 | Financial-specific news API |
| Alpha Vantage | 0.95 | Financial news with metadata |
| Yahoo Finance | 0.90 | High-quality financial publisher |
| Seeking Alpha | 0.85 | Analyst commentary |
| Google News | 0.80 | General aggregator with broad coverage |
| Bing News | 0.75 | General aggregator |
| Marketaux | 0.75 | Newer aggregator |

### Confidence formula

```
confidence = (
    min(|avg_sentiment| × 2, 1.0)          × 0.35   # signal magnitude
  + max(bullish_ratio, bearish_ratio)        × 0.25   # consensus
  + min(total_articles / 30, 1.0)           × 0.15   # volume
  + avg_source_weight                        × 0.10   # source quality
  + min(articles_24h / articles_7d × 2, 1.0) × 0.10  # recency
  + max(0, 1 − volatility × 2)              × 0.05   # stability
) × 100
```

---

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Async HTTP | httpx + asyncio.gather | True async I/O; shared connection pool; cleaner than ThreadPoolExecutor + requests |
| Sentiment | VADER + financial lexicon | FinBERT is 100–500× slower without GPU; VADER at ~1 ms/article is the right call here |
| Storage | SQLite (stdlib) | No ORM overhead; single-file deployment; sufficient for historical trend display |
| Cache | In-process TTL dict | Redis would be overkill; in-process cache is zero-latency and trivially correct at 1-worker scale |
| Dedup | MD5 exact + SequenceMatcher fuzzy | Exact hash catches 90%+ of duplicates instantly; fuzzy at 0.82 threshold catches near-duplicates without false positives |
| Scheduler | asyncio background task | No extra dependency; starts after DB init in the startup event; throttles 30s between tickers |
| Dark mode | Tailwind `class` strategy | Allows JS-controlled toggling with localStorage persistence and system preference detection |
| Export | Frontend-only JSON/CSV | No extra API endpoint; consistent with what the user sees; works offline (after data loaded) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend won't start | Activate venv; `pip install -r requirements.txt` |
| CORS error | Both servers running on 8000 and 5173; check `CORS_ORIGINS` env var |
| `INSUFFICIENT DATA` | Ticker has limited coverage; try TSLA or AAPL first |
| Slow first request | Some demo API tiers rate-limit; first request after cache expiry takes 5–10 s |
| Tests fail on import | Run `pytest` from inside the `backend/` directory |
| Docker frontend can't reach backend | Set `VITE_API_URL=http://backend:8000` and ensure services share a Docker network |

---

## License

MIT — see [LICENSE](LICENSE).

## Author

**Guru R Bharadwaj**  
[GitHub @guru-bharadwaj20](https://github.com/guru-bharadwaj20) · [LinkedIn](https://www.linkedin.com/in/guru-r-bharadwaj/)
