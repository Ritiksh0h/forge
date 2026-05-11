import { describe, it, expect } from "vitest";
import { calcWeightTrend } from "../src/weight-trend";

describe("calcWeightTrend", () => {
  it("returns unknown when no data", () => {
    expect(calcWeightTrend(null, null, "Lean Bulk").trend).toBe("unknown");
    expect(calcWeightTrend(175, null, "Lean Bulk").trend).toBe("unknown");
  });

  it("detects good gain for Lean Bulk", () => {
    // 0.2% gain
    expect(calcWeightTrend(175.35, 175, "Lean Bulk").trend).toBe("good_gain");
  });

  it("detects fast gain for Lean Bulk", () => {
    // >0.5% gain
    expect(calcWeightTrend(176, 175, "Lean Bulk").trend).toBe("fast_gain");
  });

  it("detects losing", () => {
    expect(calcWeightTrend(174, 175, "Lean Bulk").trend).toBe("losing");
  });

  it("detects flat", () => {
    expect(calcWeightTrend(175.05, 175, "Lean Bulk").trend).toBe("flat");
  });

  it("uses different thresholds for Aggressive Bulk", () => {
    // 0.5% is good_gain for AB but would be at ceiling for LB
    expect(calcWeightTrend(174.87, 174, "Aggressive Bulk").trend).toBe("good_gain");
  });

  it("uses Recomp thresholds", () => {
    // Flat weight is good_gain for recomp (within -0.1 to 0.2)
    expect(calcWeightTrend(180.1, 180, "Recomp").trend).toBe("good_gain");
    // 0.3% is fast_gain for recomp
    expect(calcWeightTrend(180.54, 180, "Recomp").trend).toBe("fast_gain");
  });
});
