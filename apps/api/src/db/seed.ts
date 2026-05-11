import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

const SALT_ROUNDS = 12;

async function seed() {
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Seeding database...");

  // ─── Seed user ───
  const passwordHash = await bcrypt.hash("testpass123", SALT_ROUNDS);

  const [user] = await db
    .insert(schema.users)
    .values({ email: "test@forge.dev", passwordHash })
    .onConflictDoNothing()
    .returning();

  if (!user) {
    console.log("User already exists, skipping seed.");
    await client.end();
    process.exit(0);
  }

  console.log("Created user:", user.id);

  // ─── Seed profile ───
  const [profile] = await db
    .insert(schema.profiles)
    .values({
      userId: user.id,
      name: "Test User",
      goal: "Lean Bulk",
      experience: "1–2yr",
      gender: "male",
      age: 25,
      height: 70,
      weight: 175,
      activity: "4x/week",
    })
    .returning();

  console.log("Created profile:", profile.id);

  // ─── Seed 14 days of weight logs ───
  const now = Date.now();
  const day = 864e5;
  const weightVals = [174, 174.2, 174.1, 174.3, 174.5, 174.3, 174.4, 174.8, 175, 175.2, 175, 175.1, 175.3, 175.2];

  for (let i = 0; i < weightVals.length; i++) {
    await db.insert(schema.weightLogs).values({
      userId: user.id,
      value: weightVals[i],
      loggedAt: new Date(now - (weightVals.length - i) * day),
    });
  }
  console.log(`Seeded ${weightVals.length} weight logs`);

  // ─── Seed 14 days of calorie logs ───
  const calVals = [2500, 2500, 2600, 2500, 2500, 2400, 2500, 2500, 2600, 2500, 2500, 2500, 2500, 2600];

  for (let i = 0; i < calVals.length; i++) {
    await db.insert(schema.calorieLogs).values({
      userId: user.id,
      value: calVals[i],
      loggedAt: new Date(now - (calVals.length - i) * day),
    });
  }
  console.log(`Seeded ${calVals.length} calorie logs`);

  // ─── Seed workout logs with exercises ───
  const workoutDays = [12, 10, 5, 3, 1];
  const workoutExercises: [string, number, number, number][][] = [
    [["Bench Press", 185, 6, 3], ["Squat", 225, 6, 3]],
    [["Bench Press", 185, 6, 3], ["Deadlift", 275, 5, 3]],
    [["Bench Press", 195, 6, 3], ["Squat", 230, 6, 3]],
    [["Bench Press", 195, 6, 3], ["Deadlift", 280, 5, 3]],
    [["Bench Press", 200, 6, 3], ["Squat", 235, 6, 3]],
  ];

  for (let i = 0; i < workoutDays.length; i++) {
    const [workout] = await db
      .insert(schema.workoutLogs)
      .values({
        userId: user.id,
        loggedAt: new Date(now - workoutDays[i] * day),
      })
      .returning();

    for (const [name, weight, reps, sets] of workoutExercises[i]) {
      await db.insert(schema.exercises).values({
        workoutId: workout.id,
        name,
        weight,
        reps,
        sets,
      });
    }
  }
  console.log(`Seeded ${workoutDays.length} workouts`);

  console.log("\nSeed complete!");
  console.log("Login: test@forge.dev / testpass123");

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
