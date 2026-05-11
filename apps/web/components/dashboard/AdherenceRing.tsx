export function AdherenceRing({ pct, total }: { pct: number; total: number }) {
  const r = 40, sw = 4, circ = 2 * Math.PI * r;
  const off = circ - (pct / 100) * circ;
  const color = pct >= 80 ? "#00E676" : pct >= 50 ? "#FFAB00" : "#FF4455";

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1A1A1E" strokeWidth={sw} />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[var(--foreground)] font-[family-name:var(--font-anybody)]">{pct}%</span>
        <span className="text-[10px] text-[var(--muted-foreground)] tracking-wide mt-0.5">{total}/7 DAYS</span>
      </div>
    </div>
  );
}
