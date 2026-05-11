import { eq, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { checkins } from "../../db/schema.js";

// ─── Check-in types (mirrors engine CI.types) ───
const CHECK_IN_TYPES: Record<string, { question: string; options: [string, string][] }> = {
  sleep: {
    question: "How did you sleep last night?",
    options: [["1", "Terrible"], ["2", "Poor"], ["3", "OK"], ["4", "Good"], ["5", "Great"]],
  },
  stress: {
    question: "Stress level today?",
    options: [["1", "Very high"], ["2", "High"], ["3", "Moderate"], ["4", "Low"], ["5", "Minimal"]],
  },
  adherence: {
    question: "Did you hit your calorie target yesterday?",
    options: [["yes", "Yes"], ["roughly", "Roughly"], ["no", "Not close"]],
  },
  recovery: {
    question: "How does your body feel?",
    options: [["beat", "Beat up"], ["sore", "Sore"], ["normal", "Normal"], ["fresh", "Fresh"]],
  },
};

const DAY_ROTATION = ["sleep", "adherence", "recovery", "stress", "sleep", "adherence", "recovery"];

export async function getNextCheckIn(userId: string) {
  // Check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recent = await db
    .select()
    .from(checkins)
    .where(eq(checkins.userId, userId))
    .orderBy(desc(checkins.loggedAt))
    .limit(1);

  if (recent.length && recent[0].loggedAt && new Date(recent[0].loggedAt) >= today) {
    return null; // Already checked in today
  }

  // Pick today's check-in type based on day of week
  const type = DAY_ROTATION[new Date().getDay()];
  const config = CHECK_IN_TYPES[type];

  return {
    type,
    question: config.question,
    options: config.options.map(([value, label]) => ({ value, label })),
  };
}

export async function addCheckIn(userId: string, type: string, value: string) {
  const [entry] = await db
    .insert(checkins)
    .values({
      userId,
      type,
      value,
      loggedAt: new Date(),
    })
    .returning();

  return entry;
}
