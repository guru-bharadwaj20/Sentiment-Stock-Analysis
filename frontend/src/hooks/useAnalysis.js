import { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeTicker } from '../services/api';
import { useRecentSearches } from './useRecentSearches';

const PHASES = [
  'Fetching news from 7 sources…',
  'Deduplicating articles…',
  'Running sentiment analysis…',
  'Computing metrics & confidence…',
  'Rendering dashboard…',
];

const PHASE_DELAYS = [0, 2500, 5000, 7500, 10000];

export function useAnalysis() {
  const [ticker, setTicker]   = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase]     = useState('');
  const [data, setData]       = useState(null);
  const [error, setError]     = useState('');
  const timers                = useRef([]);
  const { recentSearches, addRecent } = useRecentSearches();

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const analyze = useCallback(async (symbol) => {
    const sym = (symbol ?? ticker).trim().toUpperCase();
    if (!sym) { setError('Please enter a ticker symbol'); return; }

    clearTimers();
    setLoading(true);
    setError('');
    setData(null);
    setPhase(PHASES[0]);

    PHASE_DELAYS.slice(1).forEach((delay, i) => {
      timers.current.push(setTimeout(() => setPhase(PHASES[i + 1]), delay));
    });

    try {
      const result = await analyzeTicker(sym);
      clearTimers();
      setPhase(PHASES[4]);
      setData(result);
      addRecent(sym);
    } catch (err) {
      clearTimers();
      const apiError = err?.response?.data?.error;
      setError(
        apiError?.message
          ?? err?.response?.data?.detail
          ?? 'Analysis failed — is the backend running on port 8000?'
      );
    } finally {
      setLoading(false);
      setPhase('');
    }
  }, [ticker, addRecent]);

  return { ticker, setTicker, loading, phase, data, error, analyze, recentSearches };
}
