import type { Request, Response } from "express";
import { getNextCheckIn, addCheckIn } from "./checkins.service.js";

export async function nextCheckInHandler(req: Request, res: Response): Promise<void> {
  const next = await getNextCheckIn(req.user!.userId);

  if (!next) {
    res.json({ checkIn: null, message: "Already checked in today" });
    return;
  }

  res.json({ checkIn: next });
}

export async function addCheckInHandler(req: Request, res: Response): Promise<void> {
  const entry = await addCheckIn(req.user!.userId, req.body.type, req.body.value);
  res.status(201).json({ entry });
}
