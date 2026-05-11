import type { WorkoutLog, StrengthTrend } from "./types";

// ─── Named constants ───
const STRENGTH_CHANGE_THRESHOLD = 5; // percent
const MIN_EXPOSURES_RECENT = 2;
const MIN_EXPOSURES_PRIOR = 1;

export function e1rm(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

export function best1RMs(logs: WorkoutLog[], minExposures: number = 1): Record<string, number> {
  const counts: Record<string, number> = {};
  const best: Record<string, number> = {};

  logs.forEach(w => {
    w.exercises?.forEach(e => {
      counts[e.name] = (counts[e.name] || 0) + 1;
      const rm = e1rm(e.weight, e.reps);
      if (!best[e.name] || rm > best[e.name]) best[e.name] = rm;
    });
  });

  const filtered: Record<string, number> = {};
  Object.keys(best).forEach(k => {
    if ((counts[k] || 0) >= minExposures) filtered[k] = best[k];
  });
  return filtered;
}

export function calcStrengthTrend(
  recentWorkouts: WorkoutLog[],
  priorWorkouts: WorkoutLog[]
): StrengthTrend {
  const recent1RMs = best1RMs(recentWorkouts, MIN_EXPOSURES_RECENT);
  const prior1RMs = best1RMs(priorWorkouts, MIN_EXPOSURES_PRIOR);
  const keys = Object.keys(recent1RMs);

  if (keys.length === 0 || Object.keys(prior1RMs).length === 0) return "unknown";

  let ups = 0, downs = 0, total = 0;
  keys.forEach(k => {
    if (prior1RMs[k]) {
      total++;
      const pct = ((recent1RMs[k] - prior1RMs[k]) / prior1RMs[k]) * 100;
      if (pct > STRENGTH_CHANGE_THRESHOLD) ups++;
      else if (pct < -STRENGTH_CHANGE_THRESHOLD) downs++;
    }
  });

  if (total === 0) return "unknown";
  if (ups > downs) return "up";
  if (downs > ups) return "down";
  return "flat";
}
