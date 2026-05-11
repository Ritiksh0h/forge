import type { Request, Response } from "express";
import { getProfile, createProfile, updateProfile } from "./users.service.js";

export async function getProfileHandler(req: Request, res: Response): Promise<void> {
  const profile = await getProfile(req.user!.userId);

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({ profile });
}

export async function createProfileHandler(req: Request, res: Response): Promise<void> {
  // Check if profile already exists
  const existing = await getProfile(req.user!.userId);
  if (existing) {
    res.status(409).json({ error: "Profile already exists. Use PUT to update." });
    return;
  }

  const profile = await createProfile({
    userId: req.user!.userId,
    ...req.body,
  });

  res.status(201).json({ profile });
}

export async function updateProfileHandler(req: Request, res: Response): Promise<void> {
  const updated = await updateProfile(req.user!.userId, req.body);

  if (!updated) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json({ profile: updated });
}
