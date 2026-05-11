import type { CheckIn } from "./types";

const WEEK_MS = 7 * 864e5;

export function recentAvg(checkIns: CheckIn[], type: string, now: number = Date.now()): string | number | null {
  const recent = checkIns.filter(c => c.type === type && now - c.ts < WEEK_MS);
  if (!recent.length) return null;

  if (type === "sleep" || type === "stress") {
    const vals = recent.map(c => Number(c.value)).filter(v => !isNaN(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }

  // For non-numeric types (adherence, recovery), return the most recent value
  return recent[recent.length - 1].value;
}
