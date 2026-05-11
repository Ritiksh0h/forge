import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function TrendIndicators({ weightTrend, strengthTrend }: { weightTrend: string; strengthTrend: string }) {
  const cfg = (t: string) => {
    if (t === "up" || t === "good_gain") return { Icon: TrendingUp, color: "text-[#00E676]" };
    if (t === "down" || t === "losing") return { Icon: TrendingDown, color: "text-[#FF4455]" };
    if (t === "fast_gain") return { Icon: TrendingUp, color: "text-[#FFAB00]" };
    return { Icon: Minus, color: "text-[var(--muted-foreground)]" };
  };
  const w = cfg(weightTrend), s = cfg(strengthTrend);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="text-[9px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase w-14">Weight</span>
        <w.Icon className={`w-4 h-4 ${w.color}`} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[9px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase w-14">Lifts</span>
        <s.Icon className={`w-4 h-4 ${s.color}`} />
      </div>
    </div>
  );
}
