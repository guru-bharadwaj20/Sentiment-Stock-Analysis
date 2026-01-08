# Multi-Source Stock Sentiment Analyzer

A production-ready full-stack application that analyzes stock sentiment from **7 free data sources** using AI-powered sentiment analysis with advanced time-based metrics.

## 🚀 Key Features

**NO API KEYS REQUIRED!** This app uses completely free, public data sources:

- ✅ **Google News RSS** - Latest stock-related news articles  
- ✅ **Bing News RSS** - Microsoft news aggregation
- ✅ **Yahoo Finance** - Real-time news scraping
- ✅ **Finnhub** - Financial news aggregator (demo API)
- ✅ **Marketaux** - Market news API (demo tier)
- ✅ **Seeking Alpha RSS** - Investment analysis feeds
- ✅ **Alpha Vantage** - Market news API (demo tier)
- ✅ **VADER Sentiment** - Advanced sentiment analysis engine

### Advanced Analytics

- 📊 **Time-Based Analysis** - 24-hour vs 7-day sentiment trends
- 📈 **Market Statistics** - Volatility, momentum, consensus strength
- 🎯 **5D Radar Chart** - Sentiment, consensus, recency, volume, stability
- ⏱️ **Recency Tracking** - Color-coded time badges for news freshness
- 🌍 **Global Markets** - 40+ stocks from US, India, UK, China, Japan
- ⚡ **Concurrent Fetching** - 5-10 second analysis (vs 3+ minutes sequential)

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **VADER Sentiment** - Sentiment analysis engine
- **BeautifulSoup4** - Web scraping
- **feedparser** - RSS feed parsing
- **requests** - HTTP client
- **concurrent.futures** - Parallel processing

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization (Radar, Bar, Line, Pie charts)
- **Axios** - HTTP client
- **Lucide React** - Icons

## Features

- ✨ **7-source news aggregation** - Google, Bing, Yahoo, Finnhub, Marketaux, Seeking Alpha, Alpha Vantage
- 📊 **Real-time sentiment analysis** - VADER compound scores
- 🎯 **Advanced statistics** - Volatility, momentum, consensus strength
- ⏱️ **Time-based metrics** - 24h vs 7d sentiment, recency weighting
- 🌍 **Country selector** - Popular stocks from 6 global markets
- 📈 **Interactive visualizations** - Radar, pie, bar, line charts
- 🔍 **Source attribution** - Every article tagged with source and timestamp
- 💰 **Stock information** - Company name, sector display
- 🎨 **Professional UI** - Clean white/gray design
- ⚡ **Concurrent fetching** - ThreadPoolExecutor for 5-10s response time
- 🎯 **Smart weighting** - Recency bias for fresher news

## Project Structure

```
Sentiment_Stock_Analysis/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── service.py           # News fetching & sentiment analysis
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables (optional)
└── frontend/
    ├── src/
    │   ├── App.jsx          # Main component with country selector
    │   ├── components/
    │   │   └── Dashboard.jsx # Analytics dashboard
    │   ├── index.css        # Global styles
    │   └── main.jsx         # Entry point
    ├── package.json         # Node dependencies
    └── tailwind.config.js   # Tailwind configuration
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
```

3. Activate virtual environment:
```bash
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the backend server:
```bash
uvicorn main:app --reload
```

Backend will run on `http://localhost:8000`

**That's it! No API keys or configuration needed!**

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Usage

1. Ensure both backend and frontend servers are running
2. Open browser at `http://localhost:5173`
3. Select a country/market from the dropdown (Global, US, India, UK, China, Japan)
4. Click any popular stock OR enter a custom ticker
5. Wait 5-10 seconds for concurrent analysis across 7 sources
6. View comprehensive dashboard:
   - Overall sentiment verdict and confidence score
   - Advanced statistics (volatility, momentum, consensus)
   - Market strength radar chart
   - Time-based analysis (24h vs 7d trends)
   - Latest headlines with recency badges
   - Sentiment distribution and source breakdown

## API Endpoints

### GET `/analyze/{ticker}`

Analyzes sentiment for a given stock ticker from 7 concurrent news sources.

**Response:**
```json
{
  "verdict": "BUY",
  "confidence_score": 65.5,
  "stats": {
    "bullish": 25,
    "bearish": 10,
    "neutral": 15
  },
  "top_comments": [
    {
      "text": "Great earnings report!",
      "score": 0.856,
      "sentiment": "bullish",
      "source": "Google News",
      "time_ago": "3h ago",
      "hours_old": 3.2
    }
  ],
  "stock_info": {
    "name": "Reliance Industries",
    "sector": "Energy"
  },
  "advanced_stats": {
    "avg_sentiment": 0.234,
    "volatility": 0.156,
    "momentum": 0.089,
    "sentiment_24h": 0.278,
    "sentiment_7d": 0.189,
    "articles_24h": 12,
    "articles_7d": 35,
    "consensus_strength": 0.714
  }
}
```

## Sentiment Algorithm

### Data Sources (All Free, No Auth!)

1. **Google News RSS**: Stock-related news from Google News aggregator
2. **Bing News RSS**: Microsoft's news feed for financial topics
3. **Yahoo Finance**: Web scraping for latest stock news
4. **Finnhub API**: Financial news (demo tier, no key needed)
5. **Marketaux API**: Market news aggregator (demo tier)
6. **Seeking Alpha RSS**: Investment analysis and commentary
7. **Alpha Vantage**: Market news API (demo tier)

### Processing Pipeline

1. **Concurrent Fetching**: ThreadPoolExecutor fetches from all 7 sources simultaneously (5s timeout each)
2. **Timestamp Extraction**: Parse published dates, calculate hours/days old
3. **Text Cleaning**: Remove URLs, special characters, normalize text
4. **VADER Analysis**: Calculate compound sentiment score (-1 to +1)
5. **Recency Weighting**: `WeightedScore = compound × (1 + log(1 + (7 - days_old)))`
6. **Advanced Statistics**:
   - **Volatility**: Standard deviation of sentiment scores
   - **Momentum**: Recent (3 articles) vs older (3 articles) sentiment difference
   - **Consensus**: Agreement level (max(bullish%, bearish%))
   - **24h/7d Sentiment**: Time-segmented averages
7. **Verdict Generation**:
   - `> 0.2`: STRONG BUY
   - `> 0.05`: BUY
   - `< -0.05`: SELL
   - `< -0.2`: STRONG SELL
   - Otherwise: HOLD

### Data Quality

- 25-50 news articles per stock from 7 sources
- Articles from last 7 daysTSLA
```

### Frontend Build
```bash
cd frontend
npm run build
```

### Performance
- Concurrent fetching: 5-10 seconds per analysis
- 7 sources processed in parallel
- ThreadPoolExecutor with timeout handling

## Credits

Built by [Guru R Bharadwaj](https://github.com/guru-bharadwaj20)

Connect: [LinkedIn](https://www.linkedin.com/in/guru-r-bharadwaj/) Backend Testing
```bash
curl http://localhost:8000/analyze/RELIANCE
```

### Frontend Build
```bash
cd frontend
npm run build
```

## License

MIT
