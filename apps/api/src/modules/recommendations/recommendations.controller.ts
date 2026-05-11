import type { Request, Response } from "express";
import {
  getDashboard,
  lockRecommendation,
  getRecommendationHistory,
} from "./recommendations.service.js";

export async function dashboardHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await getDashboard(req.user!.userId);
    res.json(data);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Failed to generate recommendation" });
  }
}

export async function lockHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await lockRecommendation(req.user!.userId);
    res.status(201).json(result);
  } catch (err) {
    console.error("Lock error:", err);
    res.status(500).json({ error: "Failed to lock recommendation" });
  }
}

export async function historyHandler(req: Request, res: Response): Promise<void> {
  const recs = await getRecommendationHistory(req.user!.userId);
  res.json({ recommendations: recs });
}
