import {
  pgTable,
  uuid,
  text,
  real,
  integer,
  boolean,
  timestamp,
  index,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── users ───
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  resetToken: text("reset_token"),
  resetTokenExpiresAt: timestamp("reset_token_expires_at", { withTimezone: true }),
  role: text("role").notNull().default("athlete"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── profiles ───
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name"),
  goal: text("goal").notNull(),
  experience: text("experience"),
  gender: text("gender"),
  age: integer("age"),
  height: real("height"),       // inches
  weight: real("weight"),       // lbs (onboarding starting weight only)
  activity: text("activity"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── weight_logs ───
export const weightLogs = pgTable("weight_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  value: real("value").notNull(),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("idx_weight_logs_user_time").on(t.userId, t.loggedAt),
]);

// ─── calorie_logs ───
export const calorieLogs = pgTable("calorie_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  value: integer("value").notNull(),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("idx_calorie_logs_user_time").on(t.userId, t.loggedAt),
]);

// ─── workout_logs ───
export const workoutLogs = pgTable("workout_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("idx_workout_logs_user_time").on(t.userId, t.loggedAt),
]);

// ─── exercises ───
export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutId: uuid("workout_id").notNull().references(() => workoutLogs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  weight: real("weight").notNull(),
  reps: integer("reps").notNull(),
  sets: integer("sets").notNull().default(1),
});

// ─── checkins ───
export const checkins = pgTable("checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  value: text("value").notNull(),
  loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  index("idx_checkins_user_time").on(t.userId, t.loggedAt),
]);

// ─── recommendations ───
export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekKey: text("week_key").notNull(),
  status: text("status").notNull(),
  statusLabel: text("status_label"),
  confidence: text("confidence"),
  calorieAction: text("calorie_action").notNull(),
  workoutAction: text("workout_action").notNull(),
  reason: text("reason"),
  weightTrend: text("weight_trend"),
  strengthTrend: text("strength_trend"),
  delta: real("delta"),
  avgWeight: real("avg_weight"),
  avgCalories: real("avg_calories"),
  resultJson: jsonb("result_json"),
  locked: boolean("locked").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  unique("recommendations_user_week_unique").on(t.userId, t.weekKey),
]);
