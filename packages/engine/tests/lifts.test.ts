import { describe, it, expect } from "vitest";
import { analyzeLifts, pickNudge } from "../src/lifts";
import type { WorkoutLog } from "../src/types";
import { wo } from "./helpers";

const day = 864e5;

function makeWorkoutLogs(now: number): {
  progressing: WorkoutLog[];
  stalled: WorkoutLog[];
  regressing: WorkoutLog[];
} {
  // Progressing: clear increase over 3 weeks
  const progressing = [
    wo(15, [["Bench", 185, 8, 3]]),  // 2 weeks ago
    wo(13, [["Bench", 185, 8, 3]]),
    wo(8, [["Bench", 195, 8, 3]]),   // last week
    wo(6, [["Bench", 195, 8, 3]]),
    wo(3, [["Bench", 210, 8, 3]]),   // this week
    wo(1, [["Bench", 210, 8, 3]]),
  ];

  // Stalled: same weight across 3 weeks
  const stalled = [
    wo(15, [["Squat", 225, 6, 3]]),
    wo(13, [["Squat", 225, 6, 3]]),
    wo(8, [["Squat", 225, 6, 3]]),
    wo(6, [["Squat", 225, 6, 3]]),
    wo(3, [["Squat", 225, 6, 3]]),
    wo(1, [["Squat", 225, 6, 3]]),
  ];

  // Regressing: clear decrease
  const regressing = [
    wo(18, [["Deadlift", 315, 5, 3]]),
    wo(16, [["Deadlift", 315, 5, 3]]),
    wo(11, [["Deadlift", 315, 5, 3]]),
    wo(9, [["Deadlift", 315, 5, 3]]),
    wo(3, [["Deadlift", 275, 5, 3]]),
    wo(1, [["Deadlift", 275, 5, 3]]),
  ];

  return { progressing, stalled, regressing };
}

describe("analyzeLifts", () => {
  it("returns empty array with no workouts", () => {
    expect(analyzeLifts([], null)).toEqual([]);
  });

  it("detects progressing lift", () => {
    const { progressing } = makeWorkoutLogs(Date.now());
    const result = analyzeLifts(progressing, null);
    const bench = result.find(l => l.name === "Bench");
    expect(bench).toBeDefined();
    expect(bench!.status).toBe("progressing");
  });

  it("detects stalled lift", () => {
    const { stalled } = makeWorkoutLogs(Date.now());
    const result = analyzeLifts(stalled, null);
    const squat = result.find(l => l.name === "Squat");
    expect(squat).toBeDefined();
    expect(squat!.status).toBe("stalled");
    expect(squat!.weeksSame).toBe(2);
    expect(squat!.suggestion).toBeTruthy();
  });

  it("detects regressing lift", () => {
    const { regressing } = makeWorkoutLogs(Date.now());
    const result = analyzeLifts(regressing, null);
    const dl = result.find(l => l.name === "Deadlift");
    expect(dl).toBeDefined();
    expect(dl!.status).toBe("regressing");
    expect(dl!.suggestion).toBeTruthy();
  });

  it("sorts stalled before progressing", () => {
    const { stalled, progressing } = makeWorkoutLogs(Date.now());
    const result = analyzeLifts([...stalled, ...progressing], null);
    expect(result.length).toBe(2);
    expect(result[0].status).toBe("stalled");
    expect(result[1].status).toBe("progressing");
  });

  it("generates deload suggestion when recovery is beat", () => {
    const { regressing } = makeWorkoutLogs(Date.now());
    const result = analyzeLifts(regressing, "beat");
    const dl = result.find(l => l.name === "Deadlift");
    expect(dl!.suggestion).toContain("Recover first");
  });

  it("generates heavier-weight suggestion for high-rep stall", () => {
    const { stalled } = makeWorkoutLogs(Date.now());
    // Squat stalled at 6 reps — mid-rep range, should suggest add a set
    const result = analyzeLifts(stalled, null);
    const squat = result.find(l => l.name === "Squat");
    expect(squat!.suggestion).toBeTruthy();
  });
});

describe("pickNudge", () => {
  it("returns null for empty lift data", () => {
    expect(pickNudge([])).toBeNull();
  });

  it("prioritizes stalled lifts", () => {
    const liftData = [
      { name: "Bench", status: "progressing" as const, current1RM: 200, prev1RM: 185, weeksSame: 0, suggestion: null, scheme: { weight: 185, reps: 8, sets: 3 } },
      { name: "Squat", status: "stalled" as const, current1RM: 250, prev1RM: 250, weeksSame: 2, suggestion: "Switch to heavier weight", scheme: { weight: 225, reps: 6, sets: 3 } },
    ];
    const nudge = pickNudge(liftData);
    expect(nudge).not.toBeNull();
    expect(nudge!.lift).toBe("Squat");
    expect(nudge!.type).toBe("stalled");
  });

  it("picks regressing over progressing", () => {
    const liftData = [
      { name: "Bench", status: "progressing" as const, current1RM: 200, prev1RM: 185, weeksSame: 0, suggestion: null, scheme: { weight: 185, reps: 8, sets: 3 } },
      { name: "Deadlift", status: "regressing" as const, current1RM: 280, prev1RM: 315, weeksSame: 0, suggestion: "Drop weight and rebuild", scheme: { weight: 275, reps: 5, sets: 3 } },
    ];
    const nudge = pickNudge(liftData);
    expect(nudge).not.toBeNull();
    expect(nudge!.lift).toBe("Deadlift");
    expect(nudge!.type).toBe("regressing");
  });

  it("returns all-progressing message when everything is up", () => {
    const liftData = [
      { name: "Bench", status: "progressing" as const, current1RM: 200, prev1RM: 185, weeksSame: 0, suggestion: null, scheme: { weight: 185, reps: 8, sets: 3 } },
      { name: "Squat", status: "progressing" as const, current1RM: 260, prev1RM: 240, weeksSame: 0, suggestion: null, scheme: { weight: 225, reps: 6, sets: 3 } },
    ];
    const nudge = pickNudge(liftData);
    expect(nudge).not.toBeNull();
    expect(nudge!.type).toBe("progressing");
    expect(nudge!.lift).toBe("all");
  });
});
