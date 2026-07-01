// Shared style tokens so every dashboard panel stays visually consistent.

export const CARD =
  'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200';

export const CARD_PAD = 'p-5';

export const PANEL = `${CARD} ${CARD_PAD}`;

export const PANEL_TITLE = 'text-base font-semibold text-gray-800 dark:text-gray-200';
export const PANEL_SUBTITLE = 'text-xs text-gray-400 dark:text-gray-500 mt-0.5';

export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-500';

// Semantic palette — green (positive) / red (negative) / amber (warning) / blue (information) / gray (secondary).
export const SEMANTIC = {
  positive: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', hex: '#16a34a' },
  negative: { text: 'text-red-600 dark:text-red-400',   bg: 'bg-red-50 dark:bg-red-900/20',   border: 'border-red-200 dark:border-red-800',   hex: '#dc2626' },
  warning:  { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', hex: '#d97706' },
  info:     { text: 'text-blue-600 dark:text-blue-400',  bg: 'bg-blue-50 dark:bg-blue-900/20',  border: 'border-blue-200 dark:border-blue-800',  hex: '#2563eb' },
  neutral:  { text: 'text-gray-600 dark:text-gray-400',  bg: 'bg-gray-50 dark:bg-gray-900',    border: 'border-gray-200 dark:border-gray-700',  hex: '#9ca3af' },
};

export function sentimentTone(score) {
  if (score > 0.05) return SEMANTIC.positive;
  if (score < -0.05) return SEMANTIC.negative;
  return SEMANTIC.neutral;
}

export function timeAgo(isoString) {
  if (!isoString) return null;
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return null;
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 45) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
