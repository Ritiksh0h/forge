import { StatusBadge, mapStatus, mapConfidence } from "@/components/ui/Badge";
import type { Recommendation } from "@/types";

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const borderColor = rec.status === "on_track" ? "#00E676" : rec.status === "off_track" ? "#FF4455" : "#D4FF00";

  return (
    <div className="bg-[var(--card)] rounded-2xl p-5 animate-fade-in" style={{ border: `1px solid ${borderColor}33` }}>
      <div className="flex items-center gap-2 mb-5">
        <StatusBadge status={rec.statusLabel || rec.status} variant={mapStatus(rec.status)} />
        <StatusBadge status={rec.confidence || "low"} variant={mapConfidence(rec.confidence)} />
      </div>

      <p className="text-sm text-[var(--muted-foreground)] mb-5 leading-relaxed">{rec.reason}</p>
      {rec.confidenceReason && (
        <p className="text-[11px] text-[var(--text-tertiary)] mb-5">{rec.confidenceReason}</p>
      )}

      <div className="border-l-[3px] border-[var(--primary)] pl-4 mb-4 py-3 bg-[var(--primary)]/5 rounded-r-xl">
        <span className="text-[9px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase block mb-1.5">Calories</span>
        <span className="text-lg font-bold text-[var(--foreground)] font-[family-name:var(--font-anybody)]">{rec.calorieAction}</span>
      </div>

      <div className="border-l-[3px] border-[#3388FF] pl-4 py-3 bg-[#3388FF]/5 rounded-r-xl">
        <span className="text-[9px] font-semibold tracking-[2px] text-[var(--muted-foreground)] uppercase block mb-1.5">Training</span>
        <span className="text-lg font-bold text-[var(--foreground)] font-[family-name:var(--font-anybody)]">{rec.workoutAction}</span>
      </div>

      {(rec.sleepAvg || rec.stressAvg || rec.lastRecovery) && (
        <div className="flex gap-2 mt-5">
          {rec.sleepAvg && <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--secondary)] px-3 py-1.5 rounded-lg">Sleep: {rec.sleepAvg.toFixed(1)}/5</span>}
          {rec.stressAvg && <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--secondary)] px-3 py-1.5 rounded-lg">Stress: {rec.stressAvg.toFixed(1)}/5</span>}
          {rec.lastRecovery && <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--secondary)] px-3 py-1.5 rounded-lg">Recovery: {rec.lastRecovery}</span>}
        </div>
      )}

      <div className="flex gap-2 mt-5">
        <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--secondary)] px-3 py-1.5 rounded-lg">{rec.week}</span>
        <span className="text-[10px] text-[var(--muted-foreground)] bg-[var(--secondary)] px-3 py-1.5 rounded-lg">{rec.goal}</span>
      </div>
    </div>
  );
}
