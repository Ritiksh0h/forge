import type { Request, Response, NextFunction } from "express";

// ─── Simple in-memory rate limiter (no Redis needed for MVP) ───
interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

const stores: Record<string, RateLimitStore> = {};

export function rateLimit(opts: { windowMs: number; max: number; name?: string }) {
  const storeName = opts.name || "default";
  if (!stores[storeName]) stores[storeName] = {};
  const store = stores[storeName];

  // Cleanup stale entries every 60s
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetAt < now) delete store[key];
    }
  }, 60000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.user?.userId || req.ip || "unknown";
    const now = Date.now();

    if (!store[key] || store[key].resetAt < now) {
      store[key] = { count: 1, resetAt: now + opts.windowMs };
    } else {
      store[key].count++;
    }

    const remaining = Math.max(0, opts.max - store[key].count);
    res.setHeader("X-RateLimit-Limit", opts.max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(store[key].resetAt / 1000));

    if (store[key].count > opts.max) {
      res.status(429).json({ error: "Too many requests. Try again later." });
      return;
    }

    next();
  };
}

// Pre-built limiters
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, name: "auth" });     // 20 per 15min
export const logLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, name: "log" });              // 30 per minute
export const dashboardLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, name: "dashboard" }); // 60 per minute
