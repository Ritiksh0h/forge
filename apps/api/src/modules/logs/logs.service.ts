import { eq, and, desc, lt } from "drizzle-orm";
import { db } from "../../db/index.js";
import { weightLogs, calorieLogs, workoutLogs, exercises } from "../../db/schema.js";

// ─── Weight ───
export async function logWeight(userId: string, value: number, loggedAt?: string) {
  const [entry] = await db
    .insert(weightLogs)
    .values({
      userId,
      value,
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    })
    .returning();
  return entry;
}

// ─── Calories ───
export async function logCalories(userId: string, value: number, loggedAt?: string) {
  const [entry] = await db
    .insert(calorieLogs)
    .values({
      userId,
      value,
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    })
    .returning();
  return entry;
}

// ─── Workout ───
export interface ExerciseInput {
  name: string;
  weight: number;
  reps: number;
  sets: number;
}

export async function logWorkout(userId: string, exerciseList: ExerciseInput[], loggedAt?: string) {
  const [workout] = await db
    .insert(workoutLogs)
    .values({
      userId,
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    })
    .returning();

  const exerciseRows = [];
  for (const ex of exerciseList) {
    const [row] = await db
      .insert(exercises)
      .values({
        workoutId: workout.id,
        name: ex.name,
        weight: ex.weight,
        reps: ex.reps,
        sets: ex.sets,
      })
      .returning();
    exerciseRows.push(row);
  }

  return { ...workout, exercises: exerciseRows };
}

// ─── Delete ───
export async function deleteWeightLog(userId: string, id: string) {
  const [deleted] = await db
    .delete(weightLogs)
    .where(and(eq(weightLogs.id, id), eq(weightLogs.userId, userId)))
    .returning();
  return deleted || null;
}

export async function deleteCalorieLog(userId: string, id: string) {
  const [deleted] = await db
    .delete(calorieLogs)
    .where(and(eq(calorieLogs.id, id), eq(calorieLogs.userId, userId)))
    .returning();
  return deleted || null;
}

export async function deleteWorkoutLog(userId: string, id: string) {
  // Exercises cascade-delete via FK
  const [deleted] = await db
    .delete(workoutLogs)
    .where(and(eq(workoutLogs.id, id), eq(workoutLogs.userId, userId)))
    .returning();
  return deleted || null;
}

// ─── History ───
export async function getHistory(
  userId: string,
  type: "all" | "weight" | "calories" | "workout",
  limit: number = 60,
  before?: string
) {
  const results: any[] = [];

  if (type === "all" || type === "weight") {
    const conditions = [eq(weightLogs.userId, userId)];
    if (before) conditions.push(lt(weightLogs.loggedAt, new Date(before)));

    const rows = await db
      .select()
      .from(weightLogs)
      .where(and(...conditions))
      .orderBy(desc(weightLogs.loggedAt))
      .limit(limit);

    rows.forEach(r => results.push({ type: "weight" as const, ...r }));
  }

  if (type === "all" || type === "calories") {
    const conditions = [eq(calorieLogs.userId, userId)];
    if (before) conditions.push(lt(calorieLogs.loggedAt, new Date(before)));

    const rows = await db
      .select()
      .from(calorieLogs)
      .where(and(...conditions))
      .orderBy(desc(calorieLogs.loggedAt))
      .limit(limit);

    rows.forEach(r => results.push({ type: "calories" as const, ...r }));
  }

  if (type === "all" || type === "workout") {
    const conditions = [eq(workoutLogs.userId, userId)];
    if (before) conditions.push(lt(workoutLogs.loggedAt, new Date(before)));

    const rows = await db
      .select()
      .from(workoutLogs)
      .where(and(...conditions))
      .orderBy(desc(workoutLogs.loggedAt))
      .limit(limit);

    for (const row of rows) {
      const exRows = await db
        .select()
        .from(exercises)
        .where(eq(exercises.workoutId, row.id));
      results.push({ type: "workout" as const, ...row, exercises: exRows });
    }
  }

  // Sort all by loggedAt desc, cap at limit
  results.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
  return results.slice(0, limit);
}
