import type { EngineInput, Profile, WeightLog, CalorieLog, WorkoutLog, CheckIn } from "../src/types";

// Fixed "now" for deterministic tests
export const TEST_NOW = Date.now();
const day = 864e5;

export const d = (n: number): number => TEST_NOW - n * day;

export const wL = (vals: number[], start: number): WeightLog[] =>
  vals.map((v, i) => ({ value: v, ts: d(start - i) }));

export const cL = (vals: number[], start: number): CalorieLog[] =>
  vals.map((v, i) => ({ value: v, ts: d(start - i) }));

export const wo = (dAgo: number, exs: [string, number, number, number?][]): WorkoutLog => ({
  ts: d(dAgo),
  exercises: exs.map(([n, w, r, s]) => ({ name: n, weight: w, reps: r, sets: s || 3 })),
});

export const ci = (type: string, value: string, dAgo: number): CheckIn => ({
  type, value, ts: d(dAgo),
});

export const prof = (goal: string, opts: {
  exp?: string; g?: string; age?: number; h?: number; w?: number; act?: string;
} = {}): Profile => ({
  goal,
  experience: opts.exp || "1\u20132yr",
  gender: opts.g || "male",
  age: opts.age || 25,
  height: opts.h || 70,
  weight: opts.w || 175,
  activity: opts.act || "4x/week",
});

export const stdW = (prev: number[], curr: number[]): WeightLog[] =>
  [...wL(prev, 12), ...wL(curr, prev.length > 0 ? curr.length : 5)];

export const stdC = (prev: number[], curr: number[]): CalorieLog[] =>
  [...cL(prev, 12), ...cL(curr, prev.length > 0 ? curr.length : 5)];

export const stdWo = (
  prevLifts: [string, number, number, number?][] | null,
  currLifts: [string, number, number, number?][] | null
): WorkoutLog[] => [
  ...(prevLifts ? [wo(11, prevLifts), wo(9, prevLifts)] : []),
  ...(currLifts ? [wo(3, currLifts), wo(1, currLifts)] : []),
];

export function makeInput(opts: {
  profile: Profile;
  wl?: WeightLog[];
  cl?: CalorieLog[];
  wol?: WorkoutLog[];
  ci?: CheckIn[];
  lockedRec?: any;
}): EngineInput {
  return {
    profile: opts.profile,
    weightLogs: opts.wl || [],
    calorieLogs: opts.cl || [],
    workoutLogs: opts.wol || [],
    recommendations: opts.lockedRec ? [opts.lockedRec] : [],
    checkIns: opts.ci || [],
  };
}
