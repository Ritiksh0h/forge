export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string | null;
  goal: string;
  experience: string | null;
  gender: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  activity: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeightEntry {
  id: string;
  userId: string;
  value: number;
  loggedAt: string;
  createdAt: string;
}

export interface CalorieEntry {
  id: string;
  userId: string;
  value: number;
  loggedAt: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  workoutId: string;
  name: string;
  weight: number;
  reps: number;
  sets: number;
}

export interface WorkoutEntry {
  id: string;
  userId: string;
  loggedAt: string;
  createdAt: string;
  exercises: Exercise[];
}

export interface HistoryEntry {
  type: "weight" | "calories" | "workout";
  id: string;
  value?: number;
  loggedAt: string;
  exercises?: Exercise[];
}

export interface CheckIn {
  type: string;
  question: string;
  options: { value: string; label: string }[];
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

export interface Recommendation {
  status: "on_track" | "off_track" | "collecting";
  statusLabel: string;
  confidence: "high" | "medium" | "low";
  confidenceReason: string;
  calorieAction: string;
  workoutAction: string;
  reason: string;
  adherence: Adherence;
  frequency: Frequency;
  streak: number;
  delta: number | null;
  strengthTrend: string;
  weightTrend: string;
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

export interface RecHistory {
  id: string;
  week: string;
  status: string;
  statusLabel: string;
  confidence: string;
  calorieAction: string;
  workoutAction: string;
  reason: string;
  weightTrend: string;
  strengthTrend: string;
  locked: boolean;
  createdAt: string;
}
