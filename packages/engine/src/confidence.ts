import type { Confidence, Adherence } from "./types";

// ─── Named constants ───
const MIN_WEIGH_INS_FOR_MEDIUM = 3;
const MIN_WEIGH_INS_FOR_HIGH = 5;
const MIN_PRIOR_FOR_HIGH = 3;
const MIN_CALORIE_LOGS_FOR_MEDIUM = 4;
const MIN_CALORIE_LOGS_FOR_HIGH = 5;

export function calcConfidence(
  recentWeighIns: number,
  priorWeighIns: number,
  calorieLogCount: number,
  lastAdherence: string | number | null
): { confidence: Confidence; reason: string } {
  let confidence: Confidence = "low";
  let reason = "";

  if (recentWeighIns < MIN_WEIGH_INS_FOR_MEDIUM || priorWeighIns === 0) {
    confidence = "low";
    reason = recentWeighIns + " weigh-in(s).";
  } else if (calorieLogCount < MIN_CALORIE_LOGS_FOR_MEDIUM) {
    confidence = "low";
    reason = "Only " + calorieLogCount + " calorie log(s).";
  } else if (
    recentWeighIns >= MIN_WEIGH_INS_FOR_HIGH &&
    priorWeighIns >= MIN_PRIOR_FOR_HIGH &&
    calorieLogCount >= MIN_CALORIE_LOGS_FOR_HIGH
  ) {
    confidence = "high";
    reason = "Strong signal.";
  } else {
    confidence = "medium";
    reason = "Moderate data.";
  }

  // Downgrade if user self-reported missing targets
  if (lastAdherence === "no" && confidence !== "low") {
    confidence = confidence === "high" ? "medium" : "low";
    reason += " Missed targets.";
  }

  return { confidence, reason };
}
