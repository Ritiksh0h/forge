import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { nextCheckInHandler, addCheckInHandler } from "./checkins.controller.js";

const router = Router();

const checkInSchema = z.object({
  type: z.enum(["sleep", "stress", "adherence", "recovery"]),
  value: z.string().min(1).max(20),
});

router.get("/next", requireAuth, nextCheckInHandler);
router.post("/", requireAuth, validate(checkInSchema), addCheckInHandler);

export default router;
