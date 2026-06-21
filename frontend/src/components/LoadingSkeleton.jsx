const Pulse = ({ className }) => (
  <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
);

export default function LoadingSkeleton({ phase }) {
  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Phase message */}
      {phase && (
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 rounded-xl text-white text-sm font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
          {phase}
        </div>
      )}

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 bg-white rounded-xl border border-gray-200">
            <Pulse className="h-3 w-24 mb-4" />
            <Pulse className="h-7 w-20 mb-2" />
            <Pulse className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Verdict + stock info skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-6 bg-white rounded-xl border border-gray-200">
          <div className="flex justify-between mb-5">
            <div>
              <Pulse className="h-7 w-40 mb-2" />
              <Pulse className="h-3 w-56" />
            </div>
            <Pulse className="h-10 w-16 rounded-lg" />
          </div>
          <Pulse className="h-2 w-full mb-5" />
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Pulse className="h-3 w-16 mb-1" />
                <Pulse className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <Pulse className="h-4 w-32 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mb-3">
              <Pulse className="h-3 w-16 mb-1" />
              <Pulse className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-5 bg-white rounded-xl border border-gray-200">
            <Pulse className="h-4 w-40 mb-4" />
            <Pulse className="h-56 w-full" />
          </div>
        ))}
      </div>

      {/* Headlines skeleton */}
      <div className="p-5 bg-white rounded-xl border border-gray-200">
        <Pulse className="h-4 w-36 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mb-3 p-3 bg-gray-50 rounded-lg">
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
