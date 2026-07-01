import { Activity, BarChart3, Newspaper, TrendingUp, Heart, Github, Linkedin, Search, Moon, Sun, Sparkles, Gauge, Cpu } from 'lucide-react';
import { useAnalysis } from './hooks/useAnalysis';
import { useTheme } from './hooks/useTheme';
import SearchBar from './components/SearchBar';
import { Sidebar, MobileStockPicker } from './components/Sidebar';
import LoadingSkeleton from './components/LoadingSkeleton';
import Dashboard from './components/Dashboard';
import { FOCUS_RING } from './constants/ui';

const APP_VERSION = '3.0.0';

export default function App() {
  const { ticker, setTicker, loading, phase, data, error, analyze, recentSearches } = useAnalysis();
  const { isDark, toggle } = useTheme();

  const handleStockSelect = (symbol) => {
    setTicker(symbol);
    analyze(symbol);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 dark:bg-gray-700 rounded-lg">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Stock Sentiment</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Multi-Source NLP Analysis</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-5">
                {[
                  [Newspaper,  '7 Sources'],
                  [BarChart3,  'Real-time'],
                  [TrendingUp, '40+ Stocks'],
                ].map((entry) => {
                  const [Icon, label] = entry;
                  return (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Dark mode toggle */}
              <button
                onClick={toggle}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className={`p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${FOCUS_RING}`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Body */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex gap-8">

            {/* Main column */}
            <main className="flex-1 min-w-0">
              <header className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
                  Market Sentiment Analysis
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-2xl">
                  Aggregate financial news from 7 independent sources in real-time. VADER NLP with
                  financial domain lexicon, source-reliability weighting, and TTL caching.
                </p>
              </header>

              <SearchBar
                ticker={ticker}
                setTicker={setTicker}
                loading={loading}
                onSubmit={(t) => analyze(t)}
                recentSearches={recentSearches}
              />

              <MobileStockPicker activeTicker={ticker} loading={loading} onSelect={handleStockSelect} />

              {error && !loading && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              {loading && <LoadingSkeleton phase={phase} />}

              {data && !loading && <Dashboard data={data} />}

              {!data && !loading && !error && (
                <div className="text-center py-16 sm:py-20 animate-fadeIn">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-5">
                    <Search className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Ready to Analyze</h3>
                  <p className="text-gray-400 dark:text-gray-500 text-sm max-w-md mx-auto mb-8">
                    Enter a ticker above or pick a stock from the panel — we'll pull live news, score sentiment,
                    and hand you a confidence-backed verdict in seconds.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
                    {[
                      [Newspaper, '7 Live Sources', 'Google, Yahoo, Bing, Finnhub, Marketaux, Seeking Alpha & Alpha Vantage, deduplicated in real time'],
                      [Cpu, 'NLP Scoring', 'VADER with a financial lexicon by default, or FinBERT for transformer-grade accuracy'],
                      [Gauge, 'Confidence-Backed Verdicts', 'A 6-factor weighted formula turns raw sentiment into an actionable BUY/HOLD/SELL call'],
                    ].map((entry) => {
                      const [Icon, title, desc] = entry;
                      return (
                        <div key={title} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                          <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 mb-2" />
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{title}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">{desc}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 dark:text-gray-500 mr-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Try:
                    </span>
                    {['TSLA', 'AAPL', 'NVDA', 'RELIANCE.NS'].map((sym) => (
                      <button
                        key={sym}
                        onClick={() => handleStockSelect(sym)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${FOCUS_RING}`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </main>

            {/* Desktop sidebar */}
            <Sidebar activeTicker={ticker} loading={loading} onSelect={handleStockSelect} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm flex-wrap justify-center">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Stock Sentiment Analysis</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">v{APP_VERSION}</span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1.5">
                Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> by{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">Guru R Bharadwaj</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/guru-bharadwaj20" target="_blank" rel="noopener noreferrer"
                 className={`text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded ${FOCUS_RING}`} aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://www.linkedin.com/in/guru-r-bharadwaj/" target="_blank" rel="noopener noreferrer"
                 className={`text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded ${FOCUS_RING}`} aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 Stock Sentiment Analysis · MIT License</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
