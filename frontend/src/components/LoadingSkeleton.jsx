import { CheckCircle, Loader } from 'lucide-react';

const Pulse = ({ className }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ${className}`} />
);

const PIPELINE = [
  { label: 'Fetching News',            match: 'Fetching' },
  { label: 'Removing Duplicates',      match: 'Deduplicating' },
  { label: 'Running Sentiment Model',  match: 'Running sentiment' },
  { label: 'Computing Metrics',        match: 'Computing' },
  { label: 'Rendering Dashboard',      match: 'Rendering' },
];

function PipelineBar({ phase }) {
  const currentIdx = PIPELINE.findIndex((s) => phase?.includes(s.match));
  const activeIdx  = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className="px-4 py-3 bg-gray-900 dark:bg-gray-800 rounded-xl">
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
        {PIPELINE.map((step, i) => {
          const done    = i < activeIdx;
          const active  = i === activeIdx;
          const pending = i > activeIdx;
          return (
            <div key={step.label} className="flex items-center gap-1 sm:gap-2">
              <div className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                done    ? 'text-green-400' :
                active  ? 'text-white' :
                          'text-gray-500'
              }`}>
                {done ? (
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                ) : active ? (
                  <Loader className="w-3.5 h-3.5 shrink-0 animate-spin" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0 inline-block" />
                )}
                <span className={pending ? 'hidden sm:inline' : ''}>{step.label}</span>
              </div>
              {i < PIPELINE.length - 1 && (
                <span className={`text-gray-600 text-xs hidden sm:inline ${done ? 'text-gray-500' : ''}`}>
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ phase }) {
  return (
    <div className="space-y-8 animate-fadeIn">
      <PipelineBar phase={phase} />

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Pulse className="h-3 w-16 mb-3" />
            <Pulse className="h-5 w-12" />
          </div>
        ))}
      </div>

      {/* Verdict + stock info skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between mb-5">
            <div>
              <Pulse className="h-7 w-40 mb-2" />
              <Pulse className="h-4 w-28 mb-2" />
              <Pulse className="h-3 w-56" />
            </div>
            <Pulse className="h-10 w-16 rounded-lg" />
          </div>
          <Pulse className="h-2 w-full mb-5" />
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Pulse className="h-3 w-16 mb-1" />
                <Pulse className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Pulse className="h-4 w-32 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mb-3">
              <Pulse className="h-3 w-16 mb-1" />
              <Pulse className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Pulse className="h-3 w-24 mb-4" />
            <Pulse className="h-7 w-20 mb-2" />
            <Pulse className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Pulse className="h-4 w-40 mb-4" />
            <Pulse className="h-56 w-full" />
          </div>
        ))}
      </div>

      {/* Headlines skeleton */}
      <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Pulse className="h-4 w-36 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Pulse className="h-4 w-full mb-2" />
            <Pulse className="h-3 w-3/4 mb-2" />
            <div className="flex gap-2">
              <Pulse className="h-5 w-20" />
              <Pulse className="h-5 w-14" />
              <Pulse className="h-5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
