import { describe, it, expect } from "vitest";
import { calcTDEE } from "../src/tdee";

describe("calcTDEE", () => {
  it("returns null for incomplete profile", () => {
    expect(calcTDEE(null)).toBeNull();
    expect(calcTDEE({ goal: "Lean Bulk" })).toBeNull();
    expect(calcTDEE({ goal: "Lean Bulk", height: 70, age: 25, gender: "male" })).toBeNull();
  });

  it("calculates correctly for male", () => {
    const r = calcTDEE({ goal: "Lean Bulk", gender: "male", age: 25, height: 70, weight: 175, activity: "4x/week" });
    expect(r).not.toBeNull();
    expect(r!.bmr).toBeGreaterThan(1700);
    expect(r!.bmr).toBeLessThan(1850);
    expect(r!.surplus).toBe(250);
    expect(r!.target).toBe(r!.maintenance + 250);
  });

  it("calculates correctly for female", () => {
    const r = calcTDEE({ goal: "Recomp", gender: "female", age: 30, height: 64, weight: 140, activity: "3x/week" });
    expect(r).not.toBeNull();
    expect(r!.surplus).toBe(0);
    expect(r!.target).toBe(r!.maintenance);
  });

  it("uses correct surplus per goal", () => {
    const base = { gender: "male", age: 25, height: 70, weight: 175, activity: "4x/week" };
    expect(calcTDEE({ ...base, goal: "Lean Bulk" })!.surplus).toBe(250);
    expect(calcTDEE({ ...base, goal: "Aggressive Bulk" })!.surplus).toBe(450);
    expect(calcTDEE({ ...base, goal: "Recomp" })!.surplus).toBe(0);
  });

  it("defaults multiplier for unknown activity", () => {
    const r = calcTDEE({ goal: "Lean Bulk", gender: "male", age: 25, height: 70, weight: 175, activity: "unknown" });
    expect(r).not.toBeNull();
  });
});
