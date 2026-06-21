import { Server, CheckCircle, XCircle, Clock } from 'lucide-react';

function HealthIcon({ status }) {
  if (status === 'ok') return <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />;
  return <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
}

function sentimentColor(v) {
  if (v > 0.05) return '#16a34a';
  if (v < -0.05) return '#dc2626';
  return '#9ca3af';
}

export default function SourceContribution({ source_contributions, source_health }) {
  const contrib  = source_contributions ?? {};
  const health   = source_health ?? [];
  const healthMap = health.reduce((acc, h) => { acc[h.name] = h; return acc; }, {});

  const sources = Object.entries(contrib).sort(([, a], [, b]) => b.contribution_pct - a.contribution_pct);

  if (!sources.length) return null;

  const failedSources = health.filter((h) => h.status !== 'ok');
  const allOk = failedSources.length === 0;

  return (
    <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Source Contribution Analysis</h3>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {health.filter((h) => h.status === 'ok').length}/{health.length} sources active
        </span>
      </div>

      <div className="space-y-3">
        {sources.map(([name, c]) => {
          const h = healthMap[name];
          const color = sentimentColor(c.avg_sentiment);
          return (
            <div key={name} className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-28 shrink-0">
                {h && <HealthIcon status={h.status} />}
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{name}</span>
              </div>

              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${c.contribution_pct}%`, backgroundColor: '#374151' }}
                />
              </div>

              <div className="flex items-center gap-2 text-xs shrink-0">
                <span className="text-gray-500 dark:text-gray-400 w-10 text-right">{c.contribution_pct}%</span>
                <span className="font-semibold w-14 text-right" style={{ color }}>
                  {c.avg_sentiment > 0 ? '+' : ''}{(c.avg_sentiment * 100).toFixed(1)}%
                </span>
                <span className="text-gray-400 dark:text-gray-500 w-14">{c.articles} art.</span>
                {h && (
                  <span className="text-gray-300 dark:text-gray-600 hidden sm:flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />{h.duration_ms}ms
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!allOk && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-1.5">
          {failedSources.map((h) => (
            <span
              key={h.name}
              className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded"
            >
              {h.name}: {h.error ?? 'error'} ({h.duration_ms}ms)
            </span>
          ))}
        </div>
      )}

      {allOk && health.length > 0 && (
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          All {health.length} sources responded successfully.
        </p>
      )}
    </div>
  );
}
