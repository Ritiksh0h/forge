import type { GainTarget, WeightTrend } from "./types";

// ─── Named constants ───
export const GAIN_TARGETS: Record<string, GainTarget> = {
  "Lean Bulk": { min: 0.1, max: 0.5 },
  "Aggressive Bulk": { min: 0.3, max: 0.8 },
  "Recomp": { min: -0.1, max: 0.2 },
};

const DEFAULT_TARGET: GainTarget = { min: 0.1, max: 0.5 };

export function calcWeightTrend(
  avgRecentWeight: number | null,
  avgPriorWeight: number | null,
  goal: string
): { trend: WeightTrend; delta: number | null } {
  if (avgRecentWeight === null || avgPriorWeight === null) {
    return { trend: "unknown", delta: null };
  }

  const targets = GAIN_TARGETS[goal] || DEFAULT_TARGET;
  const delta = avgRecentWeight - avgPriorWeight;
  const pct = (delta / avgPriorWeight) * 100;

  let trend: WeightTrend;
  if (pct > targets.max) trend = "fast_gain";
  else if (pct > targets.min) trend = "good_gain";
  else if (pct < (targets.min < 0 ? targets.min - 0.1 : -0.1)) trend = "losing";
  else trend = "flat";

  return { trend, delta };
}
