import { describe, it, expect } from "vitest";
import { recommend, weekKey } from "../src/recommend";
import { prof, wL, cL, wo, ci, stdW, stdC, stdWo, makeInput, TEST_NOW } from "./helpers";

// ═══════════════════════════════════════════════════
// A. DATA GATES (1-8)
// ═══════════════════════════════════════════════════
describe("A. Data Gates", () => {
  it("1: Zero data", () => {
    const r = recommend(makeInput({ profile: prof("Lean Bulk") }), TEST_NOW);
    expect(r.status).toBe("collecting");
    expect(r.isCalibrating).toBe(true);
  });

  it("2: 1 weigh-in only", () => {
    const r = recommend(makeInput({ profile: prof("Lean Bulk"), wl: wL([175], 1) }), TEST_NOW);
    expect(r.status).toBe("collecting");
    expect(r.confidence).toBe("low");
  });

  it("3: 2 weigh-ins (below threshold)", () => {
    const r = recommend(makeInput({ profile: prof("Lean Bulk"), wl: wL([175, 175.5], 2), cl: cL([2500, 2500], 2) }), TEST_NOW);
    expect(r.status).toBe("collecting");
  });

  it("4: 3 weigh-ins, no prior week", () => {
    const r = recommend(makeInput({ profile: prof("Lean Bulk"), wl: wL([175, 175.5, 176], 3), cl: cL([2500, 2500, 2500], 3) }), TEST_NOW);
    expect(r.status).toBe("collecting");
    expect(r.isCalibrating).toBe(true);
  });

  it("5: TDEE cold-start with profile", () => {
    const r = recommend(makeInput({ profile: prof("Lean Bulk", { g: "male", age: 25, h: 70, w: 175, act: "4x/week" }) }), TEST_NOW);
    expect(r.status).toBe("collecting");
    expect(r.calorieAction.toLowerCase()).toContain("start at");
  });

  it("6: TDEE cold-start, no profile stats", () => {
    const r = recommend(makeInput({ profile: { goal: "Lean Bulk" } }), TEST_NOW);
    expect(r.status).toBe("collecting");
    expect(r.calorieAction.toLowerCase()).toContain("logging");
  });

  it("7: Enough current, barely enough prior", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: [...wL([174, 174.5], 10), ...wL([175, 175.5, 176], 3)],
      cl: [...cL([2500, 2500], 10), ...cL([2500, 2500, 2500, 2500], 4)],
    }), TEST_NOW);
    expect(r.status).not.toBe("collecting");
  });

  it("8: Locked recommendation returned", () => {
    const wk = weekKey(TEST_NOW);
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: wL([175, 175, 175, 175], 4),
      cl: cL([2500, 2500, 2500, 2500], 4),
      lockedRec: { week: wk, result: { status: "on_track", calorieAction: "LOCKED VALUE" } as any, locked: true },
    }), TEST_NOW);
    expect(r.calorieAction).toBe("LOCKED VALUE");
  });
});

// ═══════════════════════════════════════════════════
// B. LEAN BULK (9-18)
// ═══════════════════════════════════════════════════
describe("B. Lean Bulk", () => {
  it("9: On track + strength up", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([174, 174.2, 174.1, 174.3, 174.5], [174.8, 175, 175.2, 175, 175.1]),
      cl: stdC([2500, 2500, 2600, 2500, 2500], [2500, 2600, 2500, 2500, 2500]),
      wol: stdWo([["Bench", 185, 6, 3]], [["Bench", 200, 6, 3]]),
    }), TEST_NOW);
    expect(r.status).toBe("on_track");
    expect(r.weightTrend).toBe("good_gain");
    expect(r.strengthTrend).toBe("up");
    expect(r.confidence).toBe("high");
  });

  it("10: On track + strength flat", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([174, 174.2, 174.1, 174.3, 174.5], [174.8, 175, 175.1, 175, 175.2]),
      cl: stdC([2500, 2500, 2500, 2500, 2500], [2500, 2500, 2500, 2500, 2500]),
      wol: stdWo([["Bench", 185, 8, 3]], [["Bench", 187, 8, 3]]),
    }), TEST_NOW);
    expect(r.status).toBe("on_track");
    expect(r.strengthTrend).toBe("flat");
  });

  it("11: On track + strength unknown", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([174, 174.2, 174.1, 174.3, 174.5], [174.8, 175, 175.1, 175, 175.2]),
      cl: stdC([2500, 2500, 2500, 2500, 2500], [2500, 2500, 2500, 2500, 2500]),
    }), TEST_NOW);
    expect(r.status).toBe("on_track");
    expect(r.strengthTrend).toBe("unknown");
  });

  it("12: Stalled (flat weight)", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([175, 175.1, 175, 174.9, 175], [175, 175.1, 175, 175, 175.1]),
      cl: stdC([2400, 2400, 2500, 2400, 2400], [2400, 2500, 2400, 2400, 2400]),
      wol: stdWo([["Bench", 185, 8, 3]], [["Bench", 185, 8, 3]]),
    }), TEST_NOW);
    expect(r.status).toBe("off_track");
    expect(r.weightTrend).toBe("flat");
    expect(r.calorieAction.toLowerCase()).toContain("add 200");
  });

  it("13: Losing weight", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([176, 175.8, 175.5, 175.5, 175.3], [175, 174.8, 174.5, 174.5, 174.3]),
      cl: stdC([2200, 2300, 2200, 2200, 2300], [2200, 2200, 2300, 2200, 2200]),
      wol: stdWo([["Squat", 225, 6, 3]], [["Squat", 225, 6, 3]]),
    }), TEST_NOW);
    expect(r.status).toBe("off_track");
    expect(r.weightTrend).toBe("losing");
    expect(r.calorieAction.toLowerCase()).toContain("add 300");
  });

  it("14: Losing + strength down = deload", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([176, 175.8, 175.5, 175.3], [174.8, 174.5, 174.3, 174.2]),
      cl: stdC([2200, 2200, 2300, 2200], [2200, 2200, 2200, 2200, 2200]),
      wol: stdWo([["Bench", 200, 8, 3]], [["Bench", 180, 8, 3]]),
    }), TEST_NOW);
    expect(r.status).toBe("off_track");
    expect(r.weightTrend).toBe("losing");
    expect(r.strengthTrend).toBe("down");
    expect(r.workoutAction.toLowerCase()).toContain("deload");
  });

  it("15: Gaining too fast (>0.5%)", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([174, 174.2, 174.3, 174.5, 174.5], [175.5, 175.8, 176, 176.2, 176.5]),
      cl: stdC([3000, 3000, 3100, 3000, 3000], [3000, 3100, 3000, 3000, 3000]),
      wol: stdWo([["Bench", 185, 8, 3]], [["Bench", 185, 8, 3]]),
    }), TEST_NOW);
    expect(r.status).toBe("off_track");
    expect(r.weightTrend).toBe("fast_gain");
    expect(r.calorieAction.toLowerCase()).toContain("cut 200");
  });

  it("16: Good gain + strength down", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([174, 174.2, 174.1, 174.3, 174.5], [174.8, 175, 175.2, 175, 175.1]),
      cl: stdC([2600, 2600, 2600, 2600, 2600], [2600, 2600, 2600, 2600, 2600]),
      wol: stdWo([["Bench", 200, 8, 3]], [["Bench", 180, 8, 3]]),
    }), TEST_NOW);
    expect(r.strengthTrend).toBe("down");
  });

  it("17: Barely in range (0.15%)", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([175, 175, 175, 175, 175], [175.3, 175.3, 175.3, 175.3, 175.3]),
      cl: stdC([2500, 2500, 2500, 2500, 2500], [2500, 2500, 2500, 2500, 2500]),
    }), TEST_NOW);
    expect(r.status).toBe("on_track");
    expect(r.weightTrend).toBe("good_gain");
  });

  it("18: Right at 0.5% ceiling", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([174, 174, 174, 174, 174], [174.86, 174.86, 174.86, 174.86, 174.86]),
      cl: stdC([2700, 2700, 2700, 2700, 2700], [2700, 2700, 2700, 2700, 2700]),
    }), TEST_NOW);
    expect(r.weightTrend).toBe("good_gain");
  });
});

// ═══════════════════════════════════════════════════
// C. AGGRESSIVE BULK (19-26)
// ═══════════════════════════════════════════════════
describe("C. Aggressive Bulk", () => {
  it("19: On track at 0.5%/wk", () => {
    const r = recommend(makeInput({
      profile: prof("Aggressive Bulk"),
      wl: stdW([174, 174, 174, 174, 174], [174.87, 174.87, 174.87, 174.87, 174.87]),
      cl: stdC([2800, 2800, 2800, 2800, 2800], [2800, 2800, 2800, 2800, 2800]),
    }), TEST_NOW);
    expect(r.status).toBe("on_track");
    expect(r.weightTrend).toBe("good_gain");
  });

  it("20: Still on track at 0.7%/wk", () => {
    const r = recommend(makeInput({
      profile: prof("Aggressive Bulk"),
      wl: stdW([174, 174, 174, 174, 174], [175.22, 175.22, 175.22, 175.22, 175.22]),
      cl: stdC([3000, 3000, 3000, 3000, 3000], [3000, 3000, 3000, 3000, 3000]),
    }), TEST_NOW);
    expect(r.status).toBe("on_track");
    expect(r.weightTrend).toBe("good_gain");
  });

  it("21: Too fast at 1%/wk", () => {
    const r = recommend(makeInput({
      profile: prof("Aggressive Bulk"),
      wl: stdW([174, 174, 174, 174, 174], [175.74, 175.74, 175.74, 175.74, 175.74]),
      cl: stdC([3200, 3200, 3200, 3200, 3200], [3200, 3200, 3200, 3200, 3200]),
    }), TEST_NOW);
    expect(r.status).toBe("off_track");
    expect(r.weightTrend).toBe("fast_gain");
  });

  it("22: Stalled (below 0.3% min)", () => {
    const r = recommend(makeInput({
      profile: prof("Aggressive Bulk"),
      wl: stdW([175, 175, 175, 175, 175], [175.26, 175.26, 175.26, 175.26, 175.26]),
      cl: stdC([2500, 2500, 2500, 2500, 2500], [2500, 2500, 2500, 2500, 2500]),
    }), TEST_NOW);
    expect(r.weightTrend).toBe("flat");
  });

  it("23: Losing weight", () => {
    const r = recommend(makeInput({
      profile: prof("Aggressive Bulk"),
      wl: stdW([176, 176, 176, 176, 176], [175, 175, 175, 175, 175]),
      cl: stdC([2400, 2400, 2400, 2400, 2400], [2400, 2400, 2400, 2400, 2400]),
    }), TEST_NOW);
    expect(r.status).toBe("off_track");
    expect(r.weightTrend).toBe("losing");
    expect(r.calorieAction.toLowerCase()).toContain("add 300");
  });

  it("24: On track + strength up", () => {
    const r = recommend(makeInput({
      profile: prof("Aggressive Bulk"),
      wl: stdW([174, 174, 174, 174, 174], [175, 175, 175, 175, 175]),
      cl: stdC([2900, 2900, 2900, 2900, 2900], [2900, 2900, 2900, 2900, 2900]),
      wol: stdWo([["Squat", 200, 6, 3]], [["Squat", 225, 6, 3]]),
    }), TEST_NOW);
    expect(r.status).toBe("on_track");
    expect(r.strengthTrend).toBe("up");
  });

  it("25: Right at min (0.3%)", () => {
    const r = recommend(makeInput({
      profile: prof("Aggressive Bulk"),
      wl: stdW([175, 175, 175, 175, 175], [175.53, 175.53, 175.53, 175.53, 175.53]),
      cl: stdC([2800, 2800, 2800, 2800, 2800], [2800, 2800, 2800, 2800, 2800]),
    }), TEST_NOW);
    expect(r.weightTrend).toBe("good_gain");
  });

  it("26: Right at max (0.8%)", () => {
    const r = recommend(makeInput({
      profile: prof("Aggressive Bulk"),
      wl: stdW([175, 175, 175, 175, 175], [176.39, 176.39, 176.39, 176.39, 176.39]),
      cl: stdC([3100, 3100, 3100, 3100, 3100], [3100, 3100, 3100, 3100, 3100]),
    }), TEST_NOW);
    expect(r.weightTrend).toBe("good_gain");
  });
});

// ═══════════════════════════════════════════════════
// D. RECOMP (27-34)
// ═══════════════════════════════════════════════════
describe("D. Recomp", () => {
  it("27: Flat weight = on track", () => {
    const r = recommend(makeInput({
      profile: prof("Recomp"),
      wl: stdW([180, 180.1, 179.9, 180, 180.1], [180, 180.1, 180.2, 180, 180.1]),
      cl: stdC([2400, 2400, 2400, 2400, 2400], [2400, 2400, 2400, 2400, 2400]),
    }), TEST_NOW);
    expect(r.status).toBe("on_track");
    expect(r.weightTrend).toBe("good_gain");
  });

  it("28: Slight gain 0.15% = on track", () => {
    const r = recommend(makeInput({
      profile: prof("Recomp"),
      wl: stdW([180, 180, 180, 180, 180], [180.27, 180.27, 180.27, 180.27, 180.27]),
      cl: stdC([2400, 2400, 2400, 2400, 2400], [2400, 2400, 2400, 2400, 2400]),
    }), TEST_NOW);
    expect(r.status).toBe("on_track");
  });

  it("29: Gaining 0.3% = too fast for recomp", () => {
    const r = recommend(makeInput({
      profile: prof("Recomp"),
      wl: stdW([180, 180, 180, 180, 180], [180.54, 180.54, 180.54, 180.54, 180.54]),
      cl: stdC([2600, 2600, 2600, 2600, 2600], [2600, 2600, 2600, 2600, 2600]),
    }), TEST_NOW);
    expect(r.status).toBe("off_track");
    expect(r.weightTrend).toBe("fast_gain");
  });

  it("30: Losing 0.3% = losing", () => {
    const r = recommend(makeInput({
      profile: prof("Recomp"),
      wl: stdW([180, 180, 180, 180, 180], [179.46, 179.46, 179.46, 179.46, 179.46]),
      cl: stdC([2200, 2200, 2200, 2200, 2200], [2200, 2200, 2200, 2200, 2200]),
    }), TEST_NOW);
    expect(r.status).toBe("off_track");
    expect(r.weightTrend).toBe("losing");
  });

  it("31: Slight loss -0.05% = on track", () => {
    const r = recommend(makeInput({
      profile: prof("Recomp"),
      wl: stdW([180, 180, 180, 180, 180], [179.91, 179.91, 179.91, 179.91, 179.91]),
      cl: stdC([2400, 2400, 2400, 2400, 2400], [2400, 2400, 2400, 2400, 2400]),
    }), TEST_NOW);
    expect(r.status).toBe("on_track");
  });

  it("32: Recomp + strength up = perfect", () => {
    const r = recommend(makeInput({
      profile: prof("Recomp"),
      wl: stdW([180, 180, 180, 180, 180], [180.1, 180.1, 180.1, 180.1, 180.1]),
      cl: stdC([2400, 2400, 2400, 2400, 2400], [2400, 2400, 2400, 2400, 2400]),
      wol: stdWo([["Bench", 185, 8, 3]], [["Bench", 200, 8, 3]]),
    }), TEST_NOW);
    expect(r.status).toBe("on_track");
    expect(r.strengthTrend).toBe("up");
  });

  it("33: Cut 200 when gaining fast", () => {
    const r = recommend(makeInput({
      profile: prof("Recomp"),
      wl: stdW([180, 180, 180, 180, 180], [180.54, 180.54, 180.54, 180.54, 180.54]),
      cl: stdC([2700, 2700, 2700, 2700, 2700], [2700, 2700, 2700, 2700, 2700]),
    }), TEST_NOW);
    expect(r.calorieAction.toLowerCase()).toContain("cut 200");
  });

  it("34: Add 300 when losing", () => {
    const r = recommend(makeInput({
      profile: prof("Recomp"),
      wl: stdW([180, 180, 180, 180, 180], [179.46, 179.46, 179.46, 179.46, 179.46]),
      cl: stdC([2100, 2100, 2100, 2100, 2100], [2100, 2100, 2100, 2100, 2100]),
    }), TEST_NOW);
    expect(r.calorieAction.toLowerCase()).toContain("add 300");
  });
});

// ═══════════════════════════════════════════════════
// E. ADHERENCE (35-39)
// ═══════════════════════════════════════════════════
describe("E. Adherence", () => {
  it("35: 3/7 days logged = low adherence gate", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: [...wL([174, 174.5], 10), ...wL([175, 175.5, 176], 2)],
      cl: cL([2500, 2500, 2500], 2),
      wol: [wo(1, [["Bench", 185, 8, 3]])],
    }), TEST_NOW);
    expect(r.status).toBe("off_track");
    expect(r.statusLabel.toLowerCase()).toContain("adherence");
  });

  it("36: 4/7 days = above gate (57%)", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: [...wL([174, 174.5, 174.3], 10), ...wL([175, 175.5, 176, 175.8], 4)],
      cl: cL([2500, 2500, 2500, 2500], 4),
      wol: [wo(3, [["Bench", 185, 8, 3]]), wo(1, [["Bench", 185, 8, 3]])],
    }), TEST_NOW);
    expect(r.status).not.toBe("collecting");
  });

  it("37: Weight-only logging (no cals)", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: [...wL([174, 174.5, 174.3], 10), ...wL([175, 175.2, 175.3, 175.1, 175.2, 175.4, 175.3], 7)],
      cl: [...cL([2500, 2500, 2500], 10)],
    }), TEST_NOW);
    expect(r.confidence).toBe("low");
    expect(r.confidenceReason.toLowerCase()).toContain("calorie");
  });

  it("38: All types logged 7/7", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: [...wL([174, 174.2, 174.3], 10), ...wL([175, 175.1, 175.2, 175.3, 175.2, 175.3, 175.4], 7)],
      cl: [...cL([2500, 2500, 2500], 10), ...cL([2500, 2500, 2500, 2500, 2500, 2500, 2500], 7)],
      wol: [wo(6, [["Bench", 185, 8, 3]]), wo(4, [["Bench", 185, 8, 3]]), wo(2, [["Bench", 185, 8, 3]])],
    }), TEST_NOW);
    expect(r.confidence).toBe("high");
  });

  it("39: Adherence exactly 50% (borderline)", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: [...wL([174, 174.5, 174.3], 10), ...wL([175, 175.5, 176, 175.8], 4)],
      cl: cL([2500, 2500, 2500, 2500], 4),
    }), TEST_NOW);
    expect(r.status).not.toBe("collecting");
  });
});

// ═══════════════════════════════════════════════════
// F. CONFIDENCE (40-43)
// ═══════════════════════════════════════════════════
describe("F. Confidence", () => {
  it("40: 3 calorie logs = low confidence", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: [...wL([174, 174.5, 174.3], 10), ...wL([175, 175.5, 176, 175.8, 176], 5)],
      cl: [...cL([2500, 2500, 2500], 10), ...cL([2500, 2500, 2500], 3)],
    }), TEST_NOW);
    expect(r.confidence).toBe("low");
  });

  it("41: Check-in missed targets = downgrade", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: [...wL([174, 174.2, 174.3], 10), ...wL([175, 175.1, 175.2, 175.3, 175.4], 5)],
      cl: [...cL([2500, 2500, 2500], 10), ...cL([2500, 2500, 2500, 2500, 2500], 5)],
      ci: [ci("adherence", "no", 1)],
    }), TEST_NOW);
    expect(r.confidence).toBe("medium");
    expect(r.confidenceReason.toLowerCase()).toContain("missed");
  });

  it("42: Missed targets, already medium = low", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: [...wL([174, 174.5, 174.3], 10), ...wL([175, 175.5, 176, 175.8], 4)],
      cl: [...cL([2500, 2500, 2500], 10), ...cL([2500, 2500, 2500, 2500], 4)],
      ci: [ci("adherence", "no", 1)],
    }), TEST_NOW);
    expect(r.confidence).toBe("low");
  });

  it("43: Yes adherence = no downgrade", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: [...wL([174, 174.2, 174.3], 10), ...wL([175, 175.1, 175.2, 175.3, 175.4], 5)],
      cl: [...cL([2500, 2500, 2500], 10), ...cL([2500, 2500, 2500, 2500, 2500], 5)],
      ci: [ci("adherence", "yes", 1)],
    }), TEST_NOW);
    expect(r.confidence).toBe("high");
  });
});

// ═══════════════════════════════════════════════════
// G. STRENGTH EDGE CASES (44-47)
// ═══════════════════════════════════════════════════
describe("G. Strength Edge Cases", () => {
  it("44: Real strength gain (>5% 1RM)", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([180, 180, 180, 180, 180], [180.3, 180.3, 180.3, 180.3, 180.3]),
      cl: stdC([2600, 2600, 2600, 2600, 2600], [2600, 2600, 2600, 2600, 2600]),
      wol: stdWo([["Bench", 185, 6, 3]], [["Bench", 200, 6, 3]]),
    }), TEST_NOW);
    expect(r.strengthTrend).toBe("up");
  });

  it("45: Noise filtered (2.7% change)", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([180, 180, 180, 180, 180], [180.3, 180.3, 180.3, 180.3, 180.3]),
      cl: stdC([2600, 2600, 2600, 2600, 2600], [2600, 2600, 2600, 2600, 2600]),
      wol: stdWo([["Bench", 185, 8, 3]], [["Bench", 190, 8, 3]]),
    }), TEST_NOW);
    expect(r.strengthTrend).toBe("flat");
  });

  it("46: Single exposure = ignored", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([180, 180, 180, 180, 180], [180.3, 180.3, 180.3, 180.3, 180.3]),
      cl: stdC([2600, 2600, 2600, 2600, 2600], [2600, 2600, 2600, 2600, 2600]),
      wol: [wo(10, [["Bench", 185, 8, 3]]), wo(8, [["Bench", 185, 8, 3]]), wo(2, [["Bench", 225, 8, 3]])],
    }), TEST_NOW);
    expect(r.strengthTrend).toBe("unknown");
  });

  it("47: Multi-lift: 1 up, 1 flat = up", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk"),
      wl: stdW([180, 180, 180, 180, 180], [180.3, 180.3, 180.3, 180.3, 180.3]),
      cl: stdC([2600, 2600, 2600, 2600, 2600], [2600, 2600, 2600, 2600, 2600]),
      wol: [
        wo(11, [["Bench", 185, 6, 3], ["Squat", 225, 6, 3]]),
        wo(9, [["Bench", 185, 6, 3], ["Squat", 225, 6, 3]]),
        wo(3, [["Bench", 200, 6, 3], ["Squat", 228, 6, 3]]),
        wo(1, [["Bench", 200, 6, 3], ["Squat", 228, 6, 3]]),
      ],
    }), TEST_NOW);
    expect(r.strengthTrend).toBe("up");
  });
});

// ═══════════════════════════════════════════════════
// H. TDEE (48-50)
// ═══════════════════════════════════════════════════
describe("H. TDEE", () => {
  it("48: Male 25yo 5-10 175lbs 4x/wk LB", () => {
    const r = recommend(makeInput({
      profile: prof("Lean Bulk", { g: "male", age: 25, h: 70, w: 175, act: "4x/week" }),
    }), TEST_NOW);
    expect(r.status).toBe("collecting");
    expect(r.tdee).not.toBeNull();
    expect(r.tdee!.bmr).toBeGreaterThan(1700);
    expect(r.tdee!.bmr).toBeLessThan(1850);
    expect(r.tdee!.surplus).toBe(250);
  });

  it("49: Female 30yo 5-4 140lbs 3x/wk RC", () => {
    const r = recommend(makeInput({
      profile: prof("Recomp", { g: "female", age: 30, h: 64, w: 140, act: "3x/week" }),
    }), TEST_NOW);
    expect(r.status).toBe("collecting");
    expect(r.tdee).not.toBeNull();
    expect(r.tdee!.bmr).toBeGreaterThan(1250);
    expect(r.tdee!.bmr).toBeLessThan(1400);
    expect(r.tdee!.surplus).toBe(0);
  });

  it("50: Male 22yo 6-2 200lbs 6x/wk AB", () => {
    const r = recommend(makeInput({
      profile: prof("Aggressive Bulk", { g: "male", age: 22, h: 74, w: 200, act: "6x/week" }),
    }), TEST_NOW);
    expect(r.status).toBe("collecting");
    expect(r.tdee).not.toBeNull();
    expect(r.tdee!.bmr).toBeGreaterThan(1900);
    expect(r.tdee!.bmr).toBeLessThan(2100);
    expect(r.tdee!.surplus).toBe(450);
    expect(r.tdee!.target).toBeGreaterThan(3500);
  });
});
