import { Scale, Flame, Dumbbell, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Recommendation } from "@/types";

function StatCard({ label, value, unit, trend, icon: Icon }: {
  label: string; value: string; unit?: string; trend?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const TrendIcon = trend === "up" || trend === "good_gain" ? TrendingUp
    : trend === "down" || trend === "losing" ? TrendingDown : Minus;
  const trendColor = trend === "up" || trend === "good_gain" ? "text-[#00E676]"
    : trend === "down" || trend === "losing" ? "text-[#FF4455]" : "text-[var(--muted-foreground)]";

  return (
    <div className="bg-[var(--card)] rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:bg-[#151517] active:scale-[0.98]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase">{label}</span>
        <Icon className="w-4 h-4 text-[var(--muted-foreground)]" />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-[var(--foreground)] font-[family-name:var(--font-anybody)] tracking-tight">{value}</span>
        {unit && <span className="text-sm text-[var(--muted-foreground)]">{unit}</span>}
        {trend && <TrendIcon className={`w-4 h-4 ml-auto ${trendColor}`} />}
      </div>
    </div>
  );
}

export function StatsRow({ rec }: { rec: Recommendation }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label="Weight" value={rec.avgWeight ? String(Math.round(rec.avgWeight * 10) / 10) : "—"} unit="lbs" trend={rec.weightTrend} icon={Scale} />
      <StatCard label="Calories" value={rec.avgCalories ? String(Math.round(rec.avgCalories)) : "—"} trend="flat" icon={Flame} />
      <StatCard label="Sessions" value={String(rec.frequency?.workouts || 0)} unit="/wk" icon={Dumbbell} />
    </div>
  );
}
