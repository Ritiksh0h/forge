import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  getProfileHandler,
  createProfileHandler,
  updateProfileHandler,
} from "./users.controller.js";

const router = Router();

const GOALS = ["Lean Bulk", "Aggressive Bulk", "Recomp"] as const;
const GENDERS = ["male", "female"] as const;
const ACTIVITIES = ["3x/week", "4x/week", "5x/week", "6x/week"] as const;

const createProfileSchema = z.object({
  name: z.string().optional(),
  goal: z.enum(GOALS),
  experience: z.string().optional(),
  gender: z.enum(GENDERS).optional(),
  age: z.number().int().min(13).max(100).optional(),
  height: z.number().min(36).max(96).optional(),   // inches
  weight: z.number().min(50).max(500).optional(),    // lbs
  activity: z.enum(ACTIVITIES).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().optional(),
  goal: z.enum(GOALS).optional(),
  experience: z.string().optional(),
  gender: z.enum(GENDERS).optional(),
  age: z.number().int().min(13).max(100).optional(),
  height: z.number().min(36).max(96).optional(),
  weight: z.number().min(50).max(500).optional(),
  activity: z.enum(ACTIVITIES).optional(),
}).partial();

router.get("/", requireAuth, getProfileHandler);
router.post("/", requireAuth, validate(createProfileSchema), createProfileHandler);
router.put("/", requireAuth, validate(updateProfileSchema), updateProfileHandler);

export default router;
