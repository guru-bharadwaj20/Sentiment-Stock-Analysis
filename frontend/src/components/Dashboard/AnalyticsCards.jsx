import { FileText, Copy, Wifi, Database, Timer, Download } from 'lucide-react';

function MiniCard({ Icon, label, value, sub, color }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-lg font-bold tabular-nums ${color ?? 'text-gray-800 dark:text-gray-200'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AnalyticsCards({ meta, timing, cached, onExport }) {
  const m = meta ?? {};
  const t = timing ?? {};

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      <MiniCard
        Icon={FileText}
        label="Scanned"
        value={m.articles_raw ?? '—'}
        sub="raw articles"
      />
      <MiniCard
        Icon={Copy}
        label="Dupes"
        value={m.duplicates_removed ?? 0}
        sub="removed"
        color={(m.duplicates_removed ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-800 dark:text-gray-200'}
      />
      <MiniCard
        Icon={Wifi}
        label="Sources"
        value={`${m.sources_succeeded ?? 0}/${m.sources_total ?? 7}`}
        sub="responded"
        color={
          (m.sources_succeeded ?? 0) >= (m.sources_total ?? 7)
            ? 'text-green-600 dark:text-green-400'
            : 'text-amber-600 dark:text-amber-400'
        }
      />
      <MiniCard
        Icon={Database}
        label="Cache"
        value={cached ? 'HIT' : 'MISS'}
        sub={cached ? 'served instantly' : 'fresh fetch'}
        color={cached ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}
      />
      <MiniCard
        Icon={Timer}
        label="Time"
        value={t.total_s != null ? `${t.total_s}s` : '—'}
        sub={t.fetch_s != null ? `fetch ${t.fetch_s}s` : 'cached'}
      />

      {/* Export card */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">Export</span>
        </div>
        <div className="flex gap-1.5 mt-auto">
          <button
            onClick={() => onExport?.('json')}
            className="px-2.5 py-1 text-xs font-semibold bg-gray-900 dark:bg-gray-600 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-500 transition-colors"
          >
            JSON
          </button>
          <button
            onClick={() => onExport?.('csv')}
            className="px-2.5 py-1 text-xs font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            CSV
          </button>
        </div>
      </div>
    </div>
  );
}
