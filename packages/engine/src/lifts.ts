import type { WorkoutLog } from "./types";
import { e1rm } from "./strength-trend";

// ─── Named constants ───
const WEEK_MS = 864e5 * 7;
const STALL_THRESHOLD_PCT = 5;
const STALL_WEEKS = 2;
const HIGH_REP_CUTOFF = 8;
const LOW_REP_CUTOFF = 5;
const DELOAD_FACTOR = 0.85;
const RESET_FACTOR = 0.9;
const OVERLOAD_FACTOR = 1.1;

export interface LiftStatus {
  name: string;
  status: "progressing" | "flat" | "stalled" | "regressing" | "unknown";
  current1RM: number | null;
  prev1RM: number | null;
  weeksSame: number;
  suggestion: string | null;
  scheme: { weight: number; reps: number; sets: number } | null;
}

export interface TrainingNudge {
  lift: string;
  type: "stalled" | "regressing" | "progressing";
  msg: string;
}

export function analyzeLifts(
  workoutLogs: WorkoutLog[],
  lastRecovery: string | number | null,
  now: number = Date.now()
): LiftStatus[] {
  const windows = [
    { logs: workoutLogs.filter(w => now - w.ts < WEEK_MS) },
    { logs: workoutLogs.filter(w => now - w.ts >= WEEK_MS && now - w.ts < 2 * WEEK_MS) },
    { logs: workoutLogs.filter(w => now - w.ts >= 2 * WEEK_MS && now - w.ts < 3 * WEEK_MS) },
  ];

  const allNames = new Set<string>();
  windows.forEach(w => w.logs.forEach(l => l.exercises?.forEach(e => allNames.add(e.name))));

  const best = (logs: WorkoutLog[], name: string): number | null => {
    let max = 0;
    logs.forEach(l => l.exercises?.forEach(e => {
      if (e.name === name) {
        const rm = e1rm(e.weight, e.reps);
        if (rm > max) max = rm;
      }
    }));
    return max || null;
  };

  const lastScheme = (name: string) => {
    for (let i = workoutLogs.length - 1; i >= 0; i--) {
      const ex = workoutLogs[i].exercises?.find(e => e.name === name);
      if (ex) return { weight: ex.weight, reps: ex.reps, sets: ex.sets };
    }
    return null;
  };

  const results: LiftStatus[] = [];
  allNames.forEach(name => {
    const curr = best(windows[0].logs, name);
    const prev = best(windows[1].logs, name);
    const prev2 = best(windows[2].logs, name);
    const scheme = lastScheme(name);
    if (!curr || !scheme) return;

    let status: LiftStatus["status"] = "unknown";
    let weeksSame = 0;
    let suggestion: string | null = null;

    if (prev) {
      const changePct = ((curr - prev) / prev) * 100;
      if (changePct > STALL_THRESHOLD_PCT) {
        status = "progressing";
      } else if (changePct < -STALL_THRESHOLD_PCT) {
        status = "regressing";
        if (lastRecovery === "beat" || lastRecovery === "sore") {
          suggestion = "Drop to " + Math.round(scheme.weight * DELOAD_FACTOR) + " lbs for " + (scheme.reps + 2) + " reps. Recover first.";
        } else {
          suggestion = "Try " + Math.round(scheme.weight * RESET_FACTOR) + " lbs x " + (scheme.reps + 2) + " reps. Reset and rebuild.";
        }
      } else {
        if (prev2) {
          const change2 = ((curr - prev2) / prev2) * 100;
          if (Math.abs(change2) <= STALL_THRESHOLD_PCT) {
            status = "stalled";
            weeksSame = STALL_WEEKS;
            if (scheme.reps >= HIGH_REP_CUTOFF) {
              suggestion = "Switch to " + Math.round(scheme.weight * OVERLOAD_FACTOR) + " lbs x 5 reps x " + (scheme.sets + 1) + " sets. Heavier weight, fewer reps.";
            } else if (scheme.reps <= LOW_REP_CUTOFF) {
              suggestion = "Drop to " + Math.round(scheme.weight * DELOAD_FACTOR) + " lbs x 10 reps x 3 sets. Volume phase for 2 weeks.";
            } else {
              suggestion = "Add 1 set at current weight, or swap for a close variation.";
            }
          } else {
            status = "flat";
          }
        } else {
          status = "flat";
        }
      }
    }

    results.push({ name, status, current1RM: curr ? Math.round(curr) : null, prev1RM: prev ? Math.round(prev) : null, weeksSame, suggestion, scheme });
  });

  const order: Record<string, number> = { stalled: 0, regressing: 1, flat: 2, progressing: 3, unknown: 4 };
  results.sort((a, b) => (order[a.status] ?? 4) - (order[b.status] ?? 4));
  return results;
}

export function pickNudge(liftData: LiftStatus[]): TrainingNudge | null {
  if (!liftData.length) return null;
  const stalled = liftData.filter(l => l.status === "stalled" && l.suggestion);
  if (stalled.length) return { lift: stalled[0].name, type: "stalled", msg: stalled[0].suggestion! };
  const regressing = liftData.filter(l => l.status === "regressing" && l.suggestion);
  if (regressing.length) return { lift: regressing[0].name, type: "regressing", msg: regressing[0].suggestion! };
  const allProg = liftData.filter(l => l.status === "progressing");
  if (allProg.length === liftData.length && liftData.length >= 2) return { lift: "all", type: "progressing", msg: "Every tracked lift is progressing. Keep doing exactly what you are doing." };
  return null;
}
