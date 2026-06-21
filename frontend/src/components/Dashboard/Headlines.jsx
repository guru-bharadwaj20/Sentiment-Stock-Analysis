import { Clock, Newspaper, ExternalLink } from 'lucide-react';

const scoreColor = (s) => s > 0.05 ? '#16a34a' : s < -0.05 ? '#dc2626' : '#6b7280';

const timeClass = (h) => {
  if (h < 6)  return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  if (h < 24) return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  if (h < 72) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
  return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
};

const SOURCE_STARS = { 1.00: '★★★★★', 0.95: '★★★★½', 0.90: '★★★★', 0.85: '★★★½', 0.80: '★★★', 0.75: '★★½' };

export default function Headlines({ top_comments = [] }) {
  return (
    <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Latest Headlines</h3>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{top_comments.length} articles</span>
      </div>

      <div className="space-y-2 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
        {top_comments.map((c, i) => (
          <div
            key={i}
            className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
          >
            {c.url ? (
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1 group mb-2"
              >
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                  {c.text}
                </p>
                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500 shrink-0 mt-0.5" />
              </a>
            ) : (
              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug mb-2">{c.text}</p>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-gray-500 dark:text-gray-400 font-medium">
                {c.source}
              </span>

              {c.source_weight != null && (
                <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                  {SOURCE_STARS[c.source_weight] ?? ''}
                </span>
              )}

              <span
                className="text-xs px-2 py-0.5 rounded font-semibold"
                style={{
                  backgroundColor: `${scoreColor(c.score)}18`,
                  color: scoreColor(c.score),
                }}
              >
                {c.score > 0 ? '+' : ''}{(c.score * 100).toFixed(1)}%
              </span>

              <span className={`text-xs px-2 py-0.5 rounded font-medium border ${timeClass(c.hours_old)}`}>
                <Clock className="w-3 h-3 inline mr-0.5 -mt-px" />
                {c.time_ago}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
