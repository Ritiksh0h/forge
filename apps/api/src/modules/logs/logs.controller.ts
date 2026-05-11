import type { Request, Response } from "express";
import {
  logWeight,
  logCalories,
  logWorkout,
  deleteWeightLog,
  deleteCalorieLog,
  deleteWorkoutLog,
  getHistory,
} from "./logs.service.js";

export async function logWeightHandler(req: Request, res: Response): Promise<void> {
  const entry = await logWeight(req.user!.userId, req.body.value, req.body.loggedAt);
  res.status(201).json({ entry });
}

export async function logCaloriesHandler(req: Request, res: Response): Promise<void> {
  const entry = await logCalories(req.user!.userId, req.body.value, req.body.loggedAt);
  res.status(201).json({ entry });
}

export async function logWorkoutHandler(req: Request, res: Response): Promise<void> {
  const entry = await logWorkout(req.user!.userId, req.body.exercises, req.body.loggedAt);
  res.status(201).json({ entry });
}

export async function deleteLogHandler(req: Request, res: Response): Promise<void> {
  const { type, id } = req.params;
  let deleted = null;

  switch (type) {
    case "weight":
      deleted = await deleteWeightLog(req.user!.userId, id);
      break;
    case "calories":
      deleted = await deleteCalorieLog(req.user!.userId, id);
      break;
    case "workout":
      deleted = await deleteWorkoutLog(req.user!.userId, id);
      break;
    default:
      res.status(400).json({ error: "Invalid type. Use: weight, calories, workout" });
      return;
  }

  if (!deleted) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json({ deleted });
}

export async function historyHandler(req: Request, res: Response): Promise<void> {
  const type = (req.query.type as string) || "all";
  const limit = Math.min(Number(req.query.limit) || 60, 200);
  const before = req.query.before as string | undefined;

  if (!["all", "weight", "calories", "workout"].includes(type)) {
    res.status(400).json({ error: "Invalid type. Use: all, weight, calories, workout" });
    return;
  }

  const entries = await getHistory(req.user!.userId, type as any, limit, before);
  res.json({ entries, count: entries.length });
}
