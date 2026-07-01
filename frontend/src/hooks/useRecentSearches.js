import { useCallback, useState } from 'react';

const STORAGE_KEY = 'recentSearches';
const MAX_RECENT = 5;

function load() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState(load);

  const addRecent = useCallback((symbol) => {
    setRecentSearches((prev) => {
      const next = [symbol, ...prev.filter((s) => s !== symbol)].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recentSearches, addRecent };
}
