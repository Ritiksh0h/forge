// ─── FORGE ENGINE TYPES ───
// Zero infrastructure dependencies. Pure data shapes.

export interface Profile {
  goal: string;
  experience?: string;
  gender?: string;
  age?: number;
  height?: number;  // inches
  weight?: number;  // lbs
  activity?: string;
  name?: string;
}

export interface WeightLog {
  value: number;
  ts: number;
}

export interface CalorieLog {
  value: number;
  ts: number;
}

export interface Exercise {
  name: string;
  weight: number;
  reps: number;
  sets: number;
}

export interface WorkoutLog {
  ts: number;
  exercises: Exercise[];
}

export interface CheckIn {
  type: string;
  value: string;
  ts: number;
}

export interface LockedRecommendation {
  week: string;
  result: Recommendation;
  locked: boolean;
}

export interface EngineInput {
  profile: Profile | null;
  weightLogs: WeightLog[];
  calorieLogs: CalorieLog[];
  workoutLogs: WorkoutLog[];
  recommendations: LockedRecommendation[];
  checkIns: CheckIn[];
}

export interface Adherence {
  weight: number;
  calories: number;
  workouts: number;
  total: number;
  pct: number;
}

export interface Frequency {
  weight: number;
  calories: number;
  workouts: number;
}

export interface TDEEResult {
  bmr: number;
  maintenance: number;
  target: number;
  surplus: number;
}

export interface GainTarget {
  min: number;
  max: number;
}

export type WeightTrend = "unknown" | "fast_gain" | "good_gain" | "flat" | "losing";
export type StrengthTrend = "unknown" | "up" | "down" | "flat";
export type Status = "on_track" | "off_track" | "collecting";
export type Confidence = "low" | "medium" | "high";

export interface Recommendation {
  status: Status;
  statusLabel: string;
  confidence: Confidence;
  confidenceReason: string;
  calorieAction: string;
  workoutAction: string;
  reason: string;
  adherence: Adherence;
  frequency: Frequency;
  streak: number;
  delta: number | null;
  strengthTrend: StrengthTrend;
  weightTrend: WeightTrend;
  avgWeight: number | null;
  avgCalories: number | null;
  ts: number;
  week: string;
  goal: string;
  tdee: TDEEResult | null;
  isCalibrating: boolean;
  sleepAvg: number | null;
  stressAvg: number | null;
  lastRecovery: string | null;
}
