import re
import math
import logging
from typing import Dict, List
import requests
from bs4 import BeautifulSoup
import feedparser
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

analyzer = SentimentIntensityAnalyzer()

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def clean_text(text: str) -> str:
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    return text.strip()


def analyze_sentiment(text: str) -> float:
    cleaned = clean_text(text)
    if not cleaned:
        return 0.0
    return analyzer.polarity_scores(cleaned)['compound']


def calculate_weighted_score(compound: float, recency_days: int = 0) -> float:
    recency_weight = max(1, 7 - recency_days)
    return compound * math.log(recency_weight + 1)


def get_verdict(final_metric: float) -> str:
    if final_metric > 0.2:
        return "STRONG BUY"
    elif final_metric > 0.05:
        return "BUY"
    elif final_metric < -0.2:
        return "STRONG SELL"
    elif final_metric < -0.05:
        return "SELL"
    return "HOLD"


def get_alpha_vantage_news(ticker: str) -> List[Dict]:
    try:
        url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={ticker}&apikey=demo"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            articles = []
            for item in data.get('feed', [])[:15]:
                time_str = item.get('time_published', '')
                try:
                    pub_date = datetime.strptime(time_str, '%Y%m%dT%H%M%S').replace(tzinfo=timezone.utc) if time_str else _utcnow()
                except ValueError:
                    pub_date = _utcnow()
                articles.append({
                    'title': item.get('title', ''),
                    'summary': item.get('summary', ''),
                    'source': 'Alpha Vantage',
                    'published': pub_date,
                })
            return articles
    except Exception as e:
        logger.warning("Alpha Vantage error: %s", e)
    return []


def get_yahoo_scrape_news(ticker: str) -> List[Dict]:
    try:
        url = f"https://finance.yahoo.com/quote/{ticker}/news"
        headers = {'User-Agent': USER_AGENTS[0]}
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            articles = []
            for item in soup.find_all('h3', limit=15):
                title = item.get_text(strip=True)
                if title and len(title) > 10:
                    articles.append({
                        'title': title,
                        'summary': '',
                        'source': 'Yahoo Finance',
                        'published': _utcnow(),
                    })
            return articles
    except Exception as e:
        logger.warning("Yahoo scrape error: %s", e)
    return []


def get_google_news_rss(ticker: str, company_name: str = None) -> List[Dict]:
    try:
        query = company_name if company_name else ticker
        url = f"https://news.google.com/rss/search?q={query}+stock&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(url)
        articles = []
        for entry in feed.entries[:15]:
            published = entry.get('published_parsed')
            pub_date = datetime(*published[:6], tzinfo=timezone.utc) if published else _utcnow()
            articles.append({
                'title': entry.title,
                'summary': entry.get('summary', ''),
                'source': 'Google News',
                'published': pub_date,
            })
        return articles
    except Exception as e:
        logger.warning("Google News error: %s", e)
    return []


def get_bing_news(ticker: str, company_name: str = None) -> List[Dict]:
    try:
        query = company_name if company_name else ticker
        url = f"https://www.bing.com/news/search?q={query}+stock&format=rss"
        feed = feedparser.parse(url)
        articles = []
        for entry in feed.entries[:10]:
            published = entry.get('published_parsed')
            pub_date = datetime(*published[:6], tzinfo=timezone.utc) if published else _utcnow()
            articles.append({
                'title': entry.title,
                'summary': entry.get('description', ''),
                'source': 'Bing News',
                'published': pub_date,
            })
        return articles
    except Exception as e:
        logger.warning("Bing News error: %s", e)
    return []


def get_seeking_alpha_rss(ticker: str) -> List[Dict]:
    try:
        url = f"https://seekingalpha.com/api/sa/combined/{ticker}.xml"
        feed = feedparser.parse(url)
        articles = []
        for entry in feed.entries[:10]:
            published = entry.get('published_parsed')
            pub_date = datetime(*published[:6], tzinfo=timezone.utc) if published else _utcnow()
            articles.append({
                'title': entry.title,
                'summary': entry.get('summary', ''),
                'source': 'Seeking Alpha',
                'published': pub_date,
            })
        return articles
    except Exception as e:
        logger.warning("Seeking Alpha error: %s", e)
    return []


def get_finnhub_news(ticker: str) -> List[Dict]:
    try:
        now = _utcnow()
        from_date = (now - timedelta(days=7)).strftime('%Y-%m-%d')
        to_date = now.strftime('%Y-%m-%d')
        url = f"https://finnhub.io/api/v1/company-news?symbol={ticker}&from={from_date}&to={to_date}&token=demo"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                return [
                    {
                        'title': a.get('headline', ''),
                        'summary': a.get('summary', ''),
                        'source': 'Finnhub',
                        'published': datetime.fromtimestamp(a.get('datetime', now.timestamp()), tz=timezone.utc),
                    }
                    for a in data[:10] if a.get('headline')
                ]
    except Exception as e:
        logger.warning("Finnhub error: %s", e)
    return []


def get_marketaux_news(ticker: str) -> List[Dict]:
    try:
        url = f"https://api.marketaux.com/v1/news/all?symbols={ticker}&filter_entities=true&language=en&limit=10"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            articles = response.json().get('data', [])
            result = []
            for a in articles:
                if a.get('title'):
                    pub_str = a.get('published_at', '')
                    try:
                        pub_date = datetime.fromisoformat(pub_str.replace('Z', '+00:00')) if pub_str else _utcnow()
                    except ValueError:
                        pub_date = _utcnow()
                    result.append({
                        'title': a.get('title', ''),
                        'summary': a.get('description', ''),
                        'source': 'Marketaux',
                        'published': pub_date,
                    })
            return result
    except Exception as e:
        logger.warning("Marketaux error: %s", e)
    return []


def get_stock_info(ticker: str) -> Dict:
    try:
        url = f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={ticker}"
        headers = {'User-Agent': USER_AGENTS[0]}
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            result = data.get('quoteResponse', {}).get('result', [])
            if result:
                info = result[0]
                return {
                    'name': info.get('longName') or info.get('shortName') or ticker,
                    'sector': info.get('sector', 'Unknown'),
                    'current_price': info.get('regularMarketPrice', 0),
                }
    except Exception as e:
        logger.warning("Stock info error: %s", e)
    return {'name': ticker, 'sector': 'Unknown', 'current_price': 0}


def _calculate_confidence(
    avg_sentiment: float,
    bullish_count: int,
    bearish_count: int,
    total: int,
    articles_24h: int,
    articles_7d: int,
) -> float:
    """
    Multi-factor confidence: signal magnitude + consensus + volume + recency.
    Returns a value in [0, 100].
    """
    magnitude_factor = min(abs(avg_sentiment) * 2, 1.0)
    consensus_factor = max(bullish_count, bearish_count) / total
    volume_factor = min(total / 30, 1.0)
    recency_factor = min((articles_24h / max(articles_7d, 1)) * 2, 1.0)

    score = (
        magnitude_factor * 0.35
        + consensus_factor * 0.35
        + volume_factor * 0.20
        + recency_factor * 0.10
    ) * 100
    return round(score, 2)


def analyze_ticker(ticker: str) -> Dict:
    ticker = ticker.upper()
    stock_info = get_stock_info(ticker)
    company_name = stock_info['name']

    logger.info("Fetching news for %s...", ticker)

    news_sources = [
        ('Google News',   lambda: get_google_news_rss(ticker, company_name)),
        ('Bing News',     lambda: get_bing_news(ticker, company_name)),
        ('Yahoo Finance', lambda: get_yahoo_scrape_news(ticker)),
        ('Finnhub',       lambda: get_finnhub_news(ticker)),
        ('Marketaux',     lambda: get_marketaux_news(ticker)),
        ('Seeking Alpha', lambda: get_seeking_alpha_rss(ticker)),
        ('Alpha Vantage', lambda: get_alpha_vantage_news(ticker)),
    ]

    all_articles: List[Dict] = []
    with ThreadPoolExecutor(max_workers=7) as executor:
        future_to_source = {executor.submit(func): name for name, func in news_sources}
        for future in as_completed(future_to_source):
            source_name = future_to_source[future]
            try:
                articles = future.result(timeout=6)
                logger.info("%s: %d articles", source_name, len(articles))
                all_articles.extend(articles)
            except Exception as e:
                logger.warning("%s failed: %s", source_name, e)

    logger.info("Total articles collected: %d", len(all_articles))

    if not all_articles:
        return {
            'verdict': 'INSUFFICIENT DATA',
            'confidence_score': 0.0,
            'stats': {'bullish': 0, 'bearish': 0, 'neutral': 0},
            'top_comments': [],
            'stock_info': stock_info,
            'advanced_stats': {},
        }

    now = _utcnow()
    analyzed_data = []
    for article in all_articles:
        text = f"{article['title']} {article['summary']}"
        compound = analyze_sentiment(text)

        if abs(compound) < 0.02:
            continue

        pub_date = article.get('published', now)
        # Ensure timezone-aware comparison
        if pub_date.tzinfo is None:
            pub_date = pub_date.replace(tzinfo=timezone.utc)

        hours_old = (now - pub_date).total_seconds() / 3600
        days_old = hours_old / 24
        recency_days = min(int(days_old), 7)
        weighted_score = calculate_weighted_score(compound, recency_days)

        analyzed_data.append({
            'text': article['title'][:200],
            'compound': compound,
            'weighted_score': weighted_score,
            'source': article['source'],
            'sentiment_type': 'bullish' if compound > 0.05 else 'bearish' if compound < -0.05 else 'neutral',
            'published': pub_date,
            'hours_old': hours_old,
            'days_old': days_old,
        })

    if not analyzed_data:
        return {
            'verdict': 'INSUFFICIENT DATA',
            'confidence_score': 0.0,
            'stats': {'bullish': 0, 'bearish': 0, 'neutral': 0},
            'top_comments': [],
            'stock_info': stock_info,
            'advanced_stats': {},
        }

    final_metric = sum(item['weighted_score'] for item in analyzed_data) / len(analyzed_data)
    verdict = get_verdict(final_metric)

    bullish_count = sum(1 for item in analyzed_data if item['sentiment_type'] == 'bullish')
    bearish_count = sum(1 for item in analyzed_data if item['sentiment_type'] == 'bearish')
    neutral_count = sum(1 for item in analyzed_data if item['sentiment_type'] == 'neutral')

    sentiments = [item['compound'] for item in analyzed_data]
    avg_sentiment = sum(sentiments) / len(sentiments)
    variance = sum((x - avg_sentiment) ** 2 for x in sentiments) / len(sentiments)
    std_dev = math.sqrt(variance)

    recent_24h = [item for item in analyzed_data if item['hours_old'] <= 24]
    recent_7d = [item for item in analyzed_data if item['days_old'] <= 7]

    sentiment_24h = sum(item['compound'] for item in recent_24h) / len(recent_24h) if recent_24h else 0
    sentiment_7d = sum(item['compound'] for item in recent_7d) / len(recent_7d) if recent_7d else 0

    sorted_by_time = sorted(analyzed_data, key=lambda x: x['hours_old'])
    if len(sorted_by_time) >= 3:
        recent_avg = sum(item['compound'] for item in sorted_by_time[:3]) / 3
        older_avg = sum(item['compound'] for item in sorted_by_time[-3:]) / 3
        momentum = recent_avg - older_avg
    else:
        momentum = 0

    confidence_score = _calculate_confidence(
        avg_sentiment, bullish_count, bearish_count,
        len(analyzed_data), len(recent_24h), len(recent_7d),
    )

    sorted_articles = sorted(analyzed_data, key=lambda x: abs(x['weighted_score']), reverse=True)[:15]
    top_comments = []
    for item in sorted_articles:
        hours = item['hours_old']
        if hours < 1:
            time_ago = f"{int(hours * 60)}m ago"
        elif hours < 24:
            time_ago = f"{int(hours)}h ago"
        else:
            time_ago = f"{int(item['days_old'])}d ago"

        top_comments.append({
            'text': item['text'],
            'score': round(item['compound'], 3),
            'sentiment': item['sentiment_type'],
            'source': item['source'],
            'time_ago': time_ago,
            'hours_old': round(hours, 1),
        })

    advanced_stats = {
        'avg_sentiment': round(avg_sentiment, 4),
        'volatility': round(std_dev, 4),
        'momentum': round(momentum, 4),
        'sentiment_24h': round(sentiment_24h, 4),
        'sentiment_7d': round(sentiment_7d, 4),
        'articles_24h': len(recent_24h),
        'articles_7d': len(recent_7d),
        'bullish_ratio': round(bullish_count / len(analyzed_data), 3),
        'bearish_ratio': round(bearish_count / len(analyzed_data), 3),
        'consensus_strength': round(max(bullish_count, bearish_count) / len(analyzed_data), 3),
    }

    return {
        'verdict': verdict,
        'confidence_score': confidence_score,
        'stats': {
            'bullish': bullish_count,
            'bearish': bearish_count,
            'neutral': neutral_count,
        },
        'top_comments': top_comments,
        'stock_info': stock_info,
        'advanced_stats': advanced_stats,
    }
