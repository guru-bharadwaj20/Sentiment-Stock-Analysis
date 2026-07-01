import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, X, History } from 'lucide-react';
import { STOCK_DATA } from '../constants/stocks';
import { FOCUS_RING } from '../constants/ui';

const ALL_STOCKS = Object.values(STOCK_DATA)
  .flat()
  .reduce((acc, s) => {
    if (!acc.some((x) => x.symbol === s.symbol)) acc.push(s);
    return acc;
  }, []);

function getSuggestions(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return ALL_STOCKS.filter(
    (s) =>
      s.symbol.toLowerCase().startsWith(q) ||
      s.name.toLowerCase().includes(q)
  ).slice(0, 5);
}

function getRecentAsSuggestions(recentSearches) {
  return recentSearches.map((sym) => ALL_STOCKS.find((s) => s.symbol === sym) ?? { symbol: sym, name: 'Recent search', sector: '' });
}

export default function SearchBar({ ticker, setTicker, loading, onSubmit, recentSearches = [] }) {
  const [suggestions, setSuggestions]   = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showingRecent, setShowingRecent] = useState(false);
  const [activeIdx, setActiveIdx]        = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase();
    setTicker(val);
    if (!val) {
      const recent = getRecentAsSuggestions(recentSearches);
      setSuggestions(recent);
      setShowingRecent(true);
      setShowSuggestions(recent.length > 0);
      setActiveIdx(-1);
      return;
    }
    const suggs = getSuggestions(val);
    setSuggestions(suggs);
    setShowingRecent(false);
    setShowSuggestions(suggs.length > 0);
    setActiveIdx(-1);
  };

  const selectSuggestion = (symbol) => {
    setTicker(symbol);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowingRecent(false);
    setActiveIdx(-1);
    onSubmit(symbol);
  };

  const clearTicker = () => {
    setTicker('');
    setSuggestions([]);
    setShowSuggestions(false);
    setShowingRecent(false);
    setActiveIdx(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIdx].symbol);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIdx(-1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSubmit();
  };

  const focusSuggestions = () => {
    if (!ticker.trim()) {
      const recent = getRecentAsSuggestions(recentSearches);
      setSuggestions(recent);
      setShowingRecent(true);
      setShowSuggestions(recent.length > 0);
      return;
    }
    const suggs = getSuggestions(ticker);
    setSuggestions(suggs);
    setShowingRecent(false);
    setShowSuggestions(suggs.length > 0);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div ref={containerRef} className="relative">
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 focus-within:border-gray-900 dark:focus-within:border-gray-400 transition-colors overflow-visible">
          <Search className="w-4 h-4 text-gray-400 ml-4 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={ticker}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={focusSuggestions}
            placeholder="Enter ticker — TSLA, AAPL, RELIANCE.NS …"
            className="flex-1 px-3 py-3.5 bg-transparent text-gray-900 dark:text-gray-100 text-sm outline-none placeholder-gray-400 dark:placeholder-gray-500"
            disabled={loading}
            maxLength={15}
            aria-label="Stock ticker symbol"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            role="combobox"
          />
          {ticker && !loading && (
            <button
              type="button"
              onClick={clearTicker}
              className={`p-1.5 mr-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${FOCUS_RING}`}
              aria-label="Clear ticker"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !ticker.trim()}
            className={`px-6 py-3.5 bg-gray-900 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 active:bg-gray-800 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS_RING}`}
            aria-label="Analyze stock"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing</span>
              </span>
            ) : (
              'Analyze'
            )}
          </button>
        </div>

        {showSuggestions && !loading && (
          <ul
            role="listbox"
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
          >
            {showingRecent && (
              <li className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide bg-gray-50 dark:bg-gray-900">
                <History className="w-3 h-3" />
                Recent Searches
              </li>
            )}
            {suggestions.map((s, i) => (
              <li
                key={s.symbol}
                role="option"
                aria-selected={i === activeIdx}
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s.symbol); }}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-sm ${
                  i === activeIdx
                    ? 'bg-gray-900 dark:bg-gray-600 text-white'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                <span className="font-bold">{s.symbol}</span>
                <span
                  className={`text-xs truncate max-w-[200px] ${
                    i === activeIdx ? 'text-gray-300' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {s.sector ? `${s.name} · ${s.sector}` : s.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}
