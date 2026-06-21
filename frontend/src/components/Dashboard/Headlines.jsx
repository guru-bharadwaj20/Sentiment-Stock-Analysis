import { Clock, Newspaper, ExternalLink } from 'lucide-react';

const scoreColor = (s) => s > 0.05 ? '#16a34a' : s < -0.05 ? '#dc2626' : '#6b7280';

const timeClass = (h) => {
  if (h < 6)  return 'text-green-700 bg-green-50 border-green-200';
  if (h < 24) return 'text-blue-700 bg-blue-50 border-blue-200';
  if (h < 72) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-gray-600 bg-gray-100 border-gray-200';
};

const SOURCE_STARS = { 1.00: '★★★★★', 0.95: '★★★★½', 0.90: '★★★★', 0.85: '★★★½', 0.80: '★★★', 0.75: '★★½' };

export default function Headlines({ top_comments = [] }) {
  return (
    <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Latest Headlines</h3>
        </div>
        <span className="text-xs text-gray-400 font-medium">{top_comments.length} articles</span>
      </div>

      <div className="space-y-2 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
        {top_comments.map((c, i) => (
          <div
            key={i}
            className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors"
          >
            {/* Title */}
            {c.url ? (
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1 group mb-2"
              >
                <p className="text-sm text-gray-800 font-medium leading-snug group-hover:text-blue-700 transition-colors">
                  {c.text}
                </p>
                <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-500 shrink-0 mt-0.5" />
              </a>
            ) : (
              <p className="text-sm text-gray-800 font-medium leading-snug mb-2">{c.text}</p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Source */}
              <span className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-500 font-medium">
                {c.source}
              </span>

              {/* Reliability */}
              {c.source_weight != null && (
                <span className="text-xs text-gray-400 hidden sm:inline">
                  {SOURCE_STARS[c.source_weight] ?? ''}
                </span>
              )}

              {/* Sentiment score */}
              <span
                className="text-xs px-2 py-0.5 rounded font-semibold"
                style={{
                  backgroundColor: `${scoreColor(c.score)}18`,
                  color: scoreColor(c.score),
                }}
              >
                {c.score > 0 ? '+' : ''}{(c.score * 100).toFixed(1)}%
              </span>

              {/* Recency */}
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
