export { recommend, weekKey } from "./recommend";
export { calcTDEE } from "./tdee";
export { calcAdherence, calcStreak, calcFrequency } from "./adherence";
export { calcWeightTrend, GAIN_TARGETS } from "./weight-trend";
export { calcStrengthTrend, e1rm, best1RMs } from "./strength-trend";
export { calcConfidence } from "./confidence";
export { recentAvg } from "./checkins";
export { analyzeLifts, pickNudge } from "./lifts";

export type {
  Profile,
  WeightLog,
  CalorieLog,
  Exercise,
  WorkoutLog,
  CheckIn,
  LockedRecommendation,
  EngineInput,
  Adherence,
  Frequency,
  TDEEResult,
  GainTarget,
  WeightTrend,
  StrengthTrend,
  Status,
  Confidence,
  Recommendation,
} from "./types";

export type { LiftStatus, TrainingNudge } from "./lifts";
