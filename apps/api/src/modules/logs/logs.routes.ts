import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  logWeightHandler,
  logCaloriesHandler,
  logWorkoutHandler,
  deleteLogHandler,
  historyHandler,
} from "./logs.controller.js";

const router = Router();

// ─── Schemas ───
const weightSchema = z.object({
  value: z.number().min(50).max(500),
  loggedAt: z.string().datetime().optional(),
});

const calorieSchema = z.object({
  value: z.number().int().min(0).max(10000),
  loggedAt: z.string().datetime().optional(),
});

const workoutSchema = z.object({
  loggedAt: z.string().datetime().optional(),
  exercises: z.array(z.object({
    name: z.string().min(1).max(100),
    weight: z.number().min(0).max(2000),
    reps: z.number().int().min(1).max(100),
    sets: z.number().int().min(1).max(20).default(1),
  })).min(1),
});

// ─── Routes ───
router.post("/weight", requireAuth, validate(weightSchema), logWeightHandler);
router.post("/calories", requireAuth, validate(calorieSchema), logCaloriesHandler);
router.post("/workout", requireAuth, validate(workoutSchema), logWorkoutHandler);
router.delete("/:type/:id", requireAuth, deleteLogHandler);

// ─── History ───
router.get("/history", requireAuth, historyHandler);

export default router;
