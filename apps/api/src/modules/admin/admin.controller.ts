import type { Request, Response } from "express";
import { db } from "../../db/index.js";
import { users, profiles, weightLogs, calorieLogs, workoutLogs, checkins, recommendations, exercises } from "../../db/schema.js";
import { eq, sql, desc, gte, count, and, inArray } from "drizzle-orm";
import { recommend, type EngineInput } from "@forge/engine";

const day = 86400000;

// ─── GET /api/admin/stats — Overview metrics ───
export async function statsHandler(_req: Request, res: Response): Promise<void> {
  const now = new Date();
  const d7iso = new Date(now.getTime() - 7 * day).toISOString();
  const d30iso = new Date(now.getTime() - 30 * day).toISOString();

  const [{ total: totalUsers }] = await db.select({ total: count() }).from(users);
  const [{ total: signups7d }] = await db.select({ total: count() }).from(users).where(gte(users.createdAt, new Date(d7iso)));
  const [{ total: signups30d }] = await db.select({ total: count() }).from(users).where(gte(users.createdAt, new Date(d30iso)));
  const [{ total: withProfiles }] = await db.select({ total: count() }).from(profiles);

  // Active users (logged something in last 7 days)
  const activeResult = await db.execute(sql`
    SELECT COUNT(DISTINCT user_id)::int as active FROM (
      SELECT user_id FROM weight_logs WHERE logged_at >= ${d7iso}::timestamptz
      UNION
      SELECT user_id FROM calorie_logs WHERE logged_at >= ${d7iso}::timestamptz
      UNION
      SELECT user_id FROM workout_logs WHERE logged_at >= ${d7iso}::timestamptz
    ) AS active_users
  `);
  const activeUsers = Number(activeResult[0]?.active || 0);

  const [{ total: totalWeightLogs }] = await db.select({ total: count() }).from(weightLogs);
  const [{ total: totalCalorieLogs }] = await db.select({ total: count() }).from(calorieLogs);
  const [{ total: totalWorkoutLogs }] = await db.select({ total: count() }).from(workoutLogs);
  const [{ total: totalCheckins }] = await db.select({ total: count() }).from(checkins);
  const [{ total: totalRecs }] = await db.select({ total: count() }).from(recommendations);

  const goalDist = await db
    .select({ goal: profiles.goal, count: count() })
    .from(profiles)
    .groupBy(profiles.goal);

  const recDist = await db.execute(sql`
    SELECT status, COUNT(*)::int as count FROM recommendations
    WHERE created_at >= ${d7iso}::timestamptz
    GROUP BY status
  `);

  const signupsByDay = await db.execute(sql`
    SELECT DATE(created_at)::text as date, COUNT(*)::int as count
    FROM users
    WHERE created_at >= ${d30iso}::timestamptz
    GROUP BY DATE(created_at)
    ORDER BY date
  `);

  res.json({
    users: { total: totalUsers, withProfiles, active7d: activeUsers, signups7d, signups30d },
    logs: {
      weight: totalWeightLogs, calories: totalCalorieLogs,
      workouts: totalWorkoutLogs, checkins: totalCheckins,
      total: totalWeightLogs + totalCalorieLogs + totalWorkoutLogs,
    },
    recommendations: { total: totalRecs },
    goalDistribution: goalDist,
    recStatusDistribution: recDist,
    signupsByDay,
  });
}

// ─── GET /api/admin/users — Paginated user list ───
export async function userListHandler(req: Request, res: Response): Promise<void> {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const search = (req.query.search as string) || "";

  const searchClause = search
    ? sql`WHERE u.email ILIKE ${"%" + search + "%"} OR p.name ILIKE ${"%" + search + "%"}`
    : sql``;

  const userList = await db.execute(sql`
    SELECT
      u.id, u.email, u.role, u.created_at,
      p.name, p.goal, p.activity,
      COALESCE((SELECT COUNT(*) FROM weight_logs WHERE user_id = u.id), 0)::int as weight_count,
      COALESCE((SELECT COUNT(*) FROM calorie_logs WHERE user_id = u.id), 0)::int as calorie_count,
      COALESCE((SELECT COUNT(*) FROM workout_logs WHERE user_id = u.id), 0)::int as workout_count,
      GREATEST(
        (SELECT MAX(logged_at) FROM weight_logs WHERE user_id = u.id),
        (SELECT MAX(logged_at) FROM calorie_logs WHERE user_id = u.id),
        (SELECT MAX(logged_at) FROM workout_logs WHERE user_id = u.id)
      ) as last_active
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    ${searchClause}
    ORDER BY u.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const [{ total }] = await db.select({ total: count() }).from(users);

  res.json({ users: userList, total, limit, offset });
}

// ─── GET /api/admin/users/:id — Full user detail + engine state ───
export async function userDetailHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { id: true, email: true, role: true, googleId: true, createdAt: true },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const userProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, id),
  });

  const now = Date.now();
  const d21 = new Date(now - 21 * day);
  const d7 = new Date(now - 7 * day);

  const wLogs = await db.select().from(weightLogs)
    .where(and(eq(weightLogs.userId, id), gte(weightLogs.loggedAt, d21)))
    .orderBy(desc(weightLogs.loggedAt));

  const cLogs = await db.select().from(calorieLogs)
    .where(and(eq(calorieLogs.userId, id), gte(calorieLogs.loggedAt, d21)))
    .orderBy(desc(calorieLogs.loggedAt));

  const woLogs = await db.select().from(workoutLogs)
    .where(and(eq(workoutLogs.userId, id), gte(workoutLogs.loggedAt, d21)))
    .orderBy(desc(workoutLogs.loggedAt));

  const woIds = woLogs.map(w => w.id);
  let exList: any[] = [];
  if (woIds.length > 0) {
    exList = await db.select().from(exercises)
      .where(inArray(exercises.workoutId, woIds));
  }

  const recentCheckins = await db.select().from(checkins)
    .where(and(eq(checkins.userId, id), gte(checkins.loggedAt, d7)))
    .orderBy(desc(checkins.loggedAt));

  const recentRecs = await db.select().from(recommendations)
    .where(eq(recommendations.userId, id))
    .orderBy(desc(recommendations.createdAt))
    .limit(8);

  // Run engine
  let engineResult = null;
  if (userProfile) {
    const engineInput: EngineInput = {
      profile: {
        goal: userProfile.goal as any,
        experience: userProfile.experience || undefined,
        gender: userProfile.gender as any,
        age: userProfile.age || undefined,
        height: userProfile.height || undefined,
        weight: userProfile.weight || undefined,
        activity: userProfile.activity as any,
      },
      weightLogs: wLogs.map(w => ({ value: w.value, ts: new Date(w.loggedAt).getTime() })),
      calorieLogs: cLogs.map(c => ({ value: c.value, ts: new Date(c.loggedAt).getTime() })),
      workoutLogs: woLogs.map(w => {
        const wExs = exList.filter((e: any) => e.workoutId === w.id);
        return {
          ts: new Date(w.loggedAt).getTime(),
          exercises: wExs.map((e: any) => ({ name: e.name, weight: e.weight, reps: e.reps, sets: e.sets })),
        };
      }),
      recommendations: recentRecs.filter(r => r.locked).map(r => ({
        week: r.weekKey,
        result: r.resultJson as any || { status: r.status, calorieAction: r.calorieAction },
        locked: true,
      })),
      checkIns: recentCheckins.map(c => ({ type: c.type, value: c.value, ts: new Date(c.loggedAt!).getTime() })),
    };

    try {
      engineResult = recommend(engineInput);
    } catch (err) {
      engineResult = { error: String(err) };
    }
  }

  const [{ total: totalWeight }] = await db.select({ total: count() }).from(weightLogs).where(eq(weightLogs.userId, id));
  const [{ total: totalCalories }] = await db.select({ total: count() }).from(calorieLogs).where(eq(calorieLogs.userId, id));
  const [{ total: totalWorkouts }] = await db.select({ total: count() }).from(workoutLogs).where(eq(workoutLogs.userId, id));

  res.json({
    user,
    profile: userProfile,
    totals: { weight: totalWeight, calories: totalCalories, workouts: totalWorkouts },
    recentLogs: {
      weight: wLogs.slice(0, 14),
      calories: cLogs.slice(0, 14),
      workouts: woLogs.slice(0, 10).map(w => ({
        ...w,
        exercises: exList.filter((e: any) => e.workoutId === w.id),
      })),
    },
    recentCheckins,
    recommendations: recentRecs,
    engineResult,
  });
}
