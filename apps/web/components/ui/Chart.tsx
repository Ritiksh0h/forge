export function Sparkline({ data, color = "#D4FF00", label }: { data: { value: number }[]; color?: string; label: string }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-12 text-[var(--muted-foreground)] text-xs">No data</div>
  );
  const vals = data.map(d => d.value);
  const max = Math.max(...vals), min = Math.min(...vals), range = max - min || 1;
  const w = 140, h = 48, p = 4;
  const pts = vals.map((v, i) => {
    const x = p + (i / (vals.length - 1)) * (w - p * 2);
    const y = h - p - ((v - min) / range) * (h - p * 2);
    return `${x},${y}`;
  }).join(" ");
  const lastX = vals.length === 1 ? w / 2 : w - p;
  const lastY = h - p - ((vals[vals.length - 1] - min) / range) * (h - p * 2);
  const gid = `g-${label.replace(/\s/g, "-")}`;

  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${p},${h - p} ${pts} ${lastX},${h - p}`} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="4" fill={color} className="drop-shadow-[0_0_8px_rgba(212,255,0,0.6)]" />
    </svg>
  );
}
