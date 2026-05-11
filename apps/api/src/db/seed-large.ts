import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

/**
 * FORGE — 1000 User Synthetic Data Seed
 * 
 * NOT for ML training. For: load testing, demos, engine stress testing.
 * 
 * Distribution:
 *   Goals:       40% Lean Bulk, 30% Aggressive Bulk, 30% Recomp
 *   Gender:      65% male, 35% female
 *   Experience:  20% <1yr, 35% 1-2yr, 30% 2-3yr, 15% 3yr+
 *   Activity:    15% 3x/wk, 35% 4x/wk, 35% 5x/wk, 15% 6x/wk
 *   Age:         18-45 (normal dist ~27)
 *   Adherence:   25% poor (<50%), 35% moderate (50-75%), 40% good (>75%)
 *   
 * Scenarios generated per user:
 *   - 4-8 weeks of history (28-56 days)
 *   - Weight trajectory matching their goal/adherence
 *   - Calorie logs with realistic variance
 *   - 2-5 workouts/week with progressive overload (or plateau/regression)
 *   - Check-ins scattered through the weeks
 *   - 1-4 locked weekly recommendations
 */

// ─── PRNG (seeded for reproducibility) ───
let _seed = 42;
function rand(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number): number {
  return min + rand() * (max - min);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function weighted<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [item, weight] of items) {
    r -= weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1][0];
}
function normalish(mean: number, std: number): number {
  // Box-Muller approximation
  const u1 = rand(), u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ─── Profile distributions ───
type Goal = "Lean Bulk" | "Aggressive Bulk" | "Recomp";
type Gender = "male" | "female";
type Experience = "6mo–1yr" | "1–2yr" | "2–3yr" | "3yr+";
type Activity = "3x/week" | "4x/week" | "5x/week" | "6x/week";
type AdherenceLevel = "poor" | "moderate" | "good";

interface UserProfile {
  gender: Gender;
  age: number;
  height: number; // inches
  weight: number; // lbs
  goal: Goal;
  experience: Experience;
  activity: Activity;
  adherenceLevel: AdherenceLevel;
  weeksOfData: number;
}

function generateProfile(i: number): UserProfile {
  const gender = weighted<Gender>([["male", 65], ["female", 35]]);
  const age = clamp(Math.round(normalish(27, 5)), 18, 45);
  const height = gender === "male"
    ? clamp(Math.round(normalish(70, 3)), 64, 78)
    : clamp(Math.round(normalish(65, 2.5)), 59, 72);
  const weight = gender === "male"
    ? clamp(Math.round(normalish(180, 25)), 140, 260)
    : clamp(Math.round(normalish(145, 20)), 105, 200);
  const goal = weighted<Goal>([["Lean Bulk", 40], ["Aggressive Bulk", 30], ["Recomp", 30]]);
  const experience = weighted<Experience>([["6mo–1yr", 20], ["1–2yr", 35], ["2–3yr", 30], ["3yr+", 15]]);
  const activity = weighted<Activity>([["3x/week", 15], ["4x/week", 35], ["5x/week", 35], ["6x/week", 15]]);
  const adherenceLevel = weighted<AdherenceLevel>([["poor", 25], ["moderate", 35], ["good", 40]]);
  const weeksOfData = randInt(4, 8);

  return { gender, age, height, weight, goal, experience, activity, adherenceLevel, weeksOfData };
}

// ─── Weight trajectory generators ───
function generateWeightSeries(profile: UserProfile): number[] {
  const days = profile.weeksOfData * 7;
  const weights: number[] = [];
  let w = profile.weight;

  // Weekly rate depends on goal and adherence
  const goalRates: Record<Goal, [number, number]> = {
    "Lean Bulk": [0.1, 0.5],
    "Aggressive Bulk": [0.3, 0.8],
    "Recomp": [-0.1, 0.15],
  };
  const [minRate, maxRate] = goalRates[profile.goal];

  // Adherence affects whether they hit the target
  const adherenceMultiplier = profile.adherenceLevel === "good" ? 1.0
    : profile.adherenceLevel === "moderate" ? 0.6 : 0.2;

  const weeklyRate = (minRate + (maxRate - minRate) * adherenceMultiplier) * (profile.weight / 100);
  const dailyRate = weeklyRate / 7;

  // Add some randomness patterns
  const hasPlateau = rand() < 0.3; // 30% chance of a plateau week
  const plateauWeek = hasPlateau ? randInt(2, profile.weeksOfData - 1) : -1;

  for (let d = 0; d < days; d++) {
    const currentWeek = Math.floor(d / 7);
    const isPlateau = currentWeek === plateauWeek;

    // Daily noise: ±0.5 lbs (water, food timing, etc.)
    const noise = normalish(0, 0.4);

    if (isPlateau) {
      w += normalish(0, 0.15); // flat during plateau
    } else {
      w += dailyRate + noise * 0.1;
    }

    // Weekend binge pattern for some poor-adherence users
    const dayOfWeek = d % 7;
    if (profile.adherenceLevel === "poor" && (dayOfWeek === 5 || dayOfWeek === 6)) {
      w += randFloat(0.2, 0.6); // weekend overshoot
    }

    weights.push(Math.round((w + noise) * 10) / 10);
  }

  return weights;
}

// ─── Calorie trajectory ───
function generateCalorieSeries(profile: UserProfile, days: number): (number | null)[] {
  // TDEE estimate
  const kg = profile.weight * 0.453592;
  const cm = profile.height * 2.54;
  const bmr = 10 * kg + 6.25 * cm - 5 * profile.age + (profile.gender === "male" ? 5 : -161);
  const multipliers: Record<Activity, number> = { "3x/week": 1.375, "4x/week": 1.465, "5x/week": 1.55, "6x/week": 1.635 };
  const maintenance = bmr * multipliers[profile.activity];
  const surpluses: Record<Goal, number> = { "Lean Bulk": 250, "Aggressive Bulk": 450, "Recomp": 0 };
  const target = Math.round(maintenance + surpluses[profile.goal]);

  const cals: (number | null)[] = [];

  // Logging frequency based on adherence
  const logChance = profile.adherenceLevel === "good" ? 0.9
    : profile.adherenceLevel === "moderate" ? 0.65 : 0.35;

  for (let d = 0; d < days; d++) {
    if (rand() > logChance) {
      cals.push(null); // missed day
      continue;
    }

    // Variance: ±300 cal for poor adherence, ±150 for good
    const variance = profile.adherenceLevel === "good" ? 100
      : profile.adherenceLevel === "moderate" ? 200 : 350;

    let cal = target + Math.round(normalish(0, variance));

    // Weekend overeating pattern
    const dayOfWeek = d % 7;
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      cal += randInt(100, 400);
    }

    // Round to nearest 50
    cal = Math.round(cal / 50) * 50;
    cal = clamp(cal, 1200, 5000);

    cals.push(cal);
  }

  return cals;
}

// ─── Workout generators ───
const LIFT_TEMPLATES = {
  push: [
    { name: "Bench Press", baseMultiplier: 1.0 },
    { name: "OHP", baseMultiplier: 0.6 },
    { name: "Incline DB Press", baseMultiplier: 0.75 },
  ],
  pull: [
    { name: "Row", baseMultiplier: 0.85 },
    { name: "Pull-up", baseMultiplier: 0.5 },
    { name: "Deadlift", baseMultiplier: 1.4 },
  ],
  legs: [
    { name: "Squat", baseMultiplier: 1.2 },
    { name: "Leg Press", baseMultiplier: 2.0 },
    { name: "Romanian Deadlift", baseMultiplier: 0.9 },
  ],
};

interface WorkoutDay {
  dayOffset: number;
  exercises: { name: string; weight: number; reps: number; sets: number }[];
}

function generateWorkouts(profile: UserProfile): WorkoutDay[] {
  const days = profile.weeksOfData * 7;
  const workouts: WorkoutDay[] = [];

  // Base strength level
  const strengthBase = profile.gender === "male"
    ? profile.weight * (profile.experience === "3yr+" ? 0.7 : profile.experience === "2–3yr" ? 0.6 : profile.experience === "1–2yr" ? 0.5 : 0.4)
    : profile.weight * (profile.experience === "3yr+" ? 0.45 : profile.experience === "2–3yr" ? 0.38 : profile.experience === "1–2yr" ? 0.3 : 0.25);

  // Sessions per week
  const sessionsPerWeek = parseInt(profile.activity.charAt(0));

  // Progression rate (lbs/week per lift)
  const progressionRate = profile.adherenceLevel === "good" ? 2.5
    : profile.adherenceLevel === "moderate" ? 1.0 : 0;

  // Some users regress
  const isRegressing = profile.adherenceLevel === "poor" && rand() < 0.3;

  const splits = [Object.values(LIFT_TEMPLATES.push), Object.values(LIFT_TEMPLATES.pull), Object.values(LIFT_TEMPLATES.legs)];

  for (let d = 0; d < days; d++) {
    const dayOfWeek = d % 7;

    // Skip rest days (distribute sessions across the week)
    const trainingDays = sessionsPerWeek <= 3 ? [1, 3, 5]
      : sessionsPerWeek <= 4 ? [1, 2, 4, 5]
      : sessionsPerWeek <= 5 ? [1, 2, 3, 5, 6]
      : [1, 2, 3, 4, 5, 6];

    if (!trainingDays.includes(dayOfWeek)) continue;

    // Skip some sessions for poor adherence
    if (profile.adherenceLevel === "poor" && rand() < 0.3) continue;
    if (profile.adherenceLevel === "moderate" && rand() < 0.1) continue;

    const weekNum = Math.floor(d / 7);
    const splitIdx = d % 3;
    const template = splits[splitIdx];

    // Pick 2-3 exercises from the template
    const numExercises = randInt(2, 3);
    const selectedLifts = template.slice(0, numExercises);

    const exercises = selectedLifts.map(lift => {
      const weekProgression = isRegressing
        ? -progressionRate * weekNum * 0.5
        : progressionRate * weekNum;

      const baseWeight = Math.round(strengthBase * lift.baseMultiplier + weekProgression);
      const weight = clamp(Math.round(baseWeight / 5) * 5, 20, 600); // round to 5s
      const reps = pick([5, 6, 8, 8, 10]);
      const sets = pick([3, 3, 3, 4]);

      return { name: lift.name, weight, reps, sets };
    });

    workouts.push({ dayOffset: d, exercises });
  }

  return workouts;
}

// ─── Check-in generators ───
const CHECKIN_TYPES = ["sleep", "stress", "adherence", "recovery"];

function generateCheckIns(profile: UserProfile, days: number): { dayOffset: number; type: string; value: string }[] {
  const checkIns: { dayOffset: number; type: string; value: string }[] = [];

  // ~3-5 check-ins per week for good adherence, fewer for poor
  const checkInChance = profile.adherenceLevel === "good" ? 0.6
    : profile.adherenceLevel === "moderate" ? 0.4 : 0.15;

  for (let d = 0; d < days; d++) {
    if (rand() > checkInChance) continue;

    const type = pick(CHECKIN_TYPES);
    let value: string;

    switch (type) {
      case "sleep":
        value = String(profile.adherenceLevel === "good" ? pick(["3", "4", "4", "5"])
          : profile.adherenceLevel === "moderate" ? pick(["2", "3", "3", "4"])
          : pick(["1", "2", "2", "3"]));
        break;
      case "stress":
        value = String(profile.adherenceLevel === "good" ? pick(["3", "4", "4", "5"])
          : profile.adherenceLevel === "moderate" ? pick(["2", "3", "3", "4"])
          : pick(["1", "2", "2", "3"]));
        break;
      case "adherence":
        value = profile.adherenceLevel === "good" ? pick(["yes", "yes", "roughly"])
          : profile.adherenceLevel === "moderate" ? pick(["yes", "roughly", "roughly", "no"])
          : pick(["roughly", "no", "no"]);
        break;
      case "recovery":
        value = profile.adherenceLevel === "good" ? pick(["normal", "fresh", "normal", "sore"])
          : profile.adherenceLevel === "moderate" ? pick(["sore", "normal", "normal"])
          : pick(["beat", "sore", "sore", "normal"]);
        break;
      default:
        value = "3";
    }

    checkIns.push({ dayOffset: d, type, value });
  }

  return checkIns;
}

// ─── Name generator ───
const FIRST_NAMES = [
  "Alex", "Jordan", "Sam", "Riley", "Casey", "Morgan", "Quinn", "Avery", "Drew", "Kai",
  "Marcus", "Elena", "Dante", "Priya", "Noah", "Zara", "Liam", "Maya", "Owen", "Tara",
  "Ethan", "Nora", "Leo", "Ivy", "Caleb", "Ruby", "Felix", "Luna", "Max", "Aria",
  "Jake", "Mia", "Ryan", "Ava", "Ben", "Lily", "Cole", "Ella", "Dean", "Zoe",
  "Grant", "Jade", "Hank", "Sage", "Ivan", "Vera", "Kurt", "Dana", "Troy", "Faye",
  "Amir", "Suki", "Omar", "Nia", "Ravi", "Dina", "Yuki", "Rosa", "Bo", "Wren",
  "Ash", "Sky", "Jax", "Kit", "Ty", "Vi", "Gage", "Rue", "Kade", "Bree",
  "Raj", "Uma", "Soren", "Luz", "Theo", "Ada", "Finn", "Eve", "Milo", "Iris",
  "Hugo", "Lena", "Ezra", "Nina", "Cyrus", "Alma", "Reed", "Thea", "Kane", "Gwen",
  "Blake", "Harper", "Chase", "Piper", "Bryce", "Sloane", "Trent", "Blair", "Vince", "Reese",
];

// ─── Main seed ───
async function seedLarge() {
  const client = postgres(env.DATABASE_URL, { max: 5 });
  const db = drizzle(client, { schema });

  const USER_COUNT = 1000;
  const BATCH_SIZE = 50;
  const PASSWORD_HASH = await bcrypt.hash("forge2024", 12);
  const now = Date.now();
  const day = 864e5;

  console.log(`\nFORGE — Seeding ${USER_COUNT} users...`);
  console.log("This takes 2-5 minutes.\n");

  let totalWeightLogs = 0;
  let totalCalorieLogs = 0;
  let totalWorkouts = 0;
  let totalExercises = 0;
  let totalCheckIns = 0;

  for (let batch = 0; batch < USER_COUNT; batch += BATCH_SIZE) {
    const batchEnd = Math.min(batch + BATCH_SIZE, USER_COUNT);
    const batchNum = Math.floor(batch / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(USER_COUNT / BATCH_SIZE);

    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (users ${batch + 1}-${batchEnd})...`);

    for (let i = batch; i < batchEnd; i++) {
      const profile = generateProfile(i);
      const email = `user${String(i + 1).padStart(4, "0")}@forge.dev`;
      const name = FIRST_NAMES[i % FIRST_NAMES.length];

      // Create user
      const [user] = await db
        .insert(schema.users)
        .values({ email, passwordHash: PASSWORD_HASH })
        .onConflictDoNothing()
        .returning();

      if (!user) continue;

      // Create profile
      await db.insert(schema.profiles).values({
        userId: user.id,
        name,
        goal: profile.goal,
        experience: profile.experience,
        gender: profile.gender,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        activity: profile.activity,
      });

      const totalDays = profile.weeksOfData * 7;
      const startOffset = totalDays; // days ago the user started

      // Weight logs (skip some days for realism)
      const weights = generateWeightSeries(profile);
      const weightLogChance = profile.adherenceLevel === "good" ? 0.85
        : profile.adherenceLevel === "moderate" ? 0.6 : 0.3;

      for (let d = 0; d < weights.length; d++) {
        if (rand() > weightLogChance) continue;
        await db.insert(schema.weightLogs).values({
          userId: user.id,
          value: weights[d],
          loggedAt: new Date(now - (startOffset - d) * day + randInt(6, 9) * 36e5), // 6-9am
        });
        totalWeightLogs++;
      }

      // Calorie logs
      const calories = generateCalorieSeries(profile, totalDays);
      for (let d = 0; d < calories.length; d++) {
        if (calories[d] === null) continue;
        await db.insert(schema.calorieLogs).values({
          userId: user.id,
          value: calories[d]!,
          loggedAt: new Date(now - (startOffset - d) * day + randInt(19, 22) * 36e5), // 7-10pm
        });
        totalCalorieLogs++;
      }

      // Workouts
      const workouts = generateWorkouts(profile);
      for (const wo of workouts) {
        const [workout] = await db
          .insert(schema.workoutLogs)
          .values({
            userId: user.id,
            loggedAt: new Date(now - (startOffset - wo.dayOffset) * day + randInt(15, 19) * 36e5), // 3-7pm
          })
          .returning();

        for (const ex of wo.exercises) {
          await db.insert(schema.exercises).values({
            workoutId: workout.id,
            name: ex.name,
            weight: ex.weight,
            reps: ex.reps,
            sets: ex.sets,
          });
          totalExercises++;
        }
        totalWorkouts++;
      }

      // Check-ins
      const checkIns = generateCheckIns(profile, totalDays);
      for (const ci of checkIns) {
        await db.insert(schema.checkins).values({
          userId: user.id,
          type: ci.type,
          value: ci.value,
          loggedAt: new Date(now - (startOffset - ci.dayOffset) * day + randInt(8, 12) * 36e5),
        });
        totalCheckIns++;
      }
    }

    console.log(" done");
  }

  console.log(`\n  ✓ ${USER_COUNT} users`);
  console.log(`  ✓ ${totalWeightLogs.toLocaleString()} weight logs`);
  console.log(`  ✓ ${totalCalorieLogs.toLocaleString()} calorie logs`);
  console.log(`  ✓ ${totalWorkouts.toLocaleString()} workouts (${totalExercises.toLocaleString()} exercises)`);
  console.log(`  ✓ ${totalCheckIns.toLocaleString()} check-ins`);
  console.log(`\n  Login: user0001@forge.dev through user1000@forge.dev / forge2024`);
  console.log(`  Original test user preserved: test@forge.dev / testpass123\n`);

  await client.end();
  process.exit(0);
}

seedLarge().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
