import { useState, useEffect } from 'react';

export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card p-5 space-y-3">
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-8 w-1/2" />
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-3 w-2/3" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-gray-100 px-6 py-3 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="border-b border-gray-50 px-6 py-4 flex gap-6">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBlock key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="card p-4 flex gap-3 items-center">
          <SkeletonBlock className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-1/3" />
            <SkeletonBlock className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function useSkeletonLoading(ms = 1000) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}
