# Multi-Source Stock Sentiment Analyzer

A production-ready full-stack application that provides real-time stock sentiment analysis by aggregating and analyzing news data from multiple free sources using natural language processing and advanced statistical methods.

## Overview

This application leverages seven independent news sources to provide comprehensive sentiment analysis for global stocks. By combining concurrent data fetching, VADER sentiment analysis, and time-weighted scoring algorithms, it delivers actionable insights into market sentiment within seconds.

**Key Capabilities:**
- Multi-source news aggregation with parallel processing
- AI-powered sentiment analysis using VADER (Valence Aware Dictionary and sEntiment Reasoner)
- Time-decay weighted scoring for recency bias
- Advanced market metrics including volatility, momentum, and consensus strength
- Interactive data visualizations with radar charts, trend analysis, and distribution graphs
- Support for 40+ stocks across six major global markets

## Features

### Data Acquisition
- **Seven News Sources** (No API keys required):
  - Google News RSS - Aggregated financial news
  - Bing News RSS - Microsoft news feed
  - Yahoo Finance - Web-scraped latest headlines
  - Finnhub API - Financial news aggregator (demo tier)
  - Marketaux API - Market news service (demo tier)
  - Seeking Alpha RSS - Investment analysis and commentary
  - Alpha Vantage API - Market news service (demo tier)

### Analytics Engine
- **Sentiment Analysis**: VADER-based compound scoring (-1.0 to +1.0)
- **Time-Based Metrics**: Separate 24-hour and 7-day sentiment averages
- **Advanced Statistics**:
  - Volatility index (standard deviation of sentiment scores)
  - Momentum score (recent vs. historical sentiment comparison)
  - Consensus strength (sentiment agreement level)
  - Recency weighting with logarithmic decay function
- **Performance**: Concurrent processing delivers results in 5-10 seconds

### User Interface
- **Market Selection**: Pre-configured stock lists for US, India, UK, China, Japan, and Global markets
- **Interactive Visualizations**: 
  - 5-dimensional radar chart for market strength analysis
  - Sentiment distribution pie charts
  - Time-series trend analysis
  - Source attribution breakdown
- **Real-Time Analysis**: Fresh data pulled and analyzed on-demand
- **Responsive Design**: Built with React 18 and Tailwind CSS


## Architecture

### Technology Stack

**Backend (Python)**
- **FastAPI** - High-performance async web framework
- **VADER Sentiment** - Natural language processing for sentiment analysis
- **BeautifulSoup4** - HTML parsing and web scraping
- **feedparser** - RSS/Atom feed parsing
- **requests** - HTTP client library
- **concurrent.futures** - Parallel execution with ThreadPoolExecutor

**Frontend (JavaScript/React)**
- **React 18** - Component-based UI framework
- **Vite** - Next-generation build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Composable charting library (Radar, Bar, Line, Pie)
- **Axios** - Promise-based HTTP client
- **Lucide React** - Modern icon library

### System Design

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  React Frontend │◄────────│  FastAPI Backend │◄────────│  News Sources   │
│  (Port 5173)    │  JSON   │  (Port 8000)     │  HTTP   │  (7 sources)    │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
       │                            │
       │                            │
       ▼                            ▼
   Recharts                  ThreadPoolExecutor
   Visualizations            (Concurrent Fetching)
                                    │
                                    ▼
                             VADER Sentiment
                             Analysis Engine
```


## Project Structure

```
Sentiment_Stock_Analysis/
├── backend/
│   ├── main.py              # FastAPI application with CORS configuration
│   ├── service.py           # News aggregation and sentiment analysis logic
│   ├── requirements.txt     # Python dependencies
│   └── __pycache__/         # Python bytecode cache
│
└── frontend/
    ├── src/
    │   ├── App.jsx          # Main application component with market selector
    │   ├── main.jsx         # Application entry point
    │   ├── index.css        # Global styles and Tailwind directives
    │   ├── components/
    │   │   └── Dashboard.jsx # Analytics dashboard with visualizations
    │   └── assets/          # Static assets
    │
    ├── public/              # Public static files
    ├── package.json         # Node.js dependencies and scripts
    ├── vite.config.js       # Vite build configuration
    └── tailwind.config.js   # Tailwind CSS configuration
```


## Installation & Setup

### Prerequisites
- Python 3.8 or higher
- Node.js 16.x or higher
- npm or yarn package manager

### Backend Configuration

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the FastAPI server:**
   ```bash
   uvicorn main:app --reload
   ```
   
   Server will be available at `http://localhost:8000`
   
   API documentation at `http://localhost:8000/docs`

### Frontend Configuration

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Application will be available at `http://localhost:5173`

### Verification

Ensure both servers are running concurrently:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

**Note:** No API keys or environment variables are required. All news sources use publicly accessible endpoints or demo tiers.


## Usage Guide

### Basic Workflow

1. **Launch Application**: Open browser and navigate to `http://localhost:5173`

2. **Select Market**: Choose from available markets:
   - Global (major international stocks)
   - United States
   - India
   - United Kingdom
   - China
   - Japan

3. **Analyze Stock**: 
   - Click on any pre-configured stock from the market grid, OR
   - Enter a custom ticker symbol in the search field

4. **View Results**: Analysis completes in 5-10 seconds, displaying:
   - Overall sentiment verdict (STRONG BUY, BUY, HOLD, SELL, STRONG SELL)
   - Confidence score (0-100%)
   - Advanced market statistics
   - Interactive visualizations
   - Latest news headlines with sentiment scores

### Dashboard Components

**Sentiment Overview**
- Overall verdict with confidence percentage
- Bullish/Bearish/Neutral article counts
- Stock information (company name, sector)

**Advanced Statistics**
- Average sentiment score
- Volatility index
- Momentum indicator
- 24-hour vs 7-day sentiment comparison
- Article volume metrics
- Consensus strength rating

**Visualizations**
- **Market Strength Radar**: 5-dimensional analysis (sentiment, consensus, recency, volume, stability)
- **Sentiment Distribution**: Pie chart of bullish/bearish/neutral proportions
- **Time-Based Trends**: 24h vs 7d sentiment comparison
- **Source Breakdown**: Distribution of articles by news source

**News Headlines**
- Latest articles with sentiment scores
- Source attribution
- Time-based recency badges (color-coded by freshness)
- Individual article sentiment classification


## API Reference

### Base URL
```
http://localhost:8000
```

### Endpoints

#### Health Check
```http
GET /
```
Returns API status confirmation.

**Response:**
```json
{
  "message": "Stock Sentiment Analyzer API is running"
}
```

#### Analyze Stock
```http
GET /analyze/{ticker}
```

Performs comprehensive sentiment analysis for the specified stock ticker.

**Parameters:**
- `ticker` (path parameter): Stock symbol (e.g., TSLA, AAPL, RELIANCE.NS)

**Response Schema:**
```json
{
  "ticker": "string",
  "verdict": "STRONG BUY | BUY | HOLD | SELL | STRONG SELL",
  "confidence_score": 0-100,
  "stats": {
    "bullish": 0,
    "bearish": 0,
    "neutral": 0
  },
  "top_comments": [
    {
      "text": "string",
      "score": -1.0 to 1.0,
      "sentiment": "bullish | bearish | neutral",
      "source": "string",
      "time_ago": "string",
      "hours_old": 0.0
    }
  ],
  "stock_info": {
    "name": "string",
    "sector": "string"
  },
  "advanced_stats": {
    "avg_sentiment": -1.0 to 1.0,
    "volatility": 0.0 to 1.0,
    "momentum": -1.0 to 1.0,
    "sentiment_24h": -1.0 to 1.0,
    "sentiment_7d": -1.0 to 1.0,
    "articles_24h": 0,
    "articles_7d": 0,
    "consensus_strength": 0.0 to 1.0
  }
}
```

**Example Request:**
```bash
curl http://localhost:8000/analyze/TSLA
```

**Example Response:**
```json
{
  "ticker": "TSLA",
  "verdict": "BUY",
  "confidence_score": 68.5,
  "stats": {
    "bullish": 28,
    "bearish": 8,
    "neutral": 14
  },
  "top_comments": [
    {
      "text": "Tesla reports record quarterly deliveries exceeding analyst expectations",
      "score": 0.876,
      "sentiment": "bullish",
      "source": "Google News",
      "time_ago": "2h ago",
      "hours_old": 2.3
    }
  ],
  "stock_info": {
    "name": "Tesla Inc.",
    "sector": "Electric Vehicles"
  },
  "advanced_stats": {
    "avg_sentiment": 0.234,
    "volatility": 0.156,
    "momentum": 0.089,
    "sentiment_24h": 0.278,
    "sentiment_7d": 0.201,
    "articles_24h": 15,
    "articles_7d": 42,
    "consensus_strength": 0.714
  }
}
```


## Sentiment Analysis Methodology

### Data Collection

**Multi-Source Aggregation**

The system concurrently fetches news data from seven independent sources using ThreadPoolExecutor:

1. **Google News RSS** - Financial news aggregated by Google's news engine
2. **Bing News RSS** - Microsoft's news search API in RSS format
3. **Yahoo Finance** - Web-scraped headlines from Yahoo Finance pages
4. **Finnhub API** - Financial news from Finnhub's demo tier
5. **Marketaux API** - Market news from Marketaux's free tier
6. **Seeking Alpha RSS** - Investment analysis and opinion pieces
7. **Alpha Vantage API** - Market news from Alpha Vantage's demo tier

Each source is queried with a 5-second timeout to ensure responsive performance. Typical aggregate volume: 25-50 articles per stock covering the last 7 days.

### Processing Pipeline

**1. Timestamp Extraction**
```python
# Parse publication dates and calculate article age
published_date = parse_datetime(article.published)
hours_old = (datetime.now() - published_date).total_seconds() / 3600
days_old = hours_old / 24
```

**2. Text Normalization**
```python
# Clean article text
text = remove_urls(text)
text = remove_special_characters(text)
text = normalize_whitespace(text)
```

**3. VADER Sentiment Analysis**
```python
# Calculate compound sentiment score (-1.0 to +1.0)
vader_scores = analyzer.polarity_scores(text)
compound_score = vader_scores['compound']
```

**4. Recency Weighting**
```python
# Apply logarithmic time decay
recency_weight = 1 + log(1 + (7 - days_old))
weighted_score = compound_score * recency_weight
```

### Advanced Metrics

**Volatility Index**
- Standard deviation of all sentiment scores
- Measures consistency of market sentiment
- Higher values indicate conflicting opinions

**Momentum Score**
- Compares average sentiment of 3 most recent articles vs. 3 oldest articles
- Positive values indicate improving sentiment
- Negative values indicate deteriorating sentiment

**Consensus Strength**
- Calculated as: `max(bullish%, bearish%) / 100`
- Measures market agreement level
- Values near 1.0 indicate strong consensus

**Time-Segmented Analysis**
- **24-hour sentiment**: Average of articles published in last 24 hours
- **7-day sentiment**: Average of all articles in dataset
- Enables trend detection and recency bias analysis

### Verdict Classification

The final verdict is determined by the weighted average sentiment score:

| Score Range | Verdict | Description |
|-------------|---------|-------------|
| > 0.20 | STRONG BUY | Overwhelmingly positive sentiment |
| 0.05 to 0.20 | BUY | Moderately positive sentiment |
| -0.05 to 0.05 | HOLD | Neutral or mixed sentiment |
| -0.20 to -0.05 | SELL | Moderately negative sentiment |
| < -0.20 | STRONG SELL | Overwhelmingly negative sentiment |

**Confidence Score**

Calculated using multiple factors:
- Sentiment magnitude (stronger signals = higher confidence)
- Article volume (more data = higher confidence)
- Consensus strength (agreement = higher confidence)
- Recency (fresh data = higher confidence)

### Performance Optimization

**Concurrent Execution**
- ThreadPoolExecutor with 7 parallel workers
- Individual source timeouts prevent slowdowns
- Total analysis time: 5-10 seconds (vs. 30+ seconds sequential)

**Data Quality**
- Duplicate detection and removal
- Source attribution for transparency
- Timestamp validation and normalization


## Development

### Running Tests

**Backend API Testing**
```bash
# Test health endpoint
curl http://localhost:8000/

# Test analysis endpoint
curl http://localhost:8000/analyze/TSLA

# Test with international stock
curl http://localhost:8000/analyze/RELIANCE.NS
```

**Frontend Development**
```bash
cd frontend

# Run development server with hot reload
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Project Configuration

**Backend Dependencies** (requirements.txt)
```
fastapi==0.109.0          # Web framework
uvicorn[standard]==0.27.0 # ASGI server
vaderSentiment==3.3.2     # Sentiment analysis
beautifulsoup4==4.12.3    # Web scraping
requests==2.31.0          # HTTP client
feedparser==6.0.11        # RSS parsing
```

**Frontend Dependencies** (package.json)
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "axios": "^1.6.5",
    "recharts": "^2.10.4",
    "lucide-react": "^0.309.0"
  }
}
```

### Environment Variables

No environment variables are required for basic operation. All news sources use publicly accessible endpoints or demo API keys.

Optional configurations can be added to `backend/.env`:
```env
# API Configuration (optional)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Timeout settings (optional)
NEWS_FETCH_TIMEOUT=5
```

## Deployment

### Production Build

**Backend**
```bash
cd backend

# Install production dependencies
pip install -r requirements.txt

# Run with production server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend**
```bash
cd frontend

# Create optimized production build
npm run build

# Output directory: frontend/dist
# Deploy dist/ folder to static hosting service
```

### Deployment Platforms

**Backend Options:**
- Heroku (with Procfile)
- Railway
- Render
- AWS EC2 / Elastic Beanstalk
- Google Cloud Run
- DigitalOcean App Platform

**Frontend Options:**
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

### Performance Considerations

- **Concurrent Processing**: Maintains 5-10 second response time under normal conditions
- **Caching**: Consider implementing Redis cache for frequently queried stocks
- **Rate Limiting**: Implement rate limiting for production API
- **Error Handling**: Graceful degradation when news sources are unavailable

## Troubleshooting

### Common Issues

**Backend won't start**
- Verify Python 3.8+ is installed: `python --version`
- Ensure virtual environment is activated
- Check all dependencies installed: `pip list`
- Port 8000 may be in use: try `--port 8001`

**Frontend build errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Verify Node.js version: `node --version` (16.x+ required)
- Check for conflicting global packages

**CORS errors**
- Verify backend CORS middleware includes frontend URL
- Check both servers are running on expected ports
- Browser may be caching old CORS headers - try incognito mode

**No data returned**
- News sources may be temporarily unavailable
- Some tickers may not have recent news coverage
- Check backend logs for specific source errors

### Debug Mode

Enable detailed logging:
```python
# backend/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

### Code Style

- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ESLint configuration provided
- **Components**: Maintain single responsibility principle
- **Comments**: Document complex logic and algorithms

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Acknowledgments

- **VADER Sentiment Analysis**: Hutto, C.J. & Gilbert, E.E. (2014). VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text
- **News Sources**: Google News, Bing, Yahoo Finance, Finnhub, Marketaux, Seeking Alpha, Alpha Vantage
- **Open Source Libraries**: FastAPI, React, Vite, Tailwind CSS, Recharts

## Author

**Guru R Bharadwaj**
- GitHub: [@guru-bharadwaj20](https://github.com/guru-bharadwaj20)
- LinkedIn: [Guru R Bharadwaj](https://www.linkedin.com/in/guru-r-bharadwaj/)

---

**Built with ❤️ for the financial analysis community**
