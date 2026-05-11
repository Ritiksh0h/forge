import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { signup, login, logout, me, googleAuth, forgotPassword, resetPassword } from "./auth.controller.js";

const router = Router();

const authSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const forgotSchema = z.object({
  email: z.string().email("Invalid email"),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

router.post("/signup", validate(authSchema), signup);
router.post("/login", validate(authSchema), login);
router.post("/google", googleAuth);
router.post("/forgot-password", validate(forgotSchema), forgotPassword);
router.post("/reset-password", validate(resetSchema), resetPassword);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;
