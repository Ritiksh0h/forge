import type { Profile, TDEEResult } from "./types";

// ─── Named constants (no magic numbers) ───
const LBS_TO_KG = 0.453592;
const IN_TO_CM = 2.54;
const MALE_BMR_OFFSET = 5;
const FEMALE_BMR_OFFSET = -161;

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  "3x/week": 1.375,
  "4x/week": 1.465,
  "5x/week": 1.55,
  "6x/week": 1.635,
};
const DEFAULT_MULTIPLIER = 1.465;

const GOAL_SURPLUSES: Record<string, number> = {
  "Lean Bulk": 250,
  "Aggressive Bulk": 450,
  "Recomp": 0,
};
const DEFAULT_SURPLUS = 250;

export function calcTDEE(profile: Profile | null): TDEEResult | null {
  if (!profile?.height || !profile?.age || !profile?.gender || !profile?.weight) return null;

  const kg = profile.weight * LBS_TO_KG;
  const cm = profile.height * IN_TO_CM;
  const bmr = 10 * kg + 6.25 * cm - 5 * profile.age + (profile.gender === "male" ? MALE_BMR_OFFSET : FEMALE_BMR_OFFSET);
  const mult = ACTIVITY_MULTIPLIERS[profile.activity || ""] || DEFAULT_MULTIPLIER;
  const maintenance = Math.round(bmr * mult);
  const surplus = GOAL_SURPLUSES[profile.goal] ?? DEFAULT_SURPLUS;

  return { bmr: Math.round(bmr), maintenance, target: maintenance + surplus, surplus };
}
