export function DashboardSkeleton() {
  return (
    <div className="space-y-4 pb-28 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="h-3 w-20 bg-[var(--secondary)] rounded mb-2" />
          <div className="h-7 w-40 bg-[var(--secondary)] rounded" />
        </div>
        <div className="h-8 w-24 bg-[var(--secondary)] rounded-lg" />
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-[var(--card)] rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
      ))}
    </div>
  );
}
