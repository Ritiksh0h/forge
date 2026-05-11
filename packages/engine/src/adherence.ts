import type { EngineInput, Adherence, Frequency } from "./types";

const WEEK_MS = 7 * 864e5;
const DAYS_IN_WEEK = 7;

export function calcAdherence(data: EngineInput, now: number = Date.now()): Adherence {
  const byType = { weight: new Set<string>(), calories: new Set<string>(), workout: new Set<string>() };
  const all = new Set<string>();

  const count = (logs: { ts: number }[], type: "weight" | "calories" | "workout") => {
    logs.forEach(l => {
      if (now - l.ts < WEEK_MS) {
        const ds = new Date(l.ts).toDateString();
        byType[type].add(ds);
        all.add(ds);
      }
    });
  };

  count(data.weightLogs, "weight");
  count(data.calorieLogs, "calories");
  count(data.workoutLogs, "workout");

  return {
    weight: byType.weight.size,
    calories: byType.calories.size,
    workouts: byType.workout.size,
    total: all.size,
    pct: Math.round((all.size / DAYS_IN_WEEK) * 100),
  };
}

export function calcStreak(data: EngineInput, now: number = Date.now()): number {
  const allTs = [...data.weightLogs, ...data.calorieLogs, ...data.workoutLogs].map(l => l.ts);
  if (!allTs.length) return 0;
  const days = new Set(allTs.map(ts => new Date(ts).toDateString()));
  let streak = 0;
  const d = new Date(now);
  if (!days.has(d.toDateString())) {
    d.setDate(d.getDate() - 1);
    if (!days.has(d.toDateString())) return 0;
  }
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function calcFrequency(data: EngineInput, now: number = Date.now()): Frequency {
  return {
    weight: data.weightLogs.filter(w => now - w.ts < WEEK_MS).length,
    calories: data.calorieLogs.filter(c => now - c.ts < WEEK_MS).length,
    workouts: data.workoutLogs.filter(w => now - w.ts < WEEK_MS).length,
  };
}
