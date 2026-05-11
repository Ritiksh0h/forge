import { describe, it, expect } from "vitest";
import { e1rm, best1RMs, calcStrengthTrend } from "../src/strength-trend";
import { wo } from "./helpers";

describe("e1rm", () => {
  it("returns 0 for invalid inputs", () => {
    expect(e1rm(0, 5)).toBe(0);
    expect(e1rm(100, 0)).toBe(0);
  });
  it("returns weight for 1 rep", () => {
    expect(e1rm(225, 1)).toBe(225);
  });
  it("estimates correctly", () => {
    expect(e1rm(185, 8)).toBeCloseTo(185 * (1 + 8/30));
  });
});

describe("best1RMs", () => {
  it("returns empty for no logs", () => {
    expect(Object.keys(best1RMs([])).length).toBe(0);
  });
  it("filters by min exposures", () => {
    const logs = [wo(1, [["Bench", 185, 8, 3]])];
    expect(Object.keys(best1RMs(logs, 2)).length).toBe(0);
    expect(Object.keys(best1RMs(logs, 1)).length).toBe(1);
  });
});

describe("calcStrengthTrend", () => {
  it("returns unknown with no data", () => {
    expect(calcStrengthTrend([], [])).toBe("unknown");
  });
  it("detects up (>5% change)", () => {
    const recent = [wo(3, [["Bench", 200, 6, 3]]), wo(1, [["Bench", 200, 6, 3]])];
    const prior = [wo(11, [["Bench", 185, 6, 3]]), wo(9, [["Bench", 185, 6, 3]])];
    expect(calcStrengthTrend(recent, prior)).toBe("up");
  });
  it("detects flat (<5% change)", () => {
    const recent = [wo(3, [["Bench", 190, 8, 3]]), wo(1, [["Bench", 190, 8, 3]])];
    const prior = [wo(11, [["Bench", 185, 8, 3]]), wo(9, [["Bench", 185, 8, 3]])];
    expect(calcStrengthTrend(recent, prior)).toBe("flat");
  });
});
