import { eq, and, gte, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  profiles,
  weightLogs,
  calorieLogs,
  workoutLogs,
  exercises,
  checkins,
  recommendations,
} from "../../db/schema.js";
import { recommend, weekKey } from "@forge/engine";
import type { EngineInput, Recommendation } from "@forge/engine";

const DAY_MS = 864e5;
const TWENTY_ONE_DAYS = 21 * DAY_MS;
const SEVEN_DAYS = 7 * DAY_MS;

// ─── Data Assembly: DB → EngineInput ───
export async function assembleEngineInput(userId: string): Promise<EngineInput> {
  const now = Date.now();
  const cutoff21d = new Date(now - TWENTY_ONE_DAYS);
  const cutoff7d = new Date(now - SEVEN_DAYS);

  // Profile
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
  });

  // Weight logs (21 days)
  const wLogs = await db
    .select()
    .from(weightLogs)
    .where(and(eq(weightLogs.userId, userId), gte(weightLogs.loggedAt, cutoff21d)))
    .orderBy(desc(weightLogs.loggedAt));

  // Calorie logs (21 days)
  const cLogs = await db
    .select()
    .from(calorieLogs)
    .where(and(eq(calorieLogs.userId, userId), gte(calorieLogs.loggedAt, cutoff21d)))
    .orderBy(desc(calorieLogs.loggedAt));

  // Workout logs (21 days) with exercises
  const wkLogs = await db
    .select()
    .from(workoutLogs)
    .where(and(eq(workoutLogs.userId, userId), gte(workoutLogs.loggedAt, cutoff21d)))
    .orderBy(desc(workoutLogs.loggedAt));

  const workoutData = [];
  for (const wk of wkLogs) {
    const exRows = await db
      .select()
      .from(exercises)
      .where(eq(exercises.workoutId, wk.id));
    workoutData.push({
      ts: new Date(wk.loggedAt).getTime(),
      exercises: exRows.map((e) => ({
        name: e.name,
        weight: e.weight,
        reps: e.reps,
        sets: e.sets,
      })),
    });
  }

  // Check-ins (7 days)
  const ciLogs = await db
    .select()
    .from(checkins)
    .where(and(eq(checkins.userId, userId), gte(checkins.loggedAt, cutoff7d)))
    .orderBy(desc(checkins.loggedAt));

  // Locked recommendations
  const lockedRecs = await db
    .select()
    .from(recommendations)
    .where(and(eq(recommendations.userId, userId), eq(recommendations.locked, true)))
    .orderBy(desc(recommendations.createdAt))
    .limit(4);

  // Transform to EngineInput
  return {
    profile: profile
      ? {
          goal: profile.goal,
          experience: profile.experience ?? undefined,
          gender: profile.gender ?? undefined,
          age: profile.age ?? undefined,
          height: profile.height ?? undefined,
          weight: profile.weight ?? undefined,
          activity: profile.activity ?? undefined,
          name: profile.name ?? undefined,
        }
      : null,
    weightLogs: wLogs.map((w) => ({ value: w.value, ts: new Date(w.loggedAt).getTime() })),
    calorieLogs: cLogs.map((c) => ({ value: c.value, ts: new Date(c.loggedAt).getTime() })),
    workoutLogs: workoutData,
    checkIns: ciLogs.map((c) => ({
      type: c.type,
      value: c.value,
      ts: new Date(c.loggedAt!).getTime(),
    })),
    recommendations: lockedRecs.map((r) => ({
      week: r.weekKey,
      result: (r.resultJson as Recommendation) || ({
        status: r.status,
        calorieAction: r.calorieAction,
        workoutAction: r.workoutAction,
      } as any),
      locked: r.locked ?? true,
    })),
  };
}

// ─── Dashboard ───
export async function getDashboard(userId: string) {
  const input = await assembleEngineInput(userId);
  const rec = recommend(input);

  // Include raw chart data (last 14 entries) for frontend sparklines
  const weightChart = input.weightLogs
    .slice(0, 14)
    .reverse()
    .map((w) => ({ value: w.value, ts: w.ts }));
  const calorieChart = input.calorieLogs
    .slice(0, 14)
    .reverse()
    .map((c) => ({ value: c.value, ts: c.ts }));

  // Past locked recommendations
  const pastRecs = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.userId, userId))
    .orderBy(desc(recommendations.createdAt))
    .limit(3);

  return {
    recommendation: rec,
    weightChart,
    calorieChart,
    pastRecommendations: pastRecs.map((r) => ({
      week: r.weekKey,
      status: r.status,
      calorieAction: r.calorieAction,
    })),
  };
}

// ─── Lock current week ───
export async function lockRecommendation(userId: string) {
  const input = await assembleEngineInput(userId);
  const rec = recommend(input);
  const wk = weekKey();

  // Check if already locked this week
  const existing = await db.query.recommendations.findFirst({
    where: and(eq(recommendations.userId, userId), eq(recommendations.weekKey, wk)),
  });

  if (existing) {
    return { locked: true, week: wk, recommendation: (existing.resultJson as Recommendation) || existing };
  }

  // Store the recommendation
  const [stored] = await db
    .insert(recommendations)
    .values({
      userId,
      weekKey: wk,
      status: rec.status,
      statusLabel: rec.statusLabel,
      confidence: rec.confidence,
      calorieAction: rec.calorieAction,
      workoutAction: rec.workoutAction,
      reason: rec.reason,
      weightTrend: rec.weightTrend,
      strengthTrend: rec.strengthTrend,
      delta: rec.delta,
      avgWeight: rec.avgWeight,
      avgCalories: rec.avgCalories,
      resultJson: rec as any,
      locked: true,
    })
    .returning();

  return { locked: true, week: wk, recommendation: rec, id: stored.id };
}

// ─── Recommendation history ───
export async function getRecommendationHistory(userId: string) {
  const recs = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.userId, userId))
    .orderBy(desc(recommendations.createdAt))
    .limit(4);

  return recs.map((r) => ({
    id: r.id,
    week: r.weekKey,
    status: r.status,
    statusLabel: r.statusLabel,
    confidence: r.confidence,
    calorieAction: r.calorieAction,
    workoutAction: r.workoutAction,
    reason: r.reason,
    weightTrend: r.weightTrend,
    strengthTrend: r.strengthTrend,
    locked: r.locked,
    createdAt: r.createdAt,
  }));
}
