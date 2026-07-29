export default function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="skeleton h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
