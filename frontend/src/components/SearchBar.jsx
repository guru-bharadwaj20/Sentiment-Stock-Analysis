import { Search, Loader2 } from 'lucide-react';

export default function SearchBar({ ticker, setTicker, loading, onSubmit }) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="mb-6"
    >
      <div className="flex items-center bg-white rounded-xl shadow-sm border-2 border-gray-200 focus-within:border-gray-900 transition-colors overflow-hidden">
        <Search className="w-4 h-4 text-gray-400 ml-4 shrink-0" />
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Enter ticker — TSLA, AAPL, RELIANCE.NS …"
          className="flex-1 px-3 py-3.5 bg-transparent text-gray-900 text-sm outline-none placeholder-gray-400"
          disabled={loading}
          maxLength={15}
          aria-label="Stock ticker symbol"
        />
        <button
          type="submit"
          disabled={loading || !ticker.trim()}
          className="px-6 py-3.5 bg-gray-900 hover:bg-gray-700 active:bg-gray-800 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Analyze stock"
        >
          {loading
            ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span>Analyzing</span></span>
            : 'Analyze'
          }
        </button>
      </div>
    </form>
  );
}
