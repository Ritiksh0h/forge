import type { EngineInput, Recommendation } from "./types";
import { calcTDEE } from "./tdee";
import { calcAdherence, calcStreak, calcFrequency } from "./adherence";
import { calcWeightTrend } from "./weight-trend";
import { calcStrengthTrend } from "./strength-trend";
import { calcConfidence } from "./confidence";
import { recentAvg } from "./checkins";

// ─── Named constants ───
const WEEK_MS = 7 * 864e5;
const TWO_WEEK_MS = 14 * 864e5;
const MIN_RECENT_WEIGHINS = 3;
const MIN_PRIOR_WEIGHINS = 2;
const LOW_ADHERENCE_PCT = 50;
const CALORIE_BUMP_LOSING = 300;
const CALORIE_BUMP_STALLED = 200;
const CALORIE_CUT_FAST = 200;
const LOW_SLEEP_THRESHOLD = 3;
const LOW_STRESS_THRESHOLD = 3;

function avg(a: number[]): number | null {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
}

export function weekKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const s = new Date(d);
  s.setDate(d.getDate() - d.getDay());
  return s.getFullYear() + "-" + String(s.getMonth() + 1).padStart(2, "0") + "-" + String(s.getDate()).padStart(2, "0");
}

export function recommend(data: EngineInput, now: number = Date.now()): Recommendation {
  const wk = weekKey(now);

  // Check for locked recommendation this week
  const locked = data.recommendations.find(r => r.week === wk && r.locked);
  if (locked) return locked.result;

  // Split logs into recent (this week) and prior (last week)
  const rw = data.weightLogs.filter(w => now - w.ts < WEEK_MS).map(w => w.value);
  const pw = data.weightLogs.filter(w => now - w.ts >= WEEK_MS && now - w.ts < TWO_WEEK_MS).map(w => w.value);
  const rc = data.calorieLogs.filter(c => now - c.ts < WEEK_MS).map(c => c.value);
  const rWorkouts = data.workoutLogs.filter(w => now - w.ts < WEEK_MS);
  const pWorkouts = data.workoutLogs.filter(w => now - w.ts >= WEEK_MS && now - w.ts < TWO_WEEK_MS);

  const avgRW = avg(rw);
  const avgPW = avg(pw);
  const avgCal = avg(rc);
  const adh = calcAdherence(data, now);
  const freq = calcFrequency(data, now);
  const streakDays = calcStreak(data, now);
  const goal = data.profile?.goal || "Lean Bulk";

  // Check-in signals
  const sleepAvg = recentAvg(data.checkIns || [], "sleep", now) as number | null;
  const stressAvg = recentAvg(data.checkIns || [], "stress", now) as number | null;
  const lastAdherence = recentAvg(data.checkIns || [], "adherence", now);
  const lastRecovery = recentAvg(data.checkIns || [], "recovery", now) as string | null;

  const tdee = calcTDEE(data.profile);
  const hasEnoughHistory = rw.length >= MIN_RECENT_WEIGHINS && pw.length >= MIN_PRIOR_WEIGHINS;
  const isCalibrating = !hasEnoughHistory;

  // Confidence
  const { confidence, reason: confidenceReason } = calcConfidence(rw.length, pw.length, adh.calories, lastAdherence);

  // Strength trend
  const strengthTrend = calcStrengthTrend(rWorkouts, pWorkouts);

  // Weight trend
  const { trend: weightTrend, delta } = calcWeightTrend(avgRW, avgPW, goal);

  // ─── CALIBRATING ───
  if (isCalibrating) {
    const calTarget = tdee ? tdee.target : null;
    return {
      status: "collecting",
      statusLabel: "Calibrating",
      confidence: "low",
      confidenceReason: rw.length + " weigh-in(s).",
      calorieAction: calTarget ? "Start at ~" + calTarget + " cal/day" : "Keep logging daily",
      workoutAction: "Train consistently",
      reason: "Calibrating.",
      adherence: adh,
      frequency: freq,
      streak: streakDays,
      delta: null,
      strengthTrend: "unknown",
      weightTrend: "unknown",
      avgWeight: avgRW,
      avgCalories: avgCal,
      ts: now,
      week: wk,
      goal,
      tdee,
      isCalibrating: true,
      sleepAvg,
      stressAvg,
      lastRecovery,
    };
  }

  // ─── ACTIVE RECOMMENDATIONS ───
  let status: Recommendation["status"];
  let statusLabel: string;
  let calorieAction: string;
  let workoutAction: string;
  let reason: string;

  const sleepNote = sleepAvg !== null && sleepAvg < LOW_SLEEP_THRESHOLD ? " Low sleep." : "";
  const stressNote = stressAvg !== null && stressAvg < LOW_STRESS_THRESHOLD ? " High stress." : "";
  const recoveryNote = lastRecovery === "beat" ? " Beat up." : "";

  if (adh.pct < LOW_ADHERENCE_PCT) {
    status = "off_track";
    statusLabel = "Low Adherence";
    calorieAction = "Focus on logging consistently before adjusting";
    workoutAction = "Show up. 3 sessions minimum.";
    reason = "Low adherence.";
  } else if (weightTrend === "good_gain" && (strengthTrend === "up" || strengthTrend === "flat" || strengthTrend === "unknown")) {
    status = "on_track";
    statusLabel = "On Track";
    calorieAction = "Maintain " + (avgCal ? "~" + Math.round(avgCal) + " cal/day" : "current intake");
    workoutAction = strengthTrend === "up" ? "Keep pushing" : "Try adding 1 rep per set";
    reason = "On track." + sleepNote;
  } else if (weightTrend === "flat" || weightTrend === "losing") {
    status = "off_track";
    statusLabel = weightTrend === "losing" ? "Losing Weight" : "Stalled";
    const bump = weightTrend === "losing" ? CALORIE_BUMP_LOSING : CALORIE_BUMP_STALLED;
    calorieAction = "Add " + bump + " cal/day" + (avgCal ? " (target: ~" + Math.round(avgCal + bump) + ")" : "");
    workoutAction = strengthTrend === "down" ? "Deload" : "Maintain program, food will fix this";
    reason = (weightTrend === "losing" ? "Losing." : "Stalled.") + sleepNote + stressNote + recoveryNote;
  } else if (weightTrend === "fast_gain") {
    status = "off_track";
    statusLabel = "Too Fast";
    calorieAction = "Cut " + CALORIE_CUT_FAST + " cal/day" + (avgCal ? " (target: ~" + Math.round(avgCal - CALORIE_CUT_FAST) + ")" : "");
    workoutAction = "Push harder";
    reason = "Too fast." + stressNote;
  } else {
    status = "on_track";
    statusLabel = "Steady";
    calorieAction = "Maintain " + (avgCal ? "~" + Math.round(avgCal) + " cal/day" : "current intake");
    workoutAction = strengthTrend === "flat" ? "Switch rep scheme or add variation" : "Continue";
    reason = "Steady." + sleepNote;
  }

  return {
    status,
    statusLabel,
    confidence,
    confidenceReason,
    calorieAction,
    workoutAction,
    reason,
    adherence: adh,
    frequency: freq,
    streak: streakDays,
    delta,
    strengthTrend,
    weightTrend,
    avgWeight: avgRW,
    avgCalories: avgCal,
    ts: now,
    week: wk,
    goal,
    tdee: calcTDEE(data.profile),
    isCalibrating: false,
    sleepAvg,
    stressAvg,
    lastRecovery,
  };
}
